"use client";

import { ThemeProvider } from "next-themes";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-background">
        {/* Simple layout without sidebar for now - Agent 2 will add full layout */}
        <main className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
