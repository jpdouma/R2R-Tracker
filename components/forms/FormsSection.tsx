import React, { useState, useRef } from 'react';
import StartupCostForm from './StartupCostForm';
import { useDataContext } from '../../contexts/DataContext';
import { CashJournalEntry, ExportData } from '../../types';
import { CollapsibleSection } from '../ui/CollapsibleSection';

type FormTabType = 'Startup Costs'; // Add more later e.g. | 'New Sale'

const FormsSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<FormTabType>('Startup Costs');
    const { cashJournalData, setCashJournalData } = useDataContext();
    const legacyFileInputRef = useRef<HTMLInputElement>(null);
    const [isLegacyImporting, setIsLegacyImporting] = useState(false);
    const [legacyImportStatus, setLegacyImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

     const handleLegacyFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLegacyImporting(true);
        setLegacyImportStatus({ message: 'Importing legacy costs...', type: 'success' });

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read.");
                
                const parsedData = JSON.parse(text) as Partial<ExportData>;
                
                if (!parsedData.cashJournalData || !Array.isArray(parsedData.cashJournalData)) {
                    throw new Error("Invalid file: Does not contain 'cashJournalData'.");
                }
                
                const legacyStartupCosts = parsedData.cashJournalData.filter(
                    (entry: CashJournalEntry) => entry.category === 'Investing: Startup Cost'
                );

                if (legacyStartupCosts.length === 0) {
                     throw new Error("No startup costs found in this file.");
                }

                const existingIds = new Set(cashJournalData.map(entry => entry.id));
                const newEntries = legacyStartupCosts.filter(entry => !existingIds.has(entry.id));

                if (newEntries.length === 0) {
                    setLegacyImportStatus({ message: 'Success! No new startup costs to import.', type: 'success' });
                } else {
                    setCashJournalData(prev => [...prev, ...newEntries]);
                    setLegacyImportStatus({ message: `Successfully imported ${newEntries.length} new startup cost entries.`, type: 'success' });
                }

            } catch (error: any) {
                setLegacyImportStatus({ message: `Import failed: ${error.message}`, type: 'error' });
            } finally {
                setIsLegacyImporting(false);
                if (event.target) event.target.value = ''; // Reset input
                setTimeout(() => setLegacyImportStatus(null), 7000);
            }
        };
        reader.onerror = () => {
            setLegacyImportStatus({ message: 'Error reading file.', type: 'error' });
            setIsLegacyImporting(false);
            if (event.target) event.target.value = '';
            setTimeout(() => setLegacyImportStatus(null), 7000);
        };
        reader.readAsText(file);
    };

    const renderActiveForm = () => {
        switch (activeTab) {
            case 'Startup Costs':
                return (
                    <div>
                        <div className="flex justify-end mb-4">
                            <input type="file" ref={legacyFileInputRef} onChange={handleLegacyFileChange} style={{ display: 'none' }} accept=".json" disabled={isLegacyImporting} />
                            <button
                                onClick={() => legacyFileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-brand-text-secondary bg-gray-800 border border-brand-border rounded-lg shadow-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                                disabled={isLegacyImporting}
                                title="Import startup costs from a previous JSON export"
                            >
                                {isLegacyImporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-history"></i>}
                                Import Legacy Startup Costs
                            </button>
                        </div>
                        {legacyImportStatus && (
                            <div className={`p-2 mb-4 rounded-md text-sm text-center transition-opacity duration-300 ${legacyImportStatus.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                {legacyImportStatus.message}
                            </div>
                        )}
                        <StartupCostForm />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <CollapsibleSection title="Forms">
            <div className="border-b border-brand-border mb-4">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {(['Startup Costs'] as FormTabType[]).map((tab) => (
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
                {renderActiveForm()}
            </div>
        </CollapsibleSection>
    );
};

export default FormsSection;
