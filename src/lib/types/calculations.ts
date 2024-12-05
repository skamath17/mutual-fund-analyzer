export interface NAVData {
  date: Date;
  nav: number;
}

export type Period = "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y";

export interface ReturnMetrics {
  absoluteReturn: number;
  annualizedReturn?: number;
  startDate: Date;
  endDate: Date;
  startNAV: number;
  endNAV: number;
  insufficientData?: boolean;
}

export interface VolatilityMetrics {
  standardDeviation: number;
  sharpeRatio?: number;
  beta?: number;
}

export interface FundPerformance {
  fundId: string;
  returns: {
    [key in Period]?: ReturnMetrics;
  };
  volatility?: VolatilityMetrics;
}

export interface Holding {
  id: string;
  fundId: string;
  companyName: string;
  percentage: number | string; // Since Decimal from DB comes as string
  sector?: string | null;
  updatedAt: Date;
}
