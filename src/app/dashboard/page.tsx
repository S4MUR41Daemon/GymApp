import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { trainingBlocks, workouts } from '@/db/schema'
import Link from 'next/link'
import Image from 'next/image'

function getDayCharacter(): number {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [blocks, standaloneWorkouts] = await Promise.all([
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

  const charIndex = getDayCharacter()

  return (
    <main className="flex flex-1 relative overflow-hidden">
      {/* Character: imagen a brillo pleno; un solo velo con gradiente suave: izq algo más sombría → centro “normal” → dcha hacia el panel sin corte duro */}
      <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[46%] pointer-events-none select-none">
        <div className="relative h-full w-full">
          <Image
            src={`/images/DashboardBackground${charIndex}.png`}
            alt="Character"
            fill
            className="object-contain object-bottom"
            priority
            sizes="46vw"
          />
          {/* Multi-layer gradient vignette: blends character into background from all edges */}
          <div
            className="absolute inset-0"
            style={{
              background: [
                /* horizontal: left edge fade → clear center → right edge blend to panel */
                `linear-gradient(90deg,
                  color-mix(in oklch, var(--background) 60%, transparent) 0%,
                  color-mix(in oklch, var(--background) 12%, transparent) 20%,
                  transparent 38%,
                  transparent 55%,
                  color-mix(in oklch, var(--background) 35%, transparent) 68%,
                  color-mix(in oklch, var(--background) 65%, transparent) 80%,
                  var(--background) 92%
                )`,
                /* vertical: top fade → clear → bottom fade */
                `linear-gradient(180deg,
                  color-mix(in oklch, var(--background) 70%, transparent) 0%,
                  color-mix(in oklch, var(--background) 15%, transparent) 12%,
                  transparent 28%,
                  transparent 72%,
                  color-mix(in oklch, var(--background) 25%, transparent) 88%,
                  color-mix(in oklch, var(--background) 80%, transparent) 100%
                )`,
              ].join(', '),
            }}
            aria-hidden
          />
        </div>
      </div>

      {/* Content column */}
      <div className="flex flex-col gap-8 md:ml-[44%] flex-1 max-w-[480px] px-6 md:px-10 py-8">
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-100">Dashboard</h1>

        <div className="flex gap-2">
          <Link
            href="/dashboard/blocks/new"
            className="rounded-[0.625rem] bg-zinc-100 px-[14px] py-[7px] text-[13px] font-medium text-zinc-900 hover:opacity-85 transition-opacity"
          >
            Crear bloque
          </Link>
          <Link
            href="/dashboard/workouts/new"
            className="rounded-[0.625rem] border border-white/[0.18] px-[14px] py-[7px] text-[13px] font-medium text-zinc-100 hover:bg-zinc-800 hover:border-white/[0.28] transition-all duration-150"
          >
            Crear entreno
          </Link>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Bloques</h2>
          {blocks.length === 0 ? (
            <p className="text-zinc-500 text-[13px]">No hay bloques aún.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {blocks.map((block) => (
                <li key={block.id}>
                  <Link
                    href={`/dashboard/blocks/${block.id}`}
                    className="flex items-center justify-between rounded-[0.625rem] border border-white/10 px-4 py-3 hover:border-white/[0.22] hover:bg-zinc-800/80 transition-all duration-150 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-[13px] text-zinc-100">{block.name}</p>
                      {block.notes && <p className="text-xs text-zinc-400 mt-0.5">{block.notes}</p>}
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0 ml-4">
                      {block.weeks.length} {block.weeks.length === 1 ? 'semana' : 'semanas'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Entrenos sueltos</h2>
          {standaloneWorkouts.length === 0 ? (
            <p className="text-zinc-500 text-[13px]">No hay entrenos sueltos aún.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {standaloneWorkouts.map((workout) => (
                <li key={workout.id}>
                  <Link
                    href={`/dashboard/workouts/${workout.id}`}
                    className="flex items-center justify-between rounded-[0.625rem] border border-white/10 px-4 py-3 hover:border-white/[0.22] hover:bg-zinc-800/80 transition-all duration-150 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-[13px] text-zinc-100">{workout.name ?? 'Entreno sin nombre'}</p>
                      {workout.notes && <p className="text-xs text-zinc-400 mt-0.5">{workout.notes}</p>}
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0 ml-4">
                      {new Date(workout.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
