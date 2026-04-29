'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SLButton, SLCard } from '@/components/ui-sl'

type Workout = {
  id: number
  name: string | null
  createdAt: Date
  mobilitySession: { id: number } | null
  basicsSession: { id: number } | null
  cardioSession: { id: number } | null
  sessionExercises: { block: string }[]
}

type Week = {
  id: number
  weekNumber: number
}

type Props = {
  week: Week
  workouts: Workout[]
  blockId: number
  deleteWeekAction: (weekId: number) => Promise<void>
}

export default function WeekAccordion({ week, workouts, blockId, deleteWeekAction }: Props) {
  const [open, setOpen] = useState(false)

  const hasMobility = workouts.some((w) => !!w.mobilitySession)
  const hasBasics = workouts.some((w) => !!w.basicsSession)
  const hasMain = workouts.some((w) => w.sessionExercises.some((se) => se.block === 'main'))
  const hasCardio = workouts.some((w) => !!w.cardioSession)

  return (
    <SLCard style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, textAlign: 'left', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
        >
          <span
            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', color: 'rgba(148,163,184,0.55)', fontSize: 10, transition: 'transform 200ms ease' }}
          >
            ▶
          </span>
          <span style={{ fontFamily: 'var(--font-rajdhani), sans-serif', fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Semana {week.weekNumber}</span>
          <div style={{ display: 'flex', gap: 6, marginLeft: 4 }}>
            <SectionDot label="M" active={hasMobility} title="Movilidad" />
            <SectionDot label="B" active={hasBasics} title="Básicos" />
            <SectionDot label="E" active={hasMain} title="Entrenamiento" />
            <SectionDot label="C" active={hasCardio} title="Cardio" />
          </div>
        </button>

        <SLButton variant="secondary" size="sm" href={`/dashboard/blocks/${blockId}/weeks/${week.id}`}>
          + Entreno
        </SLButton>

        <form action={deleteWeekAction.bind(null, week.id)}>
          <SLButton type="submit" variant="destructive" size="sm">
            Eliminar
          </SLButton>
        </form>
      </div>

      {/* Body */}
      <div
        style={{ maxHeight: open ? '2000px' : '0', opacity: open ? 1 : 0, overflow: 'hidden', transition: 'all 200ms ease' }}
      >
        <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', padding: '8px 10px 10px' }}>
          {workouts.length === 0 ? (
            <p style={{ margin: 0, padding: '8px 26px', fontSize: 12, color: 'rgba(148,163,184,0.45)' }}>Sin entrenos aún.</p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 0, padding: 0, listStyle: 'none' }}>
              {workouts.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/dashboard/workouts/${w.id}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      border: '1px solid rgba(59,130,246,0.1)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-rajdhani), sans-serif',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#e2e8f0',
                    }}
                  >
                    {w.name ?? `Entreno #${w.id}`}
                    <span style={{ marginLeft: 10, color: 'rgba(148,163,184,0.45)' }}>
                      {new Date(w.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SLCard>
  )
}

function SectionDot({ label, active, title }: { label: string; active: boolean; title: string }) {
  return (
    <span
      title={title}
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-barlow), sans-serif',
        fontSize: 10,
        fontWeight: 700,
        background: active ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'rgba(148,163,184,0.1)',
        color: active ? '#bfdbfe' : 'rgba(148,163,184,0.4)',
        boxShadow: active ? '0 0 6px rgba(96,165,250,0.6)' : undefined,
      }}
    >
      {label}
    </span>
  )
}
