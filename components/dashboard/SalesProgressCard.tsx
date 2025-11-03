import React, { useState, useMemo } from 'react';
import { useDataContext } from '../../contexts/DataContext';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
import { MONTH_NAMES } from '../../constants';
import type { Granularity } from '../../types';

const getWeek = (d: Date) => {
  d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1)/7);
  return weekNo;
}

const getQuarter = (d: Date) => Math.floor(d.getUTCMonth() / 3) + 1;

const formatCurrency = (value: number, compact = true) => {
    if (compact) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(value);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value);
};

const SummaryKpi: React.FC<{ title: string; value: string; subValue?: string, subLabel?: string, colorClass?: string }> = ({ title, value, subValue, subLabel, colorClass = 'text-brand-text-primary' }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg flex-1">
        <h4 className="text-sm text-brand-text-secondary">{title}</h4>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        {subValue && <p className="text-xs text-brand-text-secondary mt-1">{subLabel}: {subValue}</p>}
    </div>
);

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const realized = payload.find(p => p.dataKey === 'realized');
        const pipeline = payload.find(p => p.dataKey === 'pipeline');
        const budget = payload.find(p => p.dataKey === 'budget');
        return (
            <div className="bg-brand-surface p-4 border border-brand-border rounded-lg shadow-lg text-sm">
                <p className="font-bold text-brand-text-primary mb-2">{label}</p>
                {realized && <p style={{ color: realized.color }}>Realized: {formatCurrency(realized.value, false)}</p>}
                {pipeline && <p style={{ color: pipeline.color }}>Pipeline: {formatCurrency(pipeline.value, false)}</p>}
                {budget && <p style={{ color: '#9CA3AF' }}>Budget: {formatCurrency(budget.value, false)}</p>}
            </div>
        );
    }
    return null;
};


type Interval = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

