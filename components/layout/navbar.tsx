"use client"

import { useState } from "react"
import Link from "next/link" // Changed from react-router-dom
import { usePathname } from "next/navigation" // Changed from useLocation
import { useAuth } from "@/contexts/AuthContext" // Assuming you have this context
import { 
  BookOpen, 
  Home, 
  BarChart3, 
  Bookmark, 
  Settings, 
  Moon, 
  Sun, 
  Users, 
  Database,
  ClipboardList,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes" // Standard theme provider for Next.js
import { cn } from "@/lib/utils"

// --- Data for Navigation ---
const userNavItems = [
  { title: "Home", href: "/", icon: Home },
  { title: "Practice", href: "/practice", icon: BookOpen },
  { title: "Mock Interview", href: "/mock-interview", icon: ClipboardList },
  { title: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { title: "Bookmarks", href: "/bookmarks", icon: Bookmark },
]

const adminNavItems = [
  { title: "Admin Dashboard", href: "/admin", icon: BarChart3 },
  { title: "Manage Users", href: "/admin/users", icon: Users },
  { title: "Manage Domains", href: "/admin/domains", icon: Database },
  { title: "Manage Questions", href: "/admin/questions", icon: ClipboardList },
  { title: "Performance Insights", href: "/admin/insights", icon: BarChart3 },
]

// --- Navbar Component ---
export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const pathname = usePathname() // Next.js hook for the current path

  const navItems = user?.role === "admin" ? adminNavItems : userNavItems
  const isAuthPage = pathname === "/login" || pathname === "/register"

  // Helper function to determine if a nav link is active
  const isActive = (href: string) => {
    if (href === "/") return pathname === href
    return pathname.startsWith(href)
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 text-transparent bg-clip-text">InterviewMate</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1 flex-1">
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

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-2 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 p-0"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {!isAuthPage && !user && (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          {user && (
            <div className="flex items-center space-x-2 pl-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-sm">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center ml-auto space-x-2">
          <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0"
              aria-label="Toggle theme"
          >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-9 w-9 p-0"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
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
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              )
            })}

            <div className="border-t border-border mt-4 pt-4">
              {!isAuthPage && !user && (
                <div className="flex items-center space-x-2">
                  <Link href="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full">Sign up</Button>
                  </Link>
                </div>
              )}
              
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    logout()
                    setIsMobileMenuOpen(false)
                  }}>
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
