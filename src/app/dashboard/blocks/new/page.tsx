import { createBlock } from '../../actions'
import Link from 'next/link'

export default function NewBlockPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-8 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-zinc-400 hover:text-zinc-200 text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-semibold text-zinc-100">Nuevo bloque</h1>
      </div>

      <form action={createBlock} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300" htmlFor="name">Nombre</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ej. Bloque fuerza octubre"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300" htmlFor="notes">Notas (opcional)</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Objetivos, notas del bloque..."
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors self-start"
        >
          Crear bloque
        </button>
      </form>
    </main>
  )
}
