"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// --- Interfaces ---
export interface MockAnswer {
  questionId: string
  answer: string
  rating: number // 1-10
  feedback: string
  timeSpent: number // in seconds
}

export interface MockQuestion {
  id: string
  title: string
  domain: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  description: string
  timeLimit: number // in minutes
}

export interface MockSession {
  id: string
  userId: string
  domain: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  questions: MockQuestion[]
  answers: MockAnswer[]
  startTime: string // Use ISO string for serialization
  endTime?: string
  overallRating: number
  overallFeedback: string
  pointsEarned: number
  status: 'active' | 'completed'
}

interface MockInterviewContextType {
  sessions: MockSession[]
  createMockSession: (userId: string, domain: string, difficulty: string) => Promise<MockSession>
  submitAnswer: (sessionId: string, questionId: string, answer: string, timeSpent: number) => MockAnswer
  completeMockSession: (sessionId: string) => MockSession | undefined
  getUserSessions: (userId: string) => MockSession[]
  getTotalPoints: (userId: string) => number
  getUserRank: (userId: string, domain?: string) => number
}

// --- Context Definition ---
const MockInterviewContext = createContext<MockInterviewContextType | undefined>(undefined)

// --- Mock Data and Logic ---
const mockQuestions = {
  'Frontend Development': {
    'Beginner': [
      { title: 'What is the DOM and how do you manipulate it?', description: 'Explain DOM concepts and basic manipulation techniques.', timeLimit: 8 },
      { title: 'What are the differences between var, let, and const?', description: 'Explain variable declarations in JavaScript.', timeLimit: 6 },
      { title: 'What is event bubbling and capturing?', description: 'Explain how events propagate in the DOM.', timeLimit: 7 },
      { title: 'What is the difference between == and === in JavaScript?', description: 'Explain equality operators in JavaScript.', timeLimit: 5 },
      { title: 'How do you handle asynchronous operations in JavaScript?', description: 'Explain promises, async/await, and callbacks.', timeLimit: 10 }
    ],
    'Intermediate': [
      { title: 'Explain React component lifecycle methods', description: 'Describe the lifecycle methods and when to use them.', timeLimit: 12 },
      { title: 'What is closure in JavaScript and provide an example', description: 'Explain closures with practical examples.', timeLimit: 10 },
      { title: 'How would you optimize a React application performance?', description: 'Discuss various React optimization techniques.', timeLimit: 15 },
      { title: 'Explain the concept of hoisting in JavaScript', description: 'Describe how hoisting works with examples.', timeLimit: 8 },
      { title: 'What is the Virtual DOM and how does it work?', description: 'Explain Virtual DOM concept and its benefits.', timeLimit: 12 }
    ],
    'Advanced': [
      { title: 'Design a scalable frontend architecture for a large application', description: 'Discuss architecture patterns, state management, and scalability.', timeLimit: 20 },
      { title: 'Implement a custom React hook for data fetching with caching', description: 'Code a reusable hook with advanced features.', timeLimit: 25 },
      { title: 'Explain microfrontends architecture and its pros/cons', description: 'Discuss microfrontends approach and trade-offs.', timeLimit: 18 },
      { title: 'How would you implement server-side rendering for SEO?', description: 'Explain SSR concepts and implementation strategies.', timeLimit: 15 },
      { title: 'Design a real-time collaborative editor like Google Docs', description: 'Discuss real-time synchronization and conflict resolution.', timeLimit: 30 }
    ]
  },
  'Backend Development': {
    'Beginner': [
      { title: 'What is REST API and its principles?', description: 'Explain REST architecture and design principles.', timeLimit: 10 },
      { title: 'Explain different HTTP status codes', description: 'Describe common HTTP status codes and their meanings.', timeLimit: 8 },
      { title: 'What is the difference between SQL and NoSQL databases?', description: 'Compare relational and non-relational databases.', timeLimit: 12 },
      { title: 'What is authentication vs authorization?', description: 'Explain the difference with examples.', timeLimit: 8 },
      { title: 'How do you handle errors in APIs?', description: 'Discuss error handling strategies and best practices.', timeLimit: 10 }
    ],
    'Intermediate': [
      { title: 'Explain database indexing and its types', description: 'Discuss indexing strategies and performance implications.', timeLimit: 15 },
      { title: 'How would you design a caching strategy?', description: 'Explain different caching layers and strategies.', timeLimit: 18 },
      { title: 'What is middleware and how do you use it?', description: 'Explain middleware concept with examples.', timeLimit: 12 },
      { title: 'How do you handle concurrent requests safely?', description: 'Discuss concurrency, locks, and race conditions.', timeLimit: 20 },
      { title: 'Explain microservices vs monolithic architecture', description: 'Compare architectures with pros and cons.', timeLimit: 15 }
    ],
    'Advanced': [
      { title: 'Design a distributed system for handling millions of users', description: 'Discuss scalability, load balancing, and system design.', timeLimit: 30 },
      { title: 'How would you implement eventual consistency?', description: 'Explain distributed systems consistency patterns.', timeLimit: 25 },
      { title: 'Design a real-time notification system', description: 'Discuss architecture for scalable real-time notifications.', timeLimit: 25 },
      { title: 'Implement a rate limiting system', description: 'Design rate limiting with different algorithms.', timeLimit: 20 },
      { title: 'How would you handle database migrations at scale?', description: 'Discuss zero-downtime migration strategies.', timeLimit: 18 }
    ]
  },
  'System Design': {
    'Intermediate': [
      { title: 'Design a URL shortening service like bit.ly', description: 'Design the complete architecture with scale considerations.', timeLimit: 25 },
      { title: 'Design a social media feed system', description: 'Discuss news feed generation and optimization.', timeLimit: 30 },
      { title: 'Design a chat application like WhatsApp', description: 'Cover real-time messaging and scalability.', timeLimit: 35 },
      { title: 'Design a video streaming service like YouTube', description: 'Discuss video storage, processing, and delivery.', timeLimit: 40 },
      { title: 'Design a ride-sharing system like Uber', description: 'Cover matching algorithms and real-time tracking.', timeLimit: 35 }
    ],
    'Advanced': [
      { title: 'Design a global content delivery network', description: 'Discuss CDN architecture and optimization strategies.', timeLimit: 45 },
      { title: 'Design a distributed search engine', description: 'Cover indexing, ranking, and distributed architecture.', timeLimit: 50 },
      { title: 'Design a payment processing system', description: 'Discuss security, consistency, and reliability.', timeLimit: 40 },
      { title: 'Design a real-time analytics platform', description: 'Cover data ingestion, processing, and visualization.', timeLimit: 45 },
      { title: 'Design a multi-tenant SaaS platform', description: 'Discuss isolation, scaling, and resource management.', timeLimit: 40 }
    ]
  }
}

