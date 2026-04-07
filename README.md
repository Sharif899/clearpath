# ◎ ClearPath — Finance on Shelby

> **Your path to financial freedom — built on Shelby Protocol.** Track expenses, manage budgets, and plan your debt payoff with data stored permanently on decentralised storage. With AI-powered insights from Claude.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Shelby Protocol](https://img.shields.io/badge/Shelby_Protocol-v2-0d9488?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Why Shelby for finance data?

Most finance apps store your data on a company's server. They can lose it, sell it, or shut down. ClearPath stores your financial data on the **Shelby decentralised storage network** — permanent, censorship-resistant, and owned only by you.

| Traditional app | ClearPath on Shelby |
|---|---|
| Data on company server | Data on decentralised network |
| Company can delete or lose your data | Permanent storage with expiry you control |
| No proof data hasn't changed | Merkle root integrity proof per blob |
| Single point of failure | 16 storage providers per placement group |
| Works on one device | Access from any device with your Aptos key |

---

## Features

**Dashboard** — Net worth snapshot, budget health ring, category breakdown, recent expenses, debt overview.

**Expense tracker** — Add expenses with 8 categories. Filter by category. Group by date. Two-tap delete. Monthly running total vs budget.

**Budget manager** — Set monthly limits per category. Expected-spend indicator shows where you *should* be by today's date. Income allocation bar flags over-budgeting.

**Debt payoff planner** — Avalanche vs Snowball strategy toggle. Extra payment slider with real-time interest savings calculation. Animated payoff timeline chart. Month-by-month simulation from scratch.

**AI insights** — Claude reads your actual expenses, budgets, and debts and gives 3 specific, honest, actionable insights.

**Shelby sync status** — Live indicator in the sidebar shows when data is being saved to Shelby, last synced time, and a direct link to your blobs on the Shelby Explorer.

---

## Shelby storage architecture

Each data type is stored as a **separate blob** so updates are surgical:

```
finances/{aptos_address}/expenses.json   ← updated when expense added/deleted
finances/{aptos_address}/budgets.json    ← updated when budget limit changes
finances/{aptos_address}/debts.json      ← updated when debt added/deleted
finances/{aptos_address}/settings.json   ← updated when income/strategy changes
```

Your Aptos account address is your namespace. No username, no password — just your key.

### Write flow (per data type)

```
User action (add expense)
        │
        ▼
React state updated immediately (UI feels instant)
        │
        ▼
Debounced 800ms (batches rapid changes)
        │
        ▼
writeExpenses(expenses) called
        │
  Mock mode → localStorage.setItem()
  Live mode → shelbyClient.upload({
                signer: account,
                blobData: Buffer.from(JSON.stringify(expenses)),
                blobName: "finances/{address}/expenses.json",
                expirationMicros: now + 365 days
              })
        │
        ▼
Sync status → "synced" ✓
```

### Read flow (on app load)

```
App mounts
        │
        ▼
Promise.all([
  readExpenses(),
  readBudgets(),
  readDebts(),
  readSettings()
])
        │
  Mock mode → localStorage.getItem() for each
  Live mode → shelbyClient.download() for each blob
        │
        ▼
State populated → UI renders
```

---

## Mock mode vs live mode

ClearPath ships with **mock mode** enabled by default — the app works fully without a Shelby testnet token, using localStorage with the same API surface as the real SDK.

```
VITE_SHELBY_MODE=mock   →  localStorage (works everywhere, no token)
VITE_SHELBY_MODE=live   →  real Shelby testnet via @shelby-protocol/sdk
```

The sidebar always shows the current mode. In mock mode: `Mock mode · localStorage`. In live mode: your account address with a link to the Shelby Explorer.

### Switching to live mode

1. Get testnet access at [developers.shelby.xyz](https://developers.shelby.xyz)
2. Fund your account via `shelby faucet --network testnet`
3. Install the SDK: `npm install @shelby-protocol/sdk @aptos-labs/ts-sdk`
4. Set env vars:
   ```env
   VITE_SHELBY_MODE=live
   VITE_SHELBY_ACCOUNT_ADDRESS=0x...
   VITE_SHELBY_PRIVATE_KEY=ed25519-priv-0x...
   VITE_SHELBY_API_KEY=aptoslabs_...
   ```
5. Uncomment the live mode blocks in `src/lib/shelby.ts`

That's it. No other code changes. The hook, components, and UI are completely unaffected.

---

## Project structure

```
clearpath/
├── src/
│   ├── main.tsx                       # React entry point
│   ├── App.tsx                        # Root — sidebar nav, tab routing
│   ├── app.css                        # Complete design system
│   ├── types.ts                       # All TypeScript types + defaults
│   ├── lib/
│   │   ├── shelby.ts                  # ★ Shelby storage layer (mock + live)
│   │   └── finance.ts                 # Pure calculation functions
│   ├── hooks/
│   │   └── useFinance.ts              # Single source of truth — state + Shelby sync
│   └── components/
│       ├── Dashboard.tsx              # Overview page
│       ├── ExpenseTracker.tsx         # Add + list expenses
│       ├── BudgetManager.tsx          # Set + monitor budgets
│       ├── DebtPlanner.tsx            # Payoff calculator + timeline chart
│       ├── AIInsight.tsx              # Claude-powered analysis
│       └── ShelbyStatus.tsx           # Sidebar sync status indicator
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

---

## Key code: `src/lib/shelby.ts`

This is the architectural centrepiece. It exports a clean read/write API that abstracts over mock and live mode entirely:

```typescript
// Read
const expenses = await readExpenses();   // [] or Shelby blob
const budgets  = await readBudgets();    // defaults or Shelby blob
const debts    = await readDebts();      // [] or Shelby blob
const settings = await readSettings();   // defaults or Shelby blob

// Write (returns WriteResult with blob metadata)
await writeExpenses(expenses);
await writeBudgets(budgets);
await writeDebts(debts);
await writeSettings(settings);
```

Every write returns a `WriteResult` with `blobName`, `accountAddress`, `mockMode`, and `storedAt` — so the UI always knows exactly what was stored and where.

---

## Key code: `src/hooks/useFinance.ts`

The hook loads all data from Shelby on mount, then syncs back on every change with an 800ms debounce to avoid hammering the network on every keystroke:

```typescript
function debouncedSync(key, writer, data, delay = 800) {
  clearTimeout(syncTimers.current[key]);
  syncTimers.current[key] = setTimeout(async () => {
    setStatus("syncing");
    await writer(data);
    setStatus("synced");
  }, delay);
}
```

Budget updates use a longer 1200ms debounce (users drag sliders). Settings use 1500ms. This keeps the UI instant while the storage layer catches up.

---

## Key code: `src/lib/finance.ts` — debt payoff algorithm

The `calculatePayoff` function simulates debt repayment month by month with no external library:

1. Apply monthly interest to all active balances
2. Pay minimums on every debt
3. Apply extra payment to priority debt (highest rate for avalanche, lowest balance for snowball)
4. Record state snapshot for timeline chart
5. Repeat until all balances reach zero (max 600 months)

This is the same mathematics behind every financial calculator — implemented from scratch, fully typed, and testable in isolation.

---

## Quickstart

```bash
git clone https://github.com/YOUR_USERNAME/clearpath
cd clearpath
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Works immediately in mock mode.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add environment variables (all optional for mock mode):
   ```
   VITE_SHELBY_MODE          = mock
   VITE_ANTHROPIC_API_KEY    = sk-ant-XXXX   (for AI insights)
   ```
4. Deploy

---

## Tech stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety throughout |
| Vite 6 | Build tool |
| Shelby Protocol | Decentralised blob storage |
| Aptos | Blockchain coordination layer |
| Claude Sonnet | AI financial insights |
| Sora + JetBrains Mono | Typography |
| Vanilla CSS | Styling — zero UI libraries |
| localStorage | Mock Shelby storage |

---

## License

MIT — see [LICENSE](./LICENSE)

---

Built on [Shelby Protocol](https://shelby.xyz) · Coordinated by [Aptos](https://aptos.dev) · AI by [Claude](https://anthropic.com) · Your money, your data
