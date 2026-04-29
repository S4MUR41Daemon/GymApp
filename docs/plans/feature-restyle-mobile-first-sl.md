# Feature 0c — Restyle interno mobile-first Solo Leveling

## Contexto

El shell SL (TopBar/BottomNav/ParticleCanvas/RankBadge) ya está vivo. Pero el contenido interno sigue con el aesthetic
 viejo: imagen anime de fondo, botones zinc-100 planos, listas con `border-white/10`, layout desktop-wide. Esta fase
aplica el restyle visual mobile-first y crea SL primitives reutilizables.

Naming: el usuario es un **Leveler** (no "Hunter", por copyright SL). Schema gana un campo `nickname` (UI llega en
Fase 1).

## Archivos a modificar / crear

| Archivo | Cambio |
|---|---|
| `src/db/schema.ts` | + `nickname text` en `userLevels` |
| `drizzle/0007_user_nickname.sql` | Migración nueva (drizzle-kit generate) |
| `src/lib/userLevel.ts` | + `getDisplayName(level, fallback)` |
| `src/components/ui-sl/*` | Crear primitives SL (12 archivos) |
| `src/app/layout.tsx` | Wrap children con `<main>` mobile-first centrado |
| `src/app/dashboard/page.tsx` | Eliminar imagen anime + restyle |
| `src/app/dashboard/blocks/page.tsx` | Restyle |
| `src/app/dashboard/blocks/new/page.tsx` | Restyle form |
| `src/app/dashboard/blocks/[blockId]/page.tsx` | Restyle |
| `src/app/dashboard/blocks/[blockId]/WeekAccordion.tsx` | Restyle |
| `src/app/dashboard/blocks/[blockId]/weeks/[weekId]/page.tsx` | Restyle |
| `src/app/dashboard/workouts/new/page.tsx` + `NewWorkoutClient.tsx` | Restyle 2-step form |
| `src/app/dashboard/workouts/[workoutId]/page.tsx` | Restyle |
| `src/app/dashboard/WorkoutSections.tsx` | Restyle + modal SL |
| `public/images/DashboardBackground{1-7}.png` | **Eliminar** los 7 archivos |

## 1. Schema

Añadir a `userLevels`:
```ts
nickname: text("nickname"),
```
`npx drizzle-kit generate` → produce `drizzle/0007_user_nickname.sql`. Aplicar en Neon dev.

Util en `src/lib/userLevel.ts`:
```ts
export function getDisplayName(level: { nickname: string | null }, fallback: string) {
  return level.nickname?.trim() || fallback;
}
```

## 2. SL primitives (`src/components/ui-sl/`)

### `tokens.ts`
```ts
export const SL = {
  bgCard: 'linear-gradient(135deg, rgba(10,22,44,0.85), rgba(7,12,22,0.7))',
  borderCard: '1px solid rgba(59,130,246,0.18)',
  borderCardHover: '1px solid rgba(59,130,246,0.35)',
  borderCardGlow: '0 0 12px rgba(59,130,246,0.15)',
  accent: '#3b82f6',
  accentLight: '#60a5fa',
  accentPale: '#bfdbfe',
  textPrimary: '#e2e8f0',
  textSecondary: 'rgba(148,163,184,0.7)',
  textMuted: 'rgba(148,163,184,0.45)',
  textAccent: '#93c5fd',
};
```

### `SLButton.tsx` (client, framer-motion)
Variants: `primary | secondary | destructive | ghost`. Sizes: `sm | md`. Acepta `href` (renderiza `<Link>`) o
`onClick` (renderiza `<button>`). `disabled` → opacity 0.5 + cursor not-allowed.

- **primary**: `background: linear-gradient(135deg,#1d4ed8,#3b82f6)`, color `#bfdbfe`, border `1px solid
rgba(59,130,246,0.4)`, boxShadow `0 0 12px rgba(59,130,246,0.4)`. Hover boxShadow `0 0 18px rgba(59,130,246,0.6)`.
`whileTap={{scale:0.96}}`.
- **secondary**: bg `rgba(59,130,246,0.06)`, border `1px solid rgba(59,130,246,0.25)`, color `#93c5fd`. Hover bg
`rgba(59,130,246,0.12)`.
- **destructive**: bg transparent, color `rgba(148,163,184,0.6)`, sin border. Hover color `#ef4444`.
- **ghost**: bg transparent, color `#93c5fd`. Hover color `#bfdbfe`.

