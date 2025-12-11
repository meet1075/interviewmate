"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Play, Pause, Clock, ChevronRight, Star, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMockInterview, MockSession } from "@/contexts/MockInterviewContext"
import { useUser } from "@clerk/nextjs"

// A simple mock toast function if you don't have one set up
const useToast = () => ({
  toast: (options: { title: string, description: string, variant?: string }) => {
    console.log(`Toast: ${options.title} - ${options.description}`);
  }
});

const difficulties = ['Beginner', 'Intermediate', 'Advanced']

export default function MockInterviewPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { createMockSession, submitAnswer, completeMockSession, getUserSessions } = useMockInterview()
  const { toast } = useToast()
  
  const [domains, setDomains] = useState<string[]>([])
  const [domainsLoading, setDomainsLoading] = useState(true)
  const [selectedDomain, setSelectedDomain] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [currentSession, setCurrentSession] = useState<MockSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isStarted, setIsStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [completedSession, setCompletedSession] = useState<MockSession | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)

  // Fetch domains from database
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setDomainsLoading(true)
        const response = await fetch('/api/domains/public')
        if (!response.ok) {
          console.warn('Failed to fetch domains from API, using fallback')
          // Use fallback domains
          setDomains(['Frontend Development', 'Backend Development', 'System Design', 'Data Science', 'Mobile Development', 'DevOps', 'Machine Learning'])
          return
        }
        const data = await response.json()
        setDomains(data.domains || [])
      } catch (error) {
        console.error('Error fetching domains:', error)
        // Fallback to default domains if API fails
        setDomains(['Frontend Development', 'Backend Development', 'System Design', 'Data Science', 'Mobile Development', 'DevOps', 'Machine Learning'])
      } finally {
        setDomainsLoading(false)
      }
    }

    if (isLoaded) {
      fetchDomains()
    }
  }, [isLoaded])

  const finishInterview = useCallback(async () => {
    if (!currentSession) return
    
    try {
      const completed = await completeMockSession(currentSession.id)
      if(completed) {
          // Create a mock session object for display
          const completedSessionData: MockSession = {
            id: currentSession.id,
            userId: currentSession.userId,
            domain: currentSession.domain,
            difficulty: currentSession.difficulty,
            questions: currentSession.questions,
            answers: completed.individualAnswers || currentSession.answers,
            startTime: currentSession.startTime,
            endTime: new Date().toISOString(),
            overallRating: completed.overallRating,
            overallFeedback: completed.overallFeedback,
            pointsEarned: Math.round(completed.overallRating * 10),
            status: 'completed'
          }
          
          setCompletedSession(completedSessionData)
          setShowResults(true)
          setIsStarted(false)
          
          toast({
              title: "Interview Completed!",
              description: `You earned ${completedSessionData.pointsEarned} points`
          })
      }
    } catch (error) {
      console.error('Error completing interview:', error)
      toast({
        title: "Error",
        description: "Failed to complete interview",
        variant: "destructive"
      })
    }
  }, [currentSession, completeMockSession, toast])

  const handleNextQuestion = useCallback(async () => {
    if (!currentSession || !user) return

    setIsSubmittingAnswer(true)
    const currentQuestion = currentSession.questions[currentQuestionIndex]
    const timeSpent = (currentQuestion.timeLimit * 60) - timeRemaining

    try {
      if (answer.trim()) {
        await submitAnswer(currentSession.id, currentQuestion.id, answer, timeSpent)
      }

      if (currentQuestionIndex < currentSession.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        setAnswer('')
      } else {
        await finishInterview()
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      })
    } finally {
      // small delay to avoid flicker if next UI appears immediately
      setTimeout(() => setIsSubmittingAnswer(false), 150)
    }
  }, [currentSession, user, answer, timeRemaining, currentQuestionIndex, submitAnswer, finishInterview, toast])

  useEffect(() => {
    if (currentSession && currentQuestionIndex < currentSession.questions.length) {
      setTimeRemaining(currentSession.questions[currentQuestionIndex].timeLimit * 60)
    }
  }, [currentSession, currentQuestionIndex])

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    
    if (isStarted && !isPaused && timeRemaining > 0 && !showResults) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval!)
            handleNextQuestion()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isStarted, isPaused, timeRemaining, showResults, handleNextQuestion])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startNewSession = async () => {
    if (!user) return

    setIsGenerating(true)
    try {
      const session = await createMockSession(selectedDomain, selectedDifficulty)
      setCurrentSession(session)
      setCurrentQuestionIndex(0)
      setAnswer('')
      setIsStarted(true)
      setShowResults(false)
      setCompletedSession(null)

      toast({
        title: "Mock Interview Started",
        description: `${selectedDomain} - ${selectedDifficulty} level`
      })
    } catch (error: unknown) {
      console.error('Error starting mock interview:', error)
      
      // Check if it's a rate limit error
      let errorMessage = "Failed to start mock interview. Please try again.";
      if (error && typeof error === 'object' && 'message' in error) {
        const errMsg = String(error.message);
        if (errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('RATE_LIMIT')) {
          errorMessage = "Rate limit exceeded. Please wait a few moments and try again.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetInterview = () => {
    setCurrentSession(null)
    setCurrentQuestionIndex(0)
    setAnswer('')
    setIsStarted(false)
    setIsPaused(false)
    setShowResults(false)
    setCompletedSession(null)
    setSelectedDomain('')
    setSelectedDifficulty('')
  }

  if (!isLoaded) {
    return (
      <div className="w-full lg:w-[70%] mx-auto py-4 sm:py-8 text-center px-4 sm:px-6">
            <p>Loading...</p>
        </div>
    )
  }

  if (!isSignedIn) {
      return (
        <div className="w-full lg:w-[70%] mx-auto py-4 sm:py-8 text-center space-y-6 px-4 sm:px-6">
            <Card>
                <CardHeader>
                    <CardTitle>Login Required</CardTitle>
                    <CardDescription>
                        Please log in to access mock interviews and track your progress.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/sign-in">
                        <Button>Login to Continue</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
      );
  }

  // Results view
  if (showResults && completedSession) {
    return (
      <div className="w-full lg:w-[70%] mx-auto py-4 sm:py-8 space-y-6 sm:space-y-8 px-4 sm:px-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Interview Complete!</h1>
          <p className="text-xl text-muted-foreground">
            Great job on completing your mock interview
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Performance</CardTitle>
            <CardDescription>{completedSession.domain} - {completedSession.difficulty}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{completedSession.overallRating}/10</div>
                <div className="text-sm text-muted-foreground">Overall Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500">{completedSession.pointsEarned}</div>
                <div className="text-sm text-muted-foreground">Points Earned</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-500">{completedSession.questions.length}</div>
                <div className="text-sm text-muted-foreground">Questions Answered</div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Overall Feedback</h4>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">{completedSession.overallFeedback}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detailed Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {completedSession.questions.map((question) => {
              const answer = completedSession.answers.find(a => a.questionId === question.id)
              return (
                <div key={question.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{question.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                    </div>
                    {answer && (
                      <div className="flex items-center space-x-2 pl-4">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                          <span className="font-semibold">{answer.rating}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {answer && (
                    <>
                      <div>
                        <h5 className="font-medium text-sm mb-2">Your Answer:</h5>
                        <div className="bg-muted/30 p-3 rounded text-sm whitespace-pre-wrap">
                          {answer.answer || "No answer provided"}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-2">Feedback:</h5>
                        <div className="bg-primary/5 p-3 rounded text-sm">
                          {answer.feedback}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button onClick={resetInterview} className="hero-button w-full sm:w-auto">
              Start New Interview
            </Button>
            <Link href="/user/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">View Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Setup view
  if (!currentSession) {
    
    const userSessions = getUserSessions(user.id).filter(s => s.status === 'completed')
    
    return (
      <div className="w-full lg:w-[70%] mx-auto py-4 sm:py-8 space-y-6 sm:space-y-8 px-4 sm:px-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Mock Interview</h1>
          <p className="text-sm sm:text-base lg:text-xl text-muted-foreground">
            Practice with AI-powered mock interviews and get real-time feedback
          </p>
        </div>

        {userSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Previous Sessions</CardTitle>
              <CardDescription>Your recent mock interview history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userSessions.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{session.domain}</h4>
                      <p className="text-sm text-muted-foreground">
                        {session.difficulty} • {session.overallRating}/10 rating • {session.pointsEarned} points
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session.endTime ? new Date(session.endTime).toLocaleDateString() : ''}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="max-w-0xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Start New Mock Interview</span>
            </CardTitle>
            <CardDescription>
              Select your preferences for the interview session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain</label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain} disabled={domainsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={domainsLoading ? "Loading domains..." : "Select interview domain"} />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map(domain => (
                      <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty Level</label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map(difficulty => (
                      <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm">What to Expect:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 5 questions tailored to your selected domain and difficulty</li>
                <li>• Real-time feedback and ratings for each answer</li>
                <li>• Points awarded based on your performance</li>
                <li>• Detailed analysis at the end of the session</li>
              </ul>
            </div>

            <Button 
              onClick={startNewSession}
              disabled={!selectedDomain || !selectedDifficulty || domainsLoading || isGenerating}
              size="lg"
              className="w-full hero-button"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 rounded-full border-2 border-t-white border-gray-200 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  {domainsLoading ? "Loading..." : "Start Mock Interview"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Interview in progress view
  const currentQuestion = currentSession.questions[currentQuestionIndex]
  return (
    <div className="w-full lg:w-[70%] mx-auto py-4 sm:py-8 space-y-4 sm:space-y-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h1 className="text-2xl font-bold">Mock Interview</h1>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {currentSession.questions.length}
          </Badge>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-lg font-mono">
            <Clock className="h-5 w-5" />
            <span className={timeRemaining < 60 ? "text-destructive" : ""}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      <Progress value={((currentQuestionIndex + 1) / currentSession.questions.length) * 100} className="h-2" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="interview-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {currentSession.domain}
                </Badge>
                <Badge variant="outline">
                  {currentQuestion.timeLimit} minutes
                </Badge>
              </div>
              <CardTitle className="text-xl leading-relaxed pt-2">
                {currentQuestion.title}
              </CardTitle>
              <CardDescription>
                {currentQuestion.description}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Your Response</CardTitle>
              <CardDescription>
                Provide a comprehensive answer with examples and clear explanations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Start your answer here..." 
                value={answer} 
                onChange={(e) => setAnswer(e.target.value)} 
                className="min-h-[300px]" 
                disabled={isPaused} 
              />
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {answer.length} characters
                </div>
                <Button onClick={handleNextQuestion} disabled={isPaused || isSubmittingAnswer} className="hero-button">
                  {isSubmittingAnswer ? (
                    <>
                      <div className="w-4 h-4 mr-2 rounded-full border-2 border-t-white border-gray-200 animate-spin inline-block" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {currentQuestionIndex === currentSession.questions.length - 1 ? 
                        "Finish Interview" : "Next Question"}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interview Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentSession.questions.map((q, index) => (
                <div 
                  key={q.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    index === currentQuestionIndex ? 'border-primary bg-primary/5' : 
                    index < currentQuestionIndex ? 'border-green-500/50 bg-green-500/5' : 'border-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Question {index + 1}</span>
                    <Badge variant={
                      index === currentQuestionIndex ? "default" :
                      index < currentQuestionIndex ? "default" : "outline"
                    }>
                      {index < currentQuestionIndex ? "✓" : index + 1}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {q.timeLimit} min • {currentSession.difficulty}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}