import { useState, useMemo } from "react";
import type { Expense, Category, Budget } from "../types";
import { CATEGORIES } from "../types";
import { monthlyExpenses, totalSpent, fmt } from "../lib/finance";

interface ExpenseTrackerProps {
  expenses: Expense[];
  budgets: Budget[];
  onAdd: (data: Omit<Expense, "id" | "date">) => void;
  onDelete: (id: string) => void;
}

const EMPTY = { amount: "", description: "", category: "food" as Category };

export function ExpenseTracker({ expenses, budgets, onAdd, onDelete }: ExpenseTrackerProps) {
  const [form, setForm]         = useState(EMPTY);
  const [filter, setFilter]     = useState<Category | "all">("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError]       = useState("");

  const thisMonth    = useMemo(() => monthlyExpenses(expenses), [expenses]);
  const monthlySpent = useMemo(() => totalSpent(thisMonth), [thisMonth]);
  const totalBudget  = budgets.reduce((s, b) => s + b.limit, 0);

  const filtered = filter === "all" ? expenses : expenses.filter((e) => e.category === filter);

  const grouped = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    for (const e of filtered) {
      const d = new Date(e.date);
      const today     = new Date();
      const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
      const key = d.toDateString() === today.toDateString() ? "Today"
        : d.toDateString() === yesterday.toDateString() ? "Yesterday"
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }
    return groups;
  }, [filtered]);

  const handleAdd = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount"); return; }
    if (!form.description.trim()) { setError("Enter a description"); return; }
    setError("");
    onAdd({ amount: amt, description: form.description.trim(), category: form.category });
    setForm(EMPTY);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  const handleDelete = (id: string) => {
    if (confirmId === id) { onDelete(id); setConfirmId(null); }
    else { setConfirmId(id); setTimeout(() => setConfirmId(null), 2500); }
  };

  return (
    <div className="expense-tracker">
      <div className="tracker-layout">
        <div className="add-panel">
          <h2 className="panel-title">Add expense</h2>

          <div className="amount-field">
            <span className="currency">$</span>
            <input className="amount-input" type="number" min="0" step="0.01" placeholder="0.00"
              value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          </div>

          <input className="desc-input" type="text" placeholder="What was this for?" maxLength={60}
            value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()} />

          <div className="cat-picker">
            {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, info]) => (
              <button key={key}
                className={`cat-pill ${form.category === key ? "active" : ""}`}
                onClick={() => setForm((f) => ({ ...f, category: key }))}
                style={form.category === key ? { borderColor: info.color, color: info.color, background: `${info.color}15` } : {}}
              >
                {info.icon} {info.label}
              </button>
            ))}
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className={`add-btn ${justAdded ? "success" : ""}`} onClick={handleAdd}>
            {justAdded ? "✓ Added" : "Add expense"}
          </button>

          <div className="month-summary">
            <p className="summary-label">This month</p>
            <div className="summary-row"><span>Spent</span><strong>{fmt(monthlySpent)}</strong></div>
            <div className="summary-row"><span>Budget</span><strong>{fmt(totalBudget)}</strong></div>
            <div className="summary-row">
              <span>Remaining</span>
              <strong className={monthlySpent > totalBudget ? "over" : "ok"}>
                {fmt(Math.abs(totalBudget - monthlySpent))}
                {monthlySpent > totalBudget ? " over" : " left"}
              </strong>
            </div>
            <div className="summary-bar-track">
              <div className="summary-bar-fill" style={{
                width: `${Math.min((monthlySpent / Math.max(totalBudget, 1)) * 100, 100)}%`,
                background: monthlySpent > totalBudget ? "#ef4444" : "#10b981",
              }} />
            </div>
          </div>
        </div>

        <div className="list-panel">
          <div className="list-header">
            <h2 className="panel-title">All expenses</h2>
            <div className="filter-row">
              <button className={`filter-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
              {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, info]) => (
                <button key={key} className={`filter-chip ${filter === key ? "active" : ""}`}
                  onClick={() => setFilter(key)}>{info.icon} {info.label}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="list-empty">No expenses {filter !== "all" ? `in ${CATEGORIES[filter as Category].label}` : "yet"}</div>
          ) : (
            <div className="expense-groups">
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date} className="expense-group">
                  <div className="group-label">{date}</div>
                  {items.map((e) => {
                    const info = CATEGORIES[e.category];
                    return (
                      <div key={e.id} className="expense-row">
                        <div className="exp-icon" style={{ background: `${info.color}15` }}>{info.icon}</div>
                        <div className="exp-info">
                          <span className="exp-desc">{e.description}</span>
                          <span className="exp-cat">{info.label}</span>
                        </div>
                        <span className="exp-amt">{fmt(e.amount, { maximumFractionDigits: 2 })}</span>
                        <button className={`del-btn ${confirmId === e.id ? "confirm" : ""}`}
                          onClick={() => handleDelete(e.id)}>
                          {confirmId === e.id ? "sure?" : "×"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
