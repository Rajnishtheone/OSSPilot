"use client";

import { useEffect, useState } from "react";

const STATUS_MESSAGES = [
  "Establishing uplink to GitHub...",
  "Scanning open-source repositories...",
  "Cross-referencing skill signatures...",
  "Ranking candidate issues...",
  "Finalizing matches...",
];

export default function ScanningAnimation() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* pulsing rings */}
        <div className="absolute inset-0 rounded-full border border-emerald-500/40 scan-ring" />
        <div
          className="absolute inset-0 rounded-full border border-sky-500/40 scan-ring"
          style={{ animationDelay: "0.6s" }}
        />
        <div
          className="absolute inset-0 rounded-full border border-emerald-500/40 scan-ring"
          style={{ animationDelay: "1.2s" }}
        />

        {/* outer ring with sweep */}
        <div className="relative w-28 h-28 rounded-full border border-neutral-700 flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 scan-sweep"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(52,211,153,0.5) 40deg, transparent 90deg)",
            }}
          />
          {/* twinkling nodes representing repos */}
          <div className="absolute top-3 left-8 w-1.5 h-1.5 rounded-full bg-emerald-400 scan-star" />
          <div
            className="absolute bottom-5 right-4 w-1.5 h-1.5 rounded-full bg-sky-400 scan-star"
            style={{ animationDelay: "0.4s" }}
          />
          <div
            className="absolute bottom-8 left-4 w-1 h-1 rounded-full bg-neutral-400 scan-star"
            style={{ animationDelay: "0.9s" }}
          />

          {/* center core */}
          <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_16px_4px_rgba(52,211,153,0.5)]" />
        </div>
      </div>

      <div className="text-center">
        <p className="font-mono text-sm text-emerald-400 min-h-[1.5em]">
          {STATUS_MESSAGES[statusIndex]}
        </p>
        <p className="text-xs text-neutral-500 mt-1">This usually takes a few seconds</p>
      </div>
    </div>
  );
}