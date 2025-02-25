"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

// Expanded TypeScript interface for market data
interface MarketData {
  symbol: string;
  name: string;
  lastPrice: number;
  previousClose: number;
  change: string;
  changePercent?: string; // Optional percent change
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  marketTime?: string;
  category?: string; // For categorizing indexes (e.g., "broad", "sectoral")
}

export function Header() {
  const [marketIndexes, setMarketIndexes] = useState<MarketData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function fetchMarketData() {
    try {
      const response = await fetch("/api/market-live");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to fetch market data");
      }

      const data: MarketData[] = await response.json();

      // Format the data and ensure all required fields
      const formattedData = data.map((index) => ({
        ...index,
        lastPrice: Number(index.lastPrice.toFixed(2)),
        changePercent: index.change, // Ensure change is available as changePercent for consistency
      }));

      setMarketIndexes(formattedData);
      setLastUpdate(new Date().toLocaleTimeString("en-IN"));
      setError("");
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch market data"
      );
    }
  }

  useEffect(() => {
    function isMarketOpen() {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 100 + minutes;

      return day >= 1 && day <= 5 && currentTime >= 915 && currentTime <= 1530;
    }

    fetchMarketData();

    const intervalId = setInterval(() => {
      if (isMarketOpen()) {
        fetchMarketData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  // Function to render market index with icon
  const renderMarketIndex = (index: MarketData) => {
    const isPositive = parseFloat(index.change) >= 0;

    return (
      <span
        key={index.symbol}
        className="mx-4 text-sm font-medium text-gray-800 flex items-center"
      >
        <span className="mr-2">{index.name}:</span>
        <span
          className={`font-semibold flex items-center ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          ₹{index.lastPrice.toLocaleString("en-IN")}
          <span className="text-xs ml-1 flex items-center">
            {isPositive ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {isPositive ? "+" : ""}
            {index.change}%
          </span>
        </span>
      </span>
    );
  };

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

        {/* Enhanced Market Index Ticker */}
        <div className="overflow-hidden whitespace-nowrap bg-gray-100 py-3 relative ticker-container">
          <div className="ticker-wrapper">
            <div className="ticker-item">
              {marketIndexes.map((index, i) => (
                <React.Fragment key={index.symbol}>
                  <span className="inline-flex items-center text-sm font-medium text-gray-800 mx-3">
                    <span>{index.name}:</span>
                    <span
                      className={`font-semibold ml-1 ${
                        parseFloat(index.change) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ₹{index.lastPrice.toLocaleString("en-IN")}
                      <span className="text-xs ml-1">
                        {parseFloat(index.change) >= 0 ? "↑" : "↓"}
                        {parseFloat(index.change) >= 0 ? "+" : ""}
                        {index.change}%
                      </span>
                    </span>
                  </span>
                </React.Fragment>
              ))}
              {lastUpdate && (
                <span className="mx-3 text-xs text-gray-500 inline-flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Last Updated: {lastUpdate}
                </span>
              )}
            </div>
            <div className="ticker-item">
              {marketIndexes.map((index, i) => (
                <React.Fragment key={`dup-${index.symbol}`}>
                  <span className="inline-flex items-center text-sm font-medium text-gray-800 mx-3">
                    <span>{index.name}:</span>
                    <span
                      className={`font-semibold ml-1 ${
                        parseFloat(index.change) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ₹{index.lastPrice.toLocaleString("en-IN")}
                      <span className="text-xs ml-1">
                        {parseFloat(index.change) >= 0 ? "↑" : "↓"}
                        {parseFloat(index.change) >= 0 ? "+" : ""}
                        {index.change}%
                      </span>
                    </span>
                  </span>
                </React.Fragment>
              ))}
              {lastUpdate && (
                <span className="mx-3 text-xs text-gray-500 inline-flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Last Updated: {lastUpdate}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