const SalesProgressCard: React.FC = () => {
    const { salesLedgerData, plannedBudget, selectedYear } = useDataContext();
    
    const [period, setPeriod] = useState({
        start: `${selectedYear}-01-01`,
        end: `${selectedYear}-12-31`,
    });
    const [interval, setInterval] = useState<Interval>('Monthly');

    const handlePeriodChange = (field: 'start' | 'end', value: string) => {
        setPeriod(prev => ({ ...prev, [field]: value }));
    };

    const salesData = useMemo(() => {
        const startDate = new Date(`${period.start}T00:00:00Z`);
        const endDate = new Date(`${period.end}T23:59:59Z`);

        const relevantSales = salesLedgerData.filter(s => {
            const orderDate = new Date(s.orderDate);
            return orderDate >= startDate && orderDate <= endDate;
        });

        const aggregated = relevantSales.reduce<Record<string, {name: string, realized: number, pipeline: number, budget: number}>>((acc, sale) => {
            const orderDate = new Date(sale.orderDate + 'T00:00:00Z');
            const year = orderDate.getUTCFullYear();
            const month = orderDate.getUTCMonth() + 1;
            const week = getWeek(orderDate);
            const quarter = getQuarter(orderDate);

            let key: string, name: string;
            switch(interval) {
                case 'Weekly':
                    key = `${year}-W${week}`;
                    name = `W${week}`;
                    break;
                case 'Quarterly':
                    key = `${year}-Q${quarter}`;
                    name = `Q${quarter}`;
                    break;
                case 'Yearly':
                    key = `${year}`;
                    name = `${year}`;
                    break;
                case 'Monthly':
                default:
                    key = `${year}-${month}`;
                    name = `${MONTH_NAMES[month-1]} ${year}`;
                    break;
            }

            if (!acc[key]) {
                acc[key] = { name, realized: 0, pipeline: 0, budget: 0 };
            }

            const saleTotal = sale.units * sale.unitPrice;
            if (sale.invoicePaidDate) {
                const paidDate = new Date(sale.invoicePaidDate);
                if (paidDate >= startDate && paidDate <= endDate) {
                    acc[key].realized += saleTotal;
                } else {
                    acc[key].pipeline += saleTotal;
                }
            } else {
                acc[key].pipeline += saleTotal;
            }
            return acc;

        }, {});
        
        // Add budget data
        Object.keys(aggregated).forEach(key => {
            const [yearStr, periodStr] = key.split('-');
            const year = parseInt(yearStr);

            if(plannedBudget[year]){
                let budgetValue = 0;
                 switch(interval) {
                    case 'Weekly':
                        // This is an approximation
                        const weekNum = parseInt(periodStr.replace('W',''));
                        const monthForWeek = Math.ceil(weekNum / 4.34);
                        budgetValue = (plannedBudget[year].months[monthForWeek]?.summary.incomeStatement.revenue.total || 0) / 4.34;
                        break;
                    case 'Quarterly':
                        const q = parseInt(periodStr.replace('Q',''));
                        const startMonth = (q - 1) * 3 + 1;
                        for(let i=startMonth; i < startMonth+3; i++){
                           budgetValue += plannedBudget[year].months[i]?.summary.incomeStatement.revenue.total || 0;
                        }
                        break;
                    case 'Yearly':
                         budgetValue = plannedBudget[year].summary.incomeStatement.revenue.total;
                        break;
                    case 'Monthly':
                    default:
                        const month = parseInt(periodStr);
                        budgetValue = plannedBudget[year].months[month]?.summary.incomeStatement.revenue.total || 0;
                        break;
                }
                aggregated[key].budget = budgetValue;
            }
        });
        
        // FIX: Explicitly typed the sort callback parameters to resolve type inference issues.
        return Object.values(aggregated).sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

    }, [salesLedgerData, plannedBudget, period, interval]);

    const summary = useMemo(() => {
        const totalRealized = salesData.reduce((sum, d) => sum + d.realized, 0);
        const totalPipeline = salesData.reduce((sum, d) => sum + d.pipeline, 0);
        const totalBudget = salesData.reduce((sum, d) => sum + d.budget, 0);
        const totalProgress = totalRealized + totalPipeline;
        const progressVsBudget = totalBudget > 0 ? (totalProgress / totalBudget) * 100 : 0;
        return { totalRealized, totalPipeline, totalBudget, totalProgress, progressVsBudget };
    }, [salesData]);
    
    return (
        <div className="bg-brand-surface rounded-lg shadow-lg p-6 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-brand-text-primary">Sales Progress</h3>
            
            <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input type="date" value={period.start} onChange={e => handlePeriodChange('start', e.target.value)} className="bg-brand-surface border border-brand-border text-brand-text-primary text-sm rounded-lg p-2 w-full sm:w-auto"/>
                <span className="text-brand-text-secondary">to</span>
                <input type="date" value={period.end} onChange={e => handlePeriodChange('end', e.target.value)} className="bg-brand-surface border border-brand-border text-brand-text-primary text-sm rounded-lg p-2 w-full sm:w-auto"/>
                 <div className="flex-grow"></div>
                <div className="flex items-center gap-1 p-1 bg-gray-900/50 rounded-lg">
                    {(['Weekly', 'Monthly', 'Quarterly', 'Yearly'] as Interval[]).map(i => (
                        <button key={i} onClick={() => setInterval(i)} className={`px-2 py-1 text-xs font-medium rounded-md ${interval === i ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-gray-700'}`}>
                            {i}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryKpi title="Realized Sales" value={formatCurrency(summary.totalRealized)} colorClass="text-brand-secondary" />
                <SummaryKpi title="Sales in Pipeline" value={formatCurrency(summary.totalPipeline)} colorClass="text-brand-accent"/>
                <SummaryKpi title="Progress vs Budget" value={`${summary.progressVsBudget.toFixed(1)}%`} subLabel="Budget" subValue={formatCurrency(summary.totalBudget)}/>
            </div>

            <div className="flex-grow h-64">
                <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={salesData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" tickFormatter={(val) => formatCurrency(val, true)} fontSize={12}/>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        <Bar dataKey="realized" name="Realized Sales" stackId="a" fill="#10B981" />
                        <Bar dataKey="pipeline" name="Sales in Pipeline" stackId="a" fill="#F59E0B" />
                        <Line type="monotone" dataKey="budget" name="Budget" stroke="#9CA3AF" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
};

export default SalesProgressCard;
