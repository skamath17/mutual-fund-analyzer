"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundSearch } from "@/components/FundSearch";
import { X } from "lucide-react"; // For the remove icon
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/utils/api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Period = "1Y" | "3Y" | "5Y";

interface Fund {
  id: string;
  schemeName: string;
  fundHouse: { name: string };
  category: { name: string };
}

interface FundWithAllocation extends Fund {
  allocation: number;
}

interface BasketMetrics {
  returns: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
}

export default function CreateBasket() {
  const [selectedFunds, setSelectedFunds] = useState<FundWithAllocation[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [metrics, setMetrics] = useState<BasketMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1Y");

  const handleTestBasket = async (period: Period = "1Y") => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/basket/test"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          funds: selectedFunds.map((fund) => ({
            fundId: fund.id,
            allocation: fund.allocation,
          })),
          period,
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze basket");

      const data = await response.json();
      setMetrics(data.metrics);
      setShowResults(true);
      setSelectedPeriod(period);
    } catch (error) {
      console.error("Error testing basket:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    handleTestBasket(period);
  };

  const recalculateAllocations = (funds: FundWithAllocation[]) => {
    const totalFunds = funds.length;
    if (totalFunds === 0) return [];

    if (totalFunds <= 5) {
      const equalShare = Math.floor(100 / totalFunds);
      const remainder = 100 - equalShare * totalFunds;

      return funds.map((fund, index) => ({
        ...fund,
        allocation: equalShare + (index === 0 ? remainder : 0),
      }));
    } else {
      const lastFund = funds[funds.length - 1];
      const otherFunds = funds.slice(0, -1);
      const equalShare = Math.floor(80 / otherFunds.length);
      const remainder = 80 - equalShare * otherFunds.length;

      return [
        ...otherFunds.map((fund, index) => ({
          ...fund,
          allocation: equalShare + (index === 0 ? remainder : 0),
        })),
        { ...lastFund, allocation: 20 },
      ];
    }
  };

  const handleSelectFund = (fund: Fund) => {
    if (!selectedFunds.find((f) => f.id === fund.id)) {
      const newFunds = [...selectedFunds, { ...fund, allocation: 0 }];
      setSelectedFunds(recalculateAllocations(newFunds));
    }
  };

  const handleRemoveFund = (fundId: string) => {
    const newFunds = selectedFunds.filter((f) => f.id !== fundId);
    setSelectedFunds(recalculateAllocations(newFunds));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create Fund Basket</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <FundSearch onSelectFund={handleSelectFund} />
        </CardContent>
      </Card>

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Selected Funds</CardTitle>
            {selectedFunds.length >= 2 && (
              <Button
                onClick={() => handleTestBasket("1Y")} // Wrap in arrow function
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Calculating..." : "Test Basket Performance"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedFunds.map((fund) => (
                <div
                  key={fund.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-grow">
                    <div className="font-medium">{fund.schemeName}</div>
                    <div className="text-sm text-gray-500">
                      {fund.fundHouse.name} • {fund.category.name}
                    </div>
                  </div>
                  <div className="text-lg font-medium mr-4">
                    {fund.allocation}%
                  </div>
                  <button
                    onClick={() => handleRemoveFund(fund.id)}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Section - Will show after clicking Test */}
      {showResults && metrics && (
        <div className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Basket Performance Analysis</CardTitle>
              <Tabs
                value={selectedPeriod}
                onValueChange={(value) => handlePeriodChange(value as Period)}
              >
                <TabsList>
                  <TabsTrigger value="1Y">1 Year</TabsTrigger>
                  <TabsTrigger value="3Y">3 Years</TabsTrigger>
                  <TabsTrigger value="5Y">5 Years</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  {/* Total Returns */}
                  <div className="text-sm text-gray-500">Total Returns</div>
                  <div
                    className={`text-2xl font-bold ${
                      metrics.returns >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {metrics.returns >= 0 ? "+" : ""}
                    {metrics.returns.toFixed(2)}%
                  </div>
                </div>

                {/* Annualized Returns */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">
                    Annualized Returns
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      metrics.annualizedReturn >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.annualizedReturn >= 0 ? "+" : ""}
                    {metrics.annualizedReturn.toFixed(2)}%
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Maximum Drawdown</div>
                  <div className="text-2xl font-bold text-red-600">
                    -{metrics.maxDrawdown.toFixed(2)}%
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Volatility</div>
                  <div className="text-2xl font-bold">
                    {metrics.volatility.toFixed(2)}%
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Sharpe Ratio</div>
                  <div className="text-2xl font-bold">
                    {metrics.sharpeRatio.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
