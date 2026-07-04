"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Presentation,
  Search,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");
const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function ExecutivePerformancePage() {
  const router = useRouter();
  const [executives, setExecutives] = useState([]);
  const [salaryEmployees, setSalaryEmployees] = useState([]);
  const [salaryTotals, setSalaryTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchPerformance = async (startDate = "", endDate = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ type: "executive-performance" });
      if (startDate) params.set("fromDate", startDate);
      if (endDate) params.set("toDate", endDate);

      const res = await fetch(`/api/sales-leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load executive performance");
      const data = await res.json();
      setExecutives(data.executives || []);
    } catch (error) {
      console.error(error);
      setExecutives([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryReport = async (startDate = "", endDate = "") => {
    try {
      const selectedDate = startDate || endDate || new Date().toISOString().slice(0, 10);
      const parsed = selectedDate ? new Date(selectedDate) : new Date();
      const month = String(parsed.getMonth() + 1);
      const year = String(parsed.getFullYear());

      const params = new URLSearchParams({ month, year });
      const res = await fetch(`/api/salary-report?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load salary report");

      const data = await res.json();
      setSalaryEmployees(data.employees || []);
      setSalaryTotals(data.totals || {});
    } catch (error) {
      console.error(error);
      setSalaryEmployees([]);
      setSalaryTotals({});
    }
  };

  useEffect(() => {
    fetchPerformance(fromDate, toDate);
    fetchSalaryReport(fromDate, toDate);
  }, [fromDate, toDate]);

  const filteredExecutives = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return executives;

    return executives.filter((item) => {
      const name = (item.executive_name || "").toLowerCase();
      return name.includes(query);
    });
  }, [executives, searchTerm]);

  const totalLeads = filteredExecutives.reduce((sum, item) => sum + (item.total_leads || 0), 0);
  const totalDemos = filteredExecutives.reduce((sum, item) => sum + (item.demo_count || 0), 0);
  const totalProposals = filteredExecutives.reduce((sum, item) => sum + (item.proposal_sent_count || 0), 0);
  const totalConversions = filteredExecutives.reduce((sum, item) => sum + (item.converted_count || 0), 0);
  const totalRejected = filteredExecutives.reduce((sum, item) => sum + (item.not_interested_count || 0), 0);
  const totalVisits = filteredExecutives.reduce((sum, item) => sum + (item.visit_count || 0), 0);
  const totalFollowUps = filteredExecutives.reduce((sum, item) => sum + (item.followup_count || 0), 0);

  const chartData = useMemo(() => {
    return filteredExecutives
      .slice()
      .sort((a, b) => (b.total_leads || 0) - (a.total_leads || 0))
      .slice(0, 8)
      .map((item) => ({
        name: item.executive_name || "Unassigned",
        Leads: Number(item.total_leads || 0),
        Demos: Number(item.demo_count || 0),
        Proposals: Number(item.proposal_sent_count || 0),
        Converted: Number(item.converted_count || 0),
        Rejected: Number(item.not_interested_count || 0),
        Visits: Number(item.visit_count || 0),
        Followups: Number(item.followup_count || 0),
      }));
  }, [filteredExecutives]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push("/dashboard/crm")}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Executive Performance</h1>
              <p className="text-sm text-slate-600">Track lead, demo, proposal, conversion and rejection counts by executive.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <CalendarDays size={16} className="text-slate-500" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <CalendarDays size={16} className="text-slate-500" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
            <button
              onClick={() => fetchPerformance(fromDate, toDate)}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7 mb-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Leads</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(totalLeads)}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Users size={18} /></div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Demos</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(totalDemos)}</p>
              </div>
              <div className="rounded-lg bg-violet-50 p-2 text-violet-600"><Presentation size={18} /></div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Proposals Sent</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(totalProposals)}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600"><FileText size={18} /></div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Converted</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(totalConversions)}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><CheckCircle2 size={18} /></div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rejected / Not Interested</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(totalRejected)}</p>
              </div>
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600"><XCircle size={18} /></div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visits</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(totalVisits)}</p>
              </div>
              <div className="rounded-lg bg-cyan-50 p-2 text-cyan-600"><BarChart3 size={18} /></div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Follow-ups</p>
                <p className="text-2xl font-bold text-slate-800">{formatNumber(totalFollowUps)}</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2 text-orange-600"><FileText size={18} /></div>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Performance Graph</h2>
              <p className="text-sm text-slate-500">Bar and line views for executive leads, demos, proposals, conversions, rejections, visits and follow-ups</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-indigo-700">
              <BarChart3 size={16} />
              <span className="text-sm font-semibold">Executive Insights</span>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
              No chart data available for the selected range.
            </div>
          ) : (
            <div className="space-y-8 text-gray-800">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="Leads" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Demos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Proposals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Converted" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Visits" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Line type="monotone" dataKey="Leads" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Demos" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Proposals" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Converted" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Visits" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Followups" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Executive Breakdown</h2>
              <p className="text-sm text-slate-500">Sorted by total leads</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search executive"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Loading performance data...
              </div>
            </div>
          ) : filteredExecutives.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center px-4 text-center text-slate-500">
              No executive performance data found for the selected range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Executive</th>
                    <th className="px-4 py-3 text-center">Leads</th>
                    <th className="px-4 py-3 text-center">Demo</th>
                    <th className="px-4 py-3 text-center">Proposal</th>
                    <th className="px-4 py-3 text-center">Convert</th>
                    <th className="px-4 py-3 text-center">Rejected</th>
                    <th className="px-4 py-3 text-center">Visits</th>
                    <th className="px-4 py-3 text-center">Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExecutives.map((item, index) => (
                    <tr key={item.executive_id || index} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.executive_name || "Unassigned"}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{formatNumber(item.total_leads)}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{formatNumber(item.demo_count)}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{formatNumber(item.proposal_sent_count)}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{formatNumber(item.converted_count)}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{formatNumber(item.not_interested_count)}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{formatNumber(item.visit_count)}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{formatNumber(item.followup_count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
