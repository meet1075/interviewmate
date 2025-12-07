"use client";

import { useState } from "react";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock Sign-In component to replace the one from "@clerk/nextjs"
const MockSignIn = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md">
      <div className="shadow-2xl bg-card border border-border/50 w-full rounded-lg p-6 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Sign in to InterviewMate</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Welcome back! Please enter your details.
          </p>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3 mb-6">
           <Button variant="outline" className="w-full border-border/50 hover:bg-muted/50">Continue with Google</Button>
           <Button variant="outline" className="w-full border-border/50 hover:bg-muted/50">Continue with GitHub</Button>
        </div>

        <div className="flex items-center my-6">
            <div className="flex-grow border-t border-border/50"></div>
            <span className="mx-4 text-xs uppercase text-muted-foreground">or</span>
            <div className="flex-grow border-t border-border/50"></div>
        </div>

        {/* Form */}
        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="email">
              Email address
            </label>
            <Input id="email" type="email" placeholder="name@company.com" className="bg-background border-border/50 focus:ring-primary/50 focus:border-primary" />
          </div>
          <div className="space-y-2">
             <label className="text-sm font-medium text-muted-foreground" htmlFor="password">
              Password
            </label>
            <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-background border-border/50 focus:ring-primary/50 focus:border-primary pr-10" />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-primary-foreground text-sm normal-case">
            Sign In
          </Button>
        </form>

        <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <a href="/register" className="font-semibold text-primary hover:text-primary/80">
                    Sign up
                </a>
            </p>
        </div>
      </div>
    </div>
  );
};


export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center w-full">
        {/* Logo and App Name */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600">
            <BookOpen className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 text-transparent bg-clip-text">
            InterviewMate
          </span>
        </div>

        {/* Mock Sign-In Component */}
        <MockSignIn />

      </div>
    </div>
  );
}

