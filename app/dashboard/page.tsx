import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardPage from "./DashboardPage"

export const metadata: Metadata = {
  title: "DocSign - Dashboard",
  description: "Manage your documents and signatures",
}

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login?redirect=/dashboard')
  }

  return <DashboardPage user={user} />
}

