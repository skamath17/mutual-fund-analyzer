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
