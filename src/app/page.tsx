import React from "react";
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
  PieChart,
  LineChart,
  AlertCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Market Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Top Performing Funds</span>
            <Link
              href="/market"
              className="text-sm text-primary hover:underline"
            >
              View Details
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarketOverview />
        </CardContent>
      </Card>

      {/* Top Performing Funds Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Top Performing Indexes</span>
            <Link
              href="/funds"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* We'll map through top funds here */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">HDFC Top 100 Fund</h4>
                    <p className="text-sm text-gray-600">Large Cap</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="ml-1">15.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Latest Market News */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Latest Market News</span>
            <Link href="/news" className="text-sm text-primary hover:underline">
              More News
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NewsFeed />
        </CardContent>
      </Card>

      {/* Tax Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tax Insights</span>
            <Link href="/tax" className="text-sm text-primary hover:underline">
              Learn More
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-primary" />
            <div>
              <h4 className="font-medium">Tax Saving Season</h4>
              <p className="text-sm text-gray-600">
                Explore ELSS funds to save up to ₹46,800 in taxes under Section
                80C
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
