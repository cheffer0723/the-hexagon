import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { HexagonAgent, HexagonReview } from "./sample";

const COLORS = {
  bg: "#07090d",
  panel: "#0d1117",
  border: "#1b2430",
  steel: "#8a97a8",
  ink: "#e8eef5",
  cyan: "#4fd0e0",
  red: "#ff5d5d",
  green: "#42d392",
  gold: "#d4af37",
};

const SEAT_FILL_MS = 1650;
const SEAT_SETTLE_MS = 320;
const CENTER_REVEAL_DELAY_MS = 250;
const EXPLAIN_DELAY_MS = 700;
const CONTRARIAN_ID = "contrarian";
const CONTRARIAN_GAP_MS = 5000;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildDeliberationOrder(agents: HexagonAgent[]): number[] {
  const contrarianIdx = agents.findIndex((a) => a.id === CONTRARIAN_ID);
  const indices = agents.map((_, i) => i);
  if (contrarianIdx === -1) {
    return shuffle(indices);
  }
  const others = shuffle(indices.filter((i) => i !== contrarianIdx));
  return [...others, contrarianIdx];
}

const HEX_VERTICES: [number, number][] = [
  [50, 22],
  [78, 38],
  [78, 62],
  [50, 78],
  [22, 62],
  [22, 38],
];

function agentDisplayName(name: string): string {
  return /agent$/i.test(name.trim()) ? name : `${name} Agent`;
}

function hardHexPath(vertices: [number, number][]): string {
  const d = vertices
    .map((v, i) => `${i === 0 ? "M" : "L"} ${v[0]} ${v[1]} `)
    .join("");
  return d + "Z";
}

function hexPerimeter(vertices: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < vertices.length; i++) {
    const curr = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    total += Math.hypot(next[0] - curr[0], next[1] - curr[1]);
  }
  return total;
}

const HEX_OUTLINE_PATH = hardHexPath(HEX_VERTICES);
const HEX_PERIMETER = hexPerimeter(HEX_VERTICES);

const TABLE_THICKNESS = 5;
const HEX_VERTICES_BOTTOM: [number, number][] = HEX_VERTICES.map(([x, y]) => [x, y + TABLE_THICKNESS]);
const HEX_OUTLINE_PATH_BOTTOM = hardHexPath(HEX_VERTICES_BOTTOM);

function edgeQuadPath(topA: [number, number], topB: [number, number], bottomA: [number, number], bottomB: [number, number]): string {
  return `M ${topA[0]} ${topA[1]} L ${topB[0]} ${topB[1]} L ${bottomB[0]} ${bottomB[1]} L ${bottomA[0]} ${bottomA[1]} Z`;
}

const VISIBLE_EDGE_INDICES = [1, 2, 3, 4];
const HEX_SIDE_WALLS = VISIBLE_EDGE_INDICES.map((i) => {
  const next = (i + 1) % HEX_VERTICES.length;
  return {
    key: i,
    path: edgeQuadPath(HEX_VERTICES[i], HEX_VERTICES[next], HEX_VERTICES_BOTTOM[i], HEX_VERTICES_BOTTOM[next]),
  };
});

type SeatState = "idle" | "active" | "resolved";

function formatMoney(n: number): string {
  const sign = n < 0 ? "-" : "+";
  return `${sign}$${Math.abs(n).toFixed(0)}`;
}

