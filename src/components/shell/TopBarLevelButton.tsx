"use client";

import { motion } from "framer-motion";
import { RankBadge } from "./RankBadge";
import type { Rank } from "./ranks";

export function TopBarLevelButton({ rank, level }: { rank: Rank; level: number }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.03 }}
      type="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 5,
        border: "1px solid rgba(59,130,246,0.25)",
        background: "rgba(59,130,246,0.06)",
        cursor: "pointer",
      }}
      aria-label={`LVL ${level}`}
    >
      <RankBadge rank={rank} size="sm" />
      <span
        style={{
          fontFamily: "var(--font-rajdhani), sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: "#93c5fd",
        }}
      >
        LVL {level}
      </span>
    </motion.button>
  );
}
