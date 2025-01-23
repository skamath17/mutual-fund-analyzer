// src/lib/types/comparison.ts
export type Period = "1Y" | "3Y" | "5Y";

export interface ReturnMetrics {
  absoluteReturn: number;
  annualizedReturn: number;
  startDate: Date;
  endDate: Date;
  startNAV: number;
  endNAV: number;
}

export interface ComparisonMetrics {
  returns: {
    [key in Period]: ReturnMetrics;
  };
  volatility: {
    standardDeviation: number;
    sharpeRatio: number;
  };
  holdings: Array<{
    companyName: string;
    percentage: number;
    sector?: string;
  }>;
}

export interface ComparisonData {
  fundId: string;
  fundName: string;
  fundHouse: string;
  category: string;
  metrics: ComparisonMetrics;
  navHistory: Array<{ date: Date; nav: number }>;
}
