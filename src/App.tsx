import { ChangeEvent, useEffect, useRef, useState } from "react";
import Hexagon from "@/components/hexagon/Hexagon";
import MobileHexagon from "@/components/hexagon/MobileHexagon";
import OrbitDiagram from "@/components/hexagon/OrbitDiagram";
import { SeatIcon } from "@/components/hexagon/seatIcons";
import { SANDBOX_SCENARIOS, type SandboxScenario } from "@/components/hexagon/sandbox";
import type { HexagonReview } from "@/components/hexagon/sample";

const API_BASE_URL = (
  import.meta.env.VITE_HEXAGON_API_BASE_URL || "https://api.instance6.xyz"
).replace(/\/+$/, "");

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

function UploadPanel({ onReview, onOpenSandbox, serviceState }: { serviceState: string; onReview: (file: File) => void; onOpenSandbox: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [uploadAcknowledged, setUploadAcknowledged] = useState(false);
  const [acknowledgements, setAcknowledgements] = useState([false, false, false]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openUploadGate = () => {
    if (uploadAcknowledged) {
      fileInputRef.current?.click();
      return;
    }
    setShowDisclosure(true);
  };

  const acceptDisclosure = () => {
    setUploadAcknowledged(true);
    setShowDisclosure(false);
    requestAnimationFrame(() => fileInputRef.current?.click());
  };

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    if (!uploadAcknowledged) {
      event.target.value = "";
      setShowDisclosure(true);
      return;
    }
    const next = event.target.files?.[0] || null;
    setFile(next);
    if (next) onReview(next);
  };

  return (
    <main style={{ backgroundColor: "#090a0c", color: "#f1efe8", fontFamily: BODY_FONT }}>
      <style>{`@keyframes hxPulse { 50% { opacity: .5; } }`}</style>

      <nav
        className="relative flex items-center justify-between overflow-hidden"
        style={{ minHeight: 92, padding: "12px clamp(24px,5vw,80px)", borderBottom: "1px solid #25333a", background: "linear-gradient(90deg, #080b10 0%, #0b1017 52%, #080b10 100%)" }}
      >
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(45,212,191,.06) 48%, transparent 100%)" }} />
        <a href="#top" className="relative flex items-center gap-3" style={{ color: "#f1efe8", textDecoration: "none" }}>
          <span className="flex items-center justify-center overflow-hidden border" style={{ width: 96, height: 54, borderColor: "#356075", background: "#081018", boxShadow: "0 0 24px rgba(31,173,255,.18)", flexShrink: 0 }}>
            <img src="/hexagon-header-arc.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", mixBlendMode: "screen", display: "block" }} />
          </span>
          <span>
            <span className="block" style={{ letterSpacing: "0.18em", fontSize: "0.82rem", fontWeight: 900 }}>THE HEXAGON</span>
            <span className="mt-1 block" style={{ color: ACID, fontFamily: MONO, letterSpacing: "0.16em", fontSize: "0.6rem", fontWeight: 700 }}>TRADE REVIEW COUNCIL</span>
          </span>
        </a>
        <div className="relative hidden items-center gap-3 sm:flex" style={{ color: "#85898c", fontFamily: MONO, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: ACID, boxShadow: `0 0 12px ${ACID}` }} />
          FORENSIC TRADE REVIEW
        </div>
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
          {serviceState}
        </div>

        <div className="relative">
          <div>
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
              <input ref={fileInputRef} className="sr-only" type="file" accept=".csv,text/csv" onChange={chooseFile} />
              <button
                type="button"
                onClick={openUploadGate}
                className="mt-3 block w-full cursor-pointer border border-dashed p-8 text-center transition-colors"
                style={{ borderColor: "#3a3c3f", backgroundColor: "#111315" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACID; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3a3c3f"; }}
              >
                <span className="block font-bold uppercase" style={{ color: ACID, fontFamily: MONO, fontSize: "0.78rem", letterSpacing: "0.12em" }}>
                  {file ? `Reviewing ${file.name}` : "Select completed-trades CSV"}
                </span>
                <span className="mt-3 block text-xs" style={{ color: "#85898c" }}>Maximum 500 rows / 1 MB</span>
              </button>

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
                  <p className="mt-2 leading-5">Your CSV is sent to the review service to generate analysis. Do not upload credentials, account numbers, or other sensitive personal data.</p>
                </div>
              </div>

              {!API_BASE_URL && (
                <p className="mt-7 border-l-2 pl-3 text-xs leading-5" style={{ borderColor: "#ff6b6b", color: "#e39a9a" }}>
                  The live council is not configured yet. Set <code>VITE_HEXAGON_API_BASE_URL</code> when the Hexagon API service is deployed.
                </p>
              )}
            </div>
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
        id="footer"
        className="relative"
        style={{ borderTop: "1px solid #25333a", padding: "54px clamp(24px,8vw,128px) 28px", background: "#050607" }}
      >
        <div className="relative grid gap-10 md:grid-cols-[1.35fr_.7fr_.95fr] md:gap-8">
          <div>
            <a href="#top" className="flex items-center gap-3" style={{ color: "#f1efe8", textDecoration: "none" }}>
              <span className="flex items-center justify-center overflow-hidden border" style={{ width: 46, height: 46, borderColor: "#356075", background: "#081018", flexShrink: 0 }}>
                <img src="/hexagon-header-arc.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "screen", transform: "scale(1.08)", display: "block" }} />
              </span>
              <span>
                <span className="block" style={{ letterSpacing: "0.15em", fontSize: "0.8rem", fontWeight: 900 }}>THE HEXAGON</span>
                <span className="mt-1 block" style={{ color: ACID, fontFamily: MONO, letterSpacing: "0.14em", fontSize: "0.57rem", fontWeight: 700 }}>TRADE REVIEW COUNCIL</span>
              </span>
            </a>
            <p className="mt-5 max-w-sm text-sm leading-6" style={{ color: "#929a9e" }}>A six-seat AI review room for examining completed trades with sharper questions and clearer context.</p>
          </div>

          <div>
            <p style={{ color: "#d8dad6", fontFamily: MONO, fontSize: "0.64rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>Explore</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <a href="#top" style={{ color: "#929a9e", textDecoration: "none" }}>Upload a review</a>
              <a href="#council-title" style={{ color: "#929a9e", textDecoration: "none" }}>How the council works</a>
              <button type="button" onClick={onOpenSandbox} className="w-fit text-left" style={{ color: "#929a9e", background: "transparent", border: 0, padding: 0, cursor: "pointer", fontSize: "0.875rem" }}>Explore the local sandbox</button>
            </div>
          </div>

          <div>
            <p style={{ color: "#d8dad6", fontFamily: MONO, fontSize: "0.64rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>Data & disclosures</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <button type="button" onClick={() => setShowDisclosure(true)} className="w-fit text-left" style={{ color: "#929a9e", background: "transparent", border: 0, padding: 0, cursor: "pointer", fontSize: "0.875rem" }}>Review data acknowledgement</button>
              <span style={{ color: "#929a9e" }}>Educational analysis only</span>
              <span style={{ color: "#929a9e" }}>No investment, legal, or tax advice</span>
            </div>
          </div>
        </div>
        <div className="relative mt-12 flex flex-col gap-3 border-t pt-5 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "#202a2e", color: "#667176", fontFamily: MONO, letterSpacing: "0.08em" }}>
          <span>© 2026 SYNTHETIC SIX. ALL RIGHTS RESERVED.</span>
          <span>USE OF THIS BETA IS SUBJECT TO THE REVIEW DATA ACKNOWLEDGEMENT.</span>
        </div>
      </footer>

      {showDisclosure && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation" style={{ background: "rgba(2,4,7,.82)", backdropFilter: "blur(8px)" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="upload-disclosure-title" className="w-full max-w-2xl border p-6 sm:p-8" style={{ background: "#0b111a", borderColor: "#25465b", boxShadow: "0 20px 80px rgba(0,0,0,.55)" }}>
            <p style={{ color: ACID, fontFamily: MONO, fontWeight: 800, fontSize: "0.66rem", letterSpacing: "0.16em", textTransform: "uppercase" }}>Before you upload</p>
            <h2 id="upload-disclosure-title" className="mt-3 uppercase" style={{ color: "#f1efe8", fontWeight: 900, fontSize: "clamp(1.65rem,4vw,2.5rem)", lineHeight: .95, letterSpacing: "-0.04em" }}>Review data acknowledgement</h2>
            <p className="mt-4 text-sm leading-6" style={{ color: "#a8b6c2" }}>The Hexagon is an early-stage trade review tool. Your CSV is sent to the AI review service to generate analysis. It is not a brokerage, custodian, or financial adviser.</p>
            <div className="mt-6 grid gap-3">
              {[
                "I understand the output is educational and informational only, and is not investment, financial, legal, tax, or trading advice.",
                "I will upload only completed-trade data that I am authorized to share. I will not include passwords, API keys, account or payment numbers, recovery phrases, or other sensitive personal information.",
                "I understand this beta service may change, fail, or be unavailable, and that no trading result or outcome is guaranteed.",
              ].map((label, index) => (
                <label key={label} className="flex cursor-pointer gap-3 border p-4" style={{ borderColor: acknowledgements[index] ? "#2a7a79" : "#25333a", background: acknowledgements[index] ? "rgba(45,212,191,.07)" : "#0d151f" }}>
                  <input type="checkbox" checked={acknowledgements[index]} onChange={(event) => setAcknowledgements((current) => current.map((value, currentIndex) => currentIndex === index ? event.target.checked : value))} style={{ accentColor: ACID, marginTop: 3 }} />
                  <span className="text-sm leading-6" style={{ color: "#c1ccd4" }}>{label}</span>
                </label>
              ))}
            </div>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowDisclosure(false)} className="border px-5 py-3 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#b5bec4", borderColor: "#31414a", background: "transparent", fontFamily: MONO }}>Cancel</button>
              <button type="button" disabled={!acknowledgements.every(Boolean)} onClick={acceptDisclosure} className="px-5 py-3 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: acknowledgements.every(Boolean) ? "#061010" : "#758187", background: acknowledgements.every(Boolean) ? ACID : "#253138", cursor: acknowledgements.every(Boolean) ? "pointer" : "not-allowed", fontFamily: MONO }}>Acknowledge & select CSV</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default function App() {
  const [review, setReview] = useState<HexagonReview | null>(null);
  const [sandboxScenario, setSandboxScenario] = useState<SandboxScenario | null>(null);
  const [isSandbox, setIsSandbox] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serviceState, setServiceState] = useState("CHECKING SERVICE");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch(`${API_BASE_URL}/v1/status`, { signal: controller.signal })
      .then(async (response) => {
        const status = await response.json();
        if (active) setServiceState(response.ok && status.ready ? "API CONFIGURED" : "REVIEWS UNAVAILABLE");
      })
      .catch(() => { if (active) setServiceState("SERVICE UNREACHABLE"); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, []);

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
        signal: AbortSignal.timeout(75_000),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.review) {
        if (res.status >= 500) setServiceState("REVIEWS UNAVAILABLE");
        throw new Error(data?.error || "The council could not complete the review. Please try again.");
      }
      setServiceState("LAST REVIEW COMPLETED");
      setReview(data.review as HexagonReview);
      setSandboxScenario(null);
      setIsSandbox(false);
    } catch (error) {
      if ((error as Error).name === "TimeoutError" || error instanceof TypeError) setServiceState("SERVICE UNREACHABLE");
      setNotice((error as Error).name === "TimeoutError" ? "The review timed out. Please try again or explore the sandbox." : (error as Error).message || "The council could not review that file.");
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
        <UploadPanel serviceState={serviceState} onReview={runReview} onOpenSandbox={() => {
          const firstScenario = SANDBOX_SCENARIOS[0];
          setReview(firstScenario.review);
          setSandboxScenario(firstScenario);
          setIsSandbox(true);
          setNotice(null);
        }} />
        {notice && <div role="alert" className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,620px)] -translate-x-1/2 border px-4 py-3 text-center text-sm" style={{ backgroundColor: "#160b10", borderColor: "#ff5d5d", color: "#ffb0b0" }}>{notice}</div>}
      </>
    );
  }

  return (
    <>
      <div className="hidden xl:block">
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
      <div className="xl:hidden">
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
