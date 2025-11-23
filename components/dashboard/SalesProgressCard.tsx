import React, { useState, useMemo } from 'react';
import { useDataContext } from '../../contexts/DataContext';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LabelList } from 'recharts';
import { MONTH_NAMES } from '../../constants';
import { getModelWeekAndYear, getQuarter, formatCurrency } from '../../utils/dataUtils';

const SummaryKpi: React.FC<{ title: string; value: string; subValue?: string, subLabel?: string, colorClass?: string }> = ({ title, value, subValue, subLabel, colorClass = 'text-brand-text-primary' }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg flex-1">
        <h4 className="text-sm text-brand-text-secondary">{title}</h4>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        {subValue && <p className="text-xs text-brand-text-secondary mt-1">{subLabel}: {subValue}</p>}
    </div>
);

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        // Calculate total budget from its components
        const totalBudget = payload.filter((p: any) => p.dataKey.startsWith('budget')).reduce((acc: number, curr: any) => acc + curr.value, 0);
        
        return (
            <div className="bg-brand-surface p-4 border border-brand-border rounded-lg shadow-lg text-sm">
                <p className="font-bold text-brand-text-primary mb-2">{label}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.fill }}>
                        {pld.name}: {formatCurrency(pld.value)}
                    </p>
                ))}
                <p className="font-semibold text-brand-text-primary mt-2 pt-2 border-t border-brand-border">Total Budget: {formatCurrency(totalBudget)}</p>
            </div>
        );
    }
    return null;
};

type Interval = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

