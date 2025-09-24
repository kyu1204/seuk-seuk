"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 w-[85px]" />
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5" onClick={toggleTheme}>
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:text-xs">{t("theme.light")}</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:text-xs">{t("theme.dark")}</span>
        </>
      )}
    </Button>
  )
}

