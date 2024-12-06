// src/lib/calculations/basket.ts
import { NAVData } from "@/lib/types/calculations";

interface FundAllocation {
  fundId: string;
  allocation: number;
}

interface BasketNAV {
  date: Date;
  nav: number;
}

interface FundMetrics {
  returns: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
}

// Helper function to calculate individual fund metrics
function calculateFundMetrics(navHistory: NAVData[]): number {
  if (navHistory.length < 2) return 0;

  const firstNAV = Number(navHistory[0].nav);
  const lastNAV = Number(navHistory[navHistory.length - 1].nav);
  return ((lastNAV - firstNAV) / firstNAV) * 100;
}

export function calculateBasketMetrics(
  fundsData: Array<{ navHistory: NAVData[] }>,
  allocations: FundAllocation[]
): FundMetrics {
  if (
    !fundsData.length ||
    !allocations.length ||
    fundsData.some((fund) => fund.navHistory.length < 2)
  ) {
    return {
      returns: 0,
      annualizedReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      volatility: 0,
    };
  }

  // Calculate weighted returns
  const weightedReturn = fundsData.reduce((total, fund, index) => {
    const fundReturn = calculateFundMetrics(fund.navHistory);
    const weight = allocations[index].allocation / 100;
    return total + fundReturn * weight;
  }, 0);

  // Calculate basket NAV history for other metrics
  const basketNAVs = calculateBasketNAV(fundsData, allocations);

  // Calculate daily returns for volatility and Sharpe ratio
  const dailyReturns: number[] = [];
  for (let i = 1; i < basketNAVs.length; i++) {
    const dailyReturn =
      (basketNAVs[i].nav - basketNAVs[i - 1].nav) / basketNAVs[i - 1].nav;
    dailyReturns.push(dailyReturn);
  }

  // Calculate volatility (annualized)
  const volatility =
    Math.sqrt(
      dailyReturns.reduce((sum, ret) => sum + ret * ret, 0) /
        dailyReturns.length
    ) *
    Math.sqrt(252) *
    100;

  // Calculate max drawdown
  console.log("Starting drawdown calculation...");
  let maxDrawdown = 0;
  let peak = basketNAVs[0].nav;

  /*console.log(
    "Initial basket NAVs:",
    basketNAVs.slice(0, 5).map((nav) => ({
      date: nav.date,
      nav: nav.nav,
    }))
  );*/
  console.log("Initial peak:", peak);

  basketNAVs.forEach((basketNav) => {
    const { nav } = basketNav;

    // Only update peak if we find a higher value
    if (nav > peak) {
      //console.log(`New peak found: Previous=${peak}, New=${nav}`);
      peak = nav;
    }

    // Calculate drawdown from current peak
    const drawdown = ((peak - nav) / peak) * 100;

    // Update max drawdown if current drawdown is larger
    if (drawdown > maxDrawdown) {
      /*console.log(
        `New max drawdown: ${drawdown.toFixed(
          2
        )}% (Peak: ${peak}, Current NAV: ${nav})`
      );*/
      maxDrawdown = drawdown;
    }
  });

  console.log("Final max drawdown:", maxDrawdown);

  // Calculate annualized return
  const firstNAV = basketNAVs[0].nav;
  const lastNAV = basketNAVs[basketNAVs.length - 1].nav;
  const totalReturn = ((lastNAV - firstNAV) / firstNAV) * 100;

  // Calculate years between first and last NAV
  const yearsFraction =
    (new Date(basketNAVs[basketNAVs.length - 1].date).getTime() -
      new Date(basketNAVs[0].date).getTime()) /
    (365 * 24 * 60 * 60 * 1000);

  // Calculate annualized return
  const annualizedReturn =
    (Math.pow(1 + totalReturn / 100, 1 / yearsFraction) - 1) * 100;

  // Calculate Sharpe ratio (assuming risk-free rate of 6%)
  const riskFreeRate = 0.06;
  const averageDailyReturn =
    dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
  const annualizedReturnForSharpe = (1 + averageDailyReturn) ** 252 - 1;
  const sharpeRatio =
    (annualizedReturnForSharpe - riskFreeRate) / (volatility / 100);

  return {
    returns: weightedReturn,
    annualizedReturn,
    maxDrawdown,
    sharpeRatio: sharpeRatio,
    volatility,
  };
}

export function filterNavHistoryByPeriod(
  navHistory: NAVData[],
  period: "1Y" | "3Y" | "5Y"
): NAVData[] {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "1Y":
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case "3Y":
      startDate.setFullYear(endDate.getFullYear() - 3);
      break;
    case "5Y":
      startDate.setFullYear(endDate.getFullYear() - 5);
      break;
  }

  return navHistory.filter((nav) => {
    const navDate = new Date(nav.date);
    return navDate >= startDate && navDate <= endDate;
  });
}

export function calculateBasketNAV(
  fundsData: Array<{ navHistory: NAVData[] }>,
  allocations: FundAllocation[]
): BasketNAV[] {
  // Get dates where we have NAV data for all funds
  const allDates = new Set<string>();
  fundsData[0].navHistory.forEach((nav) => {
    const dateStr = nav.date.toISOString().split("T")[0];
    // Only add dates where all funds have NAV data
    if (
      fundsData.every((fund) =>
        fund.navHistory.some(
          (n) => n.date.toISOString().split("T")[0] === dateStr
        )
      )
    ) {
      allDates.add(dateStr);
    }
  });

  // Convert to array and sort
  const sortedDates = Array.from(allDates).sort();

  // Calculate basket NAV for each date
  return sortedDates.map((dateStr) => {
    const date = new Date(dateStr);
    let basketNav = 0;

    fundsData.forEach((fund, index) => {
      const allocation = allocations[index].allocation / 100;
      const navForDate = fund.navHistory.find(
        (nav) => nav.date.toISOString().split("T")[0] === dateStr
      );

      if (navForDate) {
        basketNav += Number(navForDate.nav) * allocation;
      }
    });

    // Add debug logging
    /*console.log(
      `Date: ${dateStr}, Basket NAV: ${basketNav}, Components:`,
      fundsData.map((fund, i) => ({
        allocation: allocations[i].allocation,
        nav: fund.navHistory.find(
          (n) => n.date.toISOString().split("T")[0] === dateStr
        )?.nav,
      }))
    );*/

    return { date, nav: basketNav };
  });
}
