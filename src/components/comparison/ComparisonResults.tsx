// src/components/comparison/ComparisonResults.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceChart } from "./PerformanceChart";
import {
  ComparisonData,
  Period,
  ComparisonMetrics,
} from "@/lib/types/comparison";

interface ReturnMetrics {
  absoluteReturn: number;
  annualizedReturn: number;
  startDate: Date;
  endDate: Date;
  startNAV: number;
  endNAV: number;
}

interface ComparisonResultsProps {
  data: ComparisonData[];
  benchmarkData?: Array<{ date: Date; nav: number }>; // Add this new prop
}

export function ComparisonResults({
  data,
  benchmarkData,
}: ComparisonResultsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1Y");
  const periods: Period[] = ["1Y", "3Y", "5Y"];

  // Enhance the existing filter function to include benchmark data
  const getFilteredNavHistory = (fund: ComparisonData, period: Period) => {
    const today = new Date();
    const startDate = new Date();

    switch (period) {
      case "1Y":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case "3Y":
        startDate.setFullYear(today.getFullYear() - 3);
        break;
      case "5Y":
        startDate.setFullYear(today.getFullYear() - 5);
        break;
    }

    return {
      ...fund,
      navHistory: fund.navHistory.filter(
        (item) => new Date(item.date) >= startDate
      ),
    };
  };

  // Add a function to filter benchmark data
  const getFilteredBenchmarkData = (period: Period) => {
    if (!benchmarkData) return [];

    const today = new Date();
    const startDate = new Date();

    switch (period) {
      case "1Y":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case "3Y":
        startDate.setFullYear(today.getFullYear() - 3);
        break;
      case "5Y":
        startDate.setFullYear(today.getFullYear() - 5);
        break;
    }

    return benchmarkData.filter((item) => new Date(item.date) >= startDate);
  };

  // Prepare filtered data for the chart
  const filteredData = data.map((fund) =>
    getFilteredNavHistory(fund, selectedPeriod)
  );

  const filteredBenchmarkData = getFilteredBenchmarkData(selectedPeriod);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Performance Comparison</CardTitle>
          <Tabs
            value={selectedPeriod}
            onValueChange={(value) => setSelectedPeriod(value as Period)}
          >
            <TabsList>
              <TabsTrigger value="1Y">1 Year</TabsTrigger>
              <TabsTrigger value="3Y">3 Years</TabsTrigger>
              <TabsTrigger value="5Y">5 Years</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <PerformanceChart
            data={filteredData}
            benchmarkData={filteredBenchmarkData}
            selectedPeriod={selectedPeriod}
          />
        </CardContent>
      </Card>

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
