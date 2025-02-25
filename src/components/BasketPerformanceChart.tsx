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
  period: "1Y" | "3Y" | "5Y"; // Add period prop to determine start date
  hasSufficientData?: boolean;
}

export default function BasketPerformanceCharts({
  navHistory,
  niftyHistory,
  period = "1Y", // Default to 1Y if not provided
  hasSufficientData = true,
}: BasketPerformanceChartProps) {
  if (!hasSufficientData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison (Base 100)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-gray-500">
            Data not available for {period} for one or more funds in the basket
          </div>
        </CardContent>
      </Card>
    );
  }

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

  // Sort both histories by date
  const sortedBasketHistory = [...navHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const sortedNiftyHistory = [...(niftyHistory || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate period start date (current date is 2/23/2025)
  const now = new Date("2025-02-23");
  const startDate = new Date(now);
  switch (period) {
    case "1Y":
      startDate.setFullYear(now.getFullYear() - 1); // 2/23/2024
      break;
    case "3Y":
      startDate.setFullYear(now.getFullYear() - 3); // 2/23/2022
      break;
    case "5Y":
      startDate.setFullYear(now.getFullYear() - 5); // 2/23/2020
      break;
  }

  // Sort and filter data first
  const filteredBasketHistory = navHistory
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter((point) => {
      const pointDate = new Date(point.date);
      return pointDate >= startDate && pointDate <= now;
    });

  const filteredNiftyHistory = niftyHistory
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter((point) => {
      const pointDate = new Date(point.date);
      return pointDate >= startDate && pointDate <= now;
    });

  if (!filteredBasketHistory.length) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base font-medium">
            Performance Comparison (Base 100)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-gray-500">
            No performance data available for {period}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simple normalization
  const firstBasketValue = filteredBasketHistory[0].nav;
  const firstNiftyValue = filteredNiftyHistory[0].nav;

  const data = filteredBasketHistory.map((basketPoint) => {
    const basketValue = (basketPoint.nav / firstBasketValue) * 100;

    // Find closest Nifty point
    const pointDate = new Date(basketPoint.date).getTime();
    const niftyPoint = filteredNiftyHistory.reduce((closest, curr) => {
      const currDiff = Math.abs(new Date(curr.date).getTime() - pointDate);
      const closestDiff = Math.abs(
        new Date(closest.date).getTime() - pointDate
      );
      return currDiff < closestDiff ? curr : closest;
    }, filteredNiftyHistory[0]);

    return {
      date: new Date(basketPoint.date).toISOString().split("T")[0],
      basket: basketValue,
      nifty: (niftyPoint.nav / firstNiftyValue) * 100,
    };
  });

  // Add debugging
  console.log({
    dataPoints: data.length,
    firstPoint: data[0],
    lastPoint: data[data.length - 1],
  });

  console.log("Chart Props:", {
    period,
    navHistoryLength: filteredBasketHistory.length,
    niftyHistoryLength: filteredNiftyHistory.length,
    firstBasketValue,
    firstNiftyValue,
    sampleData: data.slice(0, 3),
  });

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base font-medium">
          Performance Comparison (Base 100)
        </CardTitle>
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
              <Line
                type="monotone"
                dataKey="nifty"
                stroke="#dc2626"
                dot={false}
                name="Nifty 50"
                strokeWidth={2}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
