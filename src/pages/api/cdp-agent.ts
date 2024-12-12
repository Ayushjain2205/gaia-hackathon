import type { NextApiRequest, NextApiResponse } from "next";
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpToolkit } from "@coinbase/cdp-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

let agent: any = null;
let config: any = null;

async function initializeAgent() {
  if (agent) return { agent, config };

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
  });

  const agentkit = await CdpAgentkit.configureWithWallet({
    networkId: process.env.NETWORK_ID || "base-sepolia",
  });

  const cdpToolkit = new CdpToolkit(agentkit);
  const tools = cdpToolkit.getTools();

  const memory = new MemorySaver();
  config = {
    configurable: { thread_id: "CDP AgentKit Chatbot Example!" },
  };

  agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
    messageModifier: `Your agent prompt here...`,
  });

  return { agent, config };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

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
    res.status(500).json({ message: "Internal server error" });
  }
}
