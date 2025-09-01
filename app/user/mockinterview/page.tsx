"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Play, Pause, Clock, Mic, MicOff, Camera, CameraOff, Monitor, ChevronRight, Star, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { useMockInterview, MockSession } from "@/contexts/MockInterviewContext"
// Assuming you have a toast hook, e.g., from shadcn/ui
// import { useToast } from "@/components/ui/use-toast"

const domains = ['Frontend Development', 'Backend Development', 'System Design']
const difficulties = ['Beginner', 'Intermediate', 'Advanced']

// A simple mock toast function if you don't have one set up
const useToast = () => ({
  toast: (options: { title: string, description: string, variant?: string }) => {
    console.log(`Toast: ${options.title} - ${options.description}`);
    // In a real app, you'd have a global Toaster component that displays this.
    // alert(`${options.title}\n${options.description}`);
  }
});


export default function MockInterviewPage() {
  const { user } = useAuth()
  const { createMockSession, submitAnswer, completeMockSession, getUserSessions } = useMockInterview()
  const { toast } = useToast()
  
  const [selectedDomain, setSelectedDomain] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [currentSession, setCurrentSession] = useState<MockSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isStarted, setIsStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isRecording, setIsRecording] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [completedSession, setCompletedSession] = useState<MockSession | null>(null)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (currentSession && currentQuestionIndex < currentSession.questions.length) {
      setTimeRemaining(currentSession.questions[currentQuestionIndex].timeLimit * 60)
    }
  }, [currentSession, currentQuestionIndex])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isStarted && !isPaused && timeRemaining > 0 && !showResults) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            handleNextQuestion()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isStarted, isPaused, timeRemaining, showResults])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startNewSession = async () => {
    if (!user) return
    
    try {
      const session = await createMockSession(user.id, selectedDomain, selectedDifficulty)
      setCurrentSession(session)
      setCurrentQuestionIndex(0)
      setAnswer('')
      setIsStarted(true)
      setIsRecording(true)
      setShowResults(false)
      setCompletedSession(null)
      
      toast({
        title: "Mock Interview Started",
        description: `${selectedDomain} - ${selectedDifficulty} level`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start mock interview",
        variant: "destructive"
      })
    }
  }

  const handleNextQuestion = async () => {
    if (!currentSession || !user) return
    
    const currentQuestion = currentSession.questions[currentQuestionIndex]
    const timeSpent = (currentQuestion.timeLimit * 60) - timeRemaining
    
    // Submit current answer and wait for it to be processed
    if (answer.trim()) {
      await submitAnswer(currentSession.id, currentQuestion.id, answer, timeSpent)
    }
    
    // Move to next question or finish
    if (currentQuestionIndex < currentSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setAnswer('')
    } else {
      finishInterview()
    }
  }

  const finishInterview = () => {
    if (!currentSession) return
    
    const completed = completeMockSession(currentSession.id)
    if(completed) {
        setCompletedSession(completed)
        setShowResults(true)
        setIsStarted(false)
        setIsRecording(false)
        
        toast({
            title: "Interview Completed!",
            description: `You earned ${completed.pointsEarned} points`
        })
    }
  }

  const resetInterview = () => {
    setCurrentSession(null)
    setShowResults(false)
    setCompletedSession(null)
    setSelectedDomain('')
    setSelectedDifficulty('')
  }

  if (!user) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="text-center">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please login to access mock interviews and track your progress.
            </p>
            <Link href="/login">
                <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Results view
  if (showResults && completedSession) {
    return (
      <div className="container py-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Interview Complete!</h1>
          <p className="text-xl text-muted-foreground">
            Great job on completing your mock interview. Here's your feedback.
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
                <div className="text-3xl font-bold">{completedSession.questions.length}</div>
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
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{answer.rating}/10</span>
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
          <div className="flex justify-center space-x-4">
            <Button onClick={resetInterview}>
              Start New Interview
            </Button>
            <Link href="/dashboard">
                <Button variant="outline">
                    View Dashboard
                </Button>
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
      <div className="container py-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Mock Interview</h1>
          <p className="text-xl text-muted-foreground">
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

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-6 w-6" />
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
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interview domain" />
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

            <div className="space-y-4">
              <h3 className="font-semibold">Setup Your Environment</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant={cameraEnabled ? "default" : "outline"}
                  onClick={() => setCameraEnabled(!cameraEnabled)}
                  className="h-20 flex-col space-y-2"
                >
                  {cameraEnabled ? <Camera className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
                  <span className="text-sm">{cameraEnabled ? "Camera On" : "Camera Off"}</span>
                </Button>
                
                <div className="h-20 flex flex-col space-y-2 items-center justify-center border rounded-lg">
                  <Mic className="h-6 w-6" />
                  <span className="text-sm">Microphone Ready</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={startNewSession}
              disabled={!selectedDomain || !selectedDifficulty}
              size="lg"
              className="w-full"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Mock Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Interview in progress view
  const currentQuestion = currentSession.questions[currentQuestionIndex]

  return (
    <div className="container py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
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
              variant="ghost"
              size="sm" 
              onClick={() => setIsRecording(!isRecording)}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? <Mic className="h-4 w-4 text-destructive" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? "Resume interview" : "Pause interview"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <Progress value={((currentQuestionIndex + 1) / currentSession.questions.length) * 100} className="h-2" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{currentSession.domain}</Badge>
                <Badge variant="outline">{currentQuestion.timeLimit} minutes</Badge>
              </div>
              <CardTitle className="text-xl leading-relaxed pt-2">{currentQuestion.title}</CardTitle>
              <CardDescription>{currentQuestion.description}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Response</CardTitle>
              <CardDescription>Provide a comprehensive answer with examples and clear explanations.</CardDescription>
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
                <div className="text-sm text-muted-foreground">{answer.length} characters</div>
                <Button onClick={handleNextQuestion} disabled={isPaused}>
                  {currentQuestionIndex === currentSession.questions.length - 1 ? 
                    "Finish Interview" : "Next Question"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interview Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {cameraEnabled ? (
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Camera Active</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <CameraOff className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Camera Disabled</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interview Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentSession.questions.map((q, index) => (
                <div 
                  key={q.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    index === currentQuestionIndex 
                      ? 'border-primary bg-primary/5' 
                      : index < currentQuestionIndex 
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'border-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Question {index + 1}</span>
                    <Badge variant={index <= currentQuestionIndex ? "default" : "outline"}>
                      {index < currentQuestionIndex ? "✓" : index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
