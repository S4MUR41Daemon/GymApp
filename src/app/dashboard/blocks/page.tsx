import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { trainingBlocks } from '@/db/schema'
import Link from 'next/link'
import { SLBadge, SLButton, SLCard, SLPageHeader } from '@/components/ui-sl'

export default async function BlocksPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const blocks = await db.query.trainingBlocks.findMany({
    where: eq(trainingBlocks.userId, userId),
    with: { weeks: true },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SLPageHeader
        title="Bloques"
        right={<SLButton variant="primary" size="sm" href="/dashboard/blocks/new">+ Nuevo</SLButton>}
      />

      {blocks.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(148,163,184,0.45)' }}>No hay bloques aún.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {blocks.map((block) => (
            <Link key={block.id} href={`/dashboard/blocks/${block.id}`} style={{ textDecoration: 'none' }}>
              <SLCard>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-rajdhani), sans-serif', fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{block.name}</span>
                    {block.notes && (
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{block.notes}</p>
                    )}
                  </div>
                  <SLBadge>{block.weeks.length} {block.weeks.length === 1 ? 'semana' : 'semanas'}</SLBadge>
                </div>
              </SLCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
