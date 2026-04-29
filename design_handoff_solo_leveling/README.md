# Handoff: AusinLifting — Hunter System UI (Solo Leveling Redesign)

## Overview

Rediseño completo de la UI de AusinLifting con una estética inspirada en **Solo Leveling** (manhwa/anime). El concepto transforma la app de gym en un sistema RPG donde el usuario es un "Hunter" que sube de nivel, completa quests y pertenece a un guild. La gamificación incluye XP, niveles, rangos (E→S), quests diarias/semanales, streaks y títulos desbloqueables.

## About the Design Files

Los archivos HTML en este bundle son **prototipos de diseño de alta fidelidad** creados como referencia visual — **no son código de producción para copiar directamente**.

La tarea es **recrear estos diseños en el codebase existente de Next.js** (app router, Tailwind CSS, Drizzle ORM, Clerk auth) usando sus patrones y librerías establecidas. El archivo HTML existe para mostrar el look, las interacciones y el comportamiento exacto que debe tener la UI final.

## Fidelity

**Alta fidelidad (hifi).** Colores exactos, tipografía, espaciado, animaciones e interacciones están definidos pixel-perfect. El desarrollador debe recrear la UI fielmente usando el sistema de diseño del codebase.

---

## Design Tokens

### Colores

```css
/* Backgrounds */
--bg-base:      #06080f;   /* fondo global */
--bg-phone:     linear-gradient(175deg, #07101e 0%, #06080f 60%);
--bg-card:      linear-gradient(135deg, rgba(10,22,44,0.85), rgba(7,12,22,0.7));
--bg-card-2:    linear-gradient(135deg, rgba(10,20,40,0.9), rgba(6,10,20,0.8));

/* Accent Blue (principal) */
--accent-blue:  #3b82f6;
--accent-light: #60a5fa;
--accent-dim:   #1d4ed8;
--accent-pale:  #bfdbfe;

/* Cyan (secundario) */
--cyan:         #22d3ee;

/* Ranks */
--rank-E: #94a3b8;   /* gray */
--rank-D: #22c55e;   /* green */
--rank-C: #3b82f6;   /* blue */
--rank-B: #a855f7;   /* purple */
--rank-A: #f97316;   /* orange */
--rank-S: #f59e0b;   /* gold */

/* Status */
--xp-gain:   #34d399;   /* flash de XP ganada */
--complete:  #22c55e;   /* serie/quest completada */
--streak:    #f97316;   /* racha de días */
--gold:      #fbbf24;   /* títulos activos */

/* Text */
--text-primary:   #e2e8f0;
--text-secondary: rgba(148,163,184,0.7);
--text-muted:     rgba(148,163,184,0.45);
--text-accent:    #93c5fd;

/* Borders */
--border-card:    rgba(59,130,246,0.12);
--border-card-hv: rgba(59,130,246,0.30);
--border-nav:     rgba(59,130,246,0.10);
```

### Tipografía

```css
/* Headers / Números / Rangos / Botones */
font-family: 'Rajdhani', sans-serif;
/* Uso: nivel, rango, timer, botones CTA, nombres */

/* Labels del sistema / Secciones */
font-family: 'Barlow Condensed', sans-serif;
/* Uso: "— HUNTER STATUS —", "— QUESTS DIARIAS —", tabs, stats */

/* Cuerpo / Descripiciones */
font-family: 'Inter', sans-serif;
/* Uso: texto de quests, notas, contenido general */
```

Google Fonts a importar:
```
https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Barlow+Condensed:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap
```

### Espaciado base

```
gap pequeño:  8px
gap medio:    12–14px
gap grande:   20px
padding card: 14px 16px
border-radius card: 10px
border-radius badge: 5px
border-radius rank:  4-5px (cuadrado, no circular)
```

### Animaciones

