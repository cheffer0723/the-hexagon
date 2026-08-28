import { useMemo, useState } from "react";
import type { HexagonReview } from "./sample";

const COLORS = {
  bg: "#07090d",
  panel: "#0d1117",
  panelDeep: "#080c10",
  border: "#263542",
  steel: "#8a97a8",
  ink: "#e8eef5",
  cyan: "#4fd0e0",
  red: "#ff5d5d",
  green: "#42d392",
  gold: "#d4af37",
};

const SEAT_POSITIONS = [
  "top-seat",
  "upper-left-seat",
  "upper-right-seat",
  "lower-left-seat",
  "lower-right-seat",
  "bottom-seat",
] as const;

function seatLabel(agent: HexagonReview["agents"][number]) {
  const suffix = agent.name.split("—").at(-1)?.trim() || agent.name;
  return suffix.replace(/^The\s+/i, "").replace(/\s+Class$/i, "").toUpperCase();
}

function formatMoney(value: number) {
  return `${value < 0 ? "-" : "+"}$${Math.abs(value).toFixed(0)}`;
}

function VerdictMark({ verdict }: { verdict: "mistake" | "defensible" }) {
  const color = verdict === "mistake" ? COLORS.red : COLORS.green;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 17, height: 17, color, flexShrink: 0 }}>
      {verdict === "mistake" ? (
        <path d="M12 3.5 21 20H3L12 3.5Zm0 5.2v5.2m0 3.05v.05" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M12 2.8 20 7v5.6c0 4.6-3.2 7.4-8 8.6-4.8-1.2-8-4-8-8.6V7l8-4.2Zm-3.3 9 2.1 2.1 4.7-4.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function MobileHexagon({
  review,
  isSandbox,
  onExit,
}: {
  review: HexagonReview;
  isSandbox: boolean;
  onExit: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const agent = review.agents[selected] ?? review.agents[0];
  const outcomeColor = review.trade.pnl < 0 ? COLORS.red : COLORS.green;
  const summary = useMemo(() => review.verdict.summary.replace(/^Consensus:\s*/i, ""), [review.verdict.summary]);

  return (
    <main className="mobile-hexagon" style={{ background: COLORS.bg, color: COLORS.ink }}>
      <style>{`
        .mobile-hexagon { min-height: 100svh; overflow-x: hidden; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
        .mobile-hexagon * { box-sizing: border-box; }
        .mobile-hexagon__shell { width: min(100%, 480px); min-height: 100svh; margin: 0 auto; padding: 18px 14px 22px; position: relative; background: radial-gradient(circle at 50% 25%, #11313b 0, #07090d 43%, #030407 100%); }
        .mobile-hexagon__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; border-bottom: 1px solid #1b2430; padding: 0 3px 14px; }
        .mobile-hexagon__kicker { margin: 0; color: ${COLORS.cyan}; font: 700 9px/1.1 Inter, sans-serif; letter-spacing: .23em; text-transform: uppercase; }
        .mobile-hexagon__title { margin: 6px 0 0; font: 800 17px/1 Inter, sans-serif; letter-spacing: .09em; }
        .mobile-hexagon__exit { border: 1px solid #2b5660; color: ${COLORS.cyan}; background: #080c10d9; padding: 8px 10px; font: 700 9px/1 Inter, sans-serif; letter-spacing: .12em; text-transform: uppercase; }
        .mobile-hexagon__sandbox { margin: 14px 2px 0; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #22727e; color: ${COLORS.cyan}; background: #07161ae6; padding: 10px 12px; font: 700 10px/1.25 Inter, sans-serif; letter-spacing: .08em; text-align: center; }
        .mobile-hexagon__trade { display: grid; grid-template-columns: 1.05fr 1.2fr .65fr; gap: 7px; margin: 15px 2px 0; }
        .mobile-hexagon__trade > div { min-width: 0; border-top: 1px solid #263542; padding-top: 7px; }
        .mobile-hexagon__trade span { display: block; color: ${COLORS.steel}; font-size: 8px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
        .mobile-hexagon__trade strong { display: block; margin-top: 3px; color: ${COLORS.ink}; font-size: 11px; letter-spacing: .01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mobile-hexagon__stage { position: relative; width: 100%; height: clamp(385px, 103vw, 450px); margin: 13px auto 6px; }
        .mobile-hexagon__circuits { position: absolute; inset: 3% 0 1%; width: 100%; height: 96%; overflow: visible; pointer-events: none; }
        .mobile-hexagon__circuit { fill: none; stroke: ${COLORS.cyan}; stroke-width: .72; opacity: .38; stroke-linecap: round; stroke-linejoin: round; }
        .mobile-hexagon__pulse { fill: ${COLORS.cyan}; filter: drop-shadow(0 0 3px ${COLORS.cyan}); }
        .mobile-hexagon__seat { position: absolute; width: clamp(86px, 26vw, 108px); height: clamp(76px, 22vw, 92px); padding: 12px 9px; border: 1px solid #41626b; clip-path: polygon(25% 0, 75% 0, 100% 28%, 100% 72%, 75% 100%, 25% 100%, 0 72%, 0 28%); background: linear-gradient(145deg, #121a21, #080c10 72%); color: ${COLORS.ink}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease; z-index: 2; }
        .mobile-hexagon__seat::before { content: ""; position: absolute; inset: 4px; border: 1px solid #ffffff12; clip-path: inherit; }
        .mobile-hexagon__seat:hover, .mobile-hexagon__seat:focus-visible { transform: scale(1.04); border-color: ${COLORS.cyan}; outline: none; }
        .mobile-hexagon__seat.is-selected { border-color: ${COLORS.cyan}; box-shadow: 0 0 0 1px #4fd0e033, 0 0 22px #4fd0e044; background: linear-gradient(145deg, #15303a, #080c10 74%); }
        .mobile-hexagon__seat-label { position: relative; z-index: 1; max-width: 100%; color: ${COLORS.ink}; font-size: clamp(8px, 2.45vw, 10px); font-weight: 800; letter-spacing: .1em; text-align: center; }
        .mobile-hexagon__seat-state { position: relative; z-index: 1; width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 9px currentColor; }
        .top-seat { top: 0; left: 50%; transform: translateX(-50%); }
        .upper-left-seat { top: 18%; left: 0; }
        .upper-right-seat { top: 18%; right: 0; }
        .lower-left-seat { top: 55%; left: 0; }
        .lower-right-seat { top: 55%; right: 0; }
        .bottom-seat { bottom: 0; left: 50%; transform: translateX(-50%); }
        .top-seat:hover, .top-seat:focus-visible, .top-seat.is-selected, .bottom-seat:hover, .bottom-seat:focus-visible, .bottom-seat.is-selected { transform: translateX(-50%) scale(1.04); }
        .mobile-hexagon__core { position: absolute; left: 50%; top: 31%; transform: translateX(-50%); width: clamp(142px, 43vw, 178px); aspect-ratio: 1 / 1.06; padding: 25px 20px; clip-path: polygon(25% 0, 75% 0, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0 75%, 0 25%); background: linear-gradient(145deg, #12313a, #071419 72%); border: 0; display: grid; place-content: center; text-align: center; z-index: 3; filter: drop-shadow(0 0 13px #4fd0e055); }
        .mobile-hexagon__core::before { content: ""; position: absolute; inset: 5px; clip-path: inherit; border: 1px solid ${COLORS.cyan}; opacity: .78; }
        .mobile-hexagon__core > * { position: relative; z-index: 1; }
        .mobile-hexagon__core-label { color: ${COLORS.cyan}; font-size: 8px; font-weight: 800; letter-spacing: .17em; text-transform: uppercase; }
        .mobile-hexagon__decision { margin: 8px 0 4px; color: ${COLORS.ink}; font-size: clamp(17px, 5.4vw, 22px); font-weight: 900; letter-spacing: .08em; }
        .mobile-hexagon__consensus { color: ${COLORS.gold}; font-size: 9px; font-weight: 700; letter-spacing: .08em; }
        .mobile-hexagon__briefing { position: relative; margin: 8px 2px 0; border: 1px solid #263542; background: #0b1118d9; padding: 14px; }
        .mobile-hexagon__briefing-header { display: flex; align-items: center; gap: 8px; color: ${COLORS.steel}; font-size: 9px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
        .mobile-hexagon__briefing p { margin: 9px 0 0; color: #c1ccd7; font-size: 12px; line-height: 1.55; }
        .mobile-hexagon__pattern { margin: 11px 2px 0; color: ${COLORS.gold}; font-size: 10px; font-weight: 700; line-height: 1.5; letter-spacing: .04em; text-align: center; }
        @media (max-width: 355px) { .mobile-hexagon__shell { padding-left: 9px; padding-right: 9px; } .mobile-hexagon__stage { height: 370px; } .mobile-hexagon__seat { width: 82px; height: 72px; } }
        @media (prefers-reduced-motion: no-preference) { .mobile-hexagon__core { animation: core-breathe 3.2s ease-in-out infinite; } .mobile-hexagon__pulse { animation: signal-pulse 1.65s ease-in-out infinite alternate; } @keyframes core-breathe { 50% { filter: drop-shadow(0 0 20px #4fd0e080); } } @keyframes signal-pulse { to { opacity: .45; transform: scale(.82); } } }
      `}</style>

      <section className="mobile-hexagon__shell">
        <header className="mobile-hexagon__top">
          <div>
            <p className="mobile-hexagon__kicker">The Hexagon</p>
            <h1 className="mobile-hexagon__title">TRADE REVIEW COUNCIL</h1>
          </div>
          <button type="button" onClick={onExit} className="mobile-hexagon__exit">Exit</button>
        </header>

        {isSandbox && <div className="mobile-hexagon__sandbox">LOCAL SANDBOX · SAMPLE REVIEW · NO API CALL</div>}

        <section className="mobile-hexagon__trade" aria-label="Trade summary">
          <div><span>Trade</span><strong>{review.trade.symbol} · ×{review.trade.size}</strong></div>
          <div><span>Entry → exit</span><strong>${review.trade.entryPrice.toFixed(2)} → ${review.trade.exitPrice.toFixed(2)}</strong></div>
          <div><span>Outcome</span><strong style={{ color: outcomeColor }}>{formatMoney(review.trade.pnl)}</strong></div>
        </section>

        <section className="mobile-hexagon__stage" aria-label="Six-seat council">
          <svg className="mobile-hexagon__circuits" viewBox="0 0 100 100" aria-hidden="true">
            <path className="mobile-hexagon__circuit" d="M50 14V39M16 30 37 43M84 30 63 43M16 66 37 57M84 66 63 57M50 86V61" />
            <path className="mobile-hexagon__circuit" d="M50 14 16 30 16 66 50 86 84 66 84 30Z" opacity=".28" />
            {[[50, 39], [37, 43], [63, 43], [37, 57], [63, 57], [50, 61]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="mobile-hexagon__pulse" cx={cx} cy={cy} r="1.25" />)}
          </svg>

          {review.agents.map((seat, index) => {
            const active = index === selected;
            const color = seat.verdict === "mistake" ? COLORS.red : COLORS.green;
            return (
              <button
                key={seat.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(index)}
                className={`mobile-hexagon__seat ${SEAT_POSITIONS[index] || "top-seat"}${active ? " is-selected" : ""}`}
              >
                <span className="mobile-hexagon__seat-state" style={{ color, backgroundColor: color }} />
                <span className="mobile-hexagon__seat-label">{seatLabel(seat)}</span>
              </button>
            );
          })}

          <div className="mobile-hexagon__core" aria-label={`Forensic verdict: ${review.verdict.decision}`}>
            <span className="mobile-hexagon__core-label">Forensic verdict</span>
            <strong className="mobile-hexagon__decision">{review.verdict.decision}</strong>
            <span className="mobile-hexagon__consensus">{review.verdict.consensusMistake} mistake · {review.verdict.consensusDefensible} defense</span>
          </div>
        </section>

        <section className="mobile-hexagon__briefing" aria-live="polite">
          <div className="mobile-hexagon__briefing-header"><VerdictMark verdict={agent.verdict} /> {seatLabel(agent)} · {agent.verdict}</div>
          <p>{agent.text}</p>
        </section>
        <p className="mobile-hexagon__pattern">{summary}</p>
      </section>
    </main>
  );
}
