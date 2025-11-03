


import React, { useState } from 'react';
// Fix: Added KeyMetric import to resolve typing issues.
import type { OKR, KeyResult, KeyMetric } from '../types';
import { KEY_METRICS } from '../constants';
import { useDataContext } from '../contexts/DataContext';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-brand-border mt-6 pt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-2 bg-gray-800/50 hover:bg-gray-800/80 rounded-md"
            >
                <h4 className="font-semibold text-brand-text-primary">{title}</h4>
                <i className={`fas fa-chevron-down transform transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && <div className="mt-2">{children}</div>}
        </div>
    );
};


const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const safeProgress = Math.min(100, Math.max(0, progress));
  let colorClass = 'bg-brand-primary';
  if (safeProgress < 30) colorClass = 'bg-red-500';
  else if (safeProgress < 70) colorClass = 'bg-brand-accent';
  else colorClass = 'bg-brand-secondary';
  
  return (
    <div className="w-full bg-brand-border rounded-full h-2.5">
      <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${safeProgress}%` }}></div>
    </div>
  );
};

const KeyResultView: React.FC<{ kr: KeyResult }> = ({ kr }) => {
  const progressPercentage = kr.target !== 0 ? (kr.current / kr.target) * 100 : 0;
  const formatValue = (val: number) => kr.unit === '€' ? new Intl.NumberFormat('en-US', { notation: 'compact', currency: 'EUR', style: 'currency' }).format(val) : `${val.toFixed(1)}%`;
  
  return (
    <div className="mt-3">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm text-brand-text-secondary">{kr.name}</span>
        <span className="text-xs font-mono text-brand-text-primary">{formatValue(kr.current)} / {formatValue(kr.target)}</span>
      </div>
      <ProgressBar progress={progressPercentage} />
    </div>
  );
};

const OKRTracker: React.FC = () => {
  const { okrs } = useDataContext();
  // Fix: Explicitly typed the accumulator for the reduce function to ensure correct type inference.
  const groupedMetrics = KEY_METRICS.reduce<Record<string, KeyMetric[]>>((acc, metric) => {
    (acc[metric.category] = acc[metric.category] || []).push(metric);
    return acc;
  }, {});

  return (
    <div>
      <div className="space-y-6">
        {okrs.map((okr) => (
          <div key={okr.id} className="p-4 bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-brand-text-primary">{okr.objective}</h4>
            <div className="mt-2 space-y-2">
              {okr.keyResults.map((kr) => (
                <KeyResultView key={kr.id} kr={kr} />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <AccordionItem title="Key Metrics Library">
        <div className="max-h-80 overflow-y-auto mt-2 pr-2">
            {Object.entries(groupedMetrics).map(([category, metrics]) => (
                <div key={category} className="mb-4">
                    <h5 className="font-bold text-brand-text-primary text-md mb-2">{category}</h5>
                    <div className="space-y-2">
                        {metrics.map(metric => (
                            <div key={metric.name} className="p-2 bg-gray-900/50 rounded-md text-sm">
                                <p className="font-semibold text-brand-text-secondary">{metric.name}</p>
                                <p className="text-xs font-mono text-gray-400 mt-1">{metric.formula}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </AccordionItem>
    </div>
  );
};

export default OKRTracker;