"use client";

import { useState } from "react";
import { testAiConnection } from "@/lib/api";

export default function AiTestPage() {
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    try {
      const data = await testAiConnection();
      setResponse(data.message);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--stroke)] bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary-blue)] to-[var(--secondary-purple)] shadow-lg">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--navy-dark)]">AI Connection Test</h1>
            <p className="text-sm text-[var(--gray-text)]">Verify OpenAI API</p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-[var(--stroke)] bg-[var(--surface)] p-4 text-sm text-[var(--gray-text)]">
          This test will send the prompt: <br/>
          <strong className="text-[var(--navy-dark)]">"What is 2+2?"</strong><br/>
          to the <code className="rounded bg-black/5 px-1 py-0.5">gpt-4o-mini</code> model.
        </div>

        <button
          onClick={handleTest}
          disabled={isLoading}
          className="w-full rounded-xl bg-gradient-to-r from-[var(--primary-blue)] to-[var(--secondary-purple)] px-4 py-3 font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Connecting to AI..." : "Test AI Connection"}
        </button>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <strong className="block font-bold">Connection Failed</strong>
            {error}
          </div>
        )}

        {response && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm">
            <strong className="block font-bold">AI Response:</strong>
            <p className="mt-2 whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
