import { BookOpen, Target, Trophy, Users, Bookmark, Twitter, Linkedin, Github, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import HeroCTA from "../components/hero-cta"

// --- Data for Stats Section ---
const stats = [
  { icon: BookOpen, label: "Questions Practiced", value: "142" },
  { icon: Target, label: "Mock Interviews", value: "28" },
  { icon: Trophy, label: "Leaderboard Rank", value: "#12" },
  { icon: Users, label: "Peers Connected", value: "54" },
]

// (Testimonials removed per request)


export default function Home() {
  return (
    <div className="w-full mt-[-12px] space-y-16 lg:space-y-20">
      {/* Hero + Stats Section (full screen) */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 min-h-screen flex flex-col justify-center items-center space-y-12">
        {/* Hero */}
          <div className="text-center space-y-6 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Master Your <span className="text-primary">Interviews</span>
          </h1>
          <p className="text-muted-foreground mx-auto text-lg md:text-xl">
            Practice domain-specific interview questions, simulate mock interviews,
            track progress, and compete with peers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-6">
            <HeroCTA />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 w-full max-w-6xl pt-10">
          {stats.map((stat, idx) => (
            <Card key={idx} className="text-center py-10 shadow-lg">
              <stat.icon className="h-10 w-10 mx-auto text-primary mb-4" />
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
              <CardDescription className="text-base">{stat.label}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section (scrolls into view) */}
      <section id="features-section" className="container max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Explore Features</h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to ace your interviews
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <Card className="interview-card group cursor-pointer transition-all duration-300 hover:shadow-hover">
            <CardHeader className="space-y-3">
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Practice Questions</CardTitle>
              <CardDescription>
                Generate domain-specific practice sets tailored to your learning goals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80">
                Start Practicing →
              </Button>
            </CardContent>
          </Card>

          <Card className="interview-card group cursor-pointer transition-all duration-300 hover:shadow-hover">
            <CardHeader className="space-y-3">
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Mock Interview</CardTitle>
              <CardDescription>
                Simulate real interviews with timed sessions and instant feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80">
                Take Interview →
              </Button>
            </CardContent>
          </Card>

          <Card className="interview-card group cursor-pointer transition-all duration-300 hover:shadow-hover">
            <CardHeader className="space-y-3">
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Leaderboard</CardTitle>
              <CardDescription>
                Track your performance against others and climb the rankings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80">
                View Rankings →
              </Button>
            </CardContent>
          </Card>

          <Card className="interview-card group cursor-pointer transition-all duration-300 hover:shadow-hover">
            <CardHeader className="space-y-3">
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Bookmark className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Bookmarks</CardTitle>
              <CardDescription>
                Save important questions and create your personalized study collection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80">
                My Bookmarks →
              </Button>
            </CardContent>
          </Card>

          <Card className="interview-card group cursor-pointer transition-all duration-300 hover:shadow-hover">
            <CardHeader className="space-y-3">
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Performance Dashboard</CardTitle>
              <CardDescription>
                Analyze trends and progress over time with detailed insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80">
                View Dashboard →
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

    {/* Testimonials removed per user request */}
      
      {/* --- NEW: Footer --- */}
      <footer className="border-t">
        <div className="container max-w-7xl mx-auto flex flex-col items-center justify-between gap-6 py-10 md:h-24 md:flex-row md:py-0 px-4 sm:px-6">
            <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    © {new Date().getFullYear()} InterviewMaster. All Rights Reserved.
                </p>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                    <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                    <Linkedin className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                    <Github className="h-5 w-5" />
                </Button>
            </div>
        </div>
      </footer>
    </div>
  )
}