export type Category =
  | "housing" | "food" | "transport" | "health"
  | "entertainment" | "shopping" | "education" | "other";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: string; // ISO
}

export interface Budget {
  category: Category;
  limit: number; // monthly limit in dollars
}

export type DebtStrategy = "avalanche" | "snowball";

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // APR as percentage e.g. 19.99
  minimumPayment: number;
}

export interface PayoffMonth {
  month: number;       // 1-based
  label: string;       // "Jan 2026"
  totalBalance: number;
  interestPaid: number;
  principalPaid: number;
  debtsRemaining: number;
}

export interface PayoffPlan {
  months: PayoffMonth[];
  totalInterest: number;
  payoffDate: string;
  monthsToPayoff: number;
}

export const CATEGORIES: Record<Category, { label: string; icon: string; color: string }> = {
  housing:       { label: "Housing",       icon: "🏠", color: "#0d9488" },
  food:          { label: "Food",          icon: "🍽", color: "#f59e0b" },
  transport:     { label: "Transport",     icon: "🚗", color: "#3b82f6" },
  health:        { label: "Health",        icon: "💊", color: "#10b981" },
  entertainment: { label: "Entertainment", icon: "🎮", color: "#8b5cf6" },
  shopping:      { label: "Shopping",      icon: "🛍",  color: "#ec4899" },
  education:     { label: "Education",     icon: "📚", color: "#06b6d4" },
  other:         { label: "Other",         icon: "📌", color: "#6b7280" },
};
