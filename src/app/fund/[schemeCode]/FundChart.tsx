"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

export default function FundChart({ navHistory }: { navHistory: any[] }) {
  if (!navHistory || navHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NAV History</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No NAV history data available for this fund.</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure dates are properly formatted as timestamps
  const formattedData = [...navHistory]
    .map((item) => ({
      ...item,
      date: new Date(item.date).getTime(), // Convert to timestamp
    }))
    .reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>NAV History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <XAxis
                dataKey="date"
                type="number" // Changed to number type
                domain={["dataMin", "dataMax"]}
                tickFormatter={(timestamp) =>
                  new Date(timestamp).toLocaleDateString()
                }
                scale="time" // Added time scale
              />
              <YAxis domain={["dataMin", "dataMax"]} />
              <Tooltip
                labelFormatter={(timestamp) =>
                  `Date: ${new Date(timestamp).toLocaleDateString()}`
                }
                formatter={(value) => [`₹${Number(value).toFixed(2)}`, "NAV"]}
              />
              <Line
                type="monotone"
                dataKey="nav"
                stroke="#2563eb"
                dot={false}
                connectNulls={true}
              />
              <ReferenceDot
                x={formattedData[formattedData.length - 1]?.date}
                y={formattedData[formattedData.length - 1]?.nav}
                r={5}
                fill="#ff5722"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
