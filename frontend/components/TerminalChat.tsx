"use client";

import { useState, useRef, useEffect } from "react";
import {
  analyzeMessage,
  AnalyzeResponse,
  ExperienceLevel,
  SearchMode,
} from "@/lib/api";

type Step =
  | "ask_skills"
  | "ask_experience"
  | "ask_mode"
  | "ask_label"
  | "loading"
  | "clarify"
  | "done";

interface Line {
  kind: "system" | "user" | "agent" | "thinking";
  text: string;
}

const FAKE_THINKING_STEPS = [
  "> Reading your message...",
  "> Extracting technical skills...",
  "> Assessing confidence...",
  "> Querying GitHub repositories...",
  "> Scoring and ranking issues...",
];

const INITIAL_LINES: Line[] = [
  { kind: "system", text: "Welcome to OSSPilot." },
  { kind: "system", text: "Tell me your skills and interests to get started." },
];

export default function TerminalChat({
  onResult,
  onLoadingChange,
}: {
  onResult: (result: AnalyzeResponse | null) => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [lines, setLines] = useState<Line[]>(INITIAL_LINES);
  const [step, setStep] = useState<Step>("ask_skills");
  const [input, setInput] = useState("");
  const [rawMessage, setRawMessage] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel>("beginner");
  const [searchMode, setSearchMode] = useState<SearchMode>("skill");
  const [zeroMatches, setZeroMatches] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, step]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  function pushLine(line: Line) {
    setLines((prev) => [...prev, line]);
  }

  async function runAgent(message: string, label?: string) {
    setStep("loading");
    onResult(null);
    onLoadingChange?.(true);
    setZeroMatches(false);

    for (let i = 0; i < FAKE_THINKING_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 350));
      pushLine({ kind: "thinking", text: FAKE_THINKING_STEPS[i] });
    }

    try {
      const result = await analyzeMessage({
        message,
        experience_level: experience,
        search_mode: searchMode,
        search_label: label,
      });

      if (result.status === "needs_clarification") {
        pushLine({
          kind: "agent",
          text: result.clarify_question || "Can you tell me more?",
        });
        setStep("clarify");
        onLoadingChange?.(false);
      } else {
        const count = result.matched_issues.length;
        setZeroMatches(count === 0);
        pushLine({
          kind: "agent",
          text:
            count > 0
              ? `Found ${count} matching issues. Check the panel on the right.`
              : "No matching issues found right now. You can try again with different skills or a different search.",
        });
        setStep("done");
        onLoadingChange?.(false);
        onResult(result);
      }
    } catch (err) {
      pushLine({
        kind: "system",
        text: `Error: ${err instanceof Error ? err.message : "something went wrong"}`,
      });
      setStep("done");
      onLoadingChange?.(false);
    }
  }

  function handleSubmitText(e: React.FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;

    pushLine({ kind: "user", text: value });
    setInput("");

    if (step === "ask_skills") {
      setRawMessage(value);
      pushLine({ kind: "system", text: "What's your experience level?" });
      setStep("ask_experience");
    } else if (step === "ask_label") {
      pushLine({ kind: "system", text: `Searching label: ${value}` });
      runAgent(rawMessage, value);
    } else if (step === "clarify") {
      const combined = `${rawMessage}. ${value}`;
      setRawMessage(combined);
      runAgent(combined);
    }
  }

  function pickExperience(level: ExperienceLevel) {
    setExperience(level);
    pushLine({ kind: "user", text: level });
    pushLine({ kind: "system", text: "How do you want to find issues?" });
    setStep("ask_mode");
  }

  function pickMode(mode: SearchMode) {
    setSearchMode(mode);
    pushLine({
      kind: "user",
      text: mode === "skill" ? "Match by skills" : "Search a program label",
    });

    if (mode === "label") {
      pushLine({
        kind: "system",
        text: "Enter the label (e.g. gssoc25, hacktoberfest, or a custom one):",
      });
      setStep("ask_label");
    } else {
      runAgent(rawMessage);
    }
  }

  function retrySameMode() {
    setZeroMatches(false);
    if (searchMode === "label") {
      pushLine({
        kind: "system",
        text: "Enter a different label to try:",
      });
      setStep("ask_label");
    } else {
      pushLine({
        kind: "system",
        text: "Tell me your skills and interests again:",
      });
      setStep("ask_skills");
    }
  }

  function reset() {
    setLines(INITIAL_LINES);
    setStep("ask_skills");
    setRawMessage("");
    setInput("");
    setZeroMatches(false);
    onResult(null);
    onLoadingChange?.(false);
  }

  function handleReset() {
    if (lines.length > INITIAL_LINES.length) {
      const confirmed = window.confirm("Reset the conversation? This clears everything.");
      if (!confirmed) return;
    }
    reset();
  }

  const awaitingText = step === "ask_skills" || step === "ask_label" || step === "clarify";

  return (
    <div className="flex flex-col h-full bg-black border-r border-neutral-800">
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <span className="text-xs text-neutral-500 font-mono">osspilot — agent</span>
        <button
          onClick={handleReset}
          title="Reset conversation"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-neutral-700 text-neutral-400 hover:border-red-500 hover:text-red-400 transition-colors text-xs"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          Reset
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed space-y-2 terminal-scroll"
      >
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={
              line.kind === "user"
                ? "text-emerald-400"
                : line.kind === "thinking"
                ? "text-neutral-500"
                : line.kind === "agent"
                ? "text-sky-400"
                : "text-neutral-300"
            }
          >
            {line.kind === "user" ? "> " : line.kind === "thinking" ? "" : "$ "}
            {line.text}
          </div>
        ))}

        {step === "ask_experience" && (
          <div className="flex gap-2 pt-2">
            {(["beginner", "intermediate", "advanced"] as ExperienceLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => pickExperience(lvl)}
                className="px-3 py-1 rounded border border-neutral-700 text-neutral-300 hover:border-emerald-500 hover:text-emerald-400 text-xs"
              >
                {lvl}
              </button>
            ))}
          </div>
        )}

        {step === "ask_mode" && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => pickMode("skill")}
              className="px-3 py-1 rounded border border-neutral-700 text-neutral-300 hover:border-emerald-500 hover:text-emerald-400 text-xs"
            >
              Match by skills
            </button>
            <button
              onClick={() => pickMode("label")}
              className="px-3 py-1 rounded border border-neutral-700 text-neutral-300 hover:border-emerald-500 hover:text-emerald-400 text-xs"
            >
              Search program label
            </button>
          </div>
        )}

        {awaitingText && (
          <form onSubmit={handleSubmitText} className="flex items-center pt-1">
            <span className="text-emerald-400 mr-1">{">"}</span>
            <input
              ref={inputRef}
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-transparent outline-none font-mono text-[13px] text-neutral-200 caret-emerald-400 flex-1"
            />
          </form>
        )}

        {step === "done" && (
          <div className="flex gap-2 pt-2">
            {zeroMatches && (
              <button
                onClick={retrySameMode}
                className="px-3 py-1 rounded border border-emerald-700 text-emerald-400 hover:border-emerald-500 hover:text-emerald-300 text-xs"
              >
                {searchMode === "label" ? "Try a different label" : "Try different skills"}
              </button>
            )}
            <button
              onClick={reset}
              className="px-3 py-1 rounded border border-neutral-700 text-neutral-300 hover:border-emerald-500 hover:text-emerald-400 text-xs"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}