Tipografía: `fontFamily: 'var(--font-rajdhani)'`, `fontWeight:700`, `letterSpacing:'0.06em'`. Size sm: `fontSize:11,
padding:'6px 12px'`. Size md: `fontSize:13, padding:'8px 16px'`. Border-radius 5px. `textTransform:'uppercase'` solo
para primary y secondary.

### `SLCard.tsx` (server)
Props: `{ title?: string; count?: number; children; className?: string; style?: CSSProperties }`. Si `title`,
renderiza `SLDivider` arriba. Card: bg
`var(--sl-bg-card,linear-gradient(135deg,rgba(10,22,44,0.85),rgba(7,12,22,0.7)))`, border `1px solid
rgba(59,130,246,0.18)`, borderRadius 10px, padding `'14px 16px'`.

### `SLDivider.tsx` (server)
Renderiza una línea horizontal con título centrado opcional. Props: `{ title?: string; count?: number }`.
- Si no title: `<hr style={{borderColor:'rgba(59,130,246,0.15)', borderWidth:'0 0 1px 0'}} />`.
- Con title: flex row con dos `<span>` flex:1 con `borderTop: 1px solid rgba(59,130,246,0.15)` y en medio `<span>{`—
${title.toUpperCase()} ${count ? `— ${count}` : '—'}`}</span>` Barlow 10px uppercase letter-spacing 0.2em color
`rgba(96,165,250,0.5)` padding 0 8px.

### `SLSection.tsx` (server)
Wrapper de sección. Props: `{ title: string; count?: number; children }`. Renderiza `SLDivider` con title/count +
`<div style={{marginTop:12, display:'flex', flexDirection:'column', gap:8}}>{children}</div>`.

### `SLPageHeader.tsx` (server)
Props: `{ backHref?: string; backLabel?: string; title: string; subtitle?: string; right?: ReactNode }`. Estructura:
- Si `backHref`: `<SLBackLink href={backHref} label={backLabel ?? '< VOLVER'} />` arriba.
- Flex row entre title (Rajdhani 700 22px `#e2e8f0` letter-spacing 0.04em) y `right`.
- Si `subtitle`: debajo del title, Inter 13px `rgba(148,163,184,0.6)`.
- Margin-bottom 16px.

### `SLBackLink.tsx` (client — usa Next Link)
Props: `{ href: string; label?: string }`. `<Link>` con texto Barlow 10px uppercase letter-spacing 0.15em
`rgba(148,163,184,0.5)`. Hover `#93c5fd`.

### `SLInput.tsx` (client)
Wrapper de `<input>` que reenvía todas las props HTML. Estilo:
- bg `rgba(59,130,246,0.06)`, border `1px solid rgba(59,130,246,0.18)`, borderRadius 5px, padding `'8px 12px'`, color
`#e2e8f0`, fontFamily `var(--font-rajdhani)`, fontSize 13, width '100%'.
- placeholder color `rgba(148,163,184,0.45)`.
- Focus: outline none, border `1.5px solid rgba(96,165,250,0.6)`, boxShadow `0 0 8px rgba(59,130,246,0.25)`.

Si la prop `label` está presente, envuelve en `<label>` con texto Barlow 10px uppercase `rgba(148,163,184,0.6)`
arriba.

### `SLTextarea.tsx` (client)
Igual que SLInput pero `<textarea>`. Font sans (Inter) en lugar de Rajdhani para legibilidad. min-height 80px, resize
none.

### `SLSelect.tsx` (client)
Igual que SLInput pero `<select>`. Mantiene Rajdhani.

### `SLNumberInput.tsx` (client)
Variante de SLInput con `type="number"`. Width fijo configurable via prop `width` (default 60). Mantiene mismo
styling.

### `SLBadge.tsx` (server)
Props: `{ children; variant?: 'default' | 'accent' | 'warning' | 'success' }`. Pequeño chip Barlow 9px uppercase
letter-spacing 0.1em padding `'2px 6px'` borderRadius 3px.
- default: bg `rgba(148,163,184,0.08)`, color `rgba(148,163,184,0.7)`.
- accent: bg `rgba(59,130,246,0.1)`, color `#93c5fd`.
- warning: bg `rgba(249,115,22,0.1)`, color `#fdba74`.
- success: bg `rgba(34,197,94,0.1)`, color `#86efac`.

