export type AgentVerdict = "mistake" | "defensible";

export interface HexagonAgent {
  id: string;
  name: string;
  verdict: AgentVerdict;
  text: string;
  thinking?: string;
}

export interface HexagonReview {
  trade: {
    symbol: string;
    entryDate: string;
    exitDate: string;
    entryPrice: number;
    exitPrice: number;
    size: number;
    pnl: number;
    pnlPct: number;
  };
  agents: HexagonAgent[];
  verdict: {
    decision: string;
    consensusMistake: number;
    consensusDefensible: number;
    userOutcome: number;
    councilOutcome: number;
    decisionCost: number;
    heldToDate: string;
    summary: string;
  };
  patternFlag: string;
}

export const SAMPLE: HexagonReview = {
  trade: {
    symbol: "SPY",
    entryDate: "2026-06-02",
    exitDate: "2026-06-05",
    entryPrice: 410.5,
    exitPrice: 405.0,
    size: 10,
    pnl: -55,
    pnlPct: -1.3,
  },
  agents: [
    {
      id: "risk_manager",
      name: "Risk Manager",
      verdict: "mistake",
      text: "No stop defined at entry - a discretionary bail at a -1.3% dip, inside normal SPY noise. The undefined exit turned a wiggle into a realized loss.",
      thinking:
        "Cross-referencing entry metadata... no predefined stop-loss found in the record.\n\nExit trigger: manual discretion. Realized P&L: -$55 on 10 units at -1.3%.\n\nCurrent SPY ATR (14d): ~$2.80. Magnitude of this move: $1.30 — that is 0.46 ATR. Noise floor: anything under 0.5 ATR is within expected daily fluctuation for this instrument.\n\nThis exit fired inside the noise cone. No adverse news event. No stop level breached. No signal invalidation.\n\nBy risk management doctrine: an exit without a predefined trigger that fires inside normal volatility is a process failure, not a strategic decision.\n\nFiling: MISTAKE.",
    },
    {
      id: "quant",
      name: "Quant",
      verdict: "mistake",
      text: "~0.4 ATR of movement. Statistically indistinguishable from noise. Nothing in the data said sell.",
      thinking:
        "Loading price series... SPY 2026-06-02 → 2026-06-05.\n\nDelta: -$5.50/share, 10 units, total -$55.\nNormalized move: 0.39σ vs 14-day rolling std.\nPercentile rank of this move in the last 252 sessions: 41st.\n\nRunning mean-reversion probability model from this drawdown level...\nHistorical hold-through recovery rate at this depth: 71.4%.\nExpected value of holding at regime = risk-on: +$0.37/share/day.\n\nStatistical basis for exit: NONE identified.\nMomentum signal at exit: neutral. Volume: below average.\nBreakout/breakdown model: no trigger.\n\nClassification: noise-driven liquidation. Tagging MISTAKE.",
    },
    {
      id: "behavioral",
      name: "Behavioral Psych",
      verdict: "mistake",
      text: "Textbook discomfort exit - a shallow drawdown, a short hold, no new information. The exit tracked price pain, not a plan.",
      thinking:
        "Examining the behavioral signature of this exit...\n\nEntry: 2026-06-02 @ 410.50. Duration held: 3 days. Max drawdown before exit: -1.3%.\n\nPattern library match: 'shallow-dip capitulation' — 87% confidence.\nThis signature has appeared in 23% of this trader's reviewed exits.\n\nBehavioral markers present:\n  ✗ Drawdown < 2% at exit\n  ✗ No stop-loss triggered\n  ✗ Hold < 5 days\n  ✗ No new fundamental information\n\nDiagnosis: the exit tracked price pain, not a plan. The trader responded to paper loss discomfort — a cognitive bias known as loss aversion compounded by a short reference window.\n\nThis is not discipline. This is flinching.\n\nVerdict: MISTAKE.",
    },
    {
      id: "contrarian",
      name: "Contrarian",
      verdict: "mistake",
      text: "Sold the day before it stopped falling. Fading a 3-day index dip is flinching with the crowd, not an edge.",
      thinking:
        "Waiting for the council to speak first.\n\n...\n\nNow entering deliberation. The board is aligned: MISTAKE. Let me attempt to steelman the exit before I render my view.\n\nThe contrarian case requires a real catalyst. Was there one?\n  — News 06-02 to 06-05: no material catalyst for SPY.\n  — Fed communication: none scheduled.\n  — Macro deterioration: VIX slightly elevated but within normal band.\n  — Market structure: no confirmed breakdown.\n\nSelling a 3-day index dip into a risk-on trend is the most common crowd behavior. It is the opposite of contrarian. The edge, if any, was in holding.\n\nSPY closed higher on 06-06 — the day after exit.\n\nFiling: MISTAKE. Flinched with the crowd.",
    },
    {
      id: "regime",
      name: "Regime Analyst",
      verdict: "mistake",
      text: "Risk-on uptrend the entire window - SPY above its 200-day, no macro-stress flip. The model stayed IN. The exit fought the regime.",
      thinking:
        "Pulling regime data for 2026-06-02 through 2026-06-05...\n\nSPY vs 200-day MA: ABOVE throughout window.\nTrend slope (20d): positive, +0.4%/day.\nVIX regime: low-volatility band (sub-18).\nMacro mode classification: expansion.\nCredit spreads: tightening.\nBreadth: 68% of S&P 500 above 50-day MA.\n\nRegime score: 8.1 / 10 → strongly bullish.\n\nModel instruction during risk-on regime: HOLD unless hard stop is triggered or regime flips.\n\nNo hard stop was defined. No hard stop was hit. Regime did not flip.\n\nThe exit was made against every layer of the regime framework.\n\nFiling: MISTAKE — position exited in direct contradiction of the prevailing regime signal.",
    },
    {
      id: "devils_advocate",
      name: "Devil's Advocate",
      verdict: "defensible",
      text: "In your defense - if that was rent money or you were over-leveraged elsewhere, cutting fast is rational. Preservation beats being right.",
      thinking:
        "Taking the defense. The council is filing MISTAKE. My role is to find the case for DEFENSIBLE.\n\nThe model does not have access to account context. Consider:\n\n  1. If this position represented outsized exposure relative to account equity, a -1.3% move at the position level could represent material portfolio risk. Cutting fast is rational risk management in that case.\n\n  2. Psychological capital is finite and non-renewable. A trader who forces themselves to hold through discomfort they cannot tolerate does not build discipline — they build fear and avoidance. The exit may have protected future decision-making quality.\n\n  3. We cannot rule out undisclosed information — a need for liquidity, a correlated position, a personal constraint unknown to this council.\n\nOn those grounds alone: DEFENSIBLE. Not optimal in isolation, but not irrational given constraints the model cannot observe.",
    },
  ],
  verdict: {
    decision: "HOLD",
    consensusMistake: 5,
    consensusDefensible: 1,
    userOutcome: -55,
    councilOutcome: 94,
    decisionCost: 149,
    heldToDate: "2026-06-12",
    summary:
      "Consensus: a discomfort-driven exit against a risk-on regime. Holding to 06/12 turned -$55 into +$94.",
  },
  patternFlag: "1 of 1 reviewed = discomfort-driven exit. Watch for repeat.",
} as const;
