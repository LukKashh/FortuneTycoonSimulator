import { useState } from "react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import {
  PRIMARY_BANK,
  PRIMARY_BANK_ID,
  calculateBankCreditLimit,
  getAvailableBankCredit,
  getTotalActiveDebt,
} from "@/game/banking";
import { COMPANY_BY_ID, PROPERTY_BY_ID } from "@/game/config";
import { date, money, pct } from "@/lib/format";
import { Card, Empty, Loading, Pill, Progress, Row } from "@/components/game/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CreditCard,
  History,
  Home,
  Landmark,
  Percent,
  ShieldCheck,
  Wallet,
} from "lucide-react";

type LoanCategory = "personal" | "business" | "real-estate";

export function BankingView() {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, 5000);
  const { run, pending } = useAct();

  const [txAmount, setTxAmount] = useState("");
  const [loanCategory, setLoanCategory] = useState<LoanCategory>("personal");
  const [loanAmount, setLoanAmount] = useState("");
  const [repayInputs, setRepayInputs] = useState<Record<string, string>>({});

  if (!data) return <Loading />;
  const s = data.state;
  const accounts = s.bankAccounts || {};
  const acc = accounts[PRIMARY_BANK_ID];

  const creditLimit = calculateBankCreditLimit(PRIMARY_BANK, s, now);
  const totalDebt = getTotalActiveDebt(s, now);
  const availableCredit = getAvailableBankCredit(PRIMARY_BANK, s, now);

  // Simple Account Creation Screen
  if (!acc) {
    return (
      <div className="mx-auto max-w-lg py-4">
        <Card className="space-y-4 border-primary/35 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-primary/15 text-primary">
              <Landmark className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-foreground">{PRIMARY_BANK.name}</h2>
                <Pill tone="primary">Unified Banking</Pill>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{PRIMARY_BANK.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/70 bg-background/60 p-2.5 text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Reserve APY
              </div>
              <div className="num mt-0.5 text-sm font-bold text-gain">
                {pct(PRIMARY_BANK.savingsApy, 1)}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 p-2.5 text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Loan APR
              </div>
              <div className="num mt-0.5 text-sm font-bold text-foreground">
                {pct(PRIMARY_BANK.loanApr, 1)}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 p-2.5 text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Credit Line
              </div>
              <div className="num mt-0.5 text-sm font-bold text-primary">{money(creditLimit)}</div>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {PRIMARY_BANK.perkTitle}
            </div>
            <p className="mt-1">{PRIMARY_BANK.perkDescription}</p>
          </div>

          <Button
            className="h-10 w-full bg-gradient-primary text-xs font-semibold"
            disabled={pending}
            onClick={() =>
              run({ type: "registerBank", bankId: PRIMARY_BANK_ID }, "Bank account opened")
            }
          >
            Open Bank Account
          </Button>
        </Card>
      </div>
    );
  }

  const parsedTx = Math.max(0, Math.floor(Number(txAmount) || 0));
  const parsedLoan = Math.max(0, Math.floor(Number(loanAmount) || 0));
  const activeLoans = (acc.loans || []).filter((l) => l.status === "active");
  const transactions = [...(acc.transactions || [])].sort((a, b) => b.at - a.at).slice(0, 30);
  const ownedCompanies = Object.values(s.companies || {});
  const ownedProperties = Object.values(s.properties || {});
  const creditUsage = creditLimit > 0 ? Math.min(1, totalDebt / creditLimit) : 0;

  return (
    <div className="space-y-3 pb-3">
      {/* Unified Overview KPI Header */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="p-2.5">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Wallet className="h-3 w-3 text-primary" />
            On-Hand Cash
          </div>
          <div className="num mt-0.5 text-sm font-bold text-foreground">{money(s.cash)}</div>
        </Card>
        <Card className="p-2.5">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Landmark className="h-3 w-3 text-gain" />
            Bank Reserves
          </div>
          <div className="num mt-0.5 text-sm font-bold text-gain">{money(acc.balance)}</div>
        </Card>
        <Card className="p-2.5">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <CreditCard className="h-3 w-3 text-primary" />
            Available Credit
          </div>
          <div className="num mt-0.5 text-sm font-bold text-primary">{money(availableCredit)}</div>
        </Card>
        <Card className="p-2.5">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Percent className="h-3 w-3 text-loss" />
            Active Debt
          </div>
          <div className={`num mt-0.5 text-sm font-bold ${totalDebt > 0 ? "text-loss" : ""}`}>
            {money(totalDebt)}
          </div>
        </Card>
      </div>

      {/* Deposit & Withdraw Desk */}
      <Card className="space-y-2.5 p-3">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
          <div className="text-xs font-bold uppercase tracking-wider text-foreground">
            {PRIMARY_BANK.name} · Deposits &amp; Withdrawals
          </div>
          <span className="num text-[11px] text-gain">{pct(PRIMARY_BANK.savingsApy, 1)} APY</span>
        </div>

        <Input
          inputMode="numeric"
          placeholder="Enter transfer amount"
          value={txAmount}
          onChange={(e) => setTxAmount(e.target.value.replace(/\D/g, ""))}
          className="h-9 text-xs num"
        />

        <div className="flex flex-wrap gap-1.5">
          {[1_000, 10_000, 50_000, 250_000].map((v) => (
            <Button
              key={v}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] num"
              onClick={() => setTxAmount(String((Number(txAmount) || 0) + v))}
            >
              +{money(v)}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px]"
            disabled={s.cash < 1}
            onClick={() => setTxAmount(String(Math.floor(s.cash)))}
          >
            Max Cash
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px]"
            disabled={acc.balance < 1}
            onClick={() => setTxAmount(String(Math.floor(acc.balance)))}
          >
            All Reserves
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-gradient-primary text-xs font-semibold"
            disabled={pending || parsedTx <= 0 || parsedTx > s.cash}
            onClick={() =>
              run({ type: "deposit", bankId: PRIMARY_BANK_ID, amount: parsedTx }, "Deposited").then(
                () => setTxAmount(""),
              )
            }
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            Deposit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 text-xs font-semibold"
            disabled={pending || parsedTx <= 0 || parsedTx > acc.balance}
            onClick={() =>
              run(
                { type: "withdraw", bankId: PRIMARY_BANK_ID, amount: parsedTx },
                "Withdrawn",
              ).then(() => setTxAmount(""))
            }
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Withdraw
          </Button>
        </div>
      </Card>

      {/* Credit & Loans Desk */}
      <Card className="space-y-2.5 p-3">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
          <div className="text-xs font-bold uppercase tracking-wider text-foreground">
            Credit &amp; Loans
          </div>
          <span className="num text-[11px] text-muted-foreground">
            {pct(PRIMARY_BANK.loanApr, 1)} APR · Cap {money(creditLimit)}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Credit Utilization</span>
            <span className="num font-medium text-foreground">
              {money(totalDebt)} / {money(creditLimit)}
            </span>
          </div>
          <Progress value={creditUsage} className="h-1.5" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select value={loanCategory} onValueChange={(v) => setLoanCategory(v as LoanCategory)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal" className="text-xs">
                Personal Loan
              </SelectItem>
              <SelectItem value="business" className="text-xs">
                Business Credit
              </SelectItem>
              <SelectItem value="real-estate" className="text-xs">
                Real Estate Loan
              </SelectItem>
            </SelectContent>
          </Select>

          <Input
            inputMode="numeric"
            placeholder="Loan amount"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value.replace(/\D/g, ""))}
            className="h-9 text-xs num sm:col-span-2"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex gap-1.5">
            {[0.25, 0.5, 1].map((ratio) => (
              <Button
                key={ratio}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
                disabled={availableCredit < 1}
                onClick={() => setLoanAmount(String(Math.floor(availableCredit * ratio)))}
              >
                {Math.round(ratio * 100)}%
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            className="h-8 bg-gradient-primary px-4 text-xs font-semibold"
            disabled={pending || parsedLoan <= 0 || parsedLoan > availableCredit}
            onClick={() =>
              run(
                {
                  type: "applyLoan",
                  bankId: PRIMARY_BANK_ID,
                  amount: parsedLoan,
                  category: loanCategory,
                },
                "Loan disbursed",
              ).then(() => setLoanAmount(""))
            }
          >
            Draw Credit
          </Button>
        </div>

        {activeLoans.length > 0 && (
          <div className="space-y-2 border-t border-border/60 pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Active Loans ({activeLoans.length})
            </div>
            {activeLoans.map((l) => {
              const val = Math.max(0, Math.floor(Number(repayInputs[l.id] || "") || 0));
              const fullAmt = Math.ceil(l.remaining);
              return (
                <div
                  key={l.id}
                  className="space-y-2 rounded-lg border border-border/70 bg-background/50 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold capitalize">{l.category ?? "personal"} loan</div>
                    <div className="num font-bold text-loss">{money(l.remaining)} due</div>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Principal {money(l.principal)}</span>
                    <span className="num">Accrued {money(l.accruedInterest ?? 0)}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      inputMode="numeric"
                      placeholder="Repay amount"
                      value={repayInputs[l.id] ?? ""}
                      onChange={(e) =>
                        setRepayInputs((prev) => ({
                          ...prev,
                          [l.id]: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="h-8 flex-1 text-xs num"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs whitespace-nowrap"
                      disabled={pending || val <= 0 || s.cash <= 0}
                      onClick={() =>
                        run(
                          {
                            type: "repayLoan",
                            bankId: PRIMARY_BANK_ID,
                            loanId: l.id,
                            amount: Math.min(val, s.cash),
                          },
                          "Payment applied",
                        ).then(() => setRepayInputs((prev) => ({ ...prev, [l.id]: "" })))
                      }
                    >
                      Repay
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs whitespace-nowrap"
                      disabled={pending || s.cash < fullAmt}
                      onClick={() =>
                        run(
                          {
                            type: "repayLoan",
                            bankId: PRIMARY_BANK_ID,
                            loanId: l.id,
                            amount: fullAmt,
                          },
                          "Loan repaid in full",
                        )
                      }
                    >
                      Pay Full
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Income Auto-Deposit Links */}
      <Card className="space-y-2 p-3">
        <div className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border/60 pb-2">
          Direct Income Routing
        </div>
        {ownedCompanies.length === 0 && ownedProperties.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Acquire a Business or Real Estate property to automatically deposit earnings into{" "}
            {PRIMARY_BANK.name}.
          </p>
        ) : (
          <div className="space-y-2">
            {ownedCompanies.map((c) => {
              const def = COMPANY_BY_ID[c.defId];
              const linked = c.incomeBankId === PRIMARY_BANK_ID;
              return (
                <div
                  key={c.inst}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate font-medium">{def?.name ?? c.defId}</span>
                  </div>
                  <Switch
                    checked={linked}
                    disabled={pending}
                    onCheckedChange={(on) =>
                      run(
                        {
                          type: "linkBusinessIncome",
                          inst: c.inst,
                          bankId: on ? PRIMARY_BANK_ID : null,
                        },
                        on ? "Income linked to bank" : "Switched to wallet cash",
                      )
                    }
                  />
                </div>
              );
            })}
            {ownedProperties.map((p) => {
              const def = PROPERTY_BY_ID[p.defId];
              const linked = p.incomeBankId === PRIMARY_BANK_ID;
              return (
                <div
                  key={p.inst}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Home className="h-3.5 w-3.5 shrink-0 text-gain" />
                    <span className="truncate font-medium">{def?.name ?? p.defId}</span>
                  </div>
                  <Switch
                    checked={linked}
                    disabled={pending}
                    onCheckedChange={(on) =>
                      run(
                        {
                          type: "linkPropertyIncome",
                          inst: p.inst,
                          bankId: on ? PRIMARY_BANK_ID : null,
                        },
                        on ? "Rent linked to bank" : "Switched to wallet cash",
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Activity Log */}
      <Card className="space-y-2 p-3">
        <div className="flex items-center gap-1.5 border-b border-border/60 pb-2 text-xs font-bold uppercase tracking-wider text-foreground">
          <History className="h-3.5 w-3.5 text-primary" />
          Account Activity Log
        </div>
        {transactions.length === 0 ? (
          <Empty
            title="No banking activity yet"
            text="Deposits, loans, and repayments appear here."
          />
        ) : (
          <div className="divide-y divide-border/50">
            {transactions.map((t) => {
              const inflow =
                t.type === "deposit" ||
                t.type === "business_income" ||
                t.type === "property_income" ||
                t.type === "loan";
              return (
                <Row
                  key={t.id}
                  label={
                    <span>
                      <span className="capitalize font-medium text-foreground">
                        {t.type.replace("_", " ")}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">{date(t.at)}</span>
                    </span>
                  }
                  value={money(t.amount, { sign: inflow })}
                  tone={inflow ? "gain" : "loss"}
                />
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
