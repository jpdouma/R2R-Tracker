import React, { useState, useEffect } from 'react';
import type { FinancialData, Granularity } from '../types';

interface FinancialTableProps {
  budget: FinancialData;
  actual: FinancialData;
  granularity: Granularity;
}

type StatementType = 'Income Statement' | 'Cash Flow' | 'Balance Sheet';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value);

const TableRow: React.FC<{ label: string; budget: number; actual: number; indent?: boolean; bold?: boolean }> = ({ label, budget, actual, indent = false, bold = false }) => (
  <tr className="border-b border-brand-border hover:bg-gray-700">
    <td className={`py-2 px-4 text-sm ${indent ? 'pl-8' : ''} ${bold ? 'font-bold text-brand-text-primary' : ''}`}>{label}</td>
    <td className={`py-2 px-4 text-sm text-right ${bold ? 'font-bold text-brand-text-primary' : ''}`}>{formatCurrency(budget)}</td>
    <td className={`py-2 px-4 text-sm text-right ${bold ? 'font-bold text-brand-text-primary' : ''}`}>{formatCurrency(actual)}</td>
  </tr>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <tr className="bg-gray-800">
        <th colSpan={3} className="py-2 px-4 text-sm font-semibold text-left text-brand-text-primary">{title}</th>
    </tr>
)

