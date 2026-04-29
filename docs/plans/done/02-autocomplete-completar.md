# Plan: Completar autocompletado de ejercicios

## Contexto

El autocompletado básico ya está implementado en `src/app/dashboard/WorkoutSections.tsx` y `src/app/dashboard/actions.ts` (cambios sin commitear). Funciona: modal `<dialog>`, debounce 200ms, dropdown con sugerencias, click-to-fill.

**Pero hay tres desviaciones del roadmap (`docs/plans/roadmap.md`, sección 1.1) que faltan por cerrar antes de dar la feature por terminada:**

1. **No filtra por usuario.** El roadmap dice *"ejercicios ya usados anteriormente por el usuario"*, pero `searchExercises` busca en toda la tabla `exercises` global. Cualquier usuario ve los ejercicios de otros — además de ser ruido, vacía el sentido del autocompletado para construir el historial personal.
2. **No hay navegación con teclado.** Solo se puede seleccionar con ratón. ↑/↓/Enter/Esc son la expectativa estándar para un combobox.
3. **`findOrCreateExercise` no normaliza mayúsculas/minúsculas.** Compara con `eq(exercises.name, trimmed)`, así que "Sentadilla" y "sentadilla" se guardan como ejercicios distintos. Es exactamente el problema que el roadmap quiere evitar (línea 20: *"creando duplicados y rompiendo el historial"*).

Resultado esperado: autocompletado personal real, accesible por teclado, sin generar duplicados por capitalización. Opcional: índice trigram para escalar.

---

## Cambios

### 1. `searchExercises`: filtrar por ejercicios usados por el usuario

**Archivo:** `src/app/dashboard/actions.ts` (líneas 225-240)

Cambiar la query para devolver solo ejercicios que el usuario ha usado previamente, vía `sessionExercises`. Como `sessionExercises` puede pertenecer a `workouts`, `mobilitySessions` o `cardioSessions` (mirar `src/db/schema.ts` líneas 102-117 para confirmar las FKs disponibles), la propiedad de usuario se resuelve subiendo por la sesión correspondiente hasta `userId`.

**Estrategia recomendada (más simple):** subquery con `IN`:

```ts
// pseudocódigo — el ejecutor adapta a la sintaxis Drizzle real
const userExerciseIds = db
  .select({ id: sessionExercises.exerciseId })
  .from(sessionExercises)
  .innerJoin(/* la(s) sesión(es) que tengan userId */)
  .where(eq(/* sesion */.userId, userId))

const results = await db
  .select({ id: exercises.id, name: exercises.name })
  .from(exercises)
  .where(and(
    inArray(exercises.id, userExerciseIds),
    ilike(exercises.name, `%${trimmed}%`),
  ))
  .orderBy(exercises.name)
  .limit(8)
```

**El ejecutor debe verificar primero en `src/db/schema.ts`:**
- ¿`sessionExercises` tiene FKs a `workoutId`, `mobilitySessionId`, `cardioSessionId`? Si sí → `OR` de tres condiciones, cada una uniendo con su tabla padre que tenga `userId`.
- ¿O todas las sesiones cuelgan de `workouts` (que sí tiene `userId`)? Si sí → un solo join con `workouts`.

Elegir el camino que requiera menos joins. No inventar tablas.

**Fallback para usuarios nuevos:** si la query con filtro de usuario devuelve 0 resultados Y el usuario está escribiendo (≥2 chars), hacer una segunda query sin filtro de usuario (la versión global actual). Así un usuario nuevo no ve dropdown vacío. Sin indicador visual — silencioso.

**No filtrar por usuario en `findOrCreateExercise`** — la tabla `exercises` sigue siendo global (un mismo "Press banca" puede ser usado por varios usuarios; el historial personal viene de `sessionExercises`/`userExerciseStats`).

### 2. Normalización case-insensitive en `findOrCreateExercise`

**Archivo:** `src/app/dashboard/actions.ts` (líneas 215-223)

Cambiar `eq(exercises.name, trimmed)` por `ilike(exercises.name, trimmed)` (sin comodines `%` — `ilike` con string literal hace match exacto case-insensitive). Si encuentra una coincidencia, devuelve el id existente sin crear duplicado. Si no, inserta con el nombre tal cual lo escribió el usuario (preservar capitalización original).

```ts
const existing = await db.query.exercises.findFirst({
  where: ilike(exercises.name, trimmed),
})
```

### 3. Navegación con teclado en el dropdown

**Archivo:** `src/app/dashboard/WorkoutSections.tsx` (componente `AddExerciseForm`, líneas 304-485)

Añadir:

- Estado `const [highlightIndex, setHighlightIndex] = useState(-1)` (-1 = ninguno).
- Resetear `highlightIndex` a -1 cada vez que cambian las `suggestions`.
- `onKeyDown` en el `<input name="exerciseName">`:
  - `ArrowDown`: `e.preventDefault()`, `setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1))`. Asegurar que el dropdown esté visible (`setShowSuggestions(true)`).
  - `ArrowUp`: `e.preventDefault()`, `setHighlightIndex(i => Math.max(i - 1, 0))`.
  - `Enter`: si `showSuggestions && highlightIndex >= 0 && suggestions[highlightIndex]`, `e.preventDefault()`, rellenar el input con el sugerido y cerrar dropdown. Si no, dejar que el form haga submit normal.
  - `Escape`: cerrar el dropdown (`setShowSuggestions(false)`). NO cerrar el `<dialog>` (el `<dialog>` ya cierra con Escape por defecto; basta con frenar la propagación cuando hay dropdown abierto: `if (showSuggestions) { e.stopPropagation(); setShowSuggestions(false) }`).
