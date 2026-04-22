'use client'

import { useState } from 'react'
import Link from 'next/link'

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
    <div className="rounded-[0.625rem] border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-[14px] py-[10px]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <span
            className="text-zinc-400 text-[10px] transition-transform duration-200"
            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▶
          </span>
          <span className="text-[13px] font-medium text-zinc-100">Semana {week.weekNumber}</span>
          <div className="flex gap-1.5 ml-1">
            <SectionDot label="M" active={hasMobility} title="Movilidad" />
            <SectionDot label="B" active={hasBasics} title="Básicos" />
            <SectionDot label="E" active={hasMain} title="Entrenamiento" />
            <SectionDot label="C" active={hasCardio} title="Cardio" />
          </div>
        </button>

        <Link
          href={`/dashboard/blocks/${blockId}/weeks/${week.id}`}
          className="rounded-[0.625rem] border border-white/[0.18] px-[10px] py-1 text-[12px] font-medium text-zinc-100 hover:bg-zinc-800 hover:border-white/[0.28] transition-all duration-150 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          + Entreno
        </Link>

        <form action={deleteWeekAction.bind(null, week.id)}>
          <button type="submit" className="text-[12px] text-zinc-600 hover:text-red-400 transition-colors">
            Eliminar
          </button>
        </form>
      </div>

      {/* Body */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? '2000px' : '0', opacity: open ? 1 : 0 }}
      >
        <div className="border-t border-white/10 py-2">
          {workouts.length === 0 ? (
            <p className="text-zinc-500 text-[12px] px-9 py-2">Sin entrenos aún.</p>
          ) : (
            <ul>
              {workouts.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/dashboard/workouts/${w.id}`}
                    className="block w-full text-left px-9 py-[9px] text-[12px] text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    {w.name ?? `Entreno #${w.id}`}
                    <span className="ml-3 text-zinc-500">
                      {new Date(w.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionDot({ label, active, title }: { label: string; active: boolean; title: string }) {
  return (
    <span
      title={title}
      className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-semibold ${
        active ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-500'
      }`}
    >
      {label}
    </span>
  )
}
