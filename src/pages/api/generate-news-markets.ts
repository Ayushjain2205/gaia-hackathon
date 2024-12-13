// pages/api/generate-news-markets.ts
import { NextApiRequest, NextApiResponse } from "next";

interface Story {
  title: string;
  url: string;
  score: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Fetch top stories from HackerNews
    const topStoriesResponse = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    );

    if (!topStoriesResponse.ok) {
      throw new Error("Failed to fetch top stories");
    }

    const storyIds = await topStoriesResponse.json();

    // 2. Fetch details for top 5 stories
    const topStoriesDetails = await Promise.all(
      storyIds.slice(0, 5).map(async (id: number) => {
        const storyResponse = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        );
        return storyResponse.json();
      })
    );

    // 3. Generate markets for each story
    const markets = await Promise.all(
      topStoriesDetails.map(async (story: Story) => {
        try {
          if (!story || !story.title) return null;

          const marketResponse = await fetch(
            "http://localhost:3000/api/generate-market",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                statement: story.title,
              }),
            }
          );

          if (!marketResponse.ok) {
            throw new Error("Failed to generate market");
          }

          const marketData = await marketResponse.json();

          return {
            story: {
              title: story.title,
              url: story.url,
              score: story.score,
            },
            market: marketData,
          };
        } catch (error) {
          console.error(
            `Failed to generate market for story: ${story.title}`,
            error
          );
          return null;
        }
      })
    );

    // Filter out any failed market generations
    const validMarkets = markets.filter((market) => market !== null);

    return res.status(200).json({
      markets: validMarkets,
    });
  } catch (error) {
    console.error("Error generating news markets:", error);
    return res.status(500).json({
      error: "Failed to generate news markets",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
