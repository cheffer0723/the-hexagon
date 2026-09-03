import type { SVGProps } from "react";

// One glyph per council seat, keyed by the agent id used throughout the
// app (sample.ts, sandbox.ts). Stroke-based so a single color prop (or
// currentColor) carries the icon in any context — acid green on the
// marketing page, cyan in the live review.
export type SeatIconId = "risk_manager" | "quant" | "behavioral" | "contrarian" | "regime" | "devils_advocate";

const PATHS: Record<SeatIconId, string> = {
  // Aegis — Risk: a bare shield (exposure, unresolved)
  risk_manager: "M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z",
  // The Archon — Quant: ascending bars
  quant: "M5 19 V13 M11 19 V9 M17 19 V5",
  // The Psyops Agent — Behavioral: an eye, reading intent
  behavioral:
    "M2 12 C5 6 8.5 5 12 5 C15.5 5 19 6 22 12 C19 18 15.5 19 12 19 C8.5 19 5 18 2 12 Z " +
    "M12 14.3 A2.3 2.3 0 1 0 12 9.7 A2.3 2.3 0 1 0 12 14.3 Z",
  // The Heretic — Contrarian: against the grain
  contrarian: "M6 8 L12 16 L18 8",
  // Cerberus — Regime Class: the trend line, watched for a break
  regime: "M3 17 L8 9 L12 13 L16 6 L21 12",
  // The Sentinel — Defense: a shield, the case confirmed
  devils_advocate: "M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z M9 12 L11.2 14.2 L15.5 9.5",
};

export function SeatIcon({ id, ...props }: { id: SeatIconId } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d={PATHS[id]} />
    </svg>
  );
}
