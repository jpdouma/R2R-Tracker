import { DetailedFinancialData, FinancialData, Granularity } from '../types';
import { MONTH_NAMES } from '../constants';

const getEmptyFinancialData = (): FinancialData => {
    return JSON.parse(JSON.stringify({
        // FIX: Replaced 'wholesale' with 'retail' to match FinancialData type
        incomeStatement: { revenue: { online: 0, retail: 0, horeca: 0, total: 0 }, cogs: 0, grossProfit: 0, operatingExpenses: { marketingAndSales: 0, logisticsAndDistribution: 0, salariesAndWages: 0, rentAndUtilities: 0, techAndSoftware: 0, professionalFees: 0, depreciation: 0, other: 0, total: 0 }, operatingIncome: 0, interestExpense: 0, incomeBeforeTaxes: 0, incomeTaxExpense: 0, netIncome: 0 },
        cashFlow: { operatingActivities: { netIncome: 0, depreciation: 0, changeInAccountsReceivable: 0, changeInInventory: 0, changeInAccountsPayable: 0, changeInAccruedExpenses: 0, changeInVatPayable: 0, changeInDeferredTaxes: 0, netCash: 0 }, investingActivities: { purchaseOfFixedAssets: 0, capitalizedStartupCosts: 0, netCash: 0 }, financingActivities: { netIncreaseFromBorrowings: 0, repaymentOfLoans: 0, equityContributions: 0, dividendsPaid: 0, netCash: 0 }, netChangeInCash: 0, cashAtBeginningOfYear: 0, cashAtEndOfYear: 0 },
        balanceSheet: { assets: { current: { cash: 0, accountsReceivable: 0, inventory: 0, total: 0 }, nonCurrent: { fixedAssets: 0, intangibleAssets: 0, accumulatedDepreciation: 0, netBookValue: 0, other: 0, total: 0 }, total: 0 }, liabilitiesAndEquity: { liabilities: { current: { accountsPayable: 0, shortTermDebt: 0, accruedExpenses: 0, vatPayable: 0, deferredTaxes: 0, dividendsPayable: 0, total: 0 }, nonCurrent: { longTermDebt: 0, total: 0 }, total: 0 }, equity: { shareCapital: 0, retainedEarnings: 0, total: 0 }, total: 0 } },
        // FIX: Replaced 'wholesale' with 'retail' to match FinancialData type
        mass: { online: 0, retail: 0, horeca: 0, total: 0 }
    }));
};

export const aggregateFinancialData = (
    data: DetailedFinancialData,
    year: number,
    granularity: Granularity,
    subPeriod: number
): FinancialData => {
    const yearData = data[year];
    if (!yearData) {
        return getEmptyFinancialData();
    }

    switch (granularity) {
        case 'Yearly':
            return yearData.summary;
        case 'Monthly':
            return yearData.months[subPeriod]?.summary || getEmptyFinancialData();
        case 'Weekly':
            const monthForWeek = Math.ceil(subPeriod / 4);
            const weekInMonth = ((subPeriod - 1) % 4) + 1;
            return yearData.months[monthForWeek]?.weeks[weekInMonth] || getEmptyFinancialData();
        case 'Quarterly':
            const startMonth = (subPeriod - 1) * 3 + 1;
            const endMonth = startMonth + 2;
            let quarterlyData = getEmptyFinancialData();
            for (let m = startMonth; m <= endMonth; m++) {
                const monthData = yearData.months[m]?.summary;
                if (monthData) {
                    // A full implementation would recursively sum all properties.
                    // This simplified version sums the key metrics for display.
                    quarterlyData.incomeStatement.revenue.total += monthData.incomeStatement.revenue.total;
                    quarterlyData.incomeStatement.netIncome += monthData.incomeStatement.netIncome;
                    quarterlyData.incomeStatement.grossProfit += monthData.incomeStatement.grossProfit;
                    quarterlyData.incomeStatement.operatingExpenses.total += monthData.incomeStatement.operatingExpenses.total;
                    quarterlyData.cashFlow.netChangeInCash += monthData.cashFlow.netChangeInCash;
                    // Copy all values from the last month for a more complete object
                    if (m === endMonth) {
                       quarterlyData = {...monthData, ...quarterlyData}; // Keep aggregated values
                       quarterlyData.cashFlow.cashAtEndOfYear = monthData.cashFlow.cashAtEndOfYear;
                    }
                }
            }
            return quarterlyData;
        default:
            return getEmptyFinancialData();
    }
};

const getWeekSunday = (year: number, weekNum: number): string => {
    const monthIndex = Math.floor((weekNum - 1) / 4);
    const weekInMonth = (weekNum - 1) % 4;
    const approxDay = (weekInMonth + 1) * 7;
    
    const date = new Date(year, monthIndex, approxDay);
    const dayOfWeek = date.getDay(); // 0 is Sunday
    
    const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    date.setDate(date.getDate() + daysToAdd);
    
    const month = MONTH_NAMES[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${month}/${day}/${year}`;
}

export const getPeriodLabel = (
    year: number,
    granularity: Granularity,
    subPeriod: number
): string => {
    switch (granularity) {
        case 'Yearly':
            return `${year}`;
        case 'Quarterly':
            return `Q${subPeriod} ${year}`;
        case 'Monthly':
            return `${MONTH_NAMES[subPeriod - 1]} ${year}`;
        case 'Weekly':
            return `Week of ${getWeekSunday(year, subPeriod)}`;
        default:
            return `${year}`;
    }
};