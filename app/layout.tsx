import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/contexts/language-context"
import { NavigationBar } from "@/components/navigation-bar"
import { createClient } from "@/lib/supabase/server"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Seuk - Online Document Signing",
  description: "Upload, sign, and share documents online with ease",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Server-side user check
  let user = null
  try {
    const supabase = await createClient()
    const { data: { user: currentUser }, error } = await supabase.auth.getUser()
    if (!error && currentUser) {
      user = currentUser
    }
  } catch (error) {
    console.error("Error fetching user on server:", error)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <LanguageProvider>
            <NavigationBar user={user} />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

