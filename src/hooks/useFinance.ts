import { useState, useEffect, useCallback } from "react";
import type { Expense, Budget, Debt, DebtStrategy, Category } from "../types";

const KEYS = {
  expenses: "clearpath_expenses",
  budgets:  "clearpath_budgets",
  debts:    "clearpath_debts",
  strategy: "clearpath_strategy",
  extra:    "clearpath_extra",
  income:   "clearpath_income",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_BUDGETS: Budget[] = [
  { category: "housing",       limit: 1500 },
  { category: "food",          limit: 600  },
  { category: "transport",     limit: 300  },
  { category: "health",        limit: 200  },
  { category: "entertainment", limit: 150  },
  { category: "shopping",      limit: 200  },
];

export function useFinance() {
  const [expenses, setExpenses]     = useState<Expense[]>(() => load(KEYS.expenses, []));
  const [budgets,  setBudgets]      = useState<Budget[]>(() => load(KEYS.budgets, DEFAULT_BUDGETS));
  const [debts,    setDebts]        = useState<Debt[]>(() => load(KEYS.debts, []));
  const [strategy, setStrategy]     = useState<DebtStrategy>(() => load(KEYS.strategy, "avalanche"));
  const [extraPayment, setExtra]    = useState<number>(() => load(KEYS.extra, 100));
  const [monthlyIncome, setIncome]  = useState<number>(() => load(KEYS.income, 3000));

  useEffect(() => { save(KEYS.expenses, expenses); }, [expenses]);
  useEffect(() => { save(KEYS.budgets,  budgets);  }, [budgets]);
  useEffect(() => { save(KEYS.debts,    debts);    }, [debts]);
  useEffect(() => { save(KEYS.strategy, strategy); }, [strategy]);
  useEffect(() => { save(KEYS.extra,    extraPayment); }, [extraPayment]);
  useEffect(() => { save(KEYS.income,   monthlyIncome); }, [monthlyIncome]);

  // ── Expense actions ────────────────────────────────────────────────────────
  const addExpense = useCallback((data: Omit<Expense, "id" | "date">) => {
    const expense: Expense = { ...data, id: crypto.randomUUID(), date: new Date().toISOString() };
    setExpenses((prev) => [expense, ...prev]);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Budget actions ─────────────────────────────────────────────────────────
  const updateBudget = useCallback((category: Category, limit: number) => {
    setBudgets((prev) =>
      prev.map((b) => b.category === category ? { ...b, limit } : b)
    );
  }, []);

  // ── Debt actions ───────────────────────────────────────────────────────────
  const addDebt = useCallback((data: Omit<Debt, "id">) => {
    setDebts((prev) => [...prev, { ...data, id: crypto.randomUUID() }]);
  }, []);

  const updateDebt = useCallback((id: string, data: Partial<Omit<Debt, "id">>) => {
    setDebts((prev) => prev.map((d) => d.id === id ? { ...d, ...data } : d));
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return {
    // State
    expenses, budgets, debts, strategy, extraPayment, monthlyIncome,
    // Actions
    addExpense, deleteExpense,
    updateBudget,
    addDebt, updateDebt, deleteDebt,
    setStrategy, setExtra: setExtra as (v: number) => void,
    setIncome: setIncome as (v: number) => void,
  };
}

