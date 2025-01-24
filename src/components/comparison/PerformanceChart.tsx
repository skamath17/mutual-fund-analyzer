// src/components/comparison/PerformanceChart.tsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ComparisonData, Period } from "@/lib/types/comparison";

interface PerformanceChartProps {
  data: ComparisonData[];
  selectedPeriod: Period;
  benchmarkData?: Array<{ date: Date; nav: number }>;
}

export function PerformanceChart({
  data,
  selectedPeriod,
  benchmarkData,
}: PerformanceChartProps) {
  // Function to normalize the NAV values to base 100
  const normalizeData = (navHistory: Array<{ date: Date; nav: number }>) => {
    if (navHistory.length === 0) return [];
    const initialNav = navHistory[0].nav;
    return navHistory.map((point) => ({
      date: new Date(point.date).getTime(), // Convert to timestamp for Recharts
      nav: (point.nav / initialNav) * 100,
    }));
  };

  // Create a color generator for different funds
  const getColorForIndex = (index: number) => {
    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F"];
    return colors[index % colors.length];
  };

  // Normalize both fund data and benchmark data
  const normalizedFunds = data.map((fund) => ({
    ...fund,
    navHistory: normalizeData(fund.navHistory),
  }));

  const normalizedBenchmark = benchmarkData ? normalizeData(benchmarkData) : [];

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            type="number"
            domain={["auto", "auto"]}
            scale="time"
            tickFormatter={(timestamp) =>
              new Date(timestamp).toLocaleDateString()
            }
          />
          <YAxis
            label={{
              value: "Value (Base 100)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
            formatter={(value: number) => [`${value.toFixed(2)}`, ""]}
          />
          <Legend />

          {/* Render benchmark line if data exists */}
          {normalizedBenchmark.length > 0 && (
            <Line
              data={normalizedBenchmark}
              type="monotone"
              dataKey="nav"
              name="Nifty 50"
              stroke="#666666"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
          )}

          {/* Render fund lines */}
          {normalizedFunds.map((fund, index) => (
            <Line
              key={fund.fundId}
              data={fund.navHistory} // This should be an array of {date, nav} objects
              type="monotone"
              dataKey="nav"
              name={fund.fundName}
              stroke={getColorForIndex(index)}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
