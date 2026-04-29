"use client";

import { useEffect, useState } from "react";

export function XPBar({ current, max }: { current: number; max: number }) {
  const [mounted, setMounted] = useState(false);
  const safeMax = Math.max(max, 1);
  const pct = Math.min(100, Math.max(0, Math.round((current / safeMax) * 100)));
  const fillPct = mounted ? pct : 0;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          position: "relative",
          height: 5,
          borderRadius: 3,
          border: "1px solid rgba(59,130,246,0.15)",
          background: "rgba(59,130,246,0.08)",
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "relative",
            height: "100%",
            width: `${fillPct}%`,
            minWidth: current > 0 ? 3 : 0,
            borderRadius: 3,
            background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #7dd3fc)",
            boxShadow: fillPct > 0
              ? "0 0 8px rgba(96,165,250,0.7), 0 0 20px rgba(59,130,246,0.3)"
              : "none",
            transition: "width 1.2s cubic-bezier(.25,.8,.25,1)",
          }}
        >
          {fillPct > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                right: -1,
                top: -3,
                width: 3,
                height: 11,
                borderRadius: 2,
                background: "#bfdbfe",
                boxShadow: "0 0 6px #60a5fa",
              }}
            />
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 5,
          fontFamily: "var(--font-barlow), sans-serif",
          fontSize: 10,
          fontWeight: 600,
          color: "rgba(96,165,250,0.6)",
          letterSpacing: "0.04em",
        }}
      >
        <span>
          XP {current.toLocaleString()} / {max.toLocaleString()}
        </span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}
