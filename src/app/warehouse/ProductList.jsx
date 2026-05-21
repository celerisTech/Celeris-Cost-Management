'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StockManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('godowns');
  const router = useRouter();
  const handleAddNewgodown = () => router.push('/creategodown');

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      {/* Dashboard Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeInUp delay-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 relative flex items-center">
          Godown Details and Item Inventory Dashboard
        </h1>
        <button
          className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-3 px-5 md:px-7 rounded-xl shadow-lg transition-all duration-500 ease-out transform hover:scale-105 active:scale-95 flex items-center hover:shadow-2xl border border-blue-500/30"
          onClick={handleAddNewgodown}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer group-hover:animate-shimmer-fast"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform duration-500 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="relative z-10 font-semibold">Add new godown.</span>

        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('godowns')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'godowns'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Godown management.

          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'items'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Items inventory.

          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'items' ? <ItemList /> : <GodownManagement />}
    </div>
  );
};

// GodownManagement Component
const GodownManagement = () => {
  const [godownSummary, setGodownSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  // Fetch godown summary
  const fetchGodownSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stock-management?action=godown_summary");
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "API error.");

      setGodownSummary(json.data);
    } catch (err) {
      console.error("Fetch summary error:", err);
      setError("Failed to fetch godown summary.");

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGodownSummary();
  }, []);

  // ======== EXPORT FUNCTIONS (same as above) =========
  const exportToExcel = () => {
    if (!godownSummary || godownSummary.length === 0) {
      toast.info('No data to export.');

      return;
    }

    const worksheetData = godownSummary.map(godown => ({
      'Godown Name': godown.godown_name || 'N/A',
      'Location': godown.location || 'Unknown',
      'Total Items': godown.total_items || 0,
      'Total Quantity': godown.total_quantity || 0,
      'Status': godown.CM_Is_Status || 'Active',
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Godown Summary');

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `Godown_Summary_${timestamp}.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success(`✅ Exported ${godownSummary.length} godowns to Excel.`);

  };

  const exportToPDF = async () => {
    if (!godownSummary || godownSummary.length === 0) {
      toast.info('No data to export.');

      return;
    }

    try {
      toast.loading('Generating PDF...', { id: 'pdf-gen' });

      const printDiv = document.createElement('div');
      printDiv.id = 'print-content';
      printDiv.style.padding = '20px';
      printDiv.style.width = '210mm';
      printDiv.style.minHeight = '297mm';
      printDiv.style.fontFamily = 'Arial, sans-serif';
      printDiv.style.fontSize = '10px';
      printDiv.style.lineHeight = '1.4';
      printDiv.style.color = '#333';

      const header = document.createElement('div');
      header.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          <h2 style="color: #1e40af; font-size: 18px; font-weight: bold;">📦 Godown Summary Report</h2>
          <p style="font-size: 12px; color: #64748b; margin-top: 4px;">
            Generated on ${new Date().toLocaleString()} | ${godownSummary.length} godown(s)
          </p>
        </div>
      `;
      printDiv.appendChild(header);

      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.fontSize = '9px';

      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr style="background-color: #f1f5f9; color: #334155; font-weight: bold;">
          <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Godown</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Location</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Items</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">Qty</th>
          <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Status</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      godownSummary.forEach(godown => {
        const statusBg = godown.CM_Is_Status === 'Active' ? '#dcfce7' : '#fee2e2';
        const statusColor = godown.CM_Is_Status === 'Active' ? '#16a34a' : '#dc2626';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="border: 1px solid #e2e8f0; padding: 5px; font-weight: bold;">${godown.godown_name || '—'}</td>
          <td style="border: 1px solid #e2e8f0; padding: 5px;">${godown.location || '—'}</td>
          <td style="border: 1px solid #e2e8f0; padding: 5px; text-align: right; font-weight: bold;">${godown.total_items || 0}</td>
          <td style="border: 1px solid #e2e8f0; padding: 5px; text-align: right; font-weight: bold;">${godown.total_quantity || 0}</td>
          <td style="border: 1px solid #e2e8f0; padding: 5px;">
            <span style="background-color: ${statusBg}; color: ${statusColor}; padding: 1px 5px; border-radius: 3px; font-size: 7px; font-weight: bold;">
              ${godown.CM_Is_Status || 'Active'}
            </span>
          </td>
        `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);

      printDiv.appendChild(table);

      const footer = document.createElement('div');
      footer.style.marginTop = '20px';
      footer.style.fontSize = '8px';
      footer.style.color = '#94a3b8';
      footer.style.borderTop = '1px dashed #cbd5e1';
      footer.style.paddingTop = '8px';
      footer.innerHTML = `
        <p>Exported from Stock Management System • ${window.location.origin}</p>
      `;
      printDiv.appendChild(footer);

      document.body.appendChild(printDiv);

      const canvas = await html2canvas(printDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(printDiv);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= 295;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 295;
        pdf.addPage();
        pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= 295;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`Godown_Summary_${timestamp}.pdf`);
      toast.success('✅ PDF exported successfully!', { id: 'pdf-gen' });


    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('❌ Failed to generate PDF. Please try again.', { id: 'pdf-gen' });
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Header with title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeInUp delay-100">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 relative flex items-center">
          Godown Details
        </h2>

        {/* Download Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center justify-between w-33 px-4 py-3 mr-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold shadow-blue-500/25"
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download.

            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Download Dropdown */}
          {showMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 ring-opacity-5 z-20 overflow-hidden">
              <button
                onClick={() => { setShowMenu(false); exportToExcel(); }}
                className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-all group border-b border-slate-100"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Download Excel.</div>

                </div>
              </button>

              <button
                onClick={() => { setShowMenu(false); exportToPDF(); }}
                className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all group"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Download PDF.</div>

                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Godown Summary Component */}
      <div className="mt-4">
        <GodownSummary godownSummary={godownSummary} loading={loading} error={error} />
      </div>
    </div>
  );
};

