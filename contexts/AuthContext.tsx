"use client" // Add this directive for client-side components in Next.js

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// --- Demo User Data ---
const DEMO_USERS = [
  {
    id: '1',
    email: 'user@demo.com',
    password: 'demo123',
    name: 'John Doe',
    role: 'user' as const
  },
  {
    id: '2', 
    email: 'admin@demo.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin' as const
  }
]

// --- Type Definitions ---
interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

// --- Auth Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// --- Auth Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // This useEffect runs only on the client, after the initial render.
  // This is safe for accessing localStorage.
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('demo-user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error)
      // If parsing fails, ensure we remove the corrupted item
      localStorage.removeItem('demo-user')
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const demoUser = DEMO_USERS.find(
      u => u.email === email && u.password === password
    )
    
    if (demoUser) {
      const { password: _, ...userWithoutPassword } = demoUser
      setUser(userWithoutPassword)
      localStorage.setItem('demo-user', JSON.stringify(userWithoutPassword))
      return true
    }
    
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('demo-user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// --- Custom Hook for using Auth Context ---
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