const generateRating = (answer: string, difficulty: string): { rating: number; feedback: string } => {
  const answerLength = answer.length
  const hasKeywords = /\b(design|architecture|scalability|performance|security|database|API|system)\b/i.test(answer)
  const hasExamples = /\b(example|for instance|such as|like)\b/i.test(answer)
  
  let baseRating = 5
  if (answerLength > 500) baseRating += 1
  if (answerLength > 1000) baseRating += 1
  if (answerLength < 100) baseRating -= 2
  if (hasKeywords) baseRating += 1
  if (hasExamples) baseRating += 1
  if (difficulty === 'Advanced' && answerLength > 800) baseRating += 1
  
  const rating = Math.min(10, Math.max(1, Math.round(baseRating)))
  
  const feedbacks: { [key: number]: string } = {
    1: "Answer lacks depth and technical understanding.",
    2: "Basic understanding shown but needs significant improvement.",
    3: "Shows some understanding but missing key concepts.",
    4: "Adequate answer but could benefit from more depth.",
    5: "Good basic understanding demonstrated.",
    6: "Solid answer with good technical concepts.",
    7: "Strong technical answer with good examples.",
    8: "Excellent answer with comprehensive coverage.",
    9: "Outstanding technical depth with excellent examples.",
    10: "Exceptional answer demonstrating expert-level understanding."
  }
  
  return { rating, feedback: feedbacks[rating] }
}

