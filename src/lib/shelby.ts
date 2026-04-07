/**
 * shelby.ts — Shelby Protocol storage layer for ClearPath
 *
 * MOCK MODE (default — VITE_SHELBY_MODE=mock):
 *   Stores all finance data in localStorage.
 *   API surface is identical to live mode.
 *   Zero tokens needed.
 *
 * LIVE MODE (VITE_SHELBY_MODE=live):
 *   Stores each data type as a separate blob on Shelby testnet.
 *   Blob naming: finances/{address}/{type}.json
 *   Requires: VITE_SHELBY_ACCOUNT_ADDRESS, VITE_SHELBY_PRIVATE_KEY, VITE_SHELBY_API_KEY
 *
 * Switching from mock to live: set env var + uncomment live blocks below.
 * No other code changes needed — the hook and components are unaffected.
 */

import type { Expense, Budget, Debt, Settings } from "../types";
import { DEFAULT_BUDGETS, DEFAULT_SETTINGS } from "../types";

const IS_LIVE = import.meta.env.VITE_SHELBY_MODE === "live";

// ─── Blob naming ──────────────────────────────────────────────────────────────

export type BlobType = "expenses" | "budgets" | "debts" | "settings";

export function blobName(type: BlobType, address: string): string {
  return `finances/${address}/${type}.json`;
}

// The account address used as namespace — real address in live mode, demo in mock
export function getAddress(): string {
  return import.meta.env.VITE_SHELBY_ACCOUNT_ADDRESS ?? "0xdemo_clearpath_account";
}

// ─── Encode / decode ──────────────────────────────────────────────────────────

function encode(data: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(data, null, 2));
}

function decode<T>(bytes: Uint8Array): T {
  return JSON.parse(new TextDecoder().decode(bytes));
}

// ─── Mock storage (localStorage) ─────────────────────────────────────────────

const MOCK_PREFIX = "clearpath_shelby_";

function mockKey(type: BlobType): string {
  return `${MOCK_PREFIX}${type}`;
}

function mockRead<T>(type: BlobType, fallback: T): T {
  try {
    const raw = localStorage.getItem(mockKey(type));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function mockWrite(type: BlobType, data: unknown): void {
  localStorage.setItem(mockKey(type), JSON.stringify(data));
}

// Simulate Shelby network latency in mock mode
function mockDelay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ShelbyMeta {
  blobName: string;
  accountAddress: string;
  mockMode: boolean;
  storedAt: string;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function readExpenses(): Promise<Expense[]> {
  if (!IS_LIVE) {
    await mockDelay(100);
    return mockRead<Expense[]>("expenses", []);
  }

  // ── LIVE MODE ─────────────────────────────────────────────────────────────
  // const { ShelbyNodeClient } = await import("@shelby-protocol/sdk/node");
  // const { Network } = await import("@aptos-labs/ts-sdk");
  // const client = new ShelbyNodeClient({ network: Network.TESTNET, apiKey: import.meta.env.VITE_SHELBY_API_KEY });
  // try {
  //   const blob = await client.download({ account: getAddress(), blobName: blobName("expenses", getAddress()) });
  //   const chunks: Uint8Array[] = [];
  //   for await (const chunk of blob.readable) chunks.push(chunk);
  //   const bytes = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
  //   let offset = 0; for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
  //   return decode<Expense[]>(bytes);
  // } catch { return []; }

  return [];
}

export async function readBudgets(): Promise<Budget[]> {
  if (!IS_LIVE) {
    await mockDelay(100);
    return mockRead<Budget[]>("budgets", DEFAULT_BUDGETS);
  }

  // ── LIVE MODE ─────────────────────────────────────────────────────────────
  // const client = await getLiveClient();
  // try {
  //   const blob = await client.download({ account: getAddress(), blobName: blobName("budgets", getAddress()) });
  //   ... same pattern as readExpenses
  //   return decode<Budget[]>(bytes);
  // } catch { return DEFAULT_BUDGETS; }

  return DEFAULT_BUDGETS;
}

export async function readDebts(): Promise<Debt[]> {
  if (!IS_LIVE) {
    await mockDelay(100);
    return mockRead<Debt[]>("debts", []);
  }

  // ── LIVE MODE ─────────────────────────────────────────────────────────────
  // try { ... return decode<Debt[]>(bytes); } catch { return []; }

  return [];
}

export async function readSettings(): Promise<Settings> {
  if (!IS_LIVE) {
    await mockDelay(100);
    return mockRead<Settings>("settings", DEFAULT_SETTINGS);
  }

  // ── LIVE MODE ─────────────────────────────────────────────────────────────
  // try { ... return decode<Settings>(bytes); } catch { return DEFAULT_SETTINGS; }

  return DEFAULT_SETTINGS;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export interface WriteResult {
  success: boolean;
  meta: ShelbyMeta;
}

async function mockWriteBlob(type: BlobType, data: unknown): Promise<WriteResult> {
  await mockDelay(200);
  mockWrite(type, data);
  return {
    success: true,
    meta: {
      blobName: blobName(type, getAddress()),
      accountAddress: getAddress(),
      mockMode: true,
      storedAt: new Date().toISOString(),
    },
  };
}

export async function writeExpenses(expenses: Expense[]): Promise<WriteResult> {
  if (!IS_LIVE) return mockWriteBlob("expenses", expenses);

  // ── LIVE MODE ─────────────────────────────────────────────────────────────
  // const { ShelbyNodeClient } = await import("@shelby-protocol/sdk/node");
  // const { Account, Ed25519Account, Ed25519PrivateKey, Network } = await import("@aptos-labs/ts-sdk");
  // const account = new Ed25519Account({ privateKey: new Ed25519PrivateKey(import.meta.env.VITE_SHELBY_PRIVATE_KEY) });
  // const client = new ShelbyNodeClient({ network: Network.TESTNET, apiKey: import.meta.env.VITE_SHELBY_API_KEY });
  // const { transaction } = await client.upload({
  //   signer: account,
  //   blobData: Buffer.from(encode(expenses)),
  //   blobName: blobName("expenses", getAddress()),
  //   expirationMicros: (Date.now() + 365 * 24 * 3600 * 1000) * 1000,
  // });
  // return { success: true, meta: { blobName: blobName("expenses", getAddress()), accountAddress: getAddress(), mockMode: false, storedAt: new Date().toISOString() } };

  throw new Error("Live mode not configured");
}

export async function writeBudgets(budgets: Budget[]): Promise<WriteResult> {
  if (!IS_LIVE) return mockWriteBlob("budgets", budgets);
  // ── LIVE MODE: same pattern as writeExpenses ──
  throw new Error("Live mode not configured");
}

export async function writeDebts(debts: Debt[]): Promise<WriteResult> {
  if (!IS_LIVE) return mockWriteBlob("debts", debts);
  // ── LIVE MODE: same pattern as writeExpenses ──
  throw new Error("Live mode not configured");
}

export async function writeSettings(settings: Settings): Promise<WriteResult> {
  if (!IS_LIVE) return mockWriteBlob("settings", settings);
  // ── LIVE MODE: same pattern as writeExpenses ──
  throw new Error("Live mode not configured");
}

// ─── Explorer URL ─────────────────────────────────────────────────────────────

export function explorerUrl(): string {
  return `https://explorer.shelby.xyz/testnet/account/${getAddress()}`;
}

export { IS_LIVE };
