"use client";

import { useState } from "react";
import Link from "next/link";

export function SLBackLink({ href, label = "< VOLVER" }: { href: string; label?: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        marginBottom: 8,
        fontFamily: "var(--font-barlow), sans-serif",
        fontSize: 10,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: hovered ? "#93c5fd" : "rgba(148,163,184,0.5)",
        textDecoration: "none",
        transition: "color 150ms ease",
      }}
    >
      {label}
    </Link>
  );
}
