'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function AllocationRequestsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 500,
    offset: 0,
    hasMore: false
  });
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // New state for project search recommendations
  const [projectSuggestions, setProjectSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  // Color palette constants
  const colors = {
    background: '#fafbfc',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    border: '#e1e5e9',
    borderLight: '#f0f2f5',
    textPrimary: '#2d3748',
    textSecondary: '#718096',
    textTertiary: '#a0aec0',
    accentPrimary: '#4a90e2',
    accentPrimaryHover: '#357abd',
    accentSecondary: '#68d391',
    status: {
      pending: '#f6e05e',
      pendingBg: '#fefcbf',
      approved: '#68d391',
      approvedBg: '#c6f6d5',
      partial: '#4fd1c7',
      partialBg: '#b2f5ea',
      rejected: '#fc8181',
      rejectedBg: '#fed7d7'
    }
  };

  // Set current month and year as default
  useEffect(() => {
    const currentDate = new Date();
    setMonthFilter(String(currentDate.getMonth() + 1).padStart(2, '0'));
    setYearFilter(String(currentDate.getFullYear()));

    // Fetch projects for suggestions
    fetchProjects();
  }, []);

  // Fetch projects for search suggestions
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProjects(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Debounced search function
  const debouncedFetchRequests = useCallback(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      fetchRequests();
    }, 500); // 500ms delay

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  useEffect(() => {
    // Reset to first page when any filter changes
    setPagination(prev => ({ ...prev, offset: 0 }));

    // Use debounced search for search term, immediate fetch for other filters
    if (searchTerm !== '') {
      debouncedFetchRequests();
    } else {
      fetchRequests();
    }

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [filter, sortOrder, monthFilter, yearFilter]);

  // Handle search term changes separately with debouncing
  useEffect(() => {
    if (searchTerm !== '') {
      // Update project suggestions based on search term
      const filteredProjects = projects.filter(project =>
        project.CM_Project_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.CM_Project_ID?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setProjectSuggestions(filteredProjects.slice(0, 5)); // Show top 5 suggestions
      setShowSuggestions(true);

      debouncedFetchRequests();
    } else {
      // If search term is cleared, fetch immediately
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      setProjectSuggestions([]);
      setShowSuggestions(false);
      fetchRequests();
    }
  }, [searchTerm, projects]);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('status', filter);
      params.append('limit', pagination.limit.toString());
      params.append('offset', pagination.offset.toString());
      params.append('sort', sortOrder);

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (monthFilter) {
        params.append('month', monthFilter);
      }

      if (yearFilter) {
        params.append('year', yearFilter);
      }

      const response = await fetch(`/api/products/allocate/requests?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch requests');
      }

      // Sort the requests by date
      let sortedRequests = [...data.data.requests];
      if (sortOrder === 'asc') {
        sortedRequests.sort((a, b) => new Date(a.CM_Request_Date) - new Date(b.CM_Request_Date));
      } else {
        sortedRequests.sort((a, b) => new Date(b.CM_Request_Date) - new Date(a.CM_Request_Date));
      }

      // Ensure that requests match the selected filter status
      if (filter === 'Pending') {
        sortedRequests = sortedRequests.map(request => ({
          ...request,
          CM_Status: 'Pending' // Force status to be "Pending" when in Pending tab
        }));
      }

      setRequests(sortedRequests);
      setPagination({
        total: data.data.pagination.total,
        limit: data.data.pagination.limit,
        offset: data.data.pagination.offset,
        hasMore: data.data.pagination.has_more
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load allocation requests');
    } finally {
      setLoading(false);
    }
  };

  // Handle project suggestion selection
  const handleProjectSelect = (project) => {
    setSearchTerm(project.CM_Project_Name || project.CM_Project_ID);
    setShowSuggestions(false);
    // The search will trigger automatically via useEffect
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const loadMore = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
    // Fetch more data with current filters
    setTimeout(() => fetchRequests(), 0);
  };

  const navigateToApproveScreen = (requestId) => {
    router.push(`/manager/approve?requestId=${requestId}`);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is now handled by the useEffect with debouncing
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setShowMenu(false);
    setProjectSuggestions([]);
    setShowSuggestions(false);
    // Reset to current month and year
    const currentDate = new Date();
    setMonthFilter(String(currentDate.getMonth() + 1).padStart(2, '0'));
    setYearFilter(String(currentDate.getFullYear()));
    setFilter('Pending');
    // Reset will be handled by the useEffect
  };
  // ✅ Export to Excel — Clean, with status colors as text notes
  const exportToExcel = () => {
    if (!requests || requests.length === 0) {
      toast('⚠️ No requests to export');
      return;
    }

    const worksheetData = requests.map(req => {
      // Map status to readable note
      const statusNote = req.CM_Status === 'Partially Approved'
        ? `Partially Approved (✅${req.total_approved_quantity || 0} / ⏳${req.total_pending_quantity || 0})`
        : req.CM_Status;

      return {
        'Project Name': req.CM_Project_Name || req.CM_Project_Code || '—',
        'Project Code': req.CM_Project_Code || '—',
        'Requester': req.requested_by_name || req.CM_Requested_By || '—',
        'Request Date': req.CM_Request_Date ? new Date(req.CM_Request_Date).toLocaleString() : '—',
        'Total Items': req.item_count || 0,
        'Status': statusNote,
        'Approved Qty': req.total_approved_quantity || 0,
        'Pending Qty': req.total_pending_quantity || 0,
      };
    });

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Allocation Requests');

    // Auto-fit columns
    const colWidths = worksheetData.length > 0
      ? Object.keys(worksheetData[0]).map(key => ({
        wch: Math.max(
          key.length + 2,
          ...worksheetData.map(row => (String(row[key] || '')).length)
        )
      }))
      : [];
    ws['!cols'] = colWidths;

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `Allocation_Requests_${filter}_${timestamp}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success(`✅ Exported ${requests.length} ${filter.toLowerCase()} request(s) to Excel`);
  };

  // ✅ Export to PDF — Branded, matching your UI aesthetics
  const exportToPDF = async () => {
    if (!requests || requests.length === 0) {
      toast('⚠️ No requests to export');
      return;
    }

    try {
      toast.loading('🎨 Generating branded PDF...', { id: 'pdf-gen' });

      // 🔹 Use your existing color palette
      const {
        surface,
        surfaceElevated,
        border,
        textPrimary,
        textSecondary,
        status: { pendingBg, approvedBg, partialBg, rejectedBg, pending, approved, partial, rejected }
      } = colors;

      // 🔹 Create printable content — styled like your dashboard
      const printDiv = document.createElement('div');
      printDiv.id = 'print-content';
      printDiv.style.width = '210mm';
      printDiv.style.padding = '20mm 15mm';
      printDiv.style.fontFamily = '"Segoe UI", system-ui, sans-serif';
      printDiv.style.fontSize = '10px';
      printDiv.style.color = textPrimary;
      printDiv.style.lineHeight = '1.5';
      printDiv.style.backgroundColor = surface;

      // 🔹 Header
      const header = document.createElement('div');
      header.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #4a90e2, #68d391); padding: 12px 24px; border-radius: 12px; color: white; font-weight: bold; font-size: 16px;">
          📋 Allocation Requests Report
        </div>
        <p style="font-size: 10px; color: ${textSecondary}; margin-top: 8px;">
          Status: <strong>${filter}</strong> • 
          Total: <strong>${requests.length}</strong> • 
          Generated: ${new Date().toLocaleString()}
        </p>
      </div>
    `;
      printDiv.appendChild(header);

      // 🔹 Table container
      const tableContainer = document.createElement('div');
      tableContainer.style.overflow = 'hidden';
      tableContainer.style.borderRadius = '12px';
      tableContainer.style.border = `1px solid ${border}`;
      tableContainer.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.1)';
      tableContainer.style.backgroundColor = surfaceElevated;

      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '9px';

      // 🔹 Table header
      const thead = document.createElement('thead');
      thead.innerHTML = `
      <tr style="background: ${surface};">
        <th style="padding: 8px; text-align: left; font-weight: bold; color: ${textPrimary}; border-bottom: 1px solid ${border};">Project</th>
        <th style="padding: 8px; text-align: left; font-weight: bold; color: ${textPrimary}; border-bottom: 1px solid ${border};">Requester</th>
        <th style="padding: 8px; text-align: center; font-weight: bold; color: ${textPrimary}; border-bottom: 1px solid ${border};">Date</th>
        <th style="padding: 8px; text-align: center; font-weight: bold; color: ${textPrimary}; border-bottom: 1px solid ${border};">Items</th>
        <th style="padding: 8px; text-align: center; font-weight: bold; color: ${textPrimary}; border-bottom: 1px solid ${border};">Status</th>
      </tr>
    `;
      table.appendChild(thead);

      // 🔹 Table body
      const tbody = document.createElement('tbody');
      requests.forEach(req => {
        // 🔹 Determine status styling
        let statusBg = pendingBg, statusColor = pending, statusText = req.CM_Status;
        if (req.CM_Status === 'Approved') {
          statusBg = approvedBg; statusColor = approved;
        } else if (req.CM_Status === 'Partially Approved') {
          statusBg = partialBg; statusColor = partial;
          statusText = `✅${req.total_approved_quantity || 0} / ⏳${req.total_pending_quantity || 0}`;
        } else if (req.CM_Status === 'Rejected') {
          statusBg = rejectedBg; statusColor = rejected;
        }

        const row = document.createElement('tr');
        row.style.borderBottom = `1px solid ${border}`;
        row.innerHTML = `
        <td style="padding: 8px; vertical-align: top;">
          <div style="font-weight: bold; color: ${textPrimary};">${req.CM_Project_Name || req.CM_Project_Code}</div>
          <div style="font-size: 8px; color: ${textSecondary}; margin-top: 2px;">ID: ${req.CM_Project_Code}</div>
        </td>
        <td style="padding: 8px; vertical-align: top; color: ${textPrimary};">
          ${req.requested_by_name || req.CM_Requested_By}
        </td>
        <td style="padding: 8px; vertical-align: top; text-align: center; font-size: 8px; color: ${textSecondary};">
          ${req.CM_Request_Date ? new Date(req.CM_Request_Date).toLocaleDateString() : '—'}
        </td>
        <td style="padding: 8px; vertical-align: top; text-align: center; font-weight: bold; color: ${textPrimary};">
          ${req.item_count || 0}
        </td>
        <td style="padding: 6px; vertical-align: top; text-align: center;">
          <span style="background-color: ${statusBg}; color: ${statusColor}; padding: 2px 6px; border-radius: 12px; font-size: 7px; font-weight: bold; display: inline-block; min-width: 50px;">
            ${statusText}
          </span>
        </td>
      `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      tableContainer.appendChild(table);
      printDiv.appendChild(tableContainer);

      // 🔹 Footer branding
      const footer = document.createElement('div');
      footer.style.marginTop = '24px';
      footer.style.fontSize = '8px';
      footer.style.color = textSecondary;
      footer.style.textAlign = 'center';
      footer.style.borderTop = `1px dashed ${border}`;
      footer.style.paddingTop = '10px';
      footer.innerHTML = `
      <p style="margin: 4px 0;">Allocation Requests Dashboard • ${window.location.origin}</p>
      <p style="margin: 4px 0; font-style: italic;">Exported with ✨ branded design</p>
    `;
      printDiv.appendChild(footer);

      // 🔹 Inject & capture
      document.body.appendChild(printDiv);

      const canvas = await html2canvas(printDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: surface,
        logging: false,
      });

      document.body.removeChild(printDiv);

      // 🔹 Generate PDF (A4)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
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

      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`Allocation_Requests_${filter}_${timestamp}.pdf`);
      toast.success('✅ Branded PDF exported!', { id: 'pdf-gen' });

    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('❌ Failed to generate PDF. Try again.', { id: 'pdf-gen' });
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Generate month options
  const monthOptions = [
    { value: '', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Generate year options (last 5 years and current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: '', label: 'All Years' },
    ...Array.from({ length: 6 }, (_, i) => ({
      value: (currentYear + i).toString(),
      label: (currentYear + i).toString()
    }))
  ];

  return (
    <div className="h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 bg-white">
      {/* Dashboard Header */}
      <div className="rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 truncate" style={{ color: colors.textPrimary }}>
              Allocation Requests
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full lg:w-auto">
            <button
              onClick={toggleSortOrder}
              className="px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl text-xs sm:text-sm flex items-center transition-all duration-200 border flex-shrink-0"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary
              }}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sortOrder === 'asc' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                )}
              </svg>
              <span className="hidden xs:inline">
                {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
              </span>
            </button>
            <span
              className="px-3 py-2 rounded-xl font-medium border text-xs sm:text-sm flex-shrink-0"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary
              }}
            >
              {pagination.total} Total
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="rounded-2xl p-4 lg:p-6 mb-6 sm:mb-8" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mb-4 lg:mb-6">
          {/* Search Input with Project Suggestions - Takes 7 columns on large screens */}
          <div className="lg:col-span-7 relative">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Search Requests
            </label>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textTertiary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by project name, ID, or requester..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="block w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border rounded-xl   transition-all duration-200 text-sm sm:text-base"

                />

                {/* Project Suggestions Dropdown */}
                {showSuggestions && projectSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto border"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border
                    }}
                  >
                    <div className="px-3 py-2 text-xs font-medium border-b"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.textSecondary
                      }}
                    >
                      PROJECT SUGGESTIONS
                    </div>
                    {projectSuggestions.map((project) => (
                      <div
                        key={project.CM_Project_ID}
                        className="px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors duration-150"
                        style={{
                          borderColor: colors.borderLight,
                          color: colors.textPrimary
                        }}
                        onMouseDown={() => handleProjectSelect(project)}
                      >
                        <div className="font-medium flex items-center text-sm">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.accentPrimary }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-4m0 0h4m-4 0v4" />
                          </svg>
                          {project.CM_Project_Name}
                        </div>
                        <div className="text-xs sm:text-sm mt-1" style={{ color: colors.textSecondary }}>
                          ID: {project.CM_Project_ID}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="px-4 lg:px-6 py-2.5 sm:py-3 text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md mt-2 sm:mt-0 text-sm sm:text-base"
                style={{
                  backgroundColor: colors.accentPrimary,
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Filters and Download Section - Takes 5 columns on large screens */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
              {/* Month Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Filter by Month
                </label>
                <div className="relative">
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-2 focus:border-blue-500 appearance-none transition-all duration-200 text-sm sm:text-base"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      color: colors.textPrimary
                    }}
                  >
                    {monthOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textTertiary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Filter by Year
                </label>
                <div className="relative">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:ring-2 focus:border-blue-500 appearance-none transition-all duration-200 text-sm sm:text-base"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      color: colors.textPrimary
                    }}
                  >
                    {yearOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textTertiary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

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
                  <div className="absolute top-full w-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 ring-opacity-5 z-20 overflow-hidden">
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

        {/* Clear Filters Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t" style={{ borderColor: colors.borderLight }}>
          <div className="text-xs sm:text-sm" style={{ color: colors.textSecondary }}>
            {searchTerm || monthFilter !== String(new Date().getMonth() + 1).padStart(2, '0') || yearFilter !== String(new Date().getFullYear()) || filter !== 'Pending'
              ? 'Filters applied'
              : 'No filters applied'
            }
          </div>
          <button
            onClick={clearFilters}
            className="px-4 lg:px-5 py-2.5 flex items-center text-xs sm:text-sm rounded-xl border transition-all duration-200 w-full sm:w-auto justify-center"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.textSecondary
            }}
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="rounded-2xl p-2 mb-6 sm:mb-8" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="flex overflow-x-auto pb-2 space-x-1 scrollbar-hide">
          {[
            { key: 'Pending', label: 'Pending', count: requests.filter(r => r.CM_Status === 'Pending').length },
            { key: 'PartiallyApproved', label: 'Partial', count: requests.filter(r => r.CM_Status === 'Partially Approved').length },
            { key: 'Approved', label: 'Approved', count: requests.filter(r => r.CM_Status === 'Approved').length },
            { key: 'Rejected', label: 'Rejected', count: requests.filter(r => r.CM_Status === 'Rejected').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center min-w-max border ${filter === tab.key
                ? 'shadow-sm'
                : 'border-transparent'
                }`}
              style={filter === tab.key ? {
                backgroundColor: colors.status[tab.key.toLowerCase().replace('partiallyapproved', 'partial') + 'Bg'],
                borderColor: colors.status[tab.key.toLowerCase().replace('partiallyapproved', 'partial')],
                color: colors.textPrimary
              } : {
                backgroundColor: colors.background,
                color: colors.textSecondary
              }}
            >
              <span className="flex items-center text-xs sm:text-sm">
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full"
                    style={{
                      backgroundColor: filter === tab.key ? colors.status[tab.key.toLowerCase().replace('partiallyapproved', 'partial')] : colors.border,
                      color: colors.textPrimary
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-2xl overflow-hidden mb-8" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        {loading && requests.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
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
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 sm:h-96 px-4 sm:px-6 text-center">
            <div className="rounded-full p-4 sm:p-6 mb-4" style={{ backgroundColor: colors.background }}>
              <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.accentPrimary }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2" style={{ color: colors.textPrimary }}>No requests found</h3>
            <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 max-w-md" style={{ color: colors.textSecondary }}>
              {searchTerm || monthFilter || yearFilter || filter !== 'Pending'
                ? 'No allocation requests match your current search criteria. Try adjusting your filters or search terms.'
                : `There are currently no ${filter.toLowerCase()} allocation requests. Check back later for new requests.`
              }
            </p>
            {(searchTerm || monthFilter || yearFilter || filter !== 'Pending') && (
              <button
                onClick={clearFilters}
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-white rounded-xl transition-colors duration-200 text-sm sm:text-base"
                style={{ backgroundColor: colors.accentPrimary }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full ">
              <thead>
                <tr style={{ backgroundColor: colors.background }}>
                  <th scope="col" className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-black tracking-wider border-b" >
                    Project Details
                  </th>
                  <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-black tracking-wider border-b" >
                    Requester
                  </th>
                  <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-black tracking-wider border-b" >
                    <div className="flex items-center">
                      Request Date
                      <button
                        onClick={toggleSortOrder}
                        className="ml-1 sm:ml-2 transition-colors duration-200"
                        style={{ color: colors.textTertiary }}
                        title={sortOrder === 'asc' ? "Oldest First" : "Newest First"}
                      >
                        {sortOrder === 'asc' ? (
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </th>
                  <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-black tracking-wider border-b" >
                    Items Summary
                  </th>
                  <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-black tracking-wider border-b" >
                    Status
                  </th>
                  <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-black tracking-wider border-b" >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: colors.borderLight }}>
                {requests.map((request, index) => (
                  <tr
                    key={request.CM_Request_ID}
                    className="transition-colors duration-150 group"
                    style={{
                      backgroundColor: index % 2 === 0 ? colors.surface : colors.background
                    }}
                  >
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                      <div className="flex items-center">
                        <div className="rounded-lg p-1.5 sm:p-2 mr-3 sm:mr-4" style={{ backgroundColor: colors.background }}>
                          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.accentPrimary }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-4m0 0h4m-4 0v4" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm sm:text-base lg:text-lg font-semibold transition-colors duration-200 group-hover:text-blue-600" style={{ color: colors.textPrimary }}>
                            {request.CM_Project_Name || request.CM_Project_ID}
                          </div>
                          {request.CM_Project_Code && (
                            <div className="text-xs sm:text-sm mt-1" style={{ color: colors.textSecondary }}>Code: {request.CM_Project_Code}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                      <div className="flex items-center">
                        <div className="rounded-full p-1.5 sm:p-2 mr-2 sm:mr-3" style={{ backgroundColor: colors.background }}>
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textSecondary }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="text-xs sm:text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {request.requested_by_name || request.CM_Requested_By}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                      <div className="text-xs sm:text-sm font-medium" style={{ color: colors.textPrimary }}>
                        {formatDate(request.CM_Request_Date)}
                      </div>
                      <div className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                        {request.CM_Request_Date ? new Date(request.CM_Request_Date).toLocaleTimeString() : ''}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-base sm:text-lg font-bold" style={{ color: colors.textPrimary }}>
                            {request.item_count || 0}
                          </div>
                          <div className="text-xs sm:text-sm" style={{ color: colors.textSecondary }}>Total Items</div>
                        </div>

                        {/* Enhanced quantity breakdown */}
                        {filter === 'PartiallyApproved' && request.CM_Status === 'Partially Approved' && (
                          <div className="ml-2 sm:ml-4 pl-2 sm:pl-4 border-l" style={{ borderColor: colors.border }}>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-2" style={{ backgroundColor: colors.status.approved }}></div>
                                <span style={{ color: colors.textSecondary }}>Approved:</span>
                                <span className="font-semibold ml-1" style={{ color: colors.status.approved }}>{request.total_approved_quantity || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-2" style={{ backgroundColor: colors.status.pending }}></div>
                                <span style={{ color: colors.textSecondary }}>Pending:</span>
                                <span className="font-semibold ml-1" style={{ color: colors.status.pending }}>{request.total_pending_quantity || 0}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                      <span className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${request.CM_Status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.CM_Status === 'Approved' ? 'bg-green-100 text-green-800' :
                          request.CM_Status === 'Partially Approved' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {request.CM_Status === 'Partially Approved' && (
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                        {request.CM_Status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                      <button
                        onClick={() => navigateToApproveScreen(request.CM_Request_ID)}
                        className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm ${request.CM_Status === 'Pending'
                          ? 'text-white shadow-sm hover:shadow' :
                          request.CM_Status === 'Partially Approved'
                            ? 'text-white shadow-sm hover:shadow'
                            : 'hover:bg-gray-300'
                          }`}
                        style={request.CM_Status === 'Pending' ? {
                          backgroundColor: colors.accentPrimary
                        } : request.CM_Status === 'Partially Approved' ? {
                          backgroundColor: colors.status.partial
                        } : {
                          backgroundColor: colors.background,
                          color: colors.textPrimary
                        }}
                      >
                        {request.CM_Status === 'Pending' ? (
                          <>
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Review
                          </>
                        ) : request.CM_Status === 'Partially Approved' ? (
                          <>
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                            Continue
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Button */}
        {pagination.hasMore && (
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow border text-sm sm:text-base"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 mr-2 sm:mr-3" style={{ borderColor: colors.accentPrimary }}></div>
                  Loading More Requests...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Load More ({Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total})
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 mb-8">
        {loading && requests.length === 0 ? (
          <div className="flex items-center justify-center h-64 rounded-2xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: colors.accentPrimary }}></div>
              <span className="text-base" style={{ color: colors.textSecondary }}>Loading requests...</span>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-2xl px-4 text-center" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="rounded-full p-4 mb-4" style={{ backgroundColor: colors.background }}>
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.accentPrimary }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>No requests found</h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {searchTerm || monthFilter || yearFilter || filter !== 'Pending'
                ? 'No requests match your search criteria.'
                : `No ${filter.toLowerCase()} requests found.`
              }
            </p>
            {(searchTerm || monthFilter || yearFilter || filter !== 'Pending') && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-white rounded-xl transition-colors duration-200 text-sm"
                style={{ backgroundColor: colors.accentPrimary }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.CM_Request_ID}
              className="rounded-2xl p-4 transition-all duration-200"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
            >
              {/* Header Section */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start flex-1">
                  <div className="rounded-lg p-2 mr-3" style={{ backgroundColor: colors.background }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.accentPrimary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-4m0 0h4m-4 0v4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold truncate" style={{ color: colors.textPrimary }}>
                      {request.CM_Project_Name || request.CM_Project_ID}
                    </h3>
                    {request.CM_Project_Code && (
                      <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>Code: {request.CM_Project_Code}</p>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${request.CM_Status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  request.CM_Status === 'Approved' ? 'bg-green-100 text-green-800' :
                    request.CM_Status === 'Partially Approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {request.CM_Status}
                </span>
              </div>

              {/* Details Section */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center mb-2">
                    <div className="rounded-full p-1 mr-2" style={{ backgroundColor: colors.background }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textSecondary }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-xs" style={{ color: colors.textSecondary }}>Requester</span>
                  </div>
                  <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                    {request.requested_by_name || request.CM_Requested_By}
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <div className="rounded-full p-1 mr-2" style={{ backgroundColor: colors.background }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textSecondary }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs" style={{ color: colors.textSecondary }}>Date</span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {formatDate(request.CM_Request_Date)}
                  </p>
                </div>
              </div>

              {/* Items Summary */}
              <div className="flex justify-between items-center mb-4 p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                    {request.item_count || 0}
                  </div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>Total Items</div>
                </div>

                {filter === 'PartiallyApproved' && request.CM_Status === 'Partially Approved' && (
                  <div className="flex space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: colors.status.approved }}>
                        {request.total_approved_quantity || 0}
                      </div>
                      <div className="text-xs" style={{ color: colors.textSecondary }}>Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: colors.status.pending }}>
                        {request.total_pending_quantity || 0}
                      </div>
                      <div className="text-xs" style={{ color: colors.textSecondary }}>Pending</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigateToApproveScreen(request.CM_Request_ID)}
                className={`w-full py-2.5 rounded-xl font-medium transition-all duration-200 text-sm flex items-center justify-center ${request.CM_Status === 'Pending'
                  ? 'text-white shadow-sm' :
                  request.CM_Status === 'Partially Approved'
                    ? 'text-white shadow-sm'
                    : 'border'
                  }`}
                style={request.CM_Status === 'Pending' ? {
                  backgroundColor: colors.accentPrimary
                } : request.CM_Status === 'Partially Approved' ? {
                  backgroundColor: colors.status.partial
                } : {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary
                }}
              >
                {request.CM_Status === 'Pending' ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Review Request
                  </>
                ) : request.CM_Status === 'Partially Approved' ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    Continue Approval
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </>
                )}
              </button>
            </div>
          ))
        )}

        {/* Load More Button for Mobile */}
        {pagination.hasMore && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full py-3 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm border text-sm"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 mr-2" style={{ borderColor: colors.accentPrimary }}></div>
                Loading More...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Load More
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}