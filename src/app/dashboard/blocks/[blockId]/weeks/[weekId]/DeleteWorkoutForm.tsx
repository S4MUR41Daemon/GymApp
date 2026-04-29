'use client'

import { SLButton } from '@/components/ui-sl'

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
      <SLButton type="submit" variant="destructive" size="sm">
        Eliminar
      </SLButton>
    </form>
  )
}
