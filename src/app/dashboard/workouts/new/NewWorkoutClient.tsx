'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createWorkoutReturn, createMobilitySession, createBasicsSession, createCardioSession } from '../../actions'

type Section = 'mobility' | 'basics' | 'main' | 'cardio'

const SECTIONS: { key: Section; label: string; desc: string }[] = [
  { key: 'mobility', label: 'Movilidad', desc: 'Estiramientos y activación' },
  { key: 'basics', label: 'Básicos', desc: 'Ejercicios de fuerza general' },
  { key: 'main', label: 'Entrenamiento', desc: 'Bloque principal de fuerza' },
  { key: 'cardio', label: 'Cardio', desc: 'Trabajo cardiovascular' },
]

export default function NewWorkoutClient() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [workoutId, setWorkoutId] = useState<number | null>(null)
  const [workoutName, setWorkoutName] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<Section>>(new Set())
  const [isPending, startTransition] = useTransition()

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createWorkoutReturn(fd)
      setWorkoutId(result.id)
      setWorkoutName(result.name)
      setStep(2)
    })
  }

  function handleAddSection(key: Section) {
    if (!workoutId || added.has(key)) return
    startTransition(async () => {
      if (key === 'mobility') await createMobilitySession(workoutId)
      else if (key === 'basics') await createBasicsSession(workoutId)
      else if (key === 'cardio') await createCardioSession(workoutId)
      setAdded((prev) => new Set([...prev, key]))
    })
  }

  const progressPct = step === 1 ? 50 : 100

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="h-[2px] bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-100 transition-all duration-300 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {step === 1 ? (
        <>
          <p className="text-[13px] text-zinc-400">
            Crea un entreno suelto. Podrás añadir secciones en el siguiente paso.
          </p>
          <form onSubmit={handleStep1} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-zinc-300" htmlFor="name">Nombre (opcional)</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Ej. Sesión cardio extra"
                className="rounded-[0.625rem] border border-white/[0.18] bg-white/[0.04] px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-zinc-300" htmlFor="notes">Notas (opcional)</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Notas del entreno..."
                className="rounded-[0.625rem] border border-white/[0.18] bg-white/[0.04] px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/30 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-[0.625rem] bg-zinc-100 px-[14px] py-[7px] text-[13px] font-medium text-zinc-900 hover:opacity-85 transition-opacity disabled:opacity-50"
              >
                Crear entreno
              </button>
              <Link
                href="/dashboard"
                className="rounded-[0.625rem] border border-white/[0.18] px-[14px] py-[7px] text-[13px] font-medium text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </>
      ) : (
        <>
          <p className="text-[13px] text-zinc-400">Añade secciones al entreno:</p>
          <ul className="flex flex-col gap-2">
            {SECTIONS.map(({ key, label, desc }) => {
              const isAdded = added.has(key)
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => handleAddSection(key)}
                    disabled={isAdded || isPending}
                    className={`w-full flex items-center justify-between rounded-[0.625rem] border px-4 py-3 text-left transition-all duration-150 ${
                      isAdded
                        ? 'border-white/[0.22] bg-zinc-800'
                        : 'border-white/10 hover:border-white/[0.22] hover:bg-zinc-800/50'
                    }`}
                  >
                    <div>
                      <p className="text-[13px] font-medium text-zinc-100">{label}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                    </div>
                    <span className={`text-[12px] font-medium shrink-0 ml-4 ${isAdded ? 'text-zinc-100' : 'text-zinc-400'}`}>
                      {isAdded ? '✓ Añadido' : '+ Añadir'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/workouts/${workoutId}`)}
            className="rounded-[0.625rem] bg-zinc-100 px-[14px] py-[7px] text-[13px] font-medium text-zinc-900 hover:opacity-85 transition-opacity self-start"
          >
            Ir al entreno →
          </button>
        </>
      )}
    </div>
  )
}
