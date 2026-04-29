'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import {
  createMobilitySession,
  createBasicsSession,
  createCardioSession,
  addExerciseToMobility,
  addExerciseToBasics,
  addExerciseToMain,
  addExerciseToCardio,
  removeExercise,
  saveAllSets,
  searchExercises,
} from './actions'

type Set = {
  id: number
  setNumber: number
  weightKg: string | null
  reps: number | null
  rir: number | null
  durationMinutes: number | null
  notes: string | null
  isWarmup: boolean
}

type SessionExercise = {
  id: number
  order: number
  block: string
  notes: string | null
  exercise: { name: string; id: number }
  sets: Set[]
}

type MobilitySession = {
  id: number
  durationMinutes: number | null
  notes: string | null
  sessionExercises: SessionExercise[]
} | null

type BasicsSession = { id: number; notes: string | null } | null

type CardioSession = {
  id: number
  type: string | null
  durationMinutes: number | null
  distanceKm: string | null
  notes: string | null
  sessionExercises: SessionExercise[]
} | null

type Workout = {
  id: number
  mobilitySession: MobilitySession
  basicsSession: BasicsSession
  cardioSession: CardioSession
  sessionExercises: SessionExercise[]
}

export default function WorkoutSections({ workout, redirectTo }: { workout: Workout; redirectTo?: string }) {
  const SETS_FORM_ID = `workout-sets-form-${workout.id}`
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const basicsExercises = workout.sessionExercises
    .filter((se) => se.block === 'basics')
    .sort((a, b) => a.order - b.order)
  const mainExercises = workout.sessionExercises
    .filter((se) => se.block === 'main')
    .sort((a, b) => a.order - b.order)

  const createMobility = createMobilitySession.bind(null, workout.id)
  const createBasics = createBasicsSession.bind(null, workout.id)
  const createCardio = createCardioSession.bind(null, workout.id)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const form = document.getElementById(SETS_FORM_ID) as HTMLFormElement
    const formData = new FormData(form)
    if (redirectTo) formData.set('redirectTo', redirectTo)
    startTransition(async () => {
      await saveAllSets(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <form id={SETS_FORM_ID}>
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      </form>

      <Section title="Movilidad">
        {!workout.mobilitySession ? (
          <form action={createMobility}>
            <button type="submit" className="text-[12px] text-zinc-400 hover:text-zinc-100 transition-colors">
              + Añadir movilidad
            </button>
          </form>
        ) : (
          <>
            <ExerciseList formId={SETS_FORM_ID} exercises={workout.mobilitySession.sessionExercises.sort((a, b) => a.order - b.order)} isMobility />
            <AddExerciseForm action={addExerciseToMobility} idField="mobilitySessionId" idValue={workout.mobilitySession.id} defaultSets={3} defaultReps={30} defaultRir={null} repsLabel="Seg" />
          </>
        )}
      </Section>

      <Section title="Básicos">
        {!workout.basicsSession ? (
          <form action={createBasics}>
            <button type="submit" className="text-[12px] text-zinc-400 hover:text-zinc-100 transition-colors">
              + Añadir básicos
            </button>
          </form>
        ) : (
          <>
            <ExerciseList formId={SETS_FORM_ID} exercises={basicsExercises} />
            <AddExerciseForm action={addExerciseToBasics} idField="workoutId" idValue={workout.id} defaultSets={4} defaultReps={5} defaultRir={2} />
          </>
        )}
      </Section>

      <Section title="Entrenamiento">
        <ExerciseList formId={SETS_FORM_ID} exercises={mainExercises} />
        <AddExerciseForm action={addExerciseToMain} idField="workoutId" idValue={workout.id} defaultSets={3} defaultReps={8} defaultRir={2} />
      </Section>

      <Section title="Cardio">
        {!workout.cardioSession ? (
          <form action={createCardio}>
            <button type="submit" className="text-[12px] text-zinc-400 hover:text-zinc-100 transition-colors">
              + Añadir cardio
            </button>
          </form>
        ) : (
          <>
            <ExerciseList formId={SETS_FORM_ID} exercises={workout.cardioSession.sessionExercises.sort((a, b) => a.order - b.order)} isCardio />
            <AddExerciseForm action={addExerciseToCardio} idField="cardioSessionId" idValue={workout.cardioSession.id} defaultSets={1} defaultReps={0} defaultRir={null} isCardio />
          </>
        )}
      </Section>

      <div className="flex items-center gap-4 mt-1">
        {saved ? (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-zinc-100">✓ Guardado</span>
            <span className="text-[13px] text-zinc-400">Los cambios se han guardado.</span>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-[0.625rem] bg-zinc-100 px-[14px] py-[7px] text-[13px] font-medium text-zinc-900 hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            Guardar entreno
          </button>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-[0.625rem] border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-[14px] py-[10px] text-left"
      >
        <span className="text-[13px] font-semibold text-zinc-100">{title}</span>
        <span
          className="text-zinc-400 text-xs transition-transform duration-200"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          ▼
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? '2000px' : '0', opacity: open ? 1 : 0 }}
      >
        <div className="border-t border-white/10 px-[14px] py-3 flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  )
}

function ExerciseList({ formId, exercises, isMobility = false, isCardio = false }: { formId: string; exercises: SessionExercise[]; isMobility?: boolean; isCardio?: boolean }) {
  if (!exercises.length) return null
  return (
    <ul className="flex flex-col gap-4">
      {exercises.map((se) => (
        <li key={se.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[13px] text-zinc-100">{se.exercise.name}</span>
            <form action={removeExercise.bind(null, se.id)}>
              <button type="submit" className="text-[12px] text-zinc-500 hover:text-red-400 transition-colors">
                Quitar
              </button>
            </form>
          </div>
          {se.sets.sort((a, b) => a.setNumber - b.setNumber).map((s) => (
            <SetRow key={s.id} set={s} formId={formId} isMobility={isMobility} isCardio={isCardio} />
          ))}
          {se.notes && <p className="text-xs text-zinc-500">{se.notes}</p>}
        </li>
      ))}
    </ul>
  )
}

function SetRow({ set, formId, isMobility, isCardio }: { set: Set; formId: string; isMobility?: boolean; isCardio?: boolean }) {
  const p = `set_${set.id}_`
  const inputCls = "bg-white/[0.08] border border-white/[0.12] rounded-[5px] py-[5px] px-2 text-[12px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="setId" value={set.id} form={formId} />
      {!isCardio && (
        <span className={`text-[11px] w-10 ${set.isWarmup ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {set.isWarmup ? `W${set.setNumber}` : `Set ${set.setNumber}`}
        </span>
      )}
      {isCardio ? (
        <>
          <input
            name={`${p}durationMinutes`}
            form={formId}
            type="number"
            min="0"
            defaultValue={set.durationMinutes ?? ''}
            placeholder="min"
            className={`w-[60px] ${inputCls}`}
          />
          <span className="text-[11px] text-zinc-500">min</span>
        </>
      ) : isMobility ? (
        <>
          <input
            name={`${p}reps`}
            form={formId}
            type="number"
            min="0"
            defaultValue={set.reps ?? ''}
            placeholder="seg"
            className={`w-[60px] ${inputCls}`}
          />
          <span className="text-[11px] text-zinc-500">seg</span>
        </>
      ) : (
        <>
          <input
            name={`${p}weightKg`}
            form={formId}
            type="number"
            step="0.5"
            min="0"
            defaultValue={set.weightKg ?? ''}
            placeholder="kg"
            className={`w-[58px] ${inputCls}`}
          />
          <span className="text-zinc-500 text-[11px]">×</span>
          <input
            name={`${p}reps`}
            form={formId}
            type="number"
            min="0"
            defaultValue={set.reps ?? ''}
            placeholder="reps"
            className={`w-[52px] ${inputCls}`}
          />
          <span className="text-zinc-500 text-[11px]">RIR</span>
          <input
            name={`${p}rir`}
            form={formId}
            type="number"
            min="0"
            max="10"
            defaultValue={set.rir ?? ''}
            placeholder="rir"
            className={`w-[44px] ${inputCls}`}
          />
        </>
      )}
      <input
        name={`${p}notes`}
        form={formId}
        type="text"
        defaultValue={set.notes ?? ''}
        placeholder="notas"
        className={`flex-1 min-w-[50px] ${inputCls}`}
      />
    </div>
  )
}

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

  const [name, setName] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const closeDialog = () => {
    setName('')
    setSuggestions([])
    setHighlightIndex(-1)
    setShowSuggestions(false)
    setOpen(false)
  }

  useEffect(() => {
    if (name.trim().length < 2) return
    const timer = setTimeout(async () => {
      const results = await searchExercises(name)
      setSuggestions(results)
      setHighlightIndex(-1)
    }, 200)
    return () => clearTimeout(timer)
  }, [name])

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [open])

  const selectSuggestion = (suggestion: { id: number; name: string }) => {
    setName(suggestion.name)
    setShowSuggestions(false)
    setHighlightIndex(-1)
  }

  const handleExerciseNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (suggestions.length === 0) return
      e.preventDefault()
      setShowSuggestions(true)
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1))
      return
    }

    if (e.key === 'ArrowUp') {
      if (suggestions.length === 0) return
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
      return
    }

    if (e.key === 'Enter') {
      const highlighted = suggestions[highlightIndex]
      if (showSuggestions && highlighted) {
        e.preventDefault()
        selectSuggestion(highlighted)
      }
      return
    }

    if (e.key === 'Escape' && showSuggestions) {
      e.stopPropagation()
      setShowSuggestions(false)
      setHighlightIndex(-1)
    }
  }

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
        onClose={closeDialog}
        className="rounded-xl border border-white/[0.14] bg-zinc-900 p-5 w-[320px] shadow-xl backdrop:bg-black/60"
      >
        <h2 className="text-[14px] font-semibold text-zinc-100 mb-4">Nuevo ejercicio</h2>

        <form
          action={async (fd) => { await action(fd); closeDialog() }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name={idField} value={idValue} />

          <div className="relative">
            <input
              name="exerciseName"
              type="text"
              required
              autoFocus
              autoComplete="off"
              value={name}
              onChange={(e) => {
                const nextName = e.target.value
                setName(nextName)
                setShowSuggestions(true)
                if (nextName.trim().length < 2) {
                  setSuggestions([])
                  setHighlightIndex(-1)
                }
              }}
              onKeyDown={handleExerciseNameKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls="exercise-suggestions"
              placeholder="Nombre del ejercicio"
              className="w-full bg-white/[0.08] border border-white/[0.12] rounded-[5px] py-[6px] px-3 text-[12px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul id="exercise-suggestions" role="listbox" className="absolute left-0 right-0 top-full mt-1 z-10 max-h-48 overflow-y-auto rounded-[5px] border border-white/[0.12] bg-zinc-900 shadow-xl">
                {suggestions.map((s, index) => (
                  <li key={s.id} role="option" aria-selected={index === highlightIndex}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(s)}
                      className={`w-full text-left px-3 py-1.5 text-[12px] text-zinc-200 hover:bg-white/[0.06] ${index === highlightIndex ? 'bg-white/[0.06]' : ''}`}
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
              onClick={closeDialog}
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
