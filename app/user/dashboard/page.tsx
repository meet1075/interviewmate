"use client"

import Link from "next/link"
import { Calendar, Clock, Target, Trophy, TrendingUp, Award, BookOpen, Star, CheckCircle, Play, Bookmark } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { usePractice } from "@/contexts/PracticeContext"
import { useMockInterview } from "@/contexts/MockInterviewContext"
import { useUser } from "@clerk/nextjs"
// --- Main Dashboard Component ---
export default function DashboardPage() {
    // const { user } = useAuth()
    const { sessions: practiceSessions, bookmarks } = usePractice()
    const { sessions: mockSessions, getTotalPoints } = useMockInterview()
const { user } = useUser()


    if (!user) {
        return (
            <div className="container py-8 max-w-4xl mx-auto">
        <Card className="text-center">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">You need to be logged in to view your dashboard
            </p>
            <Link href="/sign-in">
                <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
        )
    }

    // --- Data Aggregation ---
    const totalPracticeQuestions = practiceSessions.reduce((acc, s) => acc + s.completedQuestions, 0)
    const totalMockSessions = mockSessions.filter(s => s.status === 'completed' && s.userId === user?.id).length
    const totalPoints = getTotalPoints(user?.id!)

    const stats = [
        { title: "Practice Questions", value: totalPracticeQuestions, icon: BookOpen, color: "text-blue-500" },
        { title: "Mock Interviews", value: totalMockSessions, icon: Trophy, color: "text-green-500" },
        { title: "Total Points", value: totalPoints, icon: Star, color: "text-yellow-500" },
        { title: "Bookmarks Saved", value: bookmarks.length, icon: Bookmark, color: "text-orange-500" }
    ]

    const allSessions = [
        ...practiceSessions.map(s => ({...s, type: 'Practice' as const, date: new Date(s.startTime)})),
        ...mockSessions.filter(s => s.userId === user?.id).map(s => ({...s, type: 'Mock Interview' as const, date: new Date(s.startTime)}))
    ].sort((a, b) => b.date.getTime() - a.date.getTime())

    const recentActivity = allSessions.slice(0, 3)

    const skillProgress = ['Frontend Development', 'Backend Development', 'System Design'].map(domain => {
        const domainMocks = mockSessions.filter(s => s.userId === user?.id && s.domain === domain && s.status === 'completed');
        const avgRating = domainMocks.reduce((acc, s) => acc + s.overallRating, 0) / (domainMocks.length || 1);
        return {
            skill: domain,
            level: Math.round(avgRating * 10), // Convert rating to percentage
            questions: domainMocks.length,
        }
    });

    return (
        <div className="container py-8 space-y-8 px-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back, {user?.username}!</h1>
                    <p className="text-muted-foreground">Here's a summary of your interview preparation progress.</p>
                </div>
                <Link href="/mock-interview">
                    <Button>
                        <Play className="h-4 w-4 mr-2" />
                        Start Mock Interview
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Icon className={`h-8 w-8 ${stat.color}`} />
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Skill Progress */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Skill Progress</CardTitle>
                            <CardDescription>Your average mock interview performance across different domains.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {skillProgress.map((skill) => (
                                <div key={skill.skill} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{skill.skill}</span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-muted-foreground">
                                                {skill.questions} sessions
                                            </span>
                                            <Badge variant="secondary">{skill.level}%</Badge>
                                        </div>
                                    </div>
                                    <Progress value={skill.level} className="h-2" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Your latest sessions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recentActivity.length > 0 ? recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start space-x-4">
                                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center ${
                                        activity.type === 'Mock Interview' ? 'bg-blue-500/10' : 'bg-green-500/10'
                                    }`}>
                                        {activity.type === 'Mock Interview' ? 
                                            <Trophy className="h-4 w-4 text-blue-500" /> : 
                                            <BookOpen className="h-4 w-4 text-green-500" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="font-medium text-sm">{activity.type} - {activity.domain}</p>
                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                            <span>{activity.date.toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {activity.type === 'Mock Interview' ? `${activity.overallRating}/10` : `${activity.completedQuestions}/${activity.totalQuestions}`}
                                    </Badge>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No recent activity found.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

