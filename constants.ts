import { OKR, RetailPrice, AllAssumptions, InventoryLedgerItem, CashJournalEntry, SalesLedgerEntry, ActivityLogEntry, DetailedFinancialData, ProductSKU, KeyMetric, FinancialData } from './types';

export const DATA_VERSION = "1.0.0";
export const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const PRODUCT_SKUS: ProductSKU[] = [
    { sku: 'COF-ARA-250', productName: 'Arabica Coffee 250g', massKgs: 0.25 },
    { sku: 'COF-ROB-250', productName: 'Robusta Coffee 250g', massKgs: 0.25 },
    { sku: 'COF-ARA-1000', productName: 'Arabica Coffee 1kg', massKgs: 1.0 },
];

export const KEY_METRICS: KeyMetric[] = [
    { name: 'Customer Acquisition Cost (CAC)', category: 'Marketing', formula: 'Total Marketing Spend / New Customers' },
    { name: 'Customer Lifetime Value (LTV)', category: 'Marketing', formula: 'Avg. Revenue Per Customer * Avg. Customer Lifetime' },
    { name: 'Burn Rate', category: 'Financial Health', formula: 'Cash at Start - Cash at End' },
];

export const JOURNAL_CATEGORIES: Record<string, string[]> = {
    'Operating Expenses': [
        'OpEx: Marketing & Sales',
        'OpEx: Logistics & Distribution',
        'OpEx: Salaries & Wages',
        'OpEx: Rent & Utilities',
        'OpEx: Other',
    ],
    'Investing Activities': [
        'Investing: Startup Cost',
        'Investing: Asset Purchase',
    ],
    'Financing Activities': [
        'Financing: Equity',
        'Financing: Debt',
    ],
};


export const INITIAL_OKRS: OKR[] = [
    { id: 1, objective: 'Achieve Product-Market Fit', keyResults: [
        { id: 1, name: 'Net Revenue', target: 250000, current: 75000, unit: '€' },
        { id: 2, name: 'Gross Margin', target: 45, current: 38, unit: '%' },
    ]},
];

export const INITIAL_PRICING: RetailPrice = {
    grams250: 10, grams500: 18, kilo1: 35, kilos5: 150,
    subscription250: 9, subscription500: 16, subscription1000: 32, subscription5000: 140
};

export const INITIAL_ASSUMPTIONS: AllAssumptions = {
    cogs: {
        greenBeanCostPerKiloUGX: 10000,
        roastingCostPerKiloUGX: 5000,
        packagingCostPer250grUGX: 1000,
        shippingCostPerKgUSD: 5,
        insurancePerKgUSD: 0.5,
        portHandlingEUR: 100,
        fulfillmentPerOrderEU: 2.5,
    },
    startup: {
        items: [
            { name: 'Tickets', budget: 450 },
            { name: 'Lodging', budget: 5000 },
            { name: 'Food', budget: 2000 },
            { name: 'Sales visits', budget: 3000 },
            { name: 'Legal (BV incorporation)', budget: 2500 },
            { name: 'Shop design', budget: 5000 },
            { name: 'Technology costs', budget: 2500 },
            { name: 'Content creation', budget: 25000 },
        ]
    },
    forex: { eurToUgx: 4100, ugxToUsd: 0.00027, usdToEur: 0.92, ugxToEur: 0.00025 },
    exogenous: {
        corporateTaxRateLow: 19, corporateTaxRateHigh: 25.8, inflation: 2,
        vatLow: 9, vatHigh: 21, importDuty: 0, exciseDuty: 0.5, vatCoffeeShops: 9
    },
    webshop: {
        cac: 15, aovInclVat: 30, aovExclVat: 27.5, avgOrderMass: 0.75, cagr: 50, supportOptInRate: 10
    },
    retail: { cagr: 30, discountPercentage: 20, assumedStartingOrderKg: 10, startingAccounts: 5, avgSalesPerAccountYear: 5000 },
    horeca: { cagr: 20, discountPercentage: 25, assumedStartingOrderKg: 20, startingAccounts: 2 },
    company: {
        owners: { dividendsPayoutRatio: 50 },
        marketing: { salesPersonnelSalary: 3000, tradeShowBudgetPercent: 2, prBrandingBudgetPercent: 3 },
        logistics: { warehousingCostMonth: 500, localDeliveryCostShipment: 5 },
        otherExpenses: { managementSalaryMonthUGX: 8000000, adminSalaryMonthUGX: 4000000, rentOfficeMonth: 1000, techSoftwareMonth: 250, profFeesMonth: 300, otherExpensesMonth: 200 },
    },
    shopMetrics: {
        2025: { visitors: 15000, conversionRate: 2.5, newCustomers: 375, returningCustomers: 100, totalOrders: 475, churnRate: 8 },
        2026: { visitors: 22500, conversionRate: 3, newCustomers: 675, returningCustomers: 200, totalOrders: 875, churnRate: 6 },
        2027: { visitors: 33750, conversionRate: 3.5, newCustomers: 1181, returningCustomers: 400, totalOrders: 1581, churnRate: 5 },
        2028: { visitors: 50625, conversionRate: 4, newCustomers: 2025, returningCustomers: 800, totalOrders: 2825, churnRate: 4 },
        2029: { visitors: 75938, conversionRate: 4.5, newCustomers: 3417, returningCustomers: 1600, totalOrders: 5017, churnRate: 3 },
        2030: { visitors: 113906, conversionRate: 5, newCustomers: 5695, returningCustomers: 3200, totalOrders: 8895, churnRate: 2 },
    }
};

