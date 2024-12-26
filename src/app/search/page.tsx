// src/app/search/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search as SearchIcon,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import type { Fund } from "@/lib/types/funds";

interface SearchFilters {
  category: string;
  riskLevel: string;
  minReturn: string;
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    category: "",
    riskLevel: "",
    minReturn: "",
  });
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams({
        query: searchTerm,
      });

      if (filters.category) searchParams.append("category", filters.category);
      if (filters.riskLevel)
        searchParams.append("riskLevel", filters.riskLevel);
      if (filters.minReturn)
        searchParams.append("minReturn", filters.minReturn);

      const response = await fetch(
        `/api/funds/search?${searchParams.toString()}`
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setFunds(data.funds || []);
    } catch (error) {
      console.error("Error searching funds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Search Mutual Funds</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by fund name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              <SearchIcon className="w-4 h-4 mr-2" />
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={filters.category}
              onValueChange={(value) =>
                setFilters({ ...filters, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LARGE CAP">Large Cap</SelectItem>
                <SelectItem value="MID CAP">Mid Cap</SelectItem>
                <SelectItem value="SMALL CAP">Small Cap</SelectItem>
                <SelectItem value="MULTI CAP">Multi Cap</SelectItem>
                <SelectItem value="FLEXI CAP">Flexi Cap</SelectItem>
                <SelectItem value="ELSS">ELSS</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
                <SelectItem value="INDEX">Index</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.riskLevel}
              onValueChange={(value) =>
                setFilters({ ...filters, riskLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VERY_LOW">Very Low</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MODERATE">Moderate</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="VERY_HIGH">Very High</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.minReturn}
              onValueChange={(value) =>
                setFilters({ ...filters, minReturn: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Min. 1Y Return" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Above 10%</SelectItem>
                <SelectItem value="15">Above 15%</SelectItem>
                <SelectItem value="20">Above 20%</SelectItem>
                <SelectItem value="25">Above 25%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {funds.map((fund) => (
          <Link key={fund.schemeCode} href={`/fund/${fund.schemeCode}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {fund.basicInfo.schemeName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {fund.basicInfo.fundHouse}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-600">Category: </span>
                      {fund.basicInfo.category}
                    </div>
                    <div>
                      <span className="text-gray-600">Risk: </span>
                      {fund.basicInfo.riskLevel}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {funds.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No funds found matching your criteria
          </CardContent>
        </Card>
      )}
    </div>
  );
}
