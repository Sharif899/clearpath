# ◎ ClearPath

> **Your path to financial freedom.** Track every expense, manage your budgets, plan your debt payoff with mathematical precision, and get AI-powered insights — all in one beautiful app. Zero backend. Your data stays yours.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude-Sonnet-0d9488?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## What this solves

Most people manage money across 3-4 different apps — one for expenses, one for budgets, one for debt. None of them talk to each other and none of them give advice.

ClearPath puts everything in one place and uses AI to connect the dots.

### Features

**Dashboard** — Net worth snapshot, budget health ring, category breakdown, recent expenses, debt overview. Everything at a glance.

**Expense tracker** — Add expenses in seconds. 8 categories with colour coding. Filter by category. Group by date. Two-tap delete confirmation. Monthly running total vs budget.

**Budget manager** — Set monthly limits per category. See your burn rate with an expected-spend indicator (where you *should* be by today's date). Live over-budget warnings. Income allocation bar.

**Debt payoff planner** — Add all your debts. Choose Avalanche (pay highest interest first, saves the most money) or Snowball (pay lowest balance first, builds momentum). Slide the extra payment slider and watch the payoff date and total interest update in real time. Animated bar chart shows your balance dropping to zero.

**AI insights** — Claude analyses your expenses, budgets, and debts together and gives 3 sharp, specific, actionable insights — not generic tips.

---

## Quickstart

```bash
git clone https://github.com/YOUR_USERNAME/clearpath
cd clearpath
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Everything works immediately — no signup, no API key needed for the core features.

---

## Project structure

```
clearpath/
├── src/
│   ├── main.tsx                      # React entry point
│   ├── App.tsx                       # Root — sidebar nav, tab routing
│   ├── app.css                       # Complete design system
│   ├── types.ts                      # All TypeScript types
│   ├── hooks/
│   │   └── useFinance.ts             # Single source of truth — all state + localStorage
│   ├── lib/
│   │   └── finance.ts                # Pure calculation functions
│   └── components/
│       ├── Dashboard.tsx             # Overview page
│       ├── ExpenseTracker.tsx        # Add + list expenses
│       ├── BudgetManager.tsx         # Set + monitor budgets
│       ├── DebtPlanner.tsx           # Payoff calculator + chart
│       └── AIInsight.tsx             # Claude-powered analysis
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Architecture

### `useFinance` hook
Single custom hook owns all state. Every component gets only what it needs as props. localStorage sync is handled automatically via `useEffect`. No Redux, no Zustand — just clean React.

```typescript
const finance = useFinance();
// finance.expenses, finance.budgets, finance.debts
// finance.addExpense(), finance.updateBudget(), finance.addDebt()
// finance.strategy, finance.extraPayment, finance.monthlyIncome
```

### `lib/finance.ts` — pure functions
All calculations live here, completely separated from UI. Testable, readable, reusable.

```typescript
calculatePayoff(debts, strategy, extraPayment) → PayoffPlan
budgetHealth(expenses, budgets) → HealthReport[]
interestSaved(debts, extraPayment) → { avalanche, snowball, baseline }
```

### Debt payoff algorithm
The `calculatePayoff` function simulates month-by-month debt repayment:
1. Apply monthly interest to all balances
2. Pay minimums on all debts
3. Apply extra payment to the priority debt (highest rate for avalanche, lowest balance for snowball)
4. Record balance, interest paid, debts remaining
5. Repeat until all balances reach zero (max 600 months)

This is the same math behind every debt payoff calculator — implemented from scratch with no library.

---

## AI insights setup

Add your Anthropic API key to use the AI insights feature.

### Vercel deployment

Add in **Vercel → Settings → Environment Variables**:
```
VITE_ANTHROPIC_API_KEY = sk-ant-XXXX
```

### Local development

Create `.env`:
```env
VITE_ANTHROPIC_API_KEY=sk-ant-XXXX
```

Get a key at [console.anthropic.com](https://console.anthropic.com).

The app works fully without the key — AI insights is the only feature that needs it.

---

## Deployment

```bash
npm run build   # outputs to dist/
npm run preview # serve locally
```

Deploy to Vercel, Netlify, Cloudflare Pages, or any static host. No server required.

---

## Data & privacy

All data is stored in **your browser's localStorage** only. Nothing is ever sent to any server except:
- The AI insight request (sends a category summary and totals — never individual transaction descriptions or personal details)

Clearing your browser data removes all your financial data.

---

## Tech stack

| Tool | Purpose |
|---|---|
| React 18 | UI |
| TypeScript | Type safety |
| Vite 6 | Build |
| Sora + JetBrains Mono | Typography |
| Vanilla CSS | Styling — zero UI libraries |
| Claude Sonnet | AI insights |
| localStorage | Persistence |
| Web Crypto API | UUID generation |

---

## License

MIT — see [LICENSE](./LICENSE)

---

Built for people who want to understand their money, not just track it.
