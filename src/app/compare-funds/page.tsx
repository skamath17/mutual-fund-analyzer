// src/app/compare-funds/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundSearch } from "@/components/FundSearch";
import { getApiUrl } from "@/lib/utils/api";
import { X } from "lucide-react";
import { ComparisonResults } from "@/components/comparison/ComparisonResults";

interface Fund {
  id: string;
  schemeName: string;
  fundHouse: { name: string };
  category: { name: string };
}

export default function CompareFunds() {
  const [selectedFunds, setSelectedFunds] = useState<Fund[]>([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectFund = (fund: Fund) => {
    if (!selectedFunds.find((f) => f.id === fund.id)) {
      if (selectedFunds.length < 3) {
        // Limit to 3 funds
        setSelectedFunds([...selectedFunds, fund]);
      }
    }
  };

  const handleRemoveFund = (fundId: string) => {
    setSelectedFunds(selectedFunds.filter((f) => f.id !== fundId));
  };

  const handleCompare = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/funds/compare"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fundIds: selectedFunds.map((fund) => fund.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compare funds");
      }

      const result = await response.json();
      setComparisonData(result.data);
    } catch (error) {
      console.error("Error comparing funds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Compare Mutual Funds</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Funds to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <FundSearch onSelectFund={handleSelectFund} />
          <div className="mt-4 text-sm text-gray-500">
            {selectedFunds.length < 3
              ? `Select up to ${3 - selectedFunds.length} more funds to compare`
              : "Maximum 3 funds selected"}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Selected Funds</CardTitle>
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

      {selectedFunds.length >= 2 && (
        <div className="mt-6 flex justify-center">
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={handleCompare}
            disabled={isLoading}
          >
            {isLoading ? "Comparing..." : "Compare Funds"}
          </button>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonData && (
        <div className="mt-8">
          <ComparisonResults data={comparisonData} />
        </div>
      )}
    </div>
  );
}
