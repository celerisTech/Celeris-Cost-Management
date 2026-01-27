// src/app/stock-management/components/StockHistory.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast'; // if not already imported

const StockHistory = () => {
  const router = useRouter();

  // State
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Filter state
  const [filters, setFilters] = useState({
    itemId: '',
    sourceGodownId: '',
    destinationGodownId: '',
    startDate: '',
    endDate: '',
    page: 1,
  });

  // Options for filter dropdowns
  const [items, setItems] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  // Searchable dropdown state
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Refs for click outside detection
  const itemDropdownRef = useRef(null);
  const itemInputRef = useRef(null);

  // Filter items based on search term
  const filteredItems = items.filter(
    (item) =>
      (item.CM_Item_Name &&
        item.CM_Item_Name.toLowerCase().includes(itemSearchTerm.toLowerCase())) ||
      (item.CM_Item_Code &&
        item.CM_Item_Code.toLowerCase().includes(itemSearchTerm.toLowerCase()))
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        itemDropdownRef.current &&
        !itemDropdownRef.current.contains(event.target) &&
        itemInputRef.current &&
        !itemInputRef.current.contains(event.target)
      ) {
        setShowItemDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch items
        const itemsRes = await fetch('/api/stock-management/items');
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          if (itemsData.success) {
            setItems(itemsData.items || []);
          }
        }

        // Fetch godowns
        const godownsRes = await fetch('/api/stock-management/godowns');
        if (godownsRes.ok) {
          const godownsData = await godownsRes.json();
          if (godownsData.success) {
            setGodowns(godownsData.godowns || []);
          }
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchOptions();
  }, []);

  // Fetch transfers based on filters
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setLoading(true);

        // Build query params
        const params = new URLSearchParams();
        if (filters.itemId) params.append('itemId', filters.itemId);
        if (filters.sourceGodownId) params.append('sourceGodownId', filters.sourceGodownId);
        if (filters.destinationGodownId)
          params.append('destinationGodownId', filters.destinationGodownId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        params.append('page', filters.page.toString());
        params.append('limit', '20');

        // Fetch transfers
        const response = await fetch(`/api/stock-management/history?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch transfers');
        }

        const data = await response.json();
        if (data.success) {
          setTransfers(data.transfers || []);
          setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
        } else {
          setError(data.message || 'Failed to load transfers');
        }
      } catch (err) {
        console.error('Error fetching transfers:', err);
        setError('An error occurred while fetching transfer history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, [filters]);

  // Handle item search input changes
  const handleItemSearchChange = (e) => {
    const value = e.target.value;
    setItemSearchTerm(value);
    setShowItemDropdown(true);

    // Clear selection if search term is cleared
    if (!value) {
      setSelectedItem(null);
      setFilters((prev) => ({
        ...prev,
        itemId: '',
      }));
    }
  };

  // Handle item selection from dropdown
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setItemSearchTerm(`${item.CM_Item_Name}${item.CM_Item_Code ? ` (${item.CM_Item_Code})` : ''}`);
    setShowItemDropdown(false);

    // Update filters
    setFilters((prev) => ({
      ...prev,
      itemId: item.CM_Item_ID,
      page: 1, // Reset to first page when filter changes
    }));
  };

  // Clear selected item
  const clearSelectedItem = () => {
    setSelectedItem(null);
    setItemSearchTerm('');
    setFilters((prev) => ({
      ...prev,
      itemId: '',
      page: 1,
    }));
  };

  // Handle other filter changes
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({
        ...prev,
        page: newPage,
      }));
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      itemId: '',
      sourceGodownId: '',
      destinationGodownId: '',
      startDate: '',
      endDate: '',
      page: 1,
    });
    setSelectedItem(null);
    setItemSearchTerm('');
  };

  // Format date for display (localized)
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Generate smart page numbers with ellipsis
  const getPageNumbers = () => {
    const { page, totalPages } = pagination;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const delta = 2;
    const range = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    const pages = [1];
    if (page - delta > 2) pages.push('...');
    pages.push(...range);
    if (page + delta < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return [...new Set(pages)]; // dedupe
  };
  // ✅ Export to Excel — Filtered data only
  const exportToExcel = () => {
    if (transfers.length === 0) {
      toast.warn('No transfers to export.');
      return;
    }

    // Format filters for filename & sheet
    const filterParts = [];
    if (selectedItem) filterParts.push(`${selectedItem.CM_Item_Code || selectedItem.CM_Item_Name}`);
    if (filters.sourceGodownId) {
      const g = godowns.find(g => g.CM_Godown_ID === filters.sourceGodownId);
      if (g) filterParts.push(`From: ${g.CM_Godown_Name}`);
    }
    if (filters.destinationGodownId) {
      const g = godowns.find(g => g.CM_Godown_ID === filters.destinationGodownId);
      if (g) filterParts.push(`To: ${g.CM_Godown_Name}`);
    }
    if (filters.startDate) filterParts.push(`From: ${filters.startDate}`);
    if (filters.endDate) filterParts.push(`To: ${filters.endDate}`);

    const worksheetData = transfers.map(t => ({
      'Item Code': t.CM_Item_Code || '—',
      'Item Name': t.CM_Item_Name || '—',
      'From Godown': t.source_godown_name || '—',
      'To Godown': t.destination_godown_name || '—',
      'Quantity': t.CM_Quantity || 0,
      'Transferred By': t.CM_Created_By || '—',
      'Date': t.CM_Transfer_Date ? new Date(t.CM_Transfer_Date).toLocaleString() : '—',
      'Notes': t.CM_Notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Transfers');

    // Auto-fit columns
    const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
      wch: Math.max(
        key.length + 2,
        ...worksheetData.map(row => String(row[key] || '').length)
      )
    }));
    ws['!cols'] = colWidths;

    // Filename
    const prefix = filterParts.length ? `${filterParts.join('_')}_` : '';
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `${prefix}Stock_Transfers_${timestamp}.xlsx`.replace(/\s+/g, '_');

    XLSX.writeFile(wb, fileName);
    toast.success(`✅ Exported ${transfers.length} transfers to Excel`);
  };

  // ✅ Export to PDF — Branded, A4-ready, filtered
  const exportToPDF = async () => {
    if (transfers.length === 0) {
      toast.warn('No transfers to export.');
      return;
    }

    try {
      toast.loading('🎨 Generating branded PDF...', { id: 'pdf-export' });

      // 🔹 Create printable content
      const printDiv = document.createElement('div');
      printDiv.id = 'print-content';
      printDiv.style.padding = '20mm 15mm';
      printDiv.style.width = '210mm'; // A4
      printDiv.style.fontFamily = 'Segoe UI, system-ui, sans-serif';
      printDiv.style.fontSize = '9px';
      printDiv.style.color = '#333';
      printDiv.style.lineHeight = '1.4';

      // 🔷 Header
      const header = document.createElement('div');
      header.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #4a90e2, #68d391); padding: 10px 20px; border-radius: 12px; color: white; font-weight: bold; font-size: 16px;">
          📦 Stock Transfer History
        </div>
        <p style="font-size: 10px; color: #666; margin-top: 6px;">
          Total: <strong>${transfers.length}</strong> transfers • 
          Generated: ${new Date().toLocaleString()}
        </p>
      </div>
    `;
      printDiv.appendChild(header);

      // 🔷 Filter Summary (if any)
      const activeFilters = [];
      if (selectedItem) activeFilters.push(`Item: ${selectedItem.CM_Item_Name}`);
      if (filters.sourceGodownId) {
        const g = godowns.find(g => g.CM_Godown_ID === filters.sourceGodownId);
        if (g) activeFilters.push(`From: ${g.CM_Godown_Name}`);
      }
      if (filters.destinationGodownId) {
        const g = godowns.find(g => g.CM_Godown_ID === filters.destinationGodownId);
        if (g) activeFilters.push(`To: ${g.CM_Godown_Name}`);
      }
      if (filters.startDate || filters.endDate) {
        const dates = [filters.startDate || '—', filters.endDate || '—'];
        activeFilters.push(`Date: ${dates.join(' → ')}`);
      }

      if (activeFilters.length > 0) {
        const filterDiv = document.createElement('div');
        filterDiv.style.marginBottom = '16px';
        filterDiv.style.padding = '6px 10px';
        filterDiv.style.backgroundColor = '#f8fafc';
        filterDiv.style.borderRadius = '6px';
        filterDiv.style.border = '1px dashed #cbd5e1';
        filterDiv.innerHTML = `
        <div style="font-weight: bold; font-size: 9px; color: #4a5568;">Filters Applied:</div>
        <div style="font-size: 8px; color: #718096;">${activeFilters.join(' • ')}</div>
      `;
        printDiv.appendChild(filterDiv);
      }

      // 🔷 Table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '8px';

      // Table header
      const thead = document.createElement('thead');
      thead.innerHTML = `
      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <th style="padding: 5px; text-align: left; font-weight: bold;">Item</th>
        <th style="padding: 5px; text-align: left; font-weight: bold;">From → To</th>
        <th style="padding: 5px; text-align: right; font-weight: bold;">Qty</th>
        <th style="padding: 5px; text-align: left; font-weight: bold;">By</th>
        <th style="padding: 5px; text-align: center; font-weight: bold;">Date</th>
      </tr>
    `;
      table.appendChild(thead);

      // Table body
      const tbody = document.createElement('tbody');
      transfers.forEach(t => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #f1f5f9';
        row.innerHTML = `
        <td style="padding: 5px; vertical-align: top;">
          <div style="font-weight: bold;">${t.CM_Item_Name || '—'}</div>
          <div style="font-size: 7px; color: #718096;">${t.CM_Item_Code || ''}</div>
        </td>
        <td style="padding: 5px; vertical-align: top; font-size: 7.5px;">
          ${t.source_godown_name || '—'}<br/>
          <span style="color: #a0aec0;">→</span> ${t.destination_godown_name || '—'}
        </td>
        <td style="padding: 5px; vertical-align: top; text-align: right; font-weight: bold;">${t.CM_Quantity || 0}</td>
        <td style="padding: 5px; vertical-align: top;">${t.CM_Created_By || '—'}</td>
        <td style="padding: 5px; vertical-align: top; text-align: center; font-size: 7.5px;">
          ${t.CM_Transfer_Date ? new Date(t.CM_Transfer_Date).toLocaleDateString() : '—'}
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
      footer.style.color = '#94a3b8';
      footer.style.textAlign = 'center';
      footer.style.borderTop = '1px dashed #cbd5e1';
      footer.style.paddingTop = '8px';
      footer.innerHTML = `
      <p>Stock Transfer History • ${window.location.origin}</p>
    `;
      printDiv.appendChild(footer);

      // Render
      document.body.appendChild(printDiv);
      const canvas = await html2canvas(printDiv, { scale: 2, useCORS: true });
      document.body.removeChild(printDiv);

      // Generate PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas, 'JPEG', 0, 0, imgWidth, imgHeight);

      // Save
      const timestamp = new Date().toISOString().slice(0, 10);
      const prefix = activeFilters.length ? 'Filtered_' : '';
      pdf.save(`${prefix}Stock_Transfers_${timestamp}.pdf`);

      toast.success('✅ Branded PDF exported!', { id: 'pdf-export' });

    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('❌ Failed to generate PDF.', { id: 'pdf-export' });
    }
  };
  
  // ======== RENDER ======== //
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* Title + Subtitle */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Stock Transfer History
            </h1>
          </div>

          {/* Download Button */}
          <div className="relative w-full md:w-auto">
            <label className="block text-sm font-medium mb-2 opacity-0 pointer-events-none">
              Download
            </label>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center justify-between w-full md:w-48 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold shadow-blue-500/25"
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
              <div className="absolute top-full w-full md:w-48 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 ring-opacity-5 z-20 overflow-hidden">
                {/* Excel */}
                <button
                  onClick={() => { setShowMenu(false); exportToExcel(); }}
                  className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-all group border-b border-slate-100"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                    </svg>
                  </div>
                  <div className="font-medium">Download Excel</div>
                </button>

                {/* PDF */}
                <button
                  onClick={() => { setShowMenu(false); exportToPDF(); }}
                  className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all group"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="font-medium">Download PDF</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Filter Transfers</h2>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset Filters
            </button>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Item Filter — Searchable Dropdown */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Item</label>
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <input
                    ref={itemInputRef}
                    type="text"
                    placeholder="Search items…"
                    value={itemSearchTerm}
                    onChange={handleItemSearchChange}
                    onFocus={() => setShowItemDropdown(true)}
                    className="w-full py-2.5 pl-4 pr-10 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  {selectedItem && (
                    <button
                      type="button"
                      onClick={clearSelectedItem}
                      className="absolute inset-y-0 right-10 flex items-center px-2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear selection"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                {showItemDropdown && (
                  <div
                    ref={itemDropdownRef}
                    className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredItems.length > 0 ? (
                      <ul className="py-1">
                        {filteredItems.map((item) => (
                          <li
                            key={item.CM_Item_ID}
                            onClick={() => handleItemSelect(item)}
                            className="px-4 py-2.5 cursor-pointer hover:bg-blue-50 text-sm text-gray-800 transition-colors flex flex-col gap-0.5"
                          >
                            <span className="font-medium">{item.CM_Item_Name}</span>
                            {item.CM_Item_Code && (
                              <span className="text-xs text-gray-500">Code: {item.CM_Item_Code}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No items found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Source Godown */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From Godown</label>
              <select
                value={filters.sourceGodownId}
                onChange={(e) => handleFilterChange('sourceGodownId', e.target.value)}
                className="w-full py-2.5 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                {godowns.map((godown) => (
                  <option key={godown.CM_Godown_ID} value={godown.CM_Godown_ID}>
                    {godown.CM_Godown_Name}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Godown */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To Godown</label>
              <select
                value={filters.destinationGodownId}
                onChange={(e) => handleFilterChange('destinationGodownId', e.target.value)}
                className="w-full py-2.5 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                {godowns.map((godown) => (
                  <option key={godown.CM_Godown_ID} value={godown.CM_Godown_ID}>
                    {godown.CM_Godown_Name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full py-2.5 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full py-2.5 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Selected Item Badge */}
          {selectedItem && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Selected Item:</span>
              <span className="inline-flex items-center bg-blue-50 text-blue-800 text-sm px-2.5 py-1 rounded-full">
                {selectedItem.CM_Item_Name}
                {selectedItem.CM_Item_Code && (
                  <span className="ml-1 opacity-75">({selectedItem.CM_Item_Code})</span>
                )}
                <button
                  type="button"
                  onClick={clearSelectedItem}
                  className="ml-2 -mr-1 text-blue-600 hover:text-blue-800"
                  aria-label="Remove item"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center">
          <svg
            className="h-5 w-5 mr-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Results Card */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        {/* Loading State */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-t-blue-500 border-r-transparent mb-3"></div>
            <p className="text-sm font-medium">Fetching transfer history…</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-600  tracking-wider"
                    >
                      Item
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-600  tracking-wider"
                    >
                      From
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-600  tracking-wider"
                    >
                      To
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-600  tracking-wider"
                    >
                      Qty
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-600  tracking-wider"
                    >
                      By / Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-600  tracking-wider"
                    >
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transfers.length > 0 ? (
                    transfers.map((transfer) => (
                      <tr
                        key={transfer.CM_Transfer_ID}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {transfer.CM_Item_Name || '—'}
                          </div>
                          {transfer.CM_Item_Code && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {transfer.CM_Item_Code}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {transfer.source_godown_name || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {transfer.destination_godown_name || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transfer.CM_Quantity}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          <div>{transfer.CM_Created_By || '—'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatDate(transfer.CM_Transfer_Date)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs break-words">
                          {transfer.CM_Notes || '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-gray-100 p-3 rounded-full mb-3">
                            <svg
                              className="h-8 w-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-800">No transfers found</h3>
                          <p className="text-gray-500 mt-1">
                            Try adjusting your filters or check back later.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="px-4 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </div>

                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg ${pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    aria-label="Previous page"
                  >
                    Prev
                  </button>

                  {getPageNumbers().map((pageNum, idx) =>
                    typeof pageNum === 'number' ? (
                      <button
                        key={`page-${pageNum}-${idx}`}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg ${pagination.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        aria-label={`Go to page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    ) : (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-3 py-1.5 text-sm text-gray-500"
                        aria-hidden="true"
                      >
                        …
                      </span>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg ${pagination.page === pagination.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StockHistory;