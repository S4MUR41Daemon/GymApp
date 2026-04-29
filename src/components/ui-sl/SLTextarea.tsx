"use client";

import type { CSSProperties, TextareaHTMLAttributes } from "react";
import { forwardRef, useState } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  wrapperStyle?: CSSProperties;
};

export const SLTextarea = forwardRef<HTMLTextAreaElement, Props>(function SLTextarea(
  { label, style, wrapperStyle, onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const textarea = (
    <textarea
      ref={ref}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={{
        width: "100%",
        minHeight: 80,
        resize: "none",
        background: "rgba(59,130,246,0.06)",
        border: focused ? "1.5px solid rgba(96,165,250,0.6)" : "1px solid rgba(59,130,246,0.18)",
        borderRadius: 5,
        padding: "8px 12px",
        color: "#e2e8f0",
        fontFamily: "var(--font-sans), sans-serif",
        fontSize: 13,
        outline: "none",
        boxShadow: focused ? "0 0 8px rgba(59,130,246,0.25)" : undefined,
        ...style,
      }}
      {...props}
    />
  );

  if (!label) return textarea;

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, ...wrapperStyle }}>
      <span
        style={{
          fontFamily: "var(--font-barlow), sans-serif",
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.6)",
        }}
      >
        {label}
      </span>
      {textarea}
    </label>
  );
});
