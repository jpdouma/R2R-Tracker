
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { YEARS, MONTH_NAMES } from '../../constants';
import type { Granularity, DetailedFinancialData } from '../../types';
import { useDataContext } from '../../contexts/DataContext';

interface FinancialChartProps {}

const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1e6) {
        return `${(value / 1e6).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1e3) {
        return `${(value / 1e3).toFixed(0)}K`;
    }
    return value.toString();
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-brand-surface p-4 border border-brand-border rounded-lg shadow-lg">
                <p className="font-bold text-brand-text-primary">{label}</p>
                {payload.map((pld: any) => (
                    <div key={pld.dataKey} style={{ color: pld.color }}>
                        {`${pld.name}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(pld.value)}`}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const FinancialChart: React.FC<FinancialChartProps> = () => {
    const { plannedBudget: budgetData, actualData, granularity, selectedYear } = useDataContext();

    const chartData = useMemo(() => {
        switch (granularity) {
            case 'Monthly':
                return MONTH_NAMES.map((monthName, index) => {
                    const month = index + 1;
                    return {
                        name: monthName,
                        'Actual Revenue': actualData[selectedYear].months[month].summary.incomeStatement.revenue.total,
                        'Budget Revenue': budgetData[selectedYear].months[month].summary.incomeStatement.revenue.total,
                        'Actual Net Income': actualData[selectedYear].months[month].summary.incomeStatement.netIncome,
                        'Budget Net Income': budgetData[selectedYear].months[month].summary.incomeStatement.netIncome,
                    };
                });
            case 'Quarterly':
                return [1,2,3,4].map(q => {
                    const months = [q * 3 - 2, q * 3 - 1, q * 3];
                    const aggregate = (data: DetailedFinancialData) => months.reduce((acc, month) => {
                        acc.revenue += data[selectedYear].months[month].summary.incomeStatement.revenue.total;
                        acc.netIncome += data[selectedYear].months[month].summary.incomeStatement.netIncome;
                        return acc;
                    }, { revenue: 0, netIncome: 0 });
                    
                    const actualAgg = aggregate(actualData);
                    const budgetAgg = aggregate(budgetData);

                    return {
                        name: `Q${q}`,
                        'Actual Revenue': actualAgg.revenue,
                        'Budget Revenue': budgetAgg.revenue,
                        'Actual Net Income': actualAgg.netIncome,
                        'Budget Net Income': budgetAgg.netIncome,
                    }
                })
            case 'Weekly': // Not ideal for this chart, show monthly for context
            case 'Yearly':
            default:
                return YEARS.map(year => {
                    const aggregateYear = (data: DetailedFinancialData, y: number) => Object.values(data[y].months).reduce((acc, month) => {
                        acc.revenue += month.summary.incomeStatement.revenue.total;
                        acc.netIncome += month.summary.incomeStatement.netIncome;
                        return acc;
                    }, { revenue: 0, netIncome: 0 });
                    
                    const actualYearAgg = aggregateYear(actualData, year);
                    const budgetYearAgg = aggregateYear(budgetData, year);
                    
                    return {
                        name: year.toString(),
                        'Actual Revenue': actualYearAgg.revenue,
                        'Budget Revenue': budgetYearAgg.revenue,
                        'Actual Net Income': actualYearAgg.netIncome,
                        'Budget Net Income': budgetYearAgg.netIncome,
                    }
                });
        }
    }, [budgetData, actualData, granularity, selectedYear]);

    const title = granularity === 'Weekly' ? `Financial Overview (Context: ${selectedYear} Monthly)` : `Financial Performance (${granularity} View)`;

    return (
         <div className="bg-brand-surface rounded-lg shadow-lg p-6 h-96">
            <h3 className="text-xl font-bold mb-4 text-brand-text-primary">{title}</h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" tickFormatter={formatCurrency}/>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#F9FAFB', paddingTop: '20px' }}/>
                    <Bar dataKey="Budget Revenue" fill="#4B5563" />
                    <Bar dataKey="Actual Revenue" fill="#3B82F6" />
                    <Bar dataKey="Budget Net Income" fill="#F59E0B" opacity={0.6} />
                    <Bar dataKey="Actual Net Income" fill="#F59E0B" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FinancialChart;
