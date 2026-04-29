'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkoutReturn, createMobilitySession, createBasicsSession, createCardioSession } from '../../actions'
import { SLBadge, SLButton, SLCard, SLInput, SLProgressBar, SLTextarea } from '@/components/ui-sl'

type Section = 'mobility' | 'basics' | 'main' | 'cardio'

const SECTIONS: { key: Section; label: string; desc: string; icon: string }[] = [
  { key: 'mobility', label: 'Movilidad', desc: 'Estiramientos y activación', icon: '🧘' },
  { key: 'basics', label: 'Básicos', desc: 'Ejercicios de fuerza general', icon: '🏋️' },
  { key: 'main', label: 'Entrenamiento', desc: 'Bloque principal de fuerza', icon: '⚔️' },
  { key: 'cardio', label: 'Cardio', desc: 'Trabajo cardiovascular', icon: '🏃' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SLProgressBar value={progressPct} max={100} />

      {step === 1 ? (
        <>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>
            Crea un entreno suelto. Podrás añadir secciones en el siguiente paso.
          </p>
          <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SLInput id="name" name="name" type="text" label="Nombre (opcional)" placeholder="Ej. Sesión cardio extra" />
            <SLTextarea id="notes" name="notes" rows={3} label="Notas (opcional)" placeholder="Notas del entreno..." />
            <div style={{ display: 'flex', gap: 8 }}>
              <SLButton type="submit" disabled={isPending} variant="primary">
                Crear entreno
              </SLButton>
              <SLButton href="/dashboard" variant="ghost">
                Cancelar
              </SLButton>
            </div>
          </form>
        </>
      ) : (
        <>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>
            Añade secciones al entreno{workoutName ? ` "${workoutName}"` : ''}:
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
            {SECTIONS.map(({ key, label, desc, icon }) => {
              const isAdded = added.has(key)
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => handleAddSection(key)}
                    disabled={isAdded || isPending}
                    style={{ width: '100%', padding: 0, background: 'transparent', border: 0, textAlign: 'left', cursor: isAdded ? 'default' : 'pointer', opacity: isPending && !isAdded ? 0.6 : 1 }}
                  >
                    <SLCard style={isAdded ? { border: '1.5px solid rgba(96,165,250,0.5)', boxShadow: '0 0 16px rgba(59,130,246,0.25)' } : undefined}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 24 }}>{icon}</span>
                          <div>
                            <p style={{ margin: 0, fontFamily: 'var(--font-rajdhani), sans-serif', fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{label}</p>
                            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>{desc}</p>
                          </div>
                        </div>
                        {isAdded ? <SLBadge variant="success">✓ Añadido</SLBadge> : <SLBadge variant="accent">+ Añadir</SLBadge>}
                      </div>
                    </SLCard>
                  </button>
                </li>
              )
            })}
          </ul>
          <SLButton
            type="button"
            onClick={() => router.push(`/dashboard/workouts/${workoutId}`)}
            variant="primary"
            style={{ alignSelf: 'flex-start' }}
          >
            Ir al entreno →
          </SLButton>
        </>
      )}
    </div>
  )
}
