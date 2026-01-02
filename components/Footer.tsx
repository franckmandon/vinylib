import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-200 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <p>© 2025 Vinyl Report, Mind the wax.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <Link
              href="/terms-of-service"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <Link
              href="/cookie-policy"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