### `SLProgressBar.tsx` (client)
Props: `{ value: number; max: number }`. Track height 4px bg `rgba(59,130,246,0.08)` border `1px solid
rgba(59,130,246,0.15)` borderRadius 2px. Fill height 100% bg `linear-gradient(90deg,#1d4ed8,#3b82f6,#7dd3fc)`
boxShadow `0 0 6px rgba(96,165,250,0.5)` transition `width 1s cubic-bezier(.25,.8,.25,1)`.

## 3. Layout mobile-first

Modificar `src/app/layout.tsx` — el wrapper de children dentro del `<ClerkProvider>`:
```tsx
<ParticleCanvas />
<div style={{position:'relative', zIndex:1, display:'flex', flexDirection:'column', minHeight:'100vh'}}>
  {userId && <TopBar />}
  <main style={{flex:1, width:'100%', overflowY:'auto'}}>
    <div style={{margin:'0 auto', width:'100%', maxWidth:480, padding:'16px 16px 24px'}}>
      {children}
    </div>
  </main>
  {userId && <BottomNav />}
</div>
```
TopBar/BottomNav permanecen full-width (sticky). El centrado solo aplica al contenido.

## 4. Eliminar imagen anime

1. Borrar `public/images/DashboardBackground1.png` ... `DashboardBackground7.png`.
2. En `src/app/dashboard/page.tsx`: eliminar `getDayCharacter()`, el `<div>` con la imagen + vignette overlay.
Mantener solo header + lista de bloques + lista de entrenos sueltos.

## 5. Restyle pantalla por pantalla

> **Regla:** ninguna pantalla debe quedar con `text-zinc-*`, `bg-white/[...]`, `border-white/*`, `bg-zinc-*`. Todo via
 SL primitives o tokens `--sl-*`/inline con paleta SL.

### A) `dashboard/page.tsx`
```
<SLPageHeader title="Dashboard" />
<div style={{display:'flex', gap:8, marginTop:8}}>
  <SLButton variant="primary" href="/dashboard/blocks/new">Crear bloque</SLButton>
  <SLButton variant="secondary" href="/dashboard/workouts/new">Crear entreno</SLButton>
</div>
<SLSection title="Bloques" count={blocks.length} ...>
  {blocks.map(b => <Link href={`/dashboard/blocks/${b.id}`}><SLCard>...</SLCard></Link>)}
</SLSection>
<SLSection title="Entrenos sueltos" count={workouts.length}>
  {workouts.map(w => <Link href={`/dashboard/workouts/${w.id}`}><SLCard>...</SLCard></Link>)}
</SLSection>
```
Cada row dentro de SLCard: nombre Rajdhani 14px `#e2e8f0`, notes Inter 12px `rgba(148,163,184,0.6)`, badge weeks count
 derecha (`SLBadge variant="default"`).

### B) `blocks/page.tsx`
SLPageHeader title="Bloques" right={<SLButton variant="primary" size="sm" href="/dashboard/blocks/new">+
Nuevo</SLButton>}. Lista de SLCard.

### C) `blocks/new/page.tsx`
SLPageHeader backHref="/dashboard/blocks" title="Nuevo bloque". Form con SLInput name + SLTextarea notes + SLButton
primary submit "Crear bloque".

### D) `blocks/[blockId]/page.tsx`
SLPageHeader con back, title, subtitle (notes), right={<SLButton size="sm">Guardar</SLButton>}. Lista de
WeekAccordion. Footer: SLButton variant="destructive" "Eliminar bloque".

### E) `WeekAccordion.tsx`
Wrapper SLCard padding reducido. Header flex: chevron rotatorio + texto Rajdhani 13px + dots M/B/E/C (22px círculos:
activo bg gradient azul + glow `0 0 6px rgba(96,165,250,0.6)`, inactivo bg `rgba(148,163,184,0.1)` color
`rgba(148,163,184,0.4)`). Body collapse: lista workouts mini-cards con borde sutil `rgba(59,130,246,0.1)`. Botones "+
Entreno" SLButton variant="secondary" size="sm", "Eliminar" SLButton variant="destructive" size="sm".

### F) `weeks/[weekId]/page.tsx`
SLPageHeader breadcrumb. Save SLButton primary. Empty state Inter 13px `rgba(148,163,184,0.45)`. Workouts en SLCard
collapsibles. SLSelect + SLButton variant="secondary" "Añadir entreno".

