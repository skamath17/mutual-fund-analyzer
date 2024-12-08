// src/app/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketOverview } from "@/components/market/MarketOverview";
import { NewsFeed } from "@/components/news/NewsFeed";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getTopFunds() {
  // We'll implement this later to fetch from our API
  return [];
}

export default async function HomePage() {
  // We'll add data fetching here

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Market Overview Section */}
      <MarketOverview />

      {/* News Feed Section */}
      <NewsFeed />
    </div>
  );
}
