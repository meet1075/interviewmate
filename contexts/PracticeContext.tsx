"use client" // This directive marks the component for client-side rendering

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useToast } from "@/components/ui/use-toast"

// --- Interfaces ---
export interface Question {
  id: string
  title: string
  domain: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  description: string
  hints: string[]
  answer: string
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
  addBookmark: (question: Question) => Promise<void>
  removeBookmark: (questionId: string) => Promise<void>
  isBookmarked: (questionId: string) => boolean
  loadBookmarks: () => Promise<void>
}

// --- Context Definition ---
const PracticeContext = createContext<PracticeContextType | undefined>(undefined)



// --- Provider Component ---
export function PracticeProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [bookmarks, setBookmarks] = useState<Question[]>([])

  useEffect(() => {
    // Load bookmarks from API on initial load
    loadBookmarks();
  }, [])



  const createSession = async (domain: string, difficulty: string): Promise<PracticeSession> => {
    try {
      const response = await fetch('/api/practice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain, difficulty }),
      });

      if (!response.ok) {
        throw new Error('Failed to create practice session');
      }

      const sessionData = await response.json();
      
      // Transform the backend data to match our frontend interface
      const newSession: PracticeSession = {
        id: sessionData._id,
        domain: sessionData.domain,
        difficulty: sessionData.difficulty,
        questions: sessionData.questions.map((q: any) => ({
          id: q._id,
          title: q.title,
          description: q.description,
          answer: q.answer,
          hints: q.hints,
          domain: q.domain,
          difficulty: q.difficulty
        })),
        currentQuestionIndex: 0,
        startTime: sessionData.createdAt,
        completedQuestions: sessionData.completedQuestions,
        totalQuestions: sessionData.totalQuestions
      };
      
      setSessions(prev => [...prev, newSession]);
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  const addBookmark = async (question: Question) => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: question.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to bookmark question');
      }

      setBookmarks(prev => {
        if (prev.find(q => q.id === question.id)) return prev;
        return [...prev, { ...question, bookmarked: true }];
      });
    } catch (error) {
      console.error('Error bookmarking question:', error);
    }
  }

  const removeBookmark = async (questionId: string) => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove bookmark');
      }

      setBookmarks(prev => prev.filter(q => q.id !== questionId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  }

  const loadBookmarks = async () => {
    try {
      const response = await fetch('/api/bookmarks');
      if (!response.ok) {
        throw new Error('Failed to load bookmarks');
      }
      const data = await response.json();
      setBookmarks(data.bookmarks || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

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
      isBookmarked,
      loadBookmarks
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