const FinancialTable: React.FC<FinancialTableProps> = ({ budget, actual, granularity }) => {
  const [activeTab, setActiveTab] = useState<StatementType>('Income Statement');

  useEffect(() => {
    if (granularity === 'Weekly') {
      setActiveTab('Cash Flow');
    } else {
      setActiveTab('Income Statement');
    }
  }, [granularity]);
  
  const TABS: StatementType[] = granularity === 'Weekly' 
    ? ['Cash Flow'] 
    : ['Income Statement', 'Cash Flow', 'Balance Sheet'];

  const renderContent = () => {
    switch(activeTab) {
      case 'Income Statement':
        return (
          <>
            <SectionHeader title="Revenue" />
            <TableRow label="Sales - Online" budget={budget.incomeStatement.revenue.online} actual={actual.incomeStatement.revenue.online} indent />
            <TableRow label="Sales - Wholesale" budget={budget.incomeStatement.revenue.wholesale} actual={actual.incomeStatement.revenue.wholesale} indent />
            <TableRow label="Sales - HORECA" budget={budget.incomeStatement.revenue.horeca} actual={actual.incomeStatement.revenue.horeca} indent />
            <TableRow label="Total Revenue" budget={budget.incomeStatement.revenue.total} actual={actual.incomeStatement.revenue.total} bold />
            <TableRow label="Cost of Goods Sold (COGS)" budget={budget.incomeStatement.cogs} actual={actual.incomeStatement.cogs} />
            <TableRow label="Gross Profit" budget={budget.incomeStatement.grossProfit} actual={actual.incomeStatement.grossProfit} bold />
            
            <SectionHeader title="Operating Expenses" />
            <TableRow label="Marketing & Sales" budget={budget.incomeStatement.operatingExpenses.marketingAndSales} actual={actual.incomeStatement.operatingExpenses.marketingAndSales} indent />
            <TableRow label="Logistics & Distribution" budget={budget.incomeStatement.operatingExpenses.logisticsAndDistribution} actual={actual.incomeStatement.operatingExpenses.logisticsAndDistribution} indent />
            <TableRow label="Salaries & Wages" budget={budget.incomeStatement.operatingExpenses.salariesAndWages} actual={actual.incomeStatement.operatingExpenses.salariesAndWages} indent />
            <TableRow label="Depreciation & Amortization" budget={budget.incomeStatement.operatingExpenses.depreciation} actual={actual.incomeStatement.operatingExpenses.depreciation} indent />
            <TableRow label="Other Operating Expenses" budget={budget.incomeStatement.operatingExpenses.other} actual={actual.incomeStatement.operatingExpenses.other} indent />
            <TableRow label="Total Operating Expenses" budget={budget.incomeStatement.operatingExpenses.total} actual={actual.incomeStatement.operatingExpenses.total} bold/>

            <TableRow label="Operating Income (EBIT)" budget={budget.incomeStatement.operatingIncome} actual={actual.incomeStatement.operatingIncome} bold />
            <TableRow label="Interest Expense" budget={budget.incomeStatement.interestExpense} actual={actual.incomeStatement.interestExpense} />
            <TableRow label="Income Before Taxes" budget={budget.incomeStatement.incomeBeforeTaxes} actual={actual.incomeStatement.incomeBeforeTaxes} />
            <TableRow label="Income Tax Expense" budget={budget.incomeStatement.incomeTaxExpense} actual={actual.incomeStatement.incomeTaxExpense} />
            <TableRow label="Net Income" budget={budget.incomeStatement.netIncome} actual={actual.incomeStatement.netIncome} bold />
          </>
        );
      case 'Cash Flow':
        const cfBudget = budget.cashFlow;
        const cfActual = actual.cashFlow;
        return (
          <>
            <SectionHeader title="Cash Flow from Operating Activities" />
            <TableRow label="Net Income" budget={cfBudget.operatingActivities.netIncome} actual={cfActual.operatingActivities.netIncome} indent />
            <TableRow label="Depreciation" budget={cfBudget.operatingActivities.depreciation} actual={cfActual.operatingActivities.depreciation} indent />
            <TableRow label="Changes in Accounts Receivable" budget={cfBudget.operatingActivities.changeInAccountsReceivable} actual={cfActual.operatingActivities.changeInAccountsReceivable} indent />
            <TableRow label="Changes in Inventory" budget={cfBudget.operatingActivities.changeInInventory} actual={cfActual.operatingActivities.changeInInventory} indent />
            <TableRow label="Changes in Accounts Payable" budget={cfBudget.operatingActivities.changeInAccountsPayable} actual={cfActual.operatingActivities.changeInAccountsPayable} indent />
            <TableRow label="Net Cash from Operating Activities" budget={cfBudget.operatingActivities.netCash} actual={cfActual.operatingActivities.netCash} bold />

            <SectionHeader title="Cash Flow from Investing Activities" />
            <TableRow label="Capitalized Startup Costs" budget={cfBudget.investingActivities.capitalizedStartupCosts} actual={cfActual.investingActivities.capitalizedStartupCosts} indent />
            <TableRow label="Net Cash from Investing Activities" budget={cfBudget.investingActivities.netCash} actual={cfActual.investingActivities.netCash} bold />

            <SectionHeader title="Cash Flow from Financing Activities" />
            <TableRow label="Net increase from borrowings" budget={cfBudget.financingActivities.netIncreaseFromBorrowings} actual={cfActual.financingActivities.netIncreaseFromBorrowings} indent />
            <TableRow label="Repayment of Loans" budget={cfBudget.financingActivities.repaymentOfLoans} actual={cfActual.financingActivities.repaymentOfLoans} indent />
            <TableRow label="Dividends Paid" budget={cfBudget.financingActivities.dividendsPaid} actual={cfActual.financingActivities.dividendsPaid} indent />
            <TableRow label="Net Cash from Financing Activities" budget={cfBudget.financingActivities.netCash} actual={cfActual.financingActivities.netCash} bold />

            <TableRow label="Net Change in Cash" budget={cfBudget.netChangeInCash} actual={cfActual.netChangeInCash} bold />
            <TableRow label="Cash at Beginning of Period" budget={cfBudget.cashAtBeginningOfYear} actual={cfActual.cashAtBeginningOfYear} />
            <TableRow label="Cash at End of Period" budget={cfBudget.cashAtEndOfYear} actual={cfActual.cashAtEndOfYear} bold />
          </>
        );
      case 'Balance Sheet':
         const bsBudget = budget.balanceSheet;
         const bsActual = actual.balanceSheet;
        return (
           <>
            <SectionHeader title="Assets" />
            <TableRow label="Cash & Cash Equivalents" budget={bsBudget.assets.current.cash} actual={bsActual.assets.current.cash} indent/>
            <TableRow label="Accounts Receivable" budget={bsBudget.assets.current.accountsReceivable} actual={bsActual.assets.current.accountsReceivable} indent/>
            <TableRow label="Inventory" budget={bsBudget.assets.current.inventory} actual={bsActual.assets.current.inventory} indent/>
            <TableRow label="Total Current Assets" budget={bsBudget.assets.current.total} actual={bsActual.assets.current.total} bold/>
            <TableRow label="Intangible Assets" budget={bsBudget.assets.nonCurrent.intangibleAssets} actual={bsActual.assets.nonCurrent.intangibleAssets} indent/>
            <TableRow label="Accumulated Depreciation" budget={bsBudget.assets.nonCurrent.accumulatedDepreciation} actual={bsActual.assets.nonCurrent.accumulatedDepreciation} indent/>
            <TableRow label="Total Non-Current Assets" budget={bsBudget.assets.nonCurrent.total} actual={bsActual.assets.nonCurrent.total} bold/>
            <TableRow label="Total Assets" budget={bsBudget.assets.total} actual={bsActual.assets.total} bold/>

            <SectionHeader title="Liabilities & Equity" />
            <TableRow label="Accounts Payable" budget={bsBudget.liabilitiesAndEquity.liabilities.current.accountsPayable} actual={bsActual.liabilitiesAndEquity.liabilities.current.accountsPayable} indent/>
            <TableRow label="Short-Term Debt" budget={bsBudget.liabilitiesAndEquity.liabilities.current.shortTermDebt} actual={bsActual.liabilitiesAndEquity.liabilities.current.shortTermDebt} indent/>
            <TableRow label="Total Current Liabilities" budget={bsBudget.liabilitiesAndEquity.liabilities.current.total} actual={bsActual.liabilitiesAndEquity.liabilities.current.total} bold/>
            <TableRow label="Long-Term Debt" budget={bsBudget.liabilitiesAndEquity.liabilities.nonCurrent.longTermDebt} actual={bsActual.liabilitiesAndEquity.liabilities.nonCurrent.longTermDebt} indent/>
            <TableRow label="Total Liabilities" budget={bsBudget.liabilitiesAndEquity.liabilities.total} actual={bsActual.liabilitiesAndEquity.liabilities.total} bold/>
            <TableRow label="Retained Earnings" budget={bsBudget.liabilitiesAndEquity.equity.retainedEarnings} actual={bsActual.liabilitiesAndEquity.equity.retainedEarnings} indent/>
            <TableRow label="Total Equity" budget={bsBudget.liabilitiesAndEquity.equity.total} actual={bsActual.liabilitiesAndEquity.equity.total} bold/>
            <TableRow label="Total Liabilities & Equity" budget={bsBudget.liabilitiesAndEquity.total} actual={bsActual.liabilitiesAndEquity.total} bold/>
          </>
        )
      default: return null;
    }
  }

  return (
    <div>
      <div className="border-b border-brand-border mb-4">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-gray-500'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-brand-text-secondary">
          <thead className="text-xs text-brand-text-primary uppercase bg-gray-700">
            <tr>
              <th scope="col" className="py-3 px-4">Line Item</th>
              <th scope="col" className="py-3 px-4 text-right">Budget</th>
              <th scope="col" className="py-3 px-4 text-right">Actual</th>
            </tr>
          </thead>
          <tbody>
            {granularity === 'Weekly' && activeTab !== 'Cash Flow' ? (
                <tr><td colSpan={3} className="text-center p-4">Not applicable for weekly view.</td></tr>
            ) : renderContent()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialTable;