const ACID = "#d7ff3f";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const ROLES = [
  { n: "01", name: "RISK", cls: "role-1", pos: { top: "2%", left: "50%", transform: "translateX(-50%)" } },
  { n: "02", name: "QUANT", cls: "role-2", pos: { top: "26%", right: "-7%" } },
  { n: "03", name: "BEHAVIORAL", cls: "role-3", pos: { bottom: "22%", right: "-9%" } },
  { n: "04", name: "CONTRARIAN", cls: "role-4", pos: { bottom: "2%", left: "50%", transform: "translateX(-50%)" } },
  { n: "05", name: "REGIME", cls: "role-5", pos: { bottom: "22%", left: "-5%" } },
  { n: "06", name: "DEVIL'S ADVOCATE", cls: "role-6", pos: { top: "26%", left: "-10%" } },
] as const;

export default function OrbitDiagram() {
  return (
    <div
      className="orbit-diagram relative mx-auto"
      style={{ aspectRatio: "1", border: "1px solid #292c2e", borderRadius: "50%", width: "min(44vw, 460px)" }}
      aria-label="The six reviewer roles"
    >
      <style>{`
        @media (max-width: 760px) {
          .orbit-diagram { width: min(82vw, 420px) !important; }
          .orbit-diagram .role-2 { right: -3% !important; }
          .orbit-diagram .role-3 { right: -4% !important; }
          .orbit-diagram .role-5 { left: -3% !important; }
          .orbit-diagram .role-6 { left: -4% !important; }
        }
      `}</style>
      <div
        className="absolute flex flex-col items-center justify-center text-center"
        style={{
          aspectRatio: "1", background: ACID, color: "#090a0c",
          clipPath: "polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)",
          width: 108, top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        }}
      >
        <span style={{ fontSize: "2.2rem", fontWeight: 900, lineHeight: 1 }}>6</span>
        <small style={{ fontFamily: MONO, fontWeight: 700, fontSize: "0.55rem", letterSpacing: "0.1em", marginTop: 4 }}>REVIEWERS</small>
      </div>

      {ROLES.map((role) => (
        <div
          key={role.n}
          className={`absolute ${role.cls}`}
          style={{
            ...role.pos,
            fontFamily: MONO, fontWeight: 700, fontSize: "clamp(.58rem,1vw,.72rem)", lineHeight: 1,
            letterSpacing: "0.08em", whiteSpace: "nowrap",
            background: "#111315", border: "1px solid #34373a", padding: "8px 11px",
          }}
        >
          <span style={{ color: ACID, marginRight: 8 }}>{role.n}</span>
          {role.name}
        </div>
      ))}
    </div>
  );
}
