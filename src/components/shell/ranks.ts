export type Rank = "E" | "D" | "C" | "B" | "A" | "S" | "S+";

export const RANKS_CFG: Record<Rank, { color: string; glow: string; glow2: string }> = {
  E: { color: "#94a3b8", glow: "rgba(148,163,184,0.5)", glow2: "rgba(148,163,184,0.15)" },
  D: { color: "#22c55e", glow: "rgba(34,197,94,0.5)", glow2: "rgba(34,197,94,0.15)" },
  C: { color: "#3b82f6", glow: "rgba(59,130,246,0.6)", glow2: "rgba(59,130,246,0.15)" },
  B: { color: "#a855f7", glow: "rgba(168,85,247,0.6)", glow2: "rgba(168,85,247,0.15)" },
  A: { color: "#f97316", glow: "rgba(249,115,22,0.6)", glow2: "rgba(249,115,22,0.15)" },
  S: { color: "#f59e0b", glow: "rgba(245,158,11,0.7)", glow2: "rgba(245,158,11,0.2)" },
  "S+": { color: "#fbbf24", glow: "rgba(251,191,36,0.8)", glow2: "rgba(251,191,36,0.25)" },
};
