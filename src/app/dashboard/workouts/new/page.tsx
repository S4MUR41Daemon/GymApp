import Link from 'next/link'
import NewWorkoutClient from './NewWorkoutClient'

export default function NewWorkoutPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 max-w-[520px] p-7">
      <Link href="/dashboard" className="text-[12px] text-zinc-400 hover:text-zinc-100 transition-colors">
        ← Dashboard
      </Link>
      <h1 className="text-[22px] font-semibold tracking-tight text-zinc-100">Nuevo entreno</h1>
      <NewWorkoutClient />
    </main>
  )
}
