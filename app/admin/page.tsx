import { AdminPanel } from "@/components/admin-panel"

// Prevent static generation for protected admin page
export const dynamic = "force-dynamic"

export default function AdminPage() {
  return <AdminPanel />
}
