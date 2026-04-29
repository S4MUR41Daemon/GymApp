import type { CSSProperties, ReactNode } from "react";
import { SLDivider } from "./SLDivider";

export function SLCard({
  title,
  count,
  children,
  className,
  style,
}: {
  title?: string;
  count?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: "var(--sl-bg-card,linear-gradient(135deg,rgba(10,22,44,0.85),rgba(7,12,22,0.7)))",
        border: "1px solid rgba(59,130,246,0.18)",
        borderRadius: 10,
        padding: "14px 16px",
        boxShadow: "0 0 12px rgba(59,130,246,0.08)",
        ...style,
      }}
    >
      {title && (
        <div style={{ marginBottom: 12 }}>
          <SLDivider title={title} count={count} />
        </div>
      )}
      {children}
    </div>
  );
}
