// src/components/market/ConsistentFundCard.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

interface ConsistentFundProps {
  schemeName: string;
  schemeCode: string;
  returnPercentage: number;
  period: string;
  consistency: string; // e.g., "High", "Very High"
}

export function ConsistentFundCard({
  schemeName,
  schemeCode,
  returnPercentage,
  period,
  consistency,
}: ConsistentFundProps) {
  return (
    <Link href={`/fund/${schemeCode}`}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Most Consistent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">{schemeName}</p>
            <div className="flex items-center text-blue-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="font-bold">
                {returnPercentage.toFixed(2)}% ({period})
              </span>
            </div>
            <p className="text-sm text-gray-500">Consistency: {consistency}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
