import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { trainingBlocks, trainingWeeks, workouts } from '@/db/schema'
import Link from 'next/link'
import WorkoutSections from '@/app/dashboard/WorkoutSections'
import { copyWorkoutToWeek, deleteWorkout } from '@/app/dashboard/actions'
import { DeleteWorkoutForm } from './DeleteWorkoutForm'
import { SLButton, SLCard, SLPageHeader, SLSelect } from '@/components/ui-sl'

type Params = Promise<{ blockId: string; weekId: string }>

export default async function WeekPage({ params }: { params: Params }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { blockId: blockIdStr, weekId: weekIdStr } = await params
  const blockId = Number(blockIdStr)
  const weekId = Number(weekIdStr)

  const [block, week] = await Promise.all([
    db.query.trainingBlocks.findFirst({
      where: and(eq(trainingBlocks.id, blockId), eq(trainingBlocks.userId, userId)),
    }),
    db.query.trainingWeeks.findFirst({
      where: and(eq(trainingWeeks.id, weekId), eq(trainingWeeks.blockId, blockId)),
    }),
  ])

  if (!block || !week) notFound()

  const [weekWorkouts, availableWorkouts] = await Promise.all([
    db.query.workouts.findMany({
      where: eq(workouts.weekId, weekId),
      with: {
        mobilitySession: { with: { sessionExercises: { with: { exercise: true, sets: true } } } },
        basicsSession: true,
        cardioSession: { with: { sessionExercises: { with: { exercise: true, sets: true } } } },
        sessionExercises: { with: { exercise: true, sets: true } },
      },
    }),
    db.query.workouts.findMany({
      where: and(eq(workouts.userId, userId), isNull(workouts.weekId)),
      columns: { id: true, name: true },
    }),
  ])

  async function copyWorkoutAction(formData: FormData) {
    'use server'
    const workoutId = Number(formData.get('workoutId'))
    if (!workoutId) return
    await copyWorkoutToWeek(workoutId, weekId)
  }

  async function deleteWorkoutAction(formData: FormData) {
    'use server'
    const workoutId = Number(formData.get('workoutId'))
    if (!workoutId) return
    await deleteWorkout(workoutId)
  }

  const redirectTo = `/dashboard/blocks/${blockId}/weeks/${weekId}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SLPageHeader
        backHref={`/dashboard/blocks/${blockId}`}
        backLabel="< BLOQUE"
        title={`Semana ${week.weekNumber}`}
        subtitle={block.name}
        right={<SLButton variant="primary" size="sm" href={`/dashboard/blocks/${blockId}`}>Guardar</SLButton>}
      />

      {weekWorkouts.length === 0 && (
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(148,163,184,0.45)' }}>No hay entrenos en esta semana. Añade uno de los entrenos guardados.</p>
      )}

      {weekWorkouts.map((workout) => (
        <SLCard key={workout.id} style={{ padding: 0, overflow: 'hidden' }}>
          <details>
            <summary
              style={{
                cursor: 'pointer',
                padding: '10px 14px',
                listStyle: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                userSelect: 'none',
                fontFamily: 'var(--font-rajdhani), sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#e2e8f0',
              }}
            >
              {workout.name ?? `Entreno #${workout.id}`}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DeleteWorkoutForm action={deleteWorkoutAction} workoutId={workout.id} />
                <span style={{ color: 'rgba(148,163,184,0.45)', fontSize: 12 }}>▸</span>
              </div>
            </summary>
            <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', padding: '12px 12px 14px' }}>
              <WorkoutSections workout={workout} redirectTo={redirectTo} />
            </div>
          </details>
        </SLCard>
      ))}

      {availableWorkouts.length > 0 && (
        <form action={copyWorkoutAction} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <SLSelect
            name="workoutId"
            style={{ flex: 1 }}
          >
            <option value="">Selecciona un entreno…</option>
            {availableWorkouts.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name ?? `Entreno #${w.id}`}
              </option>
            ))}
          </SLSelect>
          <SLButton type="submit" variant="secondary" size="sm" style={{ whiteSpace: 'nowrap' }}>
            + Añadir entreno
          </SLButton>
        </form>
      )}

      {availableWorkouts.length === 0 && (
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(148,163,184,0.45)' }}>
          No tienes entrenos guardados disponibles.{' '}
          <Link href="/dashboard/workouts/new" style={{ color: '#93c5fd' }}>
            Crear uno nuevo
          </Link>
        </p>
      )}
    </div>
  )
}
