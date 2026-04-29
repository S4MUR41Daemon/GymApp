import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { workouts, trainingWeeks } from '@/db/schema'
import WorkoutSections from '@/app/dashboard/WorkoutSections'
import { deleteWorkout } from '../../actions'
import { SLButton, SLPageHeader } from '@/components/ui-sl'

type Params = Promise<{ workoutId: string }>

export default async function WorkoutPage({ params }: { params: Params }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { workoutId: workoutIdStr } = await params
  const workoutId = Number(workoutIdStr)

  const workout = await db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
    with: {
      mobilitySession: { with: { sessionExercises: { with: { exercise: true, sets: true } } } },
      basicsSession: true,
      cardioSession: { with: { sessionExercises: { with: { exercise: true, sets: true } } } },
      sessionExercises: { with: { exercise: true, sets: true } },
    },
  })

  if (!workout) notFound()
  if (workout.weekId) {
    const week = await db.query.trainingWeeks.findFirst({
      where: eq(trainingWeeks.id, workout.weekId),
    })
    if (week) redirect(`/dashboard/blocks/${week.blockId}/weeks/${week.id}`)
  }

  async function deleteAction() {
    'use server'
    await deleteWorkout(workoutId)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SLPageHeader
        backHref="/dashboard"
        backLabel="< DASHBOARD"
        title={workout.name ?? 'Entreno'}
        subtitle={workout.notes}
        right={
          <form action={deleteAction}>
            <SLButton type="submit" variant="destructive" size="sm">
              Eliminar
            </SLButton>
          </form>
        }
      />

      <WorkoutSections workout={workout} />
    </div>
  )
}
