import type { NextApiRequest, NextApiResponse } from "next";
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";

type WalletResponse = {
  success: boolean;
  message: string;
  walletData?: string;
  address?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WalletResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    // Check for required environment variables
    if (!process.env.CDP_API_KEY_NAME || !process.env.CDP_API_KEY_PRIVATE_KEY) {
      throw new Error("CDP API credentials not configured");
    }

    // Initialize CDP AgentKit with wallet configuration
    const agentkit = await CdpAgentkit.configureWithWallet({
      networkId: process.env.NETWORK_ID || "base-sepolia",
    });

    // Get the wallet information

    console.log(agentkit);
    const address = await agentkit.wallet.getAddress();

    const exportedWallet = await agentkit.exportWallet();

    return res.status(200).json({
      success: true,
      message: "Wallet created successfully",
      walletData: exportedWallet,
      address: address,
    });
  } catch (error: any) {
    console.error("Detailed error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create wallet",
      error: error.apiMessage || error.message || "Unknown error occurred",
    });
  }
}
