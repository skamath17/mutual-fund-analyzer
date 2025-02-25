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

interface ComparisonResultsProps {
  data: ComparisonData[];
  benchmarkData?: Array<{ date: Date; nav: number }>;
}

export function ComparisonResults({
  data,
  benchmarkData,
}: ComparisonResultsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1Y");
  const periods: Period[] = ["1Y", "3Y", "5Y"];

  // Filter functions
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

  // Prepare data for chart
  const filteredData = data.map((fund) =>
    getFilteredNavHistory(fund, selectedPeriod)
  );
  const filteredBenchmarkData = getFilteredBenchmarkData(selectedPeriod);

  return (
    <div className="space-y-4">
      {/* Performance Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base font-medium">
            Performance Comparison
          </CardTitle>
          <Tabs
            value={selectedPeriod}
            onValueChange={(value) => setSelectedPeriod(value as Period)}
            className="scale-90 origin-right"
          >
            <TabsList>
              <TabsTrigger value="1Y" className="text-xs">
                1 Year
              </TabsTrigger>
              <TabsTrigger value="3Y" className="text-xs">
                3 Years
              </TabsTrigger>
              <TabsTrigger value="5Y" className="text-xs">
                5 Years
              </TabsTrigger>
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

      {/* Returns Comparison - Table Layout */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base font-medium">
            Returns Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-sm text-gray-500 w-1/4">
                    Period
                  </th>
                  {data.map((fund) => (
                    <th
                      key={fund.fundId}
                      className="text-right py-2 px-4 font-medium text-sm"
                    >
                      {fund.fundName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => (
                  <tr key={period} className="border-b border-gray-100">
                    <td className="py-2 text-sm font-medium">
                      {period} Returns
                    </td>
                    {data.map((fund) => (
                      <td
                        key={fund.fundId}
                        className={`text-right py-2 px-4 text-sm ${
                          fund.metrics.returns[period]?.absoluteReturn >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {fund.metrics.returns[period]?.absoluteReturn >= 0
                          ? "+"
                          : ""}
                        {fund.metrics.returns[period]?.absoluteReturn.toFixed(
                          2
                        )}
                        %
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis - Table Layout */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base font-medium">Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-sm text-gray-500 w-1/4">
                    Metric
                  </th>
                  {data.map((fund) => (
                    <th
                      key={fund.fundId}
                      className="text-right py-2 px-4 font-medium text-sm"
                    >
                      {fund.fundName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-sm font-medium">Volatility</td>
                  {data.map((fund) => (
                    <td
                      key={fund.fundId}
                      className="text-right py-2 px-4 text-sm"
                    >
                      {fund.metrics.volatility.standardDeviation.toFixed(2)}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-sm font-medium">Sharpe Ratio</td>
                  {data.map((fund) => (
                    <td
                      key={fund.fundId}
                      className="text-right py-2 px-4 text-sm"
                    >
                      {fund.metrics.volatility.sharpeRatio.toFixed(2)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
