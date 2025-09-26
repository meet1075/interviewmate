"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Calendar, Clock, Target, Trophy, TrendingUp, Award, BookOpen, Star, CheckCircle, Play, Bookmark } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"

// Interface for dashboard data
interface DashboardData {
  user: {
    id: string;
    clerkId: string;
    email: string;
    username: string;
  };
  stats: {
    practiceQuestions: number;
    mockInterviews: number;
    totalPoints: number;
    bookmarkedQuestions: number;
    leaderboardRank: number | null;
    practiceSessionsCompleted: number;
    mockInterviewsCompleted: number;
  };
  skillProgress: Array<{
    skill: string;
    level: number;
    questions: number;
    averageRating: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'Practice' | 'Mock Interview';
    domain: string;
    difficulty: string;
    date: string;
    overallRating?: number;
    completedQuestions?: number;
    totalQuestions?: number;
  }>;
  summary: {
    totalSessions: number;
    completedMockSessions: number;
    averageRating: number;
  };
}
// --- Main Dashboard Component ---
export default function DashboardPage() {
    const { user, isLoaded } = useUser()
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch dashboard data from API
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;

            try {
                setLoading(true)
                const response = await fetch('/api/dashboard')
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data')
                }
                const data = await response.json()
                setDashboardData(data)
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
                setError('Failed to load dashboard data')
            } finally {
                setLoading(false)
            }
        }

        if (isLoaded && user) {
            fetchDashboardData()
        }
    }, [user, isLoaded])

    if (!isLoaded || loading) {
        return (
            <div className="container py-8 max-w-4xl mx-auto">
                <Card className="text-center">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-bold mb-4">Loading...</h2>
                        <p className="text-muted-foreground">Please wait while we load your dashboard.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="container py-8 max-w-4xl mx-auto">
                <Card className="text-center">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
                        <p className="text-muted-foreground mb-6">You need to be logged in to view your dashboard</p>
                        <Link href="/sign-in">
                            <Button>Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container py-8 max-w-4xl mx-auto">
                <Card className="text-center">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-bold mb-4">Error</h2>
                        <p className="text-muted-foreground mb-6">{error}</p>
                        <Button onClick={() => window.location.reload()}>Retry</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!dashboardData) {
        return (
            <div className="container py-8 max-w-4xl mx-auto">
                <Card className="text-center">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-bold mb-4">No Data</h2>
                        <p className="text-muted-foreground">No dashboard data available.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const stats = [
        { title: "Practice Questions", value: dashboardData.stats.practiceQuestions, icon: BookOpen, color: "text-blue-500" },
        { title: "Mock Interviews", value: dashboardData.stats.mockInterviews, icon: Trophy, color: "text-green-500" },
        { title: "Total Points", value: dashboardData.stats.totalPoints, icon: Star, color: "text-yellow-500" },
        { title: "Leaderboard Rank", value: dashboardData.stats.leaderboardRank ? `#${dashboardData.stats.leaderboardRank}` : "Unranked", icon: Trophy, color: "text-purple-500" },
        { title: "Bookmarks Saved", value: dashboardData.stats.bookmarkedQuestions, icon: Bookmark, color: "text-orange-500" }
    ]

    return (
        <div className="w-full py-8 space-y-8 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back, {dashboardData.user.username || user.firstName || 'User'}!</h1>
                    <p className="text-muted-foreground">Here's a summary of your interview preparation progress.</p>
                </div>
                <Link href="/user/mockinterview">
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
                            {dashboardData.skillProgress.length > 0 ? (
                                dashboardData.skillProgress.map((skill) => (
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
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No skill data available. Take some mock interviews to see your progress!
                                </p>
                            )}
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
                            {dashboardData.recentActivity.length > 0 ? dashboardData.recentActivity.map((activity) => (
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
                                            <span>{new Date(activity.date).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{activity.difficulty}</span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {activity.type === 'Mock Interview' 
                                            ? `${activity.overallRating || 0}/10` 
                                            : `${activity.completedQuestions || 0}/${activity.totalQuestions || 0}`}
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

