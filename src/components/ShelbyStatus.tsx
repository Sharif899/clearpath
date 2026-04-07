import type { SyncStatus } from "../hooks/useFinance";
import { explorerUrl, IS_LIVE, getAddress } from "../lib/shelby";

interface ShelbyStatusProps {
  status: SyncStatus;
  lastSynced: string | null;
}

export function ShelbyStatus({ status, lastSynced }: ShelbyStatusProps) {
  const dots: Record<SyncStatus, string> = {
    idle:    "⬤",
    loading: "⬤",
    syncing: "⬤",
    synced:  "⬤",
    error:   "⬤",
  };

  const colors: Record<SyncStatus, string> = {
    idle:    "#9ca3af",
    loading: "#f59e0b",
    syncing: "#3b82f6",
    synced:  "#10b981",
    error:   "#ef4444",
  };

  const labels: Record<SyncStatus, string> = {
    idle:    "Idle",
    loading: "Loading…",
    syncing: "Saving to Shelby…",
    synced:  "Synced",
    error:   "Sync error",
  };

  const shortAddr = getAddress().slice(0, 6) + "…" + getAddress().slice(-4);

  return (
    <div className="shelby-status">
      <div className="shelby-status-row">
        <span style={{ color: colors[status], fontSize: "10px" }}>{dots[status]}</span>
        <span className="shelby-status-label">{labels[status]}</span>
        {IS_LIVE && (
          <span className="shelby-live-badge">LIVE</span>
        )}
      </div>
      {!IS_LIVE && (
        <p className="shelby-mode-note">Mock mode · localStorage</p>
      )}
      {IS_LIVE && (
        <a className="shelby-explorer-link" href={explorerUrl()} target="_blank" rel="noopener noreferrer">
          {shortAddr} ↗
        </a>
      )}
      {lastSynced && (
        <p className="shelby-synced-at">Last saved {lastSynced}</p>
      )}
    </div>
  );
}
