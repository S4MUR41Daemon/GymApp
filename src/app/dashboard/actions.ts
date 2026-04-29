'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and, max, ilike, inArray, or } from 'drizzle-orm'
import { db } from '@/db'
import {
  trainingBlocks,
  trainingWeeks,
  workouts,
  mobilitySessions,
  basicsSessions,
  cardioSessions,
  sessionExercises,
  sets,
  exercises,
  userExerciseStats,
} from '@/db/schema'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireUser() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  return userId
}

function calculate1rm(weightKg: number, reps: number, rir: number): number {
  const totalReps = reps + rir
  return weightKg * (1 + totalReps / 30)
}

async function upsert1rm(userId: string, exerciseId: number, weight: number, reps: number, rir: number) {
  const estimated = calculate1rm(weight, reps, rir)
  const existing = await db.query.userExerciseStats.findFirst({
    where: and(eq(userExerciseStats.userId, userId), eq(userExerciseStats.exerciseId, exerciseId)),
  })
  if (!existing || Number(existing.reference1rm) < estimated) {
    if (existing) {
      await db.update(userExerciseStats)
        .set({ reference1rm: String(estimated.toFixed(2)), updatedAt: new Date() })
        .where(eq(userExerciseStats.id, existing.id))
    } else {
      await db.insert(userExerciseStats).values({
        userId,
        exerciseId,
        reference1rm: String(estimated.toFixed(2)),
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

export async function createBlock(formData: FormData) {
  const userId = await requireUser()
  const name = formData.get('name')
  if (typeof name !== 'string' || !name.trim()) return

  const [block] = await db.insert(trainingBlocks).values({
    userId,
    name: name.trim(),
    notes: typeof formData.get('notes') === 'string' ? (formData.get('notes') as string).trim() || null : null,
  }).returning({ id: trainingBlocks.id })

  revalidatePath('/dashboard')
  redirect(`/dashboard/blocks/${block.id}`)
}

export async function deleteBlock(blockId: number) {
  const userId = await requireUser()
  await db.delete(trainingBlocks)
    .where(and(eq(trainingBlocks.id, blockId), eq(trainingBlocks.userId, userId)))
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// ---------------------------------------------------------------------------
// Weeks
// ---------------------------------------------------------------------------

export async function addWeek(blockId: number) {
  const userId = await requireUser()

  const block = await db.query.trainingBlocks.findFirst({
    where: and(eq(trainingBlocks.id, blockId), eq(trainingBlocks.userId, userId)),
  })
  if (!block) return

  const result = await db
    .select({ maxWeek: max(trainingWeeks.weekNumber) })
    .from(trainingWeeks)
    .where(eq(trainingWeeks.blockId, blockId))
  const nextWeekNumber = (result[0]?.maxWeek ?? 0) + 1

  const [week] = await db.insert(trainingWeeks).values({
    blockId,
    weekNumber: nextWeekNumber,
  }).returning({ id: trainingWeeks.id })

  revalidatePath(`/dashboard/blocks/${blockId}`)
  redirect(`/dashboard/blocks/${blockId}/weeks/${week.id}`)
}

export async function deleteWeek(weekId: number, blockId: number) {
  const userId = await requireUser()
  const block = await db.query.trainingBlocks.findFirst({
    where: and(eq(trainingBlocks.id, blockId), eq(trainingBlocks.userId, userId)),
  })
  if (!block) return
  await db.delete(trainingWeeks).where(
    and(eq(trainingWeeks.id, weekId), eq(trainingWeeks.blockId, blockId))
  )
  revalidatePath(`/dashboard/blocks/${blockId}`)
  redirect(`/dashboard/blocks/${blockId}`)
}

// ---------------------------------------------------------------------------
// Workouts (standalone)
// ---------------------------------------------------------------------------

export async function createWorkout(formData: FormData) {
  const userId = await requireUser()
  const name = typeof formData.get('name') === 'string' ? (formData.get('name') as string).trim() : null

  const [workout] = await db.insert(workouts).values({
    userId,
    name: name || null,
    notes: typeof formData.get('notes') === 'string' ? (formData.get('notes') as string).trim() || null : null,
  }).returning({ id: workouts.id })

  revalidatePath('/dashboard')
  redirect(`/dashboard/workouts/${workout.id}`)
}

export async function createWorkoutReturn(formData: FormData): Promise<{ id: number; name: string | null }> {
  const userId = await requireUser()
  const name = typeof formData.get('name') === 'string' ? (formData.get('name') as string).trim() : null

  const [workout] = await db.insert(workouts).values({
    userId,
    name: name || null,
    notes: typeof formData.get('notes') === 'string' ? (formData.get('notes') as string).trim() || null : null,
  }).returning({ id: workouts.id, name: workouts.name })

  revalidatePath('/dashboard')
  return { id: workout.id, name: workout.name }
}

export async function deleteWorkout(workoutId: number) {
  const userId = await requireUser()
  const workout = await db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  })
  if (!workout) return

  await db.delete(workouts).where(eq(workouts.id, workoutId))
  revalidatePath('/dashboard')

  if (workout.weekId) {
    const week = await db.query.trainingWeeks.findFirst({ where: eq(trainingWeeks.id, workout.weekId) })
    if (week) {
      redirect(`/dashboard/blocks/${week.blockId}`)
    }
  }
  redirect('/dashboard')
}

// ---------------------------------------------------------------------------
// Sessions (create sub-sessions within a workout)
// ---------------------------------------------------------------------------

export async function createMobilitySession(workoutId: number, _formData?: FormData) {
  await requireUser()
  const existing = await db.query.mobilitySessions.findFirst({
    where: eq(mobilitySessions.workoutId, workoutId),
  })
  if (!existing) {
    await db.insert(mobilitySessions).values({ workoutId })
  }
  revalidatePath('/dashboard', 'layout')
}

export async function createBasicsSession(workoutId: number, _formData?: FormData) {
  await requireUser()
  const existing = await db.query.basicsSessions.findFirst({
    where: eq(basicsSessions.workoutId, workoutId),
  })
  if (!existing) {
    await db.insert(basicsSessions).values({ workoutId })
  }
  revalidatePath('/dashboard', 'layout')
}

export async function createCardioSession(workoutId: number, _formData?: FormData) {
  await requireUser()
  const existing = await db.query.cardioSessions.findFirst({
    where: eq(cardioSessions.workoutId, workoutId),
  })
  if (!existing) {
    await db.insert(cardioSessions).values({ workoutId })
  }
  revalidatePath('/dashboard', 'layout')
}

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

async function findOrCreateExercise(name: string): Promise<number> {
  const trimmed = name.trim()
  const existing = await db.query.exercises.findFirst({
    where: ilike(exercises.name, trimmed),
  })
  if (existing) return existing.id
  const [created] = await db.insert(exercises).values({ name: trimmed }).returning({ id: exercises.id })
  return created.id
}

export async function searchExercises(query: string): Promise<Array<{ id: number; name: string }>> {
  const { userId } = await auth()
  if (!userId) return []

  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const workoutExerciseIds = db
    .select({ id: sessionExercises.exerciseId })
    .from(sessionExercises)
    .innerJoin(workouts, eq(sessionExercises.workoutId, workouts.id))
    .where(eq(workouts.userId, userId))

  const mobilityExerciseIds = db
    .select({ id: sessionExercises.exerciseId })
    .from(sessionExercises)
    .innerJoin(mobilitySessions, eq(sessionExercises.mobilitySessionId, mobilitySessions.id))
    .innerJoin(workouts, eq(mobilitySessions.workoutId, workouts.id))
    .where(eq(workouts.userId, userId))

  const cardioExerciseIds = db
    .select({ id: sessionExercises.exerciseId })
    .from(sessionExercises)
    .innerJoin(cardioSessions, eq(sessionExercises.cardioSessionId, cardioSessions.id))
    .innerJoin(workouts, eq(cardioSessions.workoutId, workouts.id))
    .where(eq(workouts.userId, userId))

  const personalResults = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(and(
      ilike(exercises.name, `%${trimmed}%`),
      or(
        inArray(exercises.id, workoutExerciseIds),
        inArray(exercises.id, mobilityExerciseIds),
        inArray(exercises.id, cardioExerciseIds),
      ),
    ))
    .orderBy(exercises.name)
    .limit(8)

  if (personalResults.length > 0) return personalResults

  return db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(ilike(exercises.name, `%${trimmed}%`))
    .orderBy(exercises.name)
    .limit(8)
}

export async function addExerciseToMobility(formData: FormData) {
  await requireUser()
  const mobilitySessionId = Number(formData.get('mobilitySessionId'))
  const exerciseName = formData.get('exerciseName')
  const numSets = Number(formData.get('sets') ?? 3)
  if (typeof exerciseName !== 'string' || !exerciseName.trim()) return

  const exerciseId = await findOrCreateExercise(exerciseName)

  const existing = await db.query.sessionExercises.findMany({
    where: eq(sessionExercises.mobilitySessionId, mobilitySessionId),
  })

  const [se] = await db.insert(sessionExercises).values({
    exerciseId,
    block: 'mobility',
    order: existing.length + 1,
    mobilitySessionId,
  }).returning({ id: sessionExercises.id })

  const defaultReps = Number(formData.get('reps') ?? 10)
  const defaultRir = Number(formData.get('rir') ?? 2)
  for (let i = 1; i <= numSets; i++) {
    await db.insert(sets).values({ sessionExerciseId: se.id, setNumber: i, reps: defaultReps, rir: defaultRir })
  }

  revalidatePath('/dashboard', 'layout')
}

export async function addExerciseToBasics(formData: FormData) {
  await requireUser()
  const workoutId = Number(formData.get('workoutId'))
  const exerciseName = formData.get('exerciseName')
  const numSets = Number(formData.get('sets') ?? 3)
  if (typeof exerciseName !== 'string' || !exerciseName.trim()) return

  const exerciseId = await findOrCreateExercise(exerciseName)

  const existing = await db.query.sessionExercises.findMany({
    where: and(eq(sessionExercises.workoutId, workoutId), eq(sessionExercises.block, 'basics')),
  })

  const [se] = await db.insert(sessionExercises).values({
    exerciseId,
    block: 'basics',
    order: existing.length + 1,
    workoutId,
  }).returning({ id: sessionExercises.id })

  const defaultReps = Number(formData.get('reps') ?? 5)
  const defaultRir = Number(formData.get('rir') ?? 2)
  for (let i = 1; i <= numSets; i++) {
    await db.insert(sets).values({ sessionExerciseId: se.id, setNumber: i, reps: defaultReps, rir: defaultRir })
  }

  revalidatePath('/dashboard', 'layout')
}

export async function addExerciseToMain(formData: FormData) {
  await requireUser()
  const workoutId = Number(formData.get('workoutId'))
  const exerciseName = formData.get('exerciseName')
  const numSets = Number(formData.get('sets') ?? 3)
  if (typeof exerciseName !== 'string' || !exerciseName.trim()) return

  const exerciseId = await findOrCreateExercise(exerciseName)

  const existing = await db.query.sessionExercises.findMany({
    where: and(eq(sessionExercises.workoutId, workoutId), eq(sessionExercises.block, 'main')),
  })

  const [se] = await db.insert(sessionExercises).values({
    exerciseId,
    block: 'main',
    order: existing.length + 1,
    workoutId,
  }).returning({ id: sessionExercises.id })

  const defaultReps = Number(formData.get('reps') ?? 8)
  const defaultRir = Number(formData.get('rir') ?? 2)
  for (let i = 1; i <= numSets; i++) {
    await db.insert(sets).values({ sessionExerciseId: se.id, setNumber: i, reps: defaultReps, rir: defaultRir })
  }

  revalidatePath('/dashboard', 'layout')
}

export async function addExerciseToCardio(formData: FormData) {
  await requireUser()
  const cardioSessionId = Number(formData.get('cardioSessionId'))
  const exerciseName = formData.get('exerciseName')
  const numSets = Number(formData.get('sets') ?? 1)
  if (typeof exerciseName !== 'string' || !exerciseName.trim()) return

  const exerciseId = await findOrCreateExercise(exerciseName)

  const existing = await db.query.sessionExercises.findMany({
    where: eq(sessionExercises.cardioSessionId, cardioSessionId),
  })

  const [se] = await db.insert(sessionExercises).values({
    exerciseId,
    block: 'cardio',
    order: existing.length + 1,
    cardioSessionId,
  }).returning({ id: sessionExercises.id })

  const defaultMinutes = Number(formData.get('durationMinutes') ?? 0)
  for (let i = 1; i <= numSets; i++) {
    await db.insert(sets).values({ sessionExerciseId: se.id, setNumber: i, durationMinutes: defaultMinutes || null })
  }

  revalidatePath('/dashboard', 'layout')
}

export async function removeExercise(sessionExerciseId: number, _formData?: FormData) {
  await requireUser()
  await db.delete(sessionExercises).where(eq(sessionExercises.id, sessionExerciseId))
  revalidatePath('/dashboard', 'layout')
}

// ---------------------------------------------------------------------------
// Week workout assignment (copy-on-assign)
// ---------------------------------------------------------------------------

export async function copyWorkoutToWeek(sourceWorkoutId: number, weekId: number) {
  const userId = await requireUser()

  const source = await db.query.workouts.findFirst({
    where: and(eq(workouts.id, sourceWorkoutId), eq(workouts.userId, userId)),
    with: {
      mobilitySession: { with: { sessionExercises: { with: { sets: true } } } },
      basicsSession: true,
      cardioSession: { with: { sessionExercises: { with: { sets: true } } } },
      sessionExercises: { with: { sets: true } },
    },
  })
  if (!source) return

  const [newWorkout] = await db.insert(workouts).values({
    userId,
    weekId,
    name: source.name,
    notes: source.notes,
  }).returning({ id: workouts.id })

  async function copySets(sourceSeId: number, newSeId: number) {
    const sourceSets = await db.query.sets.findMany({ where: eq(sets.sessionExerciseId, sourceSeId) })
    for (const s of sourceSets) {
      await db.insert(sets).values({
        sessionExerciseId: newSeId,
        setNumber: s.setNumber,
        weightKg: s.weightKg,
        reps: s.reps,
        rir: s.rir,
        durationMinutes: s.durationMinutes,
        notes: s.notes,
      })
    }
  }

  if (source.mobilitySession) {
    const [newMs] = await db.insert(mobilitySessions).values({ workoutId: newWorkout.id }).returning({ id: mobilitySessions.id })
    for (const se of source.mobilitySession.sessionExercises) {
      const [newSe] = await db.insert(sessionExercises).values({
        exerciseId: se.exerciseId,
        block: 'mobility',
        order: se.order,
        notes: se.notes,
        mobilitySessionId: newMs.id,
      }).returning({ id: sessionExercises.id })
      await copySets(se.id, newSe.id)
    }
  }

  if (source.basicsSession) {
    await db.insert(basicsSessions).values({ workoutId: newWorkout.id })
    const basicSes = source.sessionExercises.filter((se) => se.block === 'basics')
    for (const se of basicSes) {
      const [newSe] = await db.insert(sessionExercises).values({
        exerciseId: se.exerciseId,
        block: 'basics',
        order: se.order,
        notes: se.notes,
        workoutId: newWorkout.id,
      }).returning({ id: sessionExercises.id })
      await copySets(se.id, newSe.id)
    }
  }

  const mainSes = source.sessionExercises.filter((se) => se.block === 'main')
  for (const se of mainSes) {
    const [newSe] = await db.insert(sessionExercises).values({
      exerciseId: se.exerciseId,
      block: 'main',
      order: se.order,
      notes: se.notes,
      workoutId: newWorkout.id,
    }).returning({ id: sessionExercises.id })
    await copySets(se.id, newSe.id)
  }

  if (source.cardioSession) {
    const [newCs] = await db.insert(cardioSessions).values({ workoutId: newWorkout.id }).returning({ id: cardioSessions.id })
    for (const se of source.cardioSession.sessionExercises) {
      const [newSe] = await db.insert(sessionExercises).values({
        exerciseId: se.exerciseId,
        block: 'cardio',
        order: se.order,
        notes: se.notes,
        cardioSessionId: newCs.id,
      }).returning({ id: sessionExercises.id })
      await copySets(se.id, newSe.id)
    }
  }

  revalidatePath('/dashboard', 'layout')
}

// ---------------------------------------------------------------------------
// Sets
// ---------------------------------------------------------------------------

export async function saveAllSets(formData: FormData) {
  const userId = await requireUser()

  // Collect all set IDs from hidden inputs named "setIds"
  const setIds = formData.getAll('setId').map(Number)

  for (const setId of setIds) {
    const weightKg = formData.get(`set_${setId}_weightKg`) ? String(formData.get(`set_${setId}_weightKg`)) : null
    const reps = formData.get(`set_${setId}_reps`) ? Number(formData.get(`set_${setId}_reps`)) : null
    const rir = formData.get(`set_${setId}_rir`) !== null && formData.get(`set_${setId}_rir`) !== '' ? Number(formData.get(`set_${setId}_rir`)) : null
    const durationMinutes = formData.get(`set_${setId}_durationMinutes`) ? Number(formData.get(`set_${setId}_durationMinutes`)) : null
    const notes = formData.get(`set_${setId}_notes`) ? String(formData.get(`set_${setId}_notes`)).trim() || null : null

    await db.update(sets).set({ weightKg, reps, rir, durationMinutes, notes }).where(eq(sets.id, setId))

    if (weightKg && reps !== null && rir !== null) {
      const setRow = await db.query.sets.findFirst({ where: eq(sets.id, setId) })
      if (setRow) {
        const se = await db.query.sessionExercises.findFirst({
          where: eq(sessionExercises.id, setRow.sessionExerciseId),
        })
        if (se) {
          await upsert1rm(userId, se.exerciseId, Number(weightKg), reps, rir)
        }
      }
    }
  }

  revalidatePath('/dashboard', 'layout')
  const redirectTo = formData.get('redirectTo') ? String(formData.get('redirectTo')) : '/dashboard'
  redirect(redirectTo)
}

