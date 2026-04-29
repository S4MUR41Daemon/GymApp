# Feature 1.1 — Autocompletado de ejercicios

## Context

Cuando el usuario añade un ejercicio en el modal "Añadir ejercicio" del workout, el input es libre (`<input name="exerciseName">` uncontrolled, sin sugerencias). Esto provoca duplicados sutiles en la tabla `exercises`: "Sentadilla", "sentadilla", "Squat" terminan como tres filas distintas, lo que rompe `userExerciseStats` (que indexa por `exerciseId`) y por tanto el historial y el cálculo de PRs/1RM.

El objetivo es mostrar un dropdown debajo del input, mientras el usuario escribe, con ejercicios ya existentes en la tabla `exercises` que coincidan por nombre (ILIKE). Al hacer click en una sugerencia, se rellena el input con ese nombre exacto, asegurando que `findOrCreateExercise` reutilice la fila existente en lugar de crear una nueva.

**Decisión de scope:** las sugerencias salen de la tabla `exercises` global (sin filtrar por userId). Razones:
- La tabla `exercises` es compartida (sin columna `userId`) y solo contiene nombres de ejercicios — no hay nada sensible.
- Maximiza la deduplicación: el usuario ve también ejercicios creados antes en otros workouts, no solo los que ya tienen sets guardados (que es lo que daría un join con `userExerciseStats`).
- Una sola query simple, sin joins.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/app/dashboard/actions.ts` | Añadir Server Action `searchExercises(query: string)` y añadir `ilike` al import de `drizzle-orm` |
| `src/app/dashboard/WorkoutSections.tsx` | Convertir el input `exerciseName` del `AddExerciseForm` (líneas 303–433) a controlado, añadir dropdown de sugerencias con debounce |

No hay cambios de schema. No se añade índice en DB (la tabla es pequeña; añadir `pg_trgm` queda como optimización futura si el volumen crece).

## Backend — `searchExercises` en `actions.ts`

**Ubicación sugerida:** justo después del helper `findOrCreateExercise` (~línea 224), para mantener la cohesión semántica con la lógica de exercises.

**Imports a añadir:** sumar `ilike` al import existente de `drizzle-orm` en la línea 6:

```ts
import { eq, and, max, isNull, ilike } from 'drizzle-orm'
```

**Signatura y comportamiento:**

```ts
export async function searchExercises(query: string): Promise<Array<{ id: number; name: string }>> {
  const { userId } = await auth()
  if (!userId) return []

  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const results = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(ilike(exercises.name, `%${trimmed}%`))
    .orderBy(exercises.name)
    .limit(8)

  return results
}
```

Notas:
- Requiere sesión Clerk válida (mismo patrón que el resto de actions, ver línea 25 de `actions.ts`).
- Mínimo 2 caracteres: evita sobrecarga ante teclas iniciales.
- Limit 8: suficiente para un dropdown sin scroll.
- ILIKE `%query%` (case-insensitive, substring match en cualquier posición). Drizzle escapa el parámetro automáticamente — no concatenar manualmente con `+`, sino pasar el string como argumento al template tag.
- Devuelve `[]` en lugar de lanzar errores: simplifica el cliente (no necesita try/catch en el `useEffect`).

## Frontend — `AddExerciseForm` en `WorkoutSections.tsx`

El form actualmente usa input uncontrolled y se envía vía `<form action={action}>`. Hay que:

1. **Convertir el input a controlado** (`useState<string>`).
2. **Añadir estado para sugerencias y dropdown.**
3. **Implementar debounce inline** (no existe util en el repo — el código `setTimeout` + cleanup en `useEffect` cabe en ~6 líneas y no merece abstracción).
4. **Renderizar dropdown** con el mismo estilo zinc que el resto del modal.
5. **Resetear estado al cerrar el modal** (limpiar input, sugerencias y dropdown abierto).

### Estado nuevo en `AddExerciseForm`

```tsx
const [name, setName] = useState('')
const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string }>>([])
const [showSuggestions, setShowSuggestions] = useState(false)
```

### Debounce inline (dentro de `AddExerciseForm`)

```tsx
useEffect(() => {
  if (name.trim().length < 2) {
    setSuggestions([])
    return
  }
  const timer = setTimeout(async () => {
    const results = await searchExercises(name)
    setSuggestions(results)
  }, 200)
  return () => clearTimeout(timer)
}, [name])
```

200ms es el sweet spot habitual: imperceptible para el usuario, evita disparar una query por cada tecla.

### Reseteo al cerrar el modal

Modificar el `useEffect` de la línea 325 (o el handler de cierre) para que cuando `open` pase a `false` también haga `setName('')`, `setSuggestions([])`, `setShowSuggestions(false)`. Igualmente tras el `onSubmit` exitoso (que ya hace `setOpen(false)`).

### Estructura del input + dropdown (reemplazar el `<input>` actual de línea 357)

```tsx
<div className="relative">
  <input
    name="exerciseName"
    type="text"
    required
    autoFocus
    autoComplete="off"
    value={name}
    onChange={(e) => {
      setName(e.target.value)
      setShowSuggestions(true)
    }}
    onFocus={() => setShowSuggestions(true)}
    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
    placeholder="Nombre del ejercicio"
    className="w-full bg-white/[0.08] border border-white/[0.12] rounded-[5px] py-[6px] px-3 text-[12px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
  />
  {showSuggestions && suggestions.length > 0 && (
    <ul className="absolute left-0 right-0 top-full mt-1 z-10 max-h-48 overflow-y-auto rounded-[5px] border border-white/[0.12] bg-zinc-900 shadow-xl">
      {suggestions.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setName(s.name)
              setShowSuggestions(false)
            }}
            className="w-full text-left px-3 py-1.5 text-[12px] text-zinc-200 hover:bg-white/[0.06]"
          >
            {s.name}
          </button>
        </li>
      ))}
    </ul>
  )}
