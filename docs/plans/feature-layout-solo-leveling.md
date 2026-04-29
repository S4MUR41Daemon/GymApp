# Feature — Layout global Solo Leveling: TopBar + BottomNav + ParticleCanvas + RankBadge

## Contexto

Estamos arrancando la fase visual del sistema Solo Leveling (ver `docs/plans/roadmap.md` Fase 3). El prototipo HTML completo y la spec pixel-perfect viven en `design_handoff_solo_leveling/`:

- `design_handoff_solo_leveling/README.md` — spec exacta de colores, tamaños, fuentes, animaciones, keyframes.
- `design_handoff_solo_leveling/AusinLifting - Hunter System.html` — prototipo React/Babel funcional (referencia visual).

El layout actual es muy básico: `src/app/layout.tsx` envuelve `<ClerkProvider>` + un `Navbar` simple con dos enlaces ("Dashboard", "Bloques"). Esta feature reemplaza ese shell por:

- **ParticleCanvas** — fondo animado (40 partículas blue/cyan que ascienden) detrás de toda la app.
- **TopBar** — barra superior 60px con logo + nombre, streak 🔥, badge clickable `RankBadge + LVL N` y barra de XP.
- **BottomNav** — barra inferior 58px con 5 tabs (Base / Status / Training / Quests / Guild).
- **RankBadge** — componente reutilizable (sm/md/lg/xl) con rango E→S, glow animado.

Esta fase es **puramente visual + scaffolding de DB**: creamos las tablas `user_levels` y `xp_events` para tener la base lista, pero la UI muestra placeholders (LVL 1, XP 0/500, streak 0, rank E). La lógica de XP, streak real y level-up se conecta en fases posteriores.

**Decisiones clave tomadas con el product owner:**
- Tabs Status / Quests / Guild se renderizan **deshabilitadas** (visibles, no navegan) hasta que existan rutas reales. Solo Base (→ `/dashboard`) y Training (→ `/dashboard/blocks`) son funcionales.
- Datos de LVL/XP/streak son **placeholder hardcoded** en esta fase. Se crean ya las tablas para conectar después sin migración adicional.
- Shell aplica **globalmente** con detección de auth: `ParticleCanvas` siempre visible; `TopBar` + `BottomNav` solo si hay usuario logueado (Clerk `auth()`). En `/` (sign-in) solo se ve el canvas + el contenido.
- Animaciones: **framer-motion** (recién instalado) para RankBadge glow, streak bounce, XP fill, level-badge tap. **Canvas vanilla** para ParticleCanvas (framer-motion no aplica a `<canvas>`).

## ⚠️ Antes de empezar

`AGENTS.md` del repo advierte: *"This is NOT the Next.js you know. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."* La versión es **Next.js 16.2.4** + **React 19.2** + **Clerk 7.2** + **Tailwind v4**. Antes de tocar `layout.tsx` o usar `auth()` de Clerk, leer:

- `node_modules/next/dist/docs/` (lo relevante a layouts, fonts, server components).
- `node_modules/@clerk/nextjs/` (firma actual de `auth()` — probablemente async en v7).

## Archivos a modificar / crear

| Archivo | Cambio |
|---|---|
| `src/db/schema.ts` | + `userLevels`, `xpEvents` tablas + `rankEnum` + relations |
| `drizzle/0006_user_levels.sql` | Migración nueva (generar con `npx drizzle-kit generate`) |
| `package.json` | + `framer-motion` |
| `src/app/globals.css` | + tokens Solo Leveling + keyframes (rankGlow, streakAnim, lvlReveal, sysPulse) |
| `src/app/layout.tsx` | Refactor completo — fonts Rajdhani+Barlow, ParticleCanvas siempre, TopBar+BottomNav con auth check |
| `src/app/dashboard/Navbar.tsx` | **Eliminar** (lo reemplaza TopBar) |
| `src/components/shell/ParticleCanvas.tsx` | Nuevo — client component, canvas + useEffect |
| `src/components/shell/RankBadge.tsx` | Nuevo — client, framer-motion glow |
| `src/components/shell/XPBar.tsx` | Nuevo — client, framer-motion fill |
| `src/components/shell/TopBar.tsx` | Nuevo — server component, recibe `userLevel` props |
| `src/components/shell/TopBarLevelButton.tsx` | Nuevo — client wrapper para el badge clickable (ahora sin onClick real, prep para level-up modal futuro) |
| `src/components/shell/BottomNav.tsx` | Nuevo — client, `usePathname` para active state |
| `src/components/shell/ranks.ts` | Nuevo — config compartida `RANKS_CFG` |
| `src/lib/userLevel.ts` | Nuevo — server util `getOrCreateUserLevel(userId)` |

