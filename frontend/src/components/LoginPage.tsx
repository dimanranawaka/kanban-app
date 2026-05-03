'use client';

import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#032147] via-[#209dd7] to-[#753991] flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-10 h-72 w-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 h-96 w-96 bg-white/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl p-8 space-y-8">
          <div className="space-y-3 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#209dd7] to-[#753991] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h1 className="font-display text-4xl font-bold text-[#032147]">Kanban Studio</h1>
            <p className="text-[#888888]">Organize your workflow with style</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
