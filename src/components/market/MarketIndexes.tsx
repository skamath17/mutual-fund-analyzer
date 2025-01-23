// src/components/market/MarketIndexes.tsx
import React from "react";
import { TopPerformerEquityCard } from "./TopPerformerEquityCard";
import { TopPerformerSectorCard } from "./TopPerformerSectorCard";
import { ConsistentIndexCard } from "./ConsistentIndexCard";
import { getApiUrl } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

// Helper function to handle fetch requests consistently
async function fetchWithErrorHandling(url: string, errorMessage: string) {
  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(`${errorMessage}: ${response.status}`);
      return null;
    }
    return response.json();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return null;
  }
}

async function getTopPerformerEquity() {
  return fetchWithErrorHandling(
    getApiUrl("/api/top-indexes?type=equity"),
    "Failed to fetch top equity index"
  );
}

async function getTopPerformerSector() {
  return fetchWithErrorHandling(
    getApiUrl("/api/top-indexes?type=sector"),
    "Failed to fetch top sectoral index"
  );
}

async function getConsistentIndex() {
  return fetchWithErrorHandling(
    getApiUrl("/api/consistent-indexes"),
    "Failed to fetch consistent index"
  );
}

export async function MarketIndexes() {
  // Use Promise.allSettled instead of Promise.all to handle partial failures
  const results = await Promise.allSettled([
    getTopPerformerEquity(),
    getTopPerformerSector(),
    getConsistentIndex(),
  ]);

  // Extract values from the settled promises, using null for rejected promises
  const [topPerformerEquity, topPerformerSector, mostConsistentIndex] =
    results.map((result) =>
      result.status === "fulfilled" ? result.value : null
    );

  // If all data fetching failed, show a user-friendly message
  if (!topPerformerEquity && !topPerformerSector && !mostConsistentIndex) {
    return (
      <div className="p-4 text-center bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          Market index data is temporarily unavailable. Please try again later.
        </p>
      </div>
    );
  }

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
        returnPercentage={mostConsistentIndex?.returns ?? 0}
        consistency={mostConsistentIndex?.consistency ?? "N/A"}
        period={mostConsistentIndex?.period ?? 0}
      />
    </div>
  );
}
