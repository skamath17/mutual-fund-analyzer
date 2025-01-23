// src/components/market/TopPerformerEquityCard.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface TopPerformerEquityProps {
  name: string;
  id: string;
  returnPercentage: number;
  period: string;
}

export function TopPerformerEquityCard({
  name,
  id,
  returnPercentage,
  period,
}: TopPerformerEquityProps) {
  return (
    <Link href={`/index/${id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Top Performer (Equity Index)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium text-gray-800">{name}</p>
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