export const INITIAL_INVENTORY_LEDGER: InventoryLedgerItem[] = [];
export const INITIAL_CASH_JOURNAL: CashJournalEntry[] = [];
export const INITIAL_SALES_LEDGER: SalesLedgerEntry[] = [];
export const INITIAL_ACTIVITY_LOG: ActivityLogEntry[] = [];

const getEmptyFinancialData = (): FinancialData => {
    return JSON.parse(JSON.stringify({
        incomeStatement: { revenue: { online: 0, retail: 0, horeca: 0, total: 0 }, cogs: 0, grossProfit: 0, operatingExpenses: { marketingAndSales: 0, logisticsAndDistribution: 0, salariesAndWages: 0, rentAndUtilities: 0, techAndSoftware: 0, professionalFees: 0, depreciation: 0, other: 0, total: 0 }, operatingIncome: 0, interestExpense: 0, incomeBeforeTaxes: 0, incomeTaxExpense: 0, netIncome: 0 },
        cashFlow: { operatingActivities: { netIncome: 0, depreciation: 0, changeInAccountsReceivable: 0, changeInInventory: 0, changeInAccountsPayable: 0, changeInAccruedExpenses: 0, changeInVatPayable: 0, changeInDeferredTaxes: 0, netCash: 0 }, investingActivities: { purchaseOfFixedAssets: 0, capitalizedStartupCosts: 0, netCash: 0 }, financingActivities: { netIncreaseFromBorrowings: 0, repaymentOfLoans: 0, equityContributions: 0, dividendsPaid: 0, netCash: 0 }, netChangeInCash: 0, cashAtBeginningOfYear: 0, cashAtEndOfYear: 0 },
        balanceSheet: { assets: { current: { cash: 0, accountsReceivable: 0, inventory: 0, total: 0 }, nonCurrent: { fixedAssets: 0, intangibleAssets: 0, accumulatedDepreciation: 0, netBookValue: 0, other: 0, total: 0 }, total: 0 }, liabilitiesAndEquity: { liabilities: { current: { accountsPayable: 0, shortTermDebt: 0, accruedExpenses: 0, vatPayable: 0, deferredTaxes: 0, dividendsPayable: 0, total: 0 }, nonCurrent: { longTermDebt: 0, total: 0 }, total: 0 }, equity: { shareCapital: 0, retainedEarnings: 0, total: 0 }, total: 0 } },
        mass: { online: 0, retail: 0, horeca: 0, total: 0 }
    }));
};

