# Roadmap — AusinLifting

## Fixes inmediatos (hacer primero)

| # | Tarea | Plan detallado |
|---|-------|----------------|
| 1 | Página de Bloques vacía | `docs/plans/fix-bloques-page.md` |
| 2 | UX "Añadir ejercicio" → Modal | `docs/plans/fix-anadir-ejercicio-modal.md` |

---

## Fase 1: Historial y Progreso

> Objetivo: que el usuario pueda ver su evolución. Los datos ya están en la DB, falta la UI.

### 1.1 Autocompletado de ejercicios

**Qué:** Al escribir el nombre del ejercicio en el modal de "Nuevo ejercicio", mostrar sugerencias de ejercicios ya usados anteriormente por el usuario.

**Por qué:** La tabla `exercises` ya acumula todos los ejercicios creados. Sin autocompletado, el usuario escribe el mismo ejercicio con ligeras diferencias ("Sentadilla" vs "sentadilla" vs "Squat") creando duplicados y rompiendo el historial.

**Cómo:**
- Añadir un Server Action `searchExercises(query: string, userId: string)` en `actions.ts` que busque en la tabla `exercises` por nombre (ILIKE).
- En el modal `AddExerciseForm` (ya convertido a modal), usar `useEffect` + debounce para llamar al action mientras el usuario escribe.
- Mostrar un dropdown debajo del input con las sugerencias. Al seleccionar una, rellenar el campo.
- Sin librerías — implementación manual con estado local.

**Schema:** No requiere cambios. Tabla `exercises` ya existe.

---

### 1.2 Récords personales (PR)

**Qué:** Cuando el usuario guarda un entreno y supera su récord histórico en un ejercicio, marcar ese set con un badge visual (ej: `🏆 PR`).

**Por qué:** Motivación inmediata y feedback positivo. El 1RM ya se calcula en `actions.ts:calculate1rm()` y se guarda en `userExerciseStats`. Solo falta comparar y notificar.

**Cómo:**
- En `saveAllSets` (ya existe en `actions.ts`), después de calcular el nuevo 1RM, comparar con el `reference1rm` anterior.
- Si es mayor, marcar ese set/ejercicio como "nuevo PR" en la respuesta.
- En el cliente, mostrar un toast o badge temporal al guardar.
- **Alternativa más simple:** Mostrar en la lista de ejercicios un indicador si el 1RM actual supera el histórico (comparación en render, sin lógica extra en el server action).

**Schema:** No requiere cambios. `userExerciseStats` ya tiene `reference1rm`.

---

### 1.3 Historial por ejercicio

**Qué:** Página `/dashboard/exercises/[exerciseName]` que muestra todos los entrenos donde se realizó ese ejercicio, con el peso, reps y 1RM estimado de cada sesión.

**Por qué:** Permite ver la progresión de un ejercicio concreto a lo largo del tiempo.

**Cómo:**
- Nueva ruta: `src/app/dashboard/exercises/[exerciseName]/page.tsx`
- Query: buscar todos los `sessionExercises` del usuario para ese ejercicio, con sus `sets`, ordenados por fecha del workout.
- UI: lista de sesiones con fecha, y dentro de cada sesión los sets (peso × reps × RIR → 1RM estimado).
- Acceso: desde el nombre del ejercicio en cualquier sección del entreno (hacer el nombre clicable).

**Schema:** No requiere cambios.

---

### 1.4 Gráfica de progresión de 1RM

**Qué:** En la página de historial por ejercicio (1.3), añadir una gráfica de línea con la evolución del 1RM estimado en el tiempo.

**Por qué:** Visualizar la progresión es el feedback más poderoso para la adherencia al entrenamiento.

**Librería recomendada:** `recharts` (ligera, bien soportada en React/Next.js).

**Cómo:**
- Instalar `recharts`.
- En la página del ejercicio, tomar los puntos `{fecha, 1RM}` y pasarlos a un `<LineChart>`.
- Estilizar con colores del sistema (zinc/white palette).

**Schema:** No requiere cambios. Los datos se calculan en tiempo de render desde los sets existentes.

---

### 1.5 Resumen semanal

**Qué:** En la página de detalle de una semana (`/dashboard/blocks/[blockId]/weeks/[weekId]`), mostrar un resumen: total de series completadas, ejercicios distintos trabajados, grupos musculares.

**Por qué:** Visión de conjunto del volumen de entrenamiento de esa semana.

**Cómo:**
- Añadir cálculo en el Server Component de la página de semana.
- Agregar los datos de todos los workouts y sus sets de esa semana.
- Mostrar como métricas simples en la cabecera de la página.

**Schema:** No requiere cambios.

---

