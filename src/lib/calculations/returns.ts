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
      return new Date(now.setMonth(now.getMonth() - 1));
    case "3M":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "6M":
      return new Date(now.setMonth(now.getMonth() - 6));
    case "1Y":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case "3Y":
      return new Date(now.setFullYear(now.getFullYear() - 3));
    case "5Y":
      return new Date(now.setFullYear(now.getFullYear() - 5));
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
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
    };
  }

  const sortedData = [...navHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const endDate = sortedData[sortedData.length - 1].date;
  const endNAV = sortedData[sortedData.length - 1].nav;
  const periodStartDate = getPeriodStartDate(period);
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
  };
}

function getYearsBetweenDates(startDate: Date, endDate: Date): number {
  return (
    (endDate.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000)
  );
}
