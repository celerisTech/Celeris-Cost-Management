"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, DollarSign, CheckSquare, Square } from "lucide-react";
import { useAuthStore } from "../../store/useAuthScreenStore";

export const LaborSidebar = ({ labors }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  // Filtered labors (memoized for performance)
  const filteredLabors = useMemo(() => {
    return labors.filter((labor) => {
      const firstName = (labor?.CM_First_Name || "").toLowerCase();
      const lastName = (labor?.CM_Last_Name || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      // Role-based restriction: ROL000003 sees ONLY "Labor"
      const isRestrictedRole = user?.CM_Role_ID === "ROL000003";

      const matchesSearch = firstName.includes(search) || lastName.includes(search);

      let matchesType = typeFilter === "All" || labor?.CM_Labor_Type === typeFilter;
      if (isRestrictedRole) {
        matchesType = matchesType && labor?.CM_Labor_Type === "Labor";
      }

      const matchesStatus = statusFilter === "All" || labor?.CM_Status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [labors, searchTerm, typeFilter, statusFilter, user]);

  // Toggle individual employee selection
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Toggle "Select All" — only for currently *filtered* list
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredLabors.length && filteredLabors.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLabors.map((l) => l.CM_Labor_Type_ID)));
    }
  }, [filteredLabors, selectedIds.size]);

  // Determine data to export
  const getExportData = useCallback(() => {
    const data = selectedIds.size > 0
      ? filteredLabors.filter((l) => selectedIds.has(l.CM_Labor_Type_ID))
      : filteredLabors;

    return data.map((labor) => ({
      "First Name": labor.CM_First_Name || "",
      "Last Name": labor.CM_Last_Name || "",
      "Role": labor.CM_Labor_Roll || "—",
      "Type": labor.CM_Labor_Type || "—",
      "Labor ID": labor.CM_Labor_Code || "—",
      "Salary": Number(String(labor.CM_Wage_Amount).replace(/,/g, "")) || 0,
      "Wage Type": labor.CM_Wage_Type || "—",
      "Mobile": labor.CM_Phone_Number || "—",
    }));
  }, [selectedIds, filteredLabors]);

  // ✅ Excel Export — with selection support
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");

      const dataToExport = getExportData();

      if (dataToExport.length === 0) {
        alert("No employees to export.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

      XLSX.writeFile(workbook, "Employee_List.xlsx");
    } catch (error) {
      console.error("Excel export failed:", error);
      alert("Failed to export Excel file. Check console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  // ✅ PDF Export — with selection support
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const dataToExport = getExportData();

      if (dataToExport.length === 0) {
        alert("No employees to export.");
        return;
      }

      const doc = new jsPDF("p", "pt", "a4");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Employee List", 40, 40);

      const tableData = dataToExport.map((item) => [
        `${item["First Name"]} ${item["Last Name"]}`.trim() || "—",
        item["Role"],
        item["Type"],
        item["Labor ID"],
        item["Salary"],
        item["Wage Type"],
      ]);

      autoTable(doc, {
        startY: 70,
        head: [["Name", "Role", "Type", "Labor ID", "Salary", "Wage Type"]],
        body: tableData,
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [60, 90, 200], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 40, right: 40 },
      });

      doc.save("Employee_List.pdf");
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. This may happen in some browsers/environments.");
    } finally {
      setIsExporting(false);
    }
  };

  const goToEmployee = (labor) => {
    router.push(`/labors/employee-details/${labor.CM_Labor_Type_ID}`);
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className="w-full h-full p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Active Employees</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredLabors.length} {filteredLabors.length === 1 ? "employee" : "employees"} found
            {selectedIds.size > 0 && (
              <span className="ml-2 text-indigo-600 font-medium">
                ({selectedIds.size} selected)
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/addlabors")}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusCircle size={18} />
            Add Employee
          </button>
          <button
            onClick={() => router.push("/labors/day-wise-report")}
            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            <CheckSquare size={18} />
            Attendance Record
          </button>
          {["ROL000001", "ROL000002"].includes(user?.CM_Role_ID) && (
            <button
              onClick={() => router.push("/salary-report")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
            >
              <DollarSign size={18} />
              Salary Report
            </button>
          )}

          {selectedIds.size > 0 && (
            <button
              onClick={clearSelection}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Clear Selection
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex items-center justify-between w-36 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold shadow-blue-500/25 ${isExporting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              disabled={isExporting}
            >
              <div className="flex items-center">
                {isExporting ? (
                  <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                {isExporting ? "Exporting..." : "Download"}
              </div>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 ring-opacity-5 z-20 overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    exportToExcel();
                  }}
                  disabled={isExporting}
                  className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-all group border-b border-slate-100 disabled:opacity-50"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Download Excel</div>
                    <div className="text-xs text-slate-500">
                      {selectedIds.size > 0 ? `${selectedIds.size} selected` : "All visible"}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    exportToPDF();
                  }}
                  disabled={isExporting}
                  className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Download PDF</div>
                    <div className="text-xs text-slate-500">
                      {selectedIds.size > 0 ? `${selectedIds.size} selected` : "All visible"}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 sm:mb-6 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-black">
        <div className="relative xs:col-span-2 lg:col-span-1">
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <select
          value={user?.CM_Role_ID === "ROL000003" ? "Labor" : typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          disabled={user?.CM_Role_ID === "ROL000003"}
          className={`px-3 sm:px-4 py-2.5 border border-blue-500 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm sm:text-base ${user?.CM_Role_ID === "ROL000003" ? "opacity-70 cursor-not-allowed bg-gray-100" : ""
            }`}
        >
          {user?.CM_Role_ID === "ROL000003" ? (
            <option value="Labor">Labor</option>
          ) : (
            <>
              <option value="All">All Employee Types</option>
              <option value="Labor">Labor</option>
              <option value="Temporary">Temporary</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Office">Office</option>
            </>
          )}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 sm:px-4 py-2.5 border border-blue-500 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm sm:text-base"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Employee List */}
      <div className="rounded-lg sm:rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        {/* Table Header - Desktop */}
        <div className="hidden sm:grid sm:grid-cols-7 bg-slate-50 border-b border-slate-200 p-3 md:p-4 text-xs md:text-sm font-semibold text-slate-600 tracking-wider">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filteredLabors.length > 0 && selectedIds.size === filteredLabors.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="ml-10">ID</span>
          </label>
          <span>Employee Name</span>
          <span>Designation</span>
          <span>Join Date</span>
          <span>Salary Amount</span>
          <span>Labor Type</span>
          <span className="ml-5">Mobile</span>
        </div>

        {/* Mobile Header */}
        <div className="sm:hidden bg-slate-50 border-b border-slate-200 p-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filteredLabors.length > 0 && selectedIds.size === filteredLabors.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm font-semibold text-slate-600">
              Select All ({filteredLabors.length} employees)
            </span>
          </label>
        </div>

        {/* Table Body */}
        {filteredLabors.length === 0 ? (
          <div className="py-8 sm:py-12 text-center">
            <div className="inline-block p-3 sm:p-4 bg-slate-100 rounded-full mb-3 sm:mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.659-.134-1.282-.374-1.836M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.659.134-1.282.374-1.836m0 0a5.002 5.002 0 019.252 0M7 10a5 5 0 0110 0v2a5 5 0 01-10 0v-2z"
                />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-slate-700">No employees found</h3>
            <p className="text-slate-500 mt-1 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-black">
            {filteredLabors.map((labor) => {
              const isSelected = selectedIds.has(labor.CM_Labor_Type_ID);
              return (
                <div
                  key={labor.CM_Labor_Type_ID}
                  onClick={() => goToEmployee(labor)}
                  className={`p-3 sm:p-4 text-sm transition-all duration-150 cursor-pointer ${isSelected
                    ? "bg-blue-50 border-l-2 sm:border-l-4 border-blue-500 shadow-sm"
                    : "hover:bg-slate-50 hover:shadow-xs"
                    }`}
                >
                  {/* Mobile Layout */}
                  <div className="sm:hidden space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(labor.CM_Labor_Type_ID);
                          }}
                          className="flex-shrink-0 p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          aria-label={`Select ${labor.CM_First_Name} ${labor.CM_Last_Name}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="text-indigo-600 w-4 h-4" />
                          ) : (
                            <Square className="text-slate-400 w-4 h-4 hover:text-slate-600" />
                          )}
                        </button>
                        <div className="font-medium text-sm truncate min-w-0">
                          {labor.CM_First_Name} {labor.CM_Last_Name}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ml-2 ${labor.CM_Labor_Type === "Permanent"
                          ? "bg-green-100 text-green-800"
                          : labor.CM_Labor_Type === "Temporary"
                            ? "bg-amber-100 text-amber-800"
                            : labor.CM_Labor_Type === "Contract"
                              ? "bg-indigo-100 text-indigo-800"
                              : labor.CM_Labor_Type === "Office"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                          }`}
                      >
                        {labor.CM_Labor_Roll || "—"}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="font-medium">ID:</span>
                        <span>{labor.CM_Labor_Code || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Type:</span>
                        <span>{labor.CM_Labor_Type || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Join Date:</span>
                        <span>{labor.CM_Labor_Join_Date || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Salary:</span>
                        <span>{labor.CM_Wage_Amount ? `$${labor.CM_Wage_Amount}` : "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Mobile:</span>
                        <span>{labor.CM_Phone_Number || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:grid sm:grid-cols-7 gap-2 md:gap-4">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(labor.CM_Labor_Type_ID);
                        }}
                        className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        aria-label={`Select ${labor.CM_First_Name} ${labor.CM_Last_Name}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="text-indigo-600 w-5 h-5" />
                        ) : (
                          <Square className="text-slate-400 w-5 h-5 hover:text-slate-600" />
                        )}
                      </button>
                      <div className="text-slate-500 truncate ml-5">{labor.CM_Labor_Code || "—"}</div>
                    </div>
                    <div className="font-medium truncate">
                      {labor.CM_First_Name} {labor.CM_Last_Name}
                    </div>
                    <div className="text-slate-500 truncate">{labor.CM_Labor_Roll || "—"}</div>
                    <div className="text-slate-500 truncate">{labor.CM_Labor_Join_Date || "—"}</div>
                    <div className="text-slate-500 truncate">{labor.CM_Wage_Amount || "—"}</div>
                    <div className="inline-flex items-center">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${labor.CM_Labor_Type === "Permanent"
                          ? "bg-green-100 text-green-800"
                          : labor.CM_Labor_Type === "Temporary"
                            ? "bg-amber-100 text-amber-800"
                            : labor.CM_Labor_Type === "Contract"
                              ? "bg-indigo-100 text-indigo-800"
                              : labor.CM_Labor_Type === "Office"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                          }`}
                      >
                        {labor.CM_Labor_Type || "—"}
                      </span>
                    </div>
                    <div className="text-slate-500 truncate">{labor.CM_Phone_Number || "—"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};