import { useMemo } from "react";
import type { Budget, Expense, Category } from "../types";
import { CATEGORIES } from "../types";
import { budgetHealth, monthlyExpenses, fmt, fmtPct } from "../lib/finance";

interface BudgetManagerProps {
  budgets: Budget[];
  expenses: Expense[];
  monthlyIncome: number;
  onUpdate: (category: Category, limit: number) => void;
  onSetIncome: (v: number) => void;
}

export function BudgetManager({ budgets, expenses, monthlyIncome, onUpdate, onSetIncome }: BudgetManagerProps) {
  const thisMonth = useMemo(() => monthlyExpenses(expenses), [expenses]);
  const health = useMemo(() => budgetHealth(thisMonth, budgets), [thisMonth, budgets]);
  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const unallocated = monthlyIncome - totalBudgeted;

  return (
    <div className="budget-manager">
      {/* Income setting */}
      <div className="income-card">
        <div className="income-left">
          <p className="card-title">Monthly income</p>
          <p className="income-sub">Your take-home pay this month</p>
        </div>
        <div className="income-input-wrap">
          <span className="income-symbol">$</span>
          <input
            className="income-input"
            type="number"
            value={monthlyIncome}
            onChange={(e) => onSetIncome(Math.max(0, parseFloat(e.target.value) || 0))}
          />
        </div>
      </div>

      {/* Allocation summary */}
      <div className="allocation-bar-section">
        <div className="allocation-labels">
          <span>Budgeted: <strong>{fmt(totalBudgeted)}</strong></span>
          <span className={unallocated < 0 ? "over" : "ok"}>
            {unallocated < 0 ? "Over-allocated" : "Unallocated"}: <strong>{fmt(Math.abs(unallocated))}</strong>
          </span>
        </div>
        <div className="alloc-track">
          <div
            className="alloc-fill"
            style={{
              width: `${Math.min((totalBudgeted / monthlyIncome) * 100, 100)}%`,
              background: totalBudgeted > monthlyIncome ? "#ef4444" : "#10b981",
            }}
          />
        </div>
        {totalBudgeted > monthlyIncome && (
          <p className="alloc-warning">⚠ Your budgets exceed your income by {fmt(totalBudgeted - monthlyIncome)}</p>
        )}
      </div>

      {/* Budget cards */}
      <div className="budget-grid">
        {health.map((h) => {
          const info = CATEGORIES[h.category];
          const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
          const dayOfMonth = new Date().getDate();
          const expectedPct = (dayOfMonth / daysInMonth) * 100;
          const onTrack = h.pct <= expectedPct + 10;

          return (
            <div key={h.category} className={`budget-card ${h.over ? "over" : ""}`}>
              <div className="budget-card-top">
                <div className="budget-cat">
                  <span className="budget-icon">{info.icon}</span>
                  <span className="budget-name">{info.label}</span>
                </div>
                <div className={`budget-status ${h.over ? "over" : onTrack ? "ok" : "warn"}`}>
                  {h.over ? "Over" : onTrack ? "On track" : "High"}
                </div>
              </div>

              <div className="budget-amounts">
                <span className={`budget-spent ${h.over ? "over" : ""}`}>{fmt(h.spent)}</span>
                <span className="budget-of">of</span>
                <div className="budget-limit-wrap">
                  <span className="budget-limit-sym">$</span>
                  <input
                    className="budget-limit-input"
                    type="number"
                    value={h.limit}
                    min="0"
                    onChange={(e) => onUpdate(h.category, Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
              </div>

              <div className="budget-bar-track">
                <div
                  className="budget-bar-expected"
                  style={{ width: `${Math.min(expectedPct, 100)}%` }}
                />
                <div
                  className="budget-bar-fill"
                  style={{
                    width: `${Math.min(h.pct, 100)}%`,
                    background: h.over ? "#ef4444" : h.pct > 75 ? "#f59e0b" : info.color,
                  }}
                />
              </div>

              <div className="budget-footer">
                <span>{fmtPct(h.pct)} used</span>
                <span className={h.over ? "over" : ""}>
                  {h.over
                    ? `${fmt(h.spent - h.limit)} over`
                    : `${fmt(h.limit - h.spent)} left`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
