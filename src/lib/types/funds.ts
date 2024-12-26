// src/lib/types/funds.ts
export interface Fund {
  schemeCode: string; // Changed from id to match our API
  basicInfo: {
    schemeName: string;
    fundHouse: string;
    category: string;
    riskLevel: string;
  };
}

export interface SelectedFund {
  schemeCode: string;
  schemeName: string;
  fundHouse: {
    name: string;
  };
  category: {
    name: string;
  };
}

export type Period = "1Y" | "3Y" | "5Y";

export interface ReturnMetrics {
  absoluteReturn: number;
  annualizedReturn: number;
  startDate: Date;
  endDate: Date;
  startNAV: number;
  endNAV: number;
}

export interface ComparisonData {
  fundId: string;
  fundName: string;
  fundHouse: string;
  category: string;
  metrics: ComparisonMetrics;
  navHistory: Array<{ date: Date; nav: number }>;
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
