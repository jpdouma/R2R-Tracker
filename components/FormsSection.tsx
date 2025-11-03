import React, { useState } from 'react';
import StartupCostForm from './forms/StartupCostForm';

type FormTabType = 'Startup Costs'; // Add more later e.g. | 'New Sale'

const FormsSection: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<FormTabType>('Startup Costs');

    const renderActiveForm = () => {
        switch (activeTab) {
            case 'Startup Costs':
                return <StartupCostForm />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-brand-surface rounded-lg shadow-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 flex justify-between items-center text-left" aria-expanded={isOpen} aria-controls="forms-section-content">
                <h2 className="text-xl font-bold text-brand-text-primary">Forms</h2>
                <i className={`fas fa-chevron-down transform transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && (
                 <div id="forms-section-content" className="p-4 border-t border-brand-border">
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
                </div>
            )}
        </div>
    );
};

export default FormsSection;