const INCOME_STATEMENT_DATA = {
    revenue: {
        online: [22931, 660418, 1073180, 1444665, 1934819, 2579759],
        retail: [52633, 680856, 733962, 791212, 852926, 919454],
        horeca: [4033, 49754, 51147, 52579, 54051, 55565],
    },
    cogs: [2751, 442001, 579613, 706787, 869672, 1078785],
    operatingExpenses: {
        marketingAndSales: [62980, 205151, 233914, 247323, 298278, 364301],
        logisticsAndDistribution: [5500, 141600, 222600, 295500, 391688, 518250],
        salariesAndWages: [24947, 99789, 99789, 99789, 99789, 99789],
        rentAndUtilities: [500, 6000, 6000, 6000, 6000, 6000],
        techAndSoftware: [1500, 18000, 18000, 18000, 18000, 18000],
        professionalFees: [500, 6000, 6000, 6000, 6000, 6000],
        depreciation: [5775, 23100, 17325, 0, 0, 0],
        other: [300, 3600, 3600, 3600, 3600, 3600],
    },
    interestExpense: [2185, 6700, 3127, 172, 0, 0],
    incomeTaxExpense: [0, 99684, 158827, 219964, 282783, 363094]
};

const BALANCE_SHEET_DATA = {
    accountsReceivable: [3271, 57166, 76368, 94046, 116786, 146087],
    inventory: [4551, 79529, 106244, 130837, 162474, 203237],
    fixedAssets: [0, 0, 0, 0, 0, 0],
    intangibleAssets: [46200, 46200, 46200, 46200, 46200, 46200],
    accumulatedDepreciation: [-5775, -28875, -46200, -46200, -46200, -46200],
    otherNonCurrentAssets: [0, 0, 0, 0, 0, 0],
    accountsPayable: [226, 36329, 47639, 58092, 71480, 88667],
    shortTermDebt: [28173, 31747, 8547, 0, 0, 0],
    accruedExpenses: [0, 0, 0, 0, 0, 0],
    vatPayable: [371, 5835, 7316, 8713, 10462, 12663],
    deferredTaxes: [0, 99684, 158827, 219964, 282783, 363094],
    dividendsPayable: [25974, 322432, 484020, 651056, 822688, 1042111],
    longTermDebt: [40293, 8547, 0, 0, 0, 0],
    shareCapital: [0, 0, 0, 0, 0, 0],
};

const CASH_FLOW_DATA = {
    depreciation: [5775, 23100, 17325, 0, 0, 0],
    changesInAccountsReceivable: [-3271, -53894, -19203, -17678, -22740, -29301],
    changesInInventory: [-4551, -74978, -26715, -24594, -31636, -40763],
    changesInAccountsPayable: [226, 36103, 11310, 10453, 13388, 17187],
    changesInAccruedExpenses: [0, 0, 0, 0, 0, 0],
    changesInVatPayable: [371, 5463, 1481, 1397, 1749, 2201],
    changesInDeferredTaxes: [0, 99684, 59143, 61137, 62819, 80311],
    purchaseOfFixedAssets: [0, 0, 0, 0, 0, 0],
    capitalizedStartupCosts: [-46200, 0, 0, 0, 0, 0],
    netIncreaseFromBorrowings: [75000, 0, 0, 0, 0, 0],
    repaymentOfLoans: [-6533, -28173, -31747, -8547, 0, 0],
    equityContributions: [0, 0, 0, 0, 0, 0],
    dividendsPaid: [0, -25974, -322432, -484020, -651056, -822688],
};


