import { ChangeEvent, useState } from "react";
import Hexagon from "@/components/hexagon/Hexagon";
import MobileHexagon from "@/components/hexagon/MobileHexagon";
import OrbitDiagram from "@/components/hexagon/OrbitDiagram";
import TeaserScene from "@/components/hexagon/TeaserScene";
import { SeatIcon } from "@/components/hexagon/seatIcons";
import { SANDBOX_SCENARIOS, type SandboxScenario } from "@/components/hexagon/sandbox";
import type { HexagonReview } from "@/components/hexagon/sample";

const API_BASE_URL = (import.meta.env.VITE_HEXAGON_API_BASE_URL || "").replace(/\/+$/, "");

const CSV_HEADERS = "symbol,entry_date,exit_date,entry_price,exit_price,size";

const ACID = "#2dd4bf";
const ACID2 = "#a78bfa";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const BODY_FONT = "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";

const SEATS = [
  { id: "risk_manager", name: "Aegis", role: "Risk", line: "Was there a predefined stop — or did discretion do the deciding?" },
  { id: "quant", name: "The Archon", role: "Quant", line: "Is this move signal, or noise inside the volatility band?" },
  { id: "behavioral", name: "The Psyops Agent", role: "Behavioral", line: "Did the exit track a plan, or track price pain?" },
  { id: "contrarian", name: "The Heretic", role: "Contrarian", line: "Steelmans the exit first, then tells you if it still holds." },
  { id: "regime", name: "Cerberus", role: "Regime Class", line: "Checks the trade against the prevailing trend, not just the tape." },
  { id: "devils_advocate", name: "The Sentinel", role: "Defense", line: "Argues the case for you — constraints the other five can't see." },
] as const;

