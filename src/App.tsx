import { useState } from "react";
import { useFinance } from "./hooks/useFinance";
import { Dashboard } from "./components/Dashboard";
import { ExpenseTracker } from "./components/ExpenseTracker";
import { BudgetManager } from "./components/BudgetManager";
import { DebtPlanner } from "./components/DebtPlanner";
import { AIInsight } from "./components/AIInsight";
import { ShelbyStatus } from "./components/ShelbyStatus";
import "./app.css";

type Tab = "dashboard" | "expenses" | "budgets" | "debt" | "insights";

const TABS: { id: Tab; label: string; icon: string; sub: string }[] = [
  { id: "dashboard", label: "Dashboard",   icon: "◉", sub: "Your financial picture" },
  { id: "expenses",  label: "Expenses",    icon: "↕", sub: "Track every dollar"     },
  { id: "budgets",   label: "Budgets",     icon: "◫", sub: "Set monthly limits"     },
  { id: "debt",      label: "Debt payoff", icon: "⬇", sub: "Plan debt freedom"      },
  { id: "insights",  label: "AI insights", icon: "✦", sub: "Claude-powered advice"  },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const finance = useFinance();

  if (finance.status === "loading") {
    return (
      <div className="app-loading">
        <div className="loading-ring" />
        <p>Loading your finances from Shelby…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">◎</span>
          <div>
            <span className="brand-name">ClearPath</span>
            <span className="brand-sub">Finance · Shelby</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {TABS.map((t) => (
            <button key={t.id}
              className={`nav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <ShelbyStatus status={finance.status} lastSynced={finance.lastSynced} />
        </div>
      </aside>

      <main className="main-content">
        <div className="content-header">
          <div>
            <h1 className="content-title">{TABS.find((t) => t.id === tab)?.label}</h1>
            <p className="content-sub">{TABS.find((t) => t.id === tab)?.sub}</p>
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
