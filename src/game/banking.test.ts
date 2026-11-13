import { describe, it, expect } from "vitest";
import { apply, newPlayer, tick, netWorth, checkAchievements, type Ctx } from "./engine";
import {
  BANKS,
  BANK_BY_ID,
  MAX_ACTIVE_BANK_ACCOUNTS,
  PRIMARY_BANK,
  PRIMARY_BANK_ID,
  calculateBankCreditLimit,
  getActiveDebt,
} from "./banking";
import { EMPTY_MODS } from "./config";
import { ACHIEVEMENTS } from "./achievements";

describe("Banking Feature Logic", () => {
  const baseTime = 1700000000000;

  const createCtx = (s = newPlayer(baseTime), now = baseTime): Ctx => ({
    s,
    now,
    ledger: [],
    stock: [],
    corpMods: EMPTY_MODS,
  });

  it("configures a single unified bank (Meridian Bank BNK-001)", () => {
    expect(BANKS.length).toBe(1);
    expect(MAX_ACTIVE_BANK_ACCOUNTS).toBe(1);
    expect(PRIMARY_BANK.id).toBe(PRIMARY_BANK_ID);
    expect(PRIMARY_BANK.name).toBe("Meridian Bank");
    expect(PRIMARY_BANK.loanApr).toBeGreaterThan(0);
    expect(PRIMARY_BANK.savingsApy).toBeGreaterThan(0);
    expect(BANK_BY_ID[PRIMARY_BANK_ID]).toBe(PRIMARY_BANK);
  });

  it("registers the unified bank account and rejects duplicate or unknown registration", () => {
    const s = newPlayer(baseTime);
    const c = createCtx(s);
    apply(c, { type: "registerBank", bankId: PRIMARY_BANK_ID });

    expect(s.bankAccounts[PRIMARY_BANK_ID]).toBeDefined();
    expect(s.bankAccounts[PRIMARY_BANK_ID].balance).toBe(0);
    expect(s.bankAccounts[PRIMARY_BANK_ID].loans).toEqual([]);

    expect(() => {
      apply(c, { type: "registerBank", bankId: PRIMARY_BANK_ID });
    }).toThrow("Bank account is already open");

    expect(() => {
      apply(c, { type: "registerBank", bankId: "BNK-999" });
    }).toThrow("Unknown banking institution");
  });

  it("enforces credit cap across cumulative loans", () => {
    const s = newPlayer(baseTime);
    const c = createCtx(s);
    apply(c, { type: "registerBank", bankId: PRIMARY_BANK_ID });
    const limit = calculateBankCreditLimit(PRIMARY_BANK, s, baseTime);

    apply(c, { type: "applyLoan", bankId: PRIMARY_BANK_ID, amount: limit, category: "business" });
    expect(s.bankAccounts[PRIMARY_BANK_ID].loans[0].category).toBe("business");
    expect(() => apply(c, { type: "applyLoan", bankId: PRIMARY_BANK_ID, amount: 1 })).toThrow(
      "Loan amount exceeds available credit line",
    );
  });

  it("routes collected business and property income into the linked bank account", () => {
    const s = newPlayer(baseTime, "IncomeTycoon");
    for (const a of ACHIEVEMENTS) s.achievements[a.id] = { at: baseTime };
    const c = createCtx(s);
    apply(c, { type: "registerBank", bankId: PRIMARY_BANK_ID });
    s.companies.company_1 = {
      inst: "company_1",
      defId: "lemon",
      boughtAt: baseTime,
      price: 100_000,
      staff: {},
      capLevel: 0,
      branches: 0,
      upgrades: {},
      upgradeValue: 0,
      reserves: 0,
      liabilities: 0,
      uncollected: 5_000,
      suspended: false,
      autoSuspended: false,
      revenueTotal: 5_000,
      expenseTotal: 0,
      history: [],
    };
    s.properties.property_1 = {
      inst: "property_1",
      defId: "p_studio",
      boughtAt: baseTime,
      price: 100_000,
      condition: 100,
      upgrades: {},
      upgradeValue: 0,
      rentTotal: 3_000,
      uncollected: 3_000,
    };

    s.cash = 0;
    apply(c, { type: "linkBusinessIncome", inst: "company_1", bankId: PRIMARY_BANK_ID });
    apply(c, { type: "linkPropertyIncome", inst: "property_1", bankId: PRIMARY_BANK_ID });
    apply(c, { type: "collect" });
    apply(c, { type: "collectRent" });

    expect(s.bankAccounts[PRIMARY_BANK_ID].balance).toBe(8_000);
    expect(s.cash).toBe(0);
    expect(s.companies.company_1.incomeBankId).toBe(PRIMARY_BANK_ID);
    expect(s.properties.property_1.incomeBankId).toBe(PRIMARY_BANK_ID);
  });

  it("deposits newly generated property income directly into its linked bank", () => {
    const s = newPlayer(baseTime);
    for (const a of ACHIEVEMENTS) s.achievements[a.id] = { at: baseTime };
    const c = createCtx(s);
    apply(c, { type: "registerBank", bankId: PRIMARY_BANK_ID });
    s.companies.company_1 = {
      inst: "company_1",
      defId: "lemon",
      boughtAt: baseTime,
      price: 1_000,
      staff: { Vendor: 2 },
      capLevel: 0,
      branches: 0,
      upgrades: {},
      upgradeValue: 0,
      reserves: 100,
      liabilities: 0,
      uncollected: 0,
      incomeBankId: PRIMARY_BANK_ID,
      suspended: false,
      autoSuspended: false,
      revenueTotal: 0,
      expenseTotal: 0,
      history: [],
    };
    s.properties.property_1 = {
      inst: "property_1",
      defId: "p_studio",
      boughtAt: baseTime,
      price: 40_000,
      condition: 100,
      upgrades: {},
      upgradeValue: 0,
      rentTotal: 0,
      uncollected: 0,
      incomeBankId: PRIMARY_BANK_ID,
    };

    s.cash = 0;
    tick(createCtx(s, baseTime + 3_600_000));

    expect(s.bankAccounts[PRIMARY_BANK_ID].balance).toBeGreaterThan(0);
    expect(s.companies.company_1.uncollected).toBe(0);
    expect(s.properties.property_1.uncollected).toBe(0);
    expect(s.stats.rentEarned).toBeGreaterThan(0);
    expect(s.cash).toBe(0);
  });

  it("produces equivalent savings and loan interest after one long tick or many short ticks", () => {
    const initial = newPlayer(baseTime);
    initial.cash = 150_000;
    const initialCtx = createCtx(initial);
    apply(initialCtx, { type: "registerBank", bankId: PRIMARY_BANK_ID });
    apply(initialCtx, { type: "deposit", bankId: PRIMARY_BANK_ID, amount: 100_000 });
    apply(initialCtx, { type: "applyLoan", bankId: PRIMARY_BANK_ID, amount: 20_000 });

    const oneTick = structuredClone(initial);
    const manyTicks = structuredClone(initial);
    const day = 86_400_000;
    tick(createCtx(oneTick, baseTime + day));
    for (let hour = 1; hour <= 24; hour++) {
      tick(createCtx(manyTicks, baseTime + hour * 3_600_000));
    }

    expect(manyTicks.bankAccounts[PRIMARY_BANK_ID].balance).toBeCloseTo(
      oneTick.bankAccounts[PRIMARY_BANK_ID].balance,
      6,
    );
    expect(manyTicks.bankAccounts[PRIMARY_BANK_ID].loans[0].remaining).toBeCloseTo(
      oneTick.bankAccounts[PRIMARY_BANK_ID].loans[0].remaining,
      6,
    );
  });

  it("handles cash deposits and withdrawals with balance checks and transaction records", () => {
    const s = newPlayer(baseTime);
    s.cash = 50_000;
    const c = createCtx(s);
    checkAchievements(c);
    apply(c, { type: "registerBank", bankId: PRIMARY_BANK_ID });

    const cashBeforeDeposit = s.cash;
    apply(c, { type: "deposit", bankId: PRIMARY_BANK_ID, amount: 20_000 });
    expect(s.cash).toBe(cashBeforeDeposit - 20_000);
    expect(s.bankAccounts[PRIMARY_BANK_ID].balance).toBe(20_000);
    expect(s.bankAccounts[PRIMARY_BANK_ID].transactions.length).toBe(1);
    expect(s.bankAccounts[PRIMARY_BANK_ID].transactions[0].type).toBe("deposit");
    expect(s.bankAccounts[PRIMARY_BANK_ID].transactions[0].amount).toBe(20_000);

    expect(() => {
      apply(c, { type: "deposit", bankId: PRIMARY_BANK_ID, amount: 999_999 });
    }).toThrow("Insufficient cash");

    const cashBeforeWithdraw = s.cash;
    apply(c, { type: "withdraw", bankId: PRIMARY_BANK_ID, amount: 5_000 });
    expect(s.cash).toBe(cashBeforeWithdraw + 5_000);
    expect(s.bankAccounts[PRIMARY_BANK_ID].balance).toBe(15_000);
    expect(s.bankAccounts[PRIMARY_BANK_ID].transactions.length).toBe(2);
    expect(s.bankAccounts[PRIMARY_BANK_ID].transactions[1].type).toBe("withdrawal");

    expect(() => {
      apply(c, { type: "withdraw", bankId: PRIMARY_BANK_ID, amount: 20_000 });
    }).toThrow("Insufficient funds");
  });

  it("calculates credit limits accurately based on player net worth", () => {
    const s = newPlayer(baseTime);
    s.cash = 100_000;
    const limit = calculateBankCreditLimit(PRIMARY_BANK, s, baseTime);
    expect(limit).toBeGreaterThanOrEqual(PRIMARY_BANK.minCredit);
  });

  it("handles loan application, credit checking, and repayments", () => {
    const s = newPlayer(baseTime);
    s.cash = 5_000;
    const c = createCtx(s);
    checkAchievements(c);
    apply(c, { type: "registerBank", bankId: PRIMARY_BANK_ID });

    const maxCredit = calculateBankCreditLimit(PRIMARY_BANK, s, baseTime);

    expect(() => {
      apply(c, { type: "applyLoan", bankId: PRIMARY_BANK_ID, amount: maxCredit + 50_000 });
    }).toThrow("Loan amount exceeds available credit line");

    const cashBeforeBorrow = s.cash;
    apply(c, { type: "applyLoan", bankId: PRIMARY_BANK_ID, amount: 15_000 });
    expect(s.cash).toBe(cashBeforeBorrow + 15_000);
    const acc = s.bankAccounts[PRIMARY_BANK_ID];
    expect(acc.loans.length).toBe(1);
    const loan = acc.loans[0];
    expect(loan.principal).toBe(15_000);
    expect(loan.category).toBe("personal");
    expect(loan.remaining).toBe(15_000);
    expect(loan.status).toBe("active");
    expect(getActiveDebt(acc)).toBe(15_000);

    const cashBeforeRepay = s.cash;
    apply(c, {
      type: "repayLoan",
      bankId: PRIMARY_BANK_ID,
      loanId: loan.id,
      amount: 5_000,
    });
    expect(s.cash).toBe(cashBeforeRepay - 5_000);
    expect(loan.remaining).toBe(10_000);
    expect(loan.status).toBe("active");

    const cashBeforeFullRepay = s.cash;
    apply(c, {
      type: "repayLoan",
      bankId: PRIMARY_BANK_ID,
      loanId: loan.id,
      amount: 20_000,
    });
    expect(s.cash).toBe(cashBeforeFullRepay - 10_000);
    expect(loan.remaining).toBe(0);
    expect(loan.status).toBe("repaid");
    expect(getActiveDebt(acc)).toBe(0);
  });

  it("accumulates real-time loan interest and deposit savings yield over elapsed time", () => {
    const s = newPlayer(baseTime);
    s.cash = 150_000;
    const c = createCtx(s);
    checkAchievements(c);
    apply(c, { type: "registerBank", bankId: PRIMARY_BANK_ID });

    apply(c, { type: "deposit", bankId: PRIMARY_BANK_ID, amount: 100_000 });
    apply(c, { type: "applyLoan", bankId: PRIMARY_BANK_ID, amount: 20_000 });

    const acc = s.bankAccounts[PRIMARY_BANK_ID];
    const initialBalance = acc.balance;
    const loan = acc.loans[0];
    const initialDebt = loan.remaining;

    const nextDay = baseTime + 86_400_000;
    tick(createCtx(s, nextDay));

    expect(acc.balance).toBeGreaterThan(initialBalance);
    expect(loan.remaining).toBeGreaterThan(initialDebt);
    expect(loan.accruedInterest).toBeGreaterThan(0);
    expect(loan.principalRemaining).toBe(20_000);
  });

  it("applies repayments to accrued interest before principal", () => {
    const s = newPlayer(baseTime);
    s.cash = 10_000;
    const c = createCtx(s);
    apply(c, { type: "registerBank", bankId: PRIMARY_BANK_ID });
    apply(c, { type: "applyLoan", bankId: PRIMARY_BANK_ID, amount: 15_000 });
    const loan = s.bankAccounts[PRIMARY_BANK_ID].loans[0];

    c.now = baseTime + 86_400_000;
    tick(c);
    const accruedBefore = loan.accruedInterest ?? 0;
    const principalBefore = loan.principalRemaining ?? 0;
    expect(accruedBefore).toBeGreaterThan(0);

    apply(c, { type: "repayLoan", bankId: PRIMARY_BANK_ID, loanId: loan.id, amount: 5_000 });
    expect(loan.accruedInterest).toBeCloseTo(0, 6);
    expect(loan.principalRemaining).toBeCloseTo(principalBefore - (5_000 - accruedBefore), 6);
  });

  it("settles tax liability and resets period income breakdown", () => {
    const s = newPlayer(baseTime);
    s.cash = 50_000;
    const c = createCtx(s);
    checkAchievements(c);

    s.tax.liability = 12_500;
    s.tax.periodIncome.business = 50_000;
    s.tax.periodIncome.rental = 25_000;

    const cashBefore = s.cash;
    const taxDue = s.tax.liability;
    apply(c, { type: "settleTax" });
    expect(s.cash).toBe(cashBefore - taxDue);
    expect(s.tax.liability).toBe(0);
    expect(s.tax.periodIncome.business).toBe(0);
    expect(s.tax.periodIncome.rental).toBe(0);

    expect(() => {
      apply(c, { type: "settleTax" });
    }).toThrow("No tax liability to settle");
  });

  it("reflects bank balances as liquid assets and loans as liabilities in net worth", () => {
    const s = newPlayer(baseTime);
    s.cash = 10_000;
    const c = createCtx(s);
    checkAchievements(c);
    s.tax.liability = 0;
    apply(c, { type: "registerBank", bankId: PRIMARY_BANK_ID });

    const nw1 = netWorth(s, baseTime).total;

    apply(c, { type: "deposit", bankId: PRIMARY_BANK_ID, amount: 10_000 });
    const nw2 = netWorth(s, baseTime).total;
    expect(nw2).toBeCloseTo(nw1, 1);

    const nwBeforeLoan = netWorth(s, baseTime).total;
    apply(c, { type: "applyLoan", bankId: PRIMARY_BANK_ID, amount: 10_000 });
    const nw3 = netWorth(s, baseTime);
    expect(nw3.liabilities).toBe(10_000);
    expect(nw3.total).toBeCloseTo(nwBeforeLoan, 1);
  });
});
