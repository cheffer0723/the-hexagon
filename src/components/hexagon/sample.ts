export type AgentVerdict = "mistake" | "defensible";

export interface HexagonAgent {
  id: string;
  name: string;
  verdict: AgentVerdict;
  text: string;
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
    },
    {
      id: "quant",
      name: "Quant",
      verdict: "mistake",
      text: "~0.4 ATR of movement. Statistically indistinguishable from noise. Nothing in the data said sell.",
    },
    {
      id: "behavioral",
      name: "Behavioral Psych",
      verdict: "mistake",
      text: "Textbook discomfort exit - a shallow drawdown, a short hold, no new information. The exit tracked price pain, not a plan.",
    },
    {
      id: "contrarian",
      name: "Contrarian",
      verdict: "mistake",
      text: "Sold the day before it stopped falling. Fading a 3-day index dip is flinching with the crowd, not an edge.",
    },
    {
      id: "regime",
      name: "Regime Analyst",
      verdict: "mistake",
      text: "Risk-on uptrend the entire window - SPY above its 200-day, no macro-stress flip. The model stayed IN. The exit fought the regime.",
    },
    {
      id: "devils_advocate",
      name: "Devil's Advocate",
      verdict: "defensible",
      text: "In your defense - if that was rent money or you were over-leveraged elsewhere, cutting fast is rational. Preservation beats being right.",
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
};