```css
/* Rank badge: glow pulsante continuo */
@keyframes rankGlow {
  0%, 100% { box-shadow: 0 0 6px var(--rank-color-glow); }
  50%       { box-shadow: 0 0 18px var(--rank-color-glow), 0 0 32px var(--rank-color-glow2); }
}
animation: rankGlow 2.5s ease-in-out infinite;

/* Streak flame: oscilación */
@keyframes streakAnim {
  0%, 100% { transform: scaleY(1) rotate(-3deg); }
  50%       { transform: scaleY(1.15) rotate(3deg); }
}
animation: streakAnim 1.8s ease-in-out infinite;

/* Entrada de pantalla */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* XP ganada (flash flotante) */
@keyframes xpGain {
  0%   { opacity: 0; transform: translateY(0); }
  30%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-28px); }
}

/* System notification (Level Up modal) */
@keyframes lvlReveal {
  0%   { opacity: 0; transform: scale(0.88) translateY(24px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes sysPulse {
  0%, 100% { border-color: rgba(59,130,246,0.3); box-shadow: 0 0 20px rgba(59,130,246,0.15); }
  50%       { border-color: rgba(96,165,250,0.7); box-shadow: 0 0 40px rgba(59,130,246,0.4); }
}

/* XP Bar fill */
transition: width 1.2s cubic-bezier(.25,.8,.25,1);

/* Portal spin (Level Up modal ring) */
@keyframes portalSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Scanlines overlay (efecto atmosférico) */
background: repeating-linear-gradient(
  0deg,
  transparent, transparent 3px,
  rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px
);
```

---

## Sistema de Partículas

Partículas flotantes tipo "maná" en el fondo. Implementar con `<canvas>` posicionado `fixed` con `z-index: 0` (detrás de todo el contenido, que va en `z-index: 1`).

```typescript
// Parámetros de cada partícula
type Particle = {
  x: number;      // posición X aleatoria
  y: number;      // posición Y aleatoria (empieza random, sube)
  r: number;      // radio: 0.3 – 1.7px
  vy: number;     // velocidad vertical: -0.08 a -0.33 (sube)
  vx: number;     // drift horizontal: -0.075 a +0.075
  opacity: number;// 0.1 – 0.55 (oscila)
  cyan: boolean;  // 35% cyan (#22d3ee), 65% blue (#3b82f6)
}

// Cada partícula dibuja:
// 1. Un punto sólido con el color + opacidad
// 2. Un halo radial (gradiente circular, radio ×5, opacidad ~0.2)

// Cuando y < -10: resetear a y = canvas.height, x aleatorio
// Cuando x sale del canvas: invertir vx
// Densidad: 40 partículas por defecto (configurable 0–80)
```

---

## Screens / Views

### Layout Global (Mobile, 390px)

```
┌─────────────────────────────┐
│         TOP BAR (60px)      │  ← Fixed, no scroll
├─────────────────────────────┤
│                             │
│      SCREEN CONTENT         │  ← flex:1, overflow-y: auto
│       (scrollable)          │
│                             │
├─────────────────────────────┤
│      BOTTOM NAV (58px)      │  ← Fixed, no scroll
└─────────────────────────────┘
```

**Top Bar:**
- Background: transparent (gradiente del phone se ve detrás)
- Padding: 12px 16px
- Border-bottom: 1px solid rgba(59,130,246,0.07)
- Row 1 (flex, align-center):
  - Logo: div 30×30px, border-radius 7px, background `linear-gradient(135deg,#1d4ed8,#0ea5e9)`, box-shadow `0 0 12px rgba(59,130,246,0.4)`. Letra "A" en Rajdhani 700 13px blanco.
  - Nombre "AUSINLIFTING": Rajdhani 700 15px `#e2e8f0`, letter-spacing 0.06em
  - Spacer flex:1
  - Streak: emoji 🔥 (15px, animación streakAnim) + número Rajdhani 700 14px `#f97316`
  - Level badge: flex row gap-6, padding 3px 9px, border-radius 5px, border `1px solid rgba(59,130,246,0.25)`, bg `rgba(59,130,246,0.06)`. Contiene RankBadge (sm) + "LVL 23" en Rajdhani 700 13px `#93c5fd`. **Click abre Level Up Modal.**
- Row 2: XP Bar (ver componente)

**Bottom Nav (5 tabs):**
- Background: `rgba(5,7,13,0.97)` + `backdrop-filter: blur(12px)`
- Border-top: 1px solid rgba(59,130,246,0.1)
- Tabs: BASE ⚡, STATUS 🛡️, TRAINING ⚔️, QUESTS 📜, GUILD 🏴
- Tab activo: label `#60a5fa`, icon con `filter: drop-shadow(0 0 5px rgba(96,165,250,0.7))`
- Tab inactivo: label `rgba(148,163,184,0.4)`, icon opacity 0.3
- Labels: Barlow Condensed 700 8px, letter-spacing 0.1em, uppercase

