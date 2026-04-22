# Handoff: AusinLifting — 4 UI Pages

## Overview

This package contains a high-fidelity interactive prototype for **AusinLifting**, a personal gym tracking web app. The design covers 4 core pages:

1. **Dashboard** — entry point after login; blocks list + standalone workouts + decorative character
2. **Block detail** — weeks inside a block, each expandable to show its workouts
3. **Workout detail** — 4 collapsible sections (Movilidad / Básicos / Entrenamiento / Cardio) with inline set editing
4. **New workout form** — 2-step creation flow (name + notes → section selection)

## About the Design Files

The file `AusinLifting Prototype.html` is a **design reference built in HTML + React (Babel)**. It is a prototype showing intended look, layout, and behavior — not production code to copy directly.

Your task is to **recreate these designs inside the existing Next.js 15 (App Router) + Tailwind CSS codebase**, using its established patterns (Server Components, `drizzle-orm` queries, Clerk auth, server actions). Match the visual fidelity as closely as possible.

## Fidelity

**High-fidelity.** Colors, typography, spacing, interactions, hover states, and copy are all final and should be matched pixel-for-pixel using the codebase's existing Tailwind config and `globals.css` tokens.

---

## Design Tokens

All values come from `globals.css` dark mode (`.dark` class):

| Token | Value | Tailwind approx |
|---|---|---|
| Background | `oklch(0.145 0 0)` | `zinc-950` |
| Card | `oklch(0.205 0 0)` | `zinc-900` |
| Card hover | `oklch(0.22 0 0)` | `zinc-800/80` |
| Border | `oklch(1 0 0 / 10%)` | `zinc-800` |
| Border hover | `oklch(1 0 0 / 22%)` | `zinc-700` |
| Text primary | `oklch(0.985 0 0)` | `zinc-100` |
| Text muted | `oklch(0.708 0 0)` | `zinc-400` |
| Text subtle | `oklch(0.556 0 0)` | `zinc-500` |
| zinc-800 fill | `oklch(0.269 0 0)` | `zinc-800` |
| Primary button bg | `oklch(0.922 0 0)` | `zinc-100` |
| Primary button fg | `oklch(0.205 0 0)` | `zinc-900` |
| Danger | `oklch(0.704 0.191 22.216)` | `red-400` |
| Border radius | `0.625rem` | `rounded-[0.625rem]` |

**Typography:**
- Font: `'Helvetica Neue', Helvetica, Arial, sans-serif` (Geist via `next/font` in the actual app)
- Base size: 13px
- Section labels: 11px, `font-semibold`, `uppercase`, `tracking-widest`, color muted
- Headings: 22px, `font-semibold`, `tracking-tight`
- Body: 13px, `font-normal`
- Small/meta: 11–12px, color subtle

---

## Page 1 — Dashboard (`/dashboard`)

### Layout
Two-column layout (desktop):
- **Left column** (absolute, `width: 46%`): decorative character image, bottom-aligned, large (up to 88% viewport height). Has a gradient fade overlay on the right edge (`linear-gradient(to right, transparent → bg-color)`). Also a radial vignette to soften white background of the PNG. Apply `mix-blend-mode: darken` to the `<img>` to knock out white backgrounds.
- **Right column** (flex: 1, starts after a 44% spacer): content area, max-width ~480px, padding `32px 40px 32px 24px`.

Character image path: `/images/DashboardBackground{N}.png` where N = day of week (Mon=1 … Sun=7).

### Content (right column)
```
h1: "Dashboard"                          — 22px semibold

[Crear bloque]  [Crear entreno]          — Primary + Ghost buttons, gap 8px

BLOQUES                                  — section label (uppercase 11px muted)
  ┌──────────────────────────────────────┐
  │ Fuerza Base              2 semanas  │  — border card, hover border brightens
  │ Ciclo 12 semanas...                  │
  └──────────────────────────────────────┘
  ┌──────────────────────────────────────┐
  │ Prep. Competición        4 semanas  │
  │ Pico de fuerza...                    │
  └──────────────────────────────────────┘

ENTRENOS SUELTOS                         — section label
  ┌──────────────────────────────────────┐
  │ Cardio spinning             20 abr  │
  └──────────────────────────────────────┘
  ┌──────────────────────────────────────┐
  │ Técnica arranque            18 abr  │
  │ Sin carga, solo movimiento           │
  └──────────────────────────────────────┘
```

