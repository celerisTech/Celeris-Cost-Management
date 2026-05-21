"use client";
import React, { useState, useEffect } from "react";
import { formatTitleCase, formatSentenceCase } from "../utils/textUtils";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import {
  FiSave,
  FiX,
  FiPlus,
  FiSearch,
} from "react-icons/fi";
import HeaderBar from "./components/HeaderBar";
import SummaryCards from "./components/SummaryCards";
import SupplierTable from "./components/SupplierTable";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from "react-hot-toast";

const SupplierPage = () => {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    CM_Company_Name: "",
    CM_Supplier_Code: "",
    CM_Supplier_ID: "",
    CM_Contact_Person: "",
    CM_Email: "",
    CM_Phone_Number: "",
    CM_Alternate_Phone: "",
    CM_Address: "",
    CM_District: "",
    CM_State: "",
    CM_Country: "India",
    CM_Postal_Code: "",
    CM_GST_Number: "",
    CM_PAN_Number: "",
    CM_Payment_Terms: "30 days",
    CM_Is_Active: "Active",
    Create_Limit: "",
    CM_Created_By: "",
    CM_Uploaded_By: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedCard, setExpandedCard] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  // New UI state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState({
    field: "CM_Company_Name",
    dir: "asc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch("/api/supplier");
        if (!response.ok) throw new Error("Failed to fetch suppliers");
        const data = await response.json();
        setSuppliers(data);
      } catch (err) {
        setError(err.message || "Failed to load suppliers");
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Filter suppliers based on search term and status filter
  const filteredSuppliers = suppliers.filter((supplier) => {
    // Apply status filter
    if (statusFilter === "active" && supplier.CM_Is_Active !== "Active")
      return false;
    if (statusFilter === "inactive" && supplier.CM_Is_Active !== "Inactive")
      return false;

    // Apply search filter
    return (
      supplier.CM_Company_Name?.toLowerCase().includes(
        searchTerm.toLowerCase()
      ) ||
      supplier.CM_Contact_Person?.toLowerCase().includes(
        searchTerm.toLowerCase()
      ) ||
      supplier.CM_Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.CM_Phone_Number?.includes(searchTerm) ||
      supplier.CM_Supplier_Code?.toLowerCase().includes(
        searchTerm.toLowerCase()
      )
    );
  });

  // Summary counts
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(
    (s) => s.CM_Is_Active === "Active"
  ).length;
  const inactiveSuppliers = suppliers.filter(
    (s) => s.CM_Is_Active === "Inactive"
  ).length;

  // Sorting
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    const { field, dir } = sortBy;
    const va = (a?.[field] ?? "").toString().toLowerCase();
    const vb = (b?.[field] ?? "").toString().toLowerCase();
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const total = sortedSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pagedSuppliers = sortedSuppliers.slice(startIdx, startIdx + pageSize);

  // Handlers for table features
  const toggleSort = (field) => {
    setSortBy((prev) => {
      if (prev.field === field) {
        return { field, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { field, dir: "asc" };
    });
  };

  const toggleSelectAllVisible = () => {
    const ids = pagedSuppliers.map((s) => s.CM_Supplier_ID);
    const allSelected = ids.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      ids.forEach((id) => next.delete(id));
    } else {
      ids.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const exportToExcel = (mode = 'all') => {
    const dataToExport = mode === 'selected' && selectedIds.size > 0
      ? sortedSuppliers.filter(s => selectedIds.has(s.CM_Supplier_ID))
      : sortedSuppliers;

    if (dataToExport.length === 0) {
      toast.info(mode === 'selected' ? 'No vendors selected to export.' : 'No vendors to export.');
      return;
    }

    const worksheetData = dataToExport.map(supplier => ({
      'Vendor ID': supplier.CM_Supplier_ID || 'N/A',
      'Vendor Code': supplier.CM_Supplier_Code || '—',
      'Company Name': supplier.CM_Company_Name || 'Unnamed',
      'Contact Person': supplier.CM_Contact_Person || '—',
      'Email': supplier.CM_Email || '—',
      'Phone': supplier.CM_Phone_Number || '—',
      'Alternate Phone': supplier.CM_Alternate_Phone || '—',
      'Address': supplier.CM_Address || '—',
      'District': supplier.CM_District || '—',
      'State': supplier.CM_State || '—',
      'Country': supplier.CM_Country || 'India',
      'Postal Code': supplier.CM_Postal_Code || '—',
      'GST': supplier.CM_GST_Number || '—',
      'PAN': supplier.CM_PAN_Number || '—',
      'Payment Terms': supplier.CM_Payment_Terms || '30 days',
      'Status': supplier.CM_Is_Active || 'Active',
      'Created By': supplier.CM_Created_By || '—',
      'Created At': supplier.CM_Created_At ? new Date(supplier.CM_Created_At).toLocaleString() : '—',
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendors');

    // Auto-fit columns
    const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
      wch: Math.max(
        key.length + 2,
        ...worksheetData.map(row => String(row[key] || '').length)
      )
    }));
    ws['!cols'] = colWidths;

    const timestamp = new Date().toISOString().slice(0, 10);
    const prefix = mode === 'selected' ? 'Selected_' : '';
    const fileName = `${prefix}Vendors_${statusFilter}_${timestamp}.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success(`✅ Exported ${dataToExport.length} ${mode === 'selected' ? 'selected' : 'filtered'} vendor(s)`);
  };

  // ✅ Export to PDF — Branded, elegant, matches your theme
  const exportToPDF = async (mode = 'all') => {
    const dataToExport = mode === 'selected' && selectedIds.size > 0
      ? sortedSuppliers.filter(s => selectedIds.has(s.CM_Supplier_ID))
      : sortedSuppliers;

    if (dataToExport.length === 0) {
      toast.info(mode === 'selected' ? 'No vendors selected to export.' : 'No vendors to export.');
      return;
    }

    try {
      toast.loading(`🎨 Generating ${mode} PDF...`, { id: 'pdf-export' });
      setLoading(true);

      // 🔷 Create printable content
      const printDiv = document.createElement('div');
      printDiv.id = 'print-content';
      printDiv.style.padding = '20mm 15mm';
      printDiv.style.width = '210mm';
      printDiv.style.fontFamily = 'Segoe UI, system-ui, sans-serif';
      printDiv.style.fontSize = '9px';
      printDiv.style.lineHeight = '1.4';
      printDiv.style.color = '#374151';
      printDiv.style.backgroundColor = '#fff';

      // 🔷 Header
      const title = mode === 'selected'
        ? `Selected Vendors Report (${selectedIds.size})`
        : `Vendor Management Report`;

      const header = document.createElement('div');
      header.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #4a90e2, #68d391); padding: 10px 20px; border-radius: 12px; color: white; font-weight: bold; font-size: 16px;">
          📋 ${title}
        </div>
        <p style="font-size: 10px; color: #6b7280; margin-top: 6px;">
          ${statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Vendors • 
          Total: <strong>${dataToExport.length}</strong> • 
          Generated: ${new Date().toLocaleString()}
        </p>
      </div>
    `;
      printDiv.appendChild(header);

      // 🔷 Table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '8px';

      // Table header
      const thead = document.createElement('thead');
      thead.innerHTML = `
      <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
        <th style="padding: 6px; text-align: left; font-weight: bold; color: #1f2937;">Company</th>
        <th style="padding: 6px; text-align: left; font-weight: bold; color: #1f2937;">Contact</th>
        <th style="padding: 6px; text-align: left; font-weight: bold; color: #1f2937;">Email / Phone</th>
        <th style="padding: 6px; text-align: left; font-weight: bold; color: #1f2937;">GST / PAN</th>
        <th style="padding: 6px; text-align: center; font-weight: bold; color: #1f2937;">Status</th>
      </tr>
    `;
      table.appendChild(thead);

      // Table body
      const tbody = document.createElement('tbody');
      dataToExport.forEach(supplier => {
        const statusBg = supplier.CM_Is_Active === 'Active' ? '#dcfce7' : '#fee2e2';
        const statusColor = supplier.CM_Is_Active === 'Active' ? '#16a34a' : '#dc2626';

        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #f3f4f6';
        row.innerHTML = `
        <td style="padding: 6px; vertical-align: top; font-weight: bold;">${supplier.CM_Company_Name || '—'}</td>
        <td style="padding: 6px; vertical-align: top;">${supplier.CM_Contact_Person || '—'}</td>
        <td style="padding: 6px; vertical-align: top; font-size: 7.5px;">
          ${supplier.CM_Email || '—'}<br/>${supplier.CM_Phone_Number || '—'}
        </td>
        <td style="padding: 6px; vertical-align: top; font-size: 7.5px;">
          ${supplier.CM_GST_Number || '—'}<br/>${supplier.CM_PAN_Number || '—'}
        </td>
        <td style="padding: 4px; vertical-align: top; text-align: center;">
          <span style="background-color:${statusBg};color:${statusColor};padding:2px 6px;border-radius:10px;font-size:7px;font-weight:bold;">
            ${supplier.CM_Is_Active || 'Active'}
          </span>
        </td>
      `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      printDiv.appendChild(table);

      // 🔷 Footer
      const footer = document.createElement('div');
      footer.style.marginTop = '20px';
      footer.style.fontSize = '7px';
      footer.style.color = '#9ca3af';
      footer.style.textAlign = 'center';
      footer.style.borderTop = '1px dashed #e5e7eb';
      footer.style.paddingTop = '8px';
      footer.innerHTML = `
      <p>Vendors Management System • ${window.location.origin}</p>
      <p style="font-style:italic;">Exported: ${mode === 'selected' ? 'Selected Vendors' : 'All Filtered Vendors'}</p>
    `;
      printDiv.appendChild(footer);

      // Render
      document.body.appendChild(printDiv);
      const canvas = await html2canvas(printDiv, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      document.body.removeChild(printDiv);

      // PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas, 'JPEG', 0, 0, imgWidth, imgHeight);

      const timestamp = new Date().toISOString().slice(0, 10);
      const prefix = mode === 'selected' ? 'Selected_' : '';
      pdf.save(`${prefix}Vendors_${statusFilter}_${timestamp}.pdf`);

      toast.success(`✅ PDF exported (${dataToExport.length} vendors)`, { id: 'pdf-export' });

    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('❌ Failed to generate PDF.', { id: 'pdf-export' });
    } finally {
      setLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(`Delete ${selectedIds.size} vendor(s)? This cannot be undone.`)
    )
      return;
    try {
      setLoading(true);
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/supplier/${id}?_method=DELETE`, { method: "POST" })
        )
      );
      setSuppliers((prev) =>
        prev.filter((s) => !selectedIds.has(s.CM_Supplier_ID))
      );
      setSelectedIds(new Set());
    } catch (err) {
      setError("Bulk delete failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (supplier) => {
    const nextStatus =
      supplier.CM_Is_Active === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`/api/supplier/${supplier.CM_Supplier_ID}?_method=PUT`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...supplier, CM_Is_Active: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSuppliers((prev) =>
          prev.map((s) =>
            s.CM_Supplier_ID === supplier.CM_Supplier_ID ? updated : s
          )
        );
      }
    } catch { }
  };

  const handleAddSupplier = () => {
    router.push("/addsupplier");
  };

  const handleEditClick = (supplier) => {
    setEditId(supplier.CM_Supplier_ID);
    setEditData({
      CM_Supplier_ID: supplier.CM_Supplier_ID,
      CM_Company_Name: supplier.CM_Company_Name || "",
      CM_Supplier_Code: supplier.CM_Supplier_Code || "",
      CM_Contact_Person: supplier.CM_Contact_Person || "",
      CM_Email: supplier.CM_Email || "",
      CM_Phone_Number: supplier.CM_Phone_Number || "",
      CM_Alternate_Phone: supplier.CM_Alternate_Phone || "",
      CM_Address: supplier.CM_Address || "",
      CM_District: supplier.CM_District || "",
      CM_State: supplier.CM_State || "",
      CM_Country: supplier.CM_Country || "India",
      CM_Postal_Code: supplier.CM_Postal_Code || "",
      CM_GST_Number: supplier.CM_GST_Number || "",
      CM_PAN_Number: supplier.CM_PAN_Number || "",
      CM_Payment_Terms: supplier.CM_Payment_Terms || "30 days",
      CM_Is_Active: supplier.CM_Is_Active || "Active",
      Create_Limit: supplier.Create_Limit || "",
      CM_Created_By: supplier.CM_Created_By || "",
      CM_Uploaded_By: supplier.CM_Uploaded_By || "",
    });
  };


  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (
      ["CM_Company_Name", "CM_Contact_Person", "CM_District", "CM_State", "CM_Country"].includes(
        name
      )
    ) {
      formattedValue = formatTitleCase(value);
    } else if (name === "CM_Address") {
      formattedValue = formatSentenceCase(value);
    } else if (name === "CM_GST_Number" || name === "CM_PAN_Number") {
      formattedValue = value.toUpperCase();
    }

    setEditData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/supplier/${editId}?_method=PUT`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          // These fields would typically be set on the server side
          CM_Uploaded_By: "current_user", // You should replace with actual user from auth
          CM_Uploaded_At: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update supplier");
      }

      const updatedSupplier = await res.json();
      const updatedList = suppliers.map((s) =>
        s.CM_Supplier_ID === editId ? updatedSupplier : s
      );
      setSuppliers(updatedList);
      setEditId(null);
      setSuccessMessage("Vendor updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Update error:", err);
      setError(
        err.message || "Update failed. Please check console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
  };

  const toggleExpandCard = (id) => {
    setExpandedCard((prev) => (prev === id ? null : id));
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
    setPage(1);
  };

  if (loading)
    return (
      <div className="flex flex-row h-screen bg-white">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full items-center justify-center">
          <div className="flex justify-center items-center h-64">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mt-70">
              {/* Sun */}
              <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
              {/* Orbit 1 */}
              <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              {/* Orbit 2 */}
              <div className="absolute inset-2 border-2 border-green-300/30 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="flex h-screen bg-white">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md w-full">
            <strong>Error:</strong> {error}
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen bg-white text-black">
      <Navbar />
      <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className=" mx-auto">
          {/* Header and Actions */}
          <HeaderBar
            searchTerm={searchTerm}
            setSearchTerm={(v) => { setSearchTerm(v); setPage(1); }}
            statusFilter={statusFilter}
            setStatusFilter={(v) => { setStatusFilter(v); setPage(1); }}
            clearFilters={clearFilters}
            exportToExcel={exportToExcel}
            exportToPDF={exportToPDF}
            selectedCount={selectedIds.size}
            handleAddSupplier={handleAddSupplier}
            suppliers={sortedSuppliers}   // use sorted & filtered list
            selectedIds={selectedIds}
            allCount={sortedSuppliers.length}
          />

          {/* Supplier Summary Cards */}
          <SummaryCards
            totalSuppliers={totalSuppliers}
            activeSuppliers={activeSuppliers}
            inactiveSuppliers={inactiveSuppliers}
            statusFilter={statusFilter}
            handleStatusFilter={handleStatusFilter}
          />

          {successMessage && (
            <div className="mb-4 md:mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}


          {editId && editData && (
            <div className="bg-gray-100 rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">Edit Vendors</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendors Name *</label>
                  <input
                    name="CM_Company_Name"
                    value={editData.CM_Company_Name}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    placeholder="Vendors Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendors Code</label>
                  <input
                    name="CM_Supplier_Code"
                    value={editData.CM_Supplier_Code}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Vendors Code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Contact Person</label>
                  <input
                    name="CM_Contact_Person"
                    value={editData.CM_Contact_Person}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Contact Person"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    name="CM_Email"
                    type="email"
                    value={editData.CM_Email}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    name="CM_Phone_Number"
                    value={editData.CM_Phone_Number}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    placeholder="Phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                  <input
                    name="CM_Alternate_Phone"
                    value={editData.CM_Alternate_Phone}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Alternate Phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    name="CM_Address"
                    value={editData.CM_Address}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Address"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <input
                    name="CM_District"
                    value={editData.CM_District}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="District"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    name="CM_State"
                    value={editData.CM_State}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    name="CM_Country"
                    value={editData.CM_Country}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    name="CM_Postal_Code"
                    value={editData.CM_Postal_Code}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Postal Code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    name="CM_GST_Number"
                    value={editData.CM_GST_Number}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="GST Number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <input
                    name="CM_PAN_Number"
                    value={editData.CM_PAN_Number}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="PAN Number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <select
                    name="CM_Payment_Terms"
                    value={editData.CM_Payment_Terms}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="15 days">15 days</option>
                    <option value="30 days">30 days</option>
                    <option value="45 days">45 days</option>
                    <option value="60 days">60 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="CM_Is_Active"
                    value={editData.CM_Is_Active}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Create Limit</label>
                  <input
                    name="Create_Limit"
                    value={editData.Create_Limit}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Create Limit"
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center gap-2"
                >
                  <FiX size={16} /> Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <FiSave size={16} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Table or Empty State */}
          {filteredSuppliers.length > 0 ? (
            <SupplierTable
              pagedSuppliers={pagedSuppliers}
              selectedIds={selectedIds}
              toggleSelectAllVisible={toggleSelectAllVisible}
              toggleSelectOne={toggleSelectOne}
              toggleStatus={toggleStatus}
              handleEditClick={handleEditClick}
              toggleExpandCard={toggleExpandCard}
              expandedCard={expandedCard}
              startIdx={startIdx}
              pageSize={pageSize}
              total={total}
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevPage={() => setPage(p => Math.max(1, p - 1))}
              onNextPage={() => setPage(p => Math.min(totalPages, p + 1))}
              toggleSort={toggleSort}
              sortBy={sortBy}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8 text-center">
              <div className="text-gray-500">
                <FiSearch size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No Vendors found</p>
                <p className="mt-1">
                  Try adjusting your search or add a new Vendors
                </p>
                <button
                  onClick={handleAddSupplier}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md whitespace-nowrap inline-flex items-center gap-2"
                >
                  <FiPlus size={18} />
                  Add New Vendors
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierPage;
