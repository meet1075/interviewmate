"use client" // This directive marks the component for client-side rendering

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// --- Interfaces ---
export interface Question {
  id: string
  title: string
  domain: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  description: string
  hints: string[]
  answer?: string
  bookmarked?: boolean
}

export interface PracticeSession {
  id: string
  domain: string
  difficulty: string
  questions: Question[]
  currentQuestionIndex: number
  startTime: string // Using ISO string for easier JSON serialization
  completedQuestions: number
  totalQuestions: number
}

interface PracticeContextType {
  sessions: PracticeSession[]
  bookmarks: Question[]
  createSession: (domain: string, difficulty: string) => Promise<PracticeSession>
  addBookmark: (question: Question) => void
  removeBookmark: (questionId: string) => void
  isBookmarked: (questionId: string) => boolean
}

// --- Context Definition ---
const PracticeContext = createContext<PracticeContextType | undefined>(undefined)

// --- Mock Question Generator ---
const generateQuestions = (domain: string, difficulty: string): Question[] => {
  const questionBank = {
    'Frontend Development': {
      'Beginner': [
        {
          title: 'What is HTML and how does it work?',
          description: 'Explain the basic concepts of HTML and its role in web development.',
          hints: ['Think about structure', 'Consider markup language', 'HTML stands for HyperText Markup Language']
        },
        {
          title: 'What is CSS and how does it style web pages?',
          description: 'Describe CSS and how it is used to style HTML elements.',
          hints: ['Cascading Style Sheets', 'Separation of concerns', 'Selectors and properties']
        }
      ],
      'Intermediate': [
        {
          title: 'What is the difference between React hooks and class components?',
          description: 'Explain the key differences between React hooks and class components, including their advantages.',
          hints: ['Consider lifecycle methods vs hooks', 'Think about state management differences', 'Performance implications']
        },
        {
          title: 'Explain event delegation in JavaScript',
          description: 'Describe what event delegation is and why it is useful in JavaScript.',
          hints: ['Event bubbling', 'Performance benefits', 'Dynamic content handling']
        }
      ],
      'Advanced': [
        {
          title: 'How would you optimize a React application for performance?',
          description: 'Discuss various techniques and strategies for optimizing React app performance.',
          hints: ['Code splitting', 'Memoization', 'Bundle optimization', 'Lazy loading']
        }
      ]
    },
    'Backend Development': {
      'Beginner': [
        {
          title: 'What is an API and how does it work?',
          description: 'Explain what APIs are and their role in modern web development.',
          hints: ['Application Programming Interface', 'Communication between systems', 'REST vs GraphQL']
        }
      ],
      'Intermediate': [
        {
          title: 'Explain database indexing and its types',
          description: 'Describe database indexing, different types, and when to use each.',
          hints: ['Performance optimization', 'B-tree indexes', 'Clustered vs non-clustered']
        }
      ],
      'Advanced': [
        {
          title: 'How would you handle authentication in a microservices architecture?',
          description: 'Discuss authentication strategies for distributed systems.',
          hints: ['JWT tokens', 'OAuth 2.0', 'Service-to-service authentication', 'API gateways']
        }
      ]
    },
    'System Design': {
      'Intermediate': [
        {
          title: 'Design a URL shortening service like bit.ly',
          description: 'Design the architecture for a URL shortening service handling millions of requests.',
          hints: ['Database design', 'Caching strategies', 'Load balancing', 'Analytics']
        }
      ],
      'Advanced': [
        {
          title: 'Design a chat application like WhatsApp',
          description: 'Design a scalable real-time chat application with billions of users.',
          hints: ['WebSocket connections', 'Message queues', 'Database sharding', 'Push notifications']
        }
      ]
    }
  }

  const domainQuestions = questionBank[domain as keyof typeof questionBank]
  if (!domainQuestions) return []
  
  const difficultyQuestions = domainQuestions[difficulty as keyof typeof domainQuestions] || []
  if (difficultyQuestions.length === 0) return [];
  
  // Generate 10 questions by repeating and modifying if needed
  const questions: Question[] = []
  for (let i = 0; i < 10; i++) {
    const baseQuestion = difficultyQuestions[i % difficultyQuestions.length]
    if (baseQuestion) {
      questions.push({
        id: `${domain.replace(/\s/g, '')}-${difficulty}-${i + 1}`,
        title: baseQuestion.title,
        domain,
        difficulty: difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
        description: baseQuestion.description,
        hints: baseQuestion.hints
      })
    }
  }
  
  return questions
}

// --- Provider Component ---
export function PracticeProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [bookmarks, setBookmarks] = useState<Question[]>([])

  useEffect(() => {
    // Load from localStorage on initial client-side render
    try {
        const savedSessions = localStorage.getItem('practice-sessions')
        const savedBookmarks = localStorage.getItem('bookmarks')
        
        if (savedSessions) {
          setSessions(JSON.parse(savedSessions))
        }
        
        if (savedBookmarks) {
          setBookmarks(JSON.parse(savedBookmarks))
        }
    } catch (error) {
        console.error("Failed to parse from localStorage", error);
    }
  }, [])

  useEffect(() => {
    // Save sessions to localStorage whenever they change
    if (sessions.length > 0) {
        localStorage.setItem('practice-sessions', JSON.stringify(sessions))
    }
  }, [sessions])

  useEffect(() => {
    // Save bookmarks to localStorage whenever they change
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks))
  }, [bookmarks])

  const createSession = async (domain: string, difficulty: string): Promise<PracticeSession> => {
    const questions = generateQuestions(domain, difficulty)
    
    const newSession: PracticeSession = {
      id: `session-${Date.now()}`,
      domain,
      difficulty,
      questions,
      currentQuestionIndex: 0,
      startTime: new Date().toISOString(),
      completedQuestions: 0,
      totalQuestions: questions.length
    }
    
    setSessions(prev => [...prev, newSession])
    return newSession
  }

  const addBookmark = (question: Question) => {
    setBookmarks(prev => {
      if (prev.find(q => q.id === question.id)) return prev
      return [...prev, { ...question, bookmarked: true }]
    })
  }

  const removeBookmark = (questionId: string) => {
    setBookmarks(prev => prev.filter(q => q.id !== questionId))
  }

  const isBookmarked = (questionId: string) => {
    return bookmarks.some(q => q.id === questionId)
  }

  return (
    <PracticeContext.Provider value={{
      sessions,
      bookmarks,
      createSession,
      addBookmark,
      removeBookmark,
      isBookmarked
    }}>
      {children}
    </PracticeContext.Provider>
  )
}

// --- Custom Hook ---
export function usePractice() {
  const context = useContext(PracticeContext)
  if (context === undefined) {
    throw new Error('usePractice must be used within a PracticeProvider')
  }
  return context
}

