import React, { useState } from 'react';
import type { CashJournalEntry } from '../types';
import { JOURNAL_CATEGORIES } from '../constants';
import { useDataContext } from '../contexts/DataContext';

interface CashJournalProps {}

const formatCurrencyDisplay = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value);

const CashJournal: React.FC<CashJournalProps> = () => {
    const { 
        cashJournalData: journalData, 
        setCashJournalData: setJournalData, 
        assumptionsData: assumptions 
    } = useDataContext();
    
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [editedData, setEditedData] = useState<CashJournalEntry | null>(null);

    const handleEdit = (item: CashJournalEntry) => {
        setEditingRowId(item.id);
        setEditedData({ ...item });
    };

    const handleCancel = () => {
        setEditingRowId(null);
        setEditedData(null);
    };

    const handleSave = () => {
        if (!editedData) return;
        setJournalData(prev => prev.map(item => item.id === editedData.id ? editedData : item));
        handleCancel();
    };

    const handleEditChange = (field: keyof CashJournalEntry, value: any) => {
        if (editedData) {
            const updatedData = { ...editedData, [field]: value };
            if (field === 'category') {
                updatedData.subCategory = ''; // Reset on category change
            }
            if (field === 'type') { // Ensure amount is positive
                updatedData.amount = Math.abs(updatedData.amount);
            }
            setEditedData(updatedData);
        }
    };

    const handleAddRow = () => {
        const newId = (Math.random() + 1).toString(36).substring(7);
        const newItem: CashJournalEntry = {
            id: newId,
            date: new Date().toISOString().split('T')[0],
            description: 'New Transaction',
            type: 'Outflow',
            amount: 0,
            currency: 'EUR',
            category: 'OpEx: Other',
        };
        setJournalData(prev => [...prev, newItem]);
    };

    const handleDeleteRow = (id: string) => {
        if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            setJournalData(prev => prev.filter(item => item.id !== id));
        }
    };
    
    const startupCostItems = assumptions.startup.items.map(item => item.name);

    const balance = journalData.reduce((acc, item) => {
        const amountInEur = item.amount; // Assuming EUR for now
        return acc + (item.type === 'Inflow' ? amountInEur : -amountInEur);
    }, 0);

    return (
        <div className="overflow-x-auto">
            <h3 className="text-lg font-bold mb-4 text-brand-text-primary">Cash Journal</h3>
            <table className="w-full min-w-[900px] text-sm text-left text-brand-text-secondary">
                <thead className="text-xs text-brand-text-primary uppercase bg-gray-700/50">
                    <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Description</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Sub-Category</th>
                        <th className="p-2">Remarks</th>
                        <th className="p-2 text-right">Inflow (€)</th>
                        <th className="p-2 text-right">Outflow (€)</th>
                        <th className="p-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {journalData.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="text-center p-4 text-brand-text-secondary">
                                No transactions recorded yet. Click "Add Transaction" to get started.
                            </td>
                        </tr>
                    ) : (
                        journalData.map(item => {
                            const isEditing = item.id === editingRowId;
                            return isEditing && editedData ? (
                               <tr key={item.id} className="bg-gray-700/50">
                                    <td className="p-1 w-40"><input type="date" value={editedData.date} onChange={e => handleEditChange('date', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary"/></td>
                                    <td className="p-1"><input type="text" value={editedData.description} onChange={e => handleEditChange('description', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary"/></td>
                                    <td className="p-1 w-48">
                                         <select value={editedData.category} onChange={e => handleEditChange('category', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary">
                                            {Object.entries(JOURNAL_CATEGORIES).map(([group, items]) => <optgroup label={group} key={group}>{items.map(cat => <option key={cat} value={cat}>{cat}</option>)}</optgroup>)}
                                        </select>
                                    </td>
                                    <td className="p-1 w-48">
                                        {editedData.category === 'Investing: Startup Cost' ? (
                                            <select value={editedData.subCategory || ''} onChange={e => handleEditChange('subCategory', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary">
                                                <option value="">Select Item...</option>
                                                {startupCostItems.map(costItem => <option key={costItem} value={costItem}>{costItem}</option>)}
                                                <option value="Unplanned">Unplanned</option>
                                            </select>
                                        ) : ( <span className="p-2 text-gray-500 text-xs">N/A</span> )}
                                    </td>
                                    <td className="p-1"><input type="text" value={editedData.remarks || ''} onChange={e => handleEditChange('remarks', e.target.value)} placeholder="N/A" className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary"/></td>
                                    <td className="p-1 text-right" colSpan={2}>
                                        <div className="flex gap-2">
                                            <select value={editedData.type} onChange={e => handleEditChange('type', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary">
                                                <option value='Inflow'>Inflow</option>
                                                <option value='Outflow'>Outflow</option>
                                            </select>
                                            <input type="number" value={editedData.amount} onChange={e => handleEditChange('amount', parseFloat(e.target.value) || 0)} className="bg-brand-surface p-2 rounded-md w-full text-xs text-right"/>
                                        </div>
                                    </td>
                                    <td className="p-1 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={handleSave} className="text-green-400 hover:text-green-300 text-lg"><i className="fas fa-check-circle"></i></button>
                                            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-300 text-lg"><i className="fas fa-times-circle"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={item.id} className="border-b border-brand-border hover:bg-gray-700/30">
                                    <td className="p-2">{item.date}</td>
                                    <td className="p-2">{item.description}</td>
                                    <td className="p-2">{item.category}</td>
                                    <td className="p-2">{item.subCategory || '-'}</td>
                                    <td className="p-2">{item.remarks || '-'}</td>
                                    <td className="p-2 text-right text-green-400">{item.type === 'Inflow' ? formatCurrencyDisplay(item.amount) : '-'}</td>
                                    <td className="p-2 text-right text-red-400">{item.type === 'Outflow' ? formatCurrencyDisplay(item.amount) : '-'}</td>
                                    <td className="p-1 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button onClick={() => handleEdit(item)} className="text-brand-accent/70 hover:text-brand-accent text-base"><i className="fas fa-pencil-alt"></i></button>
                                            <button onClick={() => handleDeleteRow(item.id)} className="text-red-500/60 hover:text-red-500 text-base"><i className="fas fa-trash-alt"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
                <tfoot>
                    <tr className="font-bold text-brand-text-primary bg-gray-800/50">
                        <td colSpan={5} className="p-2 text-right">Ending Balance:</td>
                        <td colSpan={2} className={`p-2 text-right ${balance >= 0 ? 'text-brand-secondary' : 'text-red-500'}`}>
                            {formatCurrencyDisplay(balance)}
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            <div className="mt-4">
                <button onClick={handleAddRow} className="bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/40 font-bold py-2 px-4 rounded-lg text-sm">
                    + Add Transaction
                </button>
            </div>
        </div>
    );
};

export default CashJournal;