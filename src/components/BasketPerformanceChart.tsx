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
  // Get initial values for normalization
  const initialBasketValue = navHistory[0]?.nav || 100;
  const initialNiftyValue = niftyHistory[0]?.nav || 100;

  // Combine and transform the data for the chart
  const data = navHistory.map((item) => {
    const basketDate = new Date(item.date).toISOString().split("T")[0];

    const niftyPoint = niftyHistory.find((n) => {
      const niftyDate = new Date(n.date).toISOString().split("T")[0];
      return niftyDate === basketDate;
    });

    return {
      date: basketDate,
      // Normalize both values to start from 100
      basket: (Number(item.nav) / initialBasketValue) * 100,
      nifty: niftyPoint
        ? (Number(niftyPoint.nav) / initialNiftyValue) * 100
        : null,
    };
  });

  console.log("Transformed Data First 5 Points:", data.slice(0, 5));

  /*const data = [
    {
      date: "2023-12-01",
      basket: 100,
      nifty: 100,
    },
    {
      date: "2023-12-02",
      basket: 102,
      nifty: 101,
    },
    {
      date: "2023-12-03",
      basket: 105,
      nifty: 103,
    },
    {
      date: "2023-12-04",
      basket: 103,
      nifty: 102,
    },
    {
      date: "2023-12-05",
      basket: 106,
      nifty: 104,
    },
  ];*/

  return (
    <Card>
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
                name="Basket"
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
