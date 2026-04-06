import { useState } from "react";
import { useFinance } from "./hooks/useFinance";
import { Dashboard } from "./components/Dashboard";
import { ExpenseTracker } from "./components/ExpenseTracker";
import { BudgetManager } from "./components/BudgetManager";
import { DebtPlanner } from "./components/DebtPlanner";
import { AIInsight } from "./components/AIInsight";
import "./app.css";

type Tab = "dashboard" | "expenses" | "budgets" | "debt" | "insights";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard",  icon: "◉" },
  { id: "expenses",  label: "Expenses",   icon: "↕" },
  { id: "budgets",   label: "Budgets",    icon: "◫" },
  { id: "debt",      label: "Debt payoff",icon: "⬇" },
  { id: "insights",  label: "AI insights",icon: "✦" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const finance = useFinance();

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">◎</span>
          <div>
            <span className="brand-name">ClearPath</span>
            <span className="brand-sub">Finance</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="footer-note">Data saved locally</p>
          <p className="footer-note">Your money stays yours</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <div className="content-header">
          <div>
            <h1 className="content-title">
              {TABS.find((t) => t.id === tab)?.label}
            </h1>
            <p className="content-sub">
              {tab === "dashboard"  && "Your complete financial picture at a glance"}
              {tab === "expenses"   && "Track every dollar you spend"}
              {tab === "budgets"    && "Set limits and see where you stand"}
              {tab === "debt"       && "Plan your path to debt freedom"}
              {tab === "insights"   && "AI-powered advice based on your real data"}
            </p>
          </div>
          <div className="header-income-chip">
            Income: <strong>${finance.monthlyIncome.toLocaleString()}/mo</strong>
          </div>
        </div>

        <div className="content-body">
          {tab === "dashboard" && (
            <Dashboard
              expenses={finance.expenses}
              budgets={finance.budgets}
              debts={finance.debts}
              monthlyIncome={finance.monthlyIncome}
              onSetIncome={finance.setIncome}
              onNavigate={(t) => setTab(t as Tab)}
            />
          )}
          {tab === "expenses" && (
            <ExpenseTracker
              expenses={finance.expenses}
              budgets={finance.budgets}
              onAdd={finance.addExpense}
              onDelete={finance.deleteExpense}
            />
          )}
          {tab === "budgets" && (
            <BudgetManager
              budgets={finance.budgets}
              expenses={finance.expenses}
              monthlyIncome={finance.monthlyIncome}
              onUpdate={finance.updateBudget}
              onSetIncome={finance.setIncome}
            />
          )}
          {tab === "debt" && (
            <DebtPlanner
              debts={finance.debts}
              strategy={finance.strategy}
              extraPayment={finance.extraPayment}
              onAdd={finance.addDebt}
              onDelete={finance.deleteDebt}
              onSetStrategy={finance.setStrategy}
              onSetExtra={finance.setExtra}
            />
          )}
          {tab === "insights" && (
            <AIInsight
              expenses={finance.expenses}
              budgets={finance.budgets}
              debts={finance.debts}
              monthlyIncome={finance.monthlyIncome}
            />
          )}
        </div>
      </main>
    </div>
  );
}
