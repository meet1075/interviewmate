import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { PracticeProvider } from "@/contexts/PracticeContext";
import { MockInterviewProvider } from "@/contexts/MockInterviewContext";
import { ClerkProvider } from '@clerk/nextjs';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InterviewMate",
  description: "Master your next interview.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={geistSans.variable}>
          <ThemeProvider
              defaultTheme="system"
              storageKey="interview-mate-theme"
            >
            {/* The custom AuthProvider is no longer needed */}
            <MockInterviewProvider>
              <PracticeProvider>
                <Navbar />
                <main>{children}</main>
              </PracticeProvider>
            </MockInterviewProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

// import type { Metadata } from "next";
// import { Geist } from "next/font/google";
// import "./globals.css";
// import { Navbar } from "@/components/layout/navbar";
// import { AuthProvider } from "@/contexts/AuthContext"; // 1. Import the provider
// import { ThemeProvider } from "@/components/theme-provider";
// import { PracticeProvider } from "@/contexts/PracticeContext";
// import { MockInterviewProvider } from "@/contexts/MockInterviewContext";
// import {
//   ClerkProvider,
//   SignInButton,
//   SignUpButton,
//   SignedIn,
//   SignedOut,
//   UserButton,
// } from '@clerk/nextjs'
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "InterviewMate",
//   description: "Master your next interview.",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body className={geistSans.variable}>
//         {/* 2. Wrap your components with AuthProvider */}
//         <ThemeProvider
//             defaultTheme="system"
//             storageKey="interview-mate-theme"
//           >
//         <AuthProvider>
//         <MockInterviewProvider>
//           <PracticeProvider>
//           <Navbar />
//           <main>{children}</main>
//           </PracticeProvider>
//           </MockInterviewProvider>
//         </AuthProvider>
//         </ThemeProvider>

//       </body>
//     </html>
//   );
// }