// --- Provider Component ---
export function MockInterviewProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<MockSession[]>([])

  useEffect(() => {
    // Load from localStorage only on the client side
    try {
        const saved = localStorage.getItem('mock-sessions')
        if (saved) {
            setSessions(JSON.parse(saved))
        }
    } catch (error) {
        console.error("Failed to load mock sessions from localStorage", error);
    }
  }, [])

  useEffect(() => {
    // Persist to localStorage whenever sessions change
    if(sessions.length > 0){
        localStorage.setItem('mock-sessions', JSON.stringify(sessions))
    }
  }, [sessions])

  const generateQuestions = (domain: string, difficulty: string): MockQuestion[] => {
    const domainQuestions = mockQuestions[domain as keyof typeof mockQuestions]
    if (!domainQuestions) return []
    
    const difficultyQuestions = domainQuestions[difficulty as keyof typeof domainQuestions] || []
    
    const shuffled = [...difficultyQuestions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 5).map((q, index) => ({
      id: `${domain.replace(/\s/g, '')}-${difficulty}-${index + 1}`,
      ...q,
      domain,
      difficulty: difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
    }))
  }

  const createMockSession = async (userId: string, domain: string, difficulty: string): Promise<MockSession> => {
    const questions = generateQuestions(domain, difficulty)
    
    const newSession: MockSession = {
      id: `mock-${Date.now()}`,
      userId,
      domain,
      difficulty: difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
      questions,
      answers: [],
      startTime: new Date().toISOString(),
      overallRating: 0,
      overallFeedback: '',
      pointsEarned: 0,
      status: 'active'
    }
    
    setSessions(prev => [...prev, newSession])
    return newSession
  }

  const submitAnswer = (sessionId: string, questionId: string, answer: string, timeSpent: number): MockAnswer => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) throw new Error('Session not found')
    
    const { rating, feedback } = generateRating(answer, session.difficulty)
    
    const mockAnswer: MockAnswer = { questionId, answer, rating, feedback, timeSpent }
    
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, answers: [...s.answers, mockAnswer] }
        : s
    ))
    
    return mockAnswer
  }

  const completeMockSession = (sessionId: string): MockSession | undefined => {
    let completedSession : MockSession | undefined = undefined;
    
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const averageRating = s.answers.reduce((sum, a) => sum + a.rating, 0) / (s.answers.length || 1);
        const pointsEarned = Math.round(averageRating * 10)
        
        let overallFeedback = 'Review your answers to see areas for improvement.'
        if (averageRating >= 8) overallFeedback = 'Excellent performance! You demonstrated strong technical knowledge.'
        else if (averageRating >= 6) overallFeedback = 'Good performance overall. Focus on providing more detailed examples.'
        
        completedSession = {
          ...s,
          endTime: new Date().toISOString(),
          overallRating: parseFloat(averageRating.toFixed(1)),
          overallFeedback,
          pointsEarned,
          status: 'completed' as const
        }
        return completedSession;
      }
      return s;
    }));
    
    return completedSession;
  }

  const getUserSessions = (userId: string): MockSession[] => {
    return sessions.filter(s => s.userId === userId)
  }

  const getTotalPoints = (userId: string): number => {
    return sessions
      .filter(s => s.userId === userId && s.status === 'completed')
      .reduce((total, s) => total + s.pointsEarned, 0)
  }

  const getUserRank = (userId: string, domain?: string): number => {
    const allUsers = [...new Set(sessions.map(s => s.userId))]
    
    const userPointsMap = allUsers.map(uid => ({
      userId: uid,
      points: sessions
        .filter(s => s.userId === uid && s.status === 'completed' && (!domain || s.domain === domain))
        .reduce((total, s) => total + s.pointsEarned, 0)
    })).sort((a, b) => b.points - a.points)
    
    const rank = userPointsMap.findIndex(u => u.userId === userId) + 1
    return rank > 0 ? rank : allUsers.length;
  }

  return (
    <MockInterviewContext.Provider value={{
      sessions,
      createMockSession,
      submitAnswer,
      completeMockSession,
      getUserSessions,
      getTotalPoints,
      getUserRank
    }}>
      {children}
    </MockInterviewContext.Provider>
  )
}

// --- Custom Hook ---
export function useMockInterview() {
  const context = useContext(MockInterviewContext)
  if (context === undefined) {
    throw new Error('useMockInterview must be used within a MockInterviewProvider')
  }
  return context
}

