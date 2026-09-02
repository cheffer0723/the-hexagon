import { ChangeEvent, useState } from "react";
import Hexagon from "@/components/hexagon/Hexagon";
import MobileHexagon from "@/components/hexagon/MobileHexagon";
import { SANDBOX_SCENARIOS, type SandboxScenario } from "@/components/hexagon/sandbox";
import type { HexagonReview } from "@/components/hexagon/sample";

const API_BASE_URL = (import.meta.env.VITE_HEXAGON_API_BASE_URL || "").replace(/\/+$/, "");

const CSV_HEADERS = "symbol,entry_date,exit_date,entry_price,exit_price,size";

const SEATS = [
  { name: "Aegis", role: "Risk", line: "Was there a predefined stop — or did discretion do the deciding?" },
  { name: "The Archon", role: "Quant", line: "Is this move signal, or noise inside the volatility band?" },
  { name: "The Psyops Agent", role: "Behavioral", line: "Did the exit track a plan, or track price pain?" },
  { name: "The Heretic", role: "Contrarian", line: "Steelmans the exit first, then tells you if it still holds." },
  { name: "Cerberus", role: "Regime Class", line: "Checks the trade against the prevailing trend, not just the tape." },
  { name: "The Sentinel", role: "Defense", line: "Argues the case for you — constraints the other five can't see." },
] as const;

const STEPS = [
  { n: "01", title: "Upload", body: "Drop a completed-trades CSV — symbol, entry/exit date, entry/exit price, size." },
  { n: "02", title: "Deliberate", body: "Six independent OpenAI seats review the most instructive trade in parallel, on-screen." },
  { n: "03", title: "Verdict", body: "One forensic verdict: consensus, dissent, and what holding instead would have cost." },
] as const;

