"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Bookmark, BookmarkCheck, CheckCircle, Clock, Target, Trophy, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePractice, Question, PracticeSession } from "@/contexts/PracticeContext"
import { useUser } from "@clerk/nextjs"

const difficulties = ["Beginner", "Intermediate", "Advanced"]

export default function PracticePage() {
  const { isLoaded, isSignedIn } = useUser()
  const { sessions, createSession, updateSessionProgress, addBookmark, removeBookmark, isBookmarked } = usePractice()
  const [selectedDomain, setSelectedDomain] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState("")
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [domains, setDomains] = useState<string[]>([])
  const [domainsLoading, setDomainsLoading] = useState(true)
  const completionMarkedRef = useRef<string | null>(null)
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false)

  // Fetch domains from API
  const fetchDomains = async () => {
    try {
      setDomainsLoading(true)
      const response = await fetch('/api/domains/public')
      if (!response.ok) {
        console.warn('Failed to fetch domains from API, using fallback')
        // Use fallback domains
        setDomains([
          "Frontend Development",
          "Backend Development", 
          "System Design",
          "Data Science",
          "Mobile Development",
          "DevOps",
          "Machine Learning"
        ])
        return
      }
      const data = await response.json()
      setDomains(data.domains || [])
    } catch (error) {
      console.error('Error fetching domains:', error)
      // Fallback to default domains if API fails
      setDomains([
        "Frontend Development",
        "Backend Development", 
        "System Design",
        "Data Science",
        "Mobile Development",
        "DevOps",
        "Machine Learning"
      ])
    } finally {
      setDomainsLoading(false)
    }
  }

  // Load domains on component mount
  useEffect(() => {
    fetchDomains()
  }, [])

  // Poll for new questions when session is active and total questions haven't been reached
  useEffect(() => {
    if (!currentSession) return
    
    // Only poll if we expect more questions (totalQuestions is 10 but we have fewer)
    if (currentSession.questions.length < currentSession.totalQuestions) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/practice/${currentSession.id}`)
          if (response.ok) {
            const updatedSession = await response.json()
            // Update session with new questions if any were added
            if (updatedSession.questions.length > currentSession.questions.length) {
              setCurrentSession(prev => {
                if (!prev) return null
                return {
                  ...prev,
                  questions: updatedSession.questions
                }
              })
            }
            
            // Stop polling once we have all questions
            if (updatedSession.questions.length >= updatedSession.totalQuestions) {
              clearInterval(pollInterval)
            }
          }
        } catch (error) {
          console.error('Error polling for new questions:', error)
        }
      }, 3000) // Poll every 3 seconds
      
      return () => clearInterval(pollInterval)
    }
  }, [currentSession])

  // Get current question from session
  useEffect(() => {
    if (currentSession && currentSession.questions.length > 0 && currentSession.currentQuestionIndex < currentSession.questions.length) {
      setCurrentQuestion(currentSession.questions[currentSession.currentQuestionIndex])
    } else {
      setCurrentQuestion(null)
    }
  }, [currentSession])

  if (!isLoaded) {
    return (
        <div className="w-full max-w-7xl mx-auto py-4 sm:py-8 text-center px-4 sm:px-6 lg:px-8">
            <p>Loading...</p>
        </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="w-full max-w-7xl mx-auto py-4 sm:py-8 text-center space-y-6 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              Please log in to access practice mode and track your progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/sign-in">
              <Button className="hero-button">Login to Continue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleStartPractice = async () => {
    if (!selectedDomain || !selectedDifficulty) return
    
    setIsLoading(true)
    try {
      const session = await createSession(selectedDomain, selectedDifficulty)
      setCurrentSession(session)
      // Reset completion tracking for new session
      completionMarkedRef.current = null
    } catch (error) {
      console.error("Failed to create session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextQuestion = async () => {
    if (!currentSession) return

    setIsSubmittingQuestion(true)
    const nextIndex = currentSession.currentQuestionIndex + 1
    const completedQuestions = nextIndex

    // If this is the last question, mark as completed
    const finalCompletedCount = nextIndex >= currentSession.totalQuestions ? currentSession.totalQuestions : completedQuestions

    try {
      // Update session progress in database
      await updateSessionProgress(currentSession.id, finalCompletedCount, nextIndex)

      setCurrentSession({
        ...currentSession,
        currentQuestionIndex: nextIndex,
        completedQuestions: finalCompletedCount,
      })
    } catch (error) {
      console.error('Failed to update session progress:', error)
    } finally {
      // small delay to avoid flicker when UI updates immediately
      setTimeout(() => setIsSubmittingQuestion(false), 150)
    }
  }

  const handleBookmarkToggle = async () => {
    if (!currentQuestion) return
    
    if (isBookmarked(currentQuestion.id)) {
      await removeBookmark(currentQuestion.id)
    } else {
      await addBookmark(currentQuestion)
    }
  }

  const handleEndSession = async () => {
    if (currentSession) {
      // Update session progress when ending session
      await updateSessionProgress(
        currentSession.id, 
        currentSession.currentQuestionIndex, 
        currentSession.currentQuestionIndex
      )
    }
    setCurrentSession(null)
  }



  // Session completed view
  if (currentSession && currentSession.currentQuestionIndex >= currentSession.totalQuestions) {
    // Mark session as completed only once per session
    if (completionMarkedRef.current !== currentSession.id && currentSession.completedQuestions < currentSession.totalQuestions) {
      completionMarkedRef.current = currentSession.id
      updateSessionProgress(currentSession.id, currentSession.totalQuestions, currentSession.currentQuestionIndex)
    }

    return (
      <div className="w-full lg:w-[70%] mx-auto py-8 space-y-6 px-4 sm:px-6">
        <Card className="border-green-500/20 bg-green-500/5 text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
              <Trophy className="h-8 w-8 text-green-500" />
              <span>Session Completed!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">Great job! You&apos;ve completed all {currentSession.totalQuestions} questions.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setCurrentSession(null)} className="w-full sm:w-auto">
                Start New Session
              </Button>
              <Link href="/user/bookmarks" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Bookmark className="h-4 w-4 mr-2" />
                  View Bookmarks
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no session, show domain/difficulty selection
  if (!currentSession) {
    return (
      <div className="w-full lg:w-[70%] mx-auto py-4 sm:py-8 space-y-6 px-4 sm:px-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Practice Mode</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Select domain and difficulty to start practicing</p>
        </div>
        
        {sessions.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center space-x-2"><Clock className="h-5 w-5" /><span>Recent Practice Sessions</span></CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {sessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">{session.domain}</Badge>
                        <Badge variant="outline" className="text-xs">{session.difficulty}</Badge>
                        {session.status === 'completed' && (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {session.completedQuestions || 0} of {session.totalQuestions || 0} questions completed
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap self-start sm:self-center">
                      {new Date(session.startTime).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Target className="h-5 w-5 text-blue-500" /></div>
              <div><p className="text-2xl font-bold">{sessions.length}</p><p className="text-sm text-muted-foreground">Sessions</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Trophy className="h-5 w-5 text-green-500" /></div>
              <div><p className="text-2xl font-bold">{sessions.reduce((acc, s) => acc + (s.completedQuestions || 0), 0)}</p><p className="text-sm text-muted-foreground">Questions Practiced</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center"><Bookmark className="h-5 w-5 text-orange-500" /></div>
              <div><p className="text-2xl font-bold">View</p><Link href="/user/bookmarks" className="text-sm text-muted-foreground hover:text-foreground">Bookmarks</Link></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Start New Practice Session</CardTitle><CardDescription>Choose your domain and difficulty level to generate 10 practice questions</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain</label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain} disabled={domainsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={domainsLoading ? "Loading domains..." : "Select domain"} />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((domain: string) => (
                      <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((difficulty: string) => (
                      <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleStartPractice} disabled={!selectedDomain || !selectedDifficulty || isLoading} className="w-full hero-button">
              {isLoading ? "Preparing Session..." : "Start Practice Session"}
            </Button>
            {isLoading && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Generating initial questions, more will be loaded in the background
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // If session is active, show current question
  return (
    <div className="w-full lg:w-[70%] mx-auto py-4 sm:py-8 space-y-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Practice Mode</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{currentSession.domain} • {currentSession.difficulty}</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
            Question {currentSession.currentQuestionIndex + 1} of {currentSession.questions.length}
            {currentSession.questions.length < currentSession.totalQuestions && (
              <span className="ml-1 text-muted-foreground">({currentSession.totalQuestions} total)</span>
            )}
          </Badge>
          {currentSession.questions.length < currentSession.totalQuestions && (
            <Badge variant="secondary" className="px-2 py-1 text-xs animate-pulse">
              Loading more...
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleEndSession}>End Session</Button>
        </div>
      </div>

      {currentQuestion && (
        <div className="space-y-6">
          {/* Question Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">{currentQuestion.domain}</Badge>
                    <Badge variant={currentQuestion.difficulty === "Advanced" ? "destructive" : "default"} className="text-xs">{currentQuestion.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-lg sm:text-xl leading-relaxed">{currentQuestion.title}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">{currentQuestion.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2 self-start">
                  <Button variant="ghost" size="sm" onClick={handleBookmarkToggle}>
                    {isBookmarked(currentQuestion.id) ? (
                      <BookmarkCheck className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Answer Card */}
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-lg text-green-700 dark:text-green-400">💡 Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentQuestion.answer}</p>
              </div>
            </CardContent>
          </Card>

          {/* Hints Card */}
          {currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="text-lg text-blue-700 dark:text-blue-400">💭 Hints</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentQuestion.hints.map((hint, index) => (
                    <li key={index} className="text-sm flex items-start space-x-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-end">
            <Button onClick={handleNextQuestion} disabled={isSubmittingQuestion} className="hero-button w-full sm:w-auto">
              {isSubmittingQuestion ? (
                <>
                  <div className="w-4 h-4 mr-2 rounded-full border-2 border-t-white border-gray-200 animate-spin inline-block" />
                  Processing...
                </>
              ) : (
                <>
                  {currentSession.currentQuestionIndex + 1 === currentSession.totalQuestions 
                    ? "Complete Session" 
                    : "Next Question"
                  }
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

