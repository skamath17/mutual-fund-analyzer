// src/components/comparison/ComparisonResults.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceChart } from "./PerformanceChart";

type Period = "1Y" | "3Y" | "5Y";

interface ReturnMetrics {
  absoluteReturn: number;
  annualizedReturn: number;
  startDate: Date;
  endDate: Date;
  startNAV: number;
  endNAV: number;
}

interface ComparisonMetrics {
  returns: {
    "1Y": ReturnMetrics;
    "3Y": ReturnMetrics;
    "5Y": ReturnMetrics;
  };
  volatility: {
    standardDeviation: number;
    sharpeRatio: number;
  };
  holdings: Array<{
    companyName: string;
    percentage: number;
    sector?: string;
  }>;
}

interface ComparisonMetrics {
  returns: {
    [key in Period]: ReturnMetrics;
  };

  volatility: {
    standardDeviation: number;
    sharpeRatio: number;
  };
  holdings: Array<{
    companyName: string;
    percentage: number;
    sector?: string;
  }>;
}

interface ComparisonData {
  fundId: string;
  fundName: string;
  fundHouse: string;
  category: string;
  metrics: ComparisonMetrics;
  navHistory: Array<{ date: Date; nav: number }>;
}

interface ComparisonResultsProps {
  data: ComparisonData[];
}

export function ComparisonResults({ data }: ComparisonResultsProps) {
  const periods: Period[] = ["1Y", "3Y", "5Y"];

  return (
    <div className="space-y-6">
      <PerformanceChart data={data} />
      {/* Returns Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Returns Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div></div>
            {data.map((fund) => (
              <div key={fund.fundId} className="font-medium">
                {fund.fundName}
              </div>
            ))}
            {periods.map((period) => (
              <React.Fragment key={period}>
                <div className="font-medium">{period} Returns</div>
                {data.map((fund) => (
                  <div
                    key={fund.fundId}
                    className={`text-right ${
                      fund.metrics.returns[period].absoluteReturn >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {fund.metrics.returns[period].absoluteReturn.toFixed(2)}%
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Metrics Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div></div>
            {data.map((fund) => (
              <div key={fund.fundId} className="font-medium">
                {fund.fundName}
              </div>
            ))}
            <div className="font-medium">Volatility</div>
            {data.map((fund) => (
              <div key={fund.fundId} className="text-right">
                {fund.metrics.volatility.standardDeviation.toFixed(2)}%
              </div>
            ))}
            <div className="font-medium">Sharpe Ratio</div>
            {data.map((fund) => (
              <div key={fund.fundId} className="text-right">
                {fund.metrics.volatility.sharpeRatio.toFixed(2)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
