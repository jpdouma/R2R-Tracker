import React, { createContext, useState, useMemo, useContext, PropsWithChildren } from 'react';
import { Granularity, OKR, RetailPrice, AllAssumptions, InventoryLedgerItem, CashJournalEntry, SalesLedgerEntry, ActivityLogEntry, DetailedFinancialData, FinancialData, ProductSKU, ExportData } from '../types';
import { YEARS, INITIAL_PLANNED_BUDGET, INITIAL_OKRS, INITIAL_PRICING, INITIAL_ASSUMPTIONS, INITIAL_INVENTORY_LEDGER, INITIAL_CASH_JOURNAL, PRODUCT_SKUS, INITIAL_SALES_LEDGER, INITIAL_ACTIVITY_LOG } from '../constants';
import { aggregateFinancialData, getPeriodLabel } from '../utils/dataUtils';
import { aggregateActualsFromLedgers } from '../services/aggregationService';

// Define the shape of the context data
interface DataContextType {
    // View state
    selectedYear: number;
    setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
    granularity: Granularity;
    setGranularity: React.Dispatch<React.SetStateAction<Granularity>>;
    subPeriod: number;
    setSubPeriod: React.Dispatch<React.SetStateAction<number>>;

    // Pillar 1: The Plan (Static for now, but could be made editable)
    plannedBudget: DetailedFinancialData;
    setPlannedBudget: React.Dispatch<React.SetStateAction<DetailedFinancialData>>;
    assumptionsData: AllAssumptions;
    setAssumptionsData: React.Dispatch<React.SetStateAction<AllAssumptions>>;
    
    // Pillar 2: The Reality (Transaction Ledgers)
    inventoryLedgerData: InventoryLedgerItem[];
    setInventoryLedgerData: React.Dispatch<React.SetStateAction<InventoryLedgerItem[]>>;
    cashJournalData: CashJournalEntry[];
    setCashJournalData: React.Dispatch<React.SetStateAction<CashJournalEntry[]>>;
    salesLedgerData: SalesLedgerEntry[];
    setSalesLedgerData: React.Dispatch<React.SetStateAction<SalesLedgerEntry[]>>;
    activityLogData: ActivityLogEntry[];
    setActivityLogData: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>;
    
    // Other app state
    okrs: OKR[];
    setOkrs: React.Dispatch<React.SetStateAction<OKR[]>>;
    pricingData: RetailPrice;
    setPricingData: React.Dispatch<React.SetStateAction<RetailPrice>>;
    productSKUs: ProductSKU[];

    // Data Management
    importData: (data: ExportData) => void;

    // Pillar 3: The Analysis Engine (Derived Data)
    actualData: DetailedFinancialData;
    budgetDataForPeriod: FinancialData;
    actualDataForPeriod: FinancialData;
    periodLabel: string;
}

// Create the context with a default value (or null and check for it)
export const DataContext = createContext<DataContextType | null>(null);

// Custom hook for consuming the context
export const useDataContext = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};

// Create the provider component
export const DataProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    // View state
    const [selectedYear, setSelectedYear] = useState<number>(YEARS[0]);
    const [granularity, setGranularity] = useState<Granularity>('Yearly');
    const [subPeriod, setSubPeriod] = useState<number>(1);
    
    // Pillar 1 state
    const [plannedBudget, setPlannedBudget] = useState(INITIAL_PLANNED_BUDGET);
    const [assumptionsData, setAssumptionsData] = useState<AllAssumptions>(INITIAL_ASSUMPTIONS);

    // Pillar 2 state
    const [inventoryLedgerData, setInventoryLedgerData] = useState<InventoryLedgerItem[]>(INITIAL_INVENTORY_LEDGER);
    const [cashJournalData, setCashJournalData] = useState<CashJournalEntry[]>(INITIAL_CASH_JOURNAL);
    const [salesLedgerData, setSalesLedgerData] = useState<SalesLedgerEntry[]>(INITIAL_SALES_LEDGER);
    const [activityLogData, setActivityLogData] = useState<ActivityLogEntry[]>(INITIAL_ACTIVITY_LOG);
    
    // Other app state
    const [okrs, setOkrs] = useState<OKR[]>(INITIAL_OKRS);
    const [pricingData, setPricingData] = useState<RetailPrice>(INITIAL_PRICING);

    // Data Management
    const importData = (data: ExportData) => {
        setPlannedBudget(data.plannedBudget);
        setAssumptionsData(data.assumptionsData);
        setOkrs(data.okrs);
        setPricingData(data.pricingData);
        setInventoryLedgerData(data.inventoryLedgerData);
        setCashJournalData(data.cashJournalData);
        setSalesLedgerData(data.salesLedgerData);
        setActivityLogData(data.activityLogData);
    };

    // Pillar 3: The Analysis Engine (Derived Data)
    const actualData = useMemo(() => {
        return aggregateActualsFromLedgers({
            salesLedger: salesLedgerData,
            cashJournal: cashJournalData,
            inventoryLedger: inventoryLedgerData
        }, assumptionsData);
    }, [salesLedgerData, cashJournalData, inventoryLedgerData, assumptionsData]);

    const { budgetDataForPeriod, actualDataForPeriod } = useMemo(() => {
        return {
            budgetDataForPeriod: aggregateFinancialData(plannedBudget, selectedYear, granularity, subPeriod),
            actualDataForPeriod: aggregateFinancialData(actualData, selectedYear, granularity, subPeriod),
        };
    }, [plannedBudget, actualData, selectedYear, granularity, subPeriod]);

    const periodLabel = useMemo(() => {
        return getPeriodLabel(selectedYear, granularity, subPeriod);
    }, [selectedYear, granularity, subPeriod]);
    
    const value: DataContextType = {
        selectedYear,
        setSelectedYear,
        granularity,
        setGranularity,
        subPeriod,
        setSubPeriod,
        plannedBudget,
        setPlannedBudget,
        assumptionsData,
        setAssumptionsData,
        inventoryLedgerData,
        setInventoryLedgerData,
        cashJournalData,
        setCashJournalData,
        salesLedgerData,
        setSalesLedgerData,
        activityLogData,
        setActivityLogData,
        okrs,
        setOkrs,
        pricingData,
        setPricingData,
        productSKUs: PRODUCT_SKUS,
        importData,
        actualData,
        budgetDataForPeriod,
        actualDataForPeriod,
        periodLabel
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};