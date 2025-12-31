import VinylLibrary from "@/components/VinylLibrary";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Vinyl Report
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Your Vinyl Library Manager
          </p>
        </header>
        <VinylLibrary />
      </div>
    </main>
  );
}


