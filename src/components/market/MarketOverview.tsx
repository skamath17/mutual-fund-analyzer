// src/components/market/MarketOverview.tsx
import React from "react";
import { MarketTrendCard } from "./MarketTrendCard";
import { TopPerformerCard } from "./TopPerformerCard";
import { ConsistentFundCard } from "./ConsistentFundCard";

import { getApiUrl } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

async function getMarketData() {
  try {
    const response = await fetch(getApiUrl("/api/market-trend"), {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error("Failed to fetch market trend data");
      return {
        data: [],
        currentValue: null,
        changePercentage: null,
      };
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching market data:", error);
    return {
      data: [],
      currentValue: null,
      changePercentage: null,
    };
  }
}

async function getTopPerformer() {
  const response = await fetch(getApiUrl("/api/top-performers"), {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch top performer");
  }
  return response.json();
}

async function getConsistentFund() {
  const response = await fetch(getApiUrl("/api/consistent-funds"), {
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
        schemeName={topPerformer?.schemeName ?? "N/A"}
        schemeCode={topPerformer?.schemeCode ?? ""}
        returnPercentage={topPerformer?.returns ?? 0}
        period="1Y"
      />
      <ConsistentFundCard
        schemeName={mostConsistentFund?.schemeName ?? "N/A"}
        schemeCode={mostConsistentFund?.schemeCode ?? ""}
        returnPercentage={mostConsistentFund?.returns ?? 0}
        period="1Y"
        consistency={mostConsistentFund?.consistency ?? "N/A"}
      />
    </div>
  );
}
