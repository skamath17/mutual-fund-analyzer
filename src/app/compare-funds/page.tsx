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
          fundIds: selectedFunds.map((fund) => fund.schemeCode),
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

  // Render the comparison results panel
  const renderComparisonPanel = () => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-64 w-full mt-6" />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!comparisonData) {
      return (
        <div className="flex flex-col h-full justify-center items-center p-8 text-center">
          <p className="text-gray-500 mb-4">
            Select at least two funds and click &quot;Compare Funds&quot; to see
            analysis
          </p>
        </div>
      );
    }

    return <ComparisonResults data={comparisonData} />;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Compare Mutual Funds</h1>

      {/* Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Fund Selection (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base font-medium">
                Select Funds to Compare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FundSearch onSelectFund={handleSelectFund} />

              {error && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-3 text-xs text-gray-500">
                {selectedFunds.length < 3
                  ? `Select up to ${
                      3 - selectedFunds.length
                    } more funds to compare`
                  : "Maximum 3 funds selected"}
              </div>
            </CardContent>
          </Card>

          {selectedFunds.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base font-medium">
                  Selected Funds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {selectedFunds.map((fund) => (
                    <div
                      key={fund.schemeCode}
                      className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-grow pr-2">
                        <div className="font-medium text-sm">
                          {fund.schemeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {fund.fundHouse.name} • {fund.category.name}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFund(fund.schemeCode)}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        aria-label="Remove fund"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedFunds.length >= 2 && (
            <button
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
              onClick={handleCompare}
              disabled={isLoading}
            >
              {isLoading ? "Comparing..." : "Compare Funds"}
            </button>
          )}
        </div>

        {/* Right Panel - Comparison Results (8 columns) */}
        <div className="lg:col-span-8 space-y-4">{renderComparisonPanel()}</div>
      </div>
    </div>
  );
}
