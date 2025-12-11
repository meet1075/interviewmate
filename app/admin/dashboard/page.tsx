"use client"

import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Activity,
  Star,
  Brain,
  UserCheck
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

// Define interfaces for the API response
interface DashboardStats {
  totalUsers: number;
  usersRegisteredToday: number;
  totalQuestionsGenerated: number;
  questionsGeneratedToday: number;
  totalMockInterviews: number;
  mockInterviewsCompletedToday: number;
}

interface DomainStat {
  domain: string;
  mockInterviews: number;
  practiceSessions: number;
  uniqueUsersCount: number;
}

interface TodaysSummary {
  newRegistrations: number;
  questionsGenerated: number;
  mockInterviewsCompleted: number;
  totalActiveUsers: number;
}

interface DashboardData {
  stats: DashboardStats;
  domainStats: DomainStat[];
  todaysSummary: TodaysSummary;
}

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      
      if (!response.ok) {
        if (response.status === 403) {
          toast({ title: "Error", description: "Unauthorized access", variant: "destructive" });
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, router]);

  // Set up auto-refresh every 24 hours (86400000 ms)
  useEffect(() => {
    if (dashboardData) {
      const refreshInterval = setInterval(() => {
        fetchDashboardData();
      }, 24 * 60 * 60 * 1000); // 24 hours

      return () => clearInterval(refreshInterval);
    }
  }, [dashboardData]);

  // Redirect if not an admin and fetch data
  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (isLoaded && user?.publicMetadata?.role === 'admin') {
      fetchDashboardData();
    }
  }, [isLoaded, user, router, fetchDashboardData]);

  if (!isLoaded || loading) {
    return <div className="container py-8 text-center"><p>Loading...</p></div>;
  }

  if (user?.publicMetadata?.role !== 'admin') {
    return <div className="container py-8 text-center"><p>Access Denied</p></div>;
  }

  if (!dashboardData) {
    return <div className="container py-8 text-center"><p>Failed to load dashboard data</p></div>;
  }

  const { stats, domainStats, todaysSummary } = dashboardData;
  
  const platformStats = [
    {
      title: "Total Users",
      value: stats.totalUsers.toString(),
      change: `${stats.usersRegisteredToday} registered today`, 
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Today's Activity",
      value: stats.usersRegisteredToday.toString(),
      change: "new registrations today",
      icon: Activity,
      color: "text-success"
    },
    {
      title: "Questions Generated",
      value: stats.totalQuestionsGenerated.toString(),
      change: `${stats.questionsGeneratedToday} generated today`,
      icon: BookOpen,
      color: "text-warning"
    },
    {
      title: "Mock Interviews",
      value: stats.totalMockInterviews.toString(),
      change: `${stats.mockInterviewsCompletedToday} completed today`,
      icon: Star,
      color: "text-accent-foreground"
    }
  ]

  return (
    <div className="w-full py-8 space-y-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Monitor and manage the InterviewMate platform
            {lastUpdated && (
              <span className="block text-xs mt-1">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchDashboardData} disabled={loading} size="sm" className="text-xs sm:text-sm">
            <Activity className="h-4 w-4 mr-2" />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
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
              <CardDescription>Mock interviews, practice sessions, and user engagement by domain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {domainStats.length > 0 ? domainStats.map((domain) => (
                <div key={domain.domain} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="font-medium text-base">{domain.domain}</span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                      <span className="whitespace-nowrap">{domain.mockInterviews} interviews</span>
                      <span className="whitespace-nowrap">{domain.practiceSessions} sessions</span>
                      <span className="whitespace-nowrap">{domain.uniqueUsersCount} users</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-lg text-center">
                      <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                      <div className="font-semibold text-blue-700 dark:text-blue-300">{domain.mockInterviews}</div>
                      <div className="text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs leading-tight">Mock Interviews</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-2 sm:p-3 rounded-lg text-center">
                      <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
                      <div className="font-semibold text-green-700 dark:text-green-300">{domain.practiceSessions}</div>
                      <div className="text-green-600 dark:text-green-400 text-[10px] sm:text-xs leading-tight">Practice Sessions</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 sm:p-3 rounded-lg text-center">
                      <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                      <div className="font-semibold text-purple-700 dark:text-purple-300">{domain.uniqueUsersCount}</div>
                      <div className="text-purple-600 dark:text-purple-400 text-[10px] sm:text-xs leading-tight">Unique Users</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No domain data available yet.</p>
                  <p className="text-sm">Data will appear once users start using the platform.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">New Registrations</span>
                  <span className="font-medium">{todaysSummary.newRegistrations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Questions Generated</span>
                  <span className="font-medium">{todaysSummary.questionsGenerated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Mock Interviews Completed</span>
                  <span className="font-medium">{todaysSummary.mockInterviewsCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Active Users</span>
                  <span className="font-medium">{todaysSummary.totalActiveUsers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
