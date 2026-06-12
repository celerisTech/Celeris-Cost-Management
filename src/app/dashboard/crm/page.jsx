"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "../../store/useAuthScreenStore";
import Link from "next/link";
import FollowupsOverviewModal from "../components/FollowupsOverviewModal";
import {
  Target, MapPin, CreditCard, TrendingUp, Users, Calendar,
  ArrowRight, AlertCircle, CheckCircle2, Clock, IndianRupee,
  BarChart3, ChevronRight, Phone, Building2, Eye, Star
} from "lucide-react";

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

export default function CRMDashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowupsModalOpen, setIsFollowupsModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => { 
    try {
      setLoading(true);
      const res = await fetch("/api/sales-leads?type=dashboard");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {};
  const followups = data?.pendingFollowups || [];
  const topExecs = data?.topExecutives || [];

  const statCards = [
    {
      label: "Total Leads",
      value: fmt(stats.total_leads),
      icon: Target,
      gradient: "from-blue-50 to-white",
      border: "border-blue-100",
      accent: "border-blue-500",
      textColor: "text-blue-900",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      link: "/dashboard/crm/leads"
    },
    {
      label: "New Leads",
      value: fmt(stats.new_leads),
      icon: Star,
      gradient: "from-indigo-50 to-white",
      border: "border-indigo-100",
      accent: "border-indigo-500",
      textColor: "text-indigo-900",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      link: "/dashboard/crm/leads?status=New+Lead"
    },
    {
      label: "Today's Visits",
      value: fmt(data?.todayVisits),
      icon: MapPin,
      gradient: "from-violet-50 to-white",
      border: "border-violet-100",
      accent: "border-violet-500",
      textColor: "text-violet-900",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      link: "/dashboard/crm/visits"
    },
    {
      label: "Pending Followups",
      value: fmt(stats.pending_followups),
      icon: Clock,
      gradient: "from-amber-50 to-white",
      border: "border-amber-100",
      accent: "border-amber-500",
      textColor: "text-amber-900",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      link: "/dashboard/crm/visits"
    },
    {
      label: "Converted",
      value: fmt(stats.converted_leads),
      icon: CheckCircle2,
      gradient: "from-emerald-50 to-white",
      border: "border-emerald-100",
      accent: "border-emerald-500",
      textColor: "text-emerald-900",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      link: "/dashboard/crm/leads?status=Converted"
    },
    {
      label: "Not Interested",
      value: fmt(stats.rejected_leads),
      icon: AlertCircle,
      gradient: "from-rose-50 to-white",
      border: "border-rose-100",
      accent: "border-rose-500",
      textColor: "text-rose-900",
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      link: "/dashboard/crm/visits?status=Not Interested"
    },
    {
      label: "Total Collection",
      value: fmtCurrency(data?.totalCollection),
      icon: IndianRupee,
      gradient: "from-green-50 to-white",
      border: "border-green-100",
      accent: "border-green-500",
      textColor: "text-green-900",
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      link: "/dashboard/crm/payments"
    },
    {
      label: "Pending Payments",
      value: fmtCurrency(data?.pendingPayments),
      icon: CreditCard,
      gradient: "from-orange-50 to-white",
      border: "border-orange-100",
      accent: "border-orange-500",
      textColor: "text-orange-900",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      link: "/dashboard/crm/payments?status=Pending"
    },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-2 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-indigo-600" />
            Sales Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sales pipeline overview & performance metrics</p>
        </div>
      </div>

      {/* Urgent Alerts Section */}
      {(data?.pendingFollowups?.length > 0 || stats.pending_followups > 0) && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 animate-pulse">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900">Urgent Actions Required</h3>
              <p className="text-xs text-red-700">
                You have <span className="font-bold">{stats.pending_followups}</span> overdue follow-ups and
                <span className="font-bold"> {fmtCurrency(data?.pendingPayments)}</span> pending in collections.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsFollowupsModalOpen(true)}
              className="w-full text-center px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5" /> Follow-ups
            </button>
            <div className="flex gap-2 w-full md:w-auto">
              <Link href="/dashboard/crm/visits" className="flex-1 md:flex-none text-center px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all shadow-sm">
                View Follow-ups
              </Link>
              <Link href="/dashboard/crm/payments" className="flex-1 md:flex-none text-center px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-all">
                Check Payments
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Link
            key={i}
            href={card.link}
            className={`
              group relative p-3 rounded-xl border-l-4 
              bg-gradient-to-br ${card.gradient} ${card.border} ${card.accent}
              shadow-sm hover:shadow-md transition-all duration-300 
              hover:translate-y-[-2px]
            `}
            style={{
              animation: `fadeIn 0.5s ease-out ${i * 50}ms forwards`,
              opacity: 0
            }}
          >
            {/* Header Content */}
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-bold ${card.textColor} tracking-widest uppercase mb-1`}>
                  {card.label}
                </p>
                <p className={`text-xl md:text-2xl font-black ${card.textColor} leading-none`}>
                  {card.value}
                </p>
              </div>

              {/* Icon Container */}
              <div className={`p-2 rounded-xl ${card.iconBg} ${card.iconColor} transition-transform group-hover:scale-110`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>

          </Link>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Pending Followups */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" /> Pending Followups
            </h2>
            <Link href="/dashboard/crm/visits" className="text-xs text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                <tr>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100">#</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100">Client Name</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100">Company</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100 text-center">Followup Date</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100">Executive</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {followups.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-400">
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-300 opacity-50" />
                      <p className="text-sm font-medium">All caught up! No pending followups.</p>
                    </td>
                  </tr>
                ) : (
                  followups.map((f, i) => (
                    <tr key={i} className="group hover:bg-blue-50/50 transition-colors even:bg-slate-50/30">
                      <td className="px-4 py-2 text-xs text-gray-400 font-mono border-b border-r border-gray-100">{i + 1}</td>
                      <td className="px-4 py-2 text-xs font-semibold text-gray-900 border-b border-r border-gray-100 truncate max-w-[150px]">
                        {f.CM_Client_Name}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600 border-b border-r border-gray-100 truncate max-w-[150px]">
                        {f.CM_Company_Name || "—"}
                      </td>
                      <td className="px-4 py-2 text-[11px] text-center font-medium border-b border-r border-gray-100">
                        {(() => {
                          if (!f.CM_Next_Followup_Date) return "—";
                          const fDate = new Date(f.CM_Next_Followup_Date);
                          fDate.setHours(0, 0, 0, 0);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isPast = fDate < today;
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                                <Calendar className="h-3 w-3" />
                                {fDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                              </span>
                              <span className={`text-[9px] uppercase tracking-wider font-bold ${isPast ? 'text-red-500' : 'text-blue-500'}`}>
                                {isPast ? "Not Visited" : "Next Follow-up"}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600 border-b border-r border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                            {(f.Executive_Name || "U")[0]}
                          </div>
                          <span className="truncate">{f.Executive_Name || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center border-b border-gray-100">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[f.CM_Visit_Status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {f.CM_Visit_Status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <FollowupsOverviewModal
        isOpen={isFollowupsModalOpen}
        onClose={() => setIsFollowupsModalOpen(false)}
      />
    </div>
  );
}
