import { useEffect, useState } from "react";
import Hexagon from "@/components/hexagon/Hexagon";
import { SAMPLE, type HexagonReview } from "@/components/hexagon/sample";

// Point this at a running council backend to run live; otherwise the sample shows.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// Demo trades used until the page is wired into a real upload flow.
const DEMO_CSV = [
  "symbol,entry_date,exit_date,entry_price,exit_price,size",
  "SPY,2026-06-02,2026-06-05,410.50,405.00,10",
  "BTC,2026-06-15,2026-06-20,60000,54000,1",
].join("\n");

const panelStyle = {
  backgroundColor: "#0d1117",
  fontSize: 11,
  textAlign: "center" as const,
  padding: "6px 12px",
  letterSpacing: "0.04em",
};

export default function App() {
  const [review, setReview] = useState<HexagonReview | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // No backend configured -> go straight to the sample, no failed fetch.
    if (!API_BASE_URL) {
      setReview(SAMPLE);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/hexagon/review`, {
          method: "POST",
          headers: { "content-type": "text/csv" },
          body: DEMO_CSV,
        });
        const data = await res.json();
        if (!res.ok || !data?.review) throw new Error(data?.error || `HTTP ${res.status}`);
        if (alive) setReview(data.review as HexagonReview);
      } catch (e) {
        if (alive) {
          setNotice(`Live council unavailable (${(e as Error).message}) — showing sample.`);
          setReview(SAMPLE);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!review) {
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
        Convening the Hexagon…
      </div>
    );
  }

  return (
    <>
      <div style={{ ...panelStyle, color: "#e0a53a" }}>
        Illustrative demonstration — the data and figures here are hypothetical and for example
        purposes only.
      </div>
      {notice && <div style={{ ...panelStyle, color: "#ff5d5d" }}>{notice}</div>}
      <Hexagon review={review} autoPlay={true} />
    </>
  );
}
