"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import UserMenu from "@/components/UserMenu";

export default function ContactPage() {
  const { data: session } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          firstName, 
          lastName, 
          email, 
          companyName, 
          country, 
          message 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send message. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setCompanyName("");
      setCountry("");
      setMessage("");
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setError("An unexpected error occurred. Please try again later.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
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
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full p-8">
        {success ? (
          <div className="text-center">
            <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg">
              <div className="flex justify-center mb-4">
                <svg
                  className="w-16 h-16 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                Email Sent Successfully!
              </h3>
              <p className="text-green-700 dark:text-green-300 mb-4">
                Thank you for contacting us. Your message has been sent to{" "}
                <span className="font-semibold">contact@vinyl.report</span>.
              </p>
              <p className="text-green-700 dark:text-green-300">
                We&apos;ll get back to you as soon as possible.
              </p>
            </div>
            <button
              onClick={() => {
                setSuccess(false);
                setError("");
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Contact Us
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Have a question or feedback? We&apos;d love to hear from you!
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doe"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Company"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Country
            </label>
            <input
              type="text"
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Country"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              How can I help
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us how we can help you..."
              disabled={isSubmitting}
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {message.length}/5000 characters
            </p>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            By submitting your details, you confirm that you would like to receive marketing emails from Vinyl Report and you agree to the storing and processing of your personal data by Vinyl Report as described in our{" "}
            <Link
              href="/privacy-policy"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
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