function UploadPanel({ onReview, onOpenSandbox }: { onReview: (file: File) => void; onOpenSandbox: () => void }) {
  const [file, setFile] = useState<File | null>(null);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] || null;
    setFile(next);
    if (next) onReview(next);
  };

  return (
    <main style={{ backgroundColor: "#090a0c", color: "#f1efe8", fontFamily: BODY_FONT }}>
      <style>{`@keyframes hxPulse { 50% { opacity: .5; } }`}</style>

      <nav
        className="flex items-center justify-between"
        style={{ height: 82, padding: "0 clamp(24px,5vw,80px)", borderBottom: "1px solid #2a2c2f" }}
      >
        <a href="#top" className="flex items-center gap-3" style={{ letterSpacing: "0.16em", fontSize: "0.8rem", fontWeight: 800 }}>
          <svg aria-hidden="true" width="25" height="28" viewBox="0 0 32 36" style={{ flexShrink: 0, display: "block" }}>
            <polygon points="16,0 30.4,9 30.4,27 16,36 1.6,27 1.6,9" fill="none" stroke={ACID} strokeWidth="1.6" />
            <polygon points="16,8.1 23.92,13.05 23.92,22.95 16,27.9 8.08,22.95 8.08,13.05" fill="none" stroke={ACID} strokeWidth="1.1" opacity="0.6" />
            <polygon points="16,13 22.5,15.5 16,18 9.5,15.5" fill={ACID} opacity="0.95" />
            <polygon points="9.5,15.5 16,18 16,25.5 9.5,23" fill={ACID} opacity="0.55" />
            <polygon points="16,18 22.5,15.5 22.5,23 16,25.5" fill={ACID} opacity="0.75" />
            <polygon points="16,26.8 18.2,27.65 16,28.5 13.8,27.65" fill={ACID} opacity="0.85" />
            <polygon points="13.8,27.65 16,28.5 16,31 13.8,30.15" fill={ACID} opacity="0.5" />
            <polygon points="16,28.5 18.2,27.65 18.2,30.15 16,31" fill={ACID} opacity="0.65" />
          </svg>
          <span>THE HEXAGON</span>
        </a>
      </nav>

      <section
        id="top"
        className="relative overflow-hidden"
        style={{ minHeight: "calc(100vh - 82px)", padding: "clamp(60px,10vh,110px) clamp(24px,8vw,128px)" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(9,10,12,.94) 0%, rgba(9,10,12,.76) 48%, rgba(9,10,12,.88) 100%), url('/council-network-background.jpg')",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            filter: "saturate(1.05) contrast(1.08)",
            opacity: 0.22,
          }}
        />
        <div
          className="absolute hidden sm:flex items-center"
          style={{ top: 42, right: "clamp(24px,8vw,128px)", color: "#85898c", fontFamily: MONO, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.14em" }}
        >
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: ACID, boxShadow: `0 0 14px ${ACID}`, marginRight: 8, animation: "hxPulse 1.8s infinite" }} />
          {API_BASE_URL ? "COUNCIL ONLINE" : "SYSTEM IN FORMATION"}
        </div>

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div className="order-2 lg:order-1">
            <p style={{ color: ACID, fontFamily: MONO, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Six perspectives. One forensic verdict.
            </p>
            <h1
              className="uppercase"
              style={{ letterSpacing: "-0.06em", maxWidth: 970, margin: "22px 0 26px", fontSize: "clamp(2.6rem,6.5vw,6rem)", fontWeight: 900, lineHeight: 0.88 }}
            >
              Your trades.
              <br />
              <span style={{ color: ACID2 }}>Under scrutiny.</span>
            </h1>
            <p style={{ color: "#a4a5a2", maxWidth: 650, margin: "0 0 36px", fontSize: "clamp(1.05rem,1.5vw,1.3rem)", lineHeight: 1.7 }}>
              The Hexagon is an AI trade-review council built to challenge every assumption behind your completed trades — without flattery, hindsight theater, or easy answers.
            </p>

            <div style={{ width: "min(100%, 520px)" }}>
              <p style={{ color: ACID, fontFamily: MONO, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                Convene the council
              </p>
              <label
                className="mt-3 block cursor-pointer border border-dashed p-8 text-center transition-colors"
                style={{ borderColor: "#3a3c3f", backgroundColor: "#111315" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACID; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3a3c3f"; }}
              >
                <input className="sr-only" type="file" accept=".csv,text/csv" onChange={chooseFile} />
                <span className="block font-bold uppercase" style={{ color: ACID, fontFamily: MONO, fontSize: "0.78rem", letterSpacing: "0.12em" }}>
                  {file ? `Reviewing ${file.name}` : "Select completed-trades CSV"}
                </span>
                <span className="mt-3 block text-xs" style={{ color: "#85898c" }}>Maximum 500 rows / 1 MB</span>
              </label>

              <button
                type="button"
                onClick={onOpenSandbox}
                className="mt-3 w-full border px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors"
                style={{ borderColor: "#3a3c3f", backgroundColor: "transparent", color: "#d8dad6", fontFamily: MONO }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACID; e.currentTarget.style.color = ACID; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3a3c3f"; e.currentTarget.style.color = "#d8dad6"; }}
              >
                Open local sandbox — no API call
              </button>

              <div className="mt-7 grid gap-4 text-xs sm:grid-cols-2" style={{ color: "#85898c" }}>
                <div>
                  <p className="font-bold uppercase tracking-widest" style={{ color: "#d8dad6" }}>Required columns</p>
                  <code className="mt-2 block break-all leading-5" style={{ fontFamily: MONO }}>{CSV_HEADERS}</code>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-widest" style={{ color: "#d8dad6" }}>Privacy & scope</p>
                  <p className="mt-2 leading-5">Files are processed for the review only and are not stored by this service. This is educational analysis, not investment advice.</p>
                </div>
              </div>

              {!API_BASE_URL && (
                <p className="mt-7 border-l-2 pl-3 text-xs leading-5" style={{ borderColor: "#ff6b6b", color: "#e39a9a" }}>
                  The live council is not configured yet. Set <code>VITE_HEXAGON_API_BASE_URL</code> when the Hexagon API service is deployed.
                </p>
              )}
            </div>
          </div>

          <div className="order-1 relative h-[340px] overflow-hidden border sm:h-[420px] lg:order-2 lg:h-[560px]" style={{ borderColor: "#2a2c2f", backgroundColor: "#07090d" }}>
            <TeaserScene />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="council-title"
        className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-[7vw]"
        style={{ borderTop: "1px solid #2a2c2f", background: "#0c0d0f", padding: "80px clamp(24px,8vw,128px)" }}
      >
        <div>
          <p style={{ color: ACID, fontFamily: MONO, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            01 / The council
          </p>
          <h2
            id="council-title"
            className="uppercase"
            style={{ letterSpacing: "-0.04em", margin: "24px 0 30px", fontSize: "clamp(2rem,4.2vw,4rem)", lineHeight: 0.94, fontWeight: 900 }}
          >
            No single model
            <br />
            gets the final word.
          </h2>
          <p style={{ color: "#91938f", maxWidth: 480, fontSize: "1.05rem", lineHeight: 1.7 }}>
            Upload a completed-trades CSV. Six independent reviewers interrogate the evidence in parallel, then deliberate toward a clear, actionable verdict.
          </p>
          <p style={{ marginTop: 14, fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#4a525c" }}>
            ↓ Scroll — the council convenes as you go
          </p>
        </div>
        <OrbitDiagram />
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <p className="text-center" style={{ color: ACID, fontFamily: MONO, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase" }}>
          The six seats
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SEATS.map((seat) => (
            <div
              key={seat.name}
              className="border p-5 transition-colors"
              style={{ borderColor: "#2a2c2f", backgroundColor: "#111315" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACID; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2c2f"; }}
            >
              <div className="flex items-center gap-2">
                <SeatIcon id={seat.id} style={{ width: 16, height: 16, color: ACID, flexShrink: 0 }} />
                <p className="text-sm font-bold" style={{ color: "#f1efe8" }}>
                  {seat.name} <span style={{ color: ACID }}>— {seat.role}</span>
                </p>
              </div>
              <p className="mt-2 text-xs leading-5" style={{ color: "#85898c" }}>{seat.line}</p>
            </div>
          ))}
        </div>
      </section>

      <footer
        className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderTop: "1px solid #2a2c2f", padding: "50px clamp(24px,8vw,128px)" }}
      >
        <div>
          <p style={{ letterSpacing: "-0.03em", color: ACID, margin: 0, fontSize: "clamp(1.8rem,5vw,4rem)", fontWeight: 900 }}>THE HEXAGON</p>
          <small style={{ color: "#666b6e", fontFamily: MONO, fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.2em", marginTop: 8, display: "block" }}>
            INSTANCE6.XYZ
          </small>
        </div>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: "0.68rem", lineHeight: 1.5, letterSpacing: "0.14em", color: "#777b7d", textAlign: "right" }}>
          BUILT FOR TRADERS WHO WANT THE TRUTH.
          <br />
          Educational analysis, not investment advice.
        </span>
      </footer>
    </main>
  );
}

export default function App() {
  const [review, setReview] = useState<HexagonReview | null>(null);
  const [sandboxScenario, setSandboxScenario] = useState<SandboxScenario | null>(null);
  const [isSandbox, setIsSandbox] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runReview = async (file: File) => {
    if (!API_BASE_URL) {
      setNotice("The live council is not configured yet. Deploy the Hexagon API and set VITE_HEXAGON_API_BASE_URL.");
      return;
    }
    if (file.size > 1_000_000) {
      setNotice("That file is over the 1 MB review limit.");
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const csv = await file.text();
      const res = await fetch(`${API_BASE_URL}/v1/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.review) throw new Error(data?.error || `HTTP ${res.status}`);
      setReview(data.review as HexagonReview);
      setSandboxScenario(null);
      setIsSandbox(false);
    } catch (error) {
      setNotice((error as Error).message || "The council could not review that file.");
    } finally {
      setLoading(false);
    }
  };

  if (!review && loading) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "#07090d",
          color: "#4fd0e0",
          fontFamily: "'Orbitron', system-ui, sans-serif",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          fontSize: 12,
        }}
      >
        Six seats are reviewing the trade data…
      </div>
    );
  }

  if (!review) {
    return (
      <>
        <UploadPanel onReview={runReview} onOpenSandbox={() => {
          const firstScenario = SANDBOX_SCENARIOS[0];
          setReview(firstScenario.review);
          setSandboxScenario(firstScenario);
          setIsSandbox(true);
          setNotice(null);
        }} />
        {notice && <div className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,620px)] -translate-x-1/2 border px-4 py-3 text-center text-xs" style={{ backgroundColor: "#160b10", borderColor: "#ff5d5d", color: "#ffb0b0" }}>{notice}</div>}
      </>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Hexagon
          review={review}
          autoPlay={true}
          onExit={() => { setReview(null); setNotice(null); setSandboxScenario(null); setIsSandbox(false); }}
          isSandbox={isSandbox}
          sandboxScenario={sandboxScenario ?? undefined}
          scenarios={isSandbox ? SANDBOX_SCENARIOS : undefined}
          onScenarioChange={(scenario) => { setSandboxScenario(scenario); setReview(scenario.review); }}
        />
      </div>
      <div className="md:hidden">
        <MobileHexagon
          key={sandboxScenario?.id || "live-review"}
          review={review}
          isSandbox={isSandbox}
          scenario={sandboxScenario ?? undefined}
          scenarios={isSandbox ? SANDBOX_SCENARIOS : undefined}
          onScenarioChange={(scenario) => { setSandboxScenario(scenario); setReview(scenario.review); }}
          onExit={() => { setReview(null); setNotice(null); setSandboxScenario(null); setIsSandbox(false); }}
        />
      </div>
    </>
  );
}
