import { useId, type CSSProperties } from "react";

const COLORS = {
  border: "#1b2430",
  steel: "#8a97a8",
  cyan: "#4fd0e0",
};

// Same 3D wireframe table geometry as the live council view (Hexagon.tsx),
// rendered here in a static, idle state as a preview behind the upload gate.
const TBL = { cx: 50, cy: 46, rx: 34, ry: 16, depth: 9, leg: 13 };
const HEX_TOP: [number, number][] = [
  [TBL.cx + TBL.rx, TBL.cy],
  [TBL.cx + TBL.rx / 2, TBL.cy - TBL.ry],
  [TBL.cx - TBL.rx / 2, TBL.cy - TBL.ry],
  [TBL.cx - TBL.rx, TBL.cy],
  [TBL.cx - TBL.rx / 2, TBL.cy + TBL.ry],
  [TBL.cx + TBL.rx / 2, TBL.cy + TBL.ry],
];
const HEX_BOT: [number, number][] = HEX_TOP.map(([x, y]) => [x, y + TBL.depth]);
const TOP_PATH = HEX_TOP.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt[0]} ${pt[1]} `).join("") + "Z";
const FRONT_IDX = [0, 5, 4, 3];
const BACK_IDX = [1, 2];

// A minimal wireframe chair — back rail + seat bar + two legs — parked
// just outside each table vertex, facing the center.
const CHAIRS = HEX_TOP.map(([x, y], i) => {
  const dx = x - TBL.cx, dy = y - TBL.cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const ax = x + ux * 8, ay = y + uy * 8;
  const half = 2.6;
  const backTopY = ay - 4.5;
  const seatY = ay + 0.5;
  const legBottomY = HEX_BOT[i][1] + TBL.leg * 0.85;
  return {
    key: `chair${i}`,
    back: `M ${ax - half} ${seatY} L ${ax - half} ${backTopY} L ${ax + half} ${backTopY} L ${ax + half} ${seatY}`,
    seat: `M ${ax - half * 1.35} ${seatY} L ${ax + half * 1.35} ${seatY}`,
    legL: `M ${ax - half} ${seatY} L ${ax - half * 0.7} ${legBottomY}`,
    legR: `M ${ax + half} ${seatY} L ${ax + half * 0.7} ${legBottomY}`,
  };
});

export default function TeaserScene() {
  const uid = useId().replace(/[:]/g, "");

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0, containerType: "inline-size" } as CSSProperties}>
      <style>{`
        @keyframes teaserGlow${uid} {
          0%, 100% { text-shadow: 0 0 4px ${COLORS.cyan}44; opacity: 0.75; }
          50%       { text-shadow: 0 0 14px ${COLORS.cyan}88, 0 0 26px ${COLORS.cyan}22; opacity: 1; }
        }
        @keyframes teaserDust${uid} {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-140px) translateX(12px); opacity: 0; }
        }
        @keyframes teaserTrace${uid} {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -220; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .tzdust${uid}  { animation: teaserDust${uid} var(--dur) ease-in-out var(--delay) infinite; }
          .tzglow${uid}  { animation: teaserGlow${uid} 2.6s ease-in-out infinite; }
          .tztrace${uid} { animation: teaserTrace${uid} 5.5s linear infinite; }
        }
      `}</style>

      {/* Blueprint grid backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            `linear-gradient(${COLORS.cyan}13 1px, transparent 1px),` +
            `linear-gradient(90deg, ${COLORS.cyan}13 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 40%, black 25%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 40%, black 25%, transparent 100%)",
        }}
      />

      {/* Drifting dust */}
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className={`absolute rounded-full tzdust${uid}`}
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${30 + ((i * 53) % 60)}%`,
            width: i % 3 === 0 ? 2 : 1,
            height: i % 3 === 0 ? 2 : 1,
            backgroundColor: COLORS.cyan,
            opacity: 0.4,
            "--dur": `${6 + (i % 5)}s`,
            "--delay": `${i * 0.4}s`,
          } as CSSProperties}
        />
      ))}

      {/* Wall branding — THE HEXAGON */}
      <div className="absolute left-0 right-0 flex flex-col items-center px-4" style={{ top: "8%" }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <div style={{ width: 32, height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.cyan}40)` }} />
          <svg width="10" height="12" viewBox="0 0 14 16" fill="none">
            <path d="M7 0.8 L13.2 4.4 V11.6 L7 15.2 L0.8 11.6 V4.4 Z" stroke={`${COLORS.cyan}88`} strokeWidth="1" />
          </svg>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, letterSpacing: "0.35em", color: `${COLORS.steel}cc`, textTransform: "uppercase", whiteSpace: "nowrap" }}>
            Deliberation&nbsp;Chamber
          </span>
          <svg width="10" height="12" viewBox="0 0 14 16" fill="none">
            <path d="M7 0.8 L13.2 4.4 V11.6 L7 15.2 L0.8 11.6 V4.4 Z" stroke={`${COLORS.cyan}88`} strokeWidth="1" />
          </svg>
          <div style={{ width: 32, height: 1, background: `linear-gradient(90deg, ${COLORS.cyan}40, transparent)` }} />
        </div>

        <span
          style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 800,
            fontSize: "clamp(24px, 6.6cqw, 38px)", lineHeight: 1,
            letterSpacing: "0.32em", textIndent: "0.32em",
            color: "transparent", WebkitTextStroke: `1.6px ${COLORS.cyan}99`,
          }}
        >
          THE&nbsp;HEXAGON
        </span>

        <div style={{ marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 7, letterSpacing: "0.4em", textIndent: "0.4em", textTransform: "uppercase", color: `${COLORS.steel}99`, whiteSpace: "nowrap" }}>
          Trade&nbsp;Review&nbsp;Council&nbsp;·&nbsp;Unit&nbsp;06
        </div>
      </div>

      {/* Floor boundary line */}
      <div className="absolute left-0 right-0" style={{ top: "38%" }}>
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.cyan}2e 10%, ${COLORS.cyan}77 50%, ${COLORS.cyan}2e 90%, transparent)` }} />
      </div>

      {/* Hex table stage, idle */}
      <div className="absolute left-1/2" style={{ top: "40%", width: "min(80%, 360px)", transform: "translateX(-50%)", aspectRatio: "1 / 1" }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          {CHAIRS.map((c) => (
            <g key={c.key} opacity="0.5">
              <path d={c.back} fill="none" stroke={COLORS.cyan} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" />
              <path d={c.seat} fill="none" stroke={COLORS.cyan} strokeWidth="1" strokeLinecap="round" />
              <path d={c.legL} fill="none" stroke={COLORS.cyan} strokeWidth="0.8" strokeLinecap="round" />
              <path d={c.legR} fill="none" stroke={COLORS.cyan} strokeWidth="0.8" strokeLinecap="round" />
            </g>
          ))}

          {FRONT_IDX.map((i) => (
            <line key={`leg${i}`} x1={HEX_BOT[i][0]} y1={HEX_BOT[i][1]} x2={HEX_BOT[i][0]} y2={HEX_BOT[i][1] + TBL.leg} stroke={COLORS.cyan} strokeWidth="2" strokeLinecap="round" opacity="0.32" />
          ))}
          {BACK_IDX.map((i) => (
            <line key={`bstrut${i}`} x1={HEX_TOP[i][0]} y1={HEX_TOP[i][1]} x2={HEX_BOT[i][0]} y2={HEX_BOT[i][1]} stroke={COLORS.cyan} strokeWidth="0.55" opacity="0.2" strokeLinecap="round" />
          ))}
          {FRONT_IDX.map((i) => (
            <line key={`strut${i}`} x1={HEX_TOP[i][0]} y1={HEX_TOP[i][1]} x2={HEX_BOT[i][0]} y2={HEX_BOT[i][1]} stroke={COLORS.cyan} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
          ))}
          <path d={TOP_PATH} fill="rgba(79,208,224,0.07)" stroke="none" />
          {HEX_TOP.map(([x, y], i) => (
            <line key={`spoke${i}`} x1={TBL.cx} y1={TBL.cy} x2={x} y2={y} stroke={COLORS.cyan} strokeWidth="0.45" opacity="0.24" />
          ))}
          <path d={TOP_PATH} fill="none" stroke={COLORS.cyan} strokeWidth="1.4" strokeLinejoin="round" opacity="0.78" />
          <path
            d={TOP_PATH} fill="none" stroke={COLORS.cyan} strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round"
            className={`tztrace${uid}`}
            style={{ strokeDasharray: "26 194", opacity: 0.75 }}
          />
          {HEX_TOP.map(([x, y], i) => (
            <path key={`seat${i}`} d={`M ${x} ${y - 2.4} L ${x + 2.4} ${y} L ${x} ${y + 2.4} L ${x - 2.4} ${y} Z`} fill={`${COLORS.cyan}66`} stroke={COLORS.cyan} strokeWidth="0.4" />
          ))}
        </svg>

        <div className="absolute flex flex-col items-center text-center" style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
          <div
            className={`text-[9px] font-bold uppercase tracking-[0.3em] tzglow${uid}`}
            style={{ color: COLORS.cyan, opacity: 0.95 }}
          >
            Six seats · standing by
          </div>
        </div>
      </div>
    </div>
  );
}
