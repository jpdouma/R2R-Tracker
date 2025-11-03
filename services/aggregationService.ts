import { DetailedFinancialData, FinancialData, SalesLedgerEntry, CashJournalEntry, InventoryLedgerItem, AllAssumptions } from '../types';
import { YEARS, MONTH_NAMES } from '../constants';

const getEmptyFinancialData = (): FinancialData => {
    // A deep copy is essential here to prevent shared state issues.
    return JSON.parse(JSON.stringify({
        incomeStatement: { revenue: { online: 0, retail: 0, horeca: 0, total: 0 }, cogs: 0, grossProfit: 0, operatingExpenses: { marketingAndSales: 0, logisticsAndDistribution: 0, salariesAndWages: 0, rentAndUtilities: 0, techAndSoftware: 0, professionalFees: 0, depreciation: 0, other: 0, total: 0 }, operatingIncome: 0, interestExpense: 0, incomeBeforeTaxes: 0, incomeTaxExpense: 0, netIncome: 0 },
        cashFlow: { operatingActivities: { netIncome: 0, depreciation: 0, changeInAccountsReceivable: 0, changeInInventory: 0, changeInAccountsPayable: 0, changeInAccruedExpenses: 0, changeInVatPayable: 0, changeInDeferredTaxes: 0, netCash: 0 }, investingActivities: { purchaseOfFixedAssets: 0, capitalizedStartupCosts: 0, netCash: 0 }, financingActivities: { netIncreaseFromBorrowings: 0, repaymentOfLoans: 0, equityContributions: 0, dividendsPaid: 0, netCash: 0 }, netChangeInCash: 0, cashAtBeginningOfYear: 0, cashAtEndOfYear: 0 },
        balanceSheet: { assets: { current: { cash: 0, accountsReceivable: 0, inventory: 0, total: 0 }, nonCurrent: { fixedAssets: 0, intangibleAssets: 0, accumulatedDepreciation: 0, netBookValue: 0, other: 0, total: 0 }, total: 0 }, liabilitiesAndEquity: { liabilities: { current: { accountsPayable: 0, shortTermDebt: 0, accruedExpenses: 0, vatPayable: 0, deferredTaxes: 0, dividendsPayable: 0, total: 0 }, nonCurrent: { longTermDebt: 0, total: 0 }, total: 0 }, equity: { shareCapital: 0, retainedEarnings: 0, total: 0 }, total: 0 } },
        mass: { online: 0, retail: 0, horeca: 0, total: 0 }
    }));
};

interface LedgerData {
    salesLedger: SalesLedgerEntry[];
    cashJournal: CashJournalEntry[];
    inventoryLedger: InventoryLedgerItem[];
}

