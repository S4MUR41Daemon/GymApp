"use client";

export function SLProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      style={{
        height: 4,
        background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.15)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "linear-gradient(90deg,#1d4ed8,#3b82f6,#7dd3fc)",
          boxShadow: "0 0 6px rgba(96,165,250,0.5)",
          transition: "width 1s cubic-bezier(.25,.8,.25,1)",
        }}
      />
    </div>
  );
}