- En el `<li>` del item resaltado, aplicar una clase extra (ej: `bg-white/[0.06]`) condicionalmente cuando `index === highlightIndex`. Mantener el hover existente.
- Añadir atributos ARIA mínimos: `role="combobox"`, `aria-expanded={showSuggestions}`, `aria-controls="exercise-suggestions"` en el input; `role="listbox"` y `id="exercise-suggestions"` en el `<ul>`; `role="option"` y `aria-selected={index === highlightIndex}` en cada `<li>`.

Sin librerías. Solo `useState` + `onKeyDown`.

### 4. (Opcional) Índice GIN trigram

**Archivo:** nueva migración SQL en `drizzle/` (siguiente número, ej. `0005_exercises_trigram.sql`)

Solo si el ejecutor confirma que `pg_trgm` está disponible en Neon (lo está por defecto). Si hay duda, **omitir este paso** — la feature funciona sin él, solo es performance a escala.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm ON exercises USING gin (name gin_trgm_ops);
```

Justificación: `ilike '%query%'` con B-tree hace full table scan. Con la tabla aún pequeña no se nota, pero es trivial añadirlo ahora.

---

## Archivos a modificar

- `src/app/dashboard/actions.ts` — `searchExercises` (filtro por usuario + fallback global) y `findOrCreateExercise` (`ilike` para match case-insensitive). Verificar primero los imports: `inArray` puede no estar importado todavía desde `drizzle-orm`.
- `src/app/dashboard/WorkoutSections.tsx` — añadir `highlightIndex`, `onKeyDown`, clases condicionales y atributos ARIA en `AddExerciseForm`.
- (Opcional) `drizzle/0005_exercises_trigram.sql` — índice trigram.

## Archivos a leer antes de empezar

- `src/db/schema.ts` líneas ~20-160 — confirmar las FKs reales de `sessionExercises` y dónde vive `userId` en cada tipo de sesión. Esto determina el shape exacto del join en `searchExercises`.
- `src/app/dashboard/actions.ts` líneas 1-30 — confirmar imports actuales de `drizzle-orm` (`eq`, `ilike`, `and`, etc.); añadir `inArray` si falta.

## Patrones existentes a reutilizar

- Estructura general de `searchExercises` (auth check, trim, length≥2, limit 8, orderBy name) — `actions.ts:225-240`.
- Patrón de `auth()` de Clerk al inicio de cada server action — `actions.ts:25-29` (`requireUser`) y `actions.ts:226`.
- Convención de `findFirst` con `where` Drizzle — `actions.ts:217-219`.
- El estilo del dropdown ya está bien resuelto visualmente (zinc-900, border, hover) — solo añadir la clase de "resaltado por teclado".

---

## Verificación

1. **Ejecutar el dev server.** Abrir `/dashboard/blocks/<id>/<weekId>/<dayId>` (o donde se renderice `WorkoutSections`).
2. **Filtrado por usuario:**
   - Con un usuario que tenga ejercicios usados ("Press banca", "Sentadilla"), abrir modal "Añadir ejercicio", escribir "se" → debe aparecer "Sentadilla". Si hay otro ejercicio en la DB que otro usuario haya creado y este usuario no haya usado, NO debe aparecer.
   - Con un usuario nuevo (cero `sessionExercises`), escribir "se" → debe caer al fallback global y mostrar resultados igualmente.
3. **Normalización:** crear un ejercicio "Sentadilla", luego en otro workout escribir "sentadilla" y submitear. Comprobar en DB (Neon MCP `run_sql`: `SELECT id, name FROM exercises WHERE name ILIKE 'sentadilla'`) que solo hay UN registro. El segundo workout debe apuntar al mismo `exerciseId`.
4. **Teclado:**
   - Escribir "se" para ver sugerencias. ↓ baja resaltado, ↑ sube, Enter rellena el input y cierra dropdown sin submitear el form. Esc cierra dropdown sin cerrar el modal. Volver a Esc (sin dropdown) cierra el modal.
   - Tab no debe romper nada (debe seguir saliendo del input al siguiente campo).
5. **Verificación de typecheck/lint:** `npm run build` y/o `npm run lint` (ver `package.json` para los scripts reales).
6. **(Si se aplica el índice)** Confirmar con Neon MCP: `SELECT indexname FROM pg_indexes WHERE tablename = 'exercises'`.

---

## Fuera de alcance (NO hacer)

- No tocar nada relacionado con PRs, 1RM ni `userExerciseStats` — eso es la siguiente feature del roadmap.
- No añadir librerías (combobox de Radix, Headless UI, etc.). Implementación manual como dice el roadmap.
- No refactorizar el modal ni el resto de `WorkoutSections.tsx`.
- No cambiar el shape de retorno de `searchExercises` (`Array<{ id, name }>`) — el cliente ya lo consume así.
