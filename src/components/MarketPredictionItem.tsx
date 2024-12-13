import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ThumbsUp, ThumbsDown } from "lucide-react";

interface MarketPredictionItemProps {
  question: string;
  endTime: string;
  yesShares: number;
  noShares: number;
  resolved: boolean;
}

export function MarketPredictionItem({
  question,
  endTime,
  yesShares,
  noShares,
  resolved,
}: MarketPredictionItemProps) {
  const [amount, setAmount] = useState(5);

  const calculatePayout = (shares: number) => {
    const totalShares = yesShares + noShares;
    if (totalShares === 0) return amount * 2;
    const totalAfterBet = totalShares + amount;
    return (totalAfterBet * amount) / (shares + amount);
  };

  const yesPayout = calculatePayout(yesShares).toFixed(2);
  const noPayout = calculatePayout(noShares).toFixed(2);

  return (
    <Card className="w-full overflow-hidden bg-gradient-to-br from-yellow-300 to-orange-400 text-purple-900 shadow-xl rounded-2xl border-2 border-purple-600">
      <CardHeader className="bg-purple-600 text-yellow-300 p-4 rounded-t-xl">
        <CardTitle className="text-xl font-extrabold flex items-center gap-2">
          <span className="text-2xl">🎭</span> {question}
        </CardTitle>
        <CardDescription className="text-yellow-100 flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" /> {endTime}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between mb-4 bg-white rounded-xl p-3 shadow-inner">
          <div className="text-center relative w-[52px] h-[52px]">
            <div className="absolute inset-0 bg-green-200 rounded-full opacity-30"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xl font-bold text-green-700">
                {yesShares}
              </div>
              <div className="text-sm text-green-600">Yes</div>
            </div>
          </div>
          <div className="text-center relative w-[52px] h-[52px]">
            <div className="absolute inset-0 bg-red-200 rounded-full opacity-30"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xl font-bold text-red-700">{noShares}</div>
              <div className="text-sm text-red-600">No</div>
            </div>
          </div>
          <div className="text-center relative w-[52px] h-[52px] flex items-center justify-center">
            {resolved ? (
              <div className="text-sm font-bold text-purple-600 flex flex-col items-center">
                <span className="text-lg">🏁</span>
                <span>Ended</span>
              </div>
            ) : (
              <div className="text-sm font-bold text-blue-600 flex flex-col items-center">
                <span className="text-lg animate-pulse">🔵</span>
                <span>Ongoing</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-3 shadow-inner">
            <label
              htmlFor="amount"
              className="block text-lg font-bold text-purple-700 mb-3"
            >
              Bet amount:
            </label>
            <div className="relative">
              <input
                type="range"
                min="1"
                max="10"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-full appearance-none cursor-pointer"
              />
              <div
                className="absolute left-0 -top-1 flex items-center justify-center w-8 h-8 transform -translate-x-1/2 bg-yellow-400 rounded-full text-purple-900 font-bold text-sm border-2 border-purple-600 shadow-md transition-all duration-200 ease-out"
                style={{ left: `${((amount - 1) / 9) * 100}%` }}
              >
                ${amount}
              </div>
            </div>
            <div className="flex justify-between text-sm text-purple-600 mt-1 font-bold">
              <span>$1</span>
              <span>$10</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button className="w-full h-12 text-sm font-bold rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors duration-200 shadow-md">
              <ThumbsUp className="w-4 h-4 mr-1" />
              Yes (${yesPayout})
            </Button>
            <Button className="w-full h-12 text-sm font-bold rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors duration-200 shadow-md">
              <ThumbsDown className="w-4 h-4 mr-1" />
              No (${noPayout})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
