"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useReCaptcha } from "@/hooks/useReCaptcha";
import ThemeToggle from "@/components/ThemeToggle";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  const { executeRecaptcha } = useReCaptcha(siteKey);

  // Debug: Log site key status
  useEffect(() => {
    if (!siteKey) {
      console.error("[login] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set!");
    } else {
      console.log("[login] reCAPTCHA site key is set:", siteKey.substring(0, 10) + "...");
    }
  }, [siteKey]);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess(true);
    }
    if (searchParams.get("passwordReset") === "true") {
      setPasswordReset(true);
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      // Preserve vinylId param if it exists
      const vinylId = searchParams.get("vinylId");
      if (vinylId) {
        router.push(`/?vinylId=${encodeURIComponent(vinylId)}`);
        return;
      }
      // Preserve owner/ownerId params if they exist
      const owner = searchParams.get("owner");
      const ownerId = searchParams.get("ownerId");
      if (owner && ownerId) {
        router.push(`/?owner=${encodeURIComponent(owner)}&ownerId=${encodeURIComponent(ownerId)}`);
      } else {
        router.push("/");
      }
    }
  }, [status, session, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Execute reCAPTCHA
      let recaptchaToken: string | null = null;
      if (siteKey) {
        try {
          console.log("[login] Attempting to execute reCAPTCHA...");
          recaptchaToken = await executeRecaptcha("login");
          if (!recaptchaToken) {
            console.error("[login] reCAPTCHA token is null");
            setError("reCAPTCHA verification failed. Please try again.");
            setLoading(false);
            return;
          }
          console.log("[login] reCAPTCHA token obtained successfully");
        } catch (recaptchaError) {
          console.error("[login] reCAPTCHA error:", recaptchaError);
          setError("reCAPTCHA verification failed. Please try again.");
          setLoading(false);
          return;
        }
      } else {
        console.error("[login] reCAPTCHA site key is not set!");
        if (process.env.NODE_ENV === "production") {
          setError("reCAPTCHA configuration error. Please contact support.");
          setLoading(false);
          return;
        }
      }

      // Verify reCAPTCHA and credentials via custom API
      const verifyResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrUsername,
          password,
          recaptchaToken: recaptchaToken || undefined,
        }),
      });

      if (!verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        setError(verifyData.error || "Invalid email/username or password");
        setLoading(false);
        return;
      }

      // If verification succeeds, proceed with NextAuth signIn
      const result = await signIn("credentials", {
        emailOrUsername,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email/username or password");
        setLoading(false);
      } else if (result?.ok) {
        // Preserve owner/ownerId params if they exist
        const owner = searchParams.get("owner");
        const ownerId = searchParams.get("ownerId");
        if (owner && ownerId) {
          window.location.href = `/?owner=${encodeURIComponent(owner)}&ownerId=${encodeURIComponent(ownerId)}`;
        } else {
          window.location.href = "/";
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center mb-6">
        <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
          <h1 className="font-bold text-slate-900 dark:text-slate-100 mb-1" style={{ fontSize: '3rem' }}>
            Vinyl Report
          </h1>
        </Link>
        <p className="text-slate-600 dark:text-slate-400 text-[1.4rem]">
          Mind the wax
        </p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Login
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Sign in to your Vinyl Report account
        </p>

        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded text-green-700 dark:text-green-300 text-sm">
            Account created successfully! Please sign in.
          </div>
        )}
        {passwordReset && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded text-green-700 dark:text-green-300 text-sm">
            Password reset successfully! Please sign in with your new password.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email or Username
            </label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              placeholder="Enter your email or username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#534AD3' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4338A8')}
            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#534AD3')}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Ce site est protégé par reCAPTCHA
        </p>

        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-sm hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            style={{ color: 'rgb(83 74 211)' }}
          >
            Forgot your password?
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            style={{ color: 'rgb(83 74 211)' }}
          >
            Sign up
          </Link>
        </p>

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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-8">
          <p className="text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

