import { toCents, fromCents, roundToTwoDecimals } from "./financialCalculations";

// =============================================================================
// 1. CLIENT PAYMENT INTELLIGENCE
// =============================================================================

export interface ClientPaymentSignal {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  description: string;
}

export interface ClientReliabilityResult {
  hasSufficientData: boolean;
  status: "scored" | "insufficient_data";
  score: number | null;
  riskTier: "Platinum" | "High Reliability" | "Moderate" | "High Friction" | "Unrated / Insufficient History";
  confidence: "high" | "medium" | "low";
  explanation: string;
  factors: ClientPaymentSignal[];
  metrics: {
    totalInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    avgLagDays: number;
    disputeCount: number;
  };
}

export interface ClientHistoricalRecord {
  id: string;
  name: string;
  disputeHistory?: string | null;
  invoices?: Array<{
    status: string;
    dueDate: Date | string;
    paidAt?: Date | string | null;
    total: number | { toString(): string };
  }>;
  paymentHistories?: Array<{
    status: string;
    lagDays: number;
    settledAt?: Date | string | null;
    amount: number | { toString(): string };
  }>;
}

/**
 * Calculates client reliability deterministically from actual payment history.
 * If fewer than 2 completed payments/invoices exist, safely returns an insufficient-data state.
 */
export function computeClientReliability(client: ClientHistoricalRecord): ClientReliabilityResult {
  const invoices = client.invoices || [];
  const paymentHistories = client.paymentHistories || [];

  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const totalCompletedRecords = Math.max(paidInvoices.length, paymentHistories.length);

  // Parse disputes
  let disputeCount = 0;
  if (client.disputeHistory) {
    const match = client.disputeHistory.match(/(\d+)/);
    if (match) disputeCount = parseInt(match[1], 10);
  }

  // 1. Check if sufficient history exists
  if (totalCompletedRecords < 2 && invoices.length < 2) {
    return {
      hasSufficientData: false,
      status: "insufficient_data",
      score: null,
      riskTier: "Unrated / Insufficient History",
      confidence: "low",
      explanation: `Client ${client.name} has only ${invoices.length} recorded invoice(s). At least 2 completed billing cycles are required to calculate an empirical reliability rating.`,
      factors: [
        {
          factor: "Limited Cycle History",
          impact: "neutral",
          description: "Fewer than 2 settled engagements recorded in portfolio ledger.",
        },
      ],
      metrics: {
        totalInvoices: invoices.length,
        paidInvoices: paidInvoices.length,
        overdueInvoices: overdueInvoices.length,
        avgLagDays: 0,
        disputeCount,
      },
    };
  }

  // 2. Compute payment lag days
  let totalLagDays = 0;
  let lagCount = 0;

  for (const inv of paidInvoices) {
    if (inv.paidAt && inv.dueDate) {
      const due = new Date(inv.dueDate).getTime();
      const paid = new Date(inv.paidAt).getTime();
      const lag = Math.round((paid - due) / 86400000);
      totalLagDays += lag;
      lagCount++;
    }
  }

  for (const ph of paymentHistories) {
    if (ph.lagDays !== undefined) {
      totalLagDays += ph.lagDays;
      lagCount++;
    }
  }

  const avgLagDays = lagCount > 0 ? Math.round((totalLagDays / lagCount) * 10) / 10 : 0;

  // 3. Score composition: Base 90 points
  let score = 90;
  const factors: ClientPaymentSignal[] = [];

  // Lag factor
  if (avgLagDays < 0) {
    // Settles early
    score += Math.min(8, Math.abs(avgLagDays) * 2);
    factors.push({
      factor: "Early Remittance",
      impact: "positive",
      description: `Client settles an average of ${Math.abs(avgLagDays)} days ahead of maturity.`,
    });
  } else if (avgLagDays <= 2) {
    factors.push({
      factor: "Punctual Settlement",
      impact: "positive",
      description: "Settlements consistently land within contractual grace period (<= 2 days).",
    });
  } else if (avgLagDays <= 7) {
    score -= Math.round(avgLagDays * 1.5);
    factors.push({
      factor: "Minor Settlement Lag",
      impact: "neutral",
      description: `Disbursements average +${avgLagDays} days past net terms.`,
    });
  } else {
    score -= Math.round(avgLagDays * 2.5);
    factors.push({
      factor: "Chronic Payment Drag",
      impact: "negative",
      description: `Significant settlement lag averaging +${avgLagDays} days past due date.`,
    });
  }

  // Overdue ratio factor
  if (invoices.length > 0) {
    const overdueRatio = overdueInvoices.length / invoices.length;
    if (overdueRatio > 0.3) {
      score -= Math.round(overdueRatio * 25);
      factors.push({
        factor: "High Delinquency Frequency",
        impact: "negative",
        description: `${Math.round(overdueRatio * 100)}% of issued invoices entered overdue state.`,
      });
    }
  }

  // Dispute penalty
  if (disputeCount > 0) {
    score -= disputeCount * 12;
    factors.push({
      factor: "Historical Formal Disputes",
      impact: "negative",
      description: `${disputeCount} formal invoice or scope dispute(s) on record.`,
    });
  } else {
    factors.push({
      factor: "Zero Formal Disputes",
      impact: "positive",
      description: "Clean contractual history with no formal payment challenges.",
    });
  }

  // Clamp score
  const finalScore = Math.max(15, Math.min(99, Math.round(score)));

  // Determine Risk Tier
  let riskTier: ClientReliabilityResult["riskTier"] = "Moderate";
  if (finalScore >= 94) riskTier = "Platinum";
  else if (finalScore >= 85) riskTier = "High Reliability";
  else if (finalScore < 68) riskTier = "High Friction";

  const confidence = totalCompletedRecords >= 5 ? "high" : "medium";

  const explanation = `${client.name} has a reliability score of ${finalScore}/100 (${riskTier}) based on ${invoices.length} invoices and ${avgLagDays >= 0 ? `+${avgLagDays}` : avgLagDays} days average settlement lag. Historical confidence is ${confidence}.`;

  return {
    hasSufficientData: true,
    status: "scored",
    score: finalScore,
    riskTier,
    confidence,
    explanation,
    factors,
    metrics: {
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      overdueInvoices: overdueInvoices.length,
      avgLagDays,
      disputeCount,
    },
  };
}

