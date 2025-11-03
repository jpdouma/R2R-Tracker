import React, { useState } from 'react';
import InventoryLedger from './InventoryLedger';
import CashJournal from './CashJournal';
import SalesLedger from './SalesLedger';
import ActivityLog from './ActivityLog';

type LedgerTabType = 'Sales' | 'Inventory' | 'Cash' | 'Activity';

const LedgerTabs: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<LedgerTabType>('Sales');

    const renderActiveLedger = () => {
        switch (activeTab) {
            case 'Sales':
                return <SalesLedger />;
            case 'Inventory':
                return <InventoryLedger />;
            case 'Cash':
                return <CashJournal />;
            case 'Activity':
                 return <ActivityLog />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-brand-surface rounded-lg shadow-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 flex justify-between items-center text-left">
                <h2 className="text-xl font-bold text-brand-text-primary">Transaction Ledgers</h2>
                <i className={`fas fa-chevron-down transform transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && (
                 <div className="p-4 border-t border-brand-border">
                    <div className="border-b border-brand-border mb-4">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        {(['Sales', 'Inventory', 'Cash', 'Activity'] as LedgerTabType[]).map((tab) => (
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
                    <div className="mt-4">
                        {renderActiveLedger()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LedgerTabs;
