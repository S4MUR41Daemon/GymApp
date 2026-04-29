import NewWorkoutClient from './NewWorkoutClient'
import { SLPageHeader } from '@/components/ui-sl'

export default function NewWorkoutPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SLPageHeader backHref="/dashboard" backLabel="< DASHBOARD" title="Nuevo entreno" />
      <NewWorkoutClient />
    </div>
  )
}
