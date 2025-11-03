
import React from 'react';
import { Granularity } from '../../types';

interface MetricCardProps {
  title: string;
  actual: number;
  budget?: number;
  target?: number;
  isCurrency?: boolean;
  isPercentage?: boolean;
  granularity?: Granularity;
}

const formatValue = (value: number, isCurrency?: boolean, isPercentage?: boolean) => {
  if (isNaN(value)) return "N/A";
  if (isCurrency) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(value);
  }
  if (isPercentage) {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString();
};

const MetricCard: React.FC<MetricCardProps> = ({ title, budget, actual, target, isCurrency, isPercentage, granularity }) => {
  const isDisabled = granularity === 'Weekly' && (title === 'Total Revenue' || title === 'Net Income' || title === 'Gross Margin');
  const isTargetMode = target !== undefined;

  if (isDisabled) {
    return (
        <div className="bg-brand-surface rounded-lg shadow-lg p-5 opacity-50">
          <h3 className="text-sm font-medium text-brand-text-secondary mb-2 truncate">{title}</h3>
           <p className="text-2xl font-bold text-brand-text-primary">-</p>
           <p className="text-xs text-brand-text-secondary mt-2">
            N/A for weekly view
          </p>
        </div>
    );
  }

  const comparisonValue = isTargetMode ? target : budget ?? 0;
  const difference = actual - comparisonValue;
  const isPositive = isTargetMode ? actual >= comparisonValue : difference >= 0;
  const percentageDiff = comparisonValue !== 0 ? (difference / Math.abs(comparisonValue)) * 100 : 0;
  
  const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
  const color = isPositive ? 'text-brand-secondary' : 'text-red-500';

  return (
    <div className="bg-brand-surface rounded-lg shadow-lg p-5">
      <h3 className="text-sm font-medium text-brand-text-secondary mb-2 truncate">{title}</h3>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold text-brand-text-primary">{formatValue(actual, isCurrency, isPercentage)}</p>
        <div className={`flex items-center text-sm font-semibold ${color}`}>
            <i className={`fas ${icon} mr-1`}></i>
            <span>{Math.abs(percentageDiff).toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-xs text-brand-text-secondary mt-2">
        {isTargetMode ? 'Target' : 'Budget'}: {formatValue(comparisonValue, isCurrency, isPercentage)}
      </p>
    </div>
  );
};

export default MetricCard;
