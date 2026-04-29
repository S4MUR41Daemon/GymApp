"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { useState } from "react";
import type { MotionProps } from "framer-motion";
import { motion } from "framer-motion";
import Link from "next/link";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md";

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,0.4)",
    boxShadow: "0 0 12px rgba(59,130,246,0.4)",
    textTransform: "uppercase",
  },
  secondary: {
    background: "rgba(59,130,246,0.06)",
    color: "#93c5fd",
    border: "1px solid rgba(59,130,246,0.25)",
    textTransform: "uppercase",
  },
  destructive: {
    background: "transparent",
    color: "rgba(148,163,184,0.6)",
    border: "1px solid transparent",
  },
  ghost: {
    background: "transparent",
    color: "#93c5fd",
    border: "1px solid transparent",
  },
};

const sizeStyles: Record<Size, CSSProperties> = {
  sm: { fontSize: 11, padding: "6px 12px" },
  md: { fontSize: 13, padding: "8px 16px" },
};

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps> & {
  href?: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  style?: CSSProperties;
};

export function SLButton({
  href,
  variant = "primary",
  size = "md",
  disabled,
  children,
  style,
  type = "button",
  ...props
}: Props) {
  const [hovered, setHovered] = useState(false);
  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    fontFamily: "var(--font-rajdhani), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.06em",
    lineHeight: 1.2,
    textDecoration: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background 150ms ease, color 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };
  const hoverStyle: CSSProperties =
    hovered && !disabled
      ? variant === "primary"
        ? { boxShadow: "0 0 18px rgba(59,130,246,0.6)" }
        : variant === "secondary"
          ? { background: "rgba(59,130,246,0.12)" }
          : variant === "destructive"
            ? { color: "#ef4444" }
            : { color: "#bfdbfe" }
      : {};

  if (href) {
    return (
      <Link
        href={disabled ? "#" : href}
        aria-disabled={disabled}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ ...baseStyle, ...hoverStyle }}
      >
        {children}
      </Link>
    );
  }

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      disabled={disabled}
      type={type}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...baseStyle, ...hoverStyle }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