---

## 1. Schema DB (Drizzle)

**Archivo:** `src/db/schema.ts` — añadir al final, antes de relations.

```ts
// ---------------------------------------------------------------------------
// Solo Leveling — user level & XP events
// ---------------------------------------------------------------------------

export const rankEnum = pgEnum("rank", ["E", "D", "C", "B", "A", "S", "S+"]);

export const userLevels = pgTable("user_levels", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  xp: integer("xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  rank: rankEnum("rank").default("E").notNull(),
  streakDays: integer("streak_days").default(0).notNull(),
  lastWorkoutDate: timestamp("last_workout_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const xpEvents = pgTable("xp_events", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  xpGained: integer("xp_gained").notNull(),
  reason: text("reason").notNull(), // 'workout_complete' | 'pr_beaten' | 'week_complete' | 'block_complete' | 'streak_7'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Notas:**
- `rankEnum` con los 7 rangos del manhwa (E→S+).
- `streakDays` y `lastWorkoutDate` viven aquí (no en tabla aparte) para simplificar la query del TopBar.
- No hay relations a otras tablas: `userId` es texto de Clerk, no FK.

**Migración:** ejecutar `npx drizzle-kit generate` para producir `drizzle/0006_user_levels.sql`. Verificar que el SQL generado:
- Crea el enum `rank`.
- Crea las dos tablas con sus defaults.

Aplicar con el flujo habitual del proyecto (Neon MCP `mcp__Neon__prepare_database_migration` + `complete_database_migration`).

---

## 2. Theme tokens y keyframes

**Archivo:** `src/app/globals.css` — añadir **al final** del fichero (no tocar `@theme inline` ni los `:root`/`.dark` existentes; agregamos vars custom adicionales que conviven).

```css
/* ---- Solo Leveling tokens ---- */
:root {
  --sl-bg-base: #06080f;
  --sl-bg-phone: linear-gradient(175deg, #07101e 0%, #06080f 60%);
  --sl-accent-blue: #3b82f6;
  --sl-accent-light: #60a5fa;
  --sl-accent-dim: #1d4ed8;
  --sl-accent-pale: #bfdbfe;
  --sl-cyan: #22d3ee;
  --sl-text-primary: #e2e8f0;
  --sl-text-secondary: rgba(148,163,184,0.7);
  --sl-text-muted: rgba(148,163,184,0.45);
  --sl-text-accent: #93c5fd;
  --sl-rank-E: #94a3b8;
  --sl-rank-D: #22c55e;
  --sl-rank-C: #3b82f6;
  --sl-rank-B: #a855f7;
  --sl-rank-A: #f97316;
  --sl-rank-S: #f59e0b;
}

/* Forzamos el bg base de Solo Leveling sobre el body cuando hay usuario.
   Mantenemos compat con el dark theme existente. */
body {
  background: var(--sl-bg-base);
}

/* ---- Keyframes ---- */
@keyframes rankGlow {
  0%, 100% {
    box-shadow: 0 0 6px var(--rg, rgba(59,130,246,0.5)),
                inset 0 0 4px var(--ri, rgba(59,130,246,0.2));
  }
  50% {
    box-shadow: 0 0 18px var(--rg, rgba(59,130,246,0.5)),
                0 0 32px var(--rg2, rgba(59,130,246,0.15)),
                inset 0 0 8px var(--ri, rgba(59,130,246,0.2));
  }
}

@keyframes streakAnim {
  0%, 100% { transform: scaleY(1) rotate(-3deg); }
  50%      { transform: scaleY(1.15) rotate(3deg); }
}

@keyframes lvlReveal {
  from { opacity: 0; transform: scale(0.88) translateY(24px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes sysPulse {
  0%, 100% {
    border-color: rgba(59,130,246,0.4);
    box-shadow: 0 0 24px rgba(59,130,246,0.25);
  }
  50% {
    border-color: rgba(96,165,250,0.7);
    box-shadow: 0 0 40px rgba(96,165,250,0.45);
  }
}

/* Particle canvas siempre detrás */
#particle-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
```

**Notas:**
- Las vars `--sl-*` se prefijan para no chocar con las OKLCH de shadcn.
- El `body { background: var(--sl-bg-base); }` reemplaza el `bg-background` actual a nivel de body. Si shadcn lo necesita en algún componente, sigue resolviéndose vía `--background`.
- `rankGlow` lee 3 vars que cada `RankBadge` setea inline (`--rg`, `--rg2`, `--ri`) según el rank.

---

## 3. Fonts

**Archivo:** `src/app/layout.tsx` — añadir Rajdhani y Barlow Condensed con `next/font/google`. Mantener Inter (queda como `--font-sans` body).

```ts
import { Geist, Geist_Mono, Inter, Rajdhani, Barlow_Condensed } from "next/font/google";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rajdhani',
});

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
});
```

Y añadir las variables al `<html className>` junto a las existentes.

**Uso en componentes:** las clases tailwind no las exponen automáticamente (las custom font vars no están en `@theme`), así que en los componentes Solo Leveling usamos `style={{ fontFamily: 'var(--font-rajdhani)' }}` o registramos en globals:

```css
@theme inline {
  /* añadir junto a las existentes */
  --font-rajdhani: var(--font-rajdhani);
  --font-barlow: var(--font-barlow);
}
```

Eso permite usar `font-rajdhani` y `font-barlow` como utilidades Tailwind. **Recomendado**: registrarlas en `@theme inline`.

---

## 4. Componentes

### 4.1 `src/components/shell/ranks.ts`

Config compartida (la consumen `RankBadge` y futuros componentes).

```ts
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+';

