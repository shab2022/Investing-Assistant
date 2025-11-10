'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Sign up successful! Check your email to verify your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden text-gray-100">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/investing-bg.jpg')", // add this image in /public
        }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-slate-950/90 to-slate-900/80" />

      {/* Subtle glow accents */}
      <div className="pointer-events-none absolute -top-40 -right-32 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500/10 blur-3xl rounded-full" />

      {/* Main glass card */}
      <div className="relative w-full max-w-xl mx-4">
        <div className="rounded-3xl border border-slate-700/70 bg-slate-900/55 backdrop-blur-2xl shadow-[0_20px_70px_rgba(15,23,42,0.9)] px-10 py-10">
          {/* Brand */}
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
              AI INVESTING PLATFORM
            </div>
            <h1 className="mt-2 text-4xl font-semibold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Investing Assistant
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-md">
              Connect your portfolio, monitor the markets, and get AI-powered insights
              tailored to your holdings.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1 text-slate-200"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700/80
                          text-sm text-slate-100 placeholder-slate-500
                          focus:outline-none focus:ring-2 focus:ring-cyan-500/80 focus:border-cyan-400/80"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1 text-slate-200"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-700/80
                          text-sm text-slate-100 placeholder-slate-500
                          focus:outline-none focus:ring-2 focus:ring-cyan-500/80 focus:border-cyan-400/80"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-950/40 border border-red-700/40 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl text-sm font-semibold
                        bg-gradient-to-r from-blue-600 to-cyan-500
                        hover:from-blue-500 hover:to-cyan-400
                        text-white shadow-lg shadow-cyan-900/40
                        flex items-center justify-center gap-2
                        disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading && (
                <span className="h-4 w-4 border-2 border-transparent border-t-white rounded-full animate-spin" />
              )}
              {loading
                ? 'Authenticating...'
                : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don’t have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