---

### Componentes Compartidos

#### RankBadge
```
Tamaños:
  sm: 22×22px, font 11px
  md: 28×28px, font 14px  (default)
  lg: 44×44px, font 22px
  xl: 64×64px, font 32px

Estilo:
  border-radius: ~18% del tamaño (cuadrado redondeado, NO círculo)
  border: 1.5px solid {rankColor}
  color: {rankColor}
  background: {rankColor}10  (5% opacidad)
  animation: rankGlow 2.5s infinite
  font-family: Rajdhani 700
  
Rank colors:
  E → #94a3b8 (glow: rgba(148,163,184,0.5))
  D → #22c55e (glow: rgba(34,197,94,0.5))
  C → #3b82f6 (glow: rgba(59,130,246,0.6))
  B → #a855f7 (glow: rgba(168,85,247,0.6))
  A → #f97316 (glow: rgba(249,115,22,0.6))
  S → #f59e0b (glow: rgba(245,158,11,0.7))
```

#### XP Bar
```
Track: height 5px, bg rgba(59,130,246,0.08), border-radius 3px,
       border 1px solid rgba(59,130,246,0.15)

Fill:  background: linear-gradient(90deg, #1d4ed8, #3b82f6, #7dd3fc)
       box-shadow: 0 0 8px rgba(96,165,250,0.7), 0 0 20px rgba(59,130,246,0.3)
       transition: width 1.2s cubic-bezier(.25,.8,.25,1)
       
       ::after (cursor de punta):
         width 3px, height 11px, absolute right:-1px top:-3px
         background #bfdbfe, border-radius 2px
         box-shadow: 0 0 6px #60a5fa

Labels: Barlow Condensed, font-size 10px, color rgba(96,165,250,0.6)
        Izquierda: "XP 7.450 / 10.000"
        Derecha: "75%"
        margin-top: 5px
```

#### SysLabel (etiquetas de sección)
```
Font: Barlow Condensed 700
Size: 10px
Letter-spacing: 0.18em
Uppercase
Color: rgba(96,165,250,0.55)
Formato: "— NOMBRE SECCIÓN —"
```

#### Title Badge
```
display: inline-flex, gap 6px
border: 1px solid rgba(245,158,11,0.3)
border-radius: 5px
padding: 3px 10px
background: rgba(245,158,11,0.06)
font-size: 11px, font-weight 600
color: #fbbf24
letter-spacing: 0.04em
Prefijo "✦ " cuando está activo

Inactivo: border rgba(255,255,255,0.08), bg rgba(255,255,255,0.02), color rgba(148,163,184,0.5)
```

#### Glow Button (CTA principal)
```
border: 1px solid rgba(59,130,246,0.4)
border-radius: 8px
background: rgba(59,130,246,0.1)
color: #93c5fd
font: Rajdhani 700 15px, letter-spacing 0.1em, uppercase
padding: 12px 20px
width: 100%
box-shadow: 0 0 12px rgba(59,130,246,0.15)

:hover → bg rgba(59,130,246,0.2), border rgba(96,165,250,0.6), shadow 0 0 24px rgba(59,130,246,0.3), color #bfdbfe
:active → transform scale(0.98)

Variante verde (completar workout):
  border: rgba(34,197,94,0.3), bg: rgba(34,197,94,0.1), color: #86efac
```

---

### Screen 1: Dashboard (Base)

Secciones en orden vertical (todas con 14–20px gap entre secciones):

**1. Hunter Status Card** (`sl-card`)
```
position: relative, overflow: hidden
Decoración: radial-gradient en top-right con color del rango actual (opacity ~0.12)

Contenido:
  - SysLabel "— HUNTER STATUS —"
  - Row (gap 12px, margin-top 10px, margin-bottom 12px):
    - RankBadge size="lg"
    - Column:
        Nombre: Rajdhani 700 22px #e2e8f0, letter-spacing 0.04em
        TitleBadge activo (font-size 10px)
    - ml-auto, text-right:
        Nivel: Rajdhani 700 28px, color = rankColor, line-height 1
        Label: "NIVEL", Barlow Condensed 700 9px, rgba(148,163,184,0.5), uppercase
  - XPBar (mismo que top bar pero aquí también aparece)
```