export const RANKS_CFG: Record<Rank, { color: string; glow: string; glow2: string }> = {
  E:   { color: '#94a3b8', glow: 'rgba(148,163,184,0.5)', glow2: 'rgba(148,163,184,0.15)' },
  D:   { color: '#22c55e', glow: 'rgba(34,197,94,0.5)',   glow2: 'rgba(34,197,94,0.15)' },
  C:   { color: '#3b82f6', glow: 'rgba(59,130,246,0.6)',  glow2: 'rgba(59,130,246,0.15)' },
  B:   { color: '#a855f7', glow: 'rgba(168,85,247,0.6)',  glow2: 'rgba(168,85,247,0.15)' },
  A:   { color: '#f97316', glow: 'rgba(249,115,22,0.6)',  glow2: 'rgba(249,115,22,0.15)' },
  S:   { color: '#f59e0b', glow: 'rgba(245,158,11,0.7)',  glow2: 'rgba(245,158,11,0.2)' },
  'S+':{ color: '#fbbf24', glow: 'rgba(251,191,36,0.8)',  glow2: 'rgba(251,191,36,0.25)' },
};
```

### 4.2 `src/components/shell/RankBadge.tsx`

Client component (anima con framer-motion, pero el animate es 100% CSS keyframes — framer-motion solo se usa para `whileTap`/`whileHover` futuros del wrapper en TopBar). Aquí basta CSS animation.

```tsx
'use client';
import { RANKS_CFG, type Rank } from './ranks';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, { box: number; font: number }> = {
  sm: { box: 22, font: 11 },
  md: { box: 28, font: 14 },
  lg: { box: 44, font: 22 },
  xl: { box: 64, font: 32 },
};

export function RankBadge({ rank, size = 'md' }: { rank: Rank; size?: Size }) {
  const r = RANKS_CFG[rank];
  const { box, font } = SIZES[size];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: box,
        height: box,
        borderRadius: box * 0.18,
        border: `1.5px solid ${r.color}`,
        color: r.color,
        fontSize: font,
        flexShrink: 0,
        background: `${r.color}10`,
        fontFamily: 'var(--font-rajdhani), sans-serif',
        fontWeight: 700,
        animation: 'rankGlow 2.5s ease-in-out infinite',
        // CSS vars consumidas por el keyframe rankGlow
        ['--rg' as string]: r.glow,
        ['--rg2' as string]: r.glow2,
        ['--ri' as string]: `${r.color}20`,
      }}
    >
      {rank}
    </span>
  );
}
```

### 4.3 `src/components/shell/XPBar.tsx`

Client. La animación de `width` la maneja CSS `transition`; framer-motion sobra aquí, mantener simple.

Spec: track 5px alto, fondo `rgba(59,130,246,0.08)`, border `1px solid rgba(59,130,246,0.15)`, radius 3px. Fill gradient `#1d4ed8→#3b82f6→#7dd3fc`, glow `0 0 8px rgba(96,165,250,0.7), 0 0 20px rgba(59,130,246,0.3)`. Cursor 3×11px en `#bfdbfe` al final del fill. Transition `width 1.2s cubic-bezier(.25,.8,.25,1)`.

