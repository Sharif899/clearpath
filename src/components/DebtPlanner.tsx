import { useState, useMemo } from "react";
import type { Debt, DebtStrategy } from "../types";
import { calculatePayoff, interestSaved, totalDebt, minimumTotal, fmt } from "../lib/finance";

interface DebtPlannerProps {
  debts: Debt[];
  strategy: DebtStrategy;
  extraPayment: number;
  onAdd: (d: Omit<Debt, "id">) => void;
  onDelete: (id: string) => void;
  onSetStrategy: (s: DebtStrategy) => void;
  onSetExtra: (v: number) => void;
}

const EMPTY = { name: "", balance: "", interestRate: "", minimumPayment: "" };

export function DebtPlanner({ debts, strategy, extraPayment, onAdd, onDelete, onSetStrategy, onSetExtra }: DebtPlannerProps) {
  const [form, setForm]         = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const plan    = useMemo(() => calculatePayoff(debts, strategy, extraPayment), [debts, strategy, extraPayment]);
  const saved   = useMemo(() => interestSaved(debts, extraPayment), [debts, extraPayment]);
  const minTotal = minimumTotal(debts);
  const totalBal = totalDebt(debts);

  const chartMonths = useMemo(() => {
    if (plan.months.length === 0) return [];
    const step = Math.max(1, Math.floor(plan.months.length / 24));
    const sampled = plan.months.filter((_, i) => i % step === 0);
    const last = plan.months[plan.months.length - 1];
    if (last && sampled[sampled.length - 1]?.month !== last.month) sampled.push(last);
    return sampled;
  }, [plan]);

  const handleAdd = () => {
    const bal  = parseFloat(form.balance);
    const rate = parseFloat(form.interestRate);
    const min  = parseFloat(form.minimumPayment);
    if (!form.name.trim())  { setFormError("Enter a name"); return; }
    if (!bal  || bal  <= 0) { setFormError("Enter a valid balance"); return; }
    if (!rate || rate <  0) { setFormError("Enter interest rate"); return; }
    if (!min  || min  <= 0) { setFormError("Enter minimum payment"); return; }
    setFormError("");
    onAdd({ name: form.name.trim(), balance: bal, interestRate: rate, minimumPayment: min });
    setForm(EMPTY);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirmId === id) { onDelete(id); setConfirmId(null); }
    else { setConfirmId(id); setTimeout(() => setConfirmId(null), 2500); }
  };

  const maxBal = chartMonths[0]?.totalBalance ?? 1;
  const strategySaved = Math.max(0, saved.baseline - (strategy === "avalanche" ? saved.avalanche : saved.snowball));

  return (
    <div className="debt-planner">
      <div className="debt-kpi-row">
        <div className="debt-kpi"><span className="debt-kpi-label">Total debt</span><span className="debt-kpi-value danger">{fmt(totalBal)}</span></div>
        <div className="debt-kpi"><span className="debt-kpi-label">Payoff date</span><span className="debt-kpi-value">{plan.payoffDate || "—"}</span></div>
        <div className="debt-kpi"><span className="debt-kpi-label">Total interest</span><span className="debt-kpi-value danger">{fmt(plan.totalInterest)}</span></div>
        <div className="debt-kpi success"><span className="debt-kpi-label">Interest saved</span><span className="debt-kpi-value success">{fmt(strategySaved)}</span></div>
      </div>

      <div className="planner-layout">
        <div className="planner-left">
          <div className="strategy-card">
            <p className="card-title">Payoff strategy</p>
            <div className="strategy-toggle">
              <button className={`strategy-btn ${strategy === "avalanche" ? "active" : ""}`} onClick={() => onSetStrategy("avalanche")}>
                <span className="strategy-icon">🏔</span>
                <div><strong>Avalanche</strong><p>Highest interest first — saves most money</p></div>
              </button>
              <button className={`strategy-btn ${strategy === "snowball" ? "active" : ""}`} onClick={() => onSetStrategy("snowball")}>
                <span className="strategy-icon">⛄</span>
                <div><strong>Snowball</strong><p>Smallest balance first — builds momentum</p></div>
              </button>
            </div>
          </div>

          <div className="extra-card">
            <div className="extra-header">
              <p className="card-title">Extra monthly payment</p>
              <span className="extra-value">{fmt(extraPayment)}/mo</span>
            </div>
            <input type="range" min="0" max="2000" step="25" value={extraPayment}
              onChange={(e) => onSetExtra(parseInt(e.target.value))} className="extra-slider" />
            <div className="extra-labels"><span>$0</span><span>$1,000</span><span>$2,000</span></div>
            <div className="extra-impact">
              <div className="impact-row"><span>Minimum only ({fmt(minTotal)}/mo)</span><span className="danger">{fmt(saved.baseline)} interest</span></div>
              <div className="impact-row"><span>With extra payment</span><span className="success">{fmt(strategy === "avalanche" ? saved.avalanche : saved.snowball)} interest</span></div>
              <div className="impact-row bold"><span>You save</span><span className="success">{fmt(strategySaved)}</span></div>
            </div>
          </div>

          <div className="debt-list-card">
            <div className="debt-list-header">
              <p className="card-title">Your debts</p>
              <button className="add-debt-btn" onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancel" : "+ Add debt"}
              </button>
            </div>

            {showForm && (
              <div className="debt-form">
                <input className="debt-input" placeholder="Debt name (e.g. Visa card)"
                  value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                <div className="debt-form-row">
                  <div className="debt-field">
                    <label>Balance ($)</label>
                    <input className="debt-input" type="number" placeholder="5000"
                      value={form.balance} onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))} />
                  </div>
                  <div className="debt-field">
                    <label>Interest (%)</label>
                    <input className="debt-input" type="number" placeholder="19.99"
                      value={form.interestRate} onChange={(e) => setForm((f) => ({ ...f, interestRate: e.target.value }))} />
                  </div>
                  <div className="debt-field">
                    <label>Min payment ($)</label>
                    <input className="debt-input" type="number" placeholder="150"
                      value={form.minimumPayment} onChange={(e) => setForm((f) => ({ ...f, minimumPayment: e.target.value }))} />
                  </div>
                </div>
                {formError && <p className="form-error">{formError}</p>}
                <button className="add-btn" onClick={handleAdd}>Add debt</button>
              </div>
            )}

            {debts.length === 0 ? (
              <p className="empty-hint">Add debts above to see your payoff plan.</p>
            ) : (
              <div className="debts">
                {debts.map((d) => (
                  <div key={d.id} className="debt-entry">
                    <div className="debt-entry-main">
                      <span className="debt-entry-name">{d.name}</span>
                      <span className="debt-entry-rate">{d.interestRate}% APR</span>
                    </div>
                    <div className="debt-entry-numbers">
                      <div><span className="debt-entry-label">Balance</span><span className="debt-entry-val danger">{fmt(d.balance)}</span></div>
                      <div><span className="debt-entry-label">Min payment</span><span className="debt-entry-val">{fmt(d.minimumPayment)}</span></div>
                      <button className={`del-btn ${confirmId === d.id ? "confirm" : ""}`} onClick={() => handleDelete(d.id)}>
                        {confirmId === d.id ? "sure?" : "×"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="planner-right">
          <div className="chart-card">
            <p className="card-title">Payoff timeline</p>
            {chartMonths.length === 0 ? (
              <div className="chart-empty">Add debts to see your payoff timeline</div>
            ) : (
              <div className="timeline-chart">
                <div className="chart-bars">
                  {chartMonths.map((m, i) => {
                    const heightPct = (m.totalBalance / maxBal) * 100;
                    const isLast = i === chartMonths.length - 1;
                    return (
                      <div key={m.month} className="chart-col">
                        <div className="chart-bar-wrap">
                          <div className={`chart-bar ${isLast ? "last" : ""}`}
                            style={{ height: `${Math.max(heightPct, 1)}%` }}
                            title={`${m.label}: ${fmt(m.totalBalance)}`} />
                        </div>
                        {(i === 0 || i === Math.floor(chartMonths.length / 2) || isLast) && (
                          <span className="chart-label">{m.label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="chart-y-labels">
                  <span>{fmt(maxBal)}</span>
                  <span>{fmt(maxBal / 2)}</span>
                  <span>$0</span>
                </div>
              </div>
            )}
            {plan.monthsToPayoff > 0 && (
              <div className="timeline-milestones">
                <div className="milestone"><span className="ms-dot paid" /><span>Debt-free in <strong>{plan.monthsToPayoff} months</strong> ({plan.payoffDate})</span></div>
                <div className="milestone"><span className="ms-dot interest" /><span>Total interest: <strong className="danger">{fmt(plan.totalInterest)}</strong></span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
