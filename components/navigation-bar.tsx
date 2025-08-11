import Link from "next/link"
import { FileSignature, User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import LanguageSelector from "@/components/language-selector"
import { cn } from "@/lib/utils"
import { ScrollEffectWrapper } from "./navigation-bar-client"
import { SignOutButton } from "./navigation-bar-client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface NavigationBarProps {
  className?: string
  user?: SupabaseUser | null
}

export function NavigationBar({ className, user }: NavigationBarProps) {

  const getUserDisplayName = () => {
    if (!user) return "User"
    return (
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User"
    )
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <ScrollEffectWrapper className={className}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <FileSignature className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">슥슥</span>
          </Link>

          {/* Right side navigation */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageSelector />
            
            {user ? (
              /* Logged in - Show user avatar and dropdown */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={getUserDisplayName()}
                      />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      <span>프로필</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>설정</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <SignOutButton>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                  </SignOutButton>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Not logged in - Show login button */
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90">
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </ScrollEffectWrapper>
  )
}