import { MarketPredictionItem } from "@/components/MarketPredictionItem";

const marketPredictions = [
  {
    question: "Will AI surpass human intelligence by 2030?",
    endTime: "Ends in 2d 5h 30m",
    yesShares: 75,
    noShares: 25,
    resolved: false,
  },
  {
    question: "Will SpaceX land humans on Mars by 2026?",
    endTime: "Ends in 1d 12h 45m",
    yesShares: 40,
    noShares: 60,
    resolved: false,
  },
  {
    question: "Will the global average temperature rise by 2°C by 2050?",
    endTime: "Ends in 3d 8h 15m",
    yesShares: 80,
    noShares: 20,
    resolved: false,
  },
  {
    question: "Will a quantum computer achieve quantum supremacy by 2025?",
    endTime: "Ended 2 days ago",
    yesShares: 65,
    noShares: 35,
    resolved: true,
  },
  {
    question: "Will renewable energy surpass fossil fuels by 2040?",
    endTime: "Ends in 5d 3h 20m",
    yesShares: 70,
    noShares: 30,
    resolved: false,
  },
  {
    question: "Will a cure for Alzheimer's be discovered by 2035?",
    endTime: "Ends in 4d 18h 10m",
    yesShares: 55,
    noShares: 45,
    resolved: false,
  },
  {
    question: "Will self-driving cars become mainstream by 2028?",
    endTime: "Ended 1 week ago",
    yesShares: 30,
    noShares: 70,
    resolved: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-800">
          AI-Generated Market Predictions
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketPredictions.map((market, index) => (
            <MarketPredictionItem key={index} {...market} />
          ))}
        </div>
      </div>
    </div>
  );
}
