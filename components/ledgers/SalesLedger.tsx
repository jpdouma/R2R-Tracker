import React from 'react';
import type { SalesLedgerEntry } from '../../types';
import { useDataContext } from '../../contexts/DataContext';
import { useEditableRow } from '../../hooks/useEditableRow';

interface SalesLedgerProps {}

const SalesLedger: React.FC<SalesLedgerProps> = () => {
    const { 
        salesLedgerData: ledgerData, 
        setSalesLedgerData: setLedgerData, 
        productSKUs 
    } = useDataContext();

    const { editingRowId, editedData, handleEdit, handleCancel, handleEditChange } = useEditableRow<SalesLedgerEntry>();
    
    const handleSave = () => {
        if (!editedData) return;
        setLedgerData(prev => prev.map(item => item.id === editedData.id ? editedData : item));
        handleCancel();
    };

    const handleAddRow = () => {
        const newId = (Math.random() + 1).toString(36).substring(7);
        const newItem: SalesLedgerEntry = {
            id: newId,
            orderDate: new Date().toISOString().split('T')[0],
            sku: productSKUs[0].sku,
            units: 1,
            unitPrice: 0,
            channel: 'Sales - Online',
            customerId: ''
        };
        setLedgerData(prev => [...prev, newItem]);
    };

    const handleDeleteRow = (id: string) => {
        if (window.confirm('Are you sure you want to delete this sale entry? This cannot be undone.')) {
            setLedgerData(prev => prev.filter(item => item.id !== id));
        }
    };

    return (
        <div className="overflow-x-auto">
            <h3 className="text-lg font-bold mb-4 text-brand-text-primary">Sales Ledger</h3>
            <table className="w-full min-w-[800px] text-sm text-left text-brand-text-secondary">
                <thead className="text-xs text-brand-text-primary uppercase bg-gray-700/50">
                    <tr>
                        <th className="p-2">Order Date</th>
                        <th className="p-2">Paid Date</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">SKU</th>
                        <th className="p-2">Units</th>
                        <th className="p-2">Unit Price (€)</th>
                        <th className="p-2">Channel</th>
                        <th className="p-2 text-right">Support (€)</th>
                        <th className="p-2 text-right">Total Sale (€)</th>
                        <th className="p-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {ledgerData.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="text-center p-4 text-brand-text-secondary">
                                No sales recorded yet. Click "Add Sale" to get started.
                            </td>
                        </tr>
                    ) : (
                        ledgerData.map(item => {
                            const isEditing = item.id === editingRowId;
                            return isEditing && editedData ? (
                                <tr key={item.id} className="bg-gray-700/50">
                                    <td className="p-1 w-40"><input type="date" value={editedData.orderDate} onChange={e => handleEditChange('orderDate', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary"/></td>
                                    <td className="p-1 w-40"><input type="date" value={editedData.invoicePaidDate || ''} onChange={e => handleEditChange('invoicePaidDate', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary"/></td>
                                    <td className="p-1"></td>
                                    <td className="p-1 w-48">
                                        <select value={editedData.sku} onChange={e => handleEditChange('sku', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary">
                                            {productSKUs.map(p => <option key={p.sku} value={p.sku}>{p.sku}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-1 w-24"><input type="number" value={editedData.units} onChange={e => handleEditChange('units', parseInt(e.target.value) || 0)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary text-right"/></td>
                                    <td className="p-1 w-32"><input type="number" value={editedData.unitPrice} onChange={e => handleEditChange('unitPrice', parseFloat(e.target.value) || 0)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary text-right"/></td>
                                    <td className="p-1 w-48">
                                        <select value={editedData.channel} onChange={e => handleEditChange('channel', e.target.value as SalesLedgerEntry['channel'])} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary">
                                            <option>Sales - Online</option><option>Sales - Retail</option><option>Sales - HORECA</option>
                                        </select>
                                    </td>
                                    <td className="p-1 w-32"><input type="number" value={editedData.supportDonation || ''} onChange={e => handleEditChange('supportDonation', parseFloat(e.target.value) || 0)} placeholder="N/A" className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary text-right"/></td>
                                    <td className="p-1 text-right font-mono text-brand-text-primary pr-2">{((editedData.units * editedData.unitPrice) || 0).toFixed(2)}</td>
                                    <td className="p-1 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={handleSave} className="text-green-400 hover:text-green-300 text-lg"><i className="fas fa-check-circle"></i></button>
                                            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-300 text-lg"><i className="fas fa-times-circle"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={item.id} className="border-b border-brand-border hover:bg-gray-700/30 align-top">
                                    <td className="p-2">{item.orderDate}</td>
                                    <td className="p-2">{item.invoicePaidDate || '-'}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            item.invoicePaidDate 
                                            ? 'bg-green-500/20 text-green-300' 
                                            : 'bg-yellow-500/20 text-yellow-300'
                                        }`}>
                                            {item.invoicePaidDate ? 'Realized' : 'Pipeline'}
                                        </span>
                                    </td>
                                    <td className="p-2">{item.sku}</td>
                                    <td className="p-2 text-right">{item.units}</td>
                                    <td className="p-2 text-right">{item.unitPrice.toFixed(2)}</td>
                                    <td className="p-2">{item.channel}</td>
                                    <td className="p-2 text-right">{item.supportDonation?.toFixed(2) || '-'}</td>
                                    <td className="p-2 text-right font-mono text-brand-text-primary pr-2">{((item.units * item.unitPrice) || 0).toFixed(2)}</td>
                                    <td className="p-1 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button onClick={() => handleEdit(item)} className="text-brand-accent/70 hover:text-brand-accent text-base"><i className="fas fa-pencil-alt"></i></button>
                                            <button onClick={() => handleDeleteRow(item.id)} className="text-red-500/60 hover:text-red-500 text-base"><i className="fas fa-trash-alt"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
             <div className="mt-4">
                <button onClick={handleAddRow} className="bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/40 font-bold py-2 px-4 rounded-lg text-sm">
                    + Add Sale
                </button>
            </div>
        </div>
    );
};

export default SalesLedger;