**2. Misión Activa Card** (`sl-card`, hover effect, cursor pointer → navega a Training)
```
Row: flex, justify-between, align-items flex-start, margin-bottom 8px
  Izquierda:
    Nombre bloque: Rajdhani 700 16px #e2e8f0, letter-spacing 0.03em
    Workout name: 11px rgba(148,163,184,0.6), margin-top 2px
  Derecha:
    "SEM 2/8": Barlow Condensed 600 11px rgba(96,165,250,0.7), letter-spacing 0.06em

Progress bar genérica (4px height, azul)
Botón Glow "⚔ INICIAR ENTRENAMIENTO" (font-size 13px, letter-spacing 0.12em)
```

**3. Quests Diarias** (lista de 3 cards)
```
SysLabel + contador "2/3" (font-size 10px, color rgba(96,165,250,0.5), margin-left 8px)

Cada quest card:
  display flex, align-items center, gap 10px
  Círculo 22px:
    Done → bg rgba(34,197,94,0.12), border rgba(34,197,94,0.45), color #4ade80, texto "✓"
    Pending → bg rgba(59,130,246,0.06), border rgba(59,130,246,0.22), texto "○"
  Texto quest: 12px, done → color rgba(148,163,184,0.5) + line-through
  Reward XP: Barlow Condensed 700 10px, done → rgba(34,197,94,0.5) / pending → rgba(96,165,250,0.6)
  
Quest card done: border rgba(34,197,94,0.2), bg darker green tint
```

**4. Guild Card** (`sl-card`, cursor pointer → navega a Guild)
```
display flex, align-items center, gap 12px
Emoji: 🏴 font-size 24px
Nombre guild: Rajdhani 700 15px #e2e8f0
Subtítulo: "4 hunters activos", 11px rgba(148,163,184,0.5)
Flecha ›: ml-auto, rgba(96,165,250,0.4), font-size 16px
```

---

### Screen 2: Status

**Hunter Header** (centrado, padding 16px 0 20px):
```
Decoración: radial-gradient bg rgba(168,85,247,0.08) centrado arriba
RankBadge size="xl"
Nombre: Rajdhani 700 28px #e2e8f0, letter-spacing 0.06em, margin-top 12px
TitleBadge activo
Guild: "Guild: Shadow Legion" en 12px rgba(148,163,184,0.5/0.8)
```

**Stats Card** (3 columnas separadas por divisores 1px):
```
Cada columna: text-align center
Número: Rajdhani 700 36px, color según stat (nivel=rankColor, streak=#f97316, quests=#a855f7)
Label: SysLabel debajo
```

**Rank Progression** (fila horizontal E→D→C→B→A→S):
```
Cada nodo: cuadrado 32px, border-radius 6px
  Pasado: border rankColor, color rankColor, bg rankColor08 (sin glow)
  Actual: border rankColor, color rankColor, bg rankColor18, box-shadow 0 0 12px rankColorGlow
  Futuro: border rgba(255,255,255,0.1), color rgba(255,255,255,0.2)

Líneas entre nodos: height 2px, flex:1
  Pasado/actual → gradient del color anterior al actual
  Futuro → rgba(255,255,255,0.05)

Indicador dot bajo nodo actual: 4×4px circle, color = rankColor, glow

Texto informativo debajo: "Próximo rango: RANGO B — supera tus PRs actuales"
  11px rgba(148,163,184,0.5), text-align center
  "RANGO B" en rankColor[B] font-weight 600
```

**Títulos** (flex-wrap, gap 8px):
```
Todos los títulos del hunter como TitleBadge
Inactivos con opacity normal (estilo inactive)
2 títulos bloqueados: TitleBadge inactive, opacity 0.4, texto "🔒 ???"
```

---

### Screen 3: Training

**Header:**
```
SysLabel "— ENTRENAMIENTO EN CURSO —"
Workout name: Rajdhani 700 18px #e2e8f0, margin-top 4px, letter-spacing 0.03em
```

