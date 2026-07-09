import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { HexagonReview } from "./sample";

const COLORS = {
  bg: "#07090d",
  panel: "#0d1117",
  panelDeep: "#080c10",
  border: "#1b2430",
  steel: "#8a97a8",
  ink: "#e8eef5",
  cyan: "#4fd0e0",
  red: "#ff5d5d",
  green: "#42d392",
  gold: "#d4af37",
};

const SEAT_FILL_MS = 1800;
const SEAT_SETTLE_MS = 320;
const CENTER_REVEAL_DELAY_MS = 280;
const EXPLAIN_DELAY_MS = 800;
const CONTRARIAN_ID = "contrarian";
const CONTRARIAN_GAP_MS = 4800;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildDeliberationOrder(agents: { id: string }[]): number[] {
  const ci = agents.findIndex((a) => a.id === CONTRARIAN_ID);
  const indices = agents.map((_, i) => i);
  if (ci === -1) return shuffle(indices);
  const others = shuffle(indices.filter((i) => i !== ci));
  return [...others, ci];
}

function hardHexPath(v: [number, number][]): string {
  return v.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt[0]} ${pt[1]} `).join("") + "Z";
}

function hexPerimeter(v: [number, number][]): number {
  let t = 0;
  for (let i = 0; i < v.length; i++) {
    const a = v[i], b = v[(i + 1) % v.length];
    t += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return t;
}

// ── 3D wireframe hexagonal table (perspective / low-angle side view) ──
// Top face is a foreshortened hexagon (ry < rx simulates the tilt); the body
// is extruded straight down by `depth`, with short legs at the outer corners.
const TBL = { cx: 50, cy: 43, rx: 34, ry: 16, depth: 9, leg: 13 };
const HEX_TOP: [number, number][] = [
  [TBL.cx + TBL.rx,     TBL.cy          ], // 0 right
  [TBL.cx + TBL.rx / 2, TBL.cy - TBL.ry ], // 1 upper-right (far)
  [TBL.cx - TBL.rx / 2, TBL.cy - TBL.ry ], // 2 upper-left  (far)
  [TBL.cx - TBL.rx,     TBL.cy          ], // 3 left
  [TBL.cx - TBL.rx / 2, TBL.cy + TBL.ry ], // 4 lower-left  (near)
  [TBL.cx + TBL.rx / 2, TBL.cy + TBL.ry ], // 5 lower-right (near)
];
const HEX_BOT: [number, number][] = HEX_TOP.map(([x, y]) => [x, y + TBL.depth]);
const TOP_PATH = hardHexPath(HEX_TOP);
const TOP_PERIM = hexPerimeter(HEX_TOP);
const FRONT_IDX = [0, 5, 4, 3]; // near-side / outer corners (visible struts + legs)
const BACK_IDX = [1, 2];        // far-side corners (faint struts)
const BOT_FRONT_PATH =
  `M ${HEX_BOT[3][0]} ${HEX_BOT[3][1]} ` +
  `L ${HEX_BOT[4][0]} ${HEX_BOT[4][1]} ` +
  `L ${HEX_BOT[5][0]} ${HEX_BOT[5][1]} ` +
  `L ${HEX_BOT[0][0]} ${HEX_BOT[0][1]}`;

const SEAT_POS = HEX_TOP.map(([x, y]) => {
  const dx = x - TBL.cx, dy = y - TBL.cy;
  return { x: TBL.cx + dx * 1.14, y: TBL.cy + dy * 1.14 };
});

// Agent index → seat vertex index, so left-column agents (0,2,4) get the
// left-side seats and right-column agents (1,3,5) get the right-side seats.
const SEAT_ORDER = [2, 1, 3, 0, 4, 5];

type SeatState = "idle" | "active" | "resolved";

function formatMoney(n: number) { return `${n < 0 ? "-" : "+"}$${Math.abs(n).toFixed(0)}`; }
function formatMoneyPlain(n: number) { return `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(0)}`; }
function agentDisplayName(name: string) { return /agent$/i.test(name.trim()) ? name : `${name} Agent`; }

interface Particle { x:number; y:number; vx:number; vy:number; r:number; opacity:number; life:number; maxLife:number; }

function useParticles(ref: React.RefObject<HTMLCanvasElement|null>, active: boolean) {
  const pool = useRef<Particle[]>([]);
  const seeds = useRef<Float32Array|null>(null);
  const raf   = useRef<number|null>(null);
  const time  = useRef(0);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const W = c.width, H = c.height;
    const COLS = 150, ROWS = 40;

    if (!seeds.current) {
      seeds.current = new Float32Array(COLS * ROWS);
      for (let i = 0; i < COLS * ROWS; i++) seeds.current[i] = Math.random();
    }
    const sp = seeds.current;

    if (!pool.current.length) {
      for (let i = 0; i < 50; i++) pool.current.push({
        x: Math.random()*W, y: Math.random()*H,
        vx: (Math.random()-0.5)*0.14, vy: -Math.random()*0.12-0.02,
        r: Math.random()*1.2+0.3, opacity: Math.random()*0.28+0.04,
        life: Math.random()*300, maxLife: 300+Math.random()*400,
      });
    }

    const draw = () => {
      time.current += active ? 0.014 : 0.007;
      const t = time.current;
      ctx.clearRect(0, 0, W, H);

      // ── Particle wave field (lower 2/3, perspective grid) ──
      const horizon = H * 0.40;
      for (let r = 0; r < ROWS; r++) {
        const depth = r / (ROWS - 1);              // 0 far → 1 near
        const persp = 0.18 + 0.82 * depth * depth;
        const baseY = horizon + depth * depth * (H * 0.78);
        const spread = W * (0.7 + 0.75 * persp);
        for (let ci = 0; ci < COLS; ci++) {
          const u = ci / (COLS - 1) - 0.5;
          const x = W / 2 + u * spread;
          const wave =
            Math.sin(u * 7  + t * 0.9 + depth * 4.0) * 24 +
            Math.sin(u * 13 - t * 0.6 + depth * 9.0) * 11 +
            Math.sin(u * 3  + t * 0.4 + depth * 2.0) * 34;
          const y = baseY + wave * persp;
          if (y < horizon - 40 || y > H) continue;
          const s = sp[r * COLS + ci];
          const tw = 0.5 + 0.5 * Math.sin(t * 2.2 + s * 43);
          let a = (0.12 + 0.48 * depth) * (0.5 + 0.5 * tw);
          let size = 0.8 + 1.5 * persp;
          if (s > 0.94) { a = Math.min(1, a * 3.0); size += 0.8; }
          ctx.fillStyle = s > 0.97
            ? `rgba(130,225,255,${a})`
            : `rgba(79,208,224,${a})`;
          ctx.fillRect(x, y, size, size);
        }
      }

      // ── Drifting dust above the wave ──
      for (const p of pool.current) {
        p.x += p.vx*(active?1.6:0.7); p.y += p.vy*(active?1.6:0.7); p.life++;
        if (p.x<0) p.x=W; if (p.x>W) p.x=0;
        if (p.y<0) p.y=H; if (p.y>H) p.y=0;
        const pulse = 0.5+0.5*Math.sin(p.life*0.03);
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(79,208,224,${p.opacity*pulse})`; ctx.fill();
      }

      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [active, ref]);
}

