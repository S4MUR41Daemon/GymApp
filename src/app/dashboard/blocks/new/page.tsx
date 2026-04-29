import { createBlock } from '../../actions'
import { SLButton, SLInput, SLPageHeader, SLTextarea } from '@/components/ui-sl'

export default function NewBlockPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SLPageHeader backHref="/dashboard/blocks" title="Nuevo bloque" />

      <form action={createBlock} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SLInput
          id="name"
          name="name"
          type="text"
          required
          label="Nombre"
          placeholder="Ej. Bloque fuerza octubre"
        />

        <SLTextarea
          id="notes"
          name="notes"
          rows={3}
          label="Notas (opcional)"
          placeholder="Objetivos, notas del bloque..."
        />

        <SLButton type="submit" variant="primary" style={{ alignSelf: 'flex-start' }}>
          Crear bloque
        </SLButton>
      </form>
    </div>
  )
}
