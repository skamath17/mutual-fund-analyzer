// src/app/compare-funds/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FundSearch } from "@/components/FundSearch";
import { getApiUrl } from "@/lib/utils/api";
import { X, AlertCircle } from "lucide-react";
import { ComparisonResults } from "@/components/comparison/ComparisonResults";
import type {
  SelectedFund,
  ComparisonData,
  ComparisonMetrics,
} from "@/lib/types/funds";

export default function CompareFunds() {
  const [selectedFunds, setSelectedFunds] = useState<SelectedFund[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFund = (fund: SelectedFund) => {
    setError(null);
    if (selectedFunds.find((f) => f.schemeCode === fund.schemeCode)) {
      setError("This fund is already selected");
      return;
    }

    if (selectedFunds.length >= 3) {
      setError("Maximum 3 funds can be compared at once");
      return;
    }

    setSelectedFunds([...selectedFunds, fund]);
  };

  const handleRemoveFund = (schemeCode: string) => {
    setSelectedFunds(selectedFunds.filter((f) => f.schemeCode !== schemeCode));
    setComparisonData(null);
    setError(null);
  };

  const handleCompare = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl("/api/funds/compare"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fundIds: selectedFunds.map((fund) => fund.schemeCode), // Make sure this is schemeCode
        }),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const result = await response.json();
      setComparisonData(result.data);
    } catch (error) {
      setError("Failed to compare funds. Please try again.");
      console.error("Error comparing funds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Compare Mutual Funds</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Funds to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <FundSearch onSelectFund={handleSelectFund} />

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-4 text-sm text-gray-500">
            {selectedFunds.length < 3
              ? `Select up to ${3 - selectedFunds.length} more funds to compare`
              : "Maximum 3 funds selected"}
          </div>
        </CardContent>
      </Card>

      {selectedFunds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedFunds.map((fund) => (
                <div
                  key={fund.schemeCode}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-grow">
                    <div className="font-medium">{fund.schemeName}</div>
                    <div className="text-sm text-gray-500">
                      {fund.fundHouse.name} • {fund.category.name}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFund(fund.schemeCode)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X size={18} className="text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedFunds.length >= 2 && (
        <div className="flex justify-center">
          <button
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            onClick={handleCompare}
            disabled={isLoading}
          >
            {isLoading ? "Comparing..." : "Compare Funds"}
          </button>
        </div>
      )}

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}

      {comparisonData && !isLoading && (
        <div className="mt-8">
          <ComparisonResults data={comparisonData} />
        </div>
      )}
    </div>
  );
}
