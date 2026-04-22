import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { trainingBlocks, trainingWeeks, workouts } from '@/db/schema'
import Link from 'next/link'
import { addWeek, deleteBlock, deleteWeek } from '../../actions'
import WeekAccordion from './WeekAccordion'

type Params = Promise<{ blockId: string }>

export default async function BlockPage({ params }: { params: Params }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { blockId: blockIdStr } = await params
  const blockId = Number(blockIdStr)

  const block = await db.query.trainingBlocks.findFirst({
    where: and(eq(trainingBlocks.id, blockId), eq(trainingBlocks.userId, userId)),
    with: {
      weeks: {
        orderBy: (t, { asc }) => [asc(t.weekNumber)],
      },
    },
  })

  if (!block) notFound()

  const weekIds = block.weeks.map((w) => w.id)
  const weekWorkouts = weekIds.length
    ? await db.query.workouts.findMany({
        where: (t, { inArray }) => inArray(t.weekId, weekIds),
        with: {
          mobilitySession: true,
          basicsSession: true,
          cardioSession: true,
          sessionExercises: true,
        },
      })
    : []

  const workoutsByWeekId: Record<number, typeof weekWorkouts> = {}
  for (const w of weekWorkouts) {
    if (w.weekId == null) continue
    workoutsByWeekId[w.weekId] ??= []
    workoutsByWeekId[w.weekId].push(w)
  }

  async function addWeekAction() {
    'use server'
    await addWeek(blockId)
  }

  async function deleteBlockAction() {
    'use server'
    await deleteBlock(blockId)
  }

  async function deleteWeekAction(weekId: number) {
    'use server'
    await deleteWeek(weekId, blockId)
  }

  return (
    <main className="flex flex-1 flex-col gap-6 max-w-[640px] p-7">
      <Link href="/dashboard" className="text-[12px] text-zinc-400 hover:text-zinc-100 transition-colors">
        ← Dashboard
      </Link>

      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-100">{block.name}</h1>
        {block.notes && <p className="text-zinc-400 text-[13px] mt-1">{block.notes}</p>}
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="rounded-[0.625rem] bg-zinc-100 px-[14px] py-[7px] text-[13px] font-medium text-zinc-900 hover:opacity-85 transition-opacity"
        >
          Guardar bloque
        </Link>
        <form action={deleteBlockAction}>
          <button type="submit" className="text-[12px] text-zinc-500 hover:text-red-400 transition-colors">
            Eliminar bloque
          </button>
        </form>
      </div>

      <form action={addWeekAction}>
        <button
          type="submit"
          className="rounded-[0.625rem] border border-white/[0.18] px-[14px] py-[7px] text-[13px] font-medium text-zinc-100 hover:bg-zinc-800 hover:border-white/[0.28] transition-all duration-150 mb-2"
        >
          + Añadir semana
        </button>
      </form>

      {block.weeks.length === 0 ? (
        <p className="text-zinc-500 text-[13px]">No hay semanas aún. Añade la primera.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {block.weeks.map((week) => (
            <li key={week.id}>
              <WeekAccordion
                week={week}
                workouts={workoutsByWeekId[week.id] ?? []}
                blockId={blockId}
                deleteWeekAction={deleteWeekAction}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
