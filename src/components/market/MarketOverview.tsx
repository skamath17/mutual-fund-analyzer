// src/components/market/MarketOverview.tsx
import React from "react";
import { TopPerformerCard } from "./TopPerformerCard";
import { ConsistentFundCard } from "./ConsistentFundCard";
import { TopPerformerBalancedCard } from "./TopPerformerBalancedCard";
import { getApiUrl } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

async function getTopPerformerEquity() {
  const response = await fetch(getApiUrl("/api/top-performers?type=equity"), {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch top equity performer");
  }
  return response.json();
}

async function getTopPerformerBalanced() {
  const response = await fetch(getApiUrl("/api/top-performers?type=balanced"), {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch top balanced performer");
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
  const [topPerformerEquity, topPerformerBalanced, mostConsistentFund] =
    await Promise.all([
      getTopPerformerEquity(),
      getTopPerformerBalanced(),
      getConsistentFund(),
    ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TopPerformerCard
        schemeName={topPerformerEquity?.schemeName ?? "N/A"}
        schemeCode={topPerformerEquity?.schemeCode ?? ""}
        returnPercentage={topPerformerEquity?.returns ?? 0}
        period="1Y"
      />
      <TopPerformerBalancedCard
        schemeName={topPerformerBalanced?.schemeName ?? "N/A"}
        schemeCode={topPerformerBalanced?.schemeCode ?? ""}
        returnPercentage={topPerformerBalanced?.returns ?? 0}
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
