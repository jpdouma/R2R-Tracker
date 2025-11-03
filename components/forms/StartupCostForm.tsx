
import React, { useState } from 'react';
import { useDataContext } from '../../contexts/DataContext';
import { CashJournalEntry, Currency } from '../../types';

const StartupCostForm: React.FC = () => {
    const { assumptionsData, setCashJournalData } = useDataContext();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [subCategory, setSubCategory] = useState(assumptionsData.startup.items[0]?.name || '');
    const [amount, setAmount] = useState<number | ''>('');
    const [currency, setCurrency] = useState<Currency>('EUR');
    const [vatIncluded, setVatIncluded] = useState(true);
    const [vatRate, setVatRate] = useState(assumptionsData.exogenous.vatHigh);
    const [remarks, setRemarks] = useState('');

    const startupItems = [...assumptionsData.startup.items.map(i => i.name), 'Unplanned'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof amount !== 'number' || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        const costAmount = vatIncluded ? amount / (1 + vatRate / 100) : amount;

        const newEntry: CashJournalEntry = {
            id: `cj-${Date.now()}-${Math.random()}`,
            date,
            description,
            type: 'Outflow',
            amount: costAmount,
            currency,
            category: 'Investing: Startup Cost',
            subCategory,
            remarks,
        };

        setCashJournalData(prev => [newEntry, ...prev]);

        // Reset form
        setDescription('');
        setAmount('');
        setRemarks('');
        setSubCategory(assumptionsData.startup.items[0]?.name || '');
        setDate(new Date().toISOString().split('T')[0]);
    };

    return (
        <div>
             <h3 className="text-lg font-bold mb-4 text-brand-text-primary">Add Startup Cost</h3>
             <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
                {/* Date */}
                <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    required 
                    className="bg-brand-surface p-2 rounded-md w-40 text-sm outline-none focus:ring-1 focus:ring-brand-primary"
                    aria-label="Date"
                />
                {/* Description */}
                <input 
                    type="text" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Description" 
                    required 
                    className="bg-brand-surface p-2 rounded-md flex-1 text-sm outline-none focus:ring-1 focus:ring-brand-primary"
                    aria-label="Description"
                />
                {/* Amount & Currency */}
                <div className="flex items-center">
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                        step="0.01" 
                        placeholder="Amount"
                        required 
                        className="bg-brand-surface p-2 rounded-l-md w-32 text-sm outline-none focus:ring-1 focus:ring-brand-primary"
                        aria-label="Amount"
                    />
                    <select 
                        value={currency} 
                        onChange={e => setCurrency(e.target.value as Currency)} 
                        className="bg-gray-700 p-2 rounded-r-md text-sm outline-none h-[40px]"
                        aria-label="Currency"
                    >
                        <option>EUR</option>
                        <option>USD</option>
                        <option>UGX</option>
                        <option>THB</option>
                    </select>
                </div>
                {/* VAT */}
                <div className="flex items-center gap-2 bg-brand-surface p-2 rounded-md h-[40px]">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="vat-toggle" 
                            checked={vatIncluded} 
                            onChange={e => setVatIncluded(e.target.checked)} 
                            className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-brand-primary focus:ring-brand-primary"
                        />
                        <label htmlFor="vat-toggle" className="text-sm">VAT</label>
                    </div>
                    {vatIncluded && (
                        <div className="flex items-center gap-1">
                            <input 
                                type="number" 
                                value={vatRate} 
                                onChange={e => setVatRate(parseFloat(e.target.value) || 0)} 
                                className="bg-gray-700 p-1 rounded-md w-16 text-sm text-right"
                                aria-label="VAT Rate"
                            />
                            <span className="text-sm">%</span>
                        </div>
                    )}
                </div>
                {/* Category */}
                <select 
                    value={subCategory} 
                    onChange={e => setSubCategory(e.target.value)} 
                    required 
                    className="bg-brand-surface p-2 rounded-md w-48 text-sm outline-none focus:ring-1 focus:ring-brand-primary"
                    aria-label="Category"
                >
                    <option value="" disabled>Select Category...</option>
                    {startupItems.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                {/* Remarks */}
                <input 
                    type="text" 
                    value={remarks} 
                    onChange={e => setRemarks(e.target.value)} 
                    placeholder="Remarks (optional)" 
                    className="bg-brand-surface p-2 rounded-md flex-1 text-sm outline-none focus:ring-1 focus:ring-brand-primary"
                    aria-label="Remarks"
                />
                {/* Add Button */}
                <button type="submit" className="bg-brand-primary hover:bg-blue-700 text-white font-bold h-[40px] w-12 rounded-lg transition-colors text-lg" aria-label="Add Cost">
                    <i className="fas fa-plus"></i>
                </button>
             </form>
        </div>
    );
};

export default StartupCostForm;
