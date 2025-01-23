// src/components/market/ConsistentIndexCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

interface ConsistentIndexProps {
  name: string;
  id: string;
  returnPercentage?: number;
  period: string;
  consistency: string;
}

export function ConsistentIndexCard({
  name,
  id,
  returnPercentage,
  period,
  consistency,
}: ConsistentIndexProps) {
  return (
    <Link href={`/index/${id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Most Consistent Index
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium text-gray-800">{name}</p>
            <div className="flex items-center text-blue-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="font-bold">
                {typeof returnPercentage === "number"
                  ? `${returnPercentage.toFixed(2)}% (${period}Y)`
                  : "N/A"}
              </span>
            </div>
            <p className="text-sm text-gray-500">Consistency: {consistency}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
