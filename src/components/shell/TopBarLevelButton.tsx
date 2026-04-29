"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RankBadge } from "./RankBadge";
import type { Rank } from "./ranks";

export function TopBarLevelButton({ rank, level }: { rank: Rank; level: number }) {
  return (
    <Link href="/dashboard/status" style={{ textDecoration: "none" }} aria-label={`Ver Status LVL ${level}`}>
      <motion.span
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.03 }}
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
      </motion.span>
    </Link>
  );
}
