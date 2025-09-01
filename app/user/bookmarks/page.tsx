"use client"

import { useState } from "react"
import Link from "next/link"
import { Bookmark, BookmarkX, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { usePractice } from "@/contexts/PracticeContext"

export default function BookmarksPage() {
  const { user } = useAuth()
  const { bookmarks, removeBookmark } = usePractice()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDomain, setSelectedDomain] = useState("All")

  if (!user) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="text-center">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please log in to view your bookmarked questions.
            </p>
            <Link href="/login">
                <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredBookmarks = bookmarks.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDomain = selectedDomain === "All" || question.domain === selectedDomain
    return matchesSearch && matchesDomain
  })

  const domains = ["All", ...Array.from(new Set(bookmarks.map(q => q.domain)))]

  return (
    <div className="container py-8 max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">My Bookmarks</h1>
        <p className="text-muted-foreground">{bookmarks.length} questions saved</p>
      </div>

      {bookmarks.length === 0 ? (
        <Card className="text-center">
          <CardContent className="py-12">
            <Bookmark className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
            <p className="text-muted-foreground mb-4">Start practicing and bookmark questions to review them here.</p>
            <Link href="/practice"><Button>Start Practicing</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search bookmarks by title..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10 h-12" 
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => (
              <Badge 
                key={domain} 
                variant={selectedDomain === domain ? "default" : "outline"} 
                className="cursor-pointer px-4 py-2 text-sm" 
                onClick={() => setSelectedDomain(domain)}
              >
                {domain}
              </Badge>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredBookmarks.map((question) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{question.domain}</Badge>
                        <Badge 
                            variant={
                                question.difficulty === "Advanced" ? "destructive" : 
                                question.difficulty === "Intermediate" ? "default" : "outline"
                            }
                        >
                          {question.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{question.title}</CardTitle>
                      <CardDescription>{question.description}</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeBookmark(question.id)} 
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove bookmark"
                    >
                      <BookmarkX className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
