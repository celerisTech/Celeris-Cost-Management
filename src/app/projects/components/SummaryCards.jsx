"use client";
import { useRouter } from "next/navigation";

export default function SummaryCards({ data }) {
  const router = useRouter();
  const {
    totalProjects = 0,
    activeProjects = 0,
    completedProjects = 0,
    totalBudget = 0,
    inProgressProjects = 0,
    plannedProjects = 0,
    onHoldProjects = 0,
    cancelledProjects = 0,
    totalActualCost = 0,
    budgetVariance = 0
  } = data || {};

  // Helper function to format budget with proper units
  const formatBudget = (amount) => {
    if (!amount || amount === 0) return '₹0';
    const absAmount = Math.abs(amount);
    const formatter = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 1,
      notation: 'compact',
      compactDisplay: 'short'
    });
    return `₹${formatter.format(absAmount)}`;
  };

  const getBudgetTrendBadge = () => {
    if (budgetVariance > 0) return { label: "Over", bg: "bg-rose-50 text-rose-700 border-rose-200" };
    if (budgetVariance < 0) return { label: "Under", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    return { label: "On Track", bg: "bg-purple-50 text-purple-700 border-purple-200" };
  };

  const budgetTrend = getBudgetTrendBadge();

  return (
    <div className="w-full mb-2 sm:mb-3">
      {/* COMPACT UNIFIED GRID CARD CONTAINER */}
      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200/80 shadow-sm p-2 sm:p-2.5 transition-all duration-200">
        <div className="grid grid-cols-3 divide-x divide-gray-100 items-center">
          
          {/* SECTION 1: TOTAL PROJECTS */}
          <div 
            onClick={() => router.push("/projects")}
            className="px-2 sm:px-3 py-1 flex flex-col justify-center cursor-pointer group hover:bg-blue-50/40 rounded-l-md transition-colors min-w-0"
          >
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <h3 className="text-[10px] sm:text-xs font-bold text-blue-900 tracking-wider truncate uppercase">
                Total Projects
              </h3>
              {totalProjects > 0 && (
                <span className="hidden min-[400px]:inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium flex-shrink-0">
                  +12%
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-1">
              <p className="text-sm sm:text-base md:text-lg font-bold text-blue-950 leading-tight">
                {totalProjects}
              </p>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-blue-50 flex items-center justify-center text-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                📊
              </div>
            </div>
          </div>

          {/* SECTION 2: ACTIVE PROJECTS */}
          <div className="px-2 sm:px-3 py-1 flex flex-col justify-center group hover:bg-emerald-50/40 transition-colors min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <h3 className="text-[10px] sm:text-xs font-bold text-emerald-900 tracking-wider truncate uppercase">
                Active Projects
              </h3>
              {activeProjects > 0 && (
                <span className="hidden min-[400px]:inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium flex-shrink-0">
                  +8%
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-1">
              <p className="text-sm sm:text-base md:text-lg font-bold text-emerald-950 leading-tight">
                {activeProjects}
              </p>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-emerald-50 flex items-center justify-center text-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                ⚡
              </div>
            </div>
          </div>

          {/* SECTION 3: BUDGET */}
          <div 
            onClick={() => router.push("/expenses")}
            className="px-2 sm:px-3 py-1 flex flex-col justify-center cursor-pointer group hover:bg-violet-50/40 rounded-r-md transition-colors min-w-0"
          >
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <h3 className="text-[10px] sm:text-xs font-bold text-violet-900 tracking-wider truncate uppercase">
                Budget
              </h3>
              <span className={`hidden min-[400px]:inline-block text-[9px] px-1.5 py-0.5 rounded-full font-medium border flex-shrink-0 ${budgetTrend.bg}`}>
                {budgetTrend.label}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <p className="text-sm sm:text-base md:text-lg font-bold text-violet-950 leading-tight truncate">
                {formatBudget(totalBudget)}
              </p>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-violet-50 flex items-center justify-center text-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                💰
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}