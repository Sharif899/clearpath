export type Category =
  | "housing" | "food" | "transport" | "health"
  | "entertainment" | "shopping" | "education" | "other";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: string;
}

export interface Budget {
  category: Category;
  limit: number;
}

export type DebtStrategy = "avalanche" | "snowball";

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

export interface Settings {
  monthlyIncome: number;
  strategy: DebtStrategy;
  extraPayment: number;
  currency: string;
}

export interface FinanceData {
  expenses: Expense[];
  budgets: Budget[];
  debts: Debt[];
  settings: Settings;
}

export interface PayoffMonth {
  month: number;
  label: string;
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
  food:          { label: "Food",          icon: "🍽",  color: "#f59e0b" },
  transport:     { label: "Transport",     icon: "🚗", color: "#3b82f6" },
  health:        { label: "Health",        icon: "💊", color: "#10b981" },
  entertainment: { label: "Entertainment", icon: "🎮", color: "#8b5cf6" },
  shopping:      { label: "Shopping",      icon: "🛍",  color: "#ec4899" },
  education:     { label: "Education",     icon: "📚", color: "#06b6d4" },
  other:         { label: "Other",         icon: "📌", color: "#6b7280" },
};

export const DEFAULT_BUDGETS: Budget[] = [
  { category: "housing",       limit: 1500 },
  { category: "food",          limit: 600  },
  { category: "transport",     limit: 300  },
  { category: "health",        limit: 200  },
  { category: "entertainment", limit: 150  },
  { category: "shopping",      limit: 200  },
  { category: "education",     limit: 100  },
  { category: "other",         limit: 100  },
];

export const DEFAULT_SETTINGS: Settings = {
  monthlyIncome: 3000,
  strategy: "avalanche",
  extraPayment: 100,
  currency: "USD",
};
