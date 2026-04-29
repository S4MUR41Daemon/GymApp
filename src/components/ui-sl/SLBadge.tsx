import type { ReactNode } from "react";

const variants = {
  default: { background: "rgba(148,163,184,0.08)", color: "rgba(148,163,184,0.7)" },
  accent: { background: "rgba(59,130,246,0.1)", color: "#93c5fd" },
  warning: { background: "rgba(249,115,22,0.1)", color: "#fdba74" },
  success: { background: "rgba(34,197,94,0.1)", color: "#86efac" },
};

export function SLBadge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 6px",
        borderRadius: 3,
        fontFamily: "var(--font-barlow), sans-serif",
        fontSize: 9,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...variants[variant],
      }}
    >
      {children}
    </span>
  );
}
