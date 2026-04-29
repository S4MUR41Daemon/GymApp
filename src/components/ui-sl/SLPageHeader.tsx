import type { ReactNode } from "react";
import { SLBackLink } from "./SLBackLink";

export function SLPageHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  right,
}: {
  backHref?: string;
  backLabel?: string;
  title: string;
  subtitle?: string | null;
  right?: ReactNode;
}) {
  return (
    <header style={{ marginBottom: 16 }}>
      {backHref && <SLBackLink href={backHref} label={backLabel ?? "< VOLVER"} />}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#e2e8f0",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: "4px 0 0",
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 13,
                color: "rgba(148,163,184,0.6)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}
