"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

export default function HeroCTA() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  const handleGetStarted = () => {
    try {
      if (isSignedIn) {
        router.push("/user/practice");
      } else {
        router.push("/sign-in");
      }
    } catch (e) {
      // fallback
      router.push("/sign-in");
    }
  };

  const handleLearnMore = () => {
    const el = document.getElementById("features-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <Button size="lg" className="px-8 py-6 text-lg" onClick={handleGetStarted}>
        Get Started
      </Button>
      <Button size="lg" variant="outline" className="px-8 py-6 text-lg" onClick={handleLearnMore}>
        Learn More
      </Button>
    </>
  );
}
