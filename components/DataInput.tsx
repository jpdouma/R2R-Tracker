import React, { useState, useMemo, type ReactNode } from 'react';
import type { OKR, KeyResult, RetailPrice, AllAssumptions, ShopMetrics } from '../types';
import { PRODUCT_SKUS, YEARS, KEY_METRICS } from '../constants';
import { useDataContext } from '../contexts/DataContext';

type InputSectionType = 'Assumptions' | 'OKRs';

interface DataInputProps {
  onOpenScenarioPlanner: () => void;
}

const AccordionItem: React.FC<{ title: string; children: ReactNode; defaultOpen?: boolean; }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-brand-border">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 bg-gray-800/50 hover:bg-gray-800/80"
            >
                <h4 className="font-semibold text-brand-text-primary">{title}</h4>
                <i className={`fas fa-chevron-down transform transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && <div className="p-4 bg-gray-900/30">{children}</div>}
        </div>
    );
};

const AssumptionInput: React.FC<{ label: string; value: number | string; onChange: (val: string) => void; type?: 'number' | 'text'; unit?: string; readOnly?: boolean; }> =
({ label, value, onChange, type = 'number', unit, readOnly = false }) => (
    <div className="grid grid-cols-2 items-center gap-4 py-2">
        <label className="text-sm text-brand-text-secondary justify-self-start">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                readOnly={readOnly}
                step={type === 'number' ? '0.01' : undefined}
                className={`bg-brand-surface p-2 rounded-md w-full text-sm outline-none focus:ring-1 focus:ring-brand-primary ${readOnly ? 'text-gray-400' : ''}`}
            />
            {unit && <span className="text-sm text-brand-text-secondary">{unit}</span>}
        </div>
    </div>
);

const DataInput: React.FC<DataInputProps> = ({ onOpenScenarioPlanner }) => {
    const { 
        okrs, 
        setOkrs, 
        pricingData, 
        setPricingData, 
        assumptionsData, 
        setAssumptionsData 
    } = useDataContext();

    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<InputSectionType>('Assumptions');
    
    const handlePricingChange = (key: keyof RetailPrice, value: string) => {
        setPricingData(prev => ({...prev, [key]: parseFloat(value) || 0}));
    };

    const handleAssumptionChange = (category: keyof AllAssumptions, field: string, value: string | number) => {
        setAssumptionsData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            const path = field.split('.');
            let current = newData[category];
            for(let i = 0; i < path.length - 1; i++){
                current = current[path[i]];
            }
            current[path[path.length - 1]] = typeof value === 'string' ? parseFloat(value) || 0 : value;
            return newData;
        });
    };
    
    const calculatedLandedCost = useMemo(() => {
        const { cogs, forex } = assumptionsData;
        const greenBeanEUR = cogs.greenBeanCostPerKiloUGX * forex.ugxToEur;
        const roastingEUR = cogs.roastingCostPerKiloUGX * forex.ugxToEur;
        const packagingPerKiloEUR = (cogs.packagingCostPer250grUGX * 4) * forex.ugxToEur;
        const shippingEUR = cogs.shippingCostPerKgUSD * forex.usdToEur;
        const insuranceEUR = cogs.insurancePerKgUSD * forex.usdToEur;
        return greenBeanEUR + roastingEUR + packagingPerKiloEUR + shippingEUR + insuranceEUR + cogs.portHandlingEUR;
    }, [assumptionsData.cogs, assumptionsData.forex]);

    // OKR Handlers
    const handleOkrChange = (okrId: number, field: 'objective', value: string) => { setOkrs(okrs.map(o => o.id === okrId ? { ...o, [field]: value } : o)); };
    const handleKrChange = (okrId: number, krId: number, field: keyof Omit<KeyResult, 'id' | 'current'>, value: string | number) => { setOkrs(okrs.map(o => o.id === okrId ? { ...o, keyResults: o.keyResults.map(kr => kr.id === krId ? { ...kr, [field]: value } : kr) } : o)); };
    const handleAddOkr = () => { const newId = (okrs.length > 0 ? Math.max(...okrs.map(o => o.id)) : 0) + 1; setOkrs([...okrs, { id: newId, objective: 'New Objective', keyResults: [] }]); };
    const handleDeleteOkr = (okrId: number) => { setOkrs(okrs.filter(o => o.id !== okrId)); };
    const handleAddKr = (okrId: number) => { setOkrs(okrs.map(o => { if (o.id === okrId) { const newKrId = (o.keyResults.length > 0 ? Math.max(...o.keyResults.map(kr => kr.id)) : 0) + 1; return { ...o, keyResults: [...o.keyResults, { id: newKrId, name: 'New Key Result', target: 100000, current: 0, unit: '€' }] }; } return o; })); };
    const handleDeleteKr = (okrId: number, krId: number) => { setOkrs(okrs.map(o => o.id === okrId ? { ...o, keyResults: o.keyResults.filter(kr => kr.id !== krId) } : o)); };
    
    const renderAssumptionsEditor = () => {
      const a = assumptionsData;
      return (
        <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
            <div className="flex justify-end mb-4">
              <button
                onClick={onOpenScenarioPlanner}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-brand-secondary rounded-lg shadow-md hover:bg-green-600 transition-colors"
              >
                <i className="fas fa-play"></i>
                Run Scenario Planner
              </button>
            </div>
            <AccordionItem title="Cost Of Goods Sold (forecast assumptions)" defaultOpen>
                <AssumptionInput label="Green bean cost per kilo" value={a.cogs.greenBeanCostPerKiloUGX} onChange={v => handleAssumptionChange('cogs', 'greenBeanCostPerKiloUGX', v)} unit="UGX" />
                <AssumptionInput label="Roasting cost per kilo" value={a.cogs.roastingCostPerKiloUGX} onChange={v => handleAssumptionChange('cogs', 'roastingCostPerKiloUGX', v)} unit="UGX" />
                <AssumptionInput label="Packaging cost per unit of 250 gr" value={a.cogs.packagingCostPer250grUGX} onChange={v => handleAssumptionChange('cogs', 'packagingCostPer250grUGX', v)} unit="UGX" />
                <AssumptionInput label="Shipping cost per KG (Uganda to EU)" value={a.cogs.shippingCostPerKgUSD} onChange={v => handleAssumptionChange('cogs', 'shippingCostPerKgUSD', v)} unit="USD" />
                <AssumptionInput label="Insurance (Uganda to EU)" value={a.cogs.insurancePerKgUSD} onChange={v => handleAssumptionChange('cogs', 'insurancePerKgUSD', v)} unit="USD" />
                <AssumptionInput label="Port handling and documentation" value={a.cogs.portHandlingEUR} onChange={v => handleAssumptionChange('cogs', 'portHandlingEUR', v)} unit="EUR" />
                <AssumptionInput label="Fulfillment cost per order (within EU)" value={a.cogs.fulfillmentPerOrderEU} onChange={v => handleAssumptionChange('cogs', 'fulfillmentPerOrderEU', v)} unit="EUR" />
                <AssumptionInput label="Landed cost" value={calculatedLandedCost.toFixed(2)} onChange={() => {}} unit="€ / kilo" readOnly />
            </AccordionItem>
            <AccordionItem title="Startup Costs">
                {a.startup.items.map((item, index) => (
                    <AssumptionInput key={index} label={item.name} value={item.budget} onChange={v => handleAssumptionChange('startup', `items.${index}.budget`, v)} unit="€" />
                ))}
            </AccordionItem>
            <AccordionItem title="Forex & Exogenous Factors">
                <AssumptionInput label="EUR/UGX exchange rate" value={a.forex.eurToUgx} onChange={v => handleAssumptionChange('forex', 'eurToUgx', v)} unit="Sh" />
                <AssumptionInput label="UGX/USD exchange rate" value={a.forex.ugxToUsd} onChange={v => handleAssumptionChange('forex', 'ugxToUsd', v)} unit="USD" />
                <AssumptionInput label="USD/EUR exchange rate" value={a.forex.usdToEur} onChange={v => handleAssumptionChange('forex', 'usdToEur', v)} unit="€" />
                <AssumptionInput label="UGX/EUR exchange rate" value={a.forex.ugxToEur} onChange={v => handleAssumptionChange('forex', 'ugxToEur', v)} unit="€" />
                <hr className="my-4 border-brand-border"/>
                <AssumptionInput label="Corporate tax rate NL - low" value={a.exogenous.corporateTaxRateLow} onChange={v => handleAssumptionChange('exogenous', 'corporateTaxRateLow', v)} unit="%" />
                <AssumptionInput label="Corporate tax rate NL - high" value={a.exogenous.corporateTaxRateHigh} onChange={v => handleAssumptionChange('exogenous', 'corporateTaxRateHigh', v)} unit="%" />
                <AssumptionInput label="Inflation" value={a.exogenous.inflation} onChange={v => handleAssumptionChange('exogenous', 'inflation', v)} unit="%" />
                <AssumptionInput label="VAT - low" value={a.exogenous.vatLow} onChange={v => handleAssumptionChange('exogenous', 'vatLow', v)} unit="%" />
                <AssumptionInput label="VAT - high" value={a.exogenous.vatHigh} onChange={v => handleAssumptionChange('exogenous', 'vatHigh', v)} unit="%" />
                <AssumptionInput label="Import duty" value={a.exogenous.importDuty} onChange={v => handleAssumptionChange('exogenous', 'importDuty', v)} unit="%" />
                <AssumptionInput label="Excise duty" value={a.exogenous.exciseDuty} onChange={v => handleAssumptionChange('exogenous', 'exciseDuty', v)} unit="€ / kilo" />
                <AssumptionInput label="VAT - coffee shops" value={a.exogenous.vatCoffeeShops} onChange={v => handleAssumptionChange('exogenous', 'vatCoffeeShops', v)} unit="%" />
            </AccordionItem>
             <AccordionItem title="Channel Assumptions">
                <h5 className="font-semibold text-brand-text-primary mb-2">Webshop</h5>
                <AssumptionInput label="Online customer acquisition cost (CAC)" value={a.webshop.cac} onChange={v => handleAssumptionChange('webshop', 'cac', v)} unit="€" />
                <AssumptionInput label="Average order value incl. VAT" value={a.webshop.aovInclVat} onChange={v => handleAssumptionChange('webshop', 'aovInclVat', v)} unit="€" />
                <AssumptionInput label="Average order value excl. VAT" value={a.webshop.aovExclVat} onChange={v => handleAssumptionChange('webshop', 'aovExclVat', v)} unit="€" />
                <AssumptionInput label="Average order mass" value={a.webshop.avgOrderMass} onChange={v => handleAssumptionChange('webshop', 'avgOrderMass', v)} unit="kilo(s)" />
                <AssumptionInput label="Compound Annual Growth Rate (CAGR)" value={a.webshop.cagr} onChange={v => handleAssumptionChange('webshop', 'cagr', v)} unit="%" />
                <AssumptionInput label="Support Opt-in Rate" value={a.webshop.supportOptInRate} onChange={v => handleAssumptionChange('webshop', 'supportOptInRate', v)} unit="%" />

                {/* FIX: Changed 'wholesale' to 'retail' to match AllAssumptions type */}
                <h5 className="font-semibold text-brand-text-primary my-2 pt-2 border-t border-brand-border">Retail</h5>
                <AssumptionInput label="Compounded annual growth rate (CAGR)" value={a.retail.cagr} onChange={v => handleAssumptionChange('retail', 'cagr', v)} unit="%" />
                <AssumptionInput label="Retail discount" value={a.retail.discountPercentage} onChange={v => handleAssumptionChange('retail', 'discountPercentage', v)} unit="%" />
                <AssumptionInput label="Assumed starting order" value={a.retail.assumedStartingOrderKg} onChange={v => handleAssumptionChange('retail', 'assumedStartingOrderKg', v)} unit="kilo(s)" />
                <AssumptionInput label="Starting number of accounts" value={a.retail.startingAccounts} onChange={v => handleAssumptionChange('retail', 'startingAccounts', v)} />
                <AssumptionInput label="Average sales per account per year" value={a.retail.avgSalesPerAccountYear} onChange={v => handleAssumptionChange('retail', 'avgSalesPerAccountYear', v)} unit="€" />

                <h5 className="font-semibold text-brand-text-primary my-2 pt-2 border-t border-brand-border">Horeca</h5>
                 <AssumptionInput label="Compounded annual growth rate (CAGR)" value={a.horeca.cagr} onChange={v => handleAssumptionChange('horeca', 'cagr', v)} unit="%" />
                 <AssumptionInput label="Horeca discount" value={a.horeca.discountPercentage} onChange={v => handleAssumptionChange('horeca', 'discountPercentage', v)} unit="%" />
                 <AssumptionInput label="Assumed starting order" value={a.horeca.assumedStartingOrderKg} onChange={v => handleAssumptionChange('horeca', 'assumedStartingOrderKg', v)} unit="kilo(s)" />
                 <AssumptionInput label="Starting number of Horeca accounts" value={a.horeca.startingAccounts} onChange={v => handleAssumptionChange('horeca', 'startingAccounts', v)} />
             </AccordionItem>
             <AccordionItem title="Company Overheads">
                <h5 className="font-semibold text-brand-text-primary mb-2">Owners</h5>
                <AssumptionInput label="Dividends payout ratio" value={a.company.owners.dividendsPayoutRatio} onChange={v => handleAssumptionChange('company', 'owners.dividendsPayoutRatio', v)} unit="%" />
                
                <h5 className="font-semibold text-brand-text-primary my-2 pt-2 border-t border-brand-border">Marketing & Sales</h5>
                <AssumptionInput label="Sales personnel salaries (gross per month)" value={a.company.marketing.salesPersonnelSalary} onChange={v => handleAssumptionChange('company', 'marketing.salesPersonnelSalary', v)} unit="€" />
                <AssumptionInput label="Trade show budget (percentage of revenue)" value={a.company.marketing.tradeShowBudgetPercent} onChange={v => handleAssumptionChange('company', 'marketing.tradeShowBudgetPercent', v)} unit="%" />
                <AssumptionInput label="PR & branding budget (percentage of revenue" value={a.company.marketing.prBrandingBudgetPercent} onChange={v => handleAssumptionChange('company', 'marketing.prBrandingBudgetPercent', v)} unit="%" />
                
                <h5 className="font-semibold text-brand-text-primary my-2 pt-2 border-t border-brand-border">Logistics & distribution</h5>
                <AssumptionInput label="Warehousing costs per month" value={a.company.logistics.warehousingCostMonth} onChange={v => handleAssumptionChange('company', 'logistics.warehousingCostMonth', v)} unit="€" />
                <AssumptionInput label="Local delivery costs / shipment" value={a.company.logistics.localDeliveryCostShipment} onChange={v => handleAssumptionChange('company', 'logistics.localDeliveryCostShipment', v)} unit="€" />

                <h5 className="font-semibold text-brand-text-primary my-2 pt-2 border-t border-brand-border">Other Operating Expenses</h5>
                <AssumptionInput label="Management salary (gross per month)" value={a.company.otherExpenses.managementSalaryMonthUGX} onChange={v => handleAssumptionChange('company', 'otherExpenses.managementSalaryMonthUGX', v)} unit="Sh" />
                <AssumptionInput label="Administrative (gross per month)" value={a.company.otherExpenses.adminSalaryMonthUGX} onChange={v => handleAssumptionChange('company', 'otherExpenses.adminSalaryMonthUGX', v)} unit="Sh" />
                <AssumptionInput label="Rent & Utilities (Office) per month" value={a.company.otherExpenses.rentOfficeMonth} onChange={v => handleAssumptionChange('company', 'otherExpenses.rentOfficeMonth', v)} unit="€" />
                <AssumptionInput label="Technology & Software per month" value={a.company.otherExpenses.techSoftwareMonth} onChange={v => handleAssumptionChange('company', 'otherExpenses.techSoftwareMonth', v)} unit="€" />
                <AssumptionInput label="Professional Fees (legal, accounting) per month" value={a.company.otherExpenses.profFeesMonth} onChange={v => handleAssumptionChange('company', 'otherExpenses.profFeesMonth', v)} unit="€" />
                <AssumptionInput label="Other Operating Expenses (gross per month)" value={a.company.otherExpenses.otherExpensesMonth} onChange={v => handleAssumptionChange('company', 'otherExpenses.otherExpensesMonth', v)} unit="€" />
             </AccordionItem>
             <AccordionItem title="Webshop Funnel">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-brand-text-secondary uppercase">
                        <tr>
                            <th className="px-2 py-2">Metric</th>
                            {YEARS.map(y => <th key={y} className="px-2 py-2 text-center">{y}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {(Object.keys(a.shopMetrics[2025]) as (keyof ShopMetrics[number])[]).map(key => (
                             <tr key={String(key)} className="border-b border-brand-border">
                                <td className="px-2 py-2 capitalize font-semibold text-brand-text-secondary">{String(key).replace(/([A-Z])/g, ' $1').trim()}</td>
                                {YEARS.map(year => (
                                    <td key={year} className="px-2 py-2">
                                        <input 
                                            type="number" 
                                            value={a.shopMetrics[year][key]}
                                            onChange={e => handleAssumptionChange('shopMetrics', `${year}.${String(key)}`, e.target.value)}
                                            className="bg-brand-surface p-2 rounded-md w-full text-sm outline-none focus:ring-1 focus:ring-brand-primary text-right"
                                        />
                                    </td>
                                ))}
                             </tr>
                        ))}
                    </tbody>
                </table>
             </AccordionItem>
        </div>
      );
    }

    const renderOkrEditor = () => (
        <div> <div className="flex justify-between items-center mb-4"> <h3 className="text-lg font-semibold">OKR Editor</h3> <button onClick={handleAddOkr} className="bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/40 font-bold py-1 px-3 rounded-lg text-sm flex items-center gap-2"> <i className="fas fa-plus"></i> Add Objective </button> </div> <div className="space-y-4 max-h-96 overflow-y-auto pr-2"> {okrs.map(okr => ( <div key={okr.id} className="bg-gray-800/50 p-4 rounded-lg"> <div className="flex items-center gap-2 mb-3"> <input type="text" value={okr.objective} onChange={e => handleOkrChange(okr.id, 'objective', e.target.value)} className="bg-transparent w-full font-semibold text-brand-text-primary text-md outline-none focus:bg-gray-900/50 rounded-md p-1"/> <button onClick={() => handleDeleteOkr(okr.id)} className="text-red-500 hover:text-red-400"><i className="fas fa-trash"></i></button> </div> <div className="space-y-3 pl-4 border-l-2 border-brand-border"> {okr.keyResults.map(kr => ( <div key={kr.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <div className="flex flex-col gap-2">
                    <input type="text" value={kr.name} onChange={e => handleKrChange(okr.id, kr.id, 'name', e.target.value)} placeholder="Key Result Name" className="bg-brand-surface p-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-primary"/> 
                    <select onChange={e => handleKrChange(okr.id, kr.id, 'name', e.target.value)} value="" className="bg-brand-surface p-2 rounded-md text-sm text-gray-400 outline-none focus:ring-1 focus:ring-brand-primary">
                        <option value="">Or select a standard metric...</option>
                        {KEY_METRICS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2"> 
                    <input type="number" value={kr.target} onChange={e => handleKrChange(okr.id, kr.id, 'target', parseFloat(e.target.value) || 0)} placeholder="Target" className="bg-brand-surface p-2 rounded-md w-full text-sm outline-none focus:ring-1 focus:ring-brand-primary"/> 
                    <select value={kr.unit} onChange={e => handleKrChange(okr.id, kr.id, 'unit', e.target.value as '€' | '%')} className="bg-brand-surface p-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-primary"> <option value="€">€</option> <option value="%">%</option> </select> 
                    <button onClick={() => handleDeleteKr(okr.id, kr.id)} className="text-red-500/70 hover:text-red-500 pl-2"><i className="fas fa-times-circle"></i></button> 
                </div> 
             </div> 
            ))} <button onClick={() => handleAddKr(okr.id)} className="text-brand-primary hover:underline text-sm mt-3">+ Add Key Result</button> </div> </div> ))} </div> </div>
    );

    return (
        <div className="bg-brand-surface rounded-lg shadow-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 flex justify-between items-center text-left" aria-expanded={isOpen} aria-controls="data-input-content" > <h2 className="text-xl font-bold text-brand-text-primary">Data Input & Assumptions</h2> <i className={`fas fa-chevron-down transform transition-transform ${isOpen ? 'rotate-180' : ''}`}></i> </button>
            {isOpen && (
                <div id="data-input-content" className="p-6 border-t border-brand-border">
                    <div className="border-b border-brand-border mb-4">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {(['Assumptions', 'OKRs'] as InputSectionType[]).map((tab) => (
                            <button key={tab} onClick={() => setActiveSection(tab)} className={`${ activeSection === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-gray-500' } whitespace-nowrap pb-2 px-1 border-b-2 font-medium`} >
                            {tab}
                            </button>
                        ))}
                        </nav>
                    </div>
                    {activeSection === 'Assumptions' && renderAssumptionsEditor()}
                    {activeSection === 'OKRs' && renderOkrEditor()}
                </div>
            )}
        </div>
    )
}

export default DataInput;