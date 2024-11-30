// src/lib/calculations/volatility.ts
import { NAVData, VolatilityMetrics } from "@/lib/types/calculations";

export function calculateVolatilityMetrics(
  navHistory: NAVData[],
  benchmarkReturns?: number[]
): VolatilityMetrics {
  const returns = calculateDailyReturns(navHistory);
  const stdDev = calculateStandardDeviation(returns);
  const annualizedStdDev = stdDev * Math.sqrt(252); // 252 trading days in a year

  // Assuming risk-free rate of 3%
  const riskFreeRate = 3;
  const averageReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const sharpeRatio = (averageReturn - riskFreeRate) / stdDev;

  return {
    standardDeviation: annualizedStdDev,
    sharpeRatio,
    beta: benchmarkReturns
      ? calculateBeta(returns, benchmarkReturns)
      : undefined,
  };
}

function calculateDailyReturns(navHistory: NAVData[]): number[] {
  const returns = [];
  for (let i = 1; i < navHistory.length; i++) {
    const dailyReturn =
      (navHistory[i].nav - navHistory[i - 1].nav) / navHistory[i - 1].nav;
    returns.push(dailyReturn);
  }
  return returns;
}

function calculateStandardDeviation(returns: number[]): number {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const squaredDiffs = returns.map((r) => Math.pow(r - mean, 2));
  const variance =
    squaredDiffs.reduce((a, b) => a + b, 0) / (returns.length - 1);
  return Math.sqrt(variance);
}

function calculateBeta(returns: number[], benchmarkReturns: number[]): number {
  const covariance = calculateCovariance(returns, benchmarkReturns);
  const benchmarkVariance = calculateVariance(benchmarkReturns);
  return covariance / benchmarkVariance;
}

function calculateCovariance(a: number[], b: number[]): number {
  const meanA = a.reduce((sum, val) => sum + val, 0) / a.length;
  const meanB = b.reduce((sum, val) => sum + val, 0) / b.length;
  const products = a.map((val, i) => (val - meanA) * (b[i] - meanB));
  return products.reduce((sum, val) => sum + val, 0) / (a.length - 1);
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
}