### List item card
```
border: 1px solid oklch(1 0 0 / 10%)
border-radius: 0.625rem
padding: 12px 16px
hover: border brightens to oklch(1 0 0 / 22%), bg oklch(0.22 0 0)
transition: border-color 0.15s, background 0.15s
cursor: pointer
```
Left: `font-medium text-zinc-100` name + `text-zinc-400 text-xs mt-0.5` notes
Right: `text-zinc-500 text-xs` (week count or date)

### Buttons
**Primary** (`Crear bloque`):
```
bg: oklch(0.922 0 0)  color: oklch(0.205 0 0)
padding: 7px 14px  font-size: 13px  font-weight: 500
border-radius: 0.625rem  border: none
hover: opacity 0.85
```
**Ghost** (`Crear entreno`):
```
bg: none  color: zinc-100
border: 1px solid oklch(1 0 0 / 18%)
same padding/radius as primary
hover: bg oklch(0.269 0 0), border oklch(1 0 0 / 28%)
```

---

## Page 2 — Block Detail (`/dashboard/blocks/[blockId]`)

### Layout
Single content column, `max-width: ~640px`, `padding: 28px`.

### Header
```
← Dashboard                              — back link, zinc-400, hover zinc-100, font-size 12px

Fuerza Base                              — h1 22px semibold
Ciclo 12 semanas hipertrofia → fuerza   — notes, zinc-400 13px, mt-4

[Guardar bloque]  Eliminar              — Primary btn + danger text btn (right-aligned)

[+ Añadir semana]                       — Ghost button, mb-20
```

### Week list (accordion)
Each week is a bordered card with a header row. Clicking expands it to show workouts.

**Week header row** (`padding: 10px 14px`):
```
▶  Semana 1    [M] [B] [E] [C]    [+ Entreno]  Eliminar
```
- Arrow icon rotates 90° when open (`transition: transform 0.2s`)
- Section dots: 22×22px circles, `border-radius: 50%`, `font-size: 10px font-weight: 600`
  - Active: `bg oklch(0.922 0 0) color oklch(0.205 0 0)`
  - Inactive: `bg oklch(0.269 0 0) color oklch(0.556 0 0)`
  - Labels: M=Movilidad, B=Básicos, E=Entrenamiento, C=Cardio
- `[+ Entreno]` ghost button, small (`padding: 4px 10px, font-size: 12px`)
- `Eliminar` danger text

**Expanded week content** (below header, `border-top: 1px solid border`):
```
padding: 8px 0
  Día A — Sentadilla + Press         7 abr   — clickable row, hover bg zinc-800
  Día B — Peso muerto + Jalones      9 abr
```
Workout rows: `padding: 9px 14px 9px 36px`, `font-size: 12px`, full-width button.
Empty state: `"Sin entrenos aún."` in zinc-500, 12px, padded.

**Collapse animation:**
```css
overflow: hidden;
transition: max-height 0.2s ease, opacity 0.2s ease;
open:  max-height: 2000px; opacity: 1;
closed: max-height: 0; opacity: 0;
```

---

## Page 3 — Workout Detail (`/dashboard/workouts/[workoutId]`)

### Layout
Single column, `max-width: ~640px`, `padding: 28px`.

### Header
```
← Dashboard

Día A — Sentadilla + Press           Eliminar  (danger text, top-right)
Semana 1, mantener técnica limpia    — notes, zinc-400
```

### 4 Sections (same collapse animation as weeks above)

Each section is a bordered card:
```
border: 1px solid oklch(1 0 0 / 10%)
border-radius: 0.625rem
overflow: hidden
```

**Section header button** (`padding: 10px 14px`, full width):
```
Left: section title — 13px font-weight: 600
Right: ▼ chevron — rotates -90deg when closed
```

**Section body** (`border-top: 1px solid border`, `padding: 12px 14px`, `gap: 16px`):
Contains exercise blocks, then `+ Añadir ejercicio` link.

### Exercise block (inside section)
```
Exercise name row:
  [exercise name]  font-weight: 500 13px    [Quitar] danger text

Set rows (per set):
  MOVILIDAD:
    Set N  [____seg____]  [____notas_______________________]

  BASICS / MAIN:
    Set N  [___kg___]  ×  [__reps__]  RIR  [_rir_]  [___notas___]
    Warmup sets: label "WN" in zinc-500 (vs "Set N" in zinc-400)
```

