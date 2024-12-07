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
  console.log("Nav History:", navHistory);
  console.log("Nifty History:", niftyHistory);

  // Combine and transform the data for the chart
  const data = navHistory.map((item) => {
    const niftyPoint = niftyHistory.find(
      (n) => n.date.toString() === item.date.toString()
    );

    return {
      date: new Date(item.date).toISOString().split("T")[0],
      basket: Number(item.nav),
      nifty: niftyPoint ? Number(niftyPoint.nav) : null,
    };
  });

  const debugData = navHistory.map((item) => {
    const niftyPoint = niftyHistory.find(
      (n) => n.date.toString() === item.date.toString()
    );

    console.log("Debug data");

    return {
      date: new Date(item.date).toISOString().split("T")[0],
      basket: Number(item.nav),
      nifty: niftyPoint ? Number(niftyPoint.nav) : null,
    };
  });

  return (
    <Card>
      <div className="p-2 bg-gray-100">
        First basket value: {navHistory[0]?.nav}
        <br />
        First nifty value: {niftyHistory[0]?.nav}
      </div>
      <CardHeader>
        <CardTitle>Relative Performance (Base 100)</CardTitle>
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
                domain={["auto", "auto"]}
                tickFormatter={(value) => value.toFixed(0)}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number) => [`${value.toFixed(2)}`, "Value"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="basket"
                stroke="#2563eb"
                dot={false}
                name="Basket data"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="nifty"
                stroke="#dc2626"
                dot={false}
                name="Nifty 50"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
