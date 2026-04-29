# Fix: UX "Añadir ejercicio" → Modal

## Contexto

El formulario para añadir ejercicios a una sección (Movilidad, Básicos, Entrenamiento, Cardio) se expande inline dentro de la tarjeta de la sección, visualmente indistinguible de los sets del ejercicio anterior. El usuario no sabe si está editando el ejercicio existente o creando uno nuevo.

Ver screenshots adjuntos en la conversación original.

## Archivo a modificar

**Ruta:** `src/app/dashboard/WorkoutSections.tsx`

Solo hay que reemplazar la función `AddExerciseForm`. No tocar nada más del archivo.

## Localizar el código a reemplazar

Buscar la función `AddExerciseForm` (empieza en `function AddExerciseForm({`). Reemplazar **toda la función completa** con la nueva versión de abajo.

## Cambio en los imports

En la línea 3 del archivo, cambiar:

```tsx
// ANTES
import { useState, useTransition } from 'react'

// DESPUÉS
import { useState, useTransition, useRef, useEffect } from 'react'
```

## Nueva implementación de `AddExerciseForm`

```tsx
function AddExerciseForm({
  action,
  idField,
  idValue,
  defaultSets,
  defaultReps,
  defaultRir,
  repsLabel = 'Reps',
  isCardio = false,
}: {
  action: (formData: FormData) => Promise<void>
  idField: string
  idValue: number
  defaultSets: number
  defaultReps: number
  defaultRir: number | null
  repsLabel?: string
  isCardio?: boolean
}) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[12px] text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        + Añadir ejercicio
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="rounded-xl border border-white/[0.14] bg-zinc-900 p-5 w-[320px] shadow-xl backdrop:bg-black/60 open:flex open:flex-col open:gap-4"
      >
        <h2 className="text-[14px] font-semibold text-zinc-100">Nuevo ejercicio</h2>

        <form
          action={async (fd) => { await action(fd); setOpen(false) }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name={idField} value={idValue} />

          <input
            name="exerciseName"
            type="text"
            required
            autoFocus
            placeholder="Nombre del ejercicio"
            className="w-full bg-white/[0.08] border border-white/[0.12] rounded-[5px] py-[6px] px-3 text-[12px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
          />

          {isCardio ? (
            <label className="flex flex-col gap-0.5">
              <span className="text-[11px] text-zinc-500">Minutos</span>
              <input
                name="durationMinutes"
                type="number"
                min="0"
                placeholder="min"
                className="w-24 bg-white/[0.08] border border-white/[0.12] rounded-[5px] py-[6px] px-3 text-[12px] text-zinc-100 focus:outline-none focus:border-white/30"
              />
            </label>
          ) : (
            <div className="flex gap-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-zinc-500">Series</span>
                <input
                  name="sets"
                  type="number"
                  min="1"
                  defaultValue={defaultSets}
                  className="w-16 bg-white/[0.08] border border-white/[0.12] rounded-[5px] py-[6px] px-3 text-[12px] text-zinc-100 focus:outline-none focus:border-white/30"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] text-zinc-500">{repsLabel}</span>
                <input
                  name="reps"
                  type="number"
                  min="0"
                  defaultValue={defaultReps || ''}
                  className="w-16 bg-white/[0.08] border border-white/[0.12] rounded-[5px] py-[6px] px-3 text-[12px] text-zinc-100 focus:outline-none focus:border-white/30"
                />
              </label>
              {defaultRir !== null && (
                <label className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-zinc-500">RIR</span>
                  <input
                    name="rir"
                    type="number"
                    min="0"
                    max="10"
                    defaultValue={defaultRir}
                    className="w-14 bg-white/[0.08] border border-white/[0.12] rounded-[5px] py-[6px] px-3 text-[12px] text-zinc-100 focus:outline-none focus:border-white/30"
                  />
                </label>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end mt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-[0.625rem] border border-white/[0.18] px-4 py-1.5 text-[12px] font-medium text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              Añadir
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
```

## Notas de implementación

- Se usa el elemento `<dialog>` **nativo de HTML5** — sin librerías nuevas.
- `showModal()` gestiona automáticamente el backdrop, el foco y el cierre con Escape.
- La clase `backdrop:bg-black/60` aplica a `::backdrop` del dialog (Tailwind v4 lo soporta).
- La clase `open:flex open:flex-col open:gap-4` aplica cuando el dialog está abierto (selector `:is([open])`).
- Si el dialog da problemas de estilos con Tailwind (el `<dialog>` tiene `display:none` por defecto), añadir esto al CSS global:
  ```css
  dialog[open] {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  ```

## Verificación

1. En cualquier entreno, dentro de cualquier sección (Movilidad, Básicos, Entrenamiento, Cardio)
2. Pulsar "+ Añadir ejercicio"
3. Debe abrirse un modal centrado con fondo oscurecido (backdrop)
4. El modal tiene título "Nuevo ejercicio", campo de nombre, inputs de series/reps y botones Cancelar / Añadir
5. Al añadir → modal cierra, ejercicio aparece en la lista de la sección
6. Al cancelar → modal cierra sin cambios
7. Pulsar Escape → modal cierra sin cambios
8. El resto del flujo (editar sets, guardar entreno) no se ve afectado
