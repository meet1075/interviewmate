"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { Trophy, Medal, User as UserIcon, Target, Star, Download, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LeaderboardUser {
  _id: string
  clerkId: string
  userName: string
  firstName: string
  lastName: string
  profileImage: string
  totalPoints: number
  practiceSessionsCompleted: number
  mockInterviewsCompleted: number
  rank: number
  createdAt: string
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[]
  currentUserRank: number | null
  pagination: {
    currentPage: number
    totalPages: number
    totalUsers: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export default function AdminLeaderboardPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const fetchLeaderboard = async (page: number = 1, limit: number = 50) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/leaderboard?page=${page}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      const data = await response.json()
      setLeaderboardData(data)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportLeaderboard = async () => {
    try {
      // Fetch all data for export
      const response = await fetch(`/api/leaderboard?page=1&limit=1000`)
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard for export')
      }
      const data = await response.json()
      
      // Convert to CSV
      const csvContent = [
        ['Rank', 'Username', 'Full Name', 'Total Points', 'Practice Sessions', 'Mock Interviews', 'Join Date'].join(','),
        ...data.leaderboard.map((user: LeaderboardUser) => [
          user.rank,
          user.userName,
          `"${user.firstName} ${user.lastName}"`,
          user.totalPoints,
          user.practiceSessionsCompleted,
          user.mockInterviewsCompleted,
          new Date(user.createdAt).toLocaleDateString()
        ].join(','))
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leaderboard-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting leaderboard:', error)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchLeaderboard(currentPage, pageSize)
    }
  }, [isLoaded, isSignedIn, currentPage, pageSize])

  if (!isLoaded) {
    return (
      <div className="w-full py-8 text-center px-4 sm:px-6">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="w-full py-8 text-center space-y-6 px-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Please log in to view the admin leaderboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />
    return <span className="h-6 w-6 flex items-center justify-center text-sm font-bold">#{rank}</span>
  }

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default"
    if (rank === 2) return "secondary"
    if (rank === 3) return "outline"
    return "outline"
  }

  if (isLoading) {
    return (
      <div className="w-full py-8 text-center px-4 sm:px-6">
        <p>Loading leaderboard...</p>
      </div>
    )
  }

  return (
    <div className="w-full py-8 space-y-6 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <span>Admin Leaderboard</span>
          </h1>
          <p className="text-muted-foreground">Monitor user engagement and competition</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportLeaderboard} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{leaderboardData?.pagination.totalUsers || 0}</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Star className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {leaderboardData?.leaderboard.reduce((acc, user) => acc + user.totalPoints, 0).toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {leaderboardData?.leaderboard.reduce((acc, user) => acc + user.practiceSessionsCompleted, 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">Practice Sessions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {leaderboardData?.leaderboard.reduce((acc, user) => acc + user.mockInterviewsCompleted, 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">Mock Interviews</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Rankings</CardTitle>
          <CardDescription>
            Detailed view of all users ranked by total points earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboardData?.leaderboard.map((user) => (
              <div
                key={user._id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  user.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12">
                    {getRankIcon(user.rank)}
                  </div>
                  <Avatar className="h-12 w-12">
                    <Image
                      src={user.profileImage}
                      alt={`${user.firstName} ${user.lastName}`}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      <Badge variant={getRankBadgeVariant(user.rank)} className="text-xs">
                        @{user.userName}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>{user.practiceSessionsCompleted} practice</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <UserIcon className="h-3 w-3" />
                        <span>{user.mockInterviewsCompleted} interviews</span>
                      </span>
                      <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-primary">
                      {user.totalPoints.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>

          {leaderboardData && leaderboardData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                disabled={!leaderboardData.pagination.hasPrevPage}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Page {leaderboardData.pagination.currentPage} of {leaderboardData.pagination.totalPages}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({leaderboardData.pagination.totalUsers} total users)
                </span>
              </div>

              <Button
                variant="outline"
                disabled={!leaderboardData.pagination.hasNextPage}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}