const generateInitialBudgetFromData = (): DetailedFinancialData => {
    const data: DetailedFinancialData = {};
    YEARS.forEach((year, i) => {
        const yearSummary = getEmptyFinancialData();
        
        // --- Populate Income Statement ---
        const IS = yearSummary.incomeStatement;
        IS.revenue.online = INCOME_STATEMENT_DATA.revenue.online[i];
        IS.revenue.retail = INCOME_STATEMENT_DATA.revenue.retail[i];
        IS.revenue.horeca = INCOME_STATEMENT_DATA.revenue.horeca[i];
        IS.cogs = INCOME_STATEMENT_DATA.cogs[i];
        Object.assign(IS.operatingExpenses, {
            marketingAndSales: INCOME_STATEMENT_DATA.operatingExpenses.marketingAndSales[i],
            logisticsAndDistribution: INCOME_STATEMENT_DATA.operatingExpenses.logisticsAndDistribution[i],
            salariesAndWages: INCOME_STATEMENT_DATA.operatingExpenses.salariesAndWages[i],
            rentAndUtilities: INCOME_STATEMENT_DATA.operatingExpenses.rentAndUtilities[i],
            techAndSoftware: INCOME_STATEMENT_DATA.operatingExpenses.techAndSoftware[i],
            professionalFees: INCOME_STATEMENT_DATA.operatingExpenses.professionalFees[i],
            depreciation: INCOME_STATEMENT_DATA.operatingExpenses.depreciation[i],
            other: INCOME_STATEMENT_DATA.operatingExpenses.other[i],
        });
        IS.interestExpense = INCOME_STATEMENT_DATA.interestExpense[i];
        IS.incomeTaxExpense = INCOME_STATEMENT_DATA.incomeTaxExpense[i];
        
        // --- Populate Cash Flow ---
        const CF = yearSummary.cashFlow;
        Object.assign(CF.operatingActivities, {
            depreciation: CASH_FLOW_DATA.depreciation[i],
            changeInAccountsReceivable: CASH_FLOW_DATA.changesInAccountsReceivable[i],
            changeInInventory: CASH_FLOW_DATA.changesInInventory[i],
            changeInAccountsPayable: CASH_FLOW_DATA.changesInAccountsPayable[i],
            changeInAccruedExpenses: CASH_FLOW_DATA.changesInAccruedExpenses[i],
            changeInVatPayable: CASH_FLOW_DATA.changesInVatPayable[i],
            changeInDeferredTaxes: CASH_FLOW_DATA.changesInDeferredTaxes[i],
        });
        Object.assign(CF.investingActivities, {
            purchaseOfFixedAssets: CASH_FLOW_DATA.purchaseOfFixedAssets[i],
            capitalizedStartupCosts: CASH_FLOW_DATA.capitalizedStartupCosts[i],
        });
         Object.assign(CF.financingActivities, {
            netIncreaseFromBorrowings: CASH_FLOW_DATA.netIncreaseFromBorrowings[i],
            repaymentOfLoans: CASH_FLOW_DATA.repaymentOfLoans[i],
            equityContributions: CASH_FLOW_DATA.equityContributions[i],
            dividendsPaid: CASH_FLOW_DATA.dividendsPaid[i],
        });

        // --- Populate Balance Sheet ---
        const BS = yearSummary.balanceSheet;
        BS.assets.current.accountsReceivable = BALANCE_SHEET_DATA.accountsReceivable[i];
        BS.assets.current.inventory = BALANCE_SHEET_DATA.inventory[i];
        BS.assets.nonCurrent.fixedAssets = BALANCE_SHEET_DATA.fixedAssets[i];
        BS.assets.nonCurrent.intangibleAssets = BALANCE_SHEET_DATA.intangibleAssets[i];
        BS.assets.nonCurrent.accumulatedDepreciation = BALANCE_SHEET_DATA.accumulatedDepreciation[i];
        BS.assets.nonCurrent.other = BALANCE_SHEET_DATA.otherNonCurrentAssets[i];
        BS.liabilitiesAndEquity.liabilities.current = {
            accountsPayable: BALANCE_SHEET_DATA.accountsPayable[i],
            shortTermDebt: BALANCE_SHEET_DATA.shortTermDebt[i],
            accruedExpenses: BALANCE_SHEET_DATA.accruedExpenses[i],
            vatPayable: BALANCE_SHEET_DATA.vatPayable[i],
            deferredTaxes: BALANCE_SHEET_DATA.deferredTaxes[i],
            dividendsPayable: BALANCE_SHEET_DATA.dividendsPayable[i],
            total: 0 // Will be calculated
        };
        BS.liabilitiesAndEquity.liabilities.nonCurrent.longTermDebt = BALANCE_SHEET_DATA.longTermDebt[i];
        BS.liabilitiesAndEquity.equity.shareCapital = BALANCE_SHEET_DATA.shareCapital[i];
        
        // --- Calculate Totals & Links ---
        // IS
        IS.revenue.total = IS.revenue.online + IS.revenue.retail + IS.revenue.horeca;
        IS.grossProfit = IS.revenue.total - IS.cogs;
        IS.operatingExpenses.total = Object.values(IS.operatingExpenses).reduce((s, v) => s + v, 0) - IS.operatingExpenses.total;
        IS.operatingIncome = IS.grossProfit - IS.operatingExpenses.total;
        IS.incomeBeforeTaxes = IS.operatingIncome - IS.interestExpense;
        IS.netIncome = IS.incomeBeforeTaxes - IS.incomeTaxExpense;

        // CF
        CF.operatingActivities.netIncome = IS.netIncome;
        CF.operatingActivities.netCash = Object.values(CF.operatingActivities).reduce((s, v) => s + v, 0) - CF.operatingActivities.netCash;
        CF.investingActivities.netCash = CF.investingActivities.purchaseOfFixedAssets + CF.investingActivities.capitalizedStartupCosts;
        CF.financingActivities.netCash = CF.financingActivities.netIncreaseFromBorrowings + CF.financingActivities.repaymentOfLoans + CF.financingActivities.equityContributions + CF.financingActivities.dividendsPaid;
        CF.netChangeInCash = CF.operatingActivities.netCash + CF.investingActivities.netCash + CF.financingActivities.netCash;
        CF.cashAtBeginningOfYear = (i > 0 ? data[year - 1].summary.cashFlow.cashAtEndOfYear : 0);
        CF.cashAtEndOfYear = CF.cashAtBeginningOfYear + CF.netChangeInCash;

        // BS
        BS.assets.current.cash = CF.cashAtEndOfYear;
        BS.assets.current.total = BS.assets.current.cash + BS.assets.current.accountsReceivable + BS.assets.current.inventory;
        BS.assets.nonCurrent.netBookValue = BS.assets.nonCurrent.fixedAssets + BS.assets.nonCurrent.intangibleAssets + BS.assets.nonCurrent.accumulatedDepreciation;
        BS.assets.nonCurrent.total = BS.assets.nonCurrent.netBookValue + BS.assets.nonCurrent.other;
        BS.assets.total = BS.assets.current.total + BS.assets.nonCurrent.total;
        
        const L = BS.liabilitiesAndEquity.liabilities;
        L.current.total = Object.values(L.current).reduce((s, v) => s + v, 0) - L.current.total;
        L.nonCurrent.total = L.nonCurrent.longTermDebt;
        L.total = L.current.total + L.nonCurrent.total;
        
        const E = BS.liabilitiesAndEquity.equity;
        E.retainedEarnings = (i > 0 ? data[year - 1].summary.balanceSheet.liabilitiesAndEquity.equity.retainedEarnings : 0) + IS.netIncome;
        E.total = E.shareCapital + E.retainedEarnings;
        
        BS.liabilitiesAndEquity.total = L.total + E.total;

        // Distribute yearly totals to months and weeks (simple equal distribution)
        const monthsData: any = {};
        for(let m = 1; m <= 12; m++) {
            const monthSummary = getEmptyFinancialData();
            const weeksData: any = {};
            
            Object.keys(yearSummary).forEach(sk => {
                Object.keys((yearSummary as any)[sk]).forEach(ck => {
                    if(typeof (yearSummary as any)[sk][ck] === 'object'){
                        Object.keys((yearSummary as any)[sk][ck]).forEach(subKey => {
                             (monthSummary as any)[sk][ck][subKey] = (yearSummary as any)[sk][ck][subKey] / 12;
                        });
                    } else {
                        (monthSummary as any)[sk][ck] = (yearSummary as any)[sk][ck] / 12;
                    }
                })
            });

            for (let w = 1; w <= 4; w++) {
                const weekData = JSON.parse(JSON.stringify(monthSummary));
                Object.keys(weekData).forEach(sk => {
                    Object.keys((weekData as any)[sk]).forEach(ck => {
                        if(typeof (weekData as any)[sk][ck] === 'object'){
                            Object.keys((weekData as any)[sk][ck]).forEach(subKey => {
                                (weekData as any)[sk][ck][subKey] /= 4;
                            });
                        } else {
                            (weekData as any)[sk][ck] /= 4;
                        }
                    })
                });
                weeksData[w] = weekData;
            }
            monthsData[m] = { summary: monthSummary, weeks: weeksData };
        }
        data[year] = { summary: yearSummary, months: monthsData };
    });
    return data;
};

export const INITIAL_PLANNED_BUDGET: DetailedFinancialData = generateInitialBudgetFromData();