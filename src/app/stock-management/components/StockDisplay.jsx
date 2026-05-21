"use client";
import { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast'; // if not already imported

// Small badge component for stock status
function StockStatusBadge({ status }) {
  const colors = {
    Available: "bg-green-100 text-green-800 border border-green-300",
    "Low Stock": "bg-yellow-100 text-yellow-800 border border-yellow-300",
    Empty: "bg-red-100 text-red-800 border border-red-300",
  };
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-semibold ${colors[status] || "bg-gray-100 text-gray-800 border border-gray-300"
        }`}
    >
      {status}
    </span>
  );
}

// Format date function
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Skeleton loader component
function SkeletonLoader({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 animate-pulse">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StockDisplay() {
  const [viewMode, setViewMode] = useState("locations"); // "locations" | "summary"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stockData, setStockData] = useState([]);
  const [godownSummary, setGodownSummary] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  // Fetch stock locations
  const fetchStockLocations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stock-management?action=stock_locations");
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "API error");
      setStockData(json.data);
    } catch (err) {
      console.error("Fetch stock error:", err);
      setError("Failed to fetch stock locations");
    } finally {
      setLoading(false);
    }
  };

  // Fetch godown summary
  const fetchGodownSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stock-management?action=godown_summary");
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "API error");
      setGodownSummary(json.data);
    } catch (err) {
      console.error("Fetch summary error:", err);
      setError("Failed to fetch godown summary");
    } finally {
      setLoading(false);
    }
  };

  // Load data when viewMode changes
  useEffect(() => {
    if (viewMode === "locations") {
      fetchStockLocations();
    } else {
      fetchGodownSummary();
    }
  }, [viewMode]);

  // Filter stock data based on search term
  const filteredStockData = stockData.filter(
    (item) =>
      item.godown_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.godown_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // ✅ Export to Excel — All or filtered items
  const exportToExcel = (mode = 'all') => {
    const dataToExport = mode === 'filtered' && searchTerm
      ? filteredStockData
      : viewMode === 'locations' ? stockData : godownSummary;

    if (dataToExport.length === 0) {
      toast('⚠️ No data to export');
      return;
    }

    let worksheetData;
    let sheetName;
    let fileNamePrefix;

    if (viewMode === 'locations') {
      // Stock Locations view
      worksheetData = dataToExport.map(item => ({
        'Godown': item.godown_name || '—',
        'Location': item.godown_location || '—',
        'Item Name': item.item_name || '—',
        'Product ID': item.product_id || '—',
        'Quantity': item.quantity || 0,
        'Unit': item.unit_name || '—',
        'Status': item.stock_status || 'Unknown',
        'Created At': item.created_at
          ? new Date(item.created_at).toLocaleString()
          : '—',
      }));
      sheetName = 'Stock Locations';
      fileNamePrefix = 'Stock_Locations';
    } else {
      // Godown Summary view
      worksheetData = dataToExport.map(g => ({
        'Godown Name': g.godown_name || '—',
        'Location': g.location || '—',
        'Total Items': g.total_items || 0,
        'Total Quantity': g.total_quantity || 0,
      }));
      sheetName = 'Godown Summary';
      fileNamePrefix = 'Godown_Summary';
    }

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Auto-fit columns
    const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
      wch: Math.max(
        key.length + 2,
        ...worksheetData.map(row => String(row[key] || '').length)
      )
    }));
    ws['!cols'] = colWidths;

    const timestamp = new Date().toISOString().slice(0, 10);
    const modePrefix = mode === 'filtered' && searchTerm ? 'Filtered_' : '';
    const fileName = `${modePrefix}${fileNamePrefix}_${timestamp}.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success(`✅ Exported ${dataToExport.length} rows to Excel`);
  };

  // ✅ Export to PDF — Branded, A4-ready
  const exportToPDF = async (mode = 'all') => {
    const dataToExport = mode === 'filtered' && searchTerm
      ? filteredStockData
      : viewMode === 'locations' ? stockData : godownSummary;

    if (dataToExport.length === 0) {
      toast('⚠️ No data to export');
      return;
    }

    try {
      toast.loading('🎨 Generating branded PDF...', { id: 'pdf-export' });

      // 🔹 Create printable content
      const printDiv = document.createElement('div');
      printDiv.id = 'print-content';
      printDiv.style.padding = '20mm 15mm';
      printDiv.style.width = '210mm';
      printDiv.style.fontFamily = 'Segoe UI, system-ui, sans-serif';
      printDiv.style.fontSize = '9px';
      printDiv.style.color = '#2d3748';
      printDiv.style.lineHeight = '1.4';

      // 🔷 Header
      const title = viewMode === 'locations'
        ? 'Stock Locations Report'
        : 'Godown Summary Report';
      const header = document.createElement('div');
      header.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #4a90e2, #68d391); padding: 10px 20px; border-radius: 12px; color: white; font-weight: bold; font-size: 16px;">
          📦 ${title}
        </div>
        <p style="font-size: 10px; color: #666; margin-top: 6px;">
          ${mode === 'filtered' && searchTerm ? `Filtered: "${searchTerm}" • ` : ''}
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

      const thead = document.createElement('thead');
      if (viewMode === 'locations') {
        thead.innerHTML = `
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <th style="padding: 5px; text-align: left; font-weight: bold;">Godown</th>
          <th style="padding: 5px; text-align: left; font-weight: bold;">Location</th>
          <th style="padding: 5px; text-align: left; font-weight: bold;">Item</th>
          <th style="padding: 5px; text-align: right; font-weight: bold;">Qty</th>
          <th style="padding: 5px; text-align: left; font-weight: bold;">Unit</th>
          <th style="padding: 5px; text-align: center; font-weight: bold;">Status</th>
        </tr>
      `;
      } else {
        thead.innerHTML = `
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <th style="padding: 5px; text-align: left; font-weight: bold;">Godown</th>
          <th style="padding: 5px; text-align: left; font-weight: bold;">Location</th>
          <th style="padding: 5px; text-align: right; font-weight: bold;">Items</th>
          <th style="padding: 5px; text-align: right; font-weight: bold;">Qty</th>
        </tr>
      `;
      }
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      dataToExport.forEach(item => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #f1f5f9';

        if (viewMode === 'locations') {
          const statusBg =
            item.stock_status === 'Available' ? '#dcfce7' :
              item.stock_status === 'Low Stock' ? '#fef9c3' : '#fee2e2';
          const statusColor =
            item.stock_status === 'Available' ? '#16a34a' :
              item.stock_status === 'Low Stock' ? '#ca8a04' : '#dc2626';

          row.innerHTML = `
          <td style="padding: 5px; vertical-align: top; font-weight: 600;">${item.godown_name || '—'}</td>
          <td style="padding: 5px; vertical-align: top;">${item.godown_location || '—'}</td>
          <td style="padding: 5px; vertical-align: top;">${item.item_name || '—'}</td>
          <td style="padding: 5px; vertical-align: top; text-align: right; font-weight: bold;">${item.quantity || 0}</td>
          <td style="padding: 5px; vertical-align: top;">${item.unit_name || '—'}</td>
          <td style="padding: 3px; vertical-align: top; text-align: center;">
            <span style="background-color:${statusBg};color:${statusColor};padding:1px 5px;border-radius:8px;font-size:7px;font-weight:bold;">
              ${item.stock_status || '—'}
            </span>
          </td>
        `;
        } else {
          row.innerHTML = `
          <td style="padding: 5px; vertical-align: top; font-weight: 600;">${item.godown_name || '—'}</td>
          <td style="padding: 5px; vertical-align: top;">${item.location || '—'}</td>
          <td style="padding: 5px; vertical-align: top; text-align: right; font-weight: bold;">${item.total_items || 0}</td>
          <td style="padding: 5px; vertical-align: top; text-align: right; font-weight: bold;">${item.total_quantity || 0}</td>
        `;
        }
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      printDiv.appendChild(table);

      // 🔷 Footer
      const footer = document.createElement('div');
      footer.style.marginTop = '20px';
      footer.style.fontSize = '7px';
      footer.style.color = '#94a3b8';
      footer.style.textAlign = 'center';
      footer.style.borderTop = '1px dashed #cbd5e1';
      footer.style.paddingTop = '8px';
      footer.innerHTML = `
      <p>Stock Management System • ${window.location.origin}</p>
    `;
      printDiv.appendChild(footer);

      // Render PDF
      document.body.appendChild(printDiv);
      const canvas = await html2canvas(printDiv, { scale: 2, useCORS: true });
      document.body.removeChild(printDiv);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas, 'JPEG', 0, 0, imgWidth, imgHeight);

      const timestamp = new Date().toISOString().slice(0, 10);
      const modePrefix = mode === 'filtered' && searchTerm ? 'Filtered_' : '';
      const fileNamePrefix = viewMode === 'locations' ? 'Stock_Locations' : 'Godown_Summary';
      pdf.save(`${modePrefix}${fileNamePrefix}_${timestamp}.pdf`);

      toast.success('✅ Branded PDF exported!', { id: 'pdf-export' });

    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('❌ Failed to generate PDF', { id: 'pdf-export' });
    }
  };
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-lg text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Stock Management
        </h1>

        {/* Search input - only show in locations view */}
        {viewMode === " " && (
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}
        {/* Download Button */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 opacity-0 pointer-events-none">
            Download
          </label>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center justify-between w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold shadow-blue-500/25"
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
            <div className="absolute top-full w-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 ring-opacity-5 z-20 overflow-hidden">
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

      {/* View toggle */}
      <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-2 rounded-md transition-all ${viewMode === "locations"
              ? "bg-white text-blue-600 shadow-sm"
              : "bg-transparent text-gray-600 hover:text-gray-800"
            }`}
          onClick={() => setViewMode("locations")}
        >
          Stock Locations
        </button>
        <button
          className={`px-4 py-2 rounded-md transition-all ${viewMode === "summary"
              ? "bg-white text-blue-600 shadow-sm"
              : "bg-transparent text-gray-600 hover:text-gray-800"
            }`}
          onClick={() => setViewMode("summary")}
        >
          Godown Summary
        </button>
      </div>

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
          <SkeletonLoader rows={7} />
        </div>
      ) : viewMode === "locations" ? (
        // Stock Locations Table
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                    Godown
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                    Created Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStockData.length > 0 ? (
                  filteredStockData.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.godown_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.godown_location}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {item.item_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 ">
                        {item.unit_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <StockStatusBadge status={item.stock_status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {searchTerm ? "No matching products found" : "No stock data found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredStockData.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 text-xs text-gray-700 border-t border-gray-200">
              Showing {filteredStockData.length} of {stockData.length} items
              {searchTerm && ` filtered by "${searchTerm}"`}
            </div>
          )}
        </div>
      ) : (
        // Godown Summary Cards for mobile and table for desktop
        <>
          {/* Mobile view - cards */}
          <div className="md:hidden grid gap-4">
            {godownSummary.length > 0 ? (
              godownSummary.map((g, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {g.godown_name}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
                      {g.location}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Total Items</p>
                      <p className="font-bold text-lg">{g.total_items}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Quantity</p>
                      <p className="font-bold text-lg">{g.total_quantity}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl">
                No godown summary data found
              </div>
            )}
          </div>

          {/* Desktop view - table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                      Godown
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                      Total Items
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                      Total Quantity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
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
    </div>
  );
}
