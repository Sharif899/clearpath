import type { Debt, DebtStrategy, PayoffPlan, PayoffMonth, Expense, Budget, Category } from "../types";

export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function spentByCategory(expenses: Expense[]): Record<string, number> {
  const result: Record<string, number> = {};
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

export function totalDebt(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.balance, 0);
}

export function minimumTotal(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.minimumPayment, 0);
}

export function calculatePayoff(
  debts: Debt[],
  strategy: DebtStrategy,
  extraPayment: number
): PayoffPlan {
  if (debts.length === 0) {
    return { months: [], totalInterest: 0, payoffDate: "", monthsToPayoff: 0 };
  }

  let balances = debts.map((d) => ({ ...d }));

  const sortedOrder = (bs: typeof balances) => {
    const active = bs.filter((d) => d.balance > 0);
    return strategy === "avalanche"
      ? active.sort((a, b) => b.interestRate - a.interestRate)
      : active.sort((a, b) => a.balance - b.balance);
  };

  const months: PayoffMonth[] = [];
  let totalInterest = 0;
  let monthIndex = 0;
  const now = new Date();

  while (balances.some((d) => d.balance > 0) && monthIndex < 600) {
    monthIndex++;
    let interestThisMonth = 0;
    let principalThisMonth = 0;

    balances = balances.map((d) => {
      if (d.balance <= 0) return d;
      const interest = (d.balance * (d.interestRate / 100)) / 12;
      interestThisMonth += interest;
      return { ...d, balance: d.balance + interest };
    });

    totalInterest += interestThisMonth;

    balances = balances.map((d) => {
      if (d.balance <= 0) return d;
      const payment = Math.min(d.minimumPayment, d.balance);
      principalThisMonth += payment;
      return { ...d, balance: Math.max(0, d.balance - payment) };
    });

    let remaining = extraPayment;
    for (const priority of sortedOrder(balances)) {
      if (remaining <= 0) break;
      const idx = balances.findIndex((d) => d.id === priority.id);
      const payment = Math.min(remaining, balances[idx].balance);
      balances[idx] = { ...balances[idx], balance: balances[idx].balance - payment };
      remaining -= payment;
    }

    const date = new Date(now.getFullYear(), now.getMonth() + monthIndex, 1);
    months.push({
      month: monthIndex,
      label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      totalBalance: balances.reduce((s, d) => s + Math.max(0, d.balance), 0),
      interestPaid: interestThisMonth,
      principalPaid: principalThisMonth,
      debtsRemaining: balances.filter((d) => d.balance > 0).length,
    });
  }

  return {
    months,
    totalInterest: Math.round(totalInterest * 100) / 100,
    payoffDate: months[months.length - 1]?.label ?? "",
    monthsToPayoff: months.length,
  };
}

export function interestSaved(
  debts: Debt[],
  extraPayment: number
): { avalanche: number; snowball: number; baseline: number } {
  return {
    baseline: calculatePayoff(debts, "avalanche", 0).totalInterest,
    avalanche: calculatePayoff(debts, "avalanche", extraPayment).totalInterest,
    snowball: calculatePayoff(debts, "snowball", extraPayment).totalInterest,
  };
}

export function fmt(n: number, opts?: Intl.NumberFormatOptions): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, ...opts });
}

export function fmtDecimal(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

export function fmtPct(n: number): string {
  return `${Math.round(n)}%`;
}

