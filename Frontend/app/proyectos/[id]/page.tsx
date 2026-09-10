import AppShell from '../../../components/layout/AppShell'
import IniciativaDetail from './IniciativaDetail'

export default function IniciativaPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <IniciativaDetail id={params.id} />
    </AppShell>
  )
}
