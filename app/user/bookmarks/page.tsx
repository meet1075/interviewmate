"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bookmark, BookmarkX, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { usePractice } from "@/contexts/PracticeContext"
import { useUser } from "@clerk/nextjs"

export default function BookmarksPage() {
  const { user } = useUser()
  const { bookmarks, removeBookmark, loadBookmarks } = usePractice()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDomain, setSelectedDomain] = useState("All")
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [availableDomains, setAvailableDomains] = useState<string[]>([])

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

  // Update available domains when bookmarks change
  useEffect(() => {
    const uniqueDomains = Array.from(new Set(bookmarks.map(q => q.domain)))
    setAvailableDomains(["All", ...uniqueDomains])
  }, [bookmarks])

  const domains = availableDomains

  const toggleExpanded = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  useEffect(() => {
    if (user) {
      loadBookmarks()
    }
  }, [user])

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
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleExpanded(question.id)}
                        className="text-xs"
                      >
                        {expandedQuestions.has(question.id) ? "Hide Answer" : "Show Answer"}
                      </Button>
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
                  </div>
                </CardHeader>

                {/* Expanded content with answer and hints */}
                {expandedQuestions.has(question.id) && (
                  <CardContent className="space-y-4">
                    {/* Answer */}
                    {question.answer && (
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">💡 Answer</h4>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.answer}</p>
                      </div>
                    )}

                    {/* Hints */}
                    {question.hints && question.hints.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">💭 Hints</h4>
                        <ul className="space-y-1">
                          {question.hints.map((hint, index) => (
                            <li key={index} className="text-sm flex items-start space-x-2">
                              <span className="text-blue-500 font-bold">•</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
