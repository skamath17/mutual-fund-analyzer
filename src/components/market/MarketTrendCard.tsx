// src/components/market/MarketTrendCard.tsx
"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MarketTrendCardProps {
  data: {
    date: string;
    nav: number;
  }[];
  currentValue: number | null; // Make it nullable
  changePercentage: number | null; // Make it nullable
}

export function MarketTrendCard({
  data = [],
  currentValue = null,
  changePercentage = null,
}: MarketTrendCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Market Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">
              ₹{currentValue?.toFixed(2) ?? "N/A"}
            </p>
            <p
              className={`text-sm ${
                changePercentage && changePercentage >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {changePercentage
                ? `${
                    changePercentage >= 0 ? "+" : ""
                  }${changePercentage.toFixed(2)}% Today`
                : "N/A"}
            </p>
          </div>
          <div className="h-16 w-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line
                  type="monotone"
                  dataKey="nav"
                  stroke={
                    changePercentage && changePercentage >= 0
                      ? "#22c55e"
                      : "#ef4444"
                  }
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
