export function SLDivider({ title, count }: { title?: string; count?: number }) {
  if (!title) {
    return (
      <hr
        style={{
          borderColor: "rgba(59,130,246,0.15)",
          borderWidth: "0 0 1px 0",
        }}
      />
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      <span style={{ flex: 1, borderTop: "1px solid rgba(59,130,246,0.15)" }} />
      <span
        style={{
          padding: "0 8px",
          fontFamily: "var(--font-barlow), sans-serif",
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(96,165,250,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        {`— ${title.toUpperCase()} ${count ? `— ${count}` : "—"}`}
      </span>
      <span style={{ flex: 1, borderTop: "1px solid rgba(59,130,246,0.15)" }} />
    </div>
  );
}