export const aggregateActualsFromLedgers = (ledgers: LedgerData, assumptions: AllAssumptions): DetailedFinancialData => {
    const detailedData: DetailedFinancialData = {};

    YEARS.forEach(year => {
        const monthsData: any = {};
        for (let i = 1; i <= 12; i++) {
            const weeksData: any = {};
            for (let j = 1; j <= 4; j++) {
                weeksData[j] = getEmptyFinancialData();
            }
            monthsData[i] = { summary: getEmptyFinancialData(), weeks: weeksData };
        }
        detailedData[year] = { summary: getEmptyFinancialData(), months: monthsData };
    });

    // Process Sales Ledger for Revenue
    ledgers.salesLedger.forEach(sale => {
        // FIX: Changed `sale.date` to `sale.orderDate` to match the `SalesLedgerEntry` type definition.
        const date = new Date(sale.orderDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        // Fix: Corrected week calculation to prevent out-of-bounds access for dates late in the month.
        const week = Math.min(4, Math.floor((date.getDate() - 1) / 7) + 1);

        if (detailedData[year] && detailedData[year].months[month] && detailedData[year].months[month].weeks[week]) {
            const saleTotal = sale.units * sale.unitPrice;
            const weekData = detailedData[year].months[month].weeks[week];
            
            if (sale.channel === 'Sales - Online') weekData.incomeStatement.revenue.online += saleTotal;
            else if (sale.channel === 'Sales - Retail') weekData.incomeStatement.revenue.retail += saleTotal;
            else if (sale.channel === 'Sales - HORECA') weekData.incomeStatement.revenue.horeca += saleTotal;
        }
    });

     // Process Inventory Ledger for COGS
    ledgers.inventoryLedger.forEach(item => {
        if (item.type === 'Out') {
            const date = new Date(item.date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            // Fix: Corrected week calculation to prevent out-of-bounds access.
            const week = Math.min(4, Math.floor((date.getDate() - 1) / 7) + 1);

            if (detailedData[year] && detailedData[year].months[month] && detailedData[year].months[month].weeks[week]) {
                const weekData = detailedData[year].months[month].weeks[week];
                // Simplified COGS calculation - a real system would use FIFO/LIFO/Avg. Cost
                const avgCost = ledgers.inventoryLedger
                    .filter(i => i.type === 'In' && i.landedCostPerKgEUR)
                    .reduce((acc, i) => acc + i.landedCostPerKgEUR!, 0) / ledgers.inventoryLedger.filter(i => i.type === 'In').length || assumptions.cogs.shippingCostPerKgUSD * assumptions.forex.usdToEur + 5;
                
                weekData.incomeStatement.cogs += item.massKg * avgCost;
            }
        }
    });

    // Process Cash Journal for Expenses and Cash Flow
    ledgers.cashJournal.forEach(entry => {
        const date = new Date(entry.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        // Fix: Corrected week calculation to prevent out-of-bounds access.
        const week = Math.min(4, Math.floor((date.getDate() - 1) / 7) + 1);
        
        if (detailedData[year] && detailedData[year].months[month] && detailedData[year].months[month].weeks[week]) {
            const weekData = detailedData[year].months[month].weeks[week];
            const amount = entry.type === 'Inflow' ? entry.amount : -entry.amount;
            
            // Map categories to P&L and Cash Flow statements
            if(entry.category.startsWith('OpEx:')) {
                const key = entry.category.split(':')[1].trim();
                const opExMapping: { [key: string]: keyof FinancialData['incomeStatement']['operatingExpenses']} = {
                    'Marketing & Sales': 'marketingAndSales',
                    'Logistics & Distribution': 'logisticsAndDistribution',
                    'Salaries & Wages': 'salariesAndWages',
                };
                if(opExMapping[key]) weekData.incomeStatement.operatingExpenses[opExMapping[key]] += entry.amount;
                else weekData.incomeStatement.operatingExpenses.other += entry.amount;
            }

            weekData.cashFlow.netChangeInCash += amount;
        }
    });

    // Aggregate from weeks to months to years
    YEARS.forEach(year => {
        for (let m = 1; m <= 12; m++) {
            for (let w = 1; w <= 4; w++) {
                const weekData = detailedData[year].months[m].weeks[w];
                const monthSummary = detailedData[year].months[m].summary;
                
                // Recalculate totals for the week
                weekData.incomeStatement.revenue.total = weekData.incomeStatement.revenue.online + weekData.incomeStatement.revenue.retail + weekData.incomeStatement.revenue.horeca;
                weekData.incomeStatement.grossProfit = weekData.incomeStatement.revenue.total - weekData.incomeStatement.cogs;
                const opEx = weekData.incomeStatement.operatingExpenses;
                opEx.total = opEx.marketingAndSales + opEx.logisticsAndDistribution + opEx.salariesAndWages + opEx.rentAndUtilities + opEx.techAndSoftware + opEx.professionalFees + opEx.depreciation + opEx.other;
                weekData.incomeStatement.operatingIncome = weekData.incomeStatement.grossProfit - opEx.total;
                weekData.incomeStatement.netIncome = weekData.incomeStatement.operatingIncome - weekData.incomeStatement.interestExpense - weekData.incomeStatement.incomeTaxExpense;

                // Aggregate to month
                monthSummary.incomeStatement.revenue.total += weekData.incomeStatement.revenue.total;
                monthSummary.incomeStatement.netIncome += weekData.incomeStatement.netIncome;
                monthSummary.incomeStatement.grossProfit += weekData.incomeStatement.grossProfit;
                monthSummary.incomeStatement.operatingExpenses.total += weekData.incomeStatement.operatingExpenses.total;
                monthSummary.cashFlow.netChangeInCash += weekData.cashFlow.netChangeInCash;
            }
            const yearSummary = detailedData[year].summary;
            const monthSummary = detailedData[year].months[m].summary;
            
            // Aggregate to year
            yearSummary.incomeStatement.revenue.total += monthSummary.incomeStatement.revenue.total;
            yearSummary.incomeStatement.netIncome += monthSummary.incomeStatement.netIncome;
            yearSummary.incomeStatement.grossProfit += monthSummary.incomeStatement.grossProfit;
            yearSummary.incomeStatement.operatingExpenses.total += monthSummary.incomeStatement.operatingExpenses.total;
            yearSummary.cashFlow.netChangeInCash += monthSummary.cashFlow.netChangeInCash;
        }
         // Final Pass for cash at end of year and other cumulative metrics
        let cumulativeCash = 0;
        for (let m = 1; m <= 12; m++) {
            const monthSummary = detailedData[year].months[m].summary;
            monthSummary.cashFlow.cashAtBeginningOfYear = cumulativeCash;
            monthSummary.cashFlow.cashAtEndOfYear = cumulativeCash + monthSummary.cashFlow.netChangeInCash;
            cumulativeCash = monthSummary.cashFlow.cashAtEndOfYear;

            // Recalculate month summaries
            monthSummary.incomeStatement.operatingIncome = monthSummary.incomeStatement.grossProfit - monthSummary.incomeStatement.operatingExpenses.total;
        }

        const yearSummary = detailedData[year].summary;
        yearSummary.cashFlow.cashAtEndOfYear = cumulativeCash;
        yearSummary.incomeStatement.operatingIncome = yearSummary.incomeStatement.grossProfit - yearSummary.incomeStatement.operatingExpenses.total;
    });

    return detailedData;
};