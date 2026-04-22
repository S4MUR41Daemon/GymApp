import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { trainingBlocks, trainingWeeks, workouts } from '@/db/schema'
import Link from 'next/link'
import WorkoutSections from '@/app/dashboard/WorkoutSections'
import { copyWorkoutToWeek, deleteWorkout } from '@/app/dashboard/actions'
import { DeleteWorkoutForm } from './DeleteWorkoutForm'

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
    <main className="flex flex-1 flex-col gap-6 max-w-[640px] p-7">
      <nav className="flex items-center gap-2 text-[12px] text-zinc-400">
        <Link href="/dashboard" className="hover:text-zinc-100 transition-colors">Dashboard</Link>
        <span>›</span>
        <Link href={`/dashboard/blocks/${blockId}`} className="hover:text-zinc-100 transition-colors">{block.name}</Link>
        <span>›</span>
        <span className="text-zinc-100">Semana {week.weekNumber}</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-100">Semana {week.weekNumber}</h1>
        <Link
          href={`/dashboard/blocks/${blockId}`}
          className="rounded-[0.625rem] bg-zinc-100 px-[14px] py-[7px] text-[13px] font-medium text-zinc-900 hover:opacity-85 transition-opacity"
        >
          Guardar semana
        </Link>
      </div>

      {weekWorkouts.length === 0 && (
        <p className="text-zinc-500 text-[13px]">No hay entrenos en esta semana. Añade uno de los entrenos guardados.</p>
      )}

      {weekWorkouts.map((workout) => (
        <details key={workout.id} className="rounded-[0.625rem] border border-white/10 overflow-hidden">
          <summary className="cursor-pointer px-[14px] py-[10px] text-zinc-200 text-[13px] font-medium list-none flex items-center justify-between select-none hover:bg-zinc-800/50 transition-colors">
            {workout.name ?? `Entreno #${workout.id}`}
            <div className="flex items-center gap-3">
              <DeleteWorkoutForm action={deleteWorkoutAction} workoutId={workout.id} />
              <span className="text-zinc-500 text-xs">▸</span>
            </div>
          </summary>
          <div className="border-t border-white/10 px-4 pb-4 pt-3">
            <WorkoutSections workout={workout} redirectTo={redirectTo} />
          </div>
        </details>
      ))}

      {availableWorkouts.length > 0 && (
        <form action={copyWorkoutAction} className="flex items-center gap-3 mt-2">
          <select
            name="workoutId"
            className="flex-1 rounded-[0.625rem] border border-white/[0.18] bg-white/[0.04] px-3 py-2 text-[13px] text-zinc-100 focus:outline-none focus:border-white/30"
          >
            <option value="">Selecciona un entreno…</option>
            {availableWorkouts.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name ?? `Entreno #${w.id}`}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-[0.625rem] border border-white/[0.18] px-[14px] py-[7px] text-[13px] font-medium text-zinc-100 hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            + Añadir entreno
          </button>
        </form>
      )}

      {availableWorkouts.length === 0 && (
        <p className="text-zinc-500 text-[13px]">
          No tienes entrenos guardados disponibles.{' '}
          <Link href="/dashboard/workouts/new" className="text-zinc-300 hover:text-zinc-100 underline">
            Crear uno nuevo
          </Link>
        </p>
      )}
    </main>
  )
}
