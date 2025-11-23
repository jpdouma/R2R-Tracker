import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { FinancialData, Granularity } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value);
};

export const getFinancialAnalysis = async (budget: FinancialData, actual: FinancialData, periodLabel: string, granularity: Granularity): Promise<string> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
    return Promise.resolve("API Key not configured. Please set the API_KEY environment variable to use the AI analysis feature.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const budgetGrossMargin = budget.incomeStatement.revenue.total ? (budget.incomeStatement.grossProfit / budget.incomeStatement.revenue.total * 100).toFixed(1) : '0.0';
  const actualGrossMargin = actual.incomeStatement.revenue.total ? (actual.incomeStatement.grossProfit / actual.incomeStatement.revenue.total * 100).toFixed(1) : '0.0';

  let dataPrompt: string;

  if (granularity === 'Weekly') {
      dataPrompt = `
      ### Weekly Cash Flow Focus: ${periodLabel}

      **Budget Data:**
      - Net Change in Cash: ${formatCurrency(budget.cashFlow.netChangeInCash)}
      - Ending Cash Balance: ${formatCurrency(budget.cashFlow.cashAtEndOfYear)}

      **Actual Data:**
      - Net Change in Cash: ${formatCurrency(actual.cashFlow.netChangeInCash)}
      - Ending Cash Balance: ${formatCurrency(actual.cashFlow.cashAtEndOfYear)}
      `;
  } else {
       dataPrompt = `
      ### Financial Performance: ${periodLabel}

      | Metric | Budget | Actual |
      | :--- | :--- | :--- |
      | **Total Revenue** | ${formatCurrency(budget.incomeStatement.revenue.total)} | ${formatCurrency(actual.incomeStatement.revenue.total)} |
      | **Net Income** | ${formatCurrency(budget.incomeStatement.netIncome)} | ${formatCurrency(actual.incomeStatement.netIncome)} |
      | **Gross Margin** | ${budgetGrossMargin}% | ${actualGrossMargin}% |
      | **Operating Expenses** | ${formatCurrency(budget.incomeStatement.operatingExpenses.total)} | ${formatCurrency(actual.incomeStatement.operatingExpenses.total)} |
      | **Ending Cash** | ${formatCurrency(budget.cashFlow.cashAtEndOfYear)} | ${formatCurrency(actual.cashFlow.cashAtEndOfYear)} |
      `;
  }


  const prompt = `
    You are a senior financial analyst for a coffee import and e-commerce startup. 
    The company imports green beans from Uganda, roasts them, and sells via B2B (Horeca) and B2C (Online/Retail) channels.
    Currency: EUR (€).

    Analyze the following financial data:
    
    ${dataPrompt}

    **Analysis Requirements:**
    1.  **Executive Summary:** A 1-sentence overview of the period's performance.
    2.  **Variance Analysis:**
        *   Highlight 1 positive variance (where we beat budget). Explain *why* this matters for a coffee startup (e.g., higher margins imply efficient roasting or premium pricing).
        *   Highlight 1 negative variance (concerns). Explain the risk (e.g., burn rate issues, inventory overstock).
    3.  **Actionable Recommendation:** Provide 1 concrete, strategic step the management should take next week (e.g., "Review shipping logistics," "Push B2B sales").

    Format the response in concise Markdown. Use bolding for key metrics.
    `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error: any) {
    console.error("Error fetching financial analysis:", error);
    if (error.message?.includes("API_KEY") || error.toString().includes("API_KEY")) {
        return "Error: Invalid or missing API Key. Please check your configuration.";
    }
    return "An error occurred while analyzing the financial data. Please try again later.";
  }
};