function useTypewriter(text: string, go: boolean, msPerChar = 22) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!go) { setDisplayed(""); return; }
    let i = 0; setDisplayed("");
    const iv = setInterval(() => {
      i++; setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, msPerChar);
    return () => clearInterval(iv);
  }, [text, go, msPerChar]);
  return displayed;
}

function SeatedFigure({ color, active }: { color: string; active: boolean }) {
  return (
    <svg viewBox="0 0 40 40" style={{ width:18, height:18, flexShrink:0, filter: active ? `drop-shadow(0 0 6px ${color})` : "none", transition:"filter 300ms" }}>
      <circle cx="20" cy="12" r="6.5" fill={color} opacity="0.9" />
      <path d="M8 34 C8 24 13 19 20 19 C27 19 32 24 32 34 Z" fill={color} opacity="0.75" />
    </svg>
  );
}

function AgentCard({
  agent, state, progress, runKey, uid, align, cardRef,
}: {
  agent: HexagonReview["agents"][number];
  state: SeatState;
  progress: number;
  runKey: number;
  uid: string;
  align: "left" | "right";
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  const isActive   = state === "active";
  const isResolved = state === "resolved";
  const isLive     = isActive || isResolved;
  const ledColor   = isResolved ? (agent.verdict === "mistake" ? COLORS.red : COLORS.green) : isActive ? COLORS.cyan : COLORS.border;
  const figColor   = isLive ? COLORS.cyan : COLORS.steel;
  const verdictColor = agent.verdict === "mistake" ? COLORS.red : COLORS.green;

  const [shouldType, setShouldType] = useState(false);
  const prevRunKey = useRef(runKey);

  useEffect(() => {
    if (runKey !== prevRunKey.current) {
      prevRunKey.current = runKey;
      setShouldType(false);
    }
  }, [runKey]);

  useEffect(() => {
    if (isActive) setShouldType(true);
  }, [isActive]);

  const thinkingSource = agent.thinking ?? agent.text;
  const thinkingText = useTypewriter(thinkingSource, shouldType, 45);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [thinkingText]);

  return (
    <div
      ref={cardRef}
      className="flex flex-col rounded-lg overflow-hidden transition-all duration-300"
      style={{
        flex: "1 1 0",
        minHeight: 0,
        backgroundColor: COLORS.panel,
        border: `2px solid ${isActive ? COLORS.cyan : isResolved ? `${verdictColor}66` : COLORS.border}`,
        boxShadow: isActive
          ? `0 0 0 1px ${COLORS.cyan}22, 0 0 24px ${COLORS.cyan}28, inset 0 0 12px ${COLORS.cyan}08`
          : isResolved
          ? `0 0 14px ${verdictColor}20`
          : "none",
        position: "relative",
      }}
    >
      {/* Active pulsing ring */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ animation: `cardRingZ${uid} 1.2s ease-out infinite`, border: `2px solid ${COLORS.cyan}`, zIndex: 10 }}
        />
      )}

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
        style={{
          borderBottom: `1px solid ${isActive ? `${COLORS.cyan}33` : COLORS.border}`,
          backgroundColor: isActive ? `${COLORS.cyan}08` : "transparent",
          flexDirection: align === "right" ? "row-reverse" : "row",
        }}
      >
        <div style={{
          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
          backgroundColor: ledColor,
          boxShadow: isResolved ? `0 0 8px ${ledColor}, 0 0 16px ${ledColor}66`
            : isActive ? `0 0 8px ${COLORS.cyan}, 0 0 14px ${COLORS.cyan}`
            : "none",
          animation: isActive ? `ledPulseZ${uid} 0.7s ease-in-out infinite alternate` : "none",
          transition: "background-color 200ms, box-shadow 200ms",
        }} />
        <SeatedFigure color={figColor} active={isActive} />
        <span
          className="text-[10px] font-semibold flex-1 truncate"
          style={{
            color: isLive ? COLORS.ink : COLORS.steel,
            textAlign: align === "right" ? "right" : "left",
            fontFamily: "'Inter', system-ui, sans-serif",
            letterSpacing: "0.05em",
          }}
        >
          {agentDisplayName(agent.name)}
        </span>
        {isResolved && (
          <span
            className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{
              color: verdictColor,
              backgroundColor: `${verdictColor}18`,
              textShadow: `0 0 8px ${verdictColor}88`,
              border: `1px solid ${verdictColor}44`,
            }}
          >
            {agent.verdict === "mistake" ? "MISTAKE" : "DEFENSIBLE"}
          </span>
        )}
        {!isResolved && isActive && (
          <span
            className="text-[8px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ color: COLORS.cyan, backgroundColor: `${COLORS.cyan}18`, border: `1px solid ${COLORS.cyan}44` }}
          >
            THINKING
          </span>
        )}
      </div>

      {/* Thinking body */}
      <div
        ref={bodyRef}
        className="flex-1 px-3 py-2 overflow-y-auto"
        style={{
          minHeight: 0,
          backgroundColor: isActive ? `${COLORS.panelDeep}` : COLORS.panelDeep,
        }}
      >
        {shouldType ? (
          <p
            className="text-[8px] leading-relaxed whitespace-pre-wrap"
            style={{
              fontFamily: "'JetBrains Mono', 'Share Tech Mono', 'Courier New', monospace",
              color: isResolved ? COLORS.steel : COLORS.cyan,
              transition: "color 400ms",
            }}
          >
            {thinkingText}
            {isActive && thinkingText.length < thinkingSource.length && (
              <span style={{ opacity: Math.sin(Date.now() / 300) > 0 ? 1 : 0 }}>▌</span>
            )}
          </p>
        ) : (
          <p
            className="text-[10px] uppercase tracking-widest"
            style={{ color: COLORS.border, fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            {state === "idle" ? "Awaiting deliberation..." : ""}
          </p>
        )}
      </div>

      {/* Footer: progress bar */}
      <div className="px-3 pb-2 pt-1.5 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: isResolved ? verdictColor : COLORS.cyan,
              boxShadow: isActive ? `0 0 6px ${COLORS.cyan}` : isResolved ? `0 0 6px ${verdictColor}` : "none",
              transition: isActive ? "width 60ms linear" : "width 300ms ease",
            }}
          />
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

  const [activeIndex, setActiveIndex]   = useState<number>(-1);
  const [resolved, setResolved]         = useState<boolean[]>(() => agents.map(() => false));
  const [progress, setProgress]         = useState<number[]>(() => agents.map(() => 0));
  const [phase, setPhase]               = useState<"idle"|"deliberating"|"verdict"|"done">("idle");
  const [showVerdict, setShowVerdict]   = useState(false);
  const [showSummary, setShowSummary]   = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [shockwave, setShockwave]       = useState(false);
  const [runKey, setRunKey]             = useState(0);

  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  useParticles(canvasRef, phase === "deliberating");

  const timeouts = useRef<number[]>([]);
  const rafRef   = useRef<number|null>(null);
  const runId    = useRef(0);

  const clearAll = () => {
    timeouts.current.forEach((t) => window.clearTimeout(t));
    timeouts.current = [];
    if (rafRef.current !== null) { window.cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  const push = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms); timeouts.current.push(t); return t;
  };

  const triggerFlash = () => {
    setFlashOpacity(0.5);
    push(() => setFlashOpacity(0), 200);
    setShockwave(false);
    push(() => setShockwave(true), 80);
    push(() => setShockwave(false), 920);
  };

  const runSequence = () => {
    clearAll();
    const myRun = ++runId.current;
    const order = buildDeliberationOrder(agents);
    setRunKey((k) => k + 1);
    setActiveIndex(-1);
    setResolved(agents.map(() => false));
    setProgress(agents.map(() => 0));
    setPhase("deliberating");
    setShowVerdict(false);
    setShowSummary(false);
    setFlashOpacity(0);
    setShockwave(false);

    const stepSeat = (pos: number) => {
      if (runId.current !== myRun) return;
      const i = order[pos];
      setActiveIndex(i);
      const start = performance.now();
      const tick = () => {
        if (runId.current !== myRun) return;
        const elapsed = performance.now() - start;
        const pct = Math.min(100, (elapsed / SEAT_FILL_MS) * 100);
        setProgress((prev) => { const n=[...prev]; n[i]=pct; return n; });
        if (pct < 100) {
          rafRef.current = window.requestAnimationFrame(tick);
        } else {
          push(() => {
            if (runId.current !== myRun) return;
            setResolved((prev) => { const n=[...prev]; n[i]=true; return n; });
            const nextPos = pos + 1;
            const nextIsContrarian = nextPos < order.length && agents[order[nextPos]].id === CONTRARIAN_ID;
            push(() => {
              if (runId.current !== myRun) return;
              if (nextPos < order.length) {
                stepSeat(nextPos);
              } else {
                setActiveIndex(-1);
                setPhase("verdict");
                push(() => {
                  if (runId.current !== myRun) return;
                  triggerFlash();
                  push(() => {
                    if (runId.current !== myRun) return;
                    setShowVerdict(true);
                    push(() => {
                      if (runId.current !== myRun) return;
                      setShowSummary(true);
                      setPhase("done");
                    }, EXPLAIN_DELAY_MS);
                  }, 220);
                }, CENTER_REVEAL_DELAY_MS);
              }
            }, nextIsContrarian ? CONTRARIAN_GAP_MS : SEAT_SETTLE_MS);
          }, 60);
        }
      };
      rafRef.current = window.requestAnimationFrame(tick);
    };
    stepSeat(0);
  };

  useEffect(() => {
    if (autoPlay) runSequence();
    return () => { runId.current++; clearAll(); };
  }, []);

  const seatStates: SeatState[] = useMemo(
    () => agents.map((_, i) => resolved[i] ? "resolved" : i === activeIndex ? "active" : "idle"),
    [agents, activeIndex, resolved],
  );

  const { trade, verdict, patternFlag } = review;

  const verdictDisplayed = useTypewriter(verdict.decision, showVerdict, 55);

  const leftAgents  = [0, 2, 4];
  const rightAgents = [1, 3, 5];

  // ── Neural links: measured card→seat connection paths ──
  const rowRef      = useRef<HTMLDivElement>(null);
  const hexStageRef = useRef<HTMLDivElement>(null);
  const overlayRef  = useRef<SVGSVGElement>(null);
  const cardEls     = useRef<(HTMLDivElement | null)[]>([]);
  const linkPts     = useRef<({ x1:number; y1:number; x2:number; y2:number } | null)[]>([]);
  const [links, setLinks] = useState<string[]>([]);

  useEffect(() => {
    const measure = () => {
      const row = rowRef.current, hex = hexStageRef.current;
      if (!row || !hex) return;
      const rowR = row.getBoundingClientRect();
      const hexR = hex.getBoundingClientRect();
      const next: string[] = [];
      for (let i = 0; i < 6; i++) {
        const el = cardEls.current[i];
        if (!el) { linkPts.current[i] = null; next.push(""); continue; }
        const r = el.getBoundingClientRect();
        const isLeft = i % 2 === 0;
        const x1 = (isLeft ? r.right : r.left) - rowR.left;
        const y1 = r.top + r.height / 2 - rowR.top;
        const seat = SEAT_POS[SEAT_ORDER[i]];
        const x2 = hexR.left + (seat.x / 100) * hexR.width - rowR.left;
        const y2 = hexR.top + (seat.y / 100) * hexR.height - rowR.top;
        linkPts.current[i] = { x1, y1, x2, y2 };
        const mx = x2 - x1;
        next.push(`M ${x1} ${y1} C ${x1 + mx * 0.45} ${y1}, ${x1 + mx * 0.55} ${y2}, ${x2} ${y2}`);
      }
      setLinks(next);
    };
    measure();
    const t = window.setTimeout(measure, 350);
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);
    if (hexStageRef.current) ro.observe(hexStageRef.current);
    cardEls.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", measure);
    return () => { window.clearTimeout(t); ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  // Gentle sway of the connection curves (endpoints stay pinned)
  useEffect(() => {
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const svg = overlayRef.current;
      if (svg) {
        const t = (now - t0) / 1000;
        for (let i = 0; i < 6; i++) {
          const p = linkPts.current[i];
          if (!p) continue;
          const sway1 = Math.sin(t * 1.1 + i * 1.3) * 16;
          const sway2 = Math.sin(t * 0.8 + i * 0.9 + 2.1) * 16;
          const mx = p.x2 - p.x1;
          const d = `M ${p.x1} ${p.y1} C ${p.x1 + mx * 0.45} ${p.y1 + sway1}, ${p.x1 + mx * 0.55} ${p.y2 + sway2}, ${p.x2} ${p.y2}`;
          svg.querySelectorAll<SVGPathElement>(`[data-link="${i}"]`).forEach((el) => el.setAttribute("d", d));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="w-full min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: COLORS.bg, color: COLORS.ink, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes hexTraceZ${uid} { to { stroke-dashoffset: -${TOP_PERIM}; } }
        @keyframes flowZ${uid} { to { stroke-dashoffset: -100; } }
        @keyframes ledPulseZ${uid} {
          from { box-shadow: 0 0 4px ${COLORS.cyan}, 0 0 8px ${COLORS.cyan}; }
          to   { box-shadow: 0 0 10px ${COLORS.cyan}, 0 0 20px ${COLORS.cyan}; }
        }
        @keyframes cardRingZ${uid} {
          0%   { transform: scale(1);    opacity: 0.8; }
          100% { transform: scale(1.04); opacity: 0;   }
        }
        @keyframes seatDotZ${uid} {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.5); }
        }
        @keyframes shockwaveZ${uid} {
          0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(4);   opacity: 0;   }
        }
        @keyframes verdictSlamZ${uid} {
          0%   { transform: scale(2.8); opacity: 0; filter: blur(10px); }
          60%  { transform: scale(0.94); opacity: 1; filter: blur(0px); }
          100% { transform: scale(1);   opacity: 1; filter: blur(0px); }
        }
        @keyframes scanlineZ${uid} {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes titleGlowZ${uid} {
          0%, 100% { text-shadow: 0 0 4px ${COLORS.cyan}44; }
          50%       { text-shadow: 0 0 12px ${COLORS.cyan}88, 0 0 24px ${COLORS.cyan}22; }
        }
        @keyframes fadeInZ${uid} {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hex-zoom-body::-webkit-scrollbar { width: 3px; }
        .hex-zoom-body::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
      `}</style>

      {/* Blueprint grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            `linear-gradient(${COLORS.cyan}13 1px, transparent 1px),` +
            `linear-gradient(90deg, ${COLORS.cyan}13 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 45%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 45%, black 30%, transparent 100%)",
        }}
      />

      {/* Ambient glow behind the table */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            `radial-gradient(ellipse 100% 60% at 50% 110%, #0a0f16 20%, transparent 70%)`,
        }}
      />

      {/* Back wall plane (above the floor boundary) */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: 0, right: 0, top: 0, height: "40%",
          background: "linear-gradient(180deg, rgba(3,5,8,0.92) 0%, rgba(5,7,11,0.55) 60%, rgba(7,9,13,0) 100%)",
        }}
      />

      {/* Wall branding — THE HEXAGON */}
      <div
        className="absolute pointer-events-none flex flex-col items-center"
        style={{ left: 0, right: 0, bottom: "61.5%" }}
      >
        <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
          <div style={{ width: 90, height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.cyan}40)` }} />
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <path d="M7 0.8 L13.2 4.4 V11.6 L7 15.2 L0.8 11.6 V4.4 Z" stroke={`${COLORS.cyan}88`} strokeWidth="1" />
            <path d="M7 4 L10.4 6 V10 L7 12 L3.6 10 V6 Z" stroke={`${COLORS.cyan}55`} strokeWidth="0.8" />
          </svg>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: "0.5em",
            color: `${COLORS.steel}cc`, textTransform: "uppercase",
          }}>
            Obsidian&nbsp;Abyss&nbsp;//&nbsp;Deliberation&nbsp;Chamber
          </span>
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <path d="M7 0.8 L13.2 4.4 V11.6 L7 15.2 L0.8 11.6 V4.4 Z" stroke={`${COLORS.cyan}88`} strokeWidth="1" />
            <path d="M7 4 L10.4 6 V10 L7 12 L3.6 10 V6 Z" stroke={`${COLORS.cyan}55`} strokeWidth="0.8" />
          </svg>
          <div style={{ width: 90, height: 1, background: `linear-gradient(90deg, ${COLORS.cyan}40, transparent)` }} />
        </div>

        <div className="relative flex items-center gap-5">
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em",
            color: `${COLORS.cyan}66`, whiteSpace: "nowrap",
          }}>[ SEC-06 ]</span>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 800,
            fontSize: "clamp(30px, 3.6vw, 52px)", lineHeight: 1,
            letterSpacing: "0.42em", textIndent: "0.42em", whiteSpace: "nowrap",
            color: "transparent",
            WebkitTextStroke: `1.2px ${COLORS.cyan}77`,
            textShadow: `0 0 26px ${COLORS.cyan}22`,
          }}>
            THE&nbsp;HEXAGON
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em",
            color: `${COLORS.cyan}66`, whiteSpace: "nowrap",
          }}>[ REV 2.4 ]</span>
        </div>

        <div style={{
          marginTop: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5,
          letterSpacing: "0.62em", textIndent: "0.62em", textTransform: "uppercase",
          color: `${COLORS.steel}99`, whiteSpace: "nowrap",
        }}>
          Trade&nbsp;Review&nbsp;Council&nbsp;·&nbsp;Unit&nbsp;06&nbsp;·&nbsp;Authorized&nbsp;Personnel&nbsp;Only
        </div>
      </div>

      {/* Floor / wall boundary line */}
      <div className="absolute pointer-events-none" style={{ left: 0, right: 0, top: "40%" }}>
        <div style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.cyan}2e 10%, ${COLORS.cyan}77 50%, ${COLORS.cyan}2e 90%, transparent)`,
        }} />
        <div style={{
          height: 6,
          backgroundImage: `repeating-linear-gradient(90deg, ${COLORS.cyan}30 0 1px, transparent 1px 64px)`,
          maskImage: "linear-gradient(90deg, transparent, black 18%, black 82%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 18%, black 82%, transparent)",
        }} />
        <div style={{
          height: 22,
          background: `linear-gradient(180deg, ${COLORS.cyan}0d, transparent)`,
          maskImage: "linear-gradient(90deg, transparent, black 25%, black 75%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 25%, black 75%, transparent)",
        }} />
      </div>

      {/* Full-page particle canvas */}
      <canvas
        ref={canvasRef}
        width={1400} height={900}
        className="absolute inset-0 pointer-events-none"
        style={{ width:"100%", height:"100%", opacity:0.9 }}
      />

      {/* Scanline sweep */}
      {phase === "deliberating" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex:1 }}>
          <div style={{
            position:"absolute", left:0, right:0, height:2,
            background:`linear-gradient(transparent,${COLORS.cyan}1a,transparent)`,
            animation:`scanlineZ${uid} 5s linear infinite`,
          }} />
        </div>
      )}

      {/* Flash overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundColor: COLORS.cyan,
        opacity: flashOpacity,
        transition: flashOpacity === 0 ? "opacity 0.45s ease-out" : "none",
        zIndex: 30,
      }} />

      {/* ── HEADER ── */}
      <div
        className="relative flex-shrink-0 flex items-center justify-between px-6 py-3"
        style={{ zIndex:2, borderBottom:`1px solid ${COLORS.border}`, backgroundColor:`${COLORS.panel}cc`, backdropFilter:"blur(8px)" }}
      >
        <div className="flex flex-col">
          <div
            className="text-[9px] uppercase tracking-[0.32em] font-semibold"
            style={{
              color: COLORS.cyan,
              animation: phase === "deliberating" ? `titleGlowZ${uid} 2s ease-in-out infinite` : "none",
            }}
          >
            Trade Review Council
          </div>
          <div className="flex items-baseline gap-3 mt-0.5 flex-wrap">
            <span className="text-lg font-bold">{trade.symbol}</span>
            <span className="text-xs" style={{ color: COLORS.steel }}>{trade.entryDate} → {trade.exitDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[10px]" style={{ color: COLORS.steel }}>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] uppercase tracking-widest">Entry</span>
            <span className="font-semibold" style={{ color: COLORS.ink }}>${trade.entryPrice.toFixed(2)}</span>
          </div>
          <div style={{ color: COLORS.border }}>→</div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] uppercase tracking-widest">Exit</span>
            <span className="font-semibold" style={{ color: COLORS.ink }}>${trade.exitPrice.toFixed(2)}</span>
          </div>
          <div style={{ color: COLORS.border }}>·</div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] uppercase tracking-widest">Size</span>
            <span className="font-semibold" style={{ color: COLORS.ink }}>×{trade.size}</span>
          </div>
          <div style={{ color: COLORS.border }}>·</div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] uppercase tracking-widest">P&L</span>
            <span className="font-bold text-sm" style={{ color: trade.pnl < 0 ? COLORS.red : COLORS.green }}>
              {formatMoney(trade.pnl)} ({trade.pnlPct.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: phase === "deliberating" ? COLORS.cyan : phase === "done" ? COLORS.green : COLORS.border,
              boxShadow: phase === "deliberating" ? `0 0 8px ${COLORS.cyan}` : "none",
              animation: phase === "deliberating" ? `seatDotZ${uid} 1s ease-in-out infinite` : "none",
            }}
          />
          <span className="text-[9px] uppercase tracking-widest" style={{ color: COLORS.steel }}>
            {phase === "idle" ? "Standby" : phase === "deliberating" ? "Deliberating" : phase === "verdict" ? "Rendering Verdict" : "Session Complete"}
          </span>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div ref={rowRef} className="flex-1 flex relative min-h-0" style={{ zIndex: 2 }}>

        {/* Neural links overlay */}
        <svg ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {links.map((d, i) => {
            if (!d) return null;
            const s = seatStates[i];
            const color = s === "resolved"
              ? (agents[i].verdict === "mistake" ? COLORS.red : COLORS.green)
              : COLORS.cyan;
            return (
              <g key={i}>
                {/* Base filament */}
                <path data-link={i} d={d} fill="none" stroke={COLORS.cyan} strokeWidth="1"
                  opacity={s === "active" ? 0.3 : s === "resolved" ? 0.16 : 0.08}
                  style={{ transition: "opacity 400ms" }}
                />
                {/* Signal pulses — spherical packets */}
                {s !== "idle" && (
                  <>
                    {/* soft halo around the packet */}
                    <path data-link={i} d={d} fill="none" stroke={color} strokeLinecap="round" pathLength={100}
                      strokeWidth={s === "active" ? 11.25 : 8.75}
                      style={{
                        strokeDasharray: "0.1 99.9",
                        animation: `flowZ${uid} ${s === "active" ? "0.72s" : "1.76s"} linear infinite`,
                        opacity: s === "active" ? 0.25 : 0.12,
                      }}
                    />
                    {/* bright core */}
                    <path data-link={i} d={d} fill="none" stroke={color} strokeLinecap="round" pathLength={100}
                      strokeWidth={s === "active" ? 6.25 : 4.75}
                      style={{
                        strokeDasharray: "0.1 99.9",
                        animation: `flowZ${uid} ${s === "active" ? "0.72s" : "1.76s"} linear infinite`,
                        opacity: s === "active" ? 0.95 : 0.45,
                      }}
                    />
                  </>
                )}
                {s === "active" && (
                  <path data-link={i} d={d} fill="none" stroke={color} strokeLinecap="round" pathLength={100}
                    strokeWidth="4.4"
                    style={{
                      strokeDasharray: "0.1 99.9",
                      animation: `flowZ${uid} 0.72s linear -0.36s infinite`,
                      opacity: 0.55,
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-3 p-3 flex-shrink-0 relative" style={{ width: 288, zIndex: 1 }}>
          {leftAgents.map((agentIdx) => (
            <AgentCard
              key={agents[agentIdx].id}
              agent={agents[agentIdx]}
              state={seatStates[agentIdx]}
              progress={progress[agentIdx]}
              runKey={runKey}
              uid={uid}
              align="left"
              cardRef={(el) => { cardEls.current[agentIdx] = el; }}
            />
          ))}
        </div>

        {/* CENTER — HEX STAGE */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-w-0 py-4">

          {/* Hex stage */}
          <div ref={hexStageRef} className="relative" style={{ width:"100%", maxWidth:420, aspectRatio:"1/1" }}>

            {/* Shockwave */}
            {shockwave && (
              <div className="absolute pointer-events-none" style={{
                left:"50%", top:"50%", width:160, height:160,
                borderRadius:"50%", border:`2px solid ${COLORS.cyan}`,
                boxShadow:`0 0 10px ${COLORS.cyan}88, inset 0 0 10px ${COLORS.cyan}22`,
                animation:`shockwaveZ${uid} 0.85s ease-out forwards`, zIndex:5,
              }} />
            )}

            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow:"visible" }}>

              {/* Legs (front / outer corners) */}
              {FRONT_IDX.map((i) => (
                <line key={`leg${i}`}
                  x1={HEX_BOT[i][0]} y1={HEX_BOT[i][1]}
                  x2={HEX_BOT[i][0]} y2={HEX_BOT[i][1] + TBL.leg}
                  stroke={COLORS.cyan} strokeWidth="1.4" strokeLinecap="round"
                  opacity={phase==="deliberating" ? 0.34 : 0.22}
                  style={{ transition:"opacity 500ms" }}
                />
              ))}

              {/* Far-side vertical struts (faint) */}
              {BACK_IDX.map((i) => (
                <line key={`bstrut${i}`}
                  x1={HEX_TOP[i][0]} y1={HEX_TOP[i][1]}
                  x2={HEX_BOT[i][0]} y2={HEX_BOT[i][1]}
                  stroke={COLORS.cyan} strokeWidth="0.4" opacity="0.15" strokeLinecap="round"
                />
              ))}

              {/* Underside near rim */}
              <path d={BOT_FRONT_PATH} fill="none" stroke={COLORS.cyan} strokeWidth="0.55"
                strokeLinejoin="round" strokeLinecap="round"
                opacity={phase==="deliberating" ? 0.5 : 0.34}
                style={{ transition:"opacity 500ms" }}
              />

              {/* Near-side vertical struts */}
              {FRONT_IDX.map((i) => (
                <line key={`strut${i}`}
                  x1={HEX_TOP[i][0]} y1={HEX_TOP[i][1]}
                  x2={HEX_BOT[i][0]} y2={HEX_BOT[i][1]}
                  stroke={COLORS.cyan} strokeWidth="1.0" strokeLinecap="round"
                  opacity={phase==="deliberating" ? 0.6 : 0.42}
                  style={{ transition:"opacity 500ms" }}
                />
              ))}

              {/* Table top — subtle fill + spokes for depth read */}
              <path d={TOP_PATH} fill="rgba(79,208,224,0.035)" stroke="none" />
              {HEX_TOP.map(([x,y],i) => (
                <line key={`spoke${i}`}
                  x1={TBL.cx} y1={TBL.cy} x2={x} y2={y}
                  stroke={COLORS.cyan} strokeWidth="0.3"
                  opacity={phase==="deliberating" ? 0.26 : 0.14}
                  style={{ transition:"opacity 500ms" }}
                />
              ))}

              {/* Table top wireframe outline */}
              <path d={TOP_PATH} fill="none" stroke={COLORS.cyan} strokeWidth="0.8" strokeLinejoin="round"
                opacity={phase==="deliberating" ? 0.92 : 0.6}
                style={{ transition:"opacity 500ms" }}
              />

              {/* Traveling highlight along the rim while deliberating */}
              {phase==="deliberating" && (
                <path d={TOP_PATH} fill="none" stroke={COLORS.cyan} strokeWidth="1.1"
                  strokeLinejoin="round" strokeLinecap="round"
                  style={{
                    strokeDasharray:`${TOP_PERIM*0.12} ${TOP_PERIM*0.88}`,
                    animation:`hexTraceZ${uid} 2.2s linear infinite`,
                    opacity:0.85,
                  }}
                />
              )}

              {/* Seat markers at each vertex */}
              {SEAT_ORDER.map((seatIdx, i) => {
                const pos = SEAT_POS[seatIdx];
                const s = seatStates[i];
                const color = s === "resolved"
                  ? (agents[i].verdict === "mistake" ? COLORS.red : COLORS.green)
                  : s === "active" ? COLORS.cyan : COLORS.border;
                const diamond = (r: number) =>
                  `M ${pos.x} ${pos.y - r} L ${pos.x + r} ${pos.y} L ${pos.x} ${pos.y + r} L ${pos.x - r} ${pos.y} Z`;
                return (
                  <g key={i}>
                    {s === "active" && (
                      <path d={diamond(3.6)} fill="none" stroke={color} strokeWidth="0.4" opacity="0.5"
                        style={{
                          animation:`seatDotZ${uid} 0.9s ease-in-out infinite`,
                          transformBox:"fill-box", transformOrigin:"center",
                        }} />
                    )}
                    <path d={diamond(s === "active" ? 2.4 : 1.8)} fill={color}
                      style={{ transition:"fill 300ms" }} />
                  </g>
                );
              })}
            </svg>

            {/* Center verdict / status */}
            <div className="absolute flex flex-col items-center justify-center text-center px-3"
              style={{ left:"50%", top:"50%", transform:"translate(-50%,-50%)", width:"55%" }}>
              {showVerdict ? (
                <div style={{ animation:`fadeInZ${uid} 0.4s ease` }}>
                  <div className="text-[8px] uppercase tracking-[0.22em] font-semibold mb-1" style={{ color: COLORS.steel }}>Verdict</div>
                  <div className="font-black tracking-wide mb-1"
                    style={{
                      fontSize:"clamp(14px,3.5vw,22px)",
                      color: COLORS.cyan,
                      textShadow:`0 0 10px ${COLORS.cyan}bb, 0 0 20px ${COLORS.cyan}33`,
                      animation:`verdictSlamZ${uid} 0.52s cubic-bezier(0.34,1.3,0.64,1) forwards`,
                    }}
                  >
                    {verdictDisplayed}
                    <span style={{ opacity: verdictDisplayed.length < verdict.decision.length ? 1 : 0 }}>▌</span>
                  </div>
                  <div className="text-[9px] mb-1.5" style={{ color: COLORS.steel }}>
                    {verdict.consensusMistake}–{verdict.consensusDefensible}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[9px]">
                    <span style={{ color:COLORS.red, fontWeight:700 }}>{formatMoneyPlain(verdict.userOutcome)}</span>
                    <span style={{ color:COLORS.steel }}>vs</span>
                    <span style={{ color:COLORS.green, fontWeight:700 }}>{formatMoneyPlain(verdict.councilOutcome)}</span>
                  </div>
                  <div className="mt-1 text-[9px]" style={{ color:COLORS.gold, fontWeight:700 }}>
                    Cost: {formatMoneyPlain(verdict.decisionCost)}
                  </div>
                </div>
              ) : (
                <div className="text-[9px] uppercase tracking-[0.22em]" style={{ color: COLORS.steel }}>
                  {phase === "deliberating" ? "Deliberating…" : "Convening"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-3 p-3 flex-shrink-0 relative" style={{ width: 288, zIndex: 1 }}>
          {rightAgents.map((agentIdx) => (
            <AgentCard
              key={agents[agentIdx].id}
              agent={agents[agentIdx]}
              state={seatStates[agentIdx]}
              progress={progress[agentIdx]}
              runKey={runKey}
              uid={uid}
              align="right"
              cardRef={(el) => { cardEls.current[agentIdx] = el; }}
            />
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        className="relative flex-shrink-0 flex flex-col items-center py-4 px-6 gap-3"
        style={{ zIndex:2, borderTop:`1px solid ${COLORS.border}`, backgroundColor:`${COLORS.panel}cc`, backdropFilter:"blur(8px)" }}
      >
        <div
          className="transition-opacity duration-500 text-center"
          style={{ opacity: showSummary ? 1 : 0 }}
        >
          <p className="text-xs" style={{ color: COLORS.steel }}>{verdict.summary}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: COLORS.gold }}>
            {patternFlag}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={runSequence}
            className="px-5 py-2 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all duration-200"
            style={{ backgroundColor:"transparent", border:`1px solid ${COLORS.cyan}`, color:COLORS.cyan }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor="rgba(79,208,224,0.1)"; e.currentTarget.style.boxShadow=`0 0 18px rgba(79,208,224,0.35)`; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor="transparent"; e.currentTarget.style.boxShadow="none"; }}
          >
            Convene Again
          </button>

          {showSummary && (
            <div
              className="flex items-center gap-4 text-[10px]"
              style={{ color: COLORS.steel, animation:`fadeInZ${uid} 0.5s ease` }}
            >
              <span>Held to <span style={{ color:COLORS.ink, fontWeight:600 }}>{verdict.heldToDate}</span></span>
              <span>·</span>
              <span>Council outcome <span style={{ color:COLORS.green, fontWeight:700 }}>{formatMoney(verdict.councilOutcome)}</span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
