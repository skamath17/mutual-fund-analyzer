// src/components/layout/Header.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MarketIndex = {
  id: number;
  name: string;
  value: string;
  change: string;
};

export function Header() {
  const [marketIndexes, setMarketIndexes] = useState<MarketIndex[]>([]);

  useEffect(() => {
    async function fetchMarketIndexes() {
      try {
        const response = await fetch("/api/market-trend"); // Fetch market indexes from API
        const data: MarketIndex[] = await response.json();
        setMarketIndexes(data);
      } catch (error) {
        console.error("Failed to fetch market indexes:", error);
      }
    }
    fetchMarketIndexes();
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

        {/* Market Index Ticker */}
        <div className="overflow-hidden whitespace-nowrap bg-gray-100 py-2">
          <div className="animate-marquee inline-block">
            {marketIndexes.map((index) => (
              <span
                key={index.id}
                className="mx-4 text-sm font-medium text-gray-800"
              >
                {index.name}:
                <span
                  className={`font-semibold ${
                    parseFloat(index.change) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {index.value} ({parseFloat(index.change) >= 0 ? "+" : ""}
                  {index.change}%)
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
