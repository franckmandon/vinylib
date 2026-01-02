"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import UserMenu from "@/components/UserMenu";

export default function TermsOfServicePage() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Vinyl Report
                </h1>
              </Link>
              <p className="text-slate-600 dark:text-slate-400 text-[1.4rem]">
                Mind the wax
              </p>
            </div>
            {session?.user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Browse All
                </Link>
                <UserMenu />
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-1 sm:gap-2">
                <Link
                  href="/login"
                  className="px-2 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-2 py-1.5 sm:px-4 sm:py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                >
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </header>

        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
            Last updated: January 2025
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                By accessing and using Vinyl Report (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                2. Description of Service
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Vinyl Report is a platform that allows users to:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>Manage and organize their vinyl record collections</li>
                <li>Share collection information with other users</li>
                <li>Discover new music and connect with other collectors</li>
                <li>Access album information and metadata</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                3. User Accounts
              </h2>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                3.1 Account Creation
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                To use certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information as necessary</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                3.2 Account Termination
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                You may delete your account at any time. We reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                4. User Content
              </h2>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                4.1 Your Content
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                You retain ownership of any content you submit to the Service. By submitting content, you grant us a license to use, display, and distribute your content on the platform.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                4.2 Prohibited Content
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                You agree not to submit content that:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>Is illegal, harmful, or violates any laws</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains malware, viruses, or malicious code</li>
                <li>Is spam, fraudulent, or misleading</li>
                <li>Harasses, abuses, or threatens others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                5. Intellectual Property
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                The Service and its original content, features, and functionality are owned by Vinyl Report and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Album artwork and metadata displayed on the platform are used for informational purposes and may be subject to third-party copyrights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                6. Prohibited Uses
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                You may not use the Service:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>In any way that violates applicable laws or regulations</li>
                <li>To transmit any malicious code or viruses</li>
                <li>To attempt to gain unauthorized access to the Service</li>
                <li>To interfere with or disrupt the Service</li>
                <li>To scrape or harvest data without permission</li>
                <li>For any commercial purpose without our written consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                7. Service Availability
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                We strive to provide reliable service but do not guarantee that the Service will be available at all times. We may experience downtime for maintenance, updates, or unforeseen circumstances.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                To the maximum extent permitted by law, Vinyl Report shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                9. Indemnification
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                You agree to defend, indemnify, and hold harmless Vinyl Report from any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                10. Changes to Terms
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of significant changes. Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                11. Governing Law
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                12. Contact Information
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                If you have any questions about these Terms of Service, please contact us through our platform.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

