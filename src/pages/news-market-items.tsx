// pages/news-markets.tsx
import { useState } from "react";
import { MarketPredictionItem } from "@/components/MarketPredictionItem";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Market {
  story: {
    title: string;
    url: string;
    score: number;
  };
  market: {
    question: string;
    endTime: string;
  };
}

export default function NewsMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);

  const generateMarkets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/generate-news-markets");
      if (!response.ok) throw new Error("Failed to fetch markets");
      const data = await response.json();
      setMarkets(data.markets);
    } catch (err) {
      console.error("Error generating markets:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold text-purple-900 mb-4">
          News Prediction Markets
        </h1>
        <Button
          onClick={generateMarkets}
          disabled={loading}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate 5 Markets"
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {markets.map((market, index) => (
          <MarketPredictionItem
            key={index}
            question={market.market.question}
            endTime={new Date(market.market.endTime).toLocaleDateString()}
            yesShares={Math.floor(Math.random() * 50) + 10}
            noShares={Math.floor(Math.random() * 50) + 10}
            resolved={false}
          />
        ))}
      </div>

      {!loading && markets.length === 0 && (
        <div className="text-center text-gray-600 py-12 text-lg">
          Click the button above to generate prediction markets
        </div>
      )}
    </div>
  );
}
