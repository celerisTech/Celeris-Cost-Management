"use client";

import { useEffect, useState, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { useRouter } from "next/navigation";
import {
    Calendar as CalendarIcon,
    Search,
    Filter,
    Loader2,
    ArrowLeft,
    User,
    MapPin,
    Star,
    Phone,
    Building2
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Link from "next/link";
import React, { forwardRef } from "react";

const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <button type="button" onClick={onClick} ref={ref} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:border-blue-400 transition-colors whitespace-nowrap">
        <CalendarIcon size={14} className="text-blue-500" />
        <span>{value}</span>
    </button>
));

export default function TodayReportPage() {
    const router = useRouter();
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState("leads");
    
    const [leads, setLeads] = useState([]);
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [filterEngineer, setFilterEngineer] = useState("All");

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const from = format(startDate, "yyyy-MM-dd");
            const to = format(endDate, "yyyy-MM-dd");

            const [leadsRes, visitsRes] = await Promise.all([
                fetch(`/api/sales-leads?limit=500&fromDate=${from}&toDate=${to}`),
                fetch(`/api/sales-visits?limit=500&fromDate=${from}&toDate=${to}`)
            ]);

            if (leadsRes.ok) {
                const leadsData = await leadsRes.json();
                setLeads(leadsData.leads || []);
            }
            if (visitsRes.ok) {
                const visitsData = await visitsRes.json();
                setVisits(visitsData.visits || []);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    };

    // Extract all unique engineers from both leads and visits
    const uniqueEngineers = useMemo(() => {
        const engSet = new Set();
        leads.forEach(l => { if (l.Executive_Name) engSet.add(l.Executive_Name); });
        visits.forEach(v => { if (v.Executive_Name) engSet.add(v.Executive_Name); });
        return ["All", ...Array.from(engSet)];
    }, [leads, visits]);

    // Filtering
    const filteredLeads = leads.filter(lead => {
        const clientName = (lead.CM_Client_Name || "").toLowerCase();
        const companyName = (lead.CM_Company_Name || "").toLowerCase();
        const engName = (lead.Executive_Name || "").toLowerCase();
        
        const matchesSearch = 
            clientName.includes(searchTerm.toLowerCase()) || 
            companyName.includes(searchTerm.toLowerCase()) || 
            engName.includes(searchTerm.toLowerCase());
            
        const matchesEngineer = filterEngineer === "All" || lead.Executive_Name === filterEngineer;
        
        return matchesSearch && matchesEngineer;
    });

    const filteredVisits = visits.filter(visit => {
        const clientName = (visit.CM_Client_Name || "").toLowerCase();
        const companyName = (visit.CM_Company_Name || "").toLowerCase();
        const engName = (visit.Executive_Name || "").toLowerCase();
        const remarks = (visit.CM_Remarks || "").toLowerCase();
        
        const matchesSearch = 
            clientName.includes(searchTerm.toLowerCase()) || 
            companyName.includes(searchTerm.toLowerCase()) || 
            engName.includes(searchTerm.toLowerCase()) ||
            remarks.includes(searchTerm.toLowerCase());
            
        const matchesEngineer = filterEngineer === "All" || visit.Executive_Name === filterEngineer;
        
        return matchesSearch && matchesEngineer;
    });

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Header & Date Filters */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push("/dashboard/crm")}
                        className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Daily Sales Report</h2>
                        <p className="text-slate-600 text-sm">View newly created leads and visit history</p>
                    </div>
                </div>

            </div>

            {/* Toolbar */}
            <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center gap-3 justify-between">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by client, company, engineer or remarks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-slate-700 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-colors"
                    />
                </div>

                <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px] w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg border border-slate-200 shadow-inner">
                            <Filter size={14} className="text-slate-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden lg:block">Filters</span>
                        </div>

                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative flex-1">
                                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <select
                                    value={filterEngineer}
                                    onChange={(e) => setFilterEngineer(e.target.value)}
                                    className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer appearance-none shadow-sm hover:border-blue-400 transition-all"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                                >
                                    {uniqueEngineers.map(e => (
                                        <option key={e} value={e}>{e === "All" ? "All Engineers" : e}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* Date Filters Moved Here */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar sm:flex-wrap w-full lg:w-auto mt-1 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    const today = new Date();
                                    setStartDate(today);
                                    setEndDate(today);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isToday(startDate) && isToday(endDate)
                                    ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-semibold"
                                    : "text-slate-600 hover:text-slate-800"
                                    }`}
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const yesterday = new Date();
                                    yesterday.setDate(yesterday.getDate() - 1);
                                    setStartDate(yesterday);
                                    setEndDate(yesterday);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isYesterday(startDate) && isYesterday(endDate)
                                    ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-semibold"
                                    : "text-slate-600 hover:text-slate-800"
                                    }`}
                            >
                                Yesterday
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-shrink-0">
                            <div className="relative">
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date || new Date())}
                                    selectsStart
                                    startDate={startDate}
                                    endDate={endDate}
                                    dateFormat="MMM d, yyyy"
                                    customInput={<CustomDateInput />}
                                    portalId="root-portal"
                                />
                            </div>
                            <span className="text-slate-400 text-sm font-medium">-</span>
                            <div className="relative">
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date || new Date())}
                                    selectsEnd
                                    startDate={startDate}
                                    endDate={endDate}
                                    minDate={startDate}
                                    dateFormat="MMM d, yyyy"
                                    customInput={<CustomDateInput />}
                                    portalId="root-portal"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 sm:p-6">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 py-16">
                        <Loader2 className="text-blue-600 animate-spin" size={36} />
                        <p className="text-slate-600 font-medium">Fetching Reports...</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Tabs */}
                        <div className="flex xl:hidden gap-2 mb-4 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setActiveTab("leads")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'leads' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                            >
                                <Star size={16} className={activeTab === 'leads' ? 'text-indigo-500' : 'text-slate-400'} />
                                New Leads ({filteredLeads.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("visits")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'visits' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                            >
                                <MapPin size={16} className={activeTab === 'visits' ? 'text-emerald-500' : 'text-slate-400'} />
                                Visit History ({filteredVisits.length})
                            </button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                            {/* New Leads Section */}
                            <div className={`flex-col gap-4 ${activeTab === 'leads' ? 'flex' : 'hidden xl:flex'}`}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Star className="text-indigo-500" size={20} />
                                    New Leads Created
                                    <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-xs ml-2">{filteredLeads.length}</span>
                                </h3>
                            </div>
                            
                            {filteredLeads.length === 0 ? (
                                <div className="bg-white border border-slate-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 text-sm">
                                    <Star size={32} className="text-slate-300 mb-2" />
                                    No leads created for this date/filter.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {filteredLeads.map((lead, idx) => (
                                        <div key={lead.CM_Lead_ID || idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-indigo-500 text-sm mb-0.5 font-medium">Client</div>
                                                    <div className="text-slate-800 font-bold">{lead.CM_Client_Name || "-"}</div>
                                                    <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                                                        <Building2 size={12}/> {lead.CM_Company_Name || "No Company"}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-indigo-500 text-sm mb-0.5 font-medium">Engineer / Created</div>
                                                    <div className="text-slate-800 text-sm font-medium">
                                                        {lead.Executive_Name || "-"}
                                                    </div>
                                                    <div className="text-slate-500 text-xs mt-0.5">
                                                        {lead.CM_Created_At ? format(new Date(lead.CM_Created_At), "MMM d, h:mm a") : "-"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100 grid grid-cols-4 gap-4 text-sm">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Number</div>
                                                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                                                        <Phone size={12} className="text-slate-400"/>
                                                        {lead.CM_Phone || "-"}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</div>
                                                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                                                        <MapPin size={12} className="text-slate-400"/>
                                                        {lead.CM_City || "-"}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Status</div>
                                                    <div className="flex items-center">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                                                            {lead.CM_Lead_Status || "New"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Name</div>
                                                    <div className="flex items-center">
                                                        {lead.CM_Product_Required ? (
                                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                                                                {lead.CM_Product_Required}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">-</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Visit History Section */}
                        <div className={`flex-col gap-4 ${activeTab === 'visits' ? 'flex' : 'hidden xl:flex'}`}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <MapPin className="text-emerald-500" size={20} />
                                    Visit History
                                    <span className="bg-emerald-100 text-emerald-700 py-0.5 px-2 rounded-full text-xs ml-2">{filteredVisits.length}</span>
                                </h3>
                            </div>
                            
                            {filteredVisits.length === 0 ? (
                                <div className="bg-white border border-slate-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 text-sm">
                                    <MapPin size={32} className="text-slate-300 mb-2" />
                                    No visits recorded for this date/filter.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {filteredVisits.map((visit, idx) => (
                                        <div key={visit.CM_Visit_ID || idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <div className="text-emerald-600 text-sm mb-0.5 font-medium">Client</div>
                                                    <div className="text-slate-800 font-bold">{visit.CM_Client_Name || "-"}</div>
                                                    <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                                                        <Building2 size={12}/> {visit.CM_Company_Name || "No Company"}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-emerald-600 text-sm mb-0.5 font-medium">Engineer / Visit Date</div>
                                                    <div className="text-slate-800 text-sm font-medium">
                                                        {visit.Executive_Name || "-"}
                                                    </div>
                                                    <div className="text-slate-500 text-xs mt-0.5 flex flex-col items-end gap-0.5">
                                                        <span>{visit.CM_Visit_Date ? format(new Date(visit.CM_Visit_Date), "MMM d, yyyy") : "-"}</span>
                                                        {visit.CM_Visit_Time && (
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                {new Date(`2000-01-01T${visit.CM_Visit_Time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-2 border-t border-slate-100 grid grid-cols-4 gap-4 text-sm">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Number</div>
                                                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                                                        <Phone size={12} className="text-slate-400"/>
                                                        {visit.CM_Phone || "-"}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</div>
                                                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                                                        <MapPin size={12} className="text-slate-400"/>
                                                        {visit.CM_City || "-"}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visit Status</div>
                                                    <div className="flex items-center">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                                                            {visit.CM_Visit_Status || "Visited"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Name</div>
                                                    <div className="flex items-center">
                                                        {visit.CM_Visit_Products ? (
                                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                                                                {visit.CM_Visit_Products}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">-</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-2 border-t border-slate-100">
                                                <div className="text-emerald-600 text-xs mb-0.5 font-medium">Visit Remarks / Purpose</div>
                                                <div className="text-slate-700 text-sm bg-slate-50 p-2 rounded border border-slate-100">
                                                    {visit.CM_Remarks || visit.CM_Purpose || "No remarks provided."}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}
