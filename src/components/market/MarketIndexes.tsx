// src/components/market/MarketIndexes.tsx
import React from "react";
import { TopPerformerEquityCard } from "./TopPerformerEquityCard";
import { TopPerformerSectorCard } from "./TopPerformerSectorCard";
import { ConsistentIndexCard } from "./ConsistentIndexCard";
import { getApiUrl } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

async function getTopPerformerEquity() {
  const response = await fetch(getApiUrl("/api/top-indexes?type=equity"), {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch top equity index");
  }
  return response.json();
}

async function getTopPerformerSector() {
  const response = await fetch(getApiUrl("/api/top-indexes?type=sector"), {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch top sector index");
  }
  return response.json();
}

async function getConsistentIndex() {
  const response = await fetch(getApiUrl("/api/consistent-indexes"), {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch consistent index");
  }
  return response.json();
}

export async function MarketIndexes() {
  const [topPerformerEquity, topPerformerSector, mostConsistentIndex] =
    await Promise.all([
      getTopPerformerEquity(),
      getTopPerformerSector(),
      getConsistentIndex(),
    ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TopPerformerEquityCard
        id={topPerformerEquity?.id ?? "N/A"}
        name={topPerformerEquity?.name ?? "N/A"}
        returnPercentage={topPerformerEquity?.returns ?? 0}
        period={topPerformerEquity?.period ?? 0}
      />
      <TopPerformerSectorCard
        id={topPerformerSector?.id ?? "N/A"}
        name={topPerformerSector?.name ?? "N/A"}
        returnPercentage={topPerformerSector?.returns ?? 0}
        period={topPerformerSector?.period ?? 0}
      />
      <ConsistentIndexCard
        id={mostConsistentIndex?.id ?? "N/A"}
        name={mostConsistentIndex?.name ?? "N/A"}
        returnPercentage={mostConsistentIndex?.returns}
        consistency={mostConsistentIndex?.consistency ?? "N/A"}
        period={mostConsistentIndex?.period ?? 0}
      />
    </div>
  );
}
