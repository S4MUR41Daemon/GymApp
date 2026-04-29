"use client";

import type { CSSProperties } from "react";
import { RANKS_CFG, type Rank } from "./ranks";

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { box: number; font: number }> = {
  sm: { box: 22, font: 11 },
  md: { box: 28, font: 14 },
  lg: { box: 44, font: 22 },
  xl: { box: 64, font: 32 },
};

export function RankBadge({ rank, size = "md" }: { rank: Rank; size?: Size }) {
  const rankConfig = RANKS_CFG[rank];
  const { box, font } = SIZES[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: box,
        height: box,
        borderRadius: box * 0.18,
        border: `1.5px solid ${rankConfig.color}`,
        color: rankConfig.color,
        fontSize: font,
        flexShrink: 0,
        background: `${rankConfig.color}10`,
        fontFamily: "var(--font-rajdhani), sans-serif",
        fontWeight: 700,
        animation: "rankGlow 2.5s ease-in-out infinite",
        "--rg": rankConfig.glow,
        "--rg2": rankConfig.glow2,
        "--ri": `${rankConfig.color}20`,
      } as CSSProperties}
    >
      {rank}
    </span>
  );
}