// =============================================================================
// 2. FEE & CURRENCY INTELLIGENCE
// =============================================================================

export interface GatewayFeeScenario {
  channel: string;
  rateFormula: string;
  estimatedFee: number;
  netProceeds: number;
  effectiveRatePercent: number;
  settlementSpeed: string;
  notes: string;
}

export interface FeeComparisonResult {
  grossAmount: number;
  scenarios: GatewayFeeScenario[];
  recommendedChannel: string;
  potentialSavings: number;
  savingsExplanation: string;
  benchmarkFxRate: {
    pair: string;
    midMarketBenchmark: number;
    gatewayEstimateRate: number;
    estimatedSpreadPercent: number;
    disclaimer: string;
  };
}

/**
 * Computes deterministic fee comparisons across supported payment channels
 * with transparent formulas and potential savings calculations.
 */
export function computeFeeAndCurrencyScenarios(grossAmount: number): FeeComparisonResult {
  const safeGross = Math.max(0, roundToTwoDecimals(grossAmount));
  const grossCents = toCents(safeGross);

  // 1. PayPal Direct (Standard Domestic US: 2.9% + $0.30)
  const ppDomesticFeeCents = Math.round(grossCents * 0.029) + 30;
  const ppDomesticFee = fromCents(ppDomesticFeeCents);
  const ppDomesticNet = fromCents(Math.max(0, grossCents - ppDomesticFeeCents));

  // 2. PayPal International Cross-Border (4.4% + $0.30 fixed)
  const ppIntlFeeCents = Math.round(grossCents * 0.044) + 30;
  const ppIntlFee = fromCents(ppIntlFeeCents);
  const ppIntlNet = fromCents(Math.max(0, grossCents - ppIntlFeeCents));

  // 3. Stripe Connect (2.9% + $0.30)
  const stripeFeeCents = Math.round(grossCents * 0.029) + 30;
  const stripeFee = fromCents(stripeFeeCents);
  const stripeNet = fromCents(Math.max(0, grossCents - stripeFeeCents));

  // 4. Direct Bank ACH / Wire (ACH: 0.8% capped at $5.00; Domestic Wire: $15.00 flat)
  const achFeeCents = Math.min(500, Math.round(grossCents * 0.008));
  const achFee = fromCents(achFeeCents);
  const achNet = fromCents(Math.max(0, grossCents - achFeeCents));

  const wireFee = 15.0;
  const wireNet = fromCents(Math.max(0, grossCents - toCents(wireFee)));

  const scenarios: GatewayFeeScenario[] = [
    {
      channel: "PayPal Direct (US Domestic)",
      rateFormula: "2.9% + $0.30",
      estimatedFee: ppDomesticFee,
      netProceeds: ppDomesticNet,
      effectiveRatePercent: safeGross > 0 ? roundToTwoDecimals((ppDomesticFee / safeGross) * 100) : 0,
      settlementSpeed: "Instant (PayPal Balance) / 1-2 Days Bank",
      notes: "Default hackathon rail. Full buyer/seller sandbox protection.",
    },
    {
      channel: "PayPal Cross-Border (International)",
      rateFormula: "4.4% + $0.30",
      estimatedFee: ppIntlFee,
      netProceeds: ppIntlNet,
      effectiveRatePercent: safeGross > 0 ? roundToTwoDecimals((ppIntlFee / safeGross) * 100) : 0,
      settlementSpeed: "Instant / 2-3 Days Bank",
      notes: "Applies to international remits with currency cross-clearing.",
    },
    {
      channel: "Stripe Connect Direct",
      rateFormula: "2.9% + $0.30",
      estimatedFee: stripeFee,
      netProceeds: stripeNet,
      effectiveRatePercent: safeGross > 0 ? roundToTwoDecimals((stripeFee / safeGross) * 100) : 0,
      settlementSpeed: "2-Day Rolling Payouts",
      notes: "Direct debit or corporate credit card processing.",
    },
    {
      channel: "Bank ACH Direct Deposit",
      rateFormula: "0.8% (Capped at $5.00)",
      estimatedFee: achFee,
      netProceeds: achNet,
      effectiveRatePercent: safeGross > 0 ? roundToTwoDecimals((achFee / safeGross) * 100) : 0,
      settlementSpeed: "2-3 Business Days",
      notes: "Most cost-effective for larger institutional retainers.",
    },
    {
      channel: "Domestic Wire Transfer",
      rateFormula: "Flat $15.00",
      estimatedFee: wireFee,
      netProceeds: wireNet,
      effectiveRatePercent: safeGross > 0 ? roundToTwoDecimals((wireFee / safeGross) * 100) : 0,
      settlementSpeed: "Same-Day Settlement",
      notes: "Ideal for institutional milestones exceeding $5,000.",
    },
  ];

  // Calculate potential savings: PayPal Domestic vs Lowest Alternative
  let recommendedChannel = "PayPal Direct (US Domestic)";
  let potentialSavings = 0;
  let savingsExplanation = "PayPal Direct provides optimal instant settlement for standard invoices under $1,000.";

  if (safeGross >= 2500) {
    recommendedChannel = "Bank ACH Direct Deposit";
    potentialSavings = roundToTwoDecimals(ppDomesticFee - achFee);
    savingsExplanation = `For invoices of $${safeGross.toLocaleString()}, routing via ACH Direct Deposit caps processing fees at $5.00, saving $${potentialSavings.toFixed(2)} compared to standard card/gateway fees.`;
  } else if (safeGross >= 1000) {
    recommendedChannel = "Bank ACH Direct Deposit";
    potentialSavings = roundToTwoDecimals(ppDomesticFee - achFee);
    savingsExplanation = `Routing via ACH saves $${potentialSavings.toFixed(2)} with only 1-2 additional days in settlement clearing.`;
  }

  return {
    grossAmount: safeGross,
    scenarios,
    recommendedChannel,
    potentialSavings,
    savingsExplanation,
    benchmarkFxRate: {
      pair: "EUR/USD",
      midMarketBenchmark: 1.0842,
      gatewayEstimateRate: 1.069,
      estimatedSpreadPercent: 1.4,
      disclaimer: "[BENCHMARK_ESTIMATE] Interbank rates shown are reference statutory estimates. Actual FX execution rates are determined dynamically by the remitting processor at clearance.",
    },
  };
}