function UploadPanel({ onReview, onOpenSandbox }: { onReview: (file: File) => void; onOpenSandbox: () => void }) {
  const [file, setFile] = useState<File | null>(null);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] || null;
    setFile(next);
    if (next) onReview(next);
  };

  return (
    <main
      className="min-h-screen px-5 py-12"
      style={{ background: "radial-gradient(circle at 50% 20%, #102d38 0%, #07090d 42%, #030407 100%)", color: "#e8eef5" }}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-16">
        <section className="w-full max-w-2xl border p-7 sm:p-10" style={{ backgroundColor: "#0d1117e6", borderColor: "#1b8da2", boxShadow: "0 0 42px rgba(79,208,224,.16)" }}>
          <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: "#4fd0e0" }}>The Hexagon // trade review council</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight">CONVENE THE COUNCIL</h1>
          <p className="mt-5 max-w-xl text-sm leading-6" style={{ color: "#aebac8" }}>
            Upload a completed-trades CSV. Six independent OpenAI seats review the most instructive trade against the configured engine signals and return one forensic verdict.
          </p>

          <label className="mt-8 block cursor-pointer border border-dashed p-8 text-center transition-colors hover:border-[#4fd0e0]" style={{ borderColor: "#395262", backgroundColor: "#080c10" }}>
            <input className="sr-only" type="file" accept=".csv,text/csv" onChange={chooseFile} />
            <span className="block text-xs font-bold uppercase tracking-[0.24em]" style={{ color: "#4fd0e0" }}>
              {file ? `Reviewing ${file.name}` : "Select completed-trades CSV"}
            </span>
            <span className="mt-3 block text-xs" style={{ color: "#8a97a8" }}>Maximum 500 rows / 1 MB</span>
          </label>

          <button
            type="button"
            onClick={onOpenSandbox}
            className="mt-4 w-full border px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
            style={{ borderColor: "#59636d", backgroundColor: "#0a0f14", color: "#d6e3ed" }}
          >
            Open local sandbox — no API call
          </button>

          <div className="mt-7 grid gap-4 text-xs sm:grid-cols-2" style={{ color: "#8a97a8" }}>
            <div>
              <p className="font-bold uppercase tracking-widest" style={{ color: "#d4af37" }}>Required columns</p>
              <code className="mt-2 block break-all leading-5">{CSV_HEADERS}</code>
            </div>
            <div>
              <p className="font-bold uppercase tracking-widest" style={{ color: "#d4af37" }}>Privacy & scope</p>
              <p className="mt-2 leading-5">Files are processed for the review only and are not stored by this service. This is educational analysis, not investment advice.</p>
            </div>
          </div>

          {!API_BASE_URL && (
            <p className="mt-7 border-l-2 pl-3 text-xs leading-5" style={{ borderColor: "#ff5d5d", color: "#ffb0b0" }}>
              The live council is not configured yet. Set <code>VITE_HEXAGON_API_BASE_URL</code> when the Hexagon API service is deployed.
            </p>
          )}
        </section>

        <section className="w-full">
          <p className="text-center text-[10px] uppercase tracking-[0.35em]" style={{ color: "#4fd0e0" }}>How it works</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="border p-5" style={{ borderColor: "#1c2833", backgroundColor: "#0a0f14" }}>
                <p className="text-2xl font-black" style={{ color: "#d4af37" }}>{step.n}</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-wider">{step.title}</p>
                <p className="mt-2 text-xs leading-5" style={{ color: "#8a97a8" }}>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full">
          <p className="text-center text-[10px] uppercase tracking-[0.35em]" style={{ color: "#4fd0e0" }}>The six seats</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SEATS.map((seat) => (
              <div key={seat.name} className="border p-5" style={{ borderColor: "#1c2833", backgroundColor: "#0a0f14" }}>
                <p className="text-sm font-bold" style={{ color: "#e8eef5" }}>
                  {seat.name} <span style={{ color: "#4fd0e0" }}>— {seat.role}</span>
                </p>
                <p className="mt-2 text-xs leading-5" style={{ color: "#8a97a8" }}>{seat.line}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="w-full border-t pt-6 text-center text-[10px] uppercase tracking-[0.25em]" style={{ borderColor: "#1c2833", color: "#59636d" }}>
          The Hexagon — educational analysis, not investment advice.
        </footer>
      </div>
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
        <button onClick={() => { setReview(null); setNotice(null); setSandboxScenario(null); setIsSandbox(false); }} className="fixed left-4 top-4 z-[60] border px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4fd0e0", backgroundColor: "#080c10e6", borderColor: "#1b8da2" }}>Review another CSV</button>
        {isSandbox && sandboxScenario && (
          <aside className="fixed right-4 top-4 z-[60] w-64 border p-4" style={{ backgroundColor: "#080c10ee", borderColor: "#1b8da2", boxShadow: "0 0 26px rgba(79,208,224,.14)" }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "#4fd0e0" }}>Local sandbox · no API call</p>
            <p className="mt-2 text-sm font-bold" style={{ color: "#e8eef5" }}>{sandboxScenario.title}</p>
            <p className="mt-1 text-[11px] leading-4" style={{ color: "#8a97a8" }}>{sandboxScenario.lesson}</p>
            <div className="mt-3 grid gap-2">
              {SANDBOX_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => { setSandboxScenario(scenario); setReview(scenario.review); }}
                  className="border px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider"
                  style={{ borderColor: scenario.id === sandboxScenario.id ? "#d4af37" : "#263542", color: scenario.id === sandboxScenario.id ? "#d4af37" : "#aebac8", backgroundColor: scenario.id === sandboxScenario.id ? "#d4af3712" : "transparent" }}
                >
                  {scenario.title}
                </button>
              ))}
            </div>
            <p className="mt-4 border-t pt-3 text-[10px] leading-4" style={{ borderColor: "#263542", color: "#8a97a8" }}>
              <span style={{ color: "#4fd0e0" }}>Signal:</span> {sandboxScenario.evidence.signal}
            </p>
          </aside>
        )}
        <Hexagon review={review} autoPlay={true} />
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
