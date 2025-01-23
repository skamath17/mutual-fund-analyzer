"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// First, let's define our TypeScript interfaces to match the API response
interface MarketData {
  symbol: string;
  name: string;
  lastPrice: number;
  previousClose: number;
  change: string;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketTime: string; // This will come as a string after JSON serialization
}

export function Header() {
  // Our state now uses the MarketData interface
  const [marketIndexes, setMarketIndexes] = useState<MarketData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [error, setError] = useState<string>("");

  // This function handles the market data fetching
  async function fetchMarketData() {
    try {
      const response = await fetch("/api/market-live");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to fetch market data");
      }

      const data: MarketData[] = await response.json();

      // We format the numbers using the Indian numbering system
      const formattedData = data.map((index) => ({
        ...index,
        lastPrice: Number(index.lastPrice.toFixed(2)), // Round to 2 decimal places
      }));

      setMarketIndexes(formattedData);
      setLastUpdate(new Date().toLocaleTimeString("en-IN"));
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch market data"
      );
    }
  }

  useEffect(() => {
    // This function checks if the market is currently open
    function isMarketOpen() {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 100 + minutes;

      // Markets are open Monday (1) through Friday (5)
      // from 9:15 AM to 3:30 PM IST
      return day >= 1 && day <= 5 && currentTime >= 915 && currentTime <= 1530;
    }

    // Initial data fetch when component mounts
    fetchMarketData();

    // Set up the polling interval - every 5 minutes
    const intervalId = setInterval(() => {
      if (isMarketOpen()) {
        fetchMarketData();
      }
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // Cleanup function to remove the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            FundsWatch
          </Link>

          <nav className="flex gap-4">
            <Link href="/create-basket">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Fund Basket
              </button>
            </Link>
            <Link href="/compare-funds">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Compare Funds
              </button>
            </Link>
          </nav>
        </div>

        {/* Market Index Ticker with Error Handling */}
        <div className="overflow-hidden whitespace-nowrap bg-gray-100 py-2">
          {error ? (
            <div className="text-red-500 text-sm px-4">{error}</div>
          ) : (
            <div className="animate-marquee inline-block">
              {marketIndexes.map((index) => (
                <span
                  key={index.symbol}
                  className="mx-4 text-sm font-medium text-gray-800"
                >
                  {index.name}:{" "}
                  <span
                    className={`font-semibold ${
                      parseFloat(index.change) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {/* Format the number using Indian locale */}₹
                    {index.lastPrice.toLocaleString("en-IN")}{" "}
                    <span className="text-xs">
                      ({parseFloat(index.change) >= 0 ? "+" : ""}
                      {index.change}%)
                    </span>
                  </span>
                </span>
              ))}
              {lastUpdate && (
                <span className="mx-4 text-xs text-gray-500">
                  Last Updated: {lastUpdate}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