**Timer + Progreso Card** (`sl-card`, flex row gap 16px):
```
Timer (col izquierda):
  Formato "MM:SS", Rajdhani 700 32px #60a5fa, letter-spacing 0.06em
  Click → pause/resume
  Subtítulo: "▶ RUNNING" / "⏸ PAUSED", Barlow Condensed 9px rgba(96,165,250,0.5)

Progreso (col derecha, flex:1):
  Label "Series completadas" 11px rgba(148,163,184,0.6)
  Número: Rajdhani 700 14px #60a5fa (X/Y)
  Progress bar genérica

XP Flash (posición absoluta, aparece al completar set):
  "+30 XP" en Rajdhani 700 18px #34d399
  Animación xpGain (fade up, ~1.1s)
```

**Lista de Ejercicios** (accordion, gap 10px):

Cada ejercicio (`sl-card`, padding 0):
```
Header botón (click → toggle):
  padding: 12px 16px, display flex, align-items center, gap 10px
  Dot indicador: 6×6px circle, color #22c55e (completo) / #3b82f6 (pendiente), con glow
  Nombre: Rajdhani 600 15px #e2e8f0, letter-spacing 0.03em
  Contador "X/Y": Barlow Condensed 600 11px rgba(96,165,250,0.6)
  Chevron ›: fontSize 13px, rotate 90deg si abierto (transition 0.2s)

Body (cuando abierto), padding 0 16px 12px:
  Header row grid (4 cols: 24px 1fr 48px 48px):
    Labels: "" | "SERIE" | "KG" | "REPS"
    Barlow Condensed 700 9px rgba(96,165,250,0.4) uppercase

  Cada set row (mismo grid):
    Col 1: Checkbox (.set-ck)
      Normal:  border rgba(59,130,246,0.3), bg rgba(59,130,246,0.04), 24×24px border-radius 5px
      Done:    bg rgba(34,197,94,0.14), border rgba(34,197,94,0.45), glow rgba(34,197,94,0.2), texto "✓"
    Col 2: "#1" Barlow Condensed 600 12px rgba(148,163,184,0.7)
    Col 3: kg Rajdhani 600 13px (atenuado si done)
    Col 4: "×reps" Rajdhani 600 13px (atenuado si done)
```

**CTA Final:**
```
Glow Button variante verde "✦ COMPLETAR ENTRENAMIENTO"
```

---

### Screen 4: Quests

**Quests Diarias** (interactivas, click toggle):
```
Cada card clickable (animación questDone al completar):
  Círculo 26px:
    Done → bg rgba(34,197,94,0.12), border rgba(34,197,94,0.45), color #4ade80, "✓"
    Pending → circle "○", color rgba(96,165,250,0.5)
  Título: 13px, done → line-through + color rgba(148,163,184,0.45)
  Reward XP: Barlow Condensed 700 10px
  Badge "COMPLETADA": Barlow Condensed 700 10px #4ade80 (solo cuando done)
```

**Quests Semanales** (con progress bar individual):
```
Cada card (no interactiva):
  Icono ◇ en 26px circle, color rgba(168,85,247,0.5)
  Título, reward XP
  Progreso "X/Y": Rajdhani 700 11px rgba(168,85,247,0.6)
  Progress bar: color purple (linear-gradient(90deg, #7e22ce, #a855f7))
```

**Misiones de Bloque:**
```
Card con nombre bloque, workout semana actual, progress bar, badge "EN CURSO"
```

---

### Screen 5: Guild

**Guild Header** (centrado):
```
Decoración: radial-gradient rgba(168,85,247,0.08) arriba
Emoji 🏴 (40px)
Nombre guild: Rajdhani 700 26px #e2e8f0, letter-spacing 0.06em, uppercase
Subtítulo: "Guild Lv. 7 · 4 hunters"

Stats row (3 cols, gap 20px, justify center, margin-top 16px):
  Guild XP: "24.800" en rgba(168,85,247,0.8) Rajdhani 700 20px
  Rango: "B" en color rank B
  Victorias: "142" en rgba(245,158,11,0.8)
  Labels: Barlow Condensed 700 9px uppercase
```

