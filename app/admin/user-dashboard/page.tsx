"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Trophy, TrendingUp, BookOpen, Star, Bookmark, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import { useToast } from "@/components/ui/use-toast"

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
  };
  skillProgress: Array<{
    skill: string;
    level: number;
    questions: number;
    averageRating: number;
  }>;
  recentActivity: Array<{
    type: string;
    title: string;
    date: string;
    domain?: string;
    difficulty?: string;
    rating?: number;
  }>;
  domainStats: Record<string, {
    totalRating: number;
    sessionCount: number;
  }>;
}

function AdminViewUserDashboard() {
  const { user: authUser, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const userId = searchParams.get('userId');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data for the specified user
  const fetchDashboardData = useCallback(async () => {
    if (!userId) {
      setError("No user ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/user/${userId}/dashboard`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError("Unauthorized to view this user's dashboard");
          return;
        }
        if (response.status === 404) {
          setError("User not found");
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError("Failed to load dashboard data");
      toast({ 
        title: "Error", 
        description: "Failed to load user dashboard", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Redirect if not an admin
  useEffect(() => {
    if (isLoaded && authUser?.publicMetadata?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (isLoaded && authUser?.publicMetadata?.role === 'admin') {
      fetchDashboardData();
    }
  }, [isLoaded, authUser, router, fetchDashboardData]);

  if (!isLoaded || loading) {
    return (
      <div className="container py-8 text-center">
        <p>Loading user dashboard...</p>
      </div>
    );
  }

  if (authUser?.publicMetadata?.role !== 'admin') {
    return (
      <div className="container py-8 text-center">
        <p>Access Denied</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 text-center">
        <p className="text-destructive">{error}</p>
        <Button 
          onClick={() => router.push('/admin/manageuser')} 
          className="mt-4"
        >
          Back to Manage Users
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container py-8 text-center">
        <p>No dashboard data available</p>
        <Button 
          onClick={() => router.push('/admin/manageuser')} 
          className="mt-4"
        >
          Back to Manage Users
        </Button>
      </div>
    );
  }

  const { user, stats, skillProgress, recentActivity } = dashboardData;

  return (
    <div className="w-full py-8 space-y-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/manageuser')}
          className="flex items-center space-x-2 self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Manage Users</span>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">User Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Viewing dashboard for: <span className="font-medium break-all">{user.email}</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="interview-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{stats.practiceQuestions}</h3>
              <p className="text-sm text-muted-foreground">Practice Questions</p>
              <p className="text-xs text-green-500">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="interview-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Star className="h-8 w-8 text-warning" />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{stats.mockInterviews}</h3>
              <p className="text-sm text-muted-foreground">Mock Interviews</p>
              <p className="text-xs text-blue-500">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="interview-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="h-8 w-8 text-accent-foreground" />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{stats.totalPoints}</h3>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-xs text-purple-500">Earned</p>
            </div>
          </CardContent>
        </Card>

        <Card className="interview-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Bookmark className="h-8 w-8 text-success" />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{stats.bookmarkedQuestions}</h3>
              <p className="text-sm text-muted-foreground">Bookmarked</p>
              <p className="text-xs text-orange-500">Questions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Skill Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skill Progress</CardTitle>
              <CardDescription>Performance across different domains</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {skillProgress.map((skill) => (
                <div key={skill.skill} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{skill.skill}</span>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{skill.questions} questions</span>
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
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-3 border-b border-border/40 last:border-0">
                  <div className="mt-1">
                    {activity.type === 'practice' ? (
                      <BookOpen className="h-4 w-4 text-primary" />
                    ) : (
                      <Star className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    {activity.domain && (
                      <p className="text-xs text-muted-foreground">{activity.domain}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                    {activity.rating && (
                      <Badge variant="outline" className="text-xs">
                        {activity.rating}/10
                      </Badge>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Wrap the component with Suspense boundary
export default function AdminViewUserDashboardPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center">Loading...</div>}>
      <AdminViewUserDashboard />
    </Suspense>
  );
}