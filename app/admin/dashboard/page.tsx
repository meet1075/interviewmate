"use client"

import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  Star
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAdmin } from "@/contexts/AdminContext"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { users, domains, getTodayStats } = useAdmin()
  const todayStats = getTodayStats()
  
  // Redirect if not an admin
  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role !== 'admin') {
      router.push('/');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || user?.publicMetadata?.role !== 'admin') {
      return <div className="container py-8 text-center"><p>Loading or Access Denied...</p></div>
  }
  
  const platformStats = [
    {
      title: "Total Users",
      value: users.length.toString(),
      change: `${users.filter(u => u.status === 'active').length} active users`, 
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Today's Activity",
      value: todayStats.activeUsers.toString(),
      change: `${todayStats.newRegistrations} new registrations`,
      icon: Activity,
      color: "text-success"
    },
    {
      title: "Questions Generated",
      value: domains.reduce((sum, d) => sum + d.questionsGenerated, 0).toString(),
      change: `${todayStats.questionsPracticed} practiced today`,
      icon: BookOpen,
      color: "text-warning"
    },
    {
      title: "Mock Interviews",
      value: todayStats.mockInterviews.toString(),
      change: "completed today",
      icon: Star,
      color: "text-accent-foreground"
    }
  ]

  const domainStats = domains.map(domain => ({
    domain: domain.name,
    questions: domain.questionsGenerated,
    users: users.filter(u => 
      u.practiceHistory.some(p => p.domain === domain.name) ||
      u.mockInterviewStats.some(m => m.domain === domain.name)
    ).length,
    completion: Math.round(domain.averageRating * 10) // Convert rating to percentage
  }))

  return (
    <div className="container py-8 space-y-8 px-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage the InterviewMate platform</p>
        </div>
        {/* <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="hero-button">
            Platform Settings
          </Button>
        </div> */}
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {platformStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="interview-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xs text-green-500">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Domain Performance */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Domain Performance</CardTitle>
              <CardDescription>Question usage and user engagement by domain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {domainStats.map((domain) => (
                <div key={domain.domain} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{domain.domain}</span>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{domain.questions} questions</span>
                      <span>{domain.users} users</span>
                      <Badge variant="secondary">{domain.completion}%</Badge>
                    </div>
                  </div>
                  <Progress value={domain.completion} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">New Registrations</span>
                  <span className="font-medium">{todayStats.newRegistrations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Questions Practiced</span>
                  <span className="font-medium">{todayStats.questionsPracticed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Mock Interviews</span>
                  <span className="font-medium">{todayStats.mockInterviews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Users</span>
                  <span className="font-medium">{todayStats.activeUsers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
