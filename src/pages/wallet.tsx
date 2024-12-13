import React, { useState } from "react";
import { Loader2, AlertCircle, Wallet as WalletIcon } from "lucide-react";

interface WalletData {
  id: string;
  address: string;
  networkId: string;
  exportedData: string;
}

const WalletCreationPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [showExportData, setShowExportData] = useState(false);

  const createWallet = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/create-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success && data.walletData) {
        setWalletData(data.walletData);
        localStorage.setItem("walletData", JSON.stringify(data.walletData));
      } else {
        throw new Error(data.error || "Failed to create wallet");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <WalletIcon className="h-6 w-6 text-blue-500" />
            <h1 className="text-xl font-semibold">
              Base Sepolia Wallet Creation
            </h1>
          </div>

          {!walletData && (
            <button
              onClick={createWallet}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Creating Wallet...
                </>
              ) : (
                "Create New Wallet"
              )}
            </button>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {walletData && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Wallet ID
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md break-all font-mono text-sm">
                  {walletData.id}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md break-all font-mono text-sm">
                  {walletData.address}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Network
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono text-sm">
                  {walletData.networkId}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Export Data
                  </label>
                  <button
                    onClick={() => setShowExportData(!showExportData)}
                    className="text-xs text-blue-600 hover:text-blue-500"
                  >
                    {showExportData ? "Hide" : "Show"}
                  </button>
                </div>
                {showExportData && (
                  <div className="mt-1 p-3 bg-gray-50 rounded-md break-all font-mono text-xs">
                    {walletData.exportedData}
                  </div>
                )}
              </div>

              <button
                onClick={createWallet}
                className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Another Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletCreationPage;
