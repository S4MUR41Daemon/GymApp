import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { trainingBlocks } from '@/db/schema'
import Link from 'next/link'

export default async function BlocksPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const blocks = await db.query.trainingBlocks.findMany({
    where: eq(trainingBlocks.userId, userId),
    with: { weeks: true },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  return (
    <main className="flex flex-col gap-6 max-w-[480px] mx-auto px-6 md:px-10 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-100">Bloques</h1>
        <Link
          href="/dashboard/blocks/new"
          className="rounded-[0.625rem] bg-zinc-100 px-3 py-1.5 text-[12px] font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
        >
          Crear bloque
        </Link>
      </div>

      {blocks.length === 0 ? (
        <p className="text-[13px] text-zinc-500">No hay bloques aún.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {blocks.map((block) => (
            <li key={block.id}>
              <Link
                href={`/dashboard/blocks/${block.id}`}
                className="flex flex-col gap-1 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 hover:bg-white/[0.07] transition-colors"
              >
                <span className="text-[14px] font-medium text-zinc-100">{block.name}</span>
                {block.notes && (
                  <span className="text-[12px] text-zinc-500">{block.notes}</span>
                )}
                <span className="text-[11px] text-zinc-600 mt-0.5">
                  {block.weeks.length} {block.weeks.length === 1 ? 'semana' : 'semanas'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
