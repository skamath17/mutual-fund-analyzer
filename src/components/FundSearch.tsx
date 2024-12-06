// src/components/FundSearch.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/utils/api";

interface Fund {
  id: string;
  schemeName: string;
  fundHouse: { name: string };
  category: { name: string };
}

interface FundSearchProps {
  onSelectFund: (fund: Fund) => void;
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
      setResults(data);
    } catch (error) {
      console.error("Error searching funds:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFund = (fund: Fund) => {
    onSelectFund(fund);
    // Clear search input and results
    setQuery("");
    setResults([]);
  };

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search for funds..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          searchFunds(e.target.value);
        }}
      />

      {isLoading && <div>Searching...</div>}

      <div className="space-y-2">
        {results.map((fund) => (
          <div
            key={fund.id}
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
            onClick={() => handleSelectFund(fund)}
          >
            <div className="font-medium">{fund.schemeName}</div>
            <div className="text-sm text-gray-500">
              {fund.fundHouse.name} • {fund.category.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
