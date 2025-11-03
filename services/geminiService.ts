import { GoogleGenAI } from "@google/genai";
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
      **Focus Area: Weekly Cash Flow**

      **Budgeted Data for ${periodLabel}:**
      - Net Change in Cash: ${formatCurrency(budget.cashFlow.netChangeInCash)}
      - Cash at End of Period: ${formatCurrency(budget.cashFlow.cashAtEndOfYear)}

      **Actual Data for ${periodLabel}:**
      - Net Change in Cash: ${formatCurrency(actual.cashFlow.netChangeInCash)}
      - Cash at End of Period: ${formatCurrency(actual.cashFlow.cashAtEndOfYear)}
      `;
  } else {
       dataPrompt = `
      **Budgeted Data for ${periodLabel}:**
      - Total Revenue: ${formatCurrency(budget.incomeStatement.revenue.total)}
      - Net Income: ${formatCurrency(budget.incomeStatement.netIncome)}
      - Gross Margin: ${budgetGrossMargin}%
      - Total Operating Expenses: ${formatCurrency(budget.incomeStatement.operatingExpenses.total)}
      - Cash at End of Period: ${formatCurrency(budget.cashFlow.cashAtEndOfYear)}

      **Actual Data for ${periodLabel}:**
      - Total Revenue: ${formatCurrency(actual.incomeStatement.revenue.total)}
      - Net Income: ${formatCurrency(actual.incomeStatement.netIncome)}
      - Gross Margin: ${actualGrossMargin}%
      - Total Operating Expenses: ${formatCurrency(actual.incomeStatement.operatingExpenses.total)}
      - Cash at End of Period: ${formatCurrency(actual.cashFlow.cashAtEndOfYear)}
      `;
  }


  const prompt = `
    You are a senior financial analyst providing a performance review for a coffee startup.
    Analyze the following financial data for the period: ${periodLabel}.
    The currency is in Euros (€).

    ${dataPrompt}

    Based on this data, provide a concise analysis in Markdown format. Address the following points:
    1.  **Overall Performance Summary:** Give a brief overview of performance against the budget for this specific period.
    2.  **Key Highlights (Positive Variances):** Identify 1-2 areas where the company outperformed its budget.
    3.  **Areas for Improvement (Negative Variances):** Identify 1-2 areas of underperformance or concern.
    4.  **Actionable Recommendation:** Suggest one strategic action for management to focus on based on this period's results.

    Structure your response with clear headings. Be insightful and direct.
    `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching financial analysis:", error);
    return "An error occurred while analyzing the financial data. Please check the console for details.";
  }
};
