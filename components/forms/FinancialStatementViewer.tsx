import React, { useState, useCallback } from 'react';
import { useDataContext } from '../../contexts/DataContext';
import { DetailedFinancialData, FinancialData } from '../../types';
import { YEARS } from '../../constants';

type StatementType = 'Income Statement' | 'Balance Sheet' | 'Cash Flow';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const FinancialStatementViewer: React.FC = () => {
    const { plannedBudget, setPlannedBudget } = useDataContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editedBudget, setEditedBudget] = useState<DetailedFinancialData | null>(null);
    const [activeStatement, setActiveStatement] = useState<StatementType>('Income Statement');

    const handleEdit = () => {
        setIsEditing(true);
        setEditedBudget(JSON.parse(JSON.stringify(plannedBudget)));
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedBudget(null);
    };
    
    const recalculateAll = useCallback((budget: DetailedFinancialData, startYear: number) => {
        for (let i = YEARS.indexOf(startYear); i < YEARS.length; i++) {
            const year = YEARS[i];
            const prevYear = YEARS[i - 1];
            const summary = budget[year].summary;
            const IS = summary.incomeStatement;
            const BS = summary.balanceSheet;
            const CF = summary.cashFlow;

            // IS Recalculations
            // FIX: Replaced 'wholesale' with 'retail' to match FinancialData type
            IS.revenue.total = IS.revenue.online + IS.revenue.retail + IS.revenue.horeca;
            IS.grossProfit = IS.revenue.total - IS.cogs;
            IS.operatingExpenses.total = Object.values(IS.operatingExpenses).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0) - IS.operatingExpenses.total;
            IS.operatingIncome = IS.grossProfit - IS.operatingExpenses.total;
            IS.incomeBeforeTaxes = IS.operatingIncome - IS.interestExpense;
            IS.netIncome = IS.incomeBeforeTaxes - IS.incomeTaxExpense;

            // CF Recalculations (links from IS)
            CF.operatingActivities.netIncome = IS.netIncome;
            CF.operatingActivities.depreciation = IS.operatingExpenses.depreciation;

            // CF Totals
            CF.operatingActivities.netCash = Object.values(CF.operatingActivities).reduce((s, v) => s + v, 0) - CF.operatingActivities.netCash;
            CF.investingActivities.netCash = CF.investingActivities.purchaseOfFixedAssets + CF.investingActivities.capitalizedStartupCosts;
            CF.financingActivities.netCash = CF.financingActivities.netIncreaseFromBorrowings + CF.financingActivities.repaymentOfLoans + CF.financingActivities.equityContributions + CF.financingActivities.dividendsPaid;
            CF.netChangeInCash = CF.operatingActivities.netCash + CF.investingActivities.netCash + CF.financingActivities.netCash;
            CF.cashAtBeginningOfYear = prevYear ? budget[prevYear].summary.cashFlow.cashAtEndOfYear : 0;
            CF.cashAtEndOfYear = CF.cashAtBeginningOfYear + CF.netChangeInCash;
            
            // BS Recalculations (links from CF & IS)
            BS.assets.current.cash = CF.cashAtEndOfYear;
            BS.liabilitiesAndEquity.equity.retainedEarnings = (prevYear ? budget[prevYear].summary.balanceSheet.liabilitiesAndEquity.equity.retainedEarnings : 0) + IS.netIncome;

            // BS Totals
            BS.assets.current.total = BS.assets.current.cash + BS.assets.current.accountsReceivable + BS.assets.current.inventory;
            BS.assets.nonCurrent.netBookValue = BS.assets.nonCurrent.fixedAssets + BS.assets.nonCurrent.intangibleAssets + BS.assets.nonCurrent.accumulatedDepreciation;
            BS.assets.nonCurrent.total = BS.assets.nonCurrent.netBookValue + BS.assets.nonCurrent.other;
            BS.assets.total = BS.assets.current.total + BS.assets.nonCurrent.total;
            
            const L = BS.liabilitiesAndEquity.liabilities;
            L.current.total = Object.values(L.current).reduce((s, v) => s + v, 0) - L.current.total;
            L.nonCurrent.total = L.nonCurrent.longTermDebt;
            L.total = L.current.total + L.nonCurrent.total;
            
            const E = BS.liabilitiesAndEquity.equity;
            E.total = E.shareCapital + E.retainedEarnings;
            
            BS.liabilitiesAndEquity.total = L.total + E.total;
        }
        return budget;
    }, []);

    const distributeYearlyToChildren = useCallback((yearSummary: FinancialData) => {
        const monthsData: any = {};
        for(let i = 1; i <= 12; i++) {
            const monthSummary = JSON.parse(JSON.stringify(yearSummary));
            const weeksData: any = {};
            
            Object.keys(monthSummary).forEach(sk => {
                Object.keys((monthSummary as any)[sk]).forEach(ck => {
                    if(typeof (monthSummary as any)[sk][ck] === 'object'){
                        Object.keys((monthSummary as any)[sk][ck]).forEach(subKey => {
                             (monthSummary as any)[sk][ck][subKey] /= 12;
                        });
                    } else { (monthSummary as any)[sk][ck] /= 12; }
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
                        } else { (weekData as any)[sk][ck] /= 4; }
                    })
                });
                weeksData[w] = weekData;
            }
            monthsData[i] = { summary: monthSummary, weeks: weeksData };
        }
        return monthsData;
    }, []);

    const handleSave = () => {
        if (!editedBudget) return;
        const finalBudget = { ...editedBudget };
        YEARS.forEach(year => {
            finalBudget[year].months = distributeYearlyToChildren(finalBudget[year].summary);
        });
        setPlannedBudget(finalBudget);
        setIsEditing(false);
        setEditedBudget(null);
    };

    const handleChange = (year: number, statement: keyof FinancialData, path: string, value: number) => {
        if (!editedBudget) return;
        
        let newBudget = JSON.parse(JSON.stringify(editedBudget));
        let current = newBudget[year].summary[statement];
        const keys = path.split('.');
        for(let i = 0; i < keys.length - 1; i++){
            current = current[keys[i]];
        }
        current[keys[keys.length-1]] = value;
        
        newBudget = recalculateAll(newBudget, year);
        setEditedBudget(newBudget);
    };

    const budgetToDisplay = isEditing && editedBudget ? editedBudget : plannedBudget;

    const renderRow = (label: string, statement: keyof FinancialData, path: string, isEditable: boolean, { isBold = false, isSub = false, isHeader = false, isSubHeader = false } = {}) => {
        if (isHeader) return <tr className="bg-gray-800"><td colSpan={YEARS.length + 1} className="p-1.5 font-semibold text-brand-text-primary">{label}</td></tr>;
        if (isSubHeader) return <tr className="bg-gray-800/50"><td colSpan={YEARS.length + 1} className="p-1.5 font-semibold text-brand-text-secondary pl-4">{label}</td></tr>;
        return (
            <tr className={`border-b border-brand-border/50 ${isBold ? 'font-semibold bg-gray-800/30' : ''}`}>
                <td className={`py-1.5 px-3 ${isSub ? 'pl-6' : ''}`}>{label}</td>
                {YEARS.map(year => {
                    let current: any = budgetToDisplay[year].summary[statement];
                    const keys = path.split('.');
                    for(const key of keys) { 
                        if (current) current = current[key]; 
                    }
                    const value = current as number;
                    
                    return (
                        <td key={year} className="py-1.5 px-3 text-right">
                           {isEditing && isEditable ? (
                                <input type="number" value={Math.round(value || 0)} onChange={e => handleChange(year, statement, path, parseFloat(e.target.value) || 0)} className="bg-brand-surface p-1 rounded-md w-full text-sm outline-none focus:ring-1 focus:ring-brand-primary text-right"/>
                           ) : formatCurrency(value || 0)}
                        </td>
                    );
                })}
            </tr>
        );
    }
    
    const renderIncomeStatement = () => (
        <tbody>
            {renderRow("Revenue", 'incomeStatement', '', false, { isHeader: true })}
            {renderRow("Sales - Online", 'incomeStatement', "revenue.online", true, { isSub: true })}
            {/* FIX: Replaced 'wholesale' with 'retail' to match FinancialData type */}
            {renderRow("Sales - Retail", 'incomeStatement', "revenue.retail", true, { isSub: true })}
            {renderRow("Sales - HORECA", 'incomeStatement', "revenue.horeca", true, { isSub: true })}
            {renderRow("Total Revenue", 'incomeStatement', "revenue.total", false, { isBold: true })}
            {renderRow("Cost of Goods Sold (COGS)", 'incomeStatement', "cogs", true)}
            {renderRow("Gross Profit", 'incomeStatement', "grossProfit", false, { isBold: true })}
            {renderRow("Operating Expenses", 'incomeStatement', '', false, { isHeader: true })}
            {renderRow("Marketing & Sales", 'incomeStatement', "operatingExpenses.marketingAndSales", true)}
            {renderRow("Logistics & Distribution", 'incomeStatement', "operatingExpenses.logisticsAndDistribution", true)}
            {renderRow("Salaries & Wages", 'incomeStatement', "operatingExpenses.salariesAndWages", true)}
            {renderRow("Rent & Utilities", 'incomeStatement', "operatingExpenses.rentAndUtilities", true)}
            {renderRow("Technology & Software", 'incomeStatement', "operatingExpenses.techAndSoftware", true)}
            {renderRow("Professional Fees", 'incomeStatement', "operatingExpenses.professionalFees", true)}
            {renderRow("Depreciation & Amortization", 'incomeStatement', "operatingExpenses.depreciation", true)}
            {renderRow("Other Operating Expenses", 'incomeStatement', "operatingExpenses.other", true)}
            {renderRow("Total Operating Expenses", 'incomeStatement', "operatingExpenses.total", false, { isBold: true })}
            {renderRow("Operating Income (EBIT)", 'incomeStatement', "operatingIncome", false, { isBold: true })}
            {renderRow("Interest Expense", 'incomeStatement', "interestExpense", true)}
            {renderRow("Income Before Taxes", 'incomeStatement', "incomeBeforeTaxes", false)}
            {renderRow("Income Tax Expense", 'incomeStatement', "incomeTaxExpense", true)}
            {renderRow("Net Income", 'incomeStatement', "netIncome", false, { isBold: true })}
        </tbody>
    );

    const renderBalanceSheet = () => (
        <tbody>
            {renderRow("Assets", 'balanceSheet', '', false, { isHeader: true })}
            {renderRow("Current Assets", 'balanceSheet', '', false, { isSubHeader: true })}
            {renderRow("Cash & Cash Equivalents", 'balanceSheet', "assets.current.cash", false, { isSub: true })}
            {renderRow("Accounts Receivable", 'balanceSheet', "assets.current.accountsReceivable", true, { isSub: true })}
            {renderRow("Inventory", 'balanceSheet', "assets.current.inventory", true, { isSub: true })}
            {renderRow("Total Current Assets", 'balanceSheet', "assets.current.total", false, { isBold: true })}
            {renderRow("Non-Current Assets", 'balanceSheet', '', false, { isSubHeader: true })}
            {renderRow("Fixed assets", 'balanceSheet', "assets.nonCurrent.fixedAssets", true, { isSub: true })}
            {renderRow("Intangible assets", 'balanceSheet', "assets.nonCurrent.intangibleAssets", true, { isSub: true })}
            {renderRow("Accumulated depreciation", 'balanceSheet', "assets.nonCurrent.accumulatedDepreciation", true, { isSub: true })}
            {renderRow("Net book value", 'balanceSheet', "assets.nonCurrent.netBookValue", false, { isBold: true, isSub: true })}
            {renderRow("Other", 'balanceSheet', "assets.nonCurrent.other", true, { isSub: true })}
            {renderRow("Total Non-Current Assets", 'balanceSheet', "assets.nonCurrent.total", false, { isBold: true })}
            {renderRow("Total Assets", 'balanceSheet', "assets.total", false, { isBold: true })}
            {renderRow("Liabilities & Equity", 'balanceSheet', '', false, { isHeader: true })}
            {renderRow("Current Liabilities", 'balanceSheet', '', false, { isSubHeader: true })}
            {renderRow("Accounts Payable", 'balanceSheet', "liabilitiesAndEquity.liabilities.current.accountsPayable", true, { isSub: true })}
            {renderRow("Short-Term Debt", 'balanceSheet', "liabilitiesAndEquity.liabilities.current.shortTermDebt", true, { isSub: true })}
            {renderRow("Accrued Expenses", 'balanceSheet', "liabilitiesAndEquity.liabilities.current.accruedExpenses", true, { isSub: true })}
            {renderRow("VAT Payable/ (Receivable)", 'balanceSheet', "liabilitiesAndEquity.liabilities.current.vatPayable", true, { isSub: true })}
            {renderRow("Deferred Taxes", 'balanceSheet', "liabilitiesAndEquity.liabilities.current.deferredTaxes", true, { isSub: true })}
            {renderRow("Dividends Payable", 'balanceSheet', "liabilitiesAndEquity.liabilities.current.dividendsPayable", true, { isSub: true })}
            {renderRow("Total Current Liabilities", 'balanceSheet', "liabilitiesAndEquity.liabilities.current.total", false, { isBold: true })}
            {renderRow("Non-Current Liabilities", 'balanceSheet', '', false, { isSubHeader: true })}
            {renderRow("Long-Term Debt", 'balanceSheet', "liabilitiesAndEquity.liabilities.nonCurrent.longTermDebt", true, { isSub: true })}
            {renderRow("Total Non-Current Liabilities", 'balanceSheet', "liabilitiesAndEquity.liabilities.nonCurrent.total", false, { isBold: true })}
            {renderRow("Total Liabilities", 'balanceSheet', "liabilitiesAndEquity.liabilities.total", false, { isBold: true })}
            {renderRow("Equity", 'balanceSheet', '', false, { isSubHeader: true })}
            {renderRow("Share Capital", 'balanceSheet', "liabilitiesAndEquity.equity.shareCapital", true, { isSub: true })}
            {renderRow("Retained Earnings", 'balanceSheet', "liabilitiesAndEquity.equity.retainedEarnings", false, { isSub: true })}
            {renderRow("Total Equity", 'balanceSheet', "liabilitiesAndEquity.equity.total", false, { isBold: true })}
            {renderRow("Total Liabilities & Equity", 'balanceSheet', "liabilitiesAndEquity.total", false, { isBold: true })}
        </tbody>
    );
    
    const renderCashFlow = () => (
        <tbody>
            {renderRow("Cash Flow from Operating Activities", 'cashFlow', '', false, { isHeader: true })}
            {renderRow("Net Income", 'cashFlow', "operatingActivities.netIncome", false, { isSub: true })}
            {renderRow("Depreciation", 'cashFlow', "operatingActivities.depreciation", false, { isSub: true })}
            {renderRow("Changes in Accounts Receivable", 'cashFlow', "operatingActivities.changeInAccountsReceivable", true, { isSub: true })}
            {renderRow("Changes in Inventory", 'cashFlow', "operatingActivities.changeInInventory", true, { isSub: true })}
            {renderRow("Changes in Accounts Payable", 'cashFlow', "operatingActivities.changeInAccountsPayable", true, { isSub: true })}
            {renderRow("Changes in Accrued Expenses", 'cashFlow', "operatingActivities.changeInAccruedExpenses", true, { isSub: true })}
            {renderRow("Changes in VAT Payable / (Receivable)", 'cashFlow', "operatingActivities.changeInVatPayable", true, { isSub: true })}
            {renderRow("Changes in Deferred Taxes", 'cashFlow', "operatingActivities.changeInDeferredTaxes", true, { isSub: true })}
            {renderRow("Net Cash from Operating Activities", 'cashFlow', "operatingActivities.netCash", false, { isBold: true })}
            {renderRow("Cash Flow from Investing Activities", 'cashFlow', '', false, { isHeader: true })}
            {renderRow("Purchase of Fixed Assets", 'cashFlow', "investingActivities.purchaseOfFixedAssets", true, { isSub: true })}
            {renderRow("Capitalized Startup Costs", 'cashFlow', "investingActivities.capitalizedStartupCosts", true, { isSub: true })}
            {renderRow("Net Cash from Investing Activities", 'cashFlow', "investingActivities.netCash", false, { isBold: true })}
            {renderRow("Cash Flow from Financing Activities", 'cashFlow', '', false, { isHeader: true })}
            {renderRow("Net increase from borrowings", 'cashFlow', "financingActivities.netIncreaseFromBorrowings", true, { isSub: true })}
            {renderRow("Repayment of Loans", 'cashFlow', "financingActivities.repaymentOfLoans", true, { isSub: true })}
            {renderRow("Equity Contributions", 'cashFlow', "financingActivities.equityContributions", true, { isSub: true })}
            {renderRow("Dividends Paid", 'cashFlow', "financingActivities.dividendsPaid", true, { isSub: true })}
            {renderRow("Net Cash from Financing Activities", 'cashFlow', "financingActivities.netCash", false, { isBold: true })}
            {renderRow("Net Change in Cash", 'cashFlow', "netChangeInCash", false, { isBold: true })}
            {renderRow("Cash at Beginning of Year", 'cashFlow', "cashAtBeginningOfYear", false)}
            {renderRow("Cash at End of Year", 'cashFlow', "cashAtEndOfYear", false, { isBold: true })}
        </tbody>
    );


    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div className="border-b border-brand-border">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    {(['Income Statement', 'Balance Sheet', 'Cash Flow'] as StatementType[]).map((tab) => (
                        <button key={tab} onClick={() => setActiveStatement(tab)} className={`${ activeStatement === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-gray-500' } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>
                            {tab}
                        </button>
                    ))}
                    </nav>
                </div>
                 <div className="flex justify-end gap-4">
                    {isEditing ? (
                        <>
                            <button onClick={handleCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                            <button onClick={handleSave} className="bg-brand-secondary hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Save Changes</button>
                        </>
                    ) : (
                        <button onClick={handleEdit} className="bg-brand-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Edit Budget</button>
                    )}
                </div>
            </div>
           
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm text-left text-brand-text-secondary">
                    <thead className="text-xs text-brand-text-primary uppercase bg-gray-700/50">
                        <tr>
                            <th className="py-2 px-3">Line Item</th>
                            {YEARS.map(year => <th key={year} className="py-2 px-3 text-right">{year}</th>)}
                        </tr>
                    </thead>
                    {activeStatement === 'Income Statement' && renderIncomeStatement()}
                    {activeStatement === 'Balance Sheet' && renderBalanceSheet()}
                    {activeStatement === 'Cash Flow' && renderCashFlow()}
                </table>
            </div>
        </div>
    );
};

export default FinancialStatementViewer;