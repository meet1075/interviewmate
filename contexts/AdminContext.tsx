"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// --- Interfaces ---
export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  status: 'active' | 'suspended' | 'inactive'
  joinDate: Date
  lastActive: Date
  sessionsCompleted: number
  averageScore: number
  totalPoints: number
  badges: string[]
  practiceHistory: PracticeHistory[]
  mockInterviewStats: MockStats[]
}

export interface PracticeHistory {
  id: string
  domain: string
  difficulty: string
  questionsAnswered: number
  completedAt: Date
  bookmarked: number
}

export interface MockStats {
  id: string
  domain: string
  difficulty: string
  rating: number
  pointsEarned: number
  completedAt: Date
}

export interface DomainData {
  name: string
  totalQuestions: number
  questionsGenerated: number
  totalSessions: number
  averageRating: number
  createdAt: Date
  popularityRank: number
}

interface AdminContextType {
  users: AdminUser[]
  domains: DomainData[]
  getTodayStats: () => {
    newRegistrations: number
    activeUsers: number
    questionsPracticed: number
    mockInterviews: number
  }
  getLeaderboard: (domain?: string) => Array<{
    userId: string
    name: string
    points: number
    badge: string
    rank: number
  }>
  searchUsers: (query: string) => AdminUser[]
  getUserById: (id: string) => AdminUser | undefined
  updateUserStatus: (id: string, status: 'active' | 'suspended' | 'inactive') => void
}

// --- Context Definition ---
const AdminContext = createContext<AdminContextType | undefined>(undefined)

// --- Mock Data Generation ---
const generateMockUsers = (): AdminUser[] => {
  const names = [
    'John Doe', 'Sarah Smith', 'Michael Johnson', 'Emily Davis', 'David Wilson',
    'Jessica Brown', 'Chris Lee', 'Amanda Taylor', 'Ryan Martinez', 'Lisa Anderson',
  ]
  
  const domains = ['Frontend Development', 'Backend Development', 'System Design']
  const difficulties = ['Beginner', 'Intermediate', 'Advanced']
  
  return names.map((name, index) => {
    const id = `user_${index + 1}`
    const email = `${name.toLowerCase().replace(' ', '.')}@example.com`
    const joinDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    const lastActive = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    const sessionsCompleted = Math.floor(Math.random() * 50) + 1
    const averageScore = Math.floor(Math.random() * 4) + 6
    const totalPoints = sessionsCompleted * averageScore * 10
    
    const practiceHistory: PracticeHistory[] = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
      id: `practice_${id}_${i}`,
      domain: domains[Math.floor(Math.random() * domains.length)],
      difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
      questionsAnswered: Math.floor(Math.random() * 10) + 1,
      completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      bookmarked: Math.floor(Math.random() * 3)
    }));
    
    const mockInterviewStats: MockStats[] = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => {
      const rating = (Math.random() * 4) + 6
      return {
        id: `mock_${id}_${i}`,
        domain: domains[Math.floor(Math.random() * domains.length)],
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
        rating: Math.round(rating * 10) / 10,
        pointsEarned: Math.round(rating * 10),
        completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    const badges: string[] = []
    if (totalPoints > 1000) badges.push('Expert')
    if (sessionsCompleted > 20) badges.push('Dedicated')
    
    return {
      id, name, email,
      role: index === 0 ? 'admin' : 'user',
      status: Math.random() > 0.1 ? 'active' : Math.random() > 0.5 ? 'inactive' : 'suspended',
      joinDate, lastActive, sessionsCompleted, averageScore, totalPoints, badges,
      practiceHistory, mockInterviewStats
    }
  })
}

const generateDomainData = (): DomainData[] => ([
    { name: 'Frontend Development', totalQuestions: 150, questionsGenerated: 2341, totalSessions: 456, averageRating: 7.8, createdAt: new Date('2023-01-15'), popularityRank: 1 },
    { name: 'Backend Development',  totalQuestions: 120, questionsGenerated: 1876, totalSessions: 387, averageRating: 7.5, createdAt: new Date('2023-01-20'), popularityRank: 2 },
    { name: 'System Design', totalQuestions: 80, questionsGenerated: 945, totalSessions: 234, averageRating: 8.1, createdAt: new Date('2023-02-01'), popularityRank: 3 }
]);

// --- Provider Component ---
export function AdminProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [domains] = useState<DomainData[]>(generateDomainData())

  useEffect(() => {
    try {
        const saved = localStorage.getItem('admin-users')
        if (saved) {
            const parsed = JSON.parse(saved)
            setUsers(parsed.map((u: any) => ({
            ...u,
            joinDate: new Date(u.joinDate),
            lastActive: new Date(u.lastActive),
            practiceHistory: u.practiceHistory.map((p: any) => ({ ...p, completedAt: new Date(p.completedAt) })),
            mockInterviewStats: u.mockInterviewStats.map((m: any) => ({ ...m, completedAt: new Date(m.completedAt) }))
            })))
        } else {
            const mockUsers = generateMockUsers()
            setUsers(mockUsers)
        }
    } catch (error) {
        console.error("Failed to parse admin users from localStorage", error);
        setUsers(generateMockUsers());
    }
  }, [])

  useEffect(() => {
    if (users.length > 0) {
        localStorage.setItem('admin-users', JSON.stringify(users))
    }
  }, [users])

  const getTodayStats = () => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    return {
      newRegistrations: users.filter(u => u.joinDate >= todayStart).length,
      activeUsers: users.filter(u => u.lastActive >= todayStart).length,
      questionsPracticed: users.reduce((total, u) => 
        total + u.practiceHistory.filter(p => p.completedAt >= todayStart)
          .reduce((sum, p) => sum + p.questionsAnswered, 0), 0
      ),
      mockInterviews: users.reduce((total, u) =>
        total + u.mockInterviewStats.filter(m => m.completedAt >= todayStart).length, 0
      )
    }
  }

  const getLeaderboard = (domain?: string) => {
    return users
      .map(user => {
        const points = domain 
          ? user.mockInterviewStats
              .filter(s => s.domain === domain)
              .reduce((sum, s) => sum + s.pointsEarned, 0)
          : user.totalPoints
        
        let badge = 'Beginner'
        if (points > 1000) badge = 'Expert'
        else if (points > 500) badge = 'Advanced'
        
        return { userId: user.id, name: user.name, points, badge, rank: 0 }
      })
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({ ...user, rank: index + 1 }))
  }

  const searchUsers = (query: string): AdminUser[] => {
    if (!query) return users
    const lowercaseQuery = query.toLowerCase()
    return users.filter(user => 
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
    )
  }

  const getUserById = (id: string): AdminUser | undefined => {
    return users.find(user => user.id === id)
  }

  const updateUserStatus = (id: string, status: 'active' | 'suspended' | 'inactive') => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, status } : user
    ))
  }

  const value = { users, domains, getTodayStats, getLeaderboard, searchUsers, getUserById, updateUserStatus };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

// --- Custom Hook ---
export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}

