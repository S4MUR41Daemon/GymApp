import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { workouts, trainingWeeks } from '@/db/schema'
import Link from 'next/link'
import WorkoutSections from '@/app/dashboard/WorkoutSections'
import { deleteWorkout } from '../../actions'

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
    <main className="flex flex-1 flex-col gap-6 max-w-[640px] p-7">
      <Link href="/dashboard" className="text-[12px] text-zinc-400 hover:text-zinc-100 transition-colors">
        ← Dashboard
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-100">
            {workout.name ?? 'Entreno'}
          </h1>
          {workout.notes && <p className="text-[13px] text-zinc-400 mt-1">{workout.notes}</p>}
        </div>
        <form action={deleteAction}>
          <button type="submit" className="text-[12px] text-zinc-500 hover:text-red-400 transition-colors shrink-0">
            Eliminar
          </button>
        </form>
      </div>

      <WorkoutSections workout={workout} />
    </main>
  )
}