function formatMoneyPlain(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(0)}`;
}

const SEAT_LAYOUT = [
  { x: 50, y: 6 },
  { x: 94, y: 30 },
  { x: 94, y: 70 },
  { x: 50, y: 94 },
  { x: 6, y: 70 },
  { x: 6, y: 30 },
];

function SeatedFigure({ color, active }: { color: string; active: boolean }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className="w-5 h-5 sm:w-6 sm:h-6"
      style={{
        filter: active ? `drop-shadow(0 0 6px ${color})` : "none",
        transition: "filter 300ms ease",
      }}
    >
      <circle cx="20" cy="12" r="6.5" fill={color} opacity="0.9" />
      <path
        d="M8 34 C8 24 13 19 20 19 C27 19 32 24 32 34 Z"
        fill={color}
        opacity="0.75"
      />
    </svg>
  );
}

function Seat({
  agent,
  pos,
  state,
  progress,
}: {
  agent: HexagonAgent;
  pos: { x: number; y: number };
  state: SeatState;
  progress: number;
}) {
  const ledColor =
    state === "resolved"
      ? agent.verdict === "mistake"
        ? COLORS.red
        : COLORS.green
      : COLORS.border;
  const isActive = state === "active";

  return (
    <div
      className="absolute flex flex-col items-center gap-1"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
        width: "min(20%, 108px)",
      }}
    >
      <div
        className="relative flex flex-col items-center justify-center rounded-md px-1.5 py-1.5 w-full transition-all duration-300"
        style={{
          backgroundColor: COLORS.panel,
          border: `2px solid ${isActive ? COLORS.cyan : COLORS.border}`,
          boxShadow: isActive
            ? `0 6px 14px -4px rgba(0,0,0,0.6), 0 0 16px rgba(79,208,224,0.35), inset 0 0 12px rgba(79,208,224,0.08)`
            : `0 6px 14px -4px rgba(0,0,0,0.6), 0 8px 18px -6px rgba(79,208,224,0.18)`,
        }}
      >
        <div
          className="rounded-full mb-0.5"
          style={{
            width: 5,
            height: 5,
            backgroundColor: ledColor,
            boxShadow:
              state === "resolved"
                ? `0 0 6px ${ledColor}, 0 0 10px ${ledColor}`
                : isActive
                  ? `0 0 5px ${COLORS.cyan}`
                  : "none",
            transition: "background-color 200ms ease, box-shadow 200ms ease",
          }}
        />
        <SeatedFigure color={isActive || state === "resolved" ? COLORS.cyan : COLORS.steel} active={isActive} />
        <div
          className="mt-0.5 text-[8px] sm:text-[9px] font-normal tracking-wide text-center leading-tight"
          style={{ color: COLORS.ink }}
        >
          {agentDisplayName(agent.name)}
        </div>
        <div
          className="mt-1 w-full h-[3px] rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: COLORS.cyan,
              transition: state === "active" ? "width 60ms linear" : "width 200ms ease",
            }}
          />
        </div>
        <div
          className="mt-0.5 text-[7px] sm:text-[8px] uppercase tracking-widest font-semibold"
          style={{
            color: state === "resolved" ? ledColor : "transparent",
            transition: "color 200ms ease",
            minHeight: "10px",
          }}
        >
          {state === "resolved" ? (agent.verdict === "mistake" ? "MISTAKE" : "DEFENSIBLE") : " "}
        </div>
      </div>
    </div>
  );
}

export default function Hexagon({
  review,
  autoPlay = true,
}: {
  review: HexagonReview;
  autoPlay?: boolean;
}) {
  const agents = review.agents.slice(0, 6);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [resolved, setResolved] = useState<boolean[]>(() => agents.map(() => false));
  const [progress, setProgress] = useState<number[]>(() => agents.map(() => 0));
  const [phase, setPhase] = useState<"idle" | "deliberating" | "verdict" | "done">("idle");
  const [showVerdict, setShowVerdict] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);

  const timeouts = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const runId = useRef(0);

  const clearAllTimers = () => {
    timeouts.current.forEach((t) => window.clearTimeout(t));
    timeouts.current = [];
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const runSequence = () => {
    clearAllTimers();
    const myRun = ++runId.current;
    const order = buildDeliberationOrder(agents);
    setActiveIndex(-1);
    setResolved(agents.map(() => false));
    setProgress(agents.map(() => 0));
    setPhase("deliberating");
    setShowVerdict(false);
    setShowExplanations(false);

    const stepSeat = (pos: number) => {
      if (runId.current !== myRun) return;
      const i = order[pos];
      setActiveIndex(i);
      const start = performance.now();
      const tick = () => {
        if (runId.current !== myRun) return;
        const elapsed = performance.now() - start;
        const pct = Math.min(100, (elapsed / SEAT_FILL_MS) * 100);
        setProgress((prev) => {
          const next = [...prev];
          next[i] = pct;
          return next;
        });
        if (pct < 100) {
          rafRef.current = window.requestAnimationFrame(tick);
        } else {
          const t = window.setTimeout(() => {
            if (runId.current !== myRun) return;
            setResolved((prev) => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
            const nextPos = pos + 1;
            const nextIsContrarian =
              nextPos < order.length &&
              agents[order[nextPos]].id === CONTRARIAN_ID;
            const settleDelay = nextIsContrarian
              ? CONTRARIAN_GAP_MS
              : SEAT_SETTLE_MS;
            const t2 = window.setTimeout(() => {
              if (runId.current !== myRun) return;
              if (nextPos < order.length) {
                stepSeat(nextPos);
              } else {
                setActiveIndex(-1);
                setPhase("verdict");
                const t3 = window.setTimeout(() => {
                  if (runId.current !== myRun) return;
                  setShowVerdict(true);
                  const t4 = window.setTimeout(() => {
                    if (runId.current !== myRun) return;
                    setShowExplanations(true);
                    setPhase("done");
                  }, EXPLAIN_DELAY_MS);
                  timeouts.current.push(t4);
                }, CENTER_REVEAL_DELAY_MS);
                timeouts.current.push(t3);
              }
            }, settleDelay);
            timeouts.current.push(t2);
          }, 60);
          timeouts.current.push(t);
        }
      };
      rafRef.current = window.requestAnimationFrame(tick);
    };

    stepSeat(0);
  };

  useEffect(() => {
    if (autoPlay) {
      runSequence();
    }
    return () => {
      runId.current++;
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seatStates: SeatState[] = useMemo(
    () =>
      agents.map((_, i) => {
        if (resolved[i]) return "resolved";
        if (i === activeIndex) return "active";
        return "idle";
      }),
    [agents, activeIndex, resolved],
  );

  const { trade, verdict, patternFlag } = review;

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center px-4 py-4 sm:py-6"
      style={{ backgroundColor: COLORS.bg, color: COLORS.ink, fontFamily: "'Orbitron', system-ui, sans-serif" }}
    >
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800&display=swap');`}
      </style>
      <div className="w-full max-w-3xl flex flex-col items-center">
        <div className="w-full flex flex-col items-center mb-3 sm:mb-4 text-center">
          <div
            className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold mb-2"
            style={{ color: COLORS.cyan }}
          >
            Trade Review Council
          </div>
          <div className="flex items-baseline gap-3 flex-wrap justify-center">
            <span className="text-xl sm:text-2xl font-bold">{trade.symbol}</span>
            <span className="text-xs sm:text-sm" style={{ color: COLORS.steel }}>
              {trade.entryDate} &rarr; {trade.exitDate}
            </span>
          </div>
          <div className="mt-1.5 text-xs sm:text-sm" style={{ color: COLORS.steel }}>
            Entry {trade.entryPrice.toFixed(2)} &middot; Exit {trade.exitPrice.toFixed(2)} &middot; Size {trade.size}
            {" · "}
            <span style={{ color: trade.pnl < 0 ? COLORS.red : COLORS.green, fontWeight: 600 }}>
              {formatMoney(trade.pnl)} ({trade.pnlPct.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div
          className="relative w-full"
          style={{
            aspectRatio: "1 / 1",
            maxWidth: 560,
          }}
        >
          <style>
            {`
              @keyframes hexTrace${uid} {
                to { stroke-dashoffset: -${HEX_PERIMETER}; }
              }
            `}
          </style>
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full"
            style={{ overflow: "visible" }}
          >
            <defs>
              <filter id={`hexGlow${uid}`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="0.9" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`traceGlow${uid}`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="1.1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`hexShadow${uid}`} x="-50%" y="-30%" width="200%" height="220%">
                <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.55" />
              </filter>
              <linearGradient id={`hexFace${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#141c26" />
                <stop offset="45%" stopColor={COLORS.panel} />
                <stop offset="100%" stopColor="#05070a" />
              </linearGradient>
              <linearGradient id={`hexBevelLight${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                <stop offset="55%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <linearGradient id={`hexBevelDark${uid}`} x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
                <stop offset="55%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
              <linearGradient id={`hexWall${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#232e3a" />
                <stop offset="100%" stopColor="#04060a" />
              </linearGradient>
            </defs>

            <g filter={`url(#hexShadow${uid})`}>
              <path d={HEX_OUTLINE_PATH_BOTTOM} fill="#04060a" />
              {HEX_SIDE_WALLS.map((wall) => (
                <path
                  key={wall.key}
                  d={wall.path}
                  fill={`url(#hexWall${uid})`}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="0.2"
                />
              ))}
              <path d={HEX_OUTLINE_PATH} fill={`url(#hexFace${uid})`} />
            </g>

            <path
              d={HEX_OUTLINE_PATH}
              fill="none"
              stroke={`url(#hexBevelDark${uid})`}
              strokeWidth="1.4"
              strokeLinejoin="miter"
            />
            <path
              d={HEX_OUTLINE_PATH}
              fill="none"
              stroke={`url(#hexBevelLight${uid})`}
              strokeWidth="0.8"
              strokeLinejoin="miter"
            />

            <path
              d={HEX_OUTLINE_PATH}
              fill="none"
              stroke={COLORS.cyan}
              strokeWidth="1.1"
              strokeLinejoin="miter"
              opacity="0.3"
              filter={`url(#hexGlow${uid})`}
            />
            <path
              d={HEX_OUTLINE_PATH}
              fill="none"
              stroke={COLORS.cyan}
              strokeWidth="0.6"
              strokeLinejoin="miter"
              opacity="0.85"
            />

            <path
              d={HEX_OUTLINE_PATH}
              fill="none"
              stroke={COLORS.cyan}
              strokeWidth="1.1"
              strokeLinejoin="miter"
              strokeLinecap="round"
              filter={`url(#traceGlow${uid})`}
              style={{
                strokeDasharray: `${HEX_PERIMETER * 0.14} ${HEX_PERIMETER * 0.86}`,
                animation: `hexTrace${uid} ${phase === "deliberating" ? 2.4 : 9}s linear infinite`,
                opacity: phase === "deliberating" ? 0.95 : 0.4,
                transition: "opacity 600ms ease",
              }}
            />
          </svg>

          <div
            className="absolute flex flex-col items-center justify-center text-center px-3"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "58%",
            }}
          >
            <div
              className="transition-opacity duration-500"
              style={{ opacity: showVerdict ? 1 : 0 }}
            >
              <div
                className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-semibold mb-1"
                style={{ color: COLORS.steel }}
              >
                Verdict
              </div>
              <div
                className="text-lg sm:text-2xl font-bold tracking-wide mb-1"
                style={{ color: COLORS.cyan }}
              >
                {verdict.decision}
              </div>
              <div className="text-[10px] sm:text-xs mb-2" style={{ color: COLORS.steel }}>
                Consensus {verdict.consensusMistake}-{verdict.consensusDefensible}
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs flex-wrap">
                <span style={{ color: COLORS.red, fontWeight: 700 }}>
                  {formatMoneyPlain(verdict.userOutcome)}
                </span>
                <span style={{ color: COLORS.steel }}>vs</span>
                <span style={{ color: COLORS.green, fontWeight: 700 }}>
                  {formatMoneyPlain(verdict.councilOutcome)}
                </span>
              </div>
              <div className="mt-1.5 text-[10px] sm:text-xs" style={{ color: COLORS.gold, fontWeight: 700 }}>
                Cost of decision: {formatMoneyPlain(verdict.decisionCost)}
              </div>
              <div className="mt-1 text-[9px] sm:text-[10px]" style={{ color: COLORS.steel }}>
                Held to {verdict.heldToDate}
              </div>
            </div>
            {!showVerdict && (
              <div
                className="text-[10px] sm:text-xs uppercase tracking-[0.2em]"
                style={{ color: COLORS.steel }}
              >
                {phase === "deliberating" ? "Deliberating…" : "Convening"}
              </div>
            )}
          </div>

          {agents.map((agent, i) => (
            <Seat key={agent.id} agent={agent} pos={SEAT_LAYOUT[i]} state={seatStates[i]} progress={progress[i]} />
          ))}
        </div>

        <div
          className="mt-4 sm:mt-5 w-full text-center transition-opacity duration-500"
          style={{ opacity: showVerdict ? 1 : 0 }}
        >
          <p className="text-xs sm:text-sm" style={{ color: COLORS.steel }}>
            {verdict.summary}
          </p>
        </div>

        <div
          className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity duration-700"
          style={{ opacity: showExplanations ? 1 : 0 }}
        >
          {agents.map((agent) => {
            const isRed = agent.verdict === "mistake";
            const color = isRed ? COLORS.red : COLORS.green;
            return (
              <div
                key={agent.id}
                className="rounded-lg p-3 sm:p-4"
                style={{
                  backgroundColor: COLORS.panel,
                  border: `2px solid ${COLORS.border}`,
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className="text-xs sm:text-sm font-medium" style={{ color: COLORS.ink }}>
                    {agentDisplayName(agent.name)}
                  </span>
                  <span
                    className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded"
                    style={{ color, backgroundColor: `${color}1a` }}
                  >
                    {isRed ? "MISTAKE" : "DEFENSIBLE"}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-light leading-relaxed" style={{ color: COLORS.steel }}>
                  {agent.text}
                </p>
              </div>
            );
          })}
        </div>

        <div
          className="mt-6 w-full text-center text-[10px] sm:text-xs uppercase tracking-widest transition-opacity duration-700"
          style={{ color: COLORS.gold, opacity: showExplanations ? 1 : 0 }}
        >
          {patternFlag}
        </div>

        <button
          onClick={runSequence}
          className="mt-8 px-5 py-2.5 rounded-md text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all duration-200"
          style={{
            backgroundColor: "transparent",
            border: `1px solid ${COLORS.cyan}`,
            color: COLORS.cyan,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(79,208,224,0.1)";
            e.currentTarget.style.boxShadow = `0 0 16px rgba(79,208,224,0.3)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Convene again
        </button>
      </div>
    </div>
  );
}
