"use client"

import { useState } from "react"
// Use Next.js Link and navigation hooks
import Link from "next/link"
import { usePathname } from "next/navigation"
// Use the real Clerk hooks and components
import { useUser, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { 
  BookOpen, 
  Home, 
  BarChart3, 
  Bookmark, 
  Users, 
  Database,
  ClipboardList,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

// --- Navigation Data ---
const userNavItems = [
  { title: "Home", href: "/", icon: Home },
  { title: "Practice", href: "/user/practice", icon: BookOpen },
  { title: "Mock Interview", href: "/user/mockinterview", icon: ClipboardList },
  { title: "Dashboard", href: "/user/dashboard", icon: BarChart3 },
  { title: "Bookmarks", href: "/user/bookmarks", icon: Bookmark },
]

const adminNavItems = [
  { title: "Dashboard", href: "/admin", icon: BarChart3 },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Domains", href: "/admin/domains", icon: Database },
  { title: "Questions", href: "/admin/questions", icon: ClipboardList },
]

// --- Navbar Component ---
export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user } = useUser() // Using the real hook
  const pathname = usePathname()

  // Clerk stores custom roles in publicMetadata
  const isAdmin = user?.publicMetadata?.role === 'admin'
  const navItems = isAdmin ? adminNavItems : userNavItems

  const isActive = (href: string) => {
    if (href === "/") return pathname === href
    return pathname.startsWith(href)
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60  px-10">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-orange-300">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 text-transparent bg-clip-text">InterviewMate</span>
        </Link>

        {/* Desktop Navigation */}
        {/* <SignedIn> */}
          <div className="hidden md:flex items-center space-x-1 flex-1 px-58">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </div>
        {/* </SignedIn> */}

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4 ml-auto">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <SignedOut>
            <div className="flex items-center space-x-2">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center ml-auto space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <SignedIn>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SignedIn>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        // <SignedIn>
          <div className="md:hidden border-t">
            <div className="container py-4 space-y-2">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                      "flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors",
                      isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        // </SignedIn>
      )}
    </nav>
  )
}

