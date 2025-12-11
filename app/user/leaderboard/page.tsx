"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { Trophy, Medal, User as UserIcon, Target, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"

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

export default function LeaderboardPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchLeaderboard = async (page: number = 1) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/leaderboard?page=${page}&limit=20`)
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

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchLeaderboard(currentPage)
    }
  }, [isLoaded, isSignedIn, currentPage])

  if (!isLoaded) {
    return (
      <div className="w-[70%] mx-auto py-8 text-center px-4 sm:px-6">
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
              Please log in to view the leaderboard and see your ranking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/sign-in">
              <Button>Login to Continue</Button>
            </Link>
          </CardContent>
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
      <div className="w-[70%] mx-auto py-8 text-center px-4 sm:px-6">
        <p>Loading leaderboard...</p>
      </div>
    )
  }

  return (
    <div className="w-full lg:w-[70%] mx-auto py-4 sm:py-8 space-y-6 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center space-x-2">
          <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
          <span>Leaderboard</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">Compete with others and climb the ranks!</p>
      </div>

      {leaderboardData?.currentUserRank && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Your Ranking</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg">You are currently ranked</span>
              <Badge variant="default" className="text-lg px-4 py-2">
                #{leaderboardData.currentUserRank}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>
            Rankings based on total points earned from practice and mock interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboardData?.leaderboard.map((user) => (
              <div
                key={user._id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 rounded-lg border ${
                  user.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                    {getRankIcon(user.rank)}
                  </div>
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                    <Image
                      src={user.profileImage}
                      alt={`${user.firstName} ${user.lastName}`}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      <Badge variant={getRankBadgeVariant(user.rank)} className="text-xs">
                        @{user.userName}
                      </Badge>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                      <span className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>{user.practiceSessionsCompleted} practice</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <UserIcon className="h-3 w-3" />
                        <span>{user.mockInterviewsCompleted} interviews</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end sm:text-right sm:ml-4">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      {user.totalPoints.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground sm:hidden">points</p>
                </div>
              </div>
            ))}
          </div>

          {leaderboardData && leaderboardData.pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
              <Button
                variant="outline"
                disabled={!leaderboardData.pagination.hasPrevPage}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="w-full sm:w-auto"
                size="sm"
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Page {leaderboardData.pagination.currentPage} of {leaderboardData.pagination.totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                disabled={!leaderboardData.pagination.hasNextPage}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-full sm:w-auto"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Point System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Practice Sessions</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Beginner: 10 points</li>
                <li>Intermediate: 15 points</li>
                <li>Advanced: 20 points</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Mock Interviews</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Beginner: 20 + rating bonus</li>
                <li>Intermediate: 30 + rating bonus</li>
                <li>Advanced: 40 + rating bonus</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}