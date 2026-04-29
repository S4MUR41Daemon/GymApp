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
import { SLButton, SLCard, SLDivider, SLInput, SLNumberInput } from '@/components/ui-sl'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <form id={SETS_FORM_ID}>
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      </form>

      <Section title="Movilidad">
        {!workout.mobilitySession ? (
          <form action={createMobility}>
            <SLButton type="submit" variant="ghost" size="sm">
              + Añadir movilidad
            </SLButton>
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
            <SLButton type="submit" variant="ghost" size="sm">
              + Añadir básicos
            </SLButton>
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
            <SLButton type="submit" variant="ghost" size="sm">
              + Añadir cardio
            </SLButton>
          </form>
        ) : (
          <>
            <ExerciseList formId={SETS_FORM_ID} exercises={workout.cardioSession.sessionExercises.sort((a, b) => a.order - b.order)} isCardio />
            <AddExerciseForm action={addExerciseToCardio} idField="cardioSessionId" idValue={workout.cardioSession.id} defaultSets={1} defaultReps={0} defaultRir={null} isCardio />
          </>
        )}
      </Section>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        {saved ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#22c55e', fontSize: 13 }}>✓</span>
            <span style={{ fontFamily: 'var(--font-rajdhani), sans-serif', fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Guardado</span>
            <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>Los cambios se han guardado.</span>
          </div>
        ) : (
          <SLButton
            onClick={handleSave}
            disabled={isPending}
            variant="primary"
          >
            GUARDAR ENTRENO
          </SLButton>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <SLCard style={{ padding: 0, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          textAlign: 'left',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
        }}
      >
        <div style={{ flex: 1 }}>
          <SLDivider title={title} />
        </div>
        <span
          style={{
            marginLeft: 10,
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            color: 'rgba(148,163,184,0.55)',
            fontSize: 12,
            transition: 'transform 200ms ease',
          }}
        >
          ▼
        </span>
      </button>
      <div
        style={{ maxHeight: open ? '2000px' : '0', opacity: open ? 1 : 0, overflow: 'hidden', transition: 'all 200ms ease' }}
      >
        <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>
      </div>
    </SLCard>
  )
}

function ExerciseList({ formId, exercises, isMobility = false, isCardio = false }: { formId: string; exercises: SessionExercise[]; isMobility?: boolean; isCardio?: boolean }) {
  if (!exercises.length) return null
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: 0, padding: 0, listStyle: 'none' }}>
      {exercises.map((se) => (
        <li key={se.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-rajdhani), sans-serif', fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{se.exercise.name}</span>
            <form action={removeExercise.bind(null, se.id)}>
              <SLButton type="submit" variant="destructive" size="sm">
                Quitar
              </SLButton>
            </form>
          </div>
          {se.sets.sort((a, b) => a.setNumber - b.setNumber).map((s) => (
            <SetRow key={s.id} set={s} formId={formId} isMobility={isMobility} isCardio={isCardio} />
          ))}
          {se.notes && <p style={{ margin: 0, fontSize: 12, color: 'rgba(148,163,184,0.45)' }}>{se.notes}</p>}
        </li>
      ))}
    </ul>
  )
}