// GodownSummary Component
const GodownSummary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [godownSummary, setGodownSummary] = useState([]);
  const [selectedGodown, setSelectedGodown] = useState(null);
  const [godownDetails, setGodownDetails] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingGodown, setEditingGodown] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Fetch godown summary
  const fetchGodownSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stock-management?action=godown_summary");
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "API error.");

      setGodownSummary(json.data);
    } catch (err) {
      console.error("Fetch summary error:", err);
      setError("Failed to fetch godown summary.");

    } finally {
      setLoading(false);
    }
  };

  // Fetch godown details
  const fetchGodownDetails = async (godownId) => {
    try {
      setLoadingDetails(true);
      const res = await fetch(`/api/stock-management?action=stock_locations&godown_id=${godownId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "API error.");

      setGodownDetails(json.data);
    } catch (err) {
      console.error("Fetch godown details error:", err);
      setError("Failed to fetch godown details.");

    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch godown full details for editing
  const fetchGodownFullDetails = async (godownId) => {
    try {
      const res = await fetch(`/api/godowns/${godownId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "API error.");

      return json.data;
    } catch (err) {
      console.error("Fetch godown full details error:", err);
      throw err;
    }
  };

  // Handle godown click to view its details
  const handleGodownClick = (e, godown) => {
    e.stopPropagation();
    setSelectedGodown(godown);
    fetchGodownDetails(godown.godown_id);
    setShowDetailsModal(true);
  };

  // Handle edit godown
  const handleEditGodown = async (e, godown) => {
    e.stopPropagation();
    try {
      const fullDetails = await fetchGodownFullDetails(godown.godown_id);
      setEditingGodown(fullDetails);
      setShowEditModal(true);
    } catch (err) {
      setError("Failed to fetch godown details for editing.");

    }
  };

  const handleSaveGodown = async () => {
    try {
      setSaving(true);

      const res = await fetch(`/api/godowns/${editingGodown.CM_Godown_ID}?_method=PUT`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingGodown),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to update godown.");


      // Refresh the summary data
      await fetchGodownSummary();

      // Reset states
      setShowEditModal(false);
      setEditingGodown(null);
      setError("");

      // ✅ Show success alert
      toast.success("🏠 Godown details updated successfully!");
    } catch (err) {
      console.error("Save godown error:", err);
      setError("Failed to update godown.");


      // ❌ Show error alert
      toast.error(err.message || "Error updating godown. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle input change in edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingGodown(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Load data when component mounts
  useEffect(() => {
    fetchGodownSummary();
  }, []);

  // Close details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedGodown(null);
    setGodownDetails([]);
    setShowMenu(false);
  };
  // ============ Export Godown Details to Excel ============
  const exportToExcel = () => {
    if (!selectedGodown || godownDetails.length === 0) {
      toast.info('No data to export.');

      return;
    }

    const worksheetData = godownDetails.map(item => ({
      'Item Code': item.item_code || 'N/A',
      'Item Name': item.item_name || 'Unnamed',
      'Description': item.item_description || '',
      'Quantity': item.quantity || 0,
      'Unit': item.unit_name || '—',
      'Status': item.stock_status || 'Unknown',
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedGodown.godown_name?.slice(0, 30) || 'Godown');

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `${selectedGodown.godown_name}_Stock_${timestamp}.xlsx`.replace(/\s+/g, '_');

    XLSX.writeFile(wb, fileName);
    toast.success(`✅ Exported ${godownDetails.length} items to Excel.`);

  };

  // ============ Export Godown Details to PDF ============
  const exportToPDF = async () => {
    if (!selectedGodown || godownDetails.length === 0) {
      toast.info('No data to export.');

      return;
    }

    try {
      toast.loading('Generating PDF...', { id: 'pdf-gen' });

      // Create printable content
      const printDiv = document.createElement('div');
      printDiv.id = 'print-content';
      printDiv.style.padding = '20px';
      printDiv.style.width = '210mm';
      printDiv.style.minHeight = '297mm';
      printDiv.style.fontFamily = 'Arial, sans-serif';
      printDiv.style.fontSize = '10px';
      printDiv.style.lineHeight = '1.4';
      printDiv.style.color = '#333';

      // Header
      const header = document.createElement('div');
      header.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
        <h2 style="color: #1e40af; font-size: 18px; font-weight: bold;">📦 Stock Report: ${selectedGodown.godown_name}</h2>
        <p style="font-size: 12px; color: #64748b; margin-top: 4px;">
          Location: ${selectedGodown.location} • Items: ${selectedGodown.total_items} • Total Qty: ${selectedGodown.total_quantity}
          <br/>Generated: ${new Date().toLocaleString()}
        </p>
      </div>
    `;
      printDiv.appendChild(header);

      // Table
      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.fontSize = '9px';

      const thead = document.createElement('thead');
      thead.innerHTML = `
      <tr style="background-color: #f1f5f9; color: #334155; font-weight: bold;">
        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Code</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Item Name</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Qty</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Unit</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Status</th>
      </tr>
    `;
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      godownDetails.forEach(item => {
        let statusBg = '#e2e8f0', statusColor = '#334155';
        if (item.stock_status === 'Available') {
          statusBg = '#dcfce7'; statusColor = '#16a34a';
        } else if (item.stock_status === 'Low Stock') {
          statusBg = '#fef9c3'; statusColor = '#ca8a04';
        } else if (item.stock_status === 'Out of Stock') {
          statusBg = '#fee2e2'; statusColor = '#dc2626';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
        <td style="border: 1px solid #e2e8f0; padding: 5px; font-family: monospace; font-size: 8px;">${item.item_code || '—'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 5px;">${item.item_name || '—'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 5px; text-align: right; font-weight: bold;">${item.quantity.toLocaleString()}</td>
        <td style="border: 1px solid #e2e8f0; padding: 5px;">${item.unit_name || '—'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 5px;">
          <span style="background-color: ${statusBg}; color: ${statusColor}; padding: 1px 5px; border-radius: 3px; font-size: 7px; font-weight: bold;">
            ${item.stock_status}
          </span>
        </td>
      `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);

      printDiv.appendChild(table);

      // Footer
      const footer = document.createElement('div');
      footer.style.marginTop = '20px';
      footer.style.fontSize = '8px';
      footer.style.color = '#94a3b8';
      footer.style.borderTop = '1px dashed #cbd5e1';
      footer.style.paddingTop = '8px';
      footer.innerHTML = `
      <p>Exported from Stock Management System • ${window.location.origin}</p>
    `;
      printDiv.appendChild(footer);

      document.body.appendChild(printDiv);

      // Render to canvas
      const canvas = await html2canvas(printDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(printDiv);

      // Generate PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= 295;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 295;
        pdf.addPage();
        pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= 295;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`${selectedGodown.godown_name}_Stock_${timestamp}.pdf`.replace(/\s+/g, '_'));
      toast.success('✅ PDF exported successfully!', { id: 'pdf-gen' });


    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('❌ Failed to generate PDF. Please try again.', { id: 'pdf-gen' });

    }
  };
  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingGodown(null);
  };
  if (loading)
    return (
      <div className="flex flex-row h-screen bg-white">
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
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-lg">
      {/* Error alert */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex items-start">
          <svg
            className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-900 hover:text-red-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Data display */}
      {loading ? (
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Mobile view - cards */}
          <div className="md:hidden grid gap-4">
            {godownSummary.length > 0 ? (
              godownSummary.map((g, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      {g.godown_name}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
                      {g.location}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Total Items</p>
                      <p className="font-bold text-lg">{g.total_items}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Quantity</p>
                      <p className="font-bold text-lg">{g.total_quantity}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleGodownClick(e, g)}
                      className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                    >
                      <span>View details.</span>

                    </button>
                    <button
                      onClick={(e) => handleEditGodown(e, g)}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Edit Godown"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl">
                No godown summary data found.

              </div>
            )}
          </div>

          {/* Desktop view - table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 tracking-wider">
                      Godown.

                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 tracking-wider">
                      Location.

                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 tracking-wider">
                      Total items.

                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 tracking-wider">
                      Total quantity.

                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 tracking-wider">
                      Actions.

                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 tracking-wider">
                      Edit.

                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 ">
                  {godownSummary.length > 0 ? (
                    godownSummary.map((g, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {g.godown_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {g.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {g.total_items}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {g.total_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                          <button
                            className="inline-flex items-center hover:text-blue-800 transition-colors focus:outline-none focus:underline"
                            onClick={(e) => handleGodownClick(e, g)}
                          >
                            View details.

                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => handleEditGodown(e, g)}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title="Edit Godown"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No godown summary data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Enhanced Modal Container */}
      {showDetailsModal && selectedGodown && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] mx-2 sm:mx-4 overflow-hidden border border-gray-200">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 sm:p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start sm:items-center">
                <div className="flex-1 min-w-0 mr-4">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black truncate">
                    {selectedGodown.godown_name}
                  </h2>
                  <p className="text-gray-800 mt-1 text-sm sm:text-base truncate">
                    {selectedGodown.location}
                  </p>
                </div>
                {/* Download Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center justify-between w-33 px-4 py-3 mr-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold shadow-blue-500/25"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Download Dropdown */}
                  {showMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200  ring-opacity-5 z-20 overflow-hidden">
                      <button
                        onClick={() => { setShowMenu(false); exportToExcel(); }}
                        className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-all group border-b border-slate-100"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Download Excel</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { setShowMenu(false); exportToPDF(); }}
                        className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all group"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Download PDF</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="flex-shrink-0 text-red-500 hover:bg-white/20 p-1 sm:p-2 rounded-full transition-colors duration-200"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content Area with Improved Scrolling */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
              {/* Stats Cards */}
              <div className="p-3 sm:p-4 md:p-6 border-b border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                    <p className="text-xs sm:text-sm text-blue-600 font-medium">Total Items</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-900">{selectedGodown.total_items}</p>
                  </div>
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-100">
                    <p className="text-xs sm:text-sm text-green-600 font-medium">Total Quantity</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-900">{selectedGodown.total_quantity}</p>
                  </div>
                  <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-100">
                    <p className="text-xs sm:text-sm text-purple-600 font-medium">Location</p>
                    <p className="text-base sm:text-lg font-semibold text-purple-900 truncate">{selectedGodown.location}</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Table */}
              <div className="p-3 sm:p-4 md:p-6">
                {loadingDetails ? (
                  // Enhanced responsive loading skeleton
                  <div className="space-y-3 sm:space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 sm:space-x-4 animate-pulse">
                        <div className="flex-1 space-y-2 sm:space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
                            <div className="h-3 sm:h-4 bg-gray-200 rounded"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 rounded"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 rounded hidden sm:block"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 rounded"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 rounded hidden lg:block"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    {/* Mobile Card View */}
                    <div className="sm:hidden">
                      {godownDetails.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {godownDetails.map((item, idx) => (
                            <div key={idx} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 truncate">{item.item_name}</h3>
                                    <p className="text-sm font-mono text-gray-600">{item.item_code}</p>
                                  </div>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${item.stock_status === 'Available'
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : item.stock_status === 'Low Stock'
                                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                      : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                    {item.stock_status}
                                  </span>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-2">{item.item_description}</p>

                                <div className="flex justify-between items-center text-sm">
                                  <div>
                                    <span className="font-bold text-gray-900">{item.quantity.toLocaleString()}</span>
                                    <span className="text-gray-600 ml-1 ">{item.unit_name}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 px-4">
                          <div className="text-gray-400 mb-3">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-medium">No items found</p>
                          <p className="text-gray-400 text-sm mt-1">Add items to this storage location</p>
                        </div>
                      )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {['Item Code', 'Item Name', 'Description', 'Quantity', 'Unit', 'Status'].map((header) => (
                              <th
                                key={header}
                                className="px-3 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-900 tracking-wider"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {godownDetails.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50 transition-colors duration-150 group"
                            >
                              <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 font-medium">
                                {item.item_code}
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-900 font-medium">
                                {item.item_name}
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-600 max-w-xs truncate hidden md:table-cell">
                                {item.item_description}
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                {item.quantity.toLocaleString()}
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600 ">
                                {item.unit_name}
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${item.stock_status === 'Available'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : item.stock_status === 'Low Stock'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                  }`}>
                                  {item.stock_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {godownDetails.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
                            </svg>
                          </div>
                          <p className="text-gray-500 text-lg font-medium">No items found in this godown</p>
                          <p className="text-gray-400 text-sm mt-1">Start by adding items to this storage location</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-200 sticky bottom-0 z-10">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
                <p className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                  Showing {godownDetails.length} items
                </p>
                <button
                  onClick={closeDetailsModal}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm sm:text-base order-1 sm:order-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Godown Modal */}
      {showEditModal && editingGodown && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] mx-2 sm:mx-4 overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 sm:p-6 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black">Edit Godown</h2>
                  <p className="text-gray-700 mt-1 text-sm">Update godown details</p>
                </div>
                <button
                  onClick={closeEditModal}
                  className="text-red-500 hover:bg-white/20 p-2 rounded-full transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto text-black" style={{ maxHeight: "calc(90vh - 180px)" }}>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Basic Information */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Godown Code *</label>
                    <input
                      type="text"
                      name="CM_Godown_Code"
                      value={editingGodown.CM_Godown_Code || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Godown Name *</label>
                    <input
                      type="text"
                      name="CM_Godown_Name"
                      value={editingGodown.CM_Godown_Name || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                      required
                    />
                  </div>

                  {/* Location Information */}
                  <div className="md:col-span-2 mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Information</h3>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      name="CM_Location"
                      value={editingGodown.CM_Location || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <textarea
                      name="CM_Address"
                      value={editingGodown.CM_Address || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                    <input
                      type="text"
                      name="CM_District"
                      value={editingGodown.CM_District || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="CM_State"
                      value={editingGodown.CM_State || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      name="CM_Country"
                      value={editingGodown.CM_Country || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                    <input
                      type="number"
                      name="CM_Postal_Code"
                      value={editingGodown.CM_Postal_Code || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="md:col-span-2 mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
                    <input
                      type="text"
                      name="CM_Contact_Person"
                      value={editingGodown.CM_Contact_Person || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="text"
                      name="CM_Phone_Number"
                      value={editingGodown.CM_Phone_Number || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Alternate Phone</label>
                    <input
                      type="text"
                      name="CM_Alternate_Phone"
                      value={editingGodown.CM_Alternate_Phone || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="CM_Email"
                      value={editingGodown.CM_Email || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      name="CM_Is_Status"
                      value={editingGodown.CM_Is_Status || 'Active'}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200 sticky bottom-0 z-10">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
                <button
                  onClick={closeEditModal}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium hover:shadow-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGodown}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ItemList Component
const ItemList = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [productDetails, setProductDetails] = useState([]);
  const [loadingProductDetails, setLoadingProductDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all'); // 'all', 'code', 'name', 'description'
  const [unitTypes, setUnitTypes] = useState([]);
  const [loadingUnitTypes, setLoadingUnitTypes] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchCategories();
    fetchUnitTypes();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedCategoryId, statusFilter]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, searchCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
      setLoadingCategories(false);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setLoadingCategories(false);
    }
  };
  const fetchUnitTypes = async () => {
    try {
      setLoadingUnitTypes(true);
      const response = await axios.get('/api/unit-types');
      setUnitTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch unit types:', error);
      toast.error('Failed to load unit types');
    } finally {
      setLoadingUnitTypes(false);
    }
  };
  const fetchItems = async () => {
    try {
      let url = '/api/purchases';
      const params = new URLSearchParams();

      if (selectedCategoryId) {
        params.append('categoryId', selectedCategoryId);
      }

      if (statusFilter !== 'All') {
        params.append('status', statusFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const filterItems = () => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
      return;
    }

    const lowercasedSearch = searchTerm.toLowerCase();

    const filtered = items.filter(item => {
      switch (searchCategory) {
        case 'code':
          return item.CM_Item_Code?.toLowerCase().includes(lowercasedSearch);
        case 'name':
          return item.CM_Item_Name?.toLowerCase().includes(lowercasedSearch);
        case 'description':
          return item.CM_Item_Description?.toLowerCase().includes(lowercasedSearch);
        case 'all':
        default:
          return (
            item.CM_Item_Code?.toLowerCase().includes(lowercasedSearch) ||
            item.CM_Item_Name?.toLowerCase().includes(lowercasedSearch) ||
            item.CM_Item_Description?.toLowerCase().includes(lowercasedSearch)
          );
      }
    });

    setFilteredItems(filtered);
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      if (!categoryId) {
        setSubcategories([]);
        return;
      }
      const response = await axios.get(`/api/subcategories?categoryId=${categoryId}`);
      setSubcategories(response.data);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
    }
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    fetchSubcategories(item.CM_Category_ID);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setIsProductModalOpen(false);
    setSelectedItem(null);
    setSubcategories([]);
    setProductDetails([]);
  };

  const handleSave = async () => {
    try {
      console.log('Sending data to API:', {
        itemId: selectedItem.CM_Item_ID,
        unitType: selectedItem.CM_Unit_ID,
        fullData: selectedItem
      });

      await axios.post(`/api/purchases/${selectedItem.CM_Item_ID}?_method=PUT`, selectedItem);

      toast.success("✅ Item updated successfully!");
      fetchItems();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to update item:", error);
      toast.error("❌ Error updating item. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedItem({ ...selectedItem, [name]: value });

    // If category changes, fetch subcategories for that category
    if (name === 'CM_Category_ID') {
      fetchSubcategories(value);
    }
  };
  // ============ Export to Excel ============
  const exportToExcel = () => {
    if (filteredItems.length === 0) {
      toast.info('No items to export');
      return;
    }

    // Map data to clean columns
    const worksheetData = filteredItems.map(item => ({
      'Item Code': item.CM_Item_Code || 'N/A',
      'Item Name': item.CM_Item_Name || 'Unnamed Item',
      'Description': item.CM_Item_Description || '',
      'Category': item.categoryName || 'Uncategorized',
      'Subcategory': item.subcategoryName || 'N/A',
      'Status': item.CM_Is_Status || 'Active',
      'Stock Level': item.CM_Stock_Level || 0,
      'Unit': item.unitName || 'N/A',
      'HSN/ASC Code': item.CM_HSN_ASC_Code || '',
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10); // e.g., 2025-11-18
    const fileName = `Item_Inventory_${timestamp}.xlsx`;

    // Export
    XLSX.writeFile(wb, fileName);
    toast.success(`✅ Exported ${filteredItems.length} items to Excel`);
  };

  // ============ Export to PDF ============
  const exportToPDF = async () => {
    if (filteredItems.length === 0) {
      toast.info('No items to export');
      return;
    }

    try {
      toast.loading('Generating PDF... (this may take a few seconds)', { id: 'pdf-gen' });

      // Create a hidden printable content div
      const printDiv = document.createElement('div');
      printDiv.id = 'print-content';
      printDiv.style.padding = '20px';
      printDiv.style.width = '210mm'; // A4 width
      printDiv.style.minHeight = '297mm'; // A4 height
      printDiv.style.fontFamily = 'Arial, sans-serif';
      printDiv.style.fontSize = '10px';
      printDiv.style.lineHeight = '1.4';
      printDiv.style.color = '#333';

      // Header
      const header = document.createElement('div');
      header.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
        <h2 style="color: #1e40af; font-size: 18px; font-weight: bold; margin: 0;">
          📦 Item Inventory Report
        </h2>
        <p style="font-size: 12px; color: #64748b; margin-top: 4px;">
          Generated on ${new Date().toLocaleString()} | ${filteredItems.length} item(s)
        </p>
      </div>
    `;
      printDiv.appendChild(header);

      // Table
      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.fontSize = '9px';

      // Table Header
      const thead = document.createElement('thead');
      thead.innerHTML = `
      <tr style="background-color: #e0f2fe; color: #0c4a6e;">
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Code</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Name</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Category</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Sub Category</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Status</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Stock</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Unit</th>
      </tr>
    `;
      table.appendChild(thead);

      // Table Body
      const tbody = document.createElement('tbody');
      filteredItems.forEach(item => {
        const statusColor = item.CM_Is_Status === 'Active' ? '#16a34a' : '#dc2626';
        const statusBg = item.CM_Is_Status === 'Active' ? '#dcfce7' : '#fee2e2';

        const row = document.createElement('tr');
        row.innerHTML = `
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-family: monospace;">${item.CM_Item_Code || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px;">${item.CM_Item_Name || 'Unnamed'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px;">${item.categoryName || '—'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px;">${item.subcategoryName || '—'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px;">
          <span style="background-color: ${statusBg}; color: ${statusColor}; padding: 2px 6px; border-radius: 4px; font-size: 8px;">
            ${item.CM_Is_Status}
          </span>
        </td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; text-align: right;">${item.CM_Stock_Level || 0}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px;">${item.unitName || '—'}</td>
      `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);

      printDiv.appendChild(table);

      // Footer
      const footer = document.createElement('div');
      footer.style.marginTop = '20px';
      footer.style.fontSize = '9px';
      footer.style.color = '#64748b';
      footer.style.borderTop = '1px dashed #cbd5e1';
      footer.style.paddingTop = '10px';
      footer.innerHTML = `
      <p style="margin: 4px 0;">Exported from Inventory Management System</p>
      <p style="margin: 4px 0;">${window.location.origin}</p>
    `;
      printDiv.appendChild(footer);

      // Inject into body temporarily
      document.body.appendChild(printDiv);

      // Render to canvas
      const canvas = await html2canvas(printDiv, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      // Remove temp div
      document.body.removeChild(printDiv);

      // Generate PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      // Save
      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`Item_Inventory_${timestamp}.pdf`);
      toast.success('✅ PDF exported successfully!', { id: 'pdf-gen' });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('❌ Failed to generate PDF. Please try again.', { id: 'pdf-gen' });
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      Active: 'bg-green-100 text-green-800 border border-green-200',
      Inactive: 'bg-red-100 text-red-800 border border-red-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {status}
      </span>
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterItems();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchCategory('all');
  };

  return (
    <div className="animate-fadeIn min-h-screen bg-gray-50/30">
      {/* Header with Filters */}
      <div className="mb-6 p-4 sm:p-6 bg-white rounded-2xl shadow-lg border border-gray-100 animate-fadeInUp delay-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                Item Inventory
                <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
                  {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                </span>
              </h2>
            </div>
          </div>

          {/* Filter Section */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Filter */}
            <div className="relative flex-1 sm:flex-none">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7"></path>
                </svg>
              </div>
              <select
                className="w-full sm:w-48 pl-10 pr-8 py-2.5 border border-gray-300 text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-md hover:border-blue-400 bg-white appearance-none"
                value={selectedCategoryId ?? ''}
                onChange={(e) => setSelectedCategoryId(e.target.value === '' ? null : e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.CM_Category_ID} value={category.CM_Category_ID}>
                    {category.CM_Category_Name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative flex-1 sm:flex-none">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <select
                className="w-full sm:w-32 pl-10 pr-8 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-md hover:border-blue-400 bg-white text-gray-700 appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Items
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search items..."
                      className="w-full pl-10 pr-4 py-2.5 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-md hover:border-blue-400 bg-white"
                    />
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  className="sm:w-32 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </div>
            {/* Download Button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center justify-between w-33 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold shadow-blue-500/25"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Download Dropdown */}
              {showMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200  ring-opacity-5 z-20 overflow-hidden">
                  <button
                    onClick={() => { setShowMenu(false); exportToExcel(); }}
                    className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-all group border-b border-slate-100"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Download Excel</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowMenu(false); exportToPDF(); }}
                    className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Download PDF</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table View */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">
                {searchTerm ? 'No items found matching your search' : 'No items found'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? 'Try adjusting your search terms' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.CM_Item_ID}
                className="p-4 hover:bg-blue-50/30 transition-colors duration-150 cursor-pointer active:bg-blue-100/50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base">{item.CM_Item_Name || 'Unnamed Item'}</h3>
                    <p className="text-sm text-gray-500 font-mono mt-1">{item.CM_Item_Code || 'N/A'}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(item);
                    }}
                    className="ml-2 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-150"
                    aria-label={`Edit ${item.CM_Item_Name}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="text-sm font-medium text-gray-900">{item.categoryName || 'Uncategorized'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    {getStatusBadge(item.CM_Is_Status)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {item.CM_Stock_Level} {item.unitName}
                    </span>
                  </div>
                </div>

                {item.CM_Item_Description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{item.CM_Item_Description}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-gray-900  tracking-wider">
                    Item Details
                  </th>
                  <th className="py-4 px-3 text-left text-sm font-semibold text-gray-900  tracking-wider hidden md:table-cell">
                    Description
                  </th>
                  <th className="py-4 px-3 text-left text-sm font-semibold text-gray-900  tracking-wider">
                    Category
                  </th>
                  <th className="py-4 px-3 text-left text-sm font-semibold text-gray-900  tracking-wider hidden lg:table-cell">
                    Subcategory
                  </th>
                  <th className="py-4 px-3 text-left text-sm font-semibold text-gray-900  tracking-wider">
                    Status
                  </th>
                  <th className="py-4 px-3 text-left text-sm font-semibold text-gray-900  tracking-wider hidden xl:table-cell">
                    Stock
                  </th>
                  <th className="py-4 pl-3 pr-6 text-left text-sm font-semibold text-gray-900  tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredItems.map((item) => (
                  <tr
                    key={item.CM_Item_ID}
                    className="hover:bg-blue-50/30 transition-colors duration-150 even:bg-gray-50/50 cursor-pointer group"
                  >
                    <td className="py-4 pl-6 pr-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {item.CM_Item_Name || 'Unnamed Item'}
                        </span>
                        <span className="text-sm text-gray-500 font-mono mt-1">{item.CM_Item_Code || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-600 hidden md:table-cell max-w-xs">
                      <div className="line-clamp-2">{item.CM_Item_Description || 'No description'}</div>
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-600">
                      {item.categoryName || 'Uncategorized'}
                    </td>
                    <td className="py-4 px-3 text-sm text-gray-600 hidden lg:table-cell">
                      {item.subcategoryName || 'N/A'}
                    </td>
                    <td className="py-4 px-3">
                      {getStatusBadge(item.CM_Is_Status)}
                    </td>
                    <td className="py-4 px-3 text-sm font-semibold text-gray-900 hidden xl:table-cell">
                      {item.CM_Stock_Level} {item.unitName}
                    </td>
                    <td className="py-4 pl-3 pr-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(item);
                        }}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600/40 transition-all duration-150 transform hover:scale-105"
                        aria-label={`Edit ${item.CM_Item_Name}`}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">
                {searchTerm ? 'No items found matching your search' : 'No items found'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? 'Try adjusting your search terms' : 'Try adjusting your filters or add new items'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal - Improved */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex text-black items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-600 p-4 sm:p-6 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Edit Item</h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content Area with Improved Scrolling */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
              <div className="p-4 sm:p-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Item Code *</label>
                      <input
                        type="text"
                        name="CM_Item_Code"
                        value={selectedItem.CM_Item_Code || ''}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                        placeholder="Enter item code"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                      <input
                        type="text"
                        name="CM_Item_Name"
                        value={selectedItem.CM_Item_Name || ''}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                        placeholder="Enter item name"
                        required
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Item Description</label>
                      <textarea
                        name="CM_Item_Description"
                        value={selectedItem.CM_Item_Description || ''}
                        onChange={handleChange}
                        rows={3}
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 resize-none"
                        placeholder="Enter item description"
                      />
                    </div>
                  </div>

                  {/* Category & Subcategory */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                      {loadingCategories ? (
                        <div className="w-full border border-gray-300 rounded-xl p-3 bg-gray-100 animate-pulse text-gray-500">
                          Loading categories...
                        </div>
                      ) : (
                        <select
                          name="CM_Category_ID"
                          value={selectedItem.CM_Category_ID || ''}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map((category) => (
                            <option key={category.CM_Category_ID} value={category.CM_Category_ID}>
                              {category.CM_Category_Name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
                      <select
                        name="CM_Subcategory_ID"
                        value={selectedItem.CM_Subcategory_ID || ''}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
                        disabled={!selectedItem.CM_Category_ID}
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories.map((subcategory) => (
                          <option key={subcategory.CM_Subcategory_ID} value={subcategory.CM_Subcategory_ID}>
                            {subcategory.CM_Subcategory_Name}
                          </option>
                        ))}
                      </select>
                      {!selectedItem.CM_Category_ID && (
                        <p className="text-xs text-gray-500 mt-2">Please select a category first</p>
                      )}
                    </div>
                  </div>

                  {/* Stock & Unit Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Type *</label>
                      {loadingUnitTypes ? (
                        <div className="w-full border border-gray-300 rounded-xl p-3 bg-gray-100 animate-pulse text-gray-500">
                          Loading unit types...
                        </div>
                      ) : (
                        <select
                          name="CM_Unit_Type"
                          value={selectedItem.CM_Unit_Type || ''}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                          required
                        >
                          <option value="">Select Unit Type</option>
                          {unitTypes.map((unitType) => (
                            <option
                              key={unitType.CM_Unit_ID}
                              value={unitType.CM_Unit_ID} // Store the NAME, not ID
                            >
                              {unitType.CM_Unit_Name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Level</label>
                      <input
                        type="number"
                        name="CM_Stock_Level"
                        value={selectedItem.CM_Stock_Level || ''}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                        min="0"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">HSN/ASC Code</label>
                      <input
                        type="text"
                        name="CM_HSN_ASC_Code"
                        value={selectedItem.CM_HSN_ASC_Code || ''}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                        placeholder="Enter HSN/ASC code"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                    <select
                      name="CM_Is_Status"
                      value={selectedItem.CM_Is_Status || 'Active'}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200 sticky bottom-0 z-10">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium hover:shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal - Improved */}
      {isProductModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start sm:items-center">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                    {selectedItem.CM_Item_Name} Details
                  </h2>
                  <p className="text-blue-100 mt-1 text-sm truncate">{selectedItem.CM_Item_Code || 'N/A'}</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors duration-200 flex-shrink-0 ml-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200 sticky bottom-0 z-10">
              <div className="flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagementDashboard;