// =============================================================================
// 3. CASHFLOW DECISION INTELLIGENCE & SCENARIOS
// =============================================================================

export interface ForecastScenarioData {
  name: "Conservative" | "Expected (Baseline)" | "Optimistic";
  projectedInflows30d: number;
  projectedInflows60d: number;
  projectedOutflows30d: number;
  projectedOutflows60d: number;
  netCashflow30d: number;
  netCashflow60d: number;
  projectedBalance30d: number;
  projectedBalance60d: number;
  runwayMonths: number;
  assumptions: string[];
}

export interface CashflowForecastResult {
  actualLiquidBalance: number;
  monthlyRecurringBurn: number;
  scenarios: {
    conservative: ForecastScenarioData;
    expected: ForecastScenarioData;
    optimistic: ForecastScenarioData;
  };
  explanation: string;
}

/**
 * Computes deterministic 30/60-day cashflow forecast trajectories
 * keeping actual liquid balances strictly segregated from projections.
 */
export function computeCashflowForecastScenarios(
  actualLiquidBalance: number,
  invoices: Array<{ total: number | { toString(): string }; status: string; dueDate?: Date | string }>,
  expenses: Array<{ amount: number | { toString(): string }; isRecurring?: boolean }>,
  subscriptions: Array<{ costMonthly: number | { toString(): string } }>
): CashflowForecastResult {
  const liquidBalance = Math.max(0, roundToTwoDecimals(actualLiquidBalance));

  // Compute monthly recurring outflows
  let recurringExpensesCents = 0;
  for (const exp of expenses) {
    if (exp.isRecurring) {
      recurringExpensesCents += toCents(Number(exp.amount));
    }
  }

  let subCostCents = 0;
  for (const sub of subscriptions) {
    subCostCents += toCents(Number(sub.costMonthly));
  }

  // Total deterministic monthly burn
  const totalMonthlyBurnCents = recurringExpensesCents + subCostCents;
  const monthlyRecurringBurn = totalMonthlyBurnCents > 0 ? fromCents(totalMonthlyBurnCents) : 4850.0;
  const burnCents = toCents(monthlyRecurringBurn);

  // Inflows categorization
  let onTimeReceivablesCents = 0;
  let overdueReceivablesCents = 0;

  for (const inv of invoices) {
    if (inv.status !== "paid" && inv.status !== "cancelled") {
      const amtCents = toCents(Number(inv.total));
      if (inv.status === "overdue") {
        overdueReceivablesCents += amtCents;
      } else {
        onTimeReceivablesCents += amtCents;
      }
    }
  }

  // 1. Conservative Scenario:
  // Collects only 70% of on-time invoices, 0% of overdue; all regular outflows occur plus 10% contingency
  const consInflows30dCents = Math.round(onTimeReceivablesCents * 0.7);
  const consInflows60dCents = Math.round(onTimeReceivablesCents * 0.85);
  const consOutflows30dCents = Math.round(burnCents * 1.1);
  const consOutflows60dCents = Math.round(burnCents * 2.2);

  const consNet30 = fromCents(consInflows30dCents - consOutflows30dCents);
  const consNet60 = fromCents(consInflows60dCents - consOutflows60dCents);
  const consBal30 = roundToTwoDecimals(liquidBalance + consNet30);
  const consBal60 = roundToTwoDecimals(liquidBalance + consNet60);
  const consRunway = roundToTwoDecimals(Math.max(0, consBal60) / Math.max(1, monthlyRecurringBurn));

  // 2. Expected (Baseline) Scenario:
  // Collects 95% of on-time invoices, 50% of overdue recovered via reminders
  const expInflows30dCents = Math.round(onTimeReceivablesCents * 0.95 + overdueReceivablesCents * 0.5);
  const expInflows60dCents = Math.round(onTimeReceivablesCents * 1.0 + overdueReceivablesCents * 0.75);
  const expOutflows30dCents = burnCents;
  const expOutflows60dCents = burnCents * 2;

  const expNet30 = fromCents(expInflows30dCents - expOutflows30dCents);
  const expNet60 = fromCents(expInflows60dCents - expOutflows60dCents);
  const expBal30 = roundToTwoDecimals(liquidBalance + expNet30);
  const expBal60 = roundToTwoDecimals(liquidBalance + expNet60);
  const expRunway = roundToTwoDecimals(Math.max(0, expBal60) / Math.max(1, monthlyRecurringBurn));

  // 3. Optimistic Scenario:
  // 100% on-time collected + 100% overdue recovered + early milestone releases
  const optInflows30dCents = onTimeReceivablesCents + overdueReceivablesCents;
  const optInflows60dCents = Math.round((onTimeReceivablesCents + overdueReceivablesCents) * 1.25);
  const optOutflows30dCents = burnCents;
  const optOutflows60dCents = burnCents * 2;

  const optNet30 = fromCents(optInflows30dCents - optOutflows30dCents);
  const optNet60 = fromCents(optInflows60dCents - optOutflows60dCents);
  const optBal30 = roundToTwoDecimals(liquidBalance + optNet30);
  const optBal60 = roundToTwoDecimals(liquidBalance + optNet60);
  const optRunway = roundToTwoDecimals(Math.max(0, optBal60) / Math.max(1, monthlyRecurringBurn));

  return {
    actualLiquidBalance: liquidBalance,
    monthlyRecurringBurn,
    scenarios: {
      conservative: {
        name: "Conservative",
        projectedInflows30d: fromCents(consInflows30dCents),
        projectedInflows60d: fromCents(consInflows60dCents),
        projectedOutflows30d: fromCents(consOutflows30dCents),
        projectedOutflows60d: fromCents(consOutflows60dCents),
        netCashflow30d: consNet30,
        netCashflow60d: consNet60,
        projectedBalance30d: consBal30,
        projectedBalance60d: consBal60,
        runwayMonths: consRunway,
        assumptions: [
          "Zero recovery from current overdue receivables",
          "30% haircut on open pipeline invoices due to client delay",
          "10% expense buffer added for unexpected operational outflows",
        ],
      },
      expected: {
        name: "Expected (Baseline)",
        projectedInflows30d: fromCents(expInflows30dCents),
        projectedInflows60d: fromCents(expInflows60dCents),
        projectedOutflows30d: fromCents(expOutflows30dCents),
        projectedOutflows60d: fromCents(expOutflows60dCents),
        netCashflow30d: expNet30,
        netCashflow60d: expNet60,
        projectedBalance30d: expBal30,
        projectedBalance60d: expBal60,
        runwayMonths: expRunway,
        assumptions: [
          "95% of current on-time invoices clear within contractual net terms",
          "50% of overdue accounts recovered within 30 days via automated reminders",
          "Recurring subscriptions and software expenses remain at current audited baseline",
        ],
      },
      optimistic: {
        name: "Optimistic",
        projectedInflows30d: fromCents(optInflows30dCents),
        projectedInflows60d: fromCents(optInflows60dCents),
        projectedOutflows30d: fromCents(optOutflows30dCents),
        projectedOutflows60d: fromCents(optOutflows60dCents),
        netCashflow30d: optNet30,
        netCashflow60d: optNet60,
        projectedBalance30d: optBal30,
        projectedBalance60d: optBal60,
        runwayMonths: optRunway,
        assumptions: [
          "100% of open receivables settled on schedule",
          "All overdue invoices settled through prompt discount incentive",
          "New pipeline deliverables authorized ahead of milestone maturity",
        ],
      },
    },
    explanation: `Operating with verified liquid balance of $${liquidBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} against a recurring monthly burn of $${monthlyRecurringBurn.toLocaleString("en-US", { minimumFractionDigits: 2 })}. Baseline 60-day projected closing balance is $${expBal60.toLocaleString("en-US", { minimumFractionDigits: 2 })} (${expRunway} months runway).`,
  };
}
