import React, { useState } from 'react';
import Header from './components/layout/Header';
import MetricCard from './components/ui/MetricCard';
import FinancialChart from './components/dashboard/FinancialChart';
import OKRTracker from './components/dashboard/OKRTracker';
import DataInput from './components/forms/DataInput';
import LedgerTabs from './components/ledgers/LedgerTabs';
import StartupCostTracker from './components/dashboard/StartupCostTracker';
import ScenarioPlanner from './components/modals/ScenarioPlanner';
import SalesProgressCard from './components/dashboard/SalesProgressCard';
import { DataProvider, useDataContext } from './contexts/DataContext';
import FormsSection from './components/forms/FormsSection';

const Dashboard: React.FC = () => {
    const {
        granularity,
        budgetDataForPeriod,
        actualDataForPeriod,
    } = useDataContext();
    
    const [isScenarioPlannerOpen, setIsScenarioPlannerOpen] = useState(false);

    const budgetGrossMargin = budgetDataForPeriod.incomeStatement.revenue.total ? (budgetDataForPeriod.incomeStatement.grossProfit / budgetDataForPeriod.incomeStatement.revenue.total * 100) : 0;
    const actualGrossMargin = actualDataForPeriod.incomeStatement.revenue.total ? (actualDataForPeriod.incomeStatement.grossProfit / actualDataForPeriod.incomeStatement.revenue.total * 100) : 0;

    return (
        <div className="bg-brand-background text-brand-text-secondary min-h-screen font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <Header />

                <DataInput onOpenScenarioPlanner={() => setIsScenarioPlannerOpen(true)} />

                <FormsSection />

                <main className="space-y-8">
                    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <MetricCard title="Total Revenue" budget={budgetDataForPeriod.incomeStatement.revenue.total} actual={actualDataForPeriod.incomeStatement.revenue.total} isCurrency granularity={granularity}/>
                        <MetricCard title="Net Income" budget={budgetDataForPeriod.incomeStatement.netIncome} actual={actualDataForPeriod.incomeStatement.netIncome} isCurrency granularity={granularity}/>
                        <MetricCard title="Gross Margin" budget={budgetGrossMargin} actual={actualGrossMargin} isPercentage granularity={granularity}/>
                        <MetricCard title="OpEx" budget={budgetDataForPeriod.incomeStatement.operatingExpenses.total} actual={actualDataForPeriod.incomeStatement.operatingExpenses.total} isCurrency/>
                        <MetricCard title="Ending Cash" budget={budgetDataForPeriod.cashFlow.cashAtEndOfYear} actual={actualDataForPeriod.cashFlow.cashAtEndOfYear} isCurrency/>
                    </section>
                    
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <StartupCostTracker />
                        <SalesProgressCard />
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <FinancialChart />
                        </div>
                        <div className="bg-brand-surface rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-bold mb-4 text-brand-text-primary">Objectives & Key Results (OKRs)</h3>
                            <OKRTracker />
                        </div>
                    </section>

                    <LedgerTabs />
                </main>
                
                {isScenarioPlannerOpen && (
                    <ScenarioPlanner
                        onClose={() => setIsScenarioPlannerOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};


const App: React.FC = () => {
  return (
    <DataProvider>
      <Dashboard />
    </DataProvider>
  );
};

export default App;