Debajo del track: dos labels Barlow 10px en `rgba(96,165,250,0.6)`: izquierda `XP {current.toLocaleString()} / {max.toLocaleString()}`, derecha `{pct}%`.

### 4.4 `src/components/shell/TopBar.tsx`

**Server component**. Lee el level del usuario y compone el header.

```tsx
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserLevel } from '@/lib/userLevel';
import { RankBadge } from './RankBadge';
import { XPBar } from './XPBar';
import { TopBarLevelButton } from './TopBarLevelButton';
import type { Rank } from './ranks';

const XP_FOR_NEXT_LEVEL = 500; // placeholder, lógica real en fase futura

export async function TopBar() {
  const { userId } = await auth();
  if (!userId) return null;

  const level = await getOrCreateUserLevel(userId);
  // Datos reales hoy: solo lo que ya guardamos. Streak placeholder = level.streakDays (0 al inicio).

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 16px 10px',
        borderBottom: '1px solid rgba(59,130,246,0.07)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(5,7,13,0.7)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        {/* Logo + nombre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: 7,
              background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
              boxShadow: '0 0 12px rgba(59,130,246,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-rajdhani)', fontWeight: 700, fontSize: 13,
              color: '#fff',
            }}
          >A</div>
          <span
            style={{
              fontFamily: 'var(--font-rajdhani)', fontWeight: 700, fontSize: 15,
              letterSpacing: '0.06em', color: '#e2e8f0',
            }}
          >AUSINLIFTING</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 15, animation: 'streakAnim 1.8s ease-in-out infinite', display: 'inline-block' }}>🔥</span>
          <span style={{ fontFamily: 'var(--font-rajdhani)', fontWeight: 700, fontSize: 14, color: '#f97316' }}>
            {level.streakDays}
          </span>
        </div>

        {/* Level badge clickable */}
        <TopBarLevelButton rank={level.rank as Rank} level={level.level} />
      </div>

      {/* XP bar row */}
      <XPBar current={level.xp} max={XP_FOR_NEXT_LEVEL} />
    </header>
  );
}
```

### 4.5 `src/components/shell/TopBarLevelButton.tsx`

Client. Por ahora sin handler real (preparado para abrir Level Up Modal en fase futura). Usa framer-motion `whileTap` para feedback.

```tsx
'use client';
import { motion } from 'framer-motion';
import { RankBadge } from './RankBadge';
import type { Rank } from './ranks';

export function TopBarLevelButton({ rank, level }: { rank: Rank; level: number }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.03 }}
      type="button"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 9px', borderRadius: 5,
        border: '1px solid rgba(59,130,246,0.25)',
        background: 'rgba(59,130,246,0.06)',
        cursor: 'pointer',
      }}
      // TODO fase futura: onClick → abrir Level Up Modal / pestaña Status
    >
      <RankBadge rank={rank} size="sm" />
      <span style={{ fontFamily: 'var(--font-rajdhani)', fontWeight: 700, fontSize: 13, color: '#93c5fd' }}>
        LVL {level}
      </span>
    </motion.button>
  );
}
```

### 4.6 `src/components/shell/BottomNav.tsx`

Client. `usePathname` para active state. Tabs deshabilitadas no son `<Link>`, son `<button disabled>`.

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab =
  | { id: 'dashboard'; label: 'Base';     icon: '⚡'; href: '/dashboard' }
  | { id: 'status';    label: 'Status';   icon: '🛡️'; disabled: true }
  | { id: 'training';  label: 'Training'; icon: '⚔️'; href: '/dashboard/blocks' }
  | { id: 'quests';    label: 'Quests';   icon: '📜'; disabled: true }
  | { id: 'guild';     label: 'Guild';    icon: '🏴'; disabled: true };

const TABS: Tab[] = [
  { id: 'dashboard', label: 'Base',     icon: '⚡', href: '/dashboard' },
  { id: 'status',    label: 'Status',   icon: '🛡️', disabled: true },
  { id: 'training',  label: 'Training', icon: '⚔️', href: '/dashboard/blocks' },
  { id: 'quests',    label: 'Quests',   icon: '📜', disabled: true },
  { id: 'guild',     label: 'Guild',    icon: '🏴', disabled: true },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        position: 'sticky', bottom: 0, zIndex: 50,
        display: 'flex',
        borderTop: '1px solid rgba(59,130,246,0.1)',
        background: 'rgba(5,7,13,0.97)',
        backdropFilter: 'blur(12px)',
        padding: '6px 0 10px',
      }}
    >
      {TABS.map(t => {
        const active = !('disabled' in t) && (
          t.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(t.href)
        );
        const labelColor = 'disabled' in t
          ? 'rgba(148,163,184,0.25)'
          : active ? '#60a5fa' : 'rgba(148,163,184,0.4)';
        const iconStyle = 'disabled' in t
          ? { opacity: 0.2 }
          : active ? { filter: 'drop-shadow(0 0 5px rgba(96,165,250,0.7))' } : { opacity: 0.3 };

        const inner = (
          <>
            <span style={{ fontSize: 19, lineHeight: 1, ...iconStyle }}>{t.icon}</span>
            <span
              style={{
                fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-barlow)',
                color: labelColor,
              }}
            >{t.label}</span>
          </>
        );

        const btnStyle: React.CSSProperties = {
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 3, padding: '5px 0',
          background: 'none', border: 'none',
          cursor: 'disabled' in t ? 'not-allowed' : 'pointer',
        };

        if ('disabled' in t) {
          return <button key={t.id} type="button" disabled style={btnStyle} aria-label={`${t.label} (próximamente)`}>{inner}</button>;
        }
        return <Link key={t.id} href={t.href} style={btnStyle}>{inner}</Link>;
      })}
    </nav>
  );
}
```

### 4.7 `src/components/shell/ParticleCanvas.tsx`

Client. Canvas vanilla con `requestAnimationFrame`. Densidad fija = 40.

Algoritmo (idéntico al prototipo, simplificado):
1. `useEffect` monta — crea canvas full-screen, listener resize.
2. Genera array de 40 partículas con `{ x, y, r:0.3-1.7, vy:-0.08..-0.33, vx:±0.075, op:0.1-0.55, opDir, cyan: 35% prob }`.
3. Loop `draw`: limpia, por partícula dibuja `arc(p.x, p.y, p.r)` color sólido + radial gradient `(p.r * 5)` con alpha 0x33 → transparent. Actualiza posición/opacidad. Si `y < -10` → reset a `canvas.height + 5`. Si `x` fuera → invierte `vx`.
4. Cleanup en unmount: `cancelAnimationFrame` + remove listener.

**ID del canvas:** `id="particle-canvas"` (lo posiciona la regla CSS de globals).

---

## 5. Refactor `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Rajdhani, Barlow_Condensed } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ParticleCanvas } from "@/components/shell/ParticleCanvas";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";

// fonts...

