"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bookmark, BookmarkCheck, Lightbulb, Clock, Target, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePractice, Question, PracticeSession } from "@/contexts/PracticeContext"
import { useUser } from "@clerk/nextjs"

const domains = [
  "Frontend Development",
  "Backend Development", 
  "System Design",
  "Data Science",
  "Mobile Development",
  "DevOps",
  "Machine Learning"
]

const difficulties = ["Beginner", "Intermediate", "Advanced"]

export default function PracticePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { sessions, createSession, addBookmark, removeBookmark, isBookmarked } = usePractice()
  const [selectedDomain, setSelectedDomain] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState("")
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [showHints, setShowHints] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Get current question from session
  useEffect(() => {
    if (currentSession && currentSession.questions.length > 0) {
      setCurrentQuestion(currentSession.questions[currentSession.currentQuestionIndex])
    } else {
      setCurrentQuestion(null)
    }
  }, [currentSession])

  if (!isLoaded) {
    return (
        <div className="container py-8 text-center">
            <p>Loading...</p>
        </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="container py-8 max-w-2xl mx-auto text-center space-y-6">
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
      setShowHints(false)
    } catch (error) {
      console.error("Failed to create session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextQuestion = () => {
    if (!currentSession) return
    
    const nextIndex = currentSession.currentQuestionIndex + 1
    if (nextIndex < currentSession.questions.length) {
      setCurrentSession({
        ...currentSession,
        currentQuestionIndex: nextIndex,
        completedQuestions: nextIndex
      })
    } else {
      // Mark session as fully completed
      setCurrentSession({
        ...currentSession,
        currentQuestionIndex: nextIndex,
        completedQuestions: nextIndex,
      })
    }
    setShowHints(false)
  }

  const handleBookmarkToggle = () => {
    if (!currentQuestion) return
    
    if (isBookmarked(currentQuestion.id)) {
      removeBookmark(currentQuestion.id)
    } else {
      addBookmark(currentQuestion)
    }
  }

  const handleEndSession = () => {
    setCurrentSession(null)
    setCurrentQuestion(null)
    setShowHints(false)
  }

  // Session completed view
  if (currentSession && currentSession.currentQuestionIndex >= currentSession.totalQuestions) {
    return (
      <div className="container py-8 max-w-4xl mx-auto space-y-6">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
              <Trophy className="h-8 w-8 text-green-500" />
              <span>Session Completed!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-lg">Great job! You've completed all {currentSession.totalQuestions} questions in this practice session.</p>
            
            <div className="flex items-center justify-center space-x-2">
              <Button variant="outline" onClick={() => setCurrentSession(null)}>
                Start New Session
              </Button>
              <Link href="/bookmarks">
                <Button variant="outline">
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
      <div className="container py-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Practice Mode</h1>
          <p className="text-muted-foreground">Select domain and difficulty to start practicing</p>
        </div>

        {/* Practice History */}
        {sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Practice Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {sessions.slice(-3).reverse().map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{session.domain}</Badge>
                        <Badge variant="outline">{session.difficulty}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.completedQuestions} of {session.totalQuestions} questions completed
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.startTime).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="interview-card">
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessions.length}</p>
                <p className="text-sm text-muted-foreground">Sessions</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="interview-card">
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sessions.reduce((acc, s) => acc + s.completedQuestions, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Questions Practiced</p>
              </div>
            </CardContent>
          </Card>

          <Card className="interview-card">
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Bookmark className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">View</p>
                <Link href="/bookmarks" className="text-sm text-muted-foreground hover:text-foreground">
                  Bookmarks
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Practice Setup */}
        <Card className="interview-card">
          <CardHeader>
            <CardTitle>Start New Practice Session</CardTitle>
            <CardDescription>
              Choose your domain and difficulty level to generate 10 practice questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="text-sm font-medium">Domain</label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
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
                    {difficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleStartPractice}
              disabled={!selectedDomain || !selectedDifficulty || isLoading}
              className="w-full hero-button"
            >
              {isLoading ? "Generating Questions..." : "Start Practice Session"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If session is active, show current question
  return (
    <div className="container py-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Practice Mode</h1>
          <p className="text-muted-foreground">
            {currentSession.domain} • {currentSession.difficulty}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-4 py-2">
            Question {currentSession.currentQuestionIndex + 1} of {currentSession.totalQuestions}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <Card className="interview-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{currentQuestion.domain}</Badge>
                  <Badge variant={
                    currentQuestion.difficulty === "Advanced" ? "destructive" :
                    currentQuestion.difficulty === "Intermediate" ? "default" : "outline"
                  }>
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-xl leading-relaxed">
                  {currentQuestion.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {currentQuestion.description}
                </CardDescription>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowHints(!showHints)}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Hints
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmarkToggle}
                >
                  {isBookmarked(currentQuestion.id) ? (
                    <BookmarkCheck className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {showHints && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Hints to get you started:
                </h4>
                <ul className="space-y-1 text-sm">
                  {currentQuestion.hints.map((hint, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Think through your answer mentally, then proceed to the next question
              </div>
              
              <Button onClick={handleNextQuestion} className="hero-button">
                {currentSession.currentQuestionIndex + 1 === currentSession.totalQuestions 
                  ? "Complete Session" 
                  : "Next Question"
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}