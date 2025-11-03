import React, { useState, useCallback, useEffect } from 'react';
import { getFinancialAnalysis } from '../services/geminiService';
import type { FinancialData, Granularity } from '../types';

interface GeminiAnalysisProps {
  budgetData: FinancialData;
  actualData: FinancialData;
  periodLabel: string;
  granularity: Granularity;
  onClose: () => void;
}

const GeminiAnalysis: React.FC<GeminiAnalysisProps> = ({ budgetData, actualData, periodLabel, granularity, onClose }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setAnalysis('');
    try {
      const result = await getFinancialAnalysis(budgetData, actualData, periodLabel, granularity);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Failed to get analysis.');
    } finally {
      setIsLoading(false);
    }
  }, [budgetData, actualData, periodLabel, granularity]);

  useEffect(() => {
    // Automatically fetch analysis on component mount (when modal opens)
    handleAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleAnalysis]);

  const formatMarkdown = (text: string) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-brand-text-primary">$1</strong>') // Bold
        .replace(/\n/g, '<br />'); // Newlines
  }

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-analysis-title"
    >
        <section 
            className="relative bg-brand-surface rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
        >
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-brand-text-secondary hover:text-white text-2xl font-bold"
            aria-label="Close"
          >
            &times;
          </button>
          <div className="flex justify-between items-center mb-4">
            <h2 id="ai-analysis-title" className="text-xl font-bold text-brand-text-primary flex items-center">
              <i className="fas fa-magic-sparkles mr-2 text-brand-accent"></i>
              AI Financial Analyst
            </h2>
            <button
              onClick={handleAnalysis}
              disabled={isLoading}
              className="bg-brand-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>Analyzing...</>
              ) : (
                <><i className="fas fa-sync-alt mr-2"></i>Re-analyze</>
              )}
            </button>
          </div>
          <div className="prose prose-invert max-w-none text-brand-text-secondary text-sm bg-gray-900/50 p-4 rounded-md min-h-[200px]">
            {isLoading && <p>Generating insights for {periodLabel}...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {analysis && <div dangerouslySetInnerHTML={{ __html: formatMarkdown(analysis) }} />}
          </div>
        </section>
    </div>
  );
};

export default GeminiAnalysis;