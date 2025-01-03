// src/components/market/TopPerformerCard.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface TopPerformerProps {
  schemeName: string;
  schemeCode: string;
  returnPercentage: number;
  period: string;
}

export function TopPerformerCard({
  schemeName,
  schemeCode,
  returnPercentage,
  period,
}: TopPerformerProps) {
  return (
    <Link href={`/fund/${schemeCode}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">{schemeName}</p>
            <div className="flex items-center text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              <span className="font-bold">
                {returnPercentage.toFixed(2)}% ({period})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