const SalesProgressCard: React.FC = () => {
    const { salesLedgerData, plannedBudget } = useDataContext();
    
    const getInitialPeriod = () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 28);
        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
        };
    };

    const [period, setPeriod] = useState(getInitialPeriod());
    const [interval, setInterval] = useState<Interval>('Weekly');

    const handlePeriodChange = (field: 'start' | 'end', value: string) => {
        setPeriod(prev => ({ ...prev, [field]: value }));
    };

    const salesData = useMemo(() => {
        const startDate = new Date(`${period.start}T00:00:00Z`);
        const endDate = new Date(`${period.end}T23:59:59Z`);

        const data = new Map<string, {name: string, realized: number, pipeline: number, budgetOnline: number, budgetRetail: number, budgetHoreca: number, totalBudget: number}>();

        let currentDate = new Date(startDate);
        while(currentDate <= endDate) {
            const year = currentDate.getUTCFullYear();
            const month = currentDate.getUTCMonth() + 1;
            const quarter = getQuarter(currentDate);

            let key: string, name: string;
            let budget = { online: 0, retail: 0, horeca: 0 };
            let nextDate = new Date(currentDate);

            switch(interval) {
                case 'Weekly': {
                    const { week, year: weekYear } = getModelWeekAndYear(currentDate);
                    key = `${weekYear}-W${week}`;
                    name = `W${week}`;

                    const budgetYear = weekYear;
                    const budgetMonth = Math.floor((week - 1) / 4) + 1;
                    const budgetWeekOfMonth = ((week - 1) % 4) + 1;
                    
                    const yearBudget = plannedBudget[budgetYear];
                    if(yearBudget?.months[budgetMonth]?.weeks[budgetWeekOfMonth]) {
                        const wBudget = yearBudget.months[budgetMonth].weeks[budgetWeekOfMonth].incomeStatement.revenue;
                        budget.online = wBudget.online;
                        budget.retail = wBudget.retail;
                        budget.horeca = wBudget.horeca;
                    }

                    nextDate.setUTCDate(currentDate.getUTCDate() + 7);
                    break;
                }
                case 'Quarterly': {
                    key = `${year}-Q${quarter}`;
                    name = `Q${quarter}`;
                    const startMonth = (quarter - 1) * 3 + 1;
                    for(let i=startMonth; i < startMonth+3; i++){
                        if (plannedBudget[year]?.months[i]) {
                            const mBudget = plannedBudget[year].months[i].summary.incomeStatement.revenue;
                            budget.online += mBudget.online;
                            budget.retail += mBudget.retail;
                            budget.horeca += mBudget.horeca;
                        }
                    }
                    nextDate.setUTCMonth(currentDate.getUTCMonth() + 3);
                    break;
                }
                case 'Yearly': {
                    key = `${year}`;
                    name = `${year}`;
                    if(plannedBudget[year]) {
                        const yBudget = plannedBudget[year].summary.incomeStatement.revenue;
                        budget.online = yBudget.online;
                        budget.retail = yBudget.retail;
                        budget.horeca = yBudget.horeca;
                    }
                    nextDate.setUTCFullYear(currentDate.getUTCFullYear() + 1);
                    break;
                }
                case 'Monthly':
                default: {
                    key = `${year}-${month}`;
                    name = `${MONTH_NAMES[month-1]}`;
                    if (plannedBudget[year]?.months[month]) {
                        const mBudget = plannedBudget[year].months[month].summary.incomeStatement.revenue;
                        budget.online = mBudget.online;
                        budget.retail = mBudget.retail;
                        budget.horeca = mBudget.horeca;
                    }
                    nextDate.setUTCMonth(currentDate.getUTCMonth() + 1);
                    break;
                }
            }
            if(!data.has(key)) {
                 const totalBudgetForPeriod = budget.online + budget.retail + budget.horeca;
                data.set(key, { 
                    name, 
                    realized: 0, 
                    pipeline: 0, 
                    budgetOnline: budget.online, 
                    budgetRetail: budget.retail, 
                    budgetHoreca: budget.horeca,
                    totalBudget: totalBudgetForPeriod
                });
            }
            currentDate = nextDate;
        }

        salesLedgerData.forEach(s => {
            const orderDate = new Date(s.orderDate);
            if(orderDate >= startDate && orderDate <= endDate) {
                const year = orderDate.getUTCFullYear();
                const month = orderDate.getUTCMonth() + 1;
                const quarter = getQuarter(orderDate);

                let key: string;
                switch(interval) {
                    case 'Weekly': {
                        const { week, year: weekYear } = getModelWeekAndYear(orderDate);
                        key = `${weekYear}-W${week}`; 
                        break;
                    }
                    case 'Quarterly': key = `${year}-Q${quarter}`; break;
                    case 'Yearly': key = `${year}`; break;
                    default: key = `${year}-${month}`; break;
                }
                
                let entry = data.get(key);
                if (entry) {
                    const saleTotal = s.units * s.unitPrice;
                    if (s.invoicePaidDate) {
                        entry.realized += saleTotal;
                    } else {
                        entry.pipeline += saleTotal;
                    }
                }
            }
        });

        return Array.from(data.values());
    }, [salesLedgerData, plannedBudget, period, interval]);

    const summary = useMemo(() => {
        const totals = salesData.reduce((acc, d) => {
            acc.realized += d.realized;
            acc.pipeline += d.pipeline;
            acc.budget += d.totalBudget;
            return acc;
        }, { realized: 0, pipeline: 0, budget: 0 });

        const progressVsBudget = totals.budget > 0 ? (totals.realized / totals.budget) * 100 : 0;
        
        return { 
            totalRealized: totals.realized, 
            totalPipeline: totals.pipeline, 
            totalBudget: totals.budget,
            progressVsBudget 
        };
    }, [salesData]);
    
    const hasData = useMemo(() => salesData.some(d => d.realized > 0 || d.pipeline > 0 || d.totalBudget > 0), [salesData]);

    const CustomBarLabel = (props: any) => {
        const { x, y, width, index } = props;
        const dataPoint = salesData[index];
        
        if (!dataPoint || dataPoint.totalBudget <= 0) {
            return null;
        }
        
        const percentage = (dataPoint.realized / dataPoint.totalBudget) * 100;
        
        if(width < 25) return null;

        return (
            <text x={x + width / 2} y={y} fill="#F9FAFB" textAnchor="middle" dy={-6} fontSize={12} className="font-semibold">
                {`${percentage.toFixed(0)}%`}
            </text>
        );
    };

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
                <SummaryKpi title="Realized Sales" value={formatCurrency(summary.totalRealized, true)} colorClass="text-brand-secondary" />
                <SummaryKpi title="Sales in Pipeline" value={formatCurrency(summary.totalPipeline, true)} colorClass="text-brand-accent"/>
                <SummaryKpi title="Progress vs Budget" value={`${summary.progressVsBudget.toFixed(1)}%`} subLabel="Budget" subValue={formatCurrency(summary.totalBudget, true)}/>
            </div>

            <div className="flex-grow h-64">
                {!hasData ? (
                    <div className="flex items-center justify-center h-full text-brand-text-secondary">
                        <p>No budget or sales data available for the selected period.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={salesData} margin={{ top: 20, right: 10, bottom: 5, left: -20 }} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                            <YAxis stroke="#9CA3AF" tickFormatter={(val) => formatCurrency(val, true)} fontSize={12}/>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                            
                            <Bar dataKey="budgetOnline" name="Budget: Online" stackId="budget" fill="#3B82F6" fillOpacity={0.7}/>
                            <Bar dataKey="budgetRetail" name="Budget: Retail" stackId="budget" fill="#14B8A6" fillOpacity={0.7}/>
                            <Bar dataKey="budgetHoreca" name="Budget: HORECA" stackId="budget" fill="#A855F7" fillOpacity={0.7}>
                                <LabelList dataKey="totalBudget" content={<CustomBarLabel />} />
                            </Bar>
                            
                            <Bar dataKey="realized" name="Realized" fill="#10B981" radius={[4, 4, 0, 0]} />
                            
                            <Bar dataKey="pipeline" name="Pipeline" fill="#F59E0B" radius={[4, 4, 0, 0]} />

                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
};

export default SalesProgressCard;