// pages/api/generate-market.ts
import { NextApiRequest, NextApiResponse } from "next";

const NODE_URL = process.env.NODE_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { statement } = req.body;

    // Carefully structured prompt for LLaMA-8b
    const systemPrompt = `You are a prediction market generator. Given a statement, create a market with these rules:
1. Question must be clear and have a definitive resolution
2. End time must be when the outcome can be verified
3. Structure the response exactly like this example:
{
  "question": "Will [specific event] happen by [specific date]?",
  "endTime": "[ISO date]",
  "options": ["Yes", "No"]
}
No other text or explanation, just the JSON.`;

    const userPrompt = `Create a prediction market about: "${statement}". 
Remember:
- Make the question specific and verifiable
- Set a realistic end date
- Return only the JSON object
- Use ISO date format (YYYY-MM-DDTHH:mm:ssZ)
- Always include Yes/No options`;

    const response = await fetch(`${NODE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch from API");
    }

    const data = await response.json();

    // Parse the response content as JSON
    try {
      const marketData = JSON.parse(data.choices[0].message.content.trim());
      return res.status(200).json(marketData);
    } catch (parseError) {
      console.error("Error parsing market data:", parseError);
      return res.status(500).json({
        error: "Failed to parse market data",
        message: "The generated response was not in the expected format",
      });
    }
  } catch (error) {
    console.error("Error generating market:", error);
    return res.status(500).json({
      error: "Failed to generate market",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