## Fase 2: Plataforma y Accesibilidad

### 2.1 PWA instalable

**Qué:** Permitir instalar AusinLifting como app nativa en móvil (Android/iOS) desde el navegador.

**Cómo:**
1. Crear `public/manifest.json` con nombre, iconos, colores del tema.
2. Añadir `<link rel="manifest" href="/manifest.json" />` en `src/app/layout.tsx`.
3. Crear `public/sw.js` con un service worker básico (cache shell de la app).
4. Registrar el service worker en el layout con un script.

**Notas:** En Next.js App Router, el service worker debe estar en `/public`. Evaluar usar `next-pwa` para simplificar la configuración.

---

### 2.2 Base de datos de ejercicios predefinidos

**Qué:** Al crear un ejercicio, poder seleccionar de un catálogo predefinido filtrado por grupo muscular, en lugar de tener que escribir siempre desde cero.

**Cómo:**
- Añadir un archivo `src/data/exercises-catalog.ts` con ~100 ejercicios comunes (nombre + grupo muscular).
- En el modal de "Nuevo ejercicio", añadir tabs o un filtro: "Buscar en catálogo" / "Nombre libre".
- Al seleccionar del catálogo, rellenar el campo de nombre.

**Schema:** No requiere cambios.

---

### 2.3 Exportar resumen de entreno

**Qué:** Botón "Compartir" en la página de un entreno que genera un resumen en texto (copy to clipboard) o imagen.

**Formato texto ejemplo:**
```
🏋️ Entreno — Lunes 29 Abr
Movilidad: Pigeon pose 3×30s
Básicos: Sentadilla 4×5 @85kg (RIR 2)
Entrenamiento: Press banca 3×8 @70kg
```

**Cómo:**
- Botón que llama a `navigator.clipboard.writeText(resumen)`.
- El resumen se compone en el cliente a partir de los datos ya cargados en la página.

---

## Fase 3: Gamificación — Sistema de Niveles (Solo Leveling)

> El gran feature. Requiere diseño cuidadoso antes de implementar.

### Concepto

Inspirado en el manhwa *Solo Leveling*: el usuario empieza en el rango más bajo y sube de nivel siendo consistente y batiendo récords.

### Ranks

```
E → D → C → B → A → S → S+ (National Level)
```

Cada rank tiene un nombre temático (a decidir con el diseñador) y un icono/badge.

### Fuentes de XP

| Acción | XP |
|--------|-----|
| Completar un entreno | +50 XP |
| Batir un PR en cualquier ejercicio | +100 XP |
| Completar todos los entrenos de una semana | +200 XP (bonus streak) |
| Completar un bloque completo | +500 XP |
| Racha de 7 días seguidos con entreno | +150 XP |

### Umbral de niveles (ejemplo, ajustar)

| Rank | XP necesario |
|------|-------------|
| E | 0 |
| D | 500 |
| C | 1.500 |
| B | 4.000 |
| A | 10.000 |
| S | 25.000 |
| S+ | 60.000 |

### Schema nuevo necesario

```sql
-- Nueva tabla
CREATE TABLE user_levels (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,  -- Clerk userId
  xp INTEGER NOT NULL DEFAULT 0,
  rank TEXT NOT NULL DEFAULT 'E',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Nueva tabla para log de eventos XP
CREATE TABLE xp_events (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  xp_gained INTEGER NOT NULL,
  reason TEXT NOT NULL,  -- 'workout_complete', 'pr_beaten', 'week_complete', etc.
  created_at TIMESTAMP DEFAULT NOW()
);
```

### UI

- **Dashboard:** Badge de rank junto al nombre del usuario (o en la navbar junto al avatar de Clerk).
- **Barra de XP:** Progreso visual hacia el siguiente rank.
- **Toast de subida de nivel:** Notificación espectacular al subir de rank.
- **Historial de XP:** Pestaña en el perfil con los eventos de XP ganado.

### Orden de implementación (cuando llegue el momento)

1. Schema DB + migración
2. Lógica de XP en los Server Actions existentes (al guardar entreno, al detectar PR)
3. UI en dashboard (badge + barra de XP)
4. Toast de level up
5. Página de perfil con historial de XP

---

## Orden de implementación global recomendado

```
Fixes inmediatos
  → 1.1 Autocompletado ejercicios
  → 1.2 PRs (récords personales)
  → 1.3 + 1.4 Historial + Gráfica por ejercicio
  → 1.5 Resumen semanal
  → 2.1 PWA instalable
  → 2.2 Base de datos de ejercicios
  → 2.3 Exportar entreno
  → 3.x Sistema de niveles (Solo Leveling) ← Gran feature final
```
