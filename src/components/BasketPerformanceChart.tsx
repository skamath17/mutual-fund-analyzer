// src/components/BasketPerformanceChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  date: Date;
  nav: number;
}

interface BasketPerformanceChartProps {
  navHistory: ChartData[];
  niftyHistory: ChartData[];
}

export default function BasketPerformanceCharts({
  navHistory,
  niftyHistory,
}: BasketPerformanceChartProps) {
  if (!navHistory?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison (Base 100)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-gray-500">
            No performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort both histories by date to ensure first value is the earliest
  const sortedBasketHistory = [...navHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const sortedNiftyHistory = [...(niftyHistory || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get initial values for normalization
  const firstBasketValue = sortedBasketHistory[0].nav;
  const firstNiftyValue = sortedNiftyHistory[0]?.nav;

  // Create normalized data points
  const data = sortedBasketHistory.map((basketPoint) => {
    const basketDate = new Date(basketPoint.date).toISOString().split("T")[0];

    // Find matching Nifty point
    const niftyPoint = sortedNiftyHistory.find(
      (n) => new Date(n.date).toISOString().split("T")[0] === basketDate
    );

    return {
      date: basketDate,
      basket: (basketPoint.nav / firstBasketValue) * 100,
      nifty:
        niftyPoint && firstNiftyValue
          ? (niftyPoint.nav / firstNiftyValue) * 100
          : null,
    };
  });

  console.log("First basket value:", firstBasketValue);
  console.log("First nifty value:", firstNiftyValue);
  console.log("Sample data points:", data.slice(0, 3));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Comparison (Base 100)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={["dataMin - 5", "dataMax + 5"]}
                tickFormatter={(value) => value.toFixed(0)}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}`,
                  name,
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="basket"
                stroke="#2563eb"
                dot={false}
                name="Your Basket"
                strokeWidth={2}
                connectNulls={true}
              />
              {niftyHistory?.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="nifty"
                  stroke="#dc2626"
                  dot={false}
                  name="Nifty 50"
                  strokeWidth={2}
                  connectNulls={true}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
