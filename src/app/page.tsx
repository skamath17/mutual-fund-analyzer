// src/app/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketOverview } from "@/components/market/MarketOverview";
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">FundsWatch</h1>
        <div className="flex gap-4">
          <Link href="/create-basket">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Fund Basket
            </button>
          </Link>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Compare Funds
          </button>
        </div>
      </div>

      {/* Market Overview Section */}
      <MarketOverview />
    </div>
  );
}
