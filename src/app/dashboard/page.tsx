import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { trainingBlocks } from '@/db/schema'
import Link from 'next/link'
import { SLBadge, SLButton, SLCard, SLPageHeader, SLSection } from '@/components/ui-sl'
import { getOrCreateUserLevel } from '@/lib/userLevel'
import { NicknameOnboardingModal } from './NicknameOnboardingModal'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [level, blocks, standaloneWorkouts] = await Promise.all([
    getOrCreateUserLevel(userId),
    db.query.trainingBlocks.findMany({
      where: eq(trainingBlocks.userId, userId),
      with: { weeks: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    }),
    db.query.workouts.findMany({
      where: (t, { and, eq, isNull }) => and(eq(t.userId, userId), isNull(t.weekId)),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    }),
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {!level.nickname && <NicknameOnboardingModal />}

      <div>
        <SLPageHeader title="Dashboard" />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <SLButton variant="primary" href="/dashboard/blocks/new">Crear bloque</SLButton>
          <SLButton variant="secondary" href="/dashboard/workouts/new">Crear entreno</SLButton>
        </div>
      </div>

      <SLSection title="Bloques" count={blocks.length}>
        {blocks.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(148,163,184,0.45)' }}>No hay bloques aún.</p>
        ) : (
          blocks.map((block) => (
            <Link key={block.id} href={`/dashboard/blocks/${block.id}`} style={{ textDecoration: 'none' }}>
              <SLCard>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-rajdhani), sans-serif', fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{block.name}</p>
                    {block.notes && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{block.notes}</p>}
                  </div>
                  <SLBadge variant="default">{block.weeks.length} {block.weeks.length === 1 ? 'semana' : 'semanas'}</SLBadge>
                </div>
              </SLCard>
            </Link>
          ))
        )}
      </SLSection>

      <SLSection title="Entrenos sueltos" count={standaloneWorkouts.length}>
        {standaloneWorkouts.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(148,163,184,0.45)' }}>No hay entrenos sueltos aún.</p>
        ) : (
          standaloneWorkouts.map((workout) => (
            <Link key={workout.id} href={`/dashboard/workouts/${workout.id}`} style={{ textDecoration: 'none' }}>
              <SLCard>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-rajdhani), sans-serif', fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{workout.name ?? 'Entreno sin nombre'}</p>
                    {workout.notes && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{workout.notes}</p>}
                  </div>
                  <SLBadge variant="default">
                    {new Date(workout.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </SLBadge>
                </div>
              </SLCard>
            </Link>
          ))
        )}
      </SLSection>
    </div>
  )
}
