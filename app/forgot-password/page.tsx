"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset email");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (error) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Vinyl Report
          </h1>
        </Link>
        <p className="text-slate-600 dark:text-slate-400 text-[1.4rem]">
          Mind the wax
        </p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Forgot Password
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded text-green-700 dark:text-green-300">
              <p className="font-semibold mb-2">Email sent!</p>
              <p className="text-sm">
                If an account exists with this email address, you will receive a link to reset your password.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your.email@example.com"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to login
          </Link>
        </div>

        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

