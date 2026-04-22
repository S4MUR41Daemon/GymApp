'use client'

export function DeleteWorkoutForm({
  action,
  workoutId,
}: {
  action: (fd: FormData) => Promise<void>
  workoutId: number
}) {
  return (
    <form action={action} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="workoutId" value={workoutId} />
      <button type="submit" className="text-xs text-zinc-600 hover:text-red-400 transition-colors">
        Eliminar
      </button>
    </form>
  )
}
