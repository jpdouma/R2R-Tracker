
import React, { useState } from 'react';
import InventoryLedger from './InventoryLedger';
import CashJournal from './CashJournal';
import SalesLedger from './SalesLedger';
import ActivityLog from './ActivityLog';
import { CollapsibleSection } from '../ui/CollapsibleSection';

type LedgerTabType = 'Sales' | 'Inventory' | 'Cash' | 'Activity';

const LedgerTabs: React.FC = () => {
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
        <CollapsibleSection title="Transaction Ledgers">
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
        </CollapsibleSection>
    );
};

export default LedgerTabs;
