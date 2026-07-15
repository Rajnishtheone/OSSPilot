"use client";

import { useState } from "react";
import TerminalChat from "@/components/TerminalChat";
import IssueDashboard from "@/components/IssueDashboard";
import ThemeToggle from "@/components/ThemeToggle";
import { AnalyzeResponse } from "@/lib/api";

export default function Home() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  return (
    <main className="h-screen w-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            OP
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">
              OSS<span className="text-emerald-500">Pilot</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5 hidden sm:block">
              Contributor onboarding &amp; issue matchmaking agent
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0">
        <div className="h-full min-h-0">
          <TerminalChat onResult={setResult} onLoadingChange={setIsSearching} />
        </div>
        <div className="h-full min-h-0 border-t md:border-t-0 border-neutral-200 dark:border-neutral-800">
          <IssueDashboard result={result} isSearching={isSearching} />
        </div>
      </div>
    </main>
  );
}