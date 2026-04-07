import { useState, useEffect, useCallback, useRef } from "react";
import type { Expense, Budget, Debt, Settings, Category, DebtStrategy } from "../types";
import { DEFAULT_BUDGETS, DEFAULT_SETTINGS } from "../types";
import {
  readExpenses, readBudgets, readDebts, readSettings,
  writeExpenses, writeBudgets, writeDebts, writeSettings,
  IS_LIVE,
} from "../lib/shelby";

export type SyncStatus = "idle" | "loading" | "syncing" | "synced" | "error";

export function useFinance() {
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [budgets,  setBudgets]    = useState<Budget[]>(DEFAULT_BUDGETS);
  const [debts,    setDebts]      = useState<Debt[]>([]);
  const [settings, setSettings]   = useState<Settings>(DEFAULT_SETTINGS);
  const [status,   setStatus]     = useState<SyncStatus>("loading");
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Debounce timers — avoid hammering Shelby on every keystroke
  const syncTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Initial load from Shelby ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setStatus("loading");
      try {
        const [e, b, d, s] = await Promise.all([
          readExpenses(),
          readBudgets(),
          readDebts(),
          readSettings(),
        ]);
        setExpenses(e);
        setBudgets(b);
        setDebts(d);
        setSettings(s);
        setStatus("synced");
        setLastSynced(new Date().toLocaleTimeString());
      } catch {
        setStatus("error");
      }
    })();
  }, []);

  // ── Debounced sync helper ──────────────────────────────────────────────────
  function debouncedSync<T>(key: string, writer: (data: T) => Promise<unknown>, data: T, delay = 800) {
    clearTimeout(syncTimers.current[key]);
    syncTimers.current[key] = setTimeout(async () => {
      setStatus("syncing");
      try {
        await writer(data);
        setStatus("synced");
        setLastSynced(new Date().toLocaleTimeString());
      } catch {
        setStatus("error");
      }
    }, delay);
  }

  // ── Expense actions ────────────────────────────────────────────────────────
  const addExpense = useCallback((data: Omit<Expense, "id" | "date">) => {
    const expense: Expense = {
      ...data,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setExpenses((prev) => {
      const next = [expense, ...prev];
      debouncedSync("expenses", writeExpenses, next);
      return next;
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      debouncedSync("expenses", writeExpenses, next);
      return next;
    });
  }, []);

  // ── Budget actions ─────────────────────────────────────────────────────────
  const updateBudget = useCallback((category: Category, limit: number) => {
    setBudgets((prev) => {
      const next = prev.map((b) => b.category === category ? { ...b, limit } : b);
      debouncedSync("budgets", writeBudgets, next, 1200);
      return next;
    });
  }, []);

  // ── Debt actions ───────────────────────────────────────────────────────────
  const addDebt = useCallback((data: Omit<Debt, "id">) => {
    setDebts((prev) => {
      const next = [...prev, { ...data, id: crypto.randomUUID() }];
      debouncedSync("debts", writeDebts, next);
      return next;
    });
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setDebts((prev) => {
      const next = prev.filter((d) => d.id !== id);
      debouncedSync("debts", writeDebts, next);
      return next;
    });
  }, []);

  // ── Settings actions ───────────────────────────────────────────────────────
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      debouncedSync("settings", writeSettings, next, 1500);
      return next;
    });
  }, []);

  const setIncome    = useCallback((v: number) => updateSettings({ monthlyIncome: v }), [updateSettings]);
  const setStrategy  = useCallback((v: DebtStrategy) => updateSettings({ strategy: v }), [updateSettings]);
  const setExtra     = useCallback((v: number) => updateSettings({ extraPayment: v }), [updateSettings]);

  return {
    // State
    expenses, budgets, debts, settings,
    monthlyIncome: settings.monthlyIncome,
    strategy: settings.strategy,
    extraPayment: settings.extraPayment,
    // Sync state
    status, lastSynced, isLive: IS_LIVE,
    // Actions
    addExpense, deleteExpense,
    updateBudget,
    addDebt, deleteDebt,
    setIncome, setStrategy, setExtra,
  };
}

