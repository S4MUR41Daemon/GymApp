import type { ReactNode } from "react";
import { SLDivider } from "./SLDivider";

export function SLSection({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section>
      <SLDivider title={title} count={count} />
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </section>
  );
}
