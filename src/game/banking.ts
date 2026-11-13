import type { PlayerState } from "./types";
import { netWorth } from "./engine";

export type BankCategory = "Wide-scale";

export interface BankDef {
  id: string;
  name: string;
  category: BankCategory;
  description: string;
  loanApr: number;
  savingsApy: number;
  creditMultiplier: number;
  minCredit: number;
  maxCredit: number;
  perkTitle: string;
  perkDescription: string;
  tierRequired: number;
}

export const PRIMARY_BANK_ID = "BNK-001";

export const BANKS: BankDef[] = [
  {
    id: PRIMARY_BANK_ID,
    name: "Meridian Bank",
    category: "Wide-scale",
    description:
      "Your unified banking headquarters for reserve savings, consolidated credit lines, and automatic business & real-estate income routing.",
    loanApr: 0.06,
    savingsApy: 0.032,
    creditMultiplier: 0.25,
    minCredit: 25_000,
    maxCredit: 100_000_000,
    perkTitle: "Unified Treasury & Credit",
    perkDescription:
      "3.2% APY reserve compounding, 6.0% APR credit lines up to 25% of Net Worth, and direct Business & Property income routing.",
    tierRequired: 1,
  },
];

export const PRIMARY_BANK: BankDef = BANKS[0]!;

export const BANK_BY_ID: Record<string, BankDef> = Object.fromEntries(BANKS.map((b) => [b.id, b]));

/**
 * Calculates total available credit line at the unified bank based on Net Worth.
 */
export function calculateBankCreditLimit(bank: BankDef, state: PlayerState, now: number): number {
  const totalNw = netWorth(state, now).total;
  const assetBased = totalNw * bank.creditMultiplier;
  return Math.min(bank.maxCredit, Math.max(bank.minCredit, Math.floor(assetBased)));
}

/** Returns current active debt in a specific bank account. */
export function getActiveDebt(acc?: PlayerState["bankAccounts"][string]): number {
  if (!acc || !acc.loans) return 0;
  return acc.loans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (l.remaining || 0), 0);
}

/** Consolidated outstanding exposure across every bank account. */
export function getTotalActiveDebt(state: PlayerState, now = state.lastTick): number {
  const elapsedDays = Math.max(0, now - state.lastTick) / 86400000;
  return Object.values(state.bankAccounts || {}).reduce((sum, account) => {
    const debt = (account.loans || [])
      .filter((loan) => loan.status === "active")
      .reduce(
        (loanSum, loan) => loanSum + loan.remaining * Math.pow(1 + loan.interestRate, elapsedDays),
        0,
      );
    return sum + debt;
  }, 0);
}

/** Remaining borrowing capacity after active debt. */
export function getAvailableBankCredit(bank: BankDef, state: PlayerState, now: number): number {
  return Math.max(0, calculateBankCreditLimit(bank, state, now) - getTotalActiveDebt(state, now));
}

export const MAX_ACTIVE_BANK_ACCOUNTS = 1;

export function supportsBusinessIncome(_bank?: BankDef): boolean {
  return true;
}

export function supportsPropertyIncome(_bank?: BankDef): boolean {
  return true;
}
