import { NAVData, VolatilityMetrics } from "@/lib/types/calculations";

export function calculateVolatilityMetrics(
  navHistory: NAVData[],
  benchmarkReturns?: number[]
): VolatilityMetrics {
  validateNAVData(navHistory);

  // Calculate daily returns
  const dailyReturns: number[] = [];
  for (let i = 1; i < navHistory.length; i++) {
    const dailyReturn =
      (navHistory[i].nav - navHistory[i - 1].nav) / navHistory[i - 1].nav;
    dailyReturns.push(dailyReturn);
  }

  // Calculate standard deviation
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const squaredDiffs = dailyReturns.map((r) => Math.pow(r - mean, 2));
  const variance =
    squaredDiffs.reduce((a, b) => a + b, 0) / (dailyReturns.length - 1);
  const stdDev = Math.sqrt(variance);

  // Annualize the standard deviation
  const annualizedStdDev = stdDev * Math.sqrt(252);

  // Calculate returns
  const latestNAV = navHistory[navHistory.length - 1].nav;
  const initialNAV = navHistory[0].nav;
  const totalReturn = (latestNAV - initialNAV) / initialNAV;

  const years =
    (navHistory[navHistory.length - 1].date.getTime() -
      navHistory[0].date.getTime()) /
    (365 * 24 * 60 * 60 * 1000);

  const annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1;

  // Lower risk-free rate to be more in line with current rates
  const riskFreeRate = 0.06; // 6%

  // Set minimum volatility to avoid division by very small numbers
  const volatilityForSharpe = Math.max(annualizedStdDev, 0.02); // Minimum 2%

  const sharpeRatio = (annualizedReturn - riskFreeRate) / volatilityForSharpe;

  // Add debugging
  console.log("Sharpe Ratio Calculation:", {
    totalReturn,
    years,
    annualizedReturn,
    riskFreeRate,
    stdDev,
    annualizedStdDev,
    volatilityForSharpe,
    sharpeRatio,
  });

  // Cap the Sharpe ratio to reasonable bounds
  const cappedSharpeRatio = Math.max(Math.min(sharpeRatio, 5), -5);

  return {
    standardDeviation: annualizedStdDev * 100, // Convert to percentage
    sharpeRatio: Number.isFinite(cappedSharpeRatio) ? cappedSharpeRatio : 0,
    beta: benchmarkReturns
      ? calculateBeta(dailyReturns, benchmarkReturns)
      : undefined,
  };
}

function calculateBeta(returns: number[], benchmarkReturns: number[]): number {
  if (returns.length !== benchmarkReturns.length) {
    throw new Error("Returns and benchmark returns must have the same length");
  }
  const covariance = calculateCovariance(returns, benchmarkReturns);
  const benchmarkVariance = calculateVariance(benchmarkReturns);
  return benchmarkVariance !== 0 ? covariance / benchmarkVariance : NaN;
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

function validateNAVData(navHistory: NAVData[]) {
  if (!navHistory || navHistory.length < 2) {
    throw new Error("Insufficient NAV data for calculations");
  }
  if (navHistory.some((entry) => isNaN(entry.nav))) {
    throw new Error("Invalid NAV data: contains non-numeric values");
  }
}

function calculateStandardDeviation(returns: number[]): number {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const squaredDiffs = returns.map((r) => Math.pow(r - mean, 2));
  const variance =
    squaredDiffs.reduce((a, b) => a + b, 0) / (returns.length - 1);
  return Math.sqrt(variance);
}
