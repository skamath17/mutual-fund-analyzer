// src/components/market/MarketOverview.tsx
import React from "react";
import { MarketTrendCard } from "./MarketTrendCard";
import { TopPerformerCard } from "./TopPerformerCard";
import { ConsistentFundCard } from "./ConsistentFundCard";

async function getMarketData() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/market-trend`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch market trend data");
  }
  return response.json();
}

async function getTopPerformer() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/top-performers`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch top performer");
  }
  return response.json();
}

async function getConsistentFund() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/consistent-funds`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch consistent fund");
  }
  return response.json();
}

export async function MarketOverview() {
  const [marketData, topPerformer, mostConsistentFund] = await Promise.all([
    getMarketData(),
    getTopPerformer(),
    getConsistentFund(),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MarketTrendCard {...marketData} />
      <TopPerformerCard
        fundName={topPerformer.fundName}
        returnPercentage={topPerformer.returns}
        period="1Y"
      />
      <ConsistentFundCard
        fundName={mostConsistentFund.fundName}
        returnPercentage={mostConsistentFund.returns}
        period="1Y"
        consistency={mostConsistentFund.consistency}
      />
    </div>
  );
}