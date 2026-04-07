import { useMemo } from "react";
import type { Expense, Budget, Debt } from "../types";
import { CATEGORIES } from "../types";
import { totalSpent, monthlyExpenses, budgetHealth, totalDebt, fmt } from "../lib/finance";

interface DashboardProps {
  expenses: Expense[];
  budgets: Budget[];
  debts: Debt[];
  monthlyIncome: number;
  onNavigate: (tab: string) => void;
}

function BudgetRing({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  const color = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#10b981";
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 65 65)"
        style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.3s ease" }}
      />
      <text x="65" y="60" textAnchor="middle" fill="#111" fontSize="20" fontWeight="700" fontFamily="Sora,sans-serif">
        {Math.round(pct)}%
      </text>
      <text x="65" y="78" textAnchor="middle" fill="#999" fontSize="11" fontFamily="Sora,sans-serif">
        of budget
      </text>
    </svg>
  );
}

export function Dashboard({ expenses, budgets, debts, monthlyIncome, onNavigate }: DashboardProps) {
  const thisMonth = useMemo(() => monthlyExpenses(expenses), [expenses]);
  const spent = useMemo(() => totalSpent(thisMonth), [thisMonth]);
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const budgetPct = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
  const health = useMemo(() => budgetHealth(thisMonth, budgets), [thisMonth, budgets]);
  const debt = totalDebt(debts);
  const overBudget = health.filter((h) => h.over);

  return (
    <div className="dashboard">
      <div className="kpi-row">
        <div className="kpi-card accent">
          <span className="kpi-label">Monthly income</span>
          <span className="kpi-value">{fmt(monthlyIncome)}</span>
          <span className="kpi-sub">set in budgets</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Spent this month</span>
          <span className="kpi-value">{fmt(spent)}</span>
          <span className="kpi-sub">of {fmt(totalBudget)} budgeted</span>
        </div>
        <div className={`kpi-card ${debt > 0 ? "danger" : "success"}`}>
          <span className="kpi-label">Total debt</span>
          <span className="kpi-value">{fmt(debt)}</span>
          <span className="kpi-sub">{debts.length} account{debts.length !== 1 ? "s" : ""}</span>
        </div>
        <div className={`kpi-card ${monthlyIncome - debt >= 0 ? "success" : "danger"}`}>
          <span className="kpi-label">Income vs debt</span>
          <span className="kpi-value">{fmt(Math.abs(monthlyIncome - debt))}</span>
          <span className="kpi-sub">{monthlyIncome - debt >= 0 ? "ahead" : "behind"}</span>
        </div>
      </div>

      <div className="dash-middle">
        <div className="dash-card ring-card">
          <p className="card-title">Budget health</p>
          <div className="ring-wrap"><BudgetRing pct={budgetPct} /></div>
          <div className="ring-stats">
            <div className="ring-stat">
              <span>{fmt(spent)}</span><span>spent</span>
            </div>
            <div className="ring-divider" />
            <div className="ring-stat">
              <span>{fmt(Math.max(0, totalBudget - spent))}</span><span>left</span>
            </div>
          </div>
          {overBudget.length > 0 && (
            <div className="over-alert">⚠ {overBudget.length} categor{overBudget.length > 1 ? "ies" : "y"} over budget</div>
          )}
        </div>

        <div className="dash-card categories-card">
          <p className="card-title">Category breakdown</p>
          <div className="cat-list">
            {health.sort((a, b) => b.spent - a.spent).map((h) => {
              const info = CATEGORIES[h.category];
              return (
                <div key={h.category} className="cat-item">
                  <span className="cat-item-icon">{info.icon}</span>
                  <div className="cat-item-info">
                    <div className="cat-item-top">
                      <span className="cat-item-name">{info.label}</span>
                      <span className={`cat-item-amt ${h.over ? "over" : ""}`}>
                        {fmt(h.spent)} / {fmt(h.limit)}
                      </span>
                    </div>
                    <div className="cat-bar-track">
                      <div className="cat-bar-fill" style={{
                        width: `${Math.min(h.pct, 100)}%`,
                        background: h.over ? "#ef4444" : info.color,
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dash-card recent-card">
          <p className="card-title">Recent expenses</p>
          {expenses.length === 0 ? (
            <div className="empty-hint">
              <p>No expenses yet</p>
              <button className="link-btn" onClick={() => onNavigate("expenses")}>Add your first →</button>
            </div>
          ) : (
            <div className="recent-list">
              {expenses.slice(0, 6).map((e) => {
                const info = CATEGORIES[e.category];
                return (
                  <div key={e.id} className="recent-item">
                    <span className="recent-icon">{info.icon}</span>
                    <div className="recent-info">
                      <span className="recent-desc">{e.description}</span>
                      <span className="recent-cat">{info.label}</span>
                    </div>
                    <span className="recent-amt">{fmt(e.amount, { maximumFractionDigits: 2 })}</span>
                  </div>
                );
              })}
              <button className="link-btn" onClick={() => onNavigate("expenses")}>View all →</button>
            </div>
          )}
        </div>
      </div>

      {debts.length > 0 && (
        <div className="dash-card debt-snap">
          <div className="debt-snap-header">
            <p className="card-title">Debt snapshot</p>
            <button className="link-btn" onClick={() => onNavigate("debt")}>Go to payoff planner →</button>
          </div>
          <div className="debt-list-items">
            {debts.map((d) => {
              const pct = debt > 0 ? (d.balance / debt) * 100 : 0;
              return (
                <div key={d.id} className="debt-snap-item">
                  <div className="debt-snap-top">
                    <span className="debt-snap-name">{d.name}</span>
                    <span className="debt-snap-rate">{d.interestRate}% APR</span>
                    <span className="debt-snap-bal danger">{fmt(d.balance)}</span>
                  </div>
                  <div className="cat-bar-track">
                    <div className="cat-bar-fill" style={{ width: `${pct}%`, background: "#ef4444" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