</div>
```

Detalles importantes:
- `onMouseDown={(e) => e.preventDefault()}`: evita que el blur del input dispare antes del click (problema clásico de dropdowns).
- `onBlur` con `setTimeout(150)`: cierra el dropdown al perder foco pero da margen para que se procese el click.
- `autoComplete="off"`: evita que el navegador muestre su propio autocompletado encima.
- El `<button type="button">` evita que un Enter accidental sobre la sugerencia envíe el form.
- `position: relative` en el contenedor + `absolute` en el `<ul>`: dropdown anclado al input.
- Estilos: `bg-zinc-900` (igual que el `<dialog>`), borde `white/[0.12]` (igual que inputs), hover `white/[0.06]`. Coherente con el resto del modal.

### Submit

El submit no cambia: el `<form action={action}>` envía el `FormData` con `exerciseName` (que ahora es el state `name`). `findOrCreateExercise` (líneas 215–223 de `actions.ts`) hace `eq(exercises.name, trimmed)` — al haber clickado una sugerencia el match es exacto y reutiliza la fila existente.

## Funciones/utilidades reutilizadas

- `auth()` desde `@clerk/nextjs/server` — patrón ya usado en todos los actions (`actions.ts:25`).
- `db` desde `@/db` y `exercises` desde `@/db/schema` — patrón estándar.
- `findOrCreateExercise` (`actions.ts:215-223`) — sin tocar; sigue siendo el punto único de creación.
- Estilo Tailwind del modal y inputs — replicado tal cual.

## Verificación end-to-end

1. **Tipos y build:** `npm run build` (o `npx tsc --noEmit` si está configurado) sin errores.
2. **Lint:** `npm run lint` limpio.
3. **Flujo manual en `npm run dev`:**
   - Abrir un workout en `/dashboard/workouts/[id]`.
   - Click en "Añadir ejercicio" en cualquiera de las 4 secciones (Movilidad/Básicos/Entrenamiento/Cardio) → modal abre.
   - Escribir 1 carácter → no aparece dropdown.
   - Escribir 2+ caracteres que coincidan con un ejercicio existente → aparece dropdown con resultados (verificar tras ~200ms).
   - Click en una sugerencia → input se rellena, dropdown se cierra.
   - Submit → ejercicio queda añadido a la sesión sin crear duplicado (verificar en DB que `exercises` no aumenta su row count si la sugerencia ya existía).
   - Escribir un nombre nuevo no presente → submit funciona y crea fila nueva (comportamiento previo intacto).
   - Cerrar modal con Cancelar → al reabrir, input vacío y sin sugerencias residuales.
4. **Caso ILIKE:** crear "Sentadilla" como ejercicio. Reabrir modal y escribir "sent" o "DILLA" → debe sugerir "Sentadilla" (case-insensitive, substring).
5. **Sin sesión:** no aplica desde UI (la página está protegida), pero la action devuelve `[]` defensivamente.

## Fuera de scope (explícito)

- Navegación con teclado (flechas + Enter) en el dropdown — añadir como mejora futura si se siente necesario.
- Mostrar `muscleGroup` o `equipment` en cada sugerencia — el schema lo permite pero la roadmap no lo pide.
- Índice GIN con `pg_trgm` para acelerar ILIKE — innecesario al volumen actual; reevaluar si la tabla supera ~1k filas.
- Toast/feedback al seleccionar una sugerencia — superfluo, la UI ya es clara.
