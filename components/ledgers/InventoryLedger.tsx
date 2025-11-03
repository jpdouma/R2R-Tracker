
import React, { useState, useCallback, useMemo } from 'react';
import type { InventoryLedgerItem, Currency } from '../../types';
import { useDataContext } from '../../contexts/DataContext';
import { useEditableRow } from '../../hooks/useEditableRow';

interface InventoryLedgerProps {}

type LedgerTab = 'All' | 'Inflow' | 'Outflow';

const SummaryCard: React.FC<{title: string, value: string}> = ({title, value}) => (
    <div className="bg-gray-800/50 p-4 rounded-lg flex-1">
        <h4 className="text-sm text-brand-text-secondary">{title}</h4>
        <p className="text-2xl font-bold text-brand-text-primary">{value}</p>
    </div>
);

const InventoryLedger: React.FC<InventoryLedgerProps> = () => {
    const { 
        inventoryLedgerData: ledgerData, 
        setInventoryLedgerData: setLedgerData, 
        assumptionsData: assumptions, 
        productSKUs 
    } = useDataContext();

    const [activeTab, setActiveTab] = useState<LedgerTab>('All');
    const { editingRowId, editedData, handleEdit, handleCancel, handleEditChange } = useEditableRow<InventoryLedgerItem>();


    const calculateLandedCost = useCallback((item: InventoryLedgerItem): number => {
        if (item.type === 'Out' || !item.massKg) return 0;

        const { forex, exogenous } = assumptions;

        const convertToEUR = (amount: number, currency: Currency): number => {
            if (currency === 'EUR') return amount;
            if (currency === 'USD') return amount * forex.usdToEur;
            if (currency === 'UGX') return amount * forex.ugxToEur;
            if (currency === 'THB') return amount * forex.eurToUgx / 4100 * 0.92; // Placeholder, needs proper conversion rate
            return 0;
        };

        const coffeeCostEUR = item.coffeeCost ? convertToEUR(item.coffeeCost.amount, item.coffeeCost.currency) : 0;
        const logisticsCostEUR = item.inboundLogisticsCost ? convertToEUR(item.inboundLogisticsCost.amount, item.inboundLogisticsCost.currency) : 0;
        
        const importDuty = coffeeCostEUR * (exogenous.importDuty / 100);
        const exciseDuty = item.massKg * exogenous.exciseDuty;
        const customsFees = item.taxesAndFeesEUR || 0;

        const totalCost = coffeeCostEUR + logisticsCostEUR + importDuty + exciseDuty + customsFees;
        
        const totalCostWithVAT = totalCost * (1 + (exogenous.vatLow / 100));

        return totalCostWithVAT / item.massKg;

    }, [assumptions]);

    const handleSave = () => {
        if (!editedData) return;
        
        const finalData = { ...editedData };
        const product = productSKUs.find(p => p.sku === finalData.sku);
        if (product) {
            finalData.massKg = product.massKgs * finalData.units;
        }
        finalData.landedCostPerKgEUR = calculateLandedCost(finalData);

        setLedgerData(prev => prev.map(item => item.id === finalData.id ? finalData : item));
        handleCancel();
    };

    const handleAddRow = () => {
        const newId = (Math.random() + 1).toString(36).substring(7);
        const newItem: InventoryLedgerItem = {
            id: newId,
            sku: productSKUs[0].sku,
            date: new Date().toISOString().split('T')[0],
            type: activeTab === 'Outflow' ? 'Out' : 'In',
            units: 1,
            massKg: productSKUs[0].massKgs,
            coffeeCost: { amount: 0, currency: 'USD' },
            inboundLogisticsCost: { amount: 0, currency: 'USD' },
            taxesAndFeesEUR: 0,
            checked: false,
        };
        newItem.landedCostPerKgEUR = calculateLandedCost(newItem);
        setLedgerData(prev => [...prev, newItem]);
    };

    const handleDeleteRow = (id: string) => {
        if(window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            setLedgerData(prev => prev.filter(item => item.id !== id));
        }
    };

    const filteredData = useMemo(() => {
        if (activeTab === 'Inflow') return ledgerData.filter(item => item.type === 'In');
        if (activeTab === 'Outflow') return ledgerData.filter(item => item.type === 'Out');
        return ledgerData;
    }, [ledgerData, activeTab]);

    const inventorySummary = useMemo(() => {
        const totalInflowMass = ledgerData.filter(i => i.type === 'In').reduce((sum, i) => sum + i.massKg, 0);
        const totalOutflowMass = ledgerData.filter(i => i.type === 'Out').reduce((sum, i) => sum + i.massKg, 0);
        
        const totalLandedCostValue = ledgerData
            .filter(i => i.type === 'In' && i.landedCostPerKgEUR && i.massKg > 0)
            .reduce((sum, i) => sum + (i.landedCostPerKgEUR! * i.massKg), 0);
            
        const currentStockKg = totalInflowMass - totalOutflowMass;
        const avgLandedCost = totalInflowMass > 0 ? totalLandedCostValue / totalInflowMass : 0;

        return { currentStockKg, avgLandedCost };
    }, [ledgerData]);
    
    const colSpan = useMemo(() => {
        if (activeTab === 'All') return 12;
        if (activeTab === 'Inflow') return 9;
        if (activeTab === 'Outflow') return 7;
        return 12;
    }, [activeTab]);


    return (
        <div>
            <h3 className="text-lg font-bold mb-4 text-brand-text-primary">Inventory Ledger</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <SummaryCard title="Current Stock (KGs)" value={inventorySummary.currentStockKg.toLocaleString('en-US', {maximumFractionDigits: 2})} />
                <SummaryCard title="Average Landed Cost" value={`€${inventorySummary.avgLandedCost.toFixed(2)} / kg`} />
            </div>

            <div className="border-b border-brand-border mb-4">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {(['All', 'Inflow', 'Outflow'] as LedgerTab[]).map((tab) => (
                    <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${
                        activeTab === tab
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-gray-500'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                    >
                    {tab}
                    </button>
                ))}
                </nav>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-sm text-left text-brand-text-secondary">
                    <thead className="text-xs text-brand-text-primary uppercase bg-gray-700/50">
                        <tr>
                            <th className="p-2">SKU | Product</th>
                            <th className="p-2">Date</th>
                            {activeTab === 'All' && <th className="p-2">Type</th>}
                            <th className="p-2">Units</th>
                            <th className="p-2">Mass (KG)</th>
                            {activeTab !== 'Outflow' && <th className="p-2">Coffee Cost</th>}
                            {activeTab !== 'Outflow' && <th className="p-2">Inbound Logistics</th>}
                            {activeTab !== 'Outflow' && <th className="p-2">Taxes/Fees (€)</th>}
                            {activeTab !== 'Outflow' && <th className="p-2">Landed Cost (€/kg)</th>}
                            {activeTab !== 'Inflow' && <th className="p-2">Destination</th>}
                            {activeTab !== 'Inflow' && <th className="p-2">Channel</th>}
                            <th className="p-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                             <tr>
                                <td colSpan={colSpan} className="text-center p-4 text-brand-text-secondary">
                                    No inventory movements recorded yet. Click "Add Transaction" to get started.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map(item => {
                                const isEditing = item.id === editingRowId;
                                return isEditing && editedData ? (
                                    <tr key={item.id} className="bg-gray-700/50">
                                        <td className="p-1 w-48"><select value={editedData.sku} onChange={e => handleEditChange('sku', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary">{productSKUs.map(p => <option key={p.sku} value={p.sku}>{p.sku}</option>)}</select></td>
                                        <td className="p-1"><input type="date" value={editedData.date} onChange={e => handleEditChange('date', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary"/></td>
                                        {activeTab === 'All' && <td className="p-1"><select value={editedData.type} onChange={e => handleEditChange('type', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs"><option>In</option><option>Out</option></select></td>}
                                        <td className="p-1"><input type="number" value={editedData.units} onChange={e => handleEditChange('units', parseInt(e.target.value) || 0)} className="bg-brand-surface p-2 rounded-md w-20 text-xs text-right"/></td>
                                        <td className="p-1"><input type="number" value={editedData.massKg} disabled className="bg-gray-800 p-2 rounded-md w-24 text-xs text-right"/></td>
                                        
                                        {activeTab !== 'Outflow' && (<>
                                            <td className="p-1"><div className="flex gap-1"><input type="number" disabled={editedData.type === 'Out'} value={editedData.coffeeCost?.amount || ''} onChange={e => handleEditChange('coffeeCost.amount', parseFloat(e.target.value) || 0)} className="bg-brand-surface p-2 rounded-md w-28 text-xs text-right disabled:opacity-50"/><select disabled={editedData.type === 'Out'} value={editedData.coffeeCost?.currency || 'USD'} onChange={e => handleEditChange('coffeeCost.currency', e.target.value)} className="bg-brand-surface p-2 rounded-md w-20 text-xs disabled:opacity-50"><option>USD</option><option>EUR</option><option>UGX</option><option>THB</option></select></div></td>
                                            <td className="p-1"><div className="flex gap-1"><input type="number" disabled={editedData.type === 'Out'} value={editedData.inboundLogisticsCost?.amount || ''} onChange={e => handleEditChange('inboundLogisticsCost.amount', parseFloat(e.target.value) || 0)} className="bg-brand-surface p-2 rounded-md w-24 text-xs text-right disabled:opacity-50"/><select disabled={editedData.type === 'Out'} value={editedData.inboundLogisticsCost?.currency || 'USD'} onChange={e => handleEditChange('inboundLogisticsCost.currency', e.target.value)} className="bg-brand-surface p-2 rounded-md w-20 text-xs disabled:opacity-50"><option>USD</option><option>EUR</option><option>UGX</option><option>THB</option></select></div></td>
                                            <td className="p-1"><input type="number" disabled={editedData.type === 'Out'} value={editedData.taxesAndFeesEUR || ''} onChange={e => handleEditChange('taxesAndFeesEUR', parseFloat(e.target.value) || 0)} className="bg-brand-surface p-2 rounded-md w-24 text-xs text-right disabled:opacity-50"/></td>
                                            <td className="p-1 text-right font-mono text-brand-text-primary pr-2">{editedData.type === 'In' ? `€${calculateLandedCost(editedData).toFixed(2)}` : '-'}</td>
                                        </>)}

                                        {activeTab !== 'Inflow' && (<>
                                            <td className="p-1"><input type="text" disabled={editedData.type === 'In'} value={editedData.destination || ''} onChange={e => handleEditChange('destination', e.target.value)} className="bg-brand-surface p-2 rounded-md w-28 text-xs disabled:opacity-50"/></td>
                                            <td className="p-1"><select disabled={editedData.type === 'In'} value={editedData.channel || ''} onChange={e => handleEditChange('channel', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs disabled:opacity-50"><option value="">N/A</option><option>Sales - Online</option><option>Sales - Wholesale</option><option>Sales - HORECA</option></select></td>
                                        </>)}
                                        
                                        <td className="p-1 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={handleSave} className="text-green-400 hover:text-green-300 text-lg"><i className="fas fa-check-circle"></i></button>
                                                <button onClick={handleCancel} className="text-gray-400 hover:text-gray-300 text-lg"><i className="fas fa-times-circle"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={item.id} className={`border-b border-brand-border ${item.type === 'In' ? 'bg-green-900/10' : ''} hover:bg-gray-700/30`}>
                                        <td className="p-2">{item.sku}</td>
                                        <td className="p-2">{item.date}</td>
                                        {activeTab === 'All' && <td className={`p-2 font-semibold ${item.type === 'In' ? 'text-green-400' : 'text-yellow-400'}`}>{item.type}</td>}
                                        <td className="p-2 text-right">{item.units}</td>
                                        <td className="p-2 text-right">{item.massKg.toFixed(2)}</td>
                                        
                                        {activeTab !== 'Outflow' && (<>
                                            <td className="p-2 text-right">{item.coffeeCost ? `${item.coffeeCost.amount.toLocaleString()} ${item.coffeeCost.currency}` : '-'}</td>
                                            <td className="p-2 text-right">{item.inboundLogisticsCost ? `${item.inboundLogisticsCost.amount.toLocaleString()} ${item.inboundLogisticsCost.currency}` : '-'}</td>
                                            <td className="p-2 text-right">€{item.taxesAndFeesEUR?.toFixed(2) || '0.00'}</td>
                                            <td className="p-2 text-right font-mono text-brand-text-primary pr-2">{item.type === 'In' ? `€${(item.landedCostPerKgEUR || 0).toFixed(2)}` : '-'}</td>
                                        </>)}

                                        {activeTab !== 'Inflow' && (<>
                                            <td className="p-2">{item.destination || '-'}</td>
                                            <td className="p-2">{item.channel || '-'}</td>
                                        </>)}
                                        
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
            </div>
            <div className="mt-4">
                <button onClick={handleAddRow} className="bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/40 font-bold py-2 px-4 rounded-lg text-sm">
                    + Add Transaction
                </button>
            </div>
        </div>
    );
};

export default InventoryLedger;
