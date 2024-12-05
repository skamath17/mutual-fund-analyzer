// src/lib/calculations/returns.ts
import { NAVData, Period, ReturnMetrics } from "@/lib/types/calculations";

export function calculateReturns(
  navHistory: NAVData[],
  period: Period
): number {
  if (!navHistory || navHistory.length < 2) return 0;

  // Sort by date ascending
  const sortedData = [...navHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latestNAV = sortedData[sortedData.length - 1].nav;
  const periodStartDate = getPeriodStartDate(period);

  // Find closest NAV to period start date
  const startNAV = findClosestNAV(sortedData, periodStartDate);

  return ((latestNAV - startNAV) / startNAV) * 100;
}

function getPeriodStartDate(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "1M":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "3M":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "6M":
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case "1Y":
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case "3Y":
      return new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
    case "5Y":
      return new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    default:
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }
}

function findClosestNAV(navHistory: NAVData[], targetDate: Date): number {
  // Normalize target date to midnight UTC
  const normalizedTarget = new Date(targetDate);
  normalizedTarget.setUTCHours(0, 0, 0, 0);
  const target = normalizedTarget.getTime();

  // Find date bounds of our data
  const startDate = new Date(navHistory[0].date).getTime();
  const endDate = new Date(navHistory[navHistory.length - 1].date).getTime();

  // If target is outside our data range, use the closest boundary
  if (target < startDate) {
    console.log("Target date before data range, using earliest available date");
    return navHistory[0].nav;
  }
  if (target > endDate) {
    console.log("Target date after data range, using latest available date");
    return navHistory[navHistory.length - 1].nav;
  }

  // Find closest date within range
  const closest = navHistory.reduce((prev, curr) => {
    const prevTime = new Date(prev.date).setUTCHours(0, 0, 0, 0);
    const currTime = new Date(curr.date).setUTCHours(0, 0, 0, 0);

    const prevDiff = Math.abs(prevTime - target);
    const currDiff = Math.abs(currTime - target);

    return currDiff < prevDiff ? curr : prev;
  });

  return closest.nav;
}

export function calculateAllPeriodReturns(
  navHistory: NAVData[]
): Record<Period, ReturnMetrics> {
  const periods: Period[] = ["1M", "3M", "6M", "1Y", "3Y", "5Y"];

  const returns: Partial<Record<Period, ReturnMetrics>> = {};

  for (const period of periods) {
    returns[period] = calculateDetailedReturns(navHistory, period);
  }

  return returns as Record<Period, ReturnMetrics>;
}

export function calculateCAGR(
  startNAV: number,
  endNAV: number,
  years: number
): number {
  return (Math.pow(endNAV / startNAV, 1 / years) - 1) * 100;
}

export function calculateDetailedReturns(
  navHistory: NAVData[],
  period: Period
): ReturnMetrics {
  if (!navHistory || navHistory.length < 2) {
    console.log("Insufficient data");
    return {
      absoluteReturn: 0,
      annualizedReturn: 0,
      startDate: new Date(),
      endDate: new Date(),
      startNAV: 0,
      endNAV: 0,
      insufficientData: true,
    };
  }

  const sortedData = [...navHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const endDate = sortedData[sortedData.length - 1].date;
  const endNAV = sortedData[sortedData.length - 1].nav;
  const periodStartDate = getPeriodStartDate(period);

  // Check if we have enough historical data
  const earliestAvailableDate = new Date(sortedData[0].date);
  const requestedStartDate = new Date(periodStartDate);

  if (requestedStartDate < earliestAvailableDate) {
    return {
      absoluteReturn: 0,
      annualizedReturn: 0,
      startDate: requestedStartDate,
      endDate,
      startNAV: 0,
      endNAV,
      insufficientData: true,
    };
  }

  const startNAV = findClosestNAV(sortedData, periodStartDate);
  const absoluteReturn = ((endNAV - startNAV) / startNAV) * 100;
  const years = getYearsBetweenDates(periodStartDate, endDate);
  const annualizedReturn = calculateCAGR(startNAV, endNAV, years);

  return {
    absoluteReturn,
    annualizedReturn,
    startDate: periodStartDate,
    endDate,
    startNAV,
    endNAV,
    insufficientData: false,
  };
}

function getYearsBetweenDates(startDate: Date, endDate: Date): number {
  return (
    (endDate.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000)
  );
}
