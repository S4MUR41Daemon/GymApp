import type { Metadata } from "next";
import { Barlow_Condensed, Geist, Geist_Mono, Inter, Rajdhani } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/shell/BottomNav";
import { ParticleCanvas } from "@/components/shell/ParticleCanvas";
import { TopBar } from "@/components/shell/TopBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "Ausin Lifting",
  description: "Track your workouts.",
  icons: { icon: "/images/icon.png" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  return (
    <html
      lang="en"
      className={cn(
        "h-full dark",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
        rajdhani.variable,
        barlow.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <ParticleCanvas />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            {userId && <TopBar />}
            <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
            {userId && <BottomNav />}
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
