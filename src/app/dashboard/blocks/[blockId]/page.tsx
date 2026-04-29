import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { trainingBlocks } from '@/db/schema'
import { addWeek, deleteBlock, deleteWeek } from '../../actions'
import WeekAccordion from './WeekAccordion'
import { SLButton, SLPageHeader } from '@/components/ui-sl'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SLPageHeader
        backHref="/dashboard"
        backLabel="< DASHBOARD"
        title={block.name}
        subtitle={block.notes}
        right={<SLButton variant="primary" size="sm" href="/dashboard">Guardar</SLButton>}
      />

      <form action={addWeekAction}>
        <SLButton type="submit" variant="secondary" size="sm">
          + Añadir semana
        </SLButton>
      </form>

      {block.weeks.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(148,163,184,0.45)' }}>No hay semanas aún. Añade la primera.</p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
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

      <form action={deleteBlockAction}>
        <SLButton type="submit" variant="destructive" size="sm">
          Eliminar bloque
        </SLButton>
      </form>
    </div>
  )
}
