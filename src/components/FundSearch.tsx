// src/components/FundSearch.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/utils/api";
import debounce from "lodash/debounce";
import type { Fund, SelectedFund } from "@/lib/types/funds";

interface FundSearchProps {
  onSelectFund: (fund: SelectedFund) => void; // Changed to SelectedFund
}

export function FundSearch({ onSelectFund }: FundSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchFunds = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        getApiUrl(`/api/funds/search?query=${encodeURIComponent(searchQuery)}`)
      );
      if (!response.ok) throw new Error("Failed to search funds");
      const data = await response.json();
      setResults(data.funds || []);
    } catch (error) {
      console.error("Error searching funds:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFund = (fund: Fund) => {
    // Transform Fund to SelectedFund
    const selectedFund: SelectedFund = {
      schemeCode: fund.schemeCode,
      schemeName: fund.basicInfo.schemeName,
      fundHouse: {
        name: fund.basicInfo.fundHouse,
      },
      category: {
        name: fund.basicInfo.category,
      },
    };

    onSelectFund(selectedFund);
    setQuery("");
    setResults([]);
  };

  const debouncedSearch = debounce(searchFunds, 300);

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search for funds..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
      />

      {isLoading && (
        <div className="p-4 text-center text-gray-500">Searching...</div>
      )}

      <div className="space-y-2">
        {results.map((fund) => (
          <div
            key={fund.schemeCode}
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
            onClick={() => handleSelectFund(fund)}
          >
            <div className="font-medium">{fund.basicInfo.schemeName}</div>
            <div className="text-sm text-gray-500">
              {fund.basicInfo.fundHouse} • {fund.basicInfo.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
