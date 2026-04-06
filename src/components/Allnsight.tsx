import { useState } from "react";
import type { Expense, Budget, Debt } from "../types";
import { CATEGORIES } from "../types";
import { totalSpent, monthlyExpenses, totalDebt, budgetHealth, fmt } from "../lib/finance";

interface AIInsightProps {
  expenses: Expense[];
  budgets: Budget[];
  debts: Debt[];
  monthlyIncome: number;
}

export function AIInsight({ expenses, budgets, debts, monthlyIncome }: AIInsightProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setInsight(null);

    const thisMonth = monthlyExpenses(expenses);
    const spent = totalSpent(thisMonth);
    const debt = totalDebt(debts);
    const health = budgetHealth(thisMonth, budgets);
    const overBudget = health.filter((h) => h.over).map((h) => CATEGORIES[h.category].label);

    const topCategories = [...health]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3)
      .map((h) => `${CATEGORIES[h.category].label} (${fmt(h.spent)})`)
      .join(", ");

    const debtSummary = debts.length > 0
      ? debts.map((d) => `${d.name}: ${fmt(d.balance)} at ${d.interestRate}%`).join("; ")
      : "No debts";

    const prompt = `Here is my financial snapshot this month:
- Monthly income: ${fmt(monthlyIncome)}
- Total spent this month: ${fmt(spent)}
- Remaining budget: ${fmt(Math.max(0, budgets.reduce((s,b)=>s+b.limit,0) - spent))}
- Top spending categories: ${topCategories}
- Over-budget categories: ${overBudget.length > 0 ? overBudget.join(", ") : "None"}
- Total debt: ${fmt(debt)} across ${debts.length} accounts
- Debt details: ${debtSummary}

Give me exactly 3 sharp, specific, actionable insights about my finances. Each insight should be 1-2 sentences. Be direct and honest — not generic. Number them 1, 2, 3. Total response under 120 words.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 250,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      setInsight(text);
    } catch (err) {
      setError("Could not load insight. Add your API key in settings.");
    } finally {
      setLoading(false);
    }
  };

  const hasData = expenses.length > 0 || debts.length > 0;

  return (
    <div className="ai-insight">
      <div className="insight-header">
        <div>
          <h2 className="panel-title">AI financial advisor</h2>
          <p className="insight-sub">Powered by Claude — analyses your expenses, budgets, and debts together</p>
        </div>
        <span className="claude-badge">Claude AI</span>
      </div>

      {!insight && !loading && !error && (
        <div className="insight-empty">
          <div className="insight-empty-icon">🧠</div>
          <p>{hasData ? "Get personalised insights based on your real financial data." : "Add some expenses or debts first, then come back for insights."}</p>
        </div>
      )}

      {loading && (
        <div className="insight-loading">
          <div className="thinking-dots"><span /><span /><span /></div>
          <p>Analysing your finances…</p>
        </div>
      )}

      {insight && !loading && (
        <div className="insight-content">
          {insight.split("\n").filter(Boolean).map((line, i) => (
            <p key={i} className="insight-line">{line}</p>
          ))}
        </div>
      )}

      {error && <p className="insight-error">{error}</p>}

      <button className="insight-btn" onClick={generate} disabled={loading || !hasData}>
        {loading ? "Thinking…" : insight ? "↻ Refresh insights" : "Get AI insights"}
      </button>
    </div>
  );
}

