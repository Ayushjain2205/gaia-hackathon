import type { NextApiRequest, NextApiResponse } from "next";
import { Wallet, Coinbase } from "@coinbase/coinbase-sdk";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const apiKeyName = process.env.CDP_API_KEY_NAME!;
    const privateKey = process.env
      .CDP_API_KEY_PRIVATE_KEY!.replace(/\\n/g, "\n")
      .trim();

    // Configure SDK
    Coinbase.configure({ apiKeyName, privateKey });

    // Create basic wallet
    let wallet = await Wallet.create();
    let address = await wallet.getDefaultAddress();

    // Export wallet data for storage
    const exportedData = wallet.export();

    return res.status(200).json({
      success: true,
      walletData: {
        id: wallet.getId(),
        address: address.toString(),
        networkId: "base-sepolia",
        exportedData: exportedData,
      },
    });
  } catch (error: any) {
    console.error("Raw error:", error);
    return res.status(500).json({
      success: false,
      error: "Wallet creation failed",
    });
  }
}
