// src/app/admin/import-funds/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/utils/api";

interface FundHouse {
  id: string;
  name: string;
}

interface FundCategory {
  id: string;
  name: string;
}

export default function ImportFundsPage() {
  const [fundHouses, setFundHouses] = useState<FundHouse[]>([]);
  const [categories, setCategories] = useState<FundCategory[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    // Fetch fund houses and categories when page loads
    async function fetchData() {
      try {
        const [housesRes, categoriesRes] = await Promise.all([
          fetch(getApiUrl("/api/fund-houses")),
          fetch(getApiUrl("/api/fund-categories")),
        ]);

        if (housesRes.ok && categoriesRes.ok) {
          const houses = await housesRes.json();
          const cats = await categoriesRes.json();
          setFundHouses(houses);
          setCategories(cats);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();
  }, []);

  const handleImport = async () => {
    if (!selectedHouse) {
      setStatus("Please select a fund house");
      return;
    }

    setIsLoading(true);
    setStatus("Importing funds...");

    try {
      const response = await fetch(getApiUrl("/api/import-funds"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fundHouseId: selectedHouse,
          categoryId: selectedCategory || undefined, // Optional
        }),
      });

      const data = await response.json();
      setStatus(data.message || "Import completed");
    } catch (error) {
      setStatus("Error during import");
      console.error("Import error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Import Fund Data</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Import Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fund House Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Fund House</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedHouse}
              onChange={(e) => setSelectedHouse(e.target.value)}
            >
              <option value="">Select Fund House</option>
              {fundHouses.map((house) => (
                <option key={house.id} value={house.id}>
                  {house.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Category (Optional)
            </label>
            <select
              className="w-full p-2 border rounded"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={isLoading || !selectedHouse}
            className="w-full"
          >
            {isLoading ? "Importing..." : "Start Import"}
          </Button>

          {/* Status Display */}
          {status && (
            <div className="mt-4 p-4 bg-gray-100 rounded">{status}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
