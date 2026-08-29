import { SAMPLE, type AgentVerdict, type HexagonReview } from "./sample";

export interface SandboxScenario {
  id: string;
  title: string;
  subtitle: string;
  lesson: string;
  evidence: {
    signal: string;
    counterfactual: string;
    timeline: [string, string, string];
  };
  review: HexagonReview;
}

type ScenarioInput = Omit<SandboxScenario, "review"> & {
  trade: HexagonReview["trade"];
  verdict: HexagonReview["verdict"];
  patternFlag: string;
  agentVerdicts: AgentVerdict[];
  agentTexts: string[];
};

function scenario(input: ScenarioInput): SandboxScenario {
  return {
    id: input.id,
    title: input.title,
    subtitle: input.subtitle,
    lesson: input.lesson,
    evidence: input.evidence,
    review: {
      trade: input.trade,
      agents: SAMPLE.agents.map((agent, index) => ({
        ...agent,
        verdict: input.agentVerdicts[index] ?? agent.verdict,
        text: input.agentTexts[index] ?? agent.text,
      })),
      verdict: input.verdict,
      patternFlag: input.patternFlag,
    },
  };
}

export const SANDBOX_SCENARIOS: SandboxScenario[] = [
  scenario({
    id: "premature-exit",
    title: "Premature exit",
    subtitle: "A shallow loss turns into a discretionary bail.",
    lesson: "Separate normal volatility from a genuine invalidation before closing a position.",
    trade: SAMPLE.trade,
    verdict: SAMPLE.verdict,
    patternFlag: "Illustrative pattern: exit triggered by discomfort rather than a defined signal.",
    evidence: {
      signal: "Illustrative regime stayed constructive; no invalidation was supplied with the exit.",
      counterfactual: "In this local scenario, waiting for the planned trigger would have preserved optionality.",
      timeline: ["Entry: plan not recorded", "Drawdown: within sample noise band", "Exit: discretionary close"],
    },
    agentVerdicts: ["mistake", "mistake", "mistake", "mistake", "mistake", "defensible"],
    agentTexts: [
      "No predefined stop appears in this illustrative record. The exit arrived before a stated invalidation.",
      "The simulated move is small relative to the sample noise band. The data alone does not require a sell.",
      "The narrative fits an early-discomfort exit: the price changed, but the decision rule did not.",
      "The strongest contrarian case still needs a catalyst. This sandbox record supplies none.",
      "The illustrative regime flag remains constructive through the exit window.",
      "Unknown account constraints can make an early exit rational. The council cannot see those constraints.",
    ],
  }),
  scenario({
    id: "risk-exit",
    title: "Risk exit",
    subtitle: "A loss is cut because the pre-set risk line breaks.",
    lesson: "A planned loss can be a disciplined decision when the risk boundary—not emotion—causes the exit.",
    trade: { symbol: "NVDA", entryDate: "2026-05-11", exitDate: "2026-05-14", entryPrice: 860, exitPrice: 824, size: 4, pnl: -144, pnlPct: -4.2 },
    verdict: { decision: "EXIT", consensusMistake: 2, consensusDefensible: 4, userOutcome: -144, councilOutcome: -144, decisionCost: 0, heldToDate: "2026-05-14", summary: "Consensus: a documented stop was respected after the setup invalidated." },
    patternFlag: "Illustrative pattern: rule-based risk exit after a planned boundary failed.",
    evidence: {
      signal: "The local scenario marks a failed support level and a stop that was defined before entry.",
      counterfactual: "Holding after the stop would increase exposure without restoring the original thesis.",
      timeline: ["Entry: stop documented", "Signal: support fails", "Exit: stop executed"],
    },
    agentVerdicts: ["defensible", "defensible", "mistake", "defensible", "defensible", "defensible"],
    agentTexts: [
      "The planned stop was reached. Taking the loss keeps the scenario within the risk budget.",
      "The local rule set changes state at the defined boundary. The exit follows the stated system.",
      "A reversal was possible, but possibility is not a reason to ignore a known stop.",
      "The contrarian case is to wait for confirmation; it does not outweigh the pre-committed risk line here.",
      "The regime flag weakened at the same time the support level failed in this illustration.",
      "Protecting capital after an invalidation is a defensible decision, not a failure to hold nerve.",
    ],
  }),
  scenario({
    id: "trend-hold",
    title: "Trend hold",
    subtitle: "A winning position is held while its trend stays intact.",
    lesson: "Let the planned trend rule decide when a winner is over rather than harvesting it out of habit.",
    trade: { symbol: "QQQ", entryDate: "2026-04-06", exitDate: "2026-04-24", entryPrice: 445, exitPrice: 472, size: 6, pnl: 162, pnlPct: 6.1 },
    verdict: { decision: "HOLD", consensusMistake: 1, consensusDefensible: 5, userOutcome: 162, councilOutcome: 162, decisionCost: 0, heldToDate: "2026-04-24", summary: "Consensus: the trade remained aligned with its illustrative trend rule through exit." },
    patternFlag: "Illustrative pattern: held while the trend condition remained valid.",
    evidence: {
      signal: "The local scenario keeps the trend and breadth flags constructive throughout the hold.",
      counterfactual: "Taking profit at the first small gain would reduce exposure but abandon the stated trend rule.",
      timeline: ["Entry: trend confirms", "Hold: pullbacks contained", "Exit: target window reached"],
    },
    agentVerdicts: ["defensible", "defensible", "defensible", "mistake", "defensible", "defensible"],
    agentTexts: [
      "Risk was managed with a trailing boundary in this illustrative scenario, so holding did not mean ignoring downside.",
      "The trend condition remains positive in the local data. The hold is consistent with the rule.",
      "The sample avoids the urge to lock a small gain simply because it is available.",
      "The contrarian concern is crowding, but the scenario contains no exit trigger strong enough to override the plan.",
      "Trend and regime inputs remain aligned until the stated exit window.",
      "Holding a winner is defensible when the position size and exit rule remain deliberate.",
    ],
  }),
];
