"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";
import Image from "next/image";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalVinyls: number;
  estimatedValue: number;
  totalInvested: number;
  collectionStartDate: string | null;
  collectionAgeMonths: number;
  currentStreak: number;
  highestValue: number;
  lowestValue: number;
  averageValue: number;
  valueOverTime: Array<{ month: string; value: number }>;
  addedThisMonth: number;
  acquisitionsByMonth: Array<{ month: string; count: number }>;
  investmentsByMonth: Array<{ month: string; amount: number }>;
  latestAdditions: Array<{
    id: string;
    artist: string;
    album: string;
    albumArt?: string;
    addedAt: string;
  }>;
  genreDistribution: Array<{ genre: string; count: number }>;
  decadeDistribution: Array<{ decade: string; count: number }>;
  conditionDistribution: Array<{ condition: string; count: number }>;
  topLabels: Array<{ label: string; count: number }>;
  topArtists: Array<{ artist: string; count: number }>;
  discographyStatus: Array<{
    artist: string;
    owned: number;
    missing: number;
    isComplete: boolean;
  }>;
  rarestVinyl: {
    id: string;
    artist: string;
    album: string;
    ownerCount: number;
  } | null;
  rarityDistribution: Array<{ rarity: string; count: number }>;
  releaseYearTimeline: Array<{ year: number; count: number }>;
  estimatedWeight: number;
  estimatedLength: number;
  missingCoverArt: number;
  missingDescription: number;
  missingData: Array<{ id: string; artist: string; album: string; missingFields: string[] }>;
  badges: {
    collector: { level: number; name: string };
    treasureHunter: { level: number; name: string };
    timeTraveler: boolean;
    completionist: { level: number; name: string };
  };
}

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard");
      console.log("[dashboard] Response status:", response.status);
      
      if (response.ok) {
        const data: DashboardStats = await response.json();
        console.log("[dashboard] Data received:", data);
        setStats(data);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("[dashboard] Error response:", errorData);
        setError(errorData.error || `Failed to load dashboard data (${response.status})`);
      }
    } catch (error) {
      console.error("[dashboard] Error fetching dashboard stats:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewVinyl = (vinylId: string) => {
    router.push(`/?vinylId=${vinylId}`);
  };

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'rgb(83 74 211)' }}></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            {session?.user && (
              <div className="flex items-center justify-end gap-3 mb-4 md:hidden">
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
            )}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="font-bold text-slate-900 dark:text-slate-100 mb-1" style={{ fontSize: '3rem' }}>
                    Vinyl Report
                  </h1>
                </Link>
                <p className="text-slate-600 dark:text-slate-400 text-[1.4rem]">
                  My Dashboard
                </p>
              </div>
              {session?.user && (
                <div className="hidden md:flex items-center gap-3">
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
              )}
            </div>
          </header>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchStats}
              className="px-6 py-3 text-white rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#534AD3' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338A8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#534AD3'}
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            {session?.user && (
              <div className="flex items-center justify-end gap-3 mb-4 md:hidden">
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
            )}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="font-bold text-slate-900 dark:text-slate-100 mb-1" style={{ fontSize: '3rem' }}>
                    Vinyl Report
                  </h1>
                </Link>
                <p className="text-slate-600 dark:text-slate-400 text-[1.4rem]">
                  My Dashboard
                </p>
              </div>
              {session?.user && (
                <div className="hidden md:flex items-center gap-3">
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
              )}
            </div>
          </header>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">No data available</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          {session?.user && (
            <div className="flex items-center justify-end gap-3 mb-4 md:hidden">
              <ThemeToggle />
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
          )}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="font-bold text-slate-900 dark:text-slate-100 mb-1" style={{ fontSize: '3rem' }}>
                  Vinyl Report
                </h1>
              </Link>
              <p className="text-slate-600 dark:text-slate-400 text-[1.4rem]">
                My Dashboard
              </p>
            </div>
            {session?.user && (
              <div className="hidden md:flex items-center gap-3">
                <ThemeToggle />
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
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Vinyls</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.totalVinyls}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Estimated Value</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">€{stats.estimatedValue.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Collection Age</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.collectionAgeMonths} months</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Current Streak</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.currentStreak} days</p>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Value & Investment</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Value Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Highest Value:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">€{stats.highestValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Lowest Value:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">€{stats.lowestValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Average Value:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">€{stats.averageValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Invested:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">€{stats.totalInvested.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Value Over Time</h3>
              {stats.valueOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.valueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b"
                      tick={{ fill: "#64748b" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#64748b"
                      tick={{ fill: "#64748b" }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1e293b", 
                        border: "1px solid #334155",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number | undefined) => value !== undefined ? [`€${value.toFixed(2)}`, "Value"] : ["", "Value"]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-12">No data available</p>
              )}
            </div>
          </div>

          {stats.investmentsByMonth.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Investments By Month</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.investmentsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    tick={{ fill: "#64748b" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fill: "#64748b" }}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1e293b", 
                      border: "1px solid #334155",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number | undefined) => value !== undefined ? [`€${value.toFixed(2)}`, "Investment"] : ["", "Investment"]}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Acquisition</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Acquisition Rate</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Added This Month:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.addedThisMonth} vinyls</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Acquisitions By Month</h3>
              {stats.acquisitionsByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.acquisitionsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b"
                      tick={{ fill: "#64748b" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#64748b"
                      tick={{ fill: "#64748b" }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1e293b", 
                        border: "1px solid #334155",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-12">No data available</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Latest Additions</h3>
            {stats.latestAdditions.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
                {stats.latestAdditions.map((vinyl) => (
                  <button
                    key={vinyl.id}
                    onClick={() => handleViewVinyl(vinyl.id)}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 hover:opacity-80 transition-opacity"
                  >
                    {vinyl.albumArt ? (
                      <Image
                        src={vinyl.albumArt}
                        alt={`${vinyl.artist} - ${vinyl.album}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs text-center p-2">
                        {vinyl.artist} - {vinyl.album}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">No recent additions</p>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Distributions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.genreDistribution.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">By Genre</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.genreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.genre} ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.genreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {stats.decadeDistribution.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">By Decade</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.decadeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.decade} ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.decadeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {stats.conditionDistribution.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">By Condition</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.conditionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.condition} ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.conditionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {stats.topLabels.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Top 10 Labels</h3>
              <div className="space-y-2">
                {stats.topLabels.map((item, index) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      {index + 1}. {item.label}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Artists & Discographies</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.topArtists.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Top 10 Artists</h3>
                <div className="space-y-2">
                  {stats.topArtists.map((item, index) => (
                    <div key={item.artist} className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">
                        {index + 1}. {item.artist}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{item.count} albums</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.discographyStatus.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Discography Status</h3>
                <div className="space-y-3">
                  {stats.discographyStatus.map((item) => (
                    <div key={item.artist} className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-slate-900 dark:text-slate-100 font-medium">{item.artist}</span>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.owned} owned
                          {item.missing > 0 && `, ${item.missing} missing`}
                        </p>
                      </div>
                      {item.isComplete && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold rounded">
                          Complete
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Rarity</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.rarestVinyl && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Rarest Vinyl</h3>
                <div className="space-y-2">
                  <p className="text-slate-900 dark:text-slate-100 font-medium">
                    {stats.rarestVinyl.artist} - {stats.rarestVinyl.album}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Owned by {stats.rarestVinyl.ownerCount} {stats.rarestVinyl.ownerCount === 1 ? "collector" : "collectors"}
                  </p>
                </div>
              </div>
            )}

            {stats.rarityDistribution.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Rarity Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.rarityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.rarity} ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.rarityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {stats.releaseYearTimeline.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Release Year Timeline</h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.releaseYearTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.3} />
                  <XAxis 
                    dataKey="year" 
                    stroke="#64748b"
                    tick={{ fill: "#64748b" }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fill: "#64748b" }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1e293b", 
                      border: "1px solid #334155",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="count" fill="#ec4899" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 text-center">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Collector</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{stats.badges.collector.name}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 text-center">
              <div className="text-4xl mb-2">💎</div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Treasure Hunter</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{stats.badges.treasureHunter.name}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 text-center">
              <div className="text-4xl mb-2">⏰</div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Time Traveler</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {stats.badges.timeTraveler ? "Unlocked" : "Locked"}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Completionist</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{stats.badges.completionist.name}</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Fun Facts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <p className="text-slate-600 dark:text-slate-400 mb-2">Estimated Weight</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.estimatedWeight} kg
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <p className="text-slate-600 dark:text-slate-400 mb-2">Estimated Length</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.estimatedLength} meters
              </p>
            </div>
          </div>
        </section>

        {(stats.missingCoverArt > 0 || stats.missingDescription > 0 || stats.missingData.length > 0) && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">To Do</h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 mb-1">Missing Cover Art</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.missingCoverArt}</p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400 mb-1">Missing Description</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.missingDescription}</p>
                </div>
              </div>
              {stats.missingData.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Vinyls with Missing Data</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {stats.missingData.map((item) => (
                      <div key={item.id} className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex-1">
                          <p className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                            {item.artist} - {item.album}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Missing: {item.missingFields.join(", ")}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewVinyl(item.id)}
                          className="ml-4 px-3 py-1 text-white text-xs rounded transition-colors"
                          style={{ backgroundColor: '#534AD3' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338A8'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#534AD3'}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

