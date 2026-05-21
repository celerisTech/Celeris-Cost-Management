"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Download,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Users,
  Calendar,
  PieChart,
  Clock,
  CheckCircle,
  CloudDownload
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie
} from "recharts";

export default function ProjectCostReport() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'type', 'yearly'

  const currencyCode = 'INR';
  const locale = 'en-IN';

  // Helper function for type colors - MOVED BEFORE useMemo HOOKS
  const getColorForType = (type) => {
    const colors = {
      'Commercial': '#3B82F6',
      'Residential': '#10B981',
      'Industrial': '#F59E0B',
      'Government': '#EF4444',
      'Utility': '#8B5CF6',
      'Agricultural': '#22C55E',
      'Unknown': '#6B7280'
    };
    return colors[type] || `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  };

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/budget-expense");
        if (!res.ok) throw new Error("Failed to fetch project cost report");
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, error]);

  const formatIndianRupees = (value) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const parseCurrency = (value) => {
    if (typeof value === 'string') {
      return Number(value.replace(/[^0-9.-]+/g, '')) || 0;
    }
    return Number(value) || 0;
  };

  // Task Status Data (Cost Overview)
  const taskData = useMemo(() => {
    const totalEstimated = projects.reduce((sum, p) => sum + parseCurrency(p.CM_Estimated_Cost), 0);
    const totalActual = projects.reduce((sum, p) => sum + parseCurrency(p.Actual_Cost), 0);
    const totalVariance = projects.reduce((sum, p) => sum + parseCurrency(p.Cost_Variance), 0);
    const variancePercentage = totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;

    const positiveVariance = projects.filter(p => parseCurrency(p.Cost_Variance) > 0).reduce((sum, p) => sum + parseCurrency(p.Cost_Variance), 0);
    const negativeVariance = projects.filter(p => parseCurrency(p.Cost_Variance) < 0).reduce((sum, p) => sum + parseCurrency(p.Cost_Variance), 0);
    const neutralVariance = projects.filter(p => parseCurrency(p.Cost_Variance) === 0).length;

    return {
      total: projects.length,
      complete: projects.filter(p => parseCurrency(p.Cost_Variance) >= 0 && parseCurrency(p.Actual_Cost) > 0).length,
      inProgress: projects.filter(p => parseCurrency(p.Cost_Variance) < 0).length,
      notStarted: projects.filter(p => parseCurrency(p.Actual_Cost) === 0).length,
      overdue: projects.filter(p => new Date(p.CM_Planned_End_Date) < new Date() && parseCurrency(p.Actual_Cost) < parseCurrency(p.CM_Estimated_Cost)).length,
      pieData: [
        { name: 'Estimated', value: totalEstimated, color: '#3B82F6' },
        { name: 'Actual', value: totalActual, color: '#A855F7' },
        { name: 'Variance', value: Math.abs(totalVariance), color: totalVariance >= 0 ? '#10B981' : '#EF4444' }
      ],
      summary: {
        totalEstimated,
        totalActual,
        totalVariance,
        variancePercentage
      }
    };
  }, [projects]);

  // Workload Data (Project Type)
  const workloadData = useMemo(() => {
    const typeMap = {};
    projects.forEach(p => {
      const type = p.CM_Project_Type || 'Unknown';
      if (!typeMap[type]) {
        typeMap[type] = {
          name: type,
          estimated: 0,
          actual: 0,
          variance: 0,
          count: 0
        };
      }
      typeMap[type].estimated += parseCurrency(p.CM_Estimated_Cost);
      typeMap[type].actual += parseCurrency(p.Actual_Cost);
      typeMap[type].variance += parseCurrency(p.Cost_Variance);
      typeMap[type].count += 1;
    });

    return Object.values(typeMap).map(type => ({
      ...type,
      fill: getColorForType(type.name)
    }));
  }, [projects]);

  // Task Lengths Data (Yearly Wise)
  const yearlyData = useMemo(() => {
    const yearMap = {};
    projects.forEach(p => {
      const year = new Date(p.CM_Planned_Start_Date).getFullYear();
      if (!year) return;

      if (!yearMap[year]) {
        yearMap[year] = {
          year: year.toString(),
          estimated: 0,
          actual: 0,
          variance: 0,
          count: 0,
          months: Array(12).fill(0).map((_, i) => ({
            month: i + 1,
            estimated: 0,
            actual: 0
          }))
        };
      }

      const month = new Date(p.CM_Planned_Start_Date).getMonth();
      yearMap[year].estimated += parseCurrency(p.CM_Estimated_Cost);
      yearMap[year].actual += parseCurrency(p.Actual_Cost);
      yearMap[year].variance += parseCurrency(p.Cost_Variance);
      yearMap[year].count += 1;

      if (month >= 0 && month < 12) {
        yearMap[year].months[month].estimated += parseCurrency(p.CM_Estimated_Cost);
        yearMap[year].months[month].actual += parseCurrency(p.Actual_Cost);
      }
    });

    return Object.values(yearMap).sort((a, b) => a.year.localeCompare(b.year));
  }, [projects]);

  // Download functions remain the same
  const downloadExcel = async () => {
    const XLSX = await import("xlsx");
    const totalEstimatedCost = projects.reduce((sum, p) => sum + parseCurrency(p.CM_Estimated_Cost), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + parseCurrency(p.Actual_Cost), 0);
    const totalVariance = projects.reduce((sum, p) => sum + parseCurrency(p.Cost_Variance), 0);
    const variancePercentage = totalEstimatedCost > 0 ? (totalVariance / totalEstimatedCost) * 100 : 0;

    const wsData = [
      ["Metric", "Amount"],
      ["Total Estimated Cost", totalEstimatedCost],
      ["Total Actual Cost", totalActualCost],
      ["Total Variance", totalVariance],
      [],
      ["Project Name", "Project Type", "Start Date", "Estimated Cost", "Actual Cost", "Variance"],
    ];

    projects.forEach((p) => {
      wsData.push([
        p.CM_Project_Name,
        p.CM_Project_Type,
        new Date(p.CM_Planned_Start_Date).toLocaleDateString(),
        parseCurrency(p.CM_Estimated_Cost),
        parseCurrency(p.Actual_Cost),
        parseCurrency(p.Cost_Variance),
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Project Cost Report");
    XLSX.writeFile(workbook, "Project_Cost_Report.xlsx");
  };

  const downloadPDF = async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const totalEstimatedCost = projects.reduce((sum, p) => sum + parseCurrency(p.CM_Estimated_Cost), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + parseCurrency(p.Actual_Cost), 0);
    const totalVariance = projects.reduce((sum, p) => sum + parseCurrency(p.Cost_Variance), 0);
    const variancePercentage = totalEstimatedCost > 0 ? (totalVariance / totalEstimatedCost) * 100 : 0;

    const doc = new jsPDF("p", "mm", "a4");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Project Cost Performance Report", 15, 50);

    autoTable(doc, {
      startY: 28,
      theme: "grid",
      headStyles: { fillColor: [0, 102, 204] },
      head: [["Metric", "Amount"]],
      body: [
        ["Total Estimated Cost", totalEstimatedCost.toLocaleString("en-IN")],
        ["Total Actual Cost", totalActualCost.toLocaleString("en-IN")],
        ["Total Variance", totalVariance.toLocaleString("en-IN")],
      ],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      theme: "striped",
      headStyles: { fillColor: [0, 102, 204] },
      head: [["Project", "Type", "Estimated", "Actual", "Variance"]],
      body: projects.map((p) => [
        p.CM_Project_Name,
        p.CM_Project_Type,
        parseCurrency(p.CM_Estimated_Cost).toLocaleString("en-IN"),
        parseCurrency(p.Actual_Cost).toLocaleString("en-IN"),
        parseCurrency(p.Cost_Variance).toLocaleString("en-IN"),
      ]),
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "Report generated by Saran Solar Pvt Ltd • info@saransolar.in ",
      15,
      pageHeight - 10
    );

    doc.save("Project_Cost_Report.pdf");
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-xl border border-gray-100 rounded-lg">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-sm text-gray-600 font-medium">{entry.name}:</span>
              <span className="text-sm font-bold" style={{ color: entry.color }}>
                {formatIndianRupees(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
          <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
          <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="relative inline-block mb-4">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            <div className="absolute -inset-2 bg-red-100 rounded-full animate-pulse opacity-30"></div>
          </div>
          <p className="text-red-500 text-base font-medium mb-3">{error}</p>
          <button
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            onClick={() => window.location.reload()}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 sm:p-2 lg:p-2">
      <div className="bg-white rounded-2xl transition-all duration-500">

        {/* Header Section */}
        <div className="flex items-center justify-between mb-2 lg:mb-2 flex-wrap gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <h2 className="text-xl sm:text-xl font-bold text-gray-800">Cost Performance Dashboard</h2>
            </div>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row bg-gray-200 p-1 rounded-lg mb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-700'}`}
          >
            <PieChart className="w-4 h-4" />
            Cost Overview
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'type' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-700'}`}
          >
            <Users className="w-4 h-4" />
            Project Type
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'yearly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-700'}`}
          >
            <Calendar className="w-4 h-4" />
            Yearly View
          </button>
        </div>

        {/* COST OVERVIEW TAB (Tasks Layout) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Left Column - Task Status Summary */}
            <div className="bg-white rounded-xl p-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-500" />
                Cost Distribution Overview
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Estimate</span>
                  </div>
                  <p className="text-xl sm:text-xl font-bold text-blue-800">
                    {formatIndianRupees(taskData.summary.totalEstimated)}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Actual</span>
                  </div>
                  <p className="text-xl sm:text-xl font-bold text-purple-800">
                    {formatIndianRupees(taskData.summary.totalActual)}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Variance</span>
                  </div>
                  <p className={`text-xl sm:text-xl font-bold ${taskData.summary.totalVariance < 0 ? 'text-red-800' : 'text-green-800'
                    }`}>
                    {formatIndianRupees(taskData.summary.totalVariance)}
                  </p>
                </div>

              </div>

              <div className="h-64 sm:text-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={taskData.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${formatIndianRupees(entry.value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {taskData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatIndianRupees(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* PROJECT TYPE TAB (Workload Layout) */}
        {activeTab === 'type' && (
          <div className="bg-white rounded-xl p-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Project Type Cost Distribution
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Type List */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-4">Project Types</h4>
                  <div className="space-y-3">
                    {workloadData.map((type, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.fill }}
                          ></div>
                          <span className="font-medium text-gray-800">{type.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{type.count}</div>
                          <div className="text-xs text-gray-500">projects</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Charts */}
              <div className="lg:col-span-2 text-black">
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={workloadData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#1d1919ff', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#1d1919ff', fontSize: 12 }}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip
                        formatter={(value, name) => [formatIndianRupees(value), name]}
                        labelFormatter={(label) => `Type: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="estimated"
                        name="Estimated Cost"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                      <Bar
                        dataKey="actual"
                        name="Actual Cost"
                        fill="#A855F7"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                      <Bar
                        dataKey="variance"
                        name="Variance"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      >
                        {workloadData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.variance < 0 ? '#EF4444' : '#10B981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Type Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  {workloadData.slice(0, 3).map((type, index) => (
                    <div key={index} className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.fill }}
                        ></div>
                        <span className="font-medium text-gray-700 text-sm">{type.name}</span>
                      </div>
                      <div className="text-xl sm:text-xl font-bold text-gray-900 mb-1">
                        {formatIndianRupees(type.estimated)}
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex justify-between">
                          <span>Actual:</span>
                          <span className="font-medium">{formatIndianRupees(type.actual)}</span>
                        </div>
                        <div className={`flex justify-between ${type.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          <span>Variance:</span>
                          <span className="font-medium">{formatIndianRupees(type.variance)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
        }

        {/* YEARLY VIEW TAB (Task Lengths Layout) */}
        {
          activeTab === 'yearly' && (
            <div className="bg-white rounded-xl p-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Yearly Cost Analysis
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column - Year Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-700 mb-3">Year Summary</h4>
                    <div className="space-y-4">
                      {yearlyData.map((year, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-blue-900 text-lg">{year.year}</span>
                            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">
                              {year.count} projects
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Estimated:</span>
                              <span className="font-medium text-blue-800">{formatIndianRupees(year.estimated)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Actual:</span>
                              <span className="font-medium text-purple-800">{formatIndianRupees(year.actual)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Variance:</span>
                              <span className={`font-medium ${year.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatIndianRupees(year.variance)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Charts */}
                <div className="lg:col-span-3">
                  <div className="h-[400px] lg:h-[500px] mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={yearlyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis
                          dataKey="year"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                          tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="estimated"
                          name="Estimated Cost"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                        />
                        <Bar
                          dataKey="actual"
                          name="Actual Cost"
                          fill="#A855F7"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Variance Trend */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-blue-500">
                <h4 className="font-medium text-gray-700 mb-4">Variance Trend by Year</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={yearlyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value) => [formatIndianRupees(value), 'Variance']}
                        labelFormatter={(label) => `Year: ${label}`}
                      />
                      <Bar
                        dataKey="variance"
                        name="Variance"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      >
                        {yearlyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.variance < 0 ? '#EF4444' : '#10B981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
}