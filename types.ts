// Fix: Removed circular dependencies and moved constants to constants.ts. Defined and exported all necessary types.
export type Granularity = 'Yearly' | 'Quarterly' | 'Monthly' | 'Weekly';
export type Currency = 'EUR' | 'USD' | 'UGX' | 'THB';

export interface ProductSKU {
    sku: string;
    productName: string;
    massKgs: number;
}

export interface KeyMetric {
    name: string;
    category: string;
    formula: string;
}

export interface KeyResult {
    id: number;
    name: string;
    target: number;
    current: number;
    unit: '€' | '%';
}

export interface OKR {
    id: number;
    objective: string;
    keyResults: KeyResult[];
}

export interface RetailPrice {
    grams250: number;
    grams500: number;
    kilo1: number;
    kilos5: number;
    subscription250: number;
    subscription500: number;
    subscription1000: number;
    subscription5000: number;
}

export interface StartupCostItem {
    name: string;
    budget: number;
}

export interface ShopMetricData {
    visitors: number;
    conversionRate: number;
    newCustomers: number;
    returningCustomers: number;
    totalOrders: number;
    churnRate: number;
}

export interface ShopMetrics {
    [year: number]: ShopMetricData;
}

export interface AllAssumptions {
    cogs: {
        greenBeanCostPerKiloUGX: number;
        roastingCostPerKiloUGX: number;
        packagingCostPer250grUGX: number;
        shippingCostPerKgUSD: number;
        insurancePerKgUSD: number;
        portHandlingEUR: number;
        fulfillmentPerOrderEU: number;
    };
    startup: {
        items: StartupCostItem[];
    };
    forex: {
        eurToUgx: number;
        ugxToUsd: number;
        usdToEur: number;
        ugxToEur: number;
    };
    exogenous: {
        corporateTaxRateLow: number;
        corporateTaxRateHigh: number;
        inflation: number;
        vatLow: number;
        vatHigh: number;
        importDuty: number;
        exciseDuty: number;
        vatCoffeeShops: number;
    };
    webshop: {
        cac: number;
        aovInclVat: number;
        aovExclVat: number;
        avgOrderMass: number;
        cagr: number;
        supportOptInRate: number;
    };
    wholesale: {
        cagr: number;
        discountPercentage: number;
        assumedStartingOrderKg: number;
        startingAccounts: number;
        avgSalesPerAccountYear: number;
    };
    horeca: {
        cagr: number;
        discountPercentage: number;
        assumedStartingOrderKg: number;
        startingAccounts: number;
    };
    company: {
        owners: { dividendsPayoutRatio: number };
        marketing: { salesPersonnelSalary: number, tradeShowBudgetPercent: number, prBrandingBudgetPercent: number };
        logistics: { warehousingCostMonth: number, localDeliveryCostShipment: number };
        otherExpenses: { managementSalaryMonthUGX: number, adminSalaryMonthUGX: number, rentOfficeMonth: number, techSoftwareMonth: number, profFeesMonth: number, otherExpensesMonth: number };
    };
    shopMetrics: ShopMetrics;
}


export interface FinancialData {
    incomeStatement: {
        revenue: { online: number, wholesale: number, horeca: number, total: number };
        cogs: number;
        grossProfit: number;
        operatingExpenses: {
            marketingAndSales: number;
            logisticsAndDistribution: number;
            salariesAndWages: number;
            rentAndUtilities: number;
            techAndSoftware: number;
            professionalFees: number;
            depreciation: number;
            other: number;
            total: number;
        };
        operatingIncome: number;
        interestExpense: number;
        incomeBeforeTaxes: number;
        incomeTaxExpense: number;
        netIncome: number;
    };
    cashFlow: {
        operatingActivities: {
            netIncome: number;
            depreciation: number;
            changeInAccountsReceivable: number;
            changeInInventory: number;
            changeInAccountsPayable: number;
            changeInAccruedExpenses: number;
            changeInVatPayable: number;
            changeInDeferredTaxes: number;
            netCash: number;
        };
        investingActivities: {
            purchaseOfFixedAssets: number;
            capitalizedStartupCosts: number;
            netCash: number;
        };
        financingActivities: {
            netIncreaseFromBorrowings: number;
            repaymentOfLoans: number;
            equityContributions: number;
            dividendsPaid: number;
            netCash: number;
        };
        netChangeInCash: number;
        cashAtBeginningOfYear: number;
        cashAtEndOfYear: number;
    };
    balanceSheet: {
        assets: {
            current: { cash: number, accountsReceivable: number, inventory: number, total: number };
            nonCurrent: { fixedAssets: number, intangibleAssets: number, accumulatedDepreciation: number, netBookValue: number, other: number, total: number };
            total: number;
        };
        liabilitiesAndEquity: {
            liabilities: {
                current: { accountsPayable: number, shortTermDebt: number, accruedExpenses: number, vatPayable: number, deferredTaxes: number, dividendsPayable: number, total: number };
                nonCurrent: { longTermDebt: number, total: number };
                total: number;
            };
            equity: {
                shareCapital: number;
                retainedEarnings: number;
                total: number;
            };
            total: number;
        };
    };
    mass: {
        online: number;
        wholesale: number;
        horeca: number;
        total: number;
    };
}

export interface DetailedFinancialData {
    [year: number]: {
        summary: FinancialData;
        months: {
            [month: number]: {
                summary: FinancialData;
                weeks: {
                    [week: number]: FinancialData;
                }
            }
        }
    };
}


export interface InventoryLedgerItem {
    id: string;
    sku: string;
    date: string;
    type: 'In' | 'Out';
    units: number;
    massKg: number;
    coffeeCost?: {
        amount: number;
        currency: Currency;
    };
    inboundLogisticsCost?: {
        amount: number;
        currency: Currency;
    };
    taxesAndFeesEUR?: number;
    landedCostPerKgEUR?: number;
    destination?: string;
    channel?: string;
    checked: boolean;
}

export interface CashJournalEntry {
    id: string;
    date: string;
    description: string;
    type: 'Inflow' | 'Outflow';
    amount: number;
    currency: Currency;
    category: string;
    subCategory?: string;
    remarks?: string;
}

export interface SalesLedgerEntry {
    id: string;
    orderDate: string;
    invoicePaidDate?: string;
    sku: string;
    units: number;
    unitPrice: number;
    channel: 'Sales - Online' | 'Sales - Wholesale' | 'Sales - HORECA';
    customerId: string;
    supportDonation?: number;
}

export interface ActivityLogEntry {
    id: string;
    date: string;
    type: string;
    value: number;
    notes: string;
}

export interface ExportData {
    version: string;
    plannedBudget: DetailedFinancialData;
    assumptionsData: AllAssumptions;
    okrs: OKR[];
    pricingData: RetailPrice;
    inventoryLedgerData: InventoryLedgerItem[];
    cashJournalData: CashJournalEntry[];
    salesLedgerData: SalesLedgerEntry[];
    activityLogData: ActivityLogEntry[];
}