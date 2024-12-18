// src/components/comparison/PerformanceChart.tsx
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
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ComparisonData {
  fundId: string;
  fundName: string;
  fundHouse: string;
  category: string;
  navHistory: Array<{ date: Date; nav: number }>;
}

type Period = "1Y" | "3Y" | "5Y";

interface PerformanceChartProps {
  data: ComparisonData[];
  selectedPeriod: Period;
}

const CHART_COLORS = ["#2563eb", "#dc2626", "#16a34a"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm text-gray-600 mb-2">
          {new Date(label).toLocaleDateString()}
        </p>
        {payload.map((entry: any, index: number) => {
          const value = entry.value;
          const percentageChange = ((value - 100) / 100) * 100;
          const isPositive = percentageChange >= 0;

          return (
            <div key={`item-${index}`} className="mb-1 last:mb-0">
              <span style={{ color: entry.color }} className="font-medium">
                {entry.name}: {value.toFixed(2)}
              </span>
              <span
                className={`ml-2 ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                ({isPositive ? "+" : ""}
                {percentageChange.toFixed(2)}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export function PerformanceChart({
  data,
  selectedPeriod,
}: PerformanceChartProps) {
  // Check if all funds have sufficient data for the selected period
  const hasInsufficientData = data.some((fund) => {
    const navHistory = fund.navHistory;
    if (navHistory.length === 0) return true;

    const oldestDate = new Date(navHistory[0].date);
    const today = new Date();
    const requiredMonths =
      selectedPeriod === "1Y" ? 12 : selectedPeriod === "3Y" ? 36 : 60;

    const monthsDifference =
      (today.getFullYear() - oldestDate.getFullYear()) * 12 +
      (today.getMonth() - oldestDate.getMonth());

    return monthsDifference < requiredMonths;
  });

  if (hasInsufficientData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Insufficient historical data available for {selectedPeriod}{" "}
          comparison. Some funds dont have enough historical data for this time
          period.
        </AlertDescription>
      </Alert>
    );
  }

  // Get initial values for normalization
  const initialValues = data.reduce((acc, fund) => {
    acc[fund.fundId] = fund.navHistory[0]?.nav || 100;
    return acc;
  }, {} as { [key: string]: number });

  // Find the common dates across all funds
  const commonDates =
    data[0]?.navHistory.map(
      (item) => new Date(item.date).toISOString().split("T")[0]
    ) || [];

  // Transform the data for the chart
  const chartData = commonDates.map((date) => {
    const dataPoint: any = { date };

    data.forEach((fund, index) => {
      const navPoint = fund.navHistory.find(
        (item) => new Date(item.date).toISOString().split("T")[0] === date
      );

      if (navPoint) {
        // Normalize to base 100
        dataPoint[fund.fundId] =
          (Number(navPoint.nav) / initialValues[fund.fundId]) * 100;
      }
    });

    return dataPoint;
  });

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis
            dataKey="date"
            tickFormatter={(date) => new Date(date).toLocaleDateString()}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value) => value.toFixed(0)}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => {
              const fund = data.find((f) => f.fundId === value);
              return fund?.fundName || value;
            }}
          />
          {data.map((fund, index) => (
            <Line
              key={fund.fundId}
              type="monotone"
              dataKey={fund.fundId}
              stroke={CHART_COLORS[index]}
              dot={false}
              name={fund.fundName}
              strokeWidth={2}
              connectNulls={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