**Lista de Hunters** (cada row es `sl-card`, flex, gap 12px):
```
Avatar: 36×36px, border-radius 8px
  bg: linear-gradient(135deg, rankColor20, rankColor08)
  border: 1px solid rankColor30
  Inicial del nombre en rankColor, Rajdhani 700 13px

Info:
  Nombre: Rajdhani 700 14px #e2e8f0
  Badge "YOU": si es el usuario actual
    9px, rgba(96,165,250,0.6), Barlow Condensed 700, bg/border blue, border-radius 3px
  Rol · Nivel: 10px rgba(148,163,184,0.5)

Right col (flex-direction column, align-items flex-end, gap 3px):
  RankBadge size="sm"
  Streak: emoji 🔥 + número #f97316 Rajdhani 600 11px
```

**Guild Quests:**
```
2 quest cards (similar a weekly quests pero con progress bar purple)
```

---

### Level Up Modal

Se activa al ganar suficiente XP / click en el level badge (dev puede decidir el trigger real).

```
Overlay: position fixed, inset 0, bg rgba(2,3,8,0.96)
  Click fuera → cerrar

Box (max-width 310px, text-align center):
  border: 1px solid rgba(59,130,246,0.4)
  border-radius: 14px
  padding: 40px 30px
  bg: linear-gradient(160deg, rgba(10,22,45,0.99), rgba(5,8,18,0.99))
  animation: lvlReveal 0.4s ease, sysPulse 2.5s 0.4s infinite
  
  Pseudo ::before: línea superior centrada (60% ancho), gradient horizontal, 1px height
  Pseudo ::after: radial-gradient desde arriba (glow ambiental)
  
  Esquinas decorativas (position absolute, 14×14px):
    Cada esquina: 2 borders de 1.5px solid rgba(96,165,250,0.6), border-radius 2px
    TL: border-top + border-left
    TR: border-top + border-right
    BL: border-bottom + border-left
    BR: border-bottom + border-right

  Contenido (de arriba abajo):
    Portal ring: 80×80px círculo, margin auto, posición relative
      Anillo exterior: 2px border rgba(59,130,246,0.3)
      Anillo interior (inset 4px): 1px border rgba(59,130,246,0.2), spin 3s linear
      Anillo punteado (inset -6px): 1px dashed rgba(59,130,246,0.15), spin 8s reverse
      Centro: RankBadge size="lg"
    
    SysLabel "— SYSTEM NOTIFICATION —"
    
    "LEVEL UP" grande:
      font: Rajdhani 700 64px, line-height 1
      background: linear-gradient(180deg, #bfdbfe 0%, #3b82f6 60%, #1d4ed8 100%)
      -webkit-background-clip: text (text gradient)
      filter: drop-shadow(0 0 16px rgba(59,130,246,0.6))
    
    "LEVEL 24" (nuevo nivel):
      Rajdhani 700 28px #93c5fd, letter-spacing 0.08em
    
    Texto descriptivo: 12px rgba(148,163,184,0.7), line-height 1.6
    
    Nuevo título desbloqueado:
      "✦ Nuevo título:" + TitleBadge
    
    Glow Button "CONTINUAR"
```

---

## State Management (datos a persistir en DB)

### Nuevas tablas necesarias (Drizzle ORM):

```typescript
// Hunter profile (extiende users existentes via Clerk userId)
hunterProfiles: {
  userId: string (PK, FK Clerk)
  level: integer (default 1)
  xp: integer (default 0)
  xpToNextLevel: integer (default 1000)
  rank: enum('E','D','C','B','A','S') (default 'E')
  streak: integer (default 0)
  lastWorkoutDate: date
  activeTitle: string
  createdAt: timestamp
}

// Titles (logros desbloqueados)
hunterTitles: {
  id: serial PK
  userId: string
  title: string
  unlockedAt: timestamp
}

// Quests
quests: {
  id: serial PK
  userId: string
  title: string
  type: enum('daily','weekly','block')
  xpReward: integer
  done: boolean
  doneAt: timestamp | null
  expiresAt: timestamp (para daily/weekly)
  createdAt: timestamp
}

// Guild
guilds: {
  id: serial PK
  name: string
  level: integer (default 1)
  xp: integer (default 0)
  createdAt: timestamp
}

guildMembers: {
  guildId: integer FK
  userId: string FK
  role: enum('leader','vice','member')
  joinedAt: timestamp
}
```

