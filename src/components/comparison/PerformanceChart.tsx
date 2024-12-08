// src/components/comparison/PerformanceChart.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface FundData {
  fundId: string;
  fundName: string;
  navHistory: Array<{ date: Date; nav: number }>;
}

interface PerformanceChartProps {
  data: FundData[];
}

const COLORS = ["#2563eb", "#dc2626", "#047857"]; // blue, red, green

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Normalize NAV values to start from 100 for fair comparison
  const normalizedData = React.useMemo(() => {
    // Get the earliest date common to all funds
    const allDates = new Set(
      data.flatMap((fund) =>
        fund.navHistory.map(
          (nh) => new Date(nh.date).toISOString().split("T")[0]
        )
      )
    );

    // Get initial NAV for each fund
    const initialNavs = data.map((fund) => fund.navHistory[0].nav);

    // Create normalized data points
    const chartData = Array.from(allDates).map((dateStr) => {
      const point: any = { date: dateStr };
      data.forEach((fund, index) => {
        const navPoint = fund.navHistory.find(
          (nh) => new Date(nh.date).toISOString().split("T")[0] === dateStr
        );
        if (navPoint) {
          point[`fund${index}`] = (navPoint.nav / initialNavs[index]) * 100;
        }
      });
      return point;
    });

    return chartData.sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Comparison (Base: 100)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={normalizedData}>
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis tickFormatter={(value) => `${value.toFixed(0)}`} />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number, name: string, props: any) => {
                  const fundIndex = Number(name.replace("fund", ""));
                  return [`${value.toFixed(2)}`, data[fundIndex].fundName];
                }}
              />
              <Legend
                formatter={(value, entry) => {
                  const fundIndex = Number(value.replace("fund", ""));
                  return data[fundIndex].fundName;
                }}
              />
              {data.map((_, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={`fund${index}`}
                  stroke={COLORS[index]}
                  dot={false}
                  strokeWidth={2}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