**Input fields:**
```
background: oklch(1 0 0 / 8%)
border: 1px solid oklch(1 0 0 / 12%)
border-radius: 5px
color: zinc-100
padding: 5px 8px
font-size: 12px
focus: border-color oklch(1 0 0 / 30%)
placeholder: zinc-500

Widths:
  kg field: 58px
  reps: 52px
  rir: 44px
  duration (cardio): 60px
  notes: flex-1, min-width 50px
```

**`+ Añadir ejercicio` link:**
```
color: zinc-400, font-size: 12px
hover: zinc-100
When clicked: expands inline to show a text input + [Añadir] ghost btn + ✕ close
```

### Default open/closed state
All 4 sections open by default. User can collapse individually.

### Save button
```
[Guardar entreno]  — Primary button, self-start
After save: shows "✓ Guardado" text + "Los cambios se han guardado." in zinc-400 for 1.8s
```

---

## Page 4 — New Workout Form (`/dashboard/workouts/new`)

### Layout
Single column, `max-width: ~520px`, `padding: 28px`.

### Step 1 — Basic info
```
← Dashboard

Nuevo entreno                            — h1

[===|===]                               — 2-segment progress bar, height 2px
                                          active: oklch(0.922 0 0), inactive: oklch(0.269 0 0)
                                          transition: background 0.3s

Description text in zinc-400

Nombre (opcional)
[________________________________]

Notas (opcional)
[________________________________]
[________________________________]
[________________________________]

[Crear entreno]  [Cancelar]
```

### Step 2 — Section selection (after submit)
Title changes to the workout name (or "Entreno sin nombre").
Progress bar fills completely.
```
"Añade secciones al entreno:"

┌─────────────────────────────────────────┐
│ Movilidad                    + Añadir  │
│ Estiramientos y activación             │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Básicos                      + Añadir  │
│ Ejercicios de fuerza general           │
└─────────────────────────────────────────┘
... (Entrenamiento, Cardio same pattern)

[Ir al entreno →]
```
Section cards toggle on click: `bg oklch(0.269 0 0)`, border brightens, label changes to `✓ Añadido` in zinc-100.

---

## Navbar

Height: 48px, `border-bottom: 1px solid oklch(1 0 0 / 10%)`.

```
[icon]  AusinLifting    Dashboard  Bloques          [D avatar]
```
- **Icon**: `28×28px`, `border-radius: 6px`, image from `/images/icon.png`
- **App name**: 13px semibold, `tracking-tight`
- **Nav items**: 12px pill buttons, active = `bg oklch(0.269 0 0)` + `font-weight: 500`, inactive = zinc-400
- **User avatar**: 28×28px circle, `bg oklch(0.5 0.15 264)` (blue), initial "D"

---

## Interactions & Behavior

| Interaction | Behavior |
|---|---|
| Click block row | Navigate to `/dashboard/blocks/[id]` |
| Click workout row | Navigate to `/dashboard/workouts/[id]` |
| Click week header | Toggle expand/collapse (accordion) |
| Click section header | Toggle collapse |
| Click `+ Añadir ejercicio` | Show inline mini-form |
| Click `Guardar entreno` | POST sets via server action, show 1.8s confirmation |
| Click `Eliminar` | Confirmation optional → server action → redirect |
| Back links | Navigate to parent page |
| Logo click | Navigate to `/dashboard` |

All hover/active states use CSS transitions: `0.15s ease`.

---

## Assets

| File | Usage |
|---|---|
| `/images/icon.png` | Navbar logo (28×28px) |
| `/images/DashboardBackground1.png` … `7.png` | Dashboard character (day of week 1=Mon…7=Sun). Apply `mix-blend-mode: darken` to handle white backgrounds on dark theme. Use `max-height: 88%`, `max-width: 80%` of container. |

---

## Files in This Package

| File | Description |
|---|---|
| `AusinLifting Prototype.html` | Full interactive prototype — open in browser to explore all 4 views |
| `README.md` | This document |

---

## Implementation Notes

- The existing codebase already has the correct dark theme tokens in `globals.css` — use those directly via Tailwind classes (`bg-background`, `text-foreground`, `border-border`, etc.)
- The `WorkoutSections.tsx` component already exists — the design adds **collapsible section headers** on top of the existing structure
- For the Dashboard character, the existing `getDayCharacter()` function already returns the right index
- The character overlay needs a wrapping `div` with `position: absolute; inset: 0` and multiple gradient layers + `mix-blend-mode: darken` on the `<img>`
- Server actions (`saveAllSets`, `addExerciseToMain`, etc.) already exist — wire them up to the new UI without changing logic
