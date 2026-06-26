"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Target, MapPin, CreditCard, TrendingUp, Users, Calendar,
  ArrowLeft, AlertCircle, CheckCircle2, Clock, IndianRupee,
  BarChart3, ChevronRight, Phone, Building2, Star, FileText,
  SlidersHorizontal, ChevronDown, Check, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtCurrency = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });

const STATUS_COLORS = {
  "New Lead": "bg-blue-100 text-blue-700",
  "Follow-up Call": "bg-teal-100 text-teal-700",
  "Visited": "bg-indigo-100 text-indigo-700",
  "Demo Given": "bg-purple-100 text-purple-700",
  "Proposal Sent": "bg-amber-100 text-amber-700",
  "Negotiation": "bg-orange-100 text-orange-700",
  "Converted": "bg-emerald-100 text-emerald-700",
  "Rejected": "bg-red-100 text-red-700",
  "On Hold": "bg-gray-100 text-gray-600",
};

// Helper for date logic matching page.jsx
const getDateRange = (type, custom = {}) => {
  const today = new Date();
  let from = null;
  let to = today;

  switch (type) {
    case "This Month":
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "Last Month":
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      to = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      break;
    case "This Quarter":
      const currentQuarter = Math.floor(today.getMonth() / 3);
      from = new Date(today.getFullYear(), currentQuarter * 3, 1);
      break;
    case "This Six Months":
      const currentHalf = Math.floor(today.getMonth() / 6);
      from = new Date(today.getFullYear(), currentHalf * 6, 1);
      break;
    case "This Year":
      from = new Date(today.getFullYear(), 0, 1);
      break;
    case "Last Year":
      from = new Date(today.getFullYear() - 1, 0, 1);
      to = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    case "All Time":
      from = "";
      to = "";
      break;
    case "Custom Month":
      if (custom.month !== undefined && custom.year) {
        from = new Date(custom.year, custom.month, 1);
        to = new Date(custom.year, parseInt(custom.month) + 1, 0, 23, 59, 59, 999);
      }
      break;
    case "Custom Quarter":
      if (custom.quarter !== undefined && custom.year) {
        from = new Date(custom.year, custom.quarter * 3, 1);
        to = new Date(custom.year, (custom.quarter + 1) * 3, 0, 23, 59, 59, 999);
      }
      break;
    case "Custom Six Months":
      if (custom.half !== undefined && custom.year) {
        from = new Date(custom.year, custom.half * 6, 1);
        to = new Date(custom.year, (custom.half + 1) * 6, 0, 23, 59, 59, 999);
      }
      break;
    case "Custom Year":
      if (custom.year) {
        from = new Date(custom.year, 0, 1);
        to = new Date(custom.year, 11, 31, 23, 59, 59, 999);
      }
      break;
    case "Custom Date":
      if (custom.fromDate) from = new Date(custom.fromDate);
      if (custom.toDate) to = new Date(custom.toDate);
      break;
    default:
      break;
  }

  const fmtDate = (d) => {
    if (!d) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    fromDate: from ? fmtDate(from) : "",
    toDate: to ? fmtDate(to) : ""
  };
};

