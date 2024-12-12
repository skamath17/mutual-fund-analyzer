// src/types/funds.ts
export type Period = "1Y" | "3Y" | "5Y";

export interface ComparisonData {
  fundId: string;
  fundName: string;
  fundHouse: string;
  category: string;
  navHistory: Array<{ date: Date; nav: number }>;
}

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
