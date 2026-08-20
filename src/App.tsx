import { ChangeEvent, useState } from "react";
import Hexagon from "@/components/hexagon/Hexagon";
import type { HexagonReview } from "@/components/hexagon/sample";

const API_BASE_URL = (import.meta.env.VITE_HEXAGON_API_BASE_URL || "").replace(/\/+$/, "");

const CSV_HEADERS = "symbol,entry_date,exit_date,entry_price,exit_price,size";

function UploadPanel({ onReview }: { onReview: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] || null;
    setFile(next);
    if (next) onReview(next);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-5 py-12"
      style={{ background: "radial-gradient(circle at 50% 20%, #102d38 0%, #07090d 42%, #030407 100%)", color: "#e8eef5" }}
    >
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
    </main>
  );
}

export default function App() {
  const [review, setReview] = useState<HexagonReview | null>(null);
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
        <UploadPanel onReview={runReview} />
        {notice && <div className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,620px)] -translate-x-1/2 border px-4 py-3 text-center text-xs" style={{ backgroundColor: "#160b10", borderColor: "#ff5d5d", color: "#ffb0b0" }}>{notice}</div>}
      </>
    );
  }

  return (
    <>
      <button onClick={() => { setReview(null); setNotice(null); }} className="fixed left-4 top-4 z-[60] border px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4fd0e0", backgroundColor: "#080c10e6", borderColor: "#1b8da2" }}>Review another CSV</button>
      <Hexagon review={review} autoPlay={true} />
    </>
  );
}