### XP Rules (lógica de gamificación sugerida):
```
Completar entrenamiento:        +300 XP
Registrar ejercicio:            +50 XP
Superar PR:                     +500 XP
Quest diaria completada:        +150–500 XP (según quest)
Quest semanal completada:       +800–1000 XP
Quest de guild:                 +1500–2000 XP (dividida entre miembros)
Streak diario (bonus ×día):     +50 XP × día de streak
Streak especial (7, 14, 30):    notificación especial

XP para level up: level × 500 (configurable)
Rank up: automático al alcanzar niveles milestone (10→D, 25→C, 50→B, 80→A, 100→S)
```

---

## Integración con Next.js existente

### Estructura de rutas sugerida:
```
app/
  dashboard/
    page.tsx          → Dashboard (Base) screen
    status/
      page.tsx        → Status screen  
    training/
      [workoutId]/
        page.tsx      → Training screen (workout en curso)
    quests/
      page.tsx        → Quests screen
    guild/
      page.tsx        → Guild screen
      [guildId]/
        page.tsx      → Guild detail
```

### Componentes nuevos a crear:
```
components/
  hunter/
    RankBadge.tsx
    XPBar.tsx
    TitleBadge.tsx
    LevelUpModal.tsx
    HunterStatusCard.tsx
  layout/
    TopBar.tsx          (reemplaza Navbar actual)
    BottomNav.tsx       (nuevo, mobile-first)
    ParticleCanvas.tsx  (canvas de partículas)
  quest/
    QuestCard.tsx
    QuestList.tsx
  training/
    ExerciseAccordion.tsx
    SetRow.tsx
    WorkoutTimer.tsx
  guild/
    GuildHeader.tsx
    MemberRow.tsx
```

### Layout global (app/dashboard/layout.tsx):
```tsx
// Reemplazar el layout actual por:
// - ParticleCanvas (fixed, z-index 0)
// - TopBar con XP bar y rank (z-index 1)
// - {children} con overflow-y scroll
// - BottomNav (z-index 1)
// Todo con el fondo #06080f (dark mode forzado)
```

---

## Assets

- **Fuentes**: Rajdhani, Barlow Condensed, Inter (Google Fonts)
- **Imágenes de personaje**: Las imágenes `/images/DashboardBackground{1-7}.png` que ya existen en `/public/images/` se pueden reutilizar con un tratamiento de opacidad/glow más dramático
- **Iconos**: Solo emojis Unicode (sin librerías de iconos adicionales) — ⚡🛡️⚔️📜🏴🔥✓○◇✦🔒
- **Logo**: Generado con CSS (div con gradiente azul + letra "A")

---

## Files

| Archivo | Descripción |
|---|---|
| `AusinLifting — Hunter System.html` | Prototipo completo interactivo (referencia principal) |
| `tweaks-panel.jsx` | Panel de tweaks (solo para el prototipo, no para producción) |

---

## Notas para el Desarrollador

1. **Mobile-first**: El diseño es para 390px de ancho. En desktop, centrar el contenido con max-width 390px y añadir un fondo decorativo lateral (o extender el layout a 2 columnas).

2. **Dark mode forzado**: La app siempre va en dark. No implementar light mode para esta feature.

3. **Fuentes**: Añadir las Google Fonts al `layout.tsx` global o al `next/font` setup.

4. **Partículas**: El canvas de partículas es un efecto visual, no crítico. Usar `requestAnimationFrame` con cleanup en `useEffect`. Pausar si el tab está oculto (`document.visibilityState`).

5. **Animaciones**: Las animaciones de glow (`rankGlow`, `sysPulse`) son continuas con `animation-iteration-count: infinite`. Las de entrada (`slideUp`) se disparan una vez al montar el componente.

6. **XP Bar**: La transición del fill (`width 1.2s`) debe verse al cargar la pantalla y al ganar XP. Animar desde 0 al valor real al montar.

7. **Level Up Modal**: Se puede disparar programáticamente cuando `xp >= xpToNextLevel`. En el prototipo, se activa con click en el badge de nivel del TopBar.

8. **Quest toggle (Training)**: Al marcar una serie como completada, mostrar el flash "+30 XP" animado durante ~1.1s y luego desaparecer.

9. **Streak**: Incrementar el streak solo si el usuario entrena en días consecutivos. Resetear a 0 si pasa un día sin entrenar.
