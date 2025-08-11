"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ScrollEffectWrapperProps {
  children: React.ReactNode
  className?: string
}

export function ScrollEffectWrapper({ children, className }: ScrollEffectWrapperProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled ? "bg-background/80 backdrop-blur-md border-b" : "bg-transparent",
        className
      )}
    >
      {children}
    </header>
  )
}

interface SignOutButtonProps {
  children: React.ReactNode
}

export function SignOutButton({ children }: SignOutButtonProps) {
  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      // Redirect to home after sign out
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      {children}
    </DropdownMenuItem>
  )
}