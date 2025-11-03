
import React, { useState } from 'react';
import type { AllAssumptions } from '../../types';
import { useDataContext } from '../../contexts/DataContext';
import { Modal } from '../ui/Modal';

interface ScenarioPlannerProps {
  onClose: () => void;
}

const AssumptionRow: React.FC<{
    label: string;
    baseValue: number;
    scenarioValue: number;
    onChange: (newValue: number) => void;
    unit?: string;
}> = ({ label, baseValue, scenarioValue, onChange, unit }) => {
    const difference = scenarioValue - baseValue;
    const percentageDiff = baseValue !== 0 ? (difference / baseValue) * 100 : (scenarioValue !== 0 ? 100 : 0);

    let diffColor = 'text-gray-400';
    if (percentageDiff > 0) diffColor = 'text-green-400';
    if (percentageDiff < 0) diffColor = 'text-red-400';
    
    return (
        <tr className="border-b border-brand-border">
            <td className="py-2 px-3 text-sm text-brand-text-secondary">{label}</td>
            <td className="py-2 px-3 text-sm text-right font-mono">{baseValue.toFixed(2)} {unit}</td>
            <td className="py-1 px-3">
                <input
                    type="number"
                    value={scenarioValue}
                    onChange={e => onChange(parseFloat(e.target.value) || 0)}
                    className="bg-brand-surface p-2 rounded-md w-full text-sm text-right outline-none focus:ring-1 focus:ring-brand-primary"
                />
            </td>
            <td className={`py-2 px-3 text-sm text-right font-mono ${diffColor}`}>
                {percentageDiff.toFixed(1)}%
            </td>
        </tr>
    );
};


const ScenarioPlanner: React.FC<ScenarioPlannerProps> = ({ onClose }) => {
    const { assumptionsData: baseAssumptions } = useDataContext();
    const [scenarioAssumptions, setScenarioAssumptions] = useState<AllAssumptions>(JSON.parse(JSON.stringify(baseAssumptions)));

    const handleAssumptionChange = (category: keyof AllAssumptions, field: string, value: number) => {
        setScenarioAssumptions(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            // This is a simplified handler for dot notation. A robust solution would handle deeper nesting.
            if (category === 'cogs' || category === 'forex' || category === 'webshop') {
                 (newData[category] as any)[field] = value;
            }
            return newData;
        });
    };

    const modalTitle = (
      <>
        <i className="fas fa-play mr-2 text-brand-secondary"></i>
        Scenario Planner
      </>
    );

    const modalFooter = (
      <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-brand-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Apply Scenario (Coming Soon)
          </button>
      </div>
    );

    return (
        <Modal onClose={onClose} title={modalTitle as unknown as string} footer={modalFooter}>
          <table className="w-full text-left">
              <thead className="sticky top-0 bg-brand-surface">
                  <tr className="border-b border-brand-border">
                      <th className="py-2 px-3 text-sm font-semibold">Assumption</th>
                      <th className="py-2 px-3 text-sm font-semibold text-right">Base Value</th>
                      <th className="py-2 px-3 text-sm font-semibold text-center">Scenario Value</th>
                      <th className="py-2 px-3 text-sm font-semibold text-right">Change</th>
                  </tr>
              </thead>
              <tbody>
                  <tr className="bg-gray-800/50"><td colSpan={4} className="p-2 font-bold text-brand-text-primary">Cost of Goods Sold</td></tr>
                  <AssumptionRow label="Shipping Cost per KG" baseValue={baseAssumptions.cogs.shippingCostPerKgUSD} scenarioValue={scenarioAssumptions.cogs.shippingCostPerKgUSD} onChange={v => handleAssumptionChange('cogs', 'shippingCostPerKgUSD', v)} unit="USD" />
                  <AssumptionRow label="Fulfillment per Order" baseValue={baseAssumptions.cogs.fulfillmentPerOrderEU} scenarioValue={scenarioAssumptions.cogs.fulfillmentPerOrderEU} onChange={v => handleAssumptionChange('cogs', 'fulfillmentPerOrderEU', v)} unit="EUR" />
                  
                  <tr className="bg-gray-800/50"><td colSpan={4} className="p-2 font-bold text-brand-text-primary">Forex</td></tr>
                  <AssumptionRow label="USD to EUR" baseValue={baseAssumptions.forex.usdToEur} scenarioValue={scenarioAssumptions.forex.usdToEur} onChange={v => handleAssumptionChange('forex', 'usdToEur', v)} />

                  <tr className="bg-gray-800/50"><td colSpan={4} className="p-2 font-bold text-brand-text-primary">Webshop</td></tr>
                  <AssumptionRow label="Customer Acquisition Cost (CAC)" baseValue={baseAssumptions.webshop.cac} scenarioValue={scenarioAssumptions.webshop.cac} onChange={v => handleAssumptionChange('webshop', 'cac', v)} unit="EUR" />
                  <AssumptionRow label="Avg. Order Value (excl. VAT)" baseValue={baseAssumptions.webshop.aovExclVat} scenarioValue={scenarioAssumptions.webshop.aovExclVat} onChange={v => handleAssumptionChange('webshop', 'aovExclVat', v)} unit="EUR" />
                  <AssumptionRow label="Growth Rate (CAGR)" baseValue={baseAssumptions.webshop.cagr} scenarioValue={scenarioAssumptions.webshop.cagr} onChange={v => handleAssumptionChange('webshop', 'cagr', v)} unit="%" />

              </tbody>
          </table>
        </Modal>
    );
};

export default ScenarioPlanner;