### G) `workouts/new/page.tsx` + `NewWorkoutClient.tsx`
SLPageHeader back. SLProgressBar arriba. Step 1: SLInput name + SLTextarea notes + SLButton primary "Crear entreno" +
SLButton ghost "Cancelar". Step 2: 4 SLCard clickables grandes (icon emoji 24px + label Rajdhani 14px + sublabel Inter
 11px). Estado "added": border `1.5px solid rgba(96,165,250,0.5)` + boxShadow glow + SLBadge variant="success" "✓
Añadido".

### H) `workouts/[workoutId]/page.tsx`
SLPageHeader title + subtitle (notes) + right={<SLButton variant="destructive">Eliminar</SLButton>}. Pasa control a
WorkoutSections.

### I) `WorkoutSections.tsx`
Cada sección (Mobility/Basics/Main/Cardio) → SLCard con título tipo `— MOBILITY —` (usa SLDivider) y chevron
rotatorio. Body collapse: ejercicios.

**Exercise row:** nombre Rajdhani 14px, "Quitar" SLButton destructive sm. Sets en mini-rows con SLNumberInput (kg,
reps, RIR) width 60. Labels Barlow 10px uppercase `rgba(148,163,184,0.45)`. Botón "+ Añadir ejercicio" SLButton ghost
sm uppercase.

**Modal `<dialog>`:**
- Backdrop: `bg-black/70 backdrop-blur-sm`.
- Caja: `padding:24px, borderRadius:10px, border:'1.5px solid rgba(96,165,250,0.4)', boxShadow:'0 0 24px
rgba(59,130,246,0.3)', background:linear-gradient(160deg, rgba(10,22,45,0.99), rgba(5,8,18,0.99)),
animation:'lvlReveal 0.3s ease', width:320`.
- Título `— AÑADIR EJERCICIO —` Barlow uppercase 11px letter-spacing 0.2em color `rgba(96,165,250,0.6)` text-align
center marginBottom 16px.
- Combobox name: SLInput + dropdown propio (mantiene la lógica de búsqueda existente, solo cambia styling: dropdown bg
 `rgba(7,12,22,0.95)` border `1px solid rgba(59,130,246,0.25)` borderRadius 5px, items Rajdhani 12px padding `6px
10px`, highlight bg `rgba(59,130,246,0.15)`).
- Series/Reps/RIR/Duración: SLNumberInput con SLInput label.
- Buttons row: SLButton ghost "Cancelar" + SLButton primary "Añadir".

**Save:** SLButton primary "GUARDAR ENTRENO". Confirmation con check `#22c55e` + texto Rajdhani.

## 6. Renombrar Hunter → Leveler

`rg -i "hunter" src/`. Si aparece en strings visibles al usuario, reemplazar a "Leveler". No tocar
`design_handoff_solo_leveling/` (referencia histórica intacta).

## 7. Reglas

- No usar `text-zinc-*`, `bg-white/[...]`, `border-white/*`, `bg-zinc-*` en `src/app/dashboard/**`.
- Mantener `src/components/ui/button.tsx` (shadcn) como está.
- Si una API difiere del plan (ej. `auth()` Clerk), adáptate a la real e indícalo.
- Comentarios en español. UI labels en español, separadores SL en MAYÚSCULAS.

## Verificación

1. `npm run build` y `npm run lint` pasan.
2. `mcp__Neon__describe_table_schema` muestra `nickname` en `user_levels`.
3. DevTools 390×844: UI ocupa ancho completo, padding 16px, sin scroll horizontal.
4. Desktop 1920×1080: contenido centrado a 480px, particles a los lados, sin imagen anime.
5. `/dashboard` sin imagen anime, botones SL, separadores `— BLOQUES —`.
6. `rg "text-zinc|bg-white\/\[|border-white\/" src/app/dashboard` retorna 0 hits.
7. Modal añadir ejercicio: glow azul, animación entry, inputs SL.
8. Flujo end-to-end: crear bloque → semana → entreno → añadir ejercicio → guardar OK.

## Fuera de alcance

- NO Leveler Status / Misión Activa / Quests / Guild (fases 1-6).
- NO lógica real XP/streak/level-up.
- NO onboarding nickname.
- NO tocar `design_handoff_solo_leveling/`.
- NO modificar shadcn ni shell SL existente.
