import type { Debt, DebtStrategy, PayoffPlan, PayoffMonth, Expense, Budget, Category } from "../types";

// ─── Expense calculations ─────────────────────────────────────────────────────

export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function spentByCategory(expenses: Expense[]): Record<Category, number> {
  const result = {} as Record<Category, number>;
  for (const e of expenses) {
    result[e.category] = (result[e.category] ?? 0) + e.amount;
  }
  return result;
}

export function budgetHealth(
  expenses: Expense[],
  budgets: Budget[]
): { category: Category; spent: number; limit: number; pct: number; over: boolean }[] {
  const byCategory = spentByCategory(expenses);
  return budgets.map((b) => {
    const spent = byCategory[b.category] ?? 0;
    const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    return { category: b.category, spent, limit: b.limit, pct, over: pct > 100 };
  });
}

export function monthlyExpenses(expenses: Expense[]): Expense[] {
  const now = new Date();
  return expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

// ─── Debt calculations ────────────────────────────────────────────────────────

export function totalDebt(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.balance, 0);
}

export function minimumTotal(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.minimumPayment, 0);
}

/**
 * Calculate debt payoff plan using either:
 * - avalanche: pay highest interest rate first (minimises total interest)
 * - snowball:  pay lowest balance first (maximises motivation)
 *
 * extraPayment is the amount above all minimums to apply each month.
 */
export function calculatePayoff(
  debts: Debt[],
  strategy: DebtStrategy,
  extraPayment: number
): PayoffPlan {
  if (debts.length === 0) {
    return { months: [], totalInterest: 0, payoffDate: "", monthsToPayoff: 0 };
  }

  // Deep clone balances
  let balances = debts.map((d) => ({ ...d, balance: d.balance }));

  const sortedOrder = (bs: typeof balances) => {
    const active = bs.filter((d) => d.balance > 0);
    if (strategy === "avalanche") {
      return active.sort((a, b) => b.interestRate - a.interestRate);
    } else {
      return active.sort((a, b) => a.balance - b.balance);
    }
  };

  const months: PayoffMonth[] = [];
  let totalInterest = 0;
  let monthIndex = 0;
  const now = new Date();

  while (balances.some((d) => d.balance > 0) && monthIndex < 600) {
    monthIndex++;
    let interestThisMonth = 0;
    let principalThisMonth = 0;

    // Apply interest
    balances = balances.map((d) => {
      if (d.balance <= 0) return d;
      const interest = (d.balance * (d.interestRate / 100)) / 12;
      interestThisMonth += interest;
      return { ...d, balance: d.balance + interest };
    });

    totalInterest += interestThisMonth;

    // Pay minimums first
    balances = balances.map((d) => {
      if (d.balance <= 0) return d;
      const payment = Math.min(d.minimumPayment, d.balance);
      principalThisMonth += payment - (d.balance * (d.interestRate / 100)) / 12;
      return { ...d, balance: Math.max(0, d.balance - payment) };
    });

    // Apply extra payment to priority debt
    let remaining = extraPayment;
    const ordered = sortedOrder(balances);
    for (const priority of ordered) {
      if (remaining <= 0) break;
      const idx = balances.findIndex((d) => d.id === priority.id);
      const payment = Math.min(remaining, balances[idx].balance);
      balances[idx] = { ...balances[idx], balance: balances[idx].balance - payment };
      remaining -= payment;
    }

    const date = new Date(now.getFullYear(), now.getMonth() + monthIndex, 1);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    months.push({
      month: monthIndex,
      label,
      totalBalance: balances.reduce((s, d) => s + Math.max(0, d.balance), 0),
      interestPaid: interestThisMonth,
      principalPaid: principalThisMonth,
      debtsRemaining: balances.filter((d) => d.balance > 0).length,
    });
  }

  const lastMonth = months[months.length - 1];
  const payoffDate = lastMonth?.label ?? "";

  return {
    months,
    totalInterest: Math.round(totalInterest * 100) / 100,
    payoffDate,
    monthsToPayoff: months.length,
  };
}

export function interestSaved(
  debts: Debt[],
  extraPayment: number
): { avalanche: number; snowball: number; baseline: number } {
  const baseline = calculatePayoff(debts, "avalanche", 0).totalInterest;
  const avalanche = calculatePayoff(debts, "avalanche", extraPayment).totalInterest;
  const snowball = calculatePayoff(debts, "snowball", extraPayment).totalInterest;
  return { avalanche, snowball, baseline };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function fmt(n: number, opts?: Intl.NumberFormatOptions): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, ...opts });
}

export function fmtDecimal(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtPct(n: number): string {
  return `${Math.round(n)}%`;
}

