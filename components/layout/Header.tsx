
import React, { useRef, useState } from 'react';
import { Granularity, ExportData } from '../../types';
import { MONTH_NAMES, YEARS, DATA_VERSION } from '../../constants';
import { useDataContext } from '../../contexts/DataContext';

const GranularityButton: React.FC<{label: Granularity, current: Granularity, onClick: (g: Granularity) => void}> = ({label, current, onClick}) => (
    <button
        onClick={() => onClick(label)}
        className={`px-3 py-1 text-sm font-medium rounded-md ${current === label ? 'bg-brand-primary text-white' : 'bg-brand-surface text-brand-text-secondary hover:bg-gray-600'}`}
    >
        {label}
    </button>
)

const validateImportData = (data: any): ExportData => {
    // 1. Version Check
    if (!data.version || typeof data.version !== 'string') {
        throw new Error("Invalid file: Missing or invalid version number.");
    }
    if (data.version !== DATA_VERSION) {
        throw new Error(`Version mismatch. App requires v${DATA_VERSION}, file is v${data.version}.`);
    }

    // 2. Top-level keys check
    const requiredKeys: (keyof ExportData)[] = ['plannedBudget', 'assumptionsData', 'okrs', 'pricingData', 'inventoryLedgerData', 'cashJournalData', 'salesLedgerData', 'activityLogData'];
    for (const key of requiredKeys) {
        if (!(key in data)) {
            throw new Error(`Invalid file: Missing required data key "${key}".`);
        }
    }

    // 3. Basic structural integrity check (are arrays actual arrays?)
    const arrayKeys: (keyof ExportData)[] = ['okrs', 'inventoryLedgerData', 'cashJournalData', 'salesLedgerData', 'activityLogData'];
    for (const key of arrayKeys) {
        if (!Array.isArray(data[key])) {
            throw new Error(`Invalid file: Data key "${key}" should be an array.`);
        }
    }
    
    // 4. Deeper check for a critical nested property
    if (!data.assumptionsData?.startup?.items || !Array.isArray(data.assumptionsData.startup.items)) {
         throw new Error(`Invalid file: assumptionsData.startup.items is missing or not an array.`);
    }

    if (!data.plannedBudget || typeof data.plannedBudget !== 'object' || !data.plannedBudget[YEARS[0]]) {
        throw new Error(`Invalid file: plannedBudget is missing or has an invalid structure.`);
    }

    return data as ExportData;
}


const Header: React.FC = () => {
  const { 
    selectedYear, 
    setSelectedYear, 
    granularity, 
    setGranularity, 
    subPeriod, 
    setSubPeriod,
    plannedBudget,
    assumptionsData,
    okrs,
    pricingData,
    inventoryLedgerData,
    cashJournalData,
    salesLedgerData,
    activityLogData,
    importData,
  } = useDataContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleGranularityChange = (g: Granularity) => {
    setGranularity(g);
    setSubPeriod(1);
  };
  
  const getWeekSunday = (year: number, weekNum: number): string => {
    // Note: This logic aligns with the 4-week-per-month data model.
    const monthIndex = Math.floor((weekNum - 1) / 4);
    const weekInMonth = (weekNum - 1) % 4;
    const approxDay = (weekInMonth + 1) * 7;
    
    const date = new Date(year, monthIndex, approxDay);
    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
    
    // If it's not Sunday, find the next Sunday
    const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    date.setDate(date.getDate() + daysToAdd);
    
    // Format to MMM/DD/YYYY
    const month = MONTH_NAMES[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    const formattedYear = date.getFullYear();
    
    return `${month}/${day}/${formattedYear}`;
  }

  const handleExport = () => {
    try {
        const exportData: ExportData = {
            version: DATA_VERSION,
            plannedBudget,
            assumptionsData,
            okrs,
            pricingData,
            inventoryLedgerData,
            cashJournalData,
            salesLedgerData,
            activityLogData,
        };
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial_dashboard_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export data:", error);
        setImportStatus({ message: 'Export failed. Check console for details.', type: 'error' });
        setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus({ message: 'Importing...', type: 'success' });

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File could not be read as text.");
            
            const parsedData = JSON.parse(text);
            const validatedData = validateImportData(parsedData);
            
            importData(validatedData);

            setImportStatus({ message: 'Data imported successfully!', type: 'success' });

        } catch (error: any) {
            setImportStatus({ message: `Import failed: ${error.message}`, type: 'error' });
        } finally {
            setIsImporting(false);
            if (event.target) event.target.value = ''; // Reset input
            setTimeout(() => setImportStatus(null), 5000);
        }
    };
    reader.onerror = () => {
        setImportStatus({ message: 'Error reading the selected file.', type: 'error' });
        setIsImporting(false);
         if (event.target) event.target.value = '';
        setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  const renderSubPeriodSelector = () => {
    switch(granularity) {
        case 'Quarterly':
            return (
                 <select value={subPeriod} onChange={e => setSubPeriod(Number(e.target.value))} className="bg-brand-surface border border-brand-border text-brand-text-primary text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block w-full p-2.5">
                    {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
                 </select>
            );
        case 'Monthly':
            return (
                 <select value={subPeriod} onChange={e => setSubPeriod(Number(e.target.value))} className="bg-brand-surface border border-brand-border text-brand-text-primary text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block w-full p-2.5">
                    {MONTH_NAMES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                 </select>
            );
        case 'Weekly':
             return (
                 <select value={subPeriod} onChange={e => setSubPeriod(Number(e.target.value))} className="bg-brand-surface border border-brand-border text-brand-text-primary text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block w-full p-2.5">
                    {Array.from({length: 48}, (_, i) => i + 1).map(w => (
                       <option key={w} value={w}>
                           Week {w} ({getWeekSunday(selectedYear, w)})
                       </option>
                    ))}
                 </select>
            );
        case 'Yearly':
        default:
            return null;
    }
  }

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <i className="fas fa-coffee text-brand-primary text-2xl"></i>
            <h1 className="text-2xl font-bold text-brand-text-primary">
              R2R Performance Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".json" disabled={isImporting} />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg shadow-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Import data from a JSON file"
                    disabled={isImporting}
                >
                    {isImporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>}
                    Import
                </button>
                 <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg shadow-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export all data to a JSON file"
                    disabled={isImporting}
                 >
                    <i className="fas fa-download"></i>
                    Export
                </button>
            </div>
            <span className="text-sm font-medium text-brand-text-secondary">|</span>
            <span className="text-sm font-medium text-brand-text-secondary">FY:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-brand-surface border border-brand-border text-brand-text-primary text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block p-2.5"
            >
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-brand-surface rounded-lg">
              {(['Yearly', 'Quarterly', 'Monthly', 'Weekly'] as Granularity[]).map(g => (
                  <GranularityButton key={g} label={g} current={granularity} onClick={handleGranularityChange}/>
              ))}
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
              {granularity !== 'Yearly' && <span className="text-sm font-medium text-brand-text-secondary">Period:</span>}
              <div className="w-full md:w-48">
                {renderSubPeriodSelector()}
              </div>
          </div>
      </div>
       {importStatus && (
        <div className={`p-2 rounded-md text-sm text-center transition-opacity duration-300 ${importStatus.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {importStatus.message}
        </div>
      )}
    </header>
  );
};

export default Header;