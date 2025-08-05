import type { Metadata } from "next"
import DashboardPage from "./DashboardPage"

export const metadata: Metadata = {
  title: "DocSign - Dashboard",
  description: "Manage your documents and signatures",
}

export default function Dashboard() {
  return <DashboardPage />
}