function SetRow({ set, formId, isMobility, isCardio }: { set: Set; formId: string; isMobility?: boolean; isCardio?: boolean }) {
  const p = `set_${set.id}_`
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <input type="hidden" name="setId" value={set.id} form={formId} />
      {!isCardio && (
        <span style={{ width: 42, fontFamily: 'var(--font-barlow), sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: set.isWarmup ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.45)' }}>
          {set.isWarmup ? `W${set.setNumber}` : `Set ${set.setNumber}`}
        </span>
      )}
      {isCardio ? (
        <>
          <SLNumberInput
            name={`${p}durationMinutes`}
            form={formId}
            min="0"
            defaultValue={set.durationMinutes ?? ''}
            placeholder="min"
            width={60}
          />
          <SetLabel>min</SetLabel>
        </>
      ) : isMobility ? (
        <>
          <SLNumberInput
            name={`${p}reps`}
            form={formId}
            min="0"
            defaultValue={set.reps ?? ''}
            placeholder="seg"
            width={60}
          />
          <SetLabel>seg</SetLabel>
        </>
      ) : (
        <>
          <SLNumberInput
            name={`${p}weightKg`}
            form={formId}
            step="0.5"
            min="0"
            defaultValue={set.weightKg ?? ''}
            placeholder="kg"
            width={60}
          />
          <SetLabel>kg</SetLabel>
          <SLNumberInput
            name={`${p}reps`}
            form={formId}
            min="0"
            defaultValue={set.reps ?? ''}
            placeholder="reps"
            width={60}
          />
          <SetLabel>reps</SetLabel>
          <SLNumberInput
            name={`${p}rir`}
            form={formId}
            min="0"
            max="10"
            defaultValue={set.rir ?? ''}
            placeholder="rir"
            width={52}
          />
          <SetLabel>RIR</SetLabel>
        </>
      )}
      <SLInput
        name={`${p}notes`}
        form={formId}
        type="text"
        defaultValue={set.notes ?? ''}
        placeholder="notas"
        style={{ flex: 1, minWidth: 80 }}
      />
    </div>
  )
}

function SetLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.45)' }}>
      {children}
    </span>
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
      <SLButton
        type="button"
        onClick={() => setOpen(true)}
        variant="ghost"
        size="sm"
        style={{ alignSelf: 'flex-start', textTransform: 'uppercase' }}
      >
        + Añadir ejercicio
      </SLButton>

      <dialog
        ref={dialogRef}
        onClose={closeDialog}
        className="backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        style={{
          padding: 24,
          borderRadius: 10,
          border: '1.5px solid rgba(96,165,250,0.4)',
          boxShadow: '0 0 24px rgba(59,130,246,0.3)',
          background: 'linear-gradient(160deg, rgba(10,22,45,0.99), rgba(5,8,18,0.99))',
          animation: 'lvlReveal 0.3s ease',
          width: 320,
          color: '#e2e8f0',
        }}
      >
        <h2
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(96,165,250,0.6)',
            textAlign: 'center',
          }}
        >
          — AÑADIR EJERCICIO —
        </h2>

        <form
          action={async (fd) => { await action(fd); closeDialog() }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <input type="hidden" name={idField} value={idValue} />

          <div style={{ position: 'relative' }}>
            <SLInput
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
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul
                id="exercise-suggestions"
                role="listbox"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  zIndex: 10,
                  maxHeight: 192,
                  overflowY: 'auto',
                  borderRadius: 5,
                  border: '1px solid rgba(59,130,246,0.25)',
                  background: 'rgba(7,12,22,0.95)',
                  boxShadow: '0 0 18px rgba(0,0,0,0.35)',
                  listStyle: 'none',
                  padding: 0,
                }}
              >
                {suggestions.map((s, index) => (
                  <li key={s.id} role="option" aria-selected={index === highlightIndex}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(s)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 10px',
                        border: 0,
                        background: index === highlightIndex ? 'rgba(59,130,246,0.15)' : 'transparent',
                        color: '#e2e8f0',
                        fontFamily: 'var(--font-rajdhani), sans-serif',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isCardio ? (
            <SLNumberInput name="durationMinutes" min="0" placeholder="min" label="Minutos" width={90} />
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <SLNumberInput name="sets" min="1" defaultValue={defaultSets} label="Series" width={64} />
              <SLNumberInput name="reps" min="0" defaultValue={defaultReps || ''} label={repsLabel} width={64} />
              {defaultRir !== null && (
                <SLNumberInput name="rir" min="0" max="10" defaultValue={defaultRir} label="RIR" width={56} />
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <SLButton
              type="button"
              onClick={closeDialog}
              variant="ghost"
              size="sm"
            >
              Cancelar
            </SLButton>
            <SLButton type="submit" variant="primary" size="sm">
              Añadir
            </SLButton>
          </div>
        </form>
      </dialog>
    </>
  )
}
