import { auth } from "@clerk/nextjs/server";
import { getOrCreateUserLevel } from "@/lib/userLevel";
import { XPBar } from "./XPBar";
import { TopBarLevelButton } from "./TopBarLevelButton";
import type { Rank } from "./ranks";

const XP_FOR_NEXT_LEVEL = 500;

export async function TopBar() {
  const { userId } = await auth();
  if (!userId) return null;

  const level = await getOrCreateUserLevel(userId);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "12px 16px 10px",
        borderBottom: "1px solid rgba(59,130,246,0.07)",
        backdropFilter: "blur(12px)",
        background: "rgba(5,7,13,0.7)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "linear-gradient(135deg, #1d4ed8, #0ea5e9)",
              boxShadow: "0 0 12px rgba(59,130,246,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: "#fff",
            }}
          >
            A
          </div>
          <span
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "0.06em",
              color: "#e2e8f0",
            }}
          >
            AUSINLIFTING
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              fontSize: 15,
              animation: "streakAnim 1.8s ease-in-out infinite",
              display: "inline-block",
            }}
            aria-hidden="true"
          >
            🔥
          </span>
          <span
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: "#f97316",
            }}
          >
            {level.streakDays}
          </span>
        </div>

        <TopBarLevelButton rank={level.rank as Rank} level={level.level} />
      </div>

      <XPBar current={level.xp} max={XP_FOR_NEXT_LEVEL} />
    </header>
  );
}
