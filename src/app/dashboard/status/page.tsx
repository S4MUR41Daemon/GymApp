import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import { RankBadge } from "@/components/shell/RankBadge";
import type { Rank } from "@/components/shell/ranks";
import { RANKS_CFG } from "@/components/shell/ranks";
import { SLBadge, SLCard, SLPageHeader, SLProgressBar, SLSection } from "@/components/ui-sl";
import { getDisplayName, getOrCreateUserLevel } from "@/lib/userLevel";

const RANKS: Rank[] = ["E", "D", "C", "B", "A", "S", "S+"];
const XP_FOR_NEXT_LEVEL = 500;

const RANK_TITLES: Record<Rank, string> = {
  E: "Iron Will",
  D: "Steel Novice",
  C: "Blue Vanguard",
  B: "Rune Breaker",
  A: "Abyss Reaper",
  S: "Monarch Candidate",
  "S+": "National Leveler",
};

export default async function StatusPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const level = await getOrCreateUserLevel(userId);
  const rank = level.rank as Rank;
  const displayName = getDisplayName(level, "Leveler");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <SLPageHeader
        backHref="/dashboard"
        backLabel="< BASE"
        title="Leveler Status"
        subtitle="Registro de identidad y progresión"
      />

      <SLCard style={{ padding: 18, animation: "sysPulse 3s ease-in-out infinite" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              border: "1px solid rgba(96,165,250,0.35)",
              background: "linear-gradient(135deg, rgba(29,78,216,0.35), rgba(14,165,233,0.12))",
              boxShadow: "0 0 18px rgba(59,130,246,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <Image src="/avatars/sigil-01.svg" alt="" width={54} height={54} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-barlow), sans-serif",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(96,165,250,0.6)",
              }}
            >
              — LEVELER —
            </p>
            <h1
              style={{
                margin: "4px 0 0",
                fontFamily: "var(--font-rajdhani), sans-serif",
                fontSize: 28,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#e2e8f0",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: 13, color: "#93c5fd" }}>✦ {RANK_TITLES[rank]}</p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(148,163,184,0.55)" }}>
              Guild: Sin afiliar
            </p>
          </div>

          <RankBadge rank={rank} size="xl" />
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
              LVL {level.level}
            </span>
            <span style={{ fontSize: 12, color: "rgba(148,163,184,0.6)" }}>
              {level.xp}/{XP_FOR_NEXT_LEVEL} XP
            </span>
          </div>
          <SLProgressBar value={level.xp} max={XP_FOR_NEXT_LEVEL} />
        </div>
      </SLCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <StatCard label="Nivel" value={String(level.level)} />
        <StatCard label="Streak" value={`${level.streakDays}d`} />
        <StatCard label="Quests" value="0/3" muted />
      </div>

      <SLSection title="Rank progression">
        <SLCard>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
            {RANKS.map((item) => {
              const active = item === rank;
              const unlocked = RANKS.indexOf(item) <= RANKS.indexOf(rank);
              return (
                <div key={item} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: `1px solid ${unlocked ? RANKS_CFG[item].color : "rgba(148,163,184,0.18)"}`,
                      background: unlocked ? `${RANKS_CFG[item].color}18` : "rgba(148,163,184,0.04)",
                      color: unlocked ? RANKS_CFG[item].color : "rgba(148,163,184,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-rajdhani), sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      boxShadow: active ? RANKS_CFG[item].glow : undefined,
                    }}
                  >
                    {item}
                  </span>
                  {active && <SLBadge variant="accent">Actual</SLBadge>}
                </div>
              );
            })}
          </div>
        </SLCard>
      </SLSection>

      <SLSection title="Títulos desbloqueados">
        <SLCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <TitleRow title="Iron Will" description="Identidad inicial del Leveler." unlocked />
            <TitleRow title="Quest Breaker" description="Completa tus primeras quests diarias." />
            <TitleRow title="PR Seeker" description="Placeholder hasta activar récords personales." />
          </div>
        </SLCard>
      </SLSection>
    </div>
  );
}

function StatCard({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <SLCard style={{ padding: "12px 10px", textAlign: "center" }}>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-barlow), sans-serif",
          fontSize: 9,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.55)",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "5px 0 0",
          fontFamily: "var(--font-rajdhani), sans-serif",
          fontSize: 20,
          fontWeight: 700,
          color: muted ? "rgba(148,163,184,0.45)" : "#e2e8f0",
        }}
      >
        {value}
      </p>
    </SLCard>
  );
}

function TitleRow({ title, description, unlocked = false }: { title: string; description: string; unlocked?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-rajdhani), sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: unlocked ? "#e2e8f0" : "rgba(148,163,184,0.45)",
          }}
        >
          {title}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(148,163,184,0.55)" }}>{description}</p>
      </div>
      <SLBadge variant={unlocked ? "success" : "default"}>{unlocked ? "Activo" : "Bloqueado"}</SLBadge>
    </div>
  );
}
