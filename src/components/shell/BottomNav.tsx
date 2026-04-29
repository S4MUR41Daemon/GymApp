"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type EnabledTab = {
  id: "dashboard" | "status" | "training";
  label: string;
  icon: string;
  href: string;
};

type DisabledTab = {
  id: "quests" | "guild";
  label: string;
  icon: string;
  disabled: true;
};

type Tab = EnabledTab | DisabledTab;

const TABS: Tab[] = [
  { id: "dashboard", label: "Base", icon: "⚡", href: "/dashboard" },
  { id: "status", label: "Status", icon: "🛡️", href: "/dashboard/status" },
  { id: "training", label: "Training", icon: "⚔️", href: "/dashboard/blocks" },
  { id: "quests", label: "Quests", icon: "📜", disabled: true },
  { id: "guild", label: "Guild", icon: "🏴", disabled: true },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 50,
        display: "flex",
        borderTop: "1px solid rgba(59,130,246,0.1)",
        background: "rgba(5,7,13,0.97)",
        backdropFilter: "blur(12px)",
        padding: "6px 0 10px",
      }}
    >
      {TABS.map((tab) => {
        const isDisabled = "disabled" in tab;
        const active = !isDisabled && (
          tab.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.href)
        );
        const labelColor = isDisabled
          ? "rgba(148,163,184,0.25)"
          : active
            ? "#60a5fa"
            : "rgba(148,163,184,0.4)";
        const iconStyle: CSSProperties = isDisabled
          ? { opacity: 0.2 }
          : active
            ? { filter: "drop-shadow(0 0 5px rgba(96,165,250,0.7))" }
            : { opacity: 0.3 };
        const itemStyle: CSSProperties = {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          padding: "5px 0",
          background: "none",
          border: "none",
          textDecoration: "none",
          cursor: isDisabled ? "not-allowed" : "pointer",
        };
        const inner = (
          <>
            <span style={{ fontSize: 19, lineHeight: 1, ...iconStyle }}>{tab.icon}</span>
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "var(--font-barlow), sans-serif",
                color: labelColor,
              }}
            >
              {tab.label}
            </span>
          </>
        );

        if (isDisabled) {
          return (
            <button
              key={tab.id}
              type="button"
              disabled
              style={itemStyle}
              aria-label={`${tab.label} próximamente`}
            >
              {inner}
            </button>
          );
        }

        return (
          <Link key={tab.id} href={tab.href} style={itemStyle}>
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
