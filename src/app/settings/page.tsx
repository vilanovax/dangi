import SettingsPageClient from './SettingsPageClient'

// Disable static generation for this page since it uses client-side context
export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return <SettingsPageClient />
}
