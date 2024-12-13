import type { NextApiRequest, NextApiResponse } from "next";
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpTool, CdpToolkit } from "@coinbase/cdp-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { ethers } from "ethers";
import { z } from "zod";

// In-memory storage for wallet data
let walletData: string | null = null;
let agent: any = null;
let config: any = null;

// Contract ABI for the prediction market
const PREDICTION_MARKET_ABI = [
  "function createMarket(string memory _question, uint256 _endTime) external",
  "function getMarketDetails(uint256 _marketId) external view returns (address creator, string memory question, uint256 endTime, bool resolved, uint256 yesShares, uint256 noShares)",
];

const CREATE_MARKET_PROMPT = `
This tool will create a new prediction market using the contract at 0xaF08b3f0d302314f6fe2B89335d309CC5874c56c.
Provide a question and duration in days for the market.
`;

// Input schema for market creation
const CreateMarketInput = z
  .object({
    question: z.string().describe("The question for the prediction market"),
    durationInDays: z
      .number()
      .min(1)
      .max(365)
      .describe("Duration of the market in days"),
  })
  .strip()
  .describe("Parameters for creating a new prediction market");

/**
 * Creates a new prediction market
 */
async function createPredictionMarket(
  wallet: any,
  args: z.infer<typeof CreateMarketInput>
): Promise<string> {
  try {
    const contract = new ethers.Contract(
      "0xaF08b3f0d302314f6fe2B89335d309CC5874c56c",
      PREDICTION_MARKET_ABI,
      wallet
    );

    // Calculate end time
    const endTime =
      Math.floor(Date.now() / 1000) + args.durationInDays * 24 * 60 * 60;

    // Create the market
    const tx = await contract.createMarket(args.question, endTime);
    const receipt = await tx.wait();

    // Look for MarketCreated event to get the market ID
    const marketCreatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === "MarketCreated";
      } catch {
        return false;
      }
    });

    let marketId = "unknown";
    if (marketCreatedEvent) {
      const parsed = contract.interface.parseLog(marketCreatedEvent);
      marketId = parsed.args.marketId.toString();
    }

    return `Successfully created prediction market with ID ${marketId}!
Question: "${args.question}"
Duration: ${args.durationInDays} days
End Time: ${new Date(endTime * 1000).toLocaleString()}
Transaction hash: ${tx.hash}`;
  } catch (error) {
    console.error("Error creating prediction market:", error);
    throw new Error(`Failed to create prediction market: ${error.message}`);
  }
}

/**
 * Initializes the agent with prediction market tools
 */
async function initializeAgent() {
  if (agent) return { agent, config };

  try {
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    // Initialize CDP AgentKit with wallet data
    const agentkit = await CdpAgentkit.configureWithWallet({
      cdpWalletData: walletData || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    });

    // Get standard tools
    const cdpToolkit = new CdpToolkit(agentkit);
    const tools = cdpToolkit.getTools();

    // Add prediction market creation tool
    const createMarketTool = new CdpTool(
      {
        name: "create_prediction_market",
        description: CREATE_MARKET_PROMPT,
        argsSchema: CreateMarketInput,
        func: createPredictionMarket,
      },
      agentkit
    );
    tools.push(createMarketTool);

    const memory = new MemorySaver();
    config = {
      configurable: { thread_id: "CDP AgentKit Chatbot Example!" },
    };

    agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are a helpful agent that can create prediction markets on the blockchain.
        
        When users want to create a prediction market:
        1. The question should be clear, specific, and have a definitive yes/no outcome
        2. Duration should be reasonable (1-365 days)
        3. Always confirm the creation and provide the market ID and transaction details
        4. Make sure questions are appropriate and not harmful
        
        If someone asks to create a market, ask them for:
        1. The specific question they want to create a market for
        2. How long the market should run (in days)

        For example:
        - "Will ETH price be above $5000 by end of 2024?"
        - "Will the next Bitcoin halving occur before May 2024?"
        
        If there are any errors, explain them clearly to the user.
      `,
    });

    // Update stored wallet data
    walletData = await agentkit.exportWallet();

    return { agent, config };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

// API route handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Return wallet info
    try {
      const { agent } = await initializeAgent();

      const stream = await agent.stream(
        {
          messages: [
            new HumanMessage("What is my wallet address and balance?"),
          ],
        },
        config
      );

      const responses = [];
      for await (const chunk of stream) {
        if ("agent" in chunk || "tools" in chunk) {
          responses.push(chunk);
        }
      }

      return res.status(200).json({ responses, hasWallet: !!walletData });
    } catch (error) {
      return res.status(500).json({ error: "Failed to get wallet info" });
    }
  }

  if (req.method === "POST") {
    try {
      const { message } = req.body;
      const { agent, config } = await initializeAgent();

      const stream = await agent.stream(
        { messages: [new HumanMessage(message)] },
        config
      );

      const responses = [];
      for await (const chunk of stream) {
        if ("agent" in chunk) {
          responses.push({
            role: "assistant",
            content: chunk.agent.messages[0].content,
          });
        } else if ("tools" in chunk) {
          responses.push({
            role: "system",
            content: chunk.tools.messages[0].content,
          });
        }
      }

      res.status(200).json({ responses });
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  res.status(405).json({ message: "Method not allowed" });
}