export const metadata: Metadata = { /* igual */ };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();
  return (
    <html lang="en" className={cn("h-full dark antialiased", geistSans.variable, geistMono.variable, inter.variable, rajdhani.variable, barlow.variable, "font-sans")}>
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <ParticleCanvas />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {userId && <TopBar />}
            <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
            {userId && <BottomNav />}
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
```

**Notas:**
- `auth()` es async en Clerk 7+ — el layout es async server component.
- `<TopBar />` también hace su propio `auth()` para cargar level (DRY-violation aceptable: dos llamadas a `auth()` en el render son baratas y mantienen `<TopBar />` autocontenido para reutilizar).
- `<ParticleCanvas />` se renderiza siempre (incluso en sign-in) → fondo bonito en toda la app.
- `<main>` envuelve `children` para que el scroll quede entre TopBar y BottomNav.

---

## 6. Eliminar `src/app/dashboard/Navbar.tsx`

Eliminar el archivo. Buscar referencias con grep antes:
```bash
rg -n "Navbar" src/
```
Si hay alguna importación residual aparte del root layout, limpiarla.

---

## 7. `src/lib/userLevel.ts`

```ts
import { db } from '@/db';
import { userLevels } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getOrCreateUserLevel(userId: string) {
  const existing = await db.query.userLevels.findFirst({
    where: eq(userLevels.userId, userId),
  });
  if (existing) return existing;

  const [created] = await db.insert(userLevels)
    .values({ userId })
    .returning();
  return created;
}
```

**Nota:** `db.query.userLevels` requiere que el schema exporte el `relations` correspondiente o esté registrado en el cliente Drizzle. Si el cliente actual (`src/db/index.ts`) usa `drizzle(sql, { schema })`, basta con haber añadido `userLevels` al import en `schema.ts`. **Verificar** `src/db/index.ts` durante la implementación.

---

## Funciones / utilidades reutilizadas

- `cn` de `@/lib/utils` — para componer className en root layout.
- `auth()` de `@clerk/nextjs/server` — patrón ya usado en `src/app/dashboard/page.tsx`.
- `db` de `@/db` — cliente Drizzle compartido.
- Patrón de `pgEnum` ya presente para `blockEnum` en `src/db/schema.ts:14`.

## Patrones existentes a mantener

- Spanish para comentarios y textos visibles al usuario (UI labels en inglés porque coinciden con el design handoff: "Base", "Status", etc.).
- `'use client'` solo en componentes que lo necesitan (RankBadge, XPBar, BottomNav, TopBarLevelButton, ParticleCanvas). TopBar permanece server.

---

## Verificación end-to-end

1. **Build & types**:
   - `npm run build` — sin errores TS.
   - `npm run lint` — sin warnings nuevos.

2. **Migración DB**:
   - `npx drizzle-kit generate` produce `0006_user_levels.sql`.
   - Aplicar en Neon (dev branch). Verificar con `mcp__Neon__describe_table_schema` que `user_levels` y `xp_events` existen con sus columnas y enum.

3. **Sign-in (`/`)**:
   - Cargar `/` sin loguear: se ve **solo** el ParticleCanvas + el contenido de sign-in. **No** se ve TopBar ni BottomNav.

4. **Login flow**:
   - Loguearse → al llegar a `/dashboard` aparecen TopBar y BottomNav.
   - Verificar fila de DB en `user_levels` para el `userId` (creada al primer render del TopBar).

5. **TopBar visual**:
   - Logo "A" con gradient azul + glow visible.
   - "AUSINLIFTING" en Rajdhani 700 15px, letter-spacing 0.06em.
   - 🔥 + número (0 al inicio) + animación bounce continua.
   - Badge LVL 1 con RankBadge "E" gris glow + texto "LVL 1" en Rajdhani.
   - Hover/tap del badge dispara escalado framer-motion.
   - XP bar 0/500 (0%) con cursor al inicio.

6. **BottomNav visual**:
   - 5 tabs visibles: ⚡ Base, 🛡️ Status, ⚔️ Training, 📜 Quests, 🏴 Guild.
   - En `/dashboard` → Base activa (label `#60a5fa`, icon con glow).
   - En `/dashboard/blocks` → Training activa.
   - Click en Status/Quests/Guild → no navega (cursor not-allowed).
   - Click en Base → navega a `/dashboard`. Click en Training → `/dashboard/blocks`.

7. **ParticleCanvas**:
   - Fondo con ~40 partículas tenues azul/cyan que ascienden lentamente.
   - Mezcla de blue (#3b82f6) y cyan (#22d3ee), aprox 65/35.
   - Resize de la ventana → canvas se redimensiona sin glitches.
   - DevTools Performance: requestAnimationFrame estable, sin leaks tras navegar entre rutas.

8. **Regresión funcional**:
   - `/dashboard/blocks` sigue mostrando bloques (la lógica del page no cambia).
   - `/dashboard/blocks/new`, `/dashboard/workouts/[id]` siguen accesibles vía clicks existentes (los botones internos del dashboard no cambian).
   - Modal `<dialog>` de "Añadir ejercicio" en `WorkoutSections.tsx` sigue abriendo y funcionando (no debe colisionar con z-index del shell).

9. **Z-index check**:
   - Modal nativo `<dialog>` usa el top-layer del browser → siempre por encima del TopBar/BottomNav (z-index 50). Verificar manualmente.

---

## Fuera de alcance (NO hacer)

- **No** implementar lógica real de XP / level up / streak. Esos hooks van en una feature posterior (`feature-xp-engine.md`, no creado).
- **No** implementar el Level Up Modal (`lvlReveal` + `sysPulse` keyframes ya están listos, pero el modal en sí no).
- **No** crear rutas `/status`, `/quests`, `/guild`. Las tabs están deshabilitadas a propósito.
- **No** añadir páginas de perfil ni historial de XP.
- **No** tocar la lógica de los Server Actions de workout/blocks. La conexión a `xpEvents` es trabajo futuro.
- **No** instalar shadcn nuevo ni replantear el sistema de tema OKLCH actual. Convivimos con tokens `--sl-*` paralelos.

---

## Prompt para ChatGPT 5.5

> Eres el ejecutor de un plan diseñado por un arquitecto senior. Lee y ejecuta el plan completo en `docs/plans/feature-layout-solo-leveling.md` del repo AusinLifting.
>
> **Contexto del repo:**
> - Next.js 16.2.4, React 19.2, TypeScript, Tailwind v4 (config CSS-based en `globals.css`), Drizzle ORM, Neon Postgres, Clerk Auth 7.
> - El repo tiene `AGENTS.md` que dice: *"This is NOT the Next.js you know. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."* — **antes de tocar `layout.tsx`, fonts, `auth()` o cualquier API de Next/Clerk, abre los docs locales en `node_modules/next/dist/docs/` y `node_modules/@clerk/nextjs/` y verifica las firmas exactas de la versión instalada**. No asumas APIs de Next 14 o 15.
> - Spec visual pixel-perfect en `design_handoff_solo_leveling/README.md`. Prototipo HTML en `design_handoff_solo_leveling/AusinLifting - Hunter System.html` — úsalo como referencia visual definitiva.
>
> **Tareas (en este orden):**
> 1. Instalar dependencia: `npm install framer-motion`.
> 2. Schema DB: añadir `userLevels`, `xpEvents`, `rankEnum` en `src/db/schema.ts`. Generar migración `npx drizzle-kit generate` (debería salir `drizzle/0006_user_levels.sql`). Aplicarla en Neon dev branch.
> 3. Globals: añadir tokens `--sl-*`, keyframes (`rankGlow`, `streakAnim`, `lvlReveal`, `sysPulse`), regla `#particle-canvas`, registrar `--font-rajdhani` y `--font-barlow` en `@theme inline`.
> 4. Fonts: añadir Rajdhani y Barlow Condensed con `next/font/google` en `src/app/layout.tsx`.
> 5. Crear `src/lib/userLevel.ts` con `getOrCreateUserLevel(userId)`.
> 6. Crear los componentes shell en `src/components/shell/`:
>    - `ranks.ts`, `RankBadge.tsx`, `XPBar.tsx`, `TopBarLevelButton.tsx`, `TopBar.tsx`, `BottomNav.tsx`, `ParticleCanvas.tsx`.
> 7. Refactor `src/app/layout.tsx` para integrar el nuevo shell con auth check (TopBar+BottomNav solo si `userId`, ParticleCanvas siempre).
> 8. **Eliminar** `src/app/dashboard/Navbar.tsx` y todas sus referencias.
> 9. Ejecutar `npm run build` y `npm run lint`. Resolver errores.
>
> **Reglas:**
> - **No** introduzcas features fuera de scope (ver sección "Fuera de alcance" del plan). El TopBar muestra placeholders, no lógica real de XP.
> - **No** "mejores" código adyacente que no toca el plan.
> - Las labels visibles del UI van en inglés ("Base", "Status", "Training", "Quests", "Guild", "AUSINLIFTING", "LVL N", "XP x / y") — coincide con el design handoff.
> - Comentarios y mensajes de error en español si los añades (convención del repo).
> - Si encuentras una API que difiere de la documentada en mi plan (ej. `auth()` de Clerk con firma distinta), **adáptate a la firma real del paquete instalado** y déjalo anotado en tu reporte final.
>
> **Entregables al terminar:**
> - Resumen de archivos creados / modificados / eliminados.
> - Capturas o screencast de: sign-in (solo canvas), `/dashboard` (shell completo + tab Base activa), `/dashboard/blocks` (tab Training activa), tap en tabs deshabilitadas (no navegan).
> - Confirmación de que `npm run build` y `npm run lint` pasan.
> - Confirmación de que existe la fila en `user_levels` tras el primer login (vía `mcp__Neon__run_sql` o psql).
> - Cualquier desviación del plan, justificada.
