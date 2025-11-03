
import React, { useMemo } from 'react';
import { useDataContext } from '../../contexts/DataContext';

interface StartupCostTrackerProps {}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const ProgressBar: React.FC<{ value: number, total: number }> = ({ value, total }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    let displayPercentageText, barWidth, barColorClass, textColorClass;

    if (percentage <= 100) {
        barWidth = Math.max(0, percentage);
        displayPercentageText = `${percentage.toFixed(0)}%`;
        barColorClass = 'bg-brand-secondary';
        if (percentage > 85) barColorClass = 'bg-brand-accent';
        textColorClass = 'text-white';
    } else { // Over budget
        barWidth = 100;
        const overPercentage = percentage - 100;
        displayPercentageText = `+${overPercentage.toFixed(0)}% Over`;
        barColorClass = 'bg-red-600';
        textColorClass = 'text-white';
    }

    return (
        <div className="w-full bg-brand-border rounded-full h-5 relative flex items-center justify-center">
            <div 
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${barColorClass}`} 
                style={{ width: `${barWidth}%` }}
            />
            <span className={`relative text-xs font-bold ${textColorClass}`}>
                {displayPercentageText}
            </span>
        </div>
    );
};

const StartupCostTracker: React.FC<StartupCostTrackerProps> = () => {
    const { assumptionsData, cashJournalData: cashJournal } = useDataContext();
    const budgetedItems = assumptionsData.startup.items;
    
    const actualCosts = cashJournal.filter(item => item.category === 'Investing: Startup Cost' && item.type === 'Outflow');

    const { plannedItems, unplannedItems } = useMemo(() => {
        const planned = budgetedItems.map(item => {
            const actual = actualCosts
                .filter(a => a.subCategory === item.name)
                .reduce((sum, a) => sum + a.amount, 0);
            return {
                name: item.name,
                budget: item.budget,
                actual,
                variance: item.budget - actual,
            };
        });

        const unplannedGrouped = actualCosts
            .filter(item => !item.subCategory || !budgetedItems.some(b => b.name === item.subCategory))
            .reduce((acc, item) => {
                const key = item.description || 'Uncategorized';
                if (!acc[key]) {
                    acc[key] = { name: key, budget: 0, actual: 0, variance: 0 };
                }
                acc[key].actual += item.amount;
                acc[key].variance -= item.amount;
                return acc;
            }, {} as Record<string, { name: string, budget: number, actual: number, variance: number }>);
            
        return { 
            plannedItems: planned, 
            unplannedItems: Object.values(unplannedGrouped) 
        };
    }, [budgetedItems, actualCosts]);

    const totalBudget = budgetedItems.reduce((sum, item) => sum + item.budget, 0);
    const totalActual = actualCosts.reduce((sum, item) => sum + item.amount, 0);
    const remainingBudget = totalBudget - totalActual;
    
    return (
        <div className="bg-brand-surface rounded-lg shadow-lg p-6 h-full flex flex-col">
            <h3 className="text-xl font-bold text-brand-text-primary">Startup Costs</h3>
            
            <div className="flex flex-col gap-4 flex-grow min-h-0 pt-4">
                {/* Top Section: Summary & Progress */}
                <div className="flex-shrink-0">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-brand-text-secondary">Budget:</span>
                        <span className="font-mono font-semibold text-brand-text-primary">{formatCurrency(totalBudget)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-brand-text-secondary">Actual Spend:</span>
                        <span className="font-mono font-semibold text-brand-text-primary">{formatCurrency(totalActual)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-brand-text-secondary">Remaining:</span>
                        <span className={`font-mono font-semibold ${remainingBudget >= 0 ? 'text-brand-secondary' : 'text-red-500'}`}>{formatCurrency(remainingBudget)}</span>
                    </div>
                    <ProgressBar value={totalActual} total={totalBudget} />
                </div>
                
                {/* Bottom Section (Table) */}
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-brand-surface z-10">
                            <tr className="border-b border-brand-border">
                                <th className="py-2 px-3 text-xs font-semibold uppercase text-brand-text-secondary">Item</th>
                                <th className="py-2 px-3 text-xs font-semibold uppercase text-brand-text-secondary text-right">Budget</th>
                                <th className="py-2 px-3 text-xs font-semibold uppercase text-brand-text-secondary text-right">Actual</th>
                                <th className="py-2 px-3 text-xs font-semibold uppercase text-brand-text-secondary text-right">Variance</th>
                            </tr>
                        </thead>
                        <tbody className="text-brand-text-secondary">
                            {plannedItems.map((item) => {
                                let varianceColor = 'text-brand-text-primary';
                                if (item.variance > 0) varianceColor = 'text-green-400';
                                else if (item.variance < 0) varianceColor = 'text-red-400';
                                return (
                                    <tr key={item.name} className="border-b border-brand-border/50 hover:bg-gray-700/20">
                                        <td className="py-2 px-3">{item.name}</td>
                                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.budget)}</td>
                                        <td className="py-2 px-3 text-right font-mono text-brand-text-primary">{formatCurrency(item.actual)}</td>
                                        <td className={`py-2 px-3 text-right font-mono ${varianceColor}`}>{formatCurrency(item.variance)}</td>
                                    </tr>
                                );
                            })}
                            {unplannedItems.length > 0 && (
                                <tr className="bg-gray-800/80 sticky" style={{ top: '33px' }}>
                                    <td colSpan={4} className="py-1 px-3 font-semibold text-brand-text-secondary uppercase text-xs tracking-wider">Unplanned</td>
                                </tr>
                            )}
                            {unplannedItems.map((item) => {
                                const varianceColor = 'text-red-400';
                                return (
                                    <tr key={item.name} className="border-b border-brand-border/50 hover:bg-gray-700/20">
                                        <td className="py-2 px-3">{item.name}</td>
                                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.budget)}</td>
                                        <td className="py-2 px-3 text-right font-mono text-brand-text-primary">{formatCurrency(item.actual)}</td>
                                        <td className={`py-2 px-3 text-right font-mono ${varianceColor}`}>{formatCurrency(item.variance)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="sticky bottom-0">
                            <tr className="font-bold text-brand-text-primary bg-gray-800/95">
                                <td className="py-2 px-3">Total</td>
                                <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalBudget)}</td>
                                <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalActual)}</td>
                                <td className={`py-2 px-3 text-right font-mono ${remainingBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(remainingBudget)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StartupCostTracker;
