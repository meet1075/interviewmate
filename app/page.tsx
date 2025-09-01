import { BookOpen, Target, Trophy, Users, Bookmark, Twitter, Linkedin, Github, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// --- Data for Stats Section ---
const stats = [
  { icon: BookOpen, label: "Questions Practiced", value: "142" },
  { icon: Target, label: "Mock Interviews", value: "28" },
  { icon: Trophy, label: "Leaderboard Rank", value: "#12" },
  { icon: Users, label: "Peers Connected", value: "54" },
]

// --- Data for Testimonials Section (NEW) ---
const testimonials = [
    {
        name: "Sarah L.",
        avatar: "SL",
        title: "Software Engineer @ Google",
        quote: "This platform was a game-changer for my interview prep. The targeted questions and mock interviews gave me the confidence I needed to land my dream job."
    },
    {
        name: "David C.",
        avatar: "DC",
        title: "Product Manager @ Microsoft",
        quote: "I was able to connect with peers, get real-time feedback, and track my progress all in one place. Invaluable for anyone serious about their career."
    },
    {
        name: "Emily R.",
        avatar: "ER",
        title: "UX Designer @ Airbnb",
        quote: "The leaderboard feature brought a fun, competitive edge to studying. It pushed me to practice more consistently than any other tool I've used."
    },
]


export default function Home() {
  return (
    <div className="container mt-[-12px] space-y-22">
      {/* Hero + Stats Section (full screen) */}
      <section className="min-h-screen flex flex-col justify-center items-center space-y-12">
        {/* Hero */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Master Your <span className="text-primary">Interviews</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl">
            Practice domain-specific interview questions, simulate mock interviews,
            track progress, and compete with peers.
          </p>
          <div className="flex justify-center gap-6 mt-6">
            <Button size="lg" className="px-8 py-6 text-lg">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
              Learn More
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl pt-10">
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
      <section className="space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Explore Features</h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to ace your interviews
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-10">
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

      {/* --- NEW: Testimonials Section --- */}
      <section className="space-y-10">
        <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Loved by Professionals</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Hear what our users have to say about their success after using our platform.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-10">
            {testimonials.map((testimonial, idx) => (
                <Card key={idx} className="flex flex-col justify-between p-6">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <Avatar>
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${testimonial.name}`} />
                                <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{testimonial.name}</p>
                                <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            "{testimonial.quote}"
                        </p>
                    </div>
                </Card>
            ))}
        </div>
      </section>
      
      {/* --- NEW: Footer --- */}
      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-6 py-10 md:h-24 md:flex-row md:py-0 px-10">
            <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
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