function ComparisonPanel({ title, defaultFilter, defaultCustomRange, onDataLoaded }) {
  const [filterType, setFilterType] = useState(defaultFilter);
  const [customRange, setCustomRange] = useState(defaultCustomRange);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async (from = "", to = "") => {
    try {
      setLoading(true);
      let url = "/api/sales-leads?type=dashboard";
      if (from) url += `&fromDate=${from}`;
      if (to) url += `&toDate=${to}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (onDataLoaded) onDataLoaded(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isCustom = ["Custom Month", "Custom Quarter", "Custom Six Months", "Custom Year", "Custom Date"].includes(filterType);
    if (filterType === "Custom Month" && (customRange.month === undefined || !customRange.year)) return;
    if (filterType === "Custom Quarter" && (customRange.quarter === undefined || !customRange.year)) return;
    if (filterType === "Custom Six Months" && (customRange.half === undefined || !customRange.year)) return;
    if (filterType === "Custom Year" && !customRange.year) return;
    if (filterType === "Custom Date" && (!customRange.fromDate || !customRange.toDate)) return;

    const { fromDate: from, toDate: to } = getDateRange(filterType, customRange);
    fetchDashboardData(from, to);
  }, [filterType, customRange]);

  const chartData = useMemo(() => {
    if (!data?.trend) return [];

    // All Time: group by year
    if (filterType === "All Time") {
      const yearlyMap = {};
      data.trend.forEach(item => {
        if (!item.date) return;
        const d = new Date(item.date);
        const yr = d.getFullYear();
        if (isNaN(yr)) return;
        if (!yearlyMap[yr]) {
          yearlyMap[yr] = {
            name: String(yr),
            "Total Leads": 0,
            "Proposals Sent": 0,
            "Converted": 0
          };
        }
        yearlyMap[yr]["Total Leads"] += Number(item.total_leads || 0);
        yearlyMap[yr]["Proposals Sent"] += Number(item.proposal_sent || 0);
        yearlyMap[yr]["Converted"] += Number(item.converted_leads || 0);
      });
      return Object.values(yearlyMap).sort((a, b) => a.name.localeCompare(b.name));
    }

    // Quarter, Six Months, Year filters: group by month
    const isMonthly = [
      "This Year", "Last Year", "Custom Year",
      "This Quarter", "Custom Quarter",
      "This Six Months", "Custom Six Months"
    ].includes(filterType);

    if (isMonthly) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyMap = {};

      data.trend.forEach(item => {
        const d = new Date(item.date);
        const mIdx = d.getMonth();
        if (mIdx >= 0 && mIdx < 12) {
          if (!monthlyMap[mIdx]) {
            monthlyMap[mIdx] = {
              name: months[mIdx],
              "Total Leads": 0,
              "Proposals Sent": 0,
              "Converted": 0,
              monthIdx: mIdx
            };
          }
          monthlyMap[mIdx]["Total Leads"] += Number(item.total_leads || 0);
          monthlyMap[mIdx]["Proposals Sent"] += Number(item.proposal_sent || 0);
          monthlyMap[mIdx]["Converted"] += Number(item.converted_leads || 0);
        }
      });
      return Object.values(monthlyMap).sort((a, b) => a.monthIdx - b.monthIdx);
    }

    // Month filters (This Month, Last Month, Custom Month): show day-wise
    return data.trend.map(item => {
      const d = new Date(item.date);
      const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      return {
        name: label,
        "Total Leads": Number(item.total_leads || 0),
        "Proposals Sent": Number(item.proposal_sent || 0),
        "Converted": Number(item.converted_leads || 0)
      };
    });
  }, [data?.trend, filterType]);

  const stats = data?.stats || {};
  const followups = data?.pendingFollowups || [];

  const getDropdownLabel = () => {
    if (filterType === "Custom Month") return "Selected Month";
    if (filterType === "Custom Quarter") return "Selected Quarter";
    if (filterType === "Custom Six Months") return "Selected 6 Months";
    if (filterType === "Custom Year") return "Selected Year";
    return filterType;
  };

  return (
    <div className="bg-white rounded-sm border border-slate-200 p-2 space-y-4 shadow-sm flex flex-col flex-1">
      {/* Header with Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <h3 className="font-bold text-slate-800 text-base">{title}</h3>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg shadow-sm border border-slate-200"
            >
              {getDropdownLabel()}
              <ChevronDown size={12} className="text-slate-500" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-[250px] overflow-y-auto">
                {[
                  { label: "This Month", value: "This Month" },
                  { label: "Last Month", value: "Last Month" },
                  { label: "This Quarter", value: "This Quarter" },
                  { label: "This Six Months", value: "This Six Months" },
                  { label: "This Year", value: "This Year" },
                  { label: "Last Year", value: "Last Year" },
                  { label: "All Time", value: "All Time" },
                  { label: "divider" },
                  { label: "Selected Month", value: "Custom Month" },
                  { label: "Selected Quarter", value: "Custom Quarter" },
                  { label: "Selected 6 Months", value: "Custom Six Months" },
                  { label: "Selected Year", value: "Custom Year" },
                  { label: "Custom Date", value: "Custom Date" },
                ].map((option, idx) => (
                  option.label === "divider" ? (
                    <div key={idx} className="border-t border-slate-200 my-1" />
                  ) : (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterType(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${filterType === option.value ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {option.label}
                    {filterType === option.value && <Check size={12} className="text-blue-600" />}
                  </button>
                  )
                ))}
              </div>
            )}
          </div>

          {filterType === "Custom Date" && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customRange.fromDate || ""}
                onChange={(e) => setCustomRange(prev => ({ ...prev, fromDate: e.target.value }))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold shadow-sm focus:outline-none"
              />
              <span className="text-[10px] font-bold text-slate-400">TO</span>
              <input
                type="date"
                value={customRange.toDate || ""}
                onChange={(e) => setCustomRange(prev => ({ ...prev, toDate: e.target.value }))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold shadow-sm focus:outline-none"
              />
            </div>
          )}

          {filterType === "Custom Month" && (
            <div className="flex items-center gap-1">
              <select
                value={customRange.year}
                onChange={(e) => setCustomRange(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold shadow-sm focus:outline-none"
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={customRange.month}
                onChange={(e) => setCustomRange(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold shadow-sm focus:outline-none"
              >
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === "Custom Quarter" && (
            <div className="flex items-center gap-1">
              <select
                value={customRange.year}
                onChange={(e) => setCustomRange(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold shadow-sm focus:outline-none"
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={customRange.quarter}
                onChange={(e) => setCustomRange(prev => ({ ...prev, quarter: parseInt(e.target.value) }))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold shadow-sm focus:outline-none"
              >
                {["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"].map((q, idx) => (
                  <option key={idx} value={idx}>{q}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === "Custom Six Months" && (
            <div className="flex items-center gap-1">
              <select
                value={customRange.year}
                onChange={(e) => setCustomRange(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold shadow-sm focus:outline-none"
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={customRange.half}
                onChange={(e) => setCustomRange(prev => ({ ...prev, half: parseInt(e.target.value) }))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold shadow-sm focus:outline-none"
              >
                {["H1 (Jan-Jun)", "H2 (Jul-Dec)"].map((h, idx) => (
                  <option key={idx} value={idx}>{h}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === "Custom Year" && (
            <div className="flex items-center gap-1">
              <select
                value={customRange.year}
                onChange={(e) => setCustomRange(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold shadow-sm focus:outline-none"
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "New Leads", value: fmt(stats.new_leads), color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
              { label: "Proposals Sent", value: fmt(stats.proposal_sent), color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
              { label: "Converted", value: fmt(stats.converted_leads), color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
              { label: "Collection", value: fmtCurrency(data?.totalCollection), color: "text-green-700", bg: "bg-green-50 border-green-100" },
            ].map((card, i) => (
              <div key={i} className={`p-2 rounded-sm border ${card.bg}`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
                <p className={`text-base font-black ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Visual Trend Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Trends Overview</h4>
            <div className="h-48 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No data available for this range
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="Total Leads" fill="#4F46E5" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Proposals Sent" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Converted" fill="#10B981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);

  const prevMonthDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return {
      month: d.getMonth(),
      quarter: Math.floor(d.getMonth() / 3),
      half: Math.floor(d.getMonth() / 6),
      year: d.getFullYear(),
      fromDate: "",
      toDate: ""
    };
  }, []);

  const curMonthDate = useMemo(() => {
    const d = new Date();
    return {
      month: d.getMonth(),
      quarter: Math.floor(d.getMonth() / 3),
      half: Math.floor(d.getMonth() / 6),
      year: d.getFullYear(),
      fromDate: "",
      toDate: ""
    };
  }, []);

  // Comparison metrics calculations
  const comparisonStats = useMemo(() => {
    if (!data1 || !data2) return null;
    const s1 = data1.stats || {};
    const s2 = data2.stats || {};

    const diffPercent = (v1, v2) => {
      if (!v2) return v1 ? 100 : 0;
      return Math.round(((v1 - v2) / v2) * 100);
    };

    return {
      leadsDiff: diffPercent(s1.total_leads, s2.total_leads),
      newLeadsDiff: diffPercent(s1.new_leads, s2.new_leads),
      convertedDiff: diffPercent(s1.converted_leads, s2.converted_leads),
      collectionDiff: diffPercent(data1.totalCollection, data2.totalCollection),
    };
  }, [data1, data2]);

  return (
    <div className="p-4 md:p-6 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/crm")}
          className="p-3 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors border border-slate-200 shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
            Sales Range Comparison
          </h1>
        </div>
      </div>

      {/* Split Views */}
      <div className="grid grid-row-1 lg:grid-row-2 gap-6 items-start text-gray-800">
        <ComparisonPanel
          title="Section 1 (Current Period)"
          defaultFilter="This Month"
          defaultCustomRange={curMonthDate}
          onDataLoaded={setData1}
        />
        <ComparisonPanel
          title="Section 2 (Comparison Period)"
          defaultFilter="Last Month"
          defaultCustomRange={prevMonthDate}
          onDataLoaded={setData2}
        />
      </div>
    </div>
  );
}
