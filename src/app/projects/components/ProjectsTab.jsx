'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";

export default function ProjectsTab({
  projects,
  isLoading,
  error,
  handleView,
  handlePayment, // Make sure this is received 
  handleServices,
  handleProductAllocation,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'descending' });
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // New status filter state
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const currentOpenDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showStatusFilterMenu, setShowStatusFilterMenu] = useState(false); // New state for status filter dropdown

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Focus search input on Ctrl/Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Effect to handle clicks outside of dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (openDropdownId && currentOpenDropdownRef.current && !currentOpenDropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  const downloadExcel = () => {
    try {
      // Prepare project rows
      const projectRows = processedProjects.map(project => ({
        'Project Name': project.CM_Project_Name || '',
        'Project Code': project.CM_Project_Code || '',
        'Customer': project.CM_Customer_Name || '',
        'Project Type': project.CM_Project_Type || '',
        'Location': project.CM_Project_Location || '',
        'Engineer': project.Project_Leader_Name || '',
        'Status': project.CM_Status || '',
        'Estimated Cost': project.CM_Estimated_Cost || 0,
        'Description': project.CM_Description || '',
        'Created At': project.CM_Created_At
          ? new Date(project.CM_Created_At).toLocaleDateString()
          : ''
      }));

      // Summary row AFTER all project data
      const summaryRow = {
        'Project Name': 'SUMMARY',
        'Project Code': `Total Projects: ${processedProjects.length}`,
        'Customer': `Project Type Filter: ${projectTypeFilter === 'all' ? 'All Projects' : projectTypeFilter}`,
        'Project Type': `Status Filter: ${statusFilter === 'all' ? 'All Statuses' : statusFilter}`, // Include status filter in summary
        'Location': `Generated: ${new Date().toLocaleDateString()}`,
        'Engineer': '',
        'Status': '',
        'Estimated Cost': '',
        'Description': '',
        'Created At': ''
      };

      // Combine all rows
      const dataToExport = [
        ...projectRows,
        {},   // blank row
        summaryRow
      ];

      // Create CSV
      const headers = Object.keys(projectRows[0]).join(',');
      const csvContent = dataToExport
        .map(row =>
          Object.values(row).map(field =>
            typeof field === "string" &&
              (field.includes(",") || field.includes('"') || field.includes("\n"))
              ? `"${field.replace(/"/g, '""')}"`
              : field
          ).join(',')
        ).join("\n");

      const fullCsv = `${headers}\n${csvContent}`;

      // Download file
      const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `projects_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success("Excel downloaded with summary below the project list!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download Excel file");
    }
  };

  const downloadPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF("p", "pt", "a4");
      const currentDate = new Date().toLocaleDateString();

      // ---------- COMPANY INFO ----------
      const logo = "/saranlogo.png"; // must be inside public folder
      const companyName = "Saran Solar Private Limited";
      const companyAddress = [
        "131/2, Main Road,",
        "Kullampalayam,",
        "Gobichettipalayam – 638476,",
        "Tamil Nadu, India.",
      ];

      // Logo (40px width)
      doc.addImage(logo, "PNG", 40, 30, 50, 50);

      // Company Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(companyName, 110, 50);

      // Address
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      let addressY = 68;
      companyAddress.forEach((line) => {
        doc.text(line, 110, addressY);
        addressY += 14;
      });

      // Decorative Line (brand look)
      doc.setDrawColor(70, 130, 180);
      doc.setLineWidth(0.8);
      doc.line(15, 42, 195, 42);

      // ---------- MAIN TITLE ----------
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Projects Report", 40, 140);

      // ---------- SUMMARY ----------
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(`Generated on: ${currentDate}`, 40, 165);
      doc.text(`Total Projects: ${processedProjects.length}`, 40, 185);
      doc.text(
        `Project Type Filter: ${projectTypeFilter === "all" ? "All Projects" : projectTypeFilter}`,
        40,
        205
      );
      doc.text(
        `Status Filter: ${statusFilter === "all" ? "All Statuses" : statusFilter}`,
        40,
        225
      );

      // ---------- TABLE ----------
      autoTable(doc, {
        startY: 250,
        head: [[
          "Project Name",
          "Customer",
          "Type",
          "Location",
          "Engineer",
          "Status",
          "Est. Cost",
        ]],
        body: processedProjects.map((p) => [
          p.CM_Project_Name || "N/A",
          p.CM_Customer_Name || "N/A",
          p.CM_Project_Type || "N/A",
          p.CM_Project_Location || "N/A",
          p.Project_Leader_Name || "N/A",
          p.CM_Status || "N/A",
          p.CM_Estimated_Cost
            ? p.CM_Estimated_Cost.toLocaleString("en-IN")
            : "0",
        ]),
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
        },
      });

      // ---------- SAVE ----------
      doc.save(`projects_${new Date().toISOString().split("T")[0]}.pdf`);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  // Get all unique statuses from projects
  const allStatuses = useMemo(() => {
    const statuses = {};
    projects.forEach(project => {
      if (project.CM_Status) {
        statuses[project.CM_Status] = (statuses[project.CM_Status] || 0) + 1;
      }
    });
    return statuses;
  }, [projects]);

  // Count projects by status for filter display
  const statusCounts = useMemo(() => {
    const counts = { 'all': projects.length };
    Object.keys(allStatuses).forEach(status => {
      counts[status] = allStatuses[status];
    });
    return counts;
  }, [projects, allStatuses]);

  // Sort and filter projects
  const processedProjects = useMemo(() => {
    let filteredProjects = [...projects];

    // Apply project type filter
    if (projectTypeFilter !== 'all') {
      if (projectTypeFilter === 'Others') {
        filteredProjects = filteredProjects.filter(project =>
          project.CM_Project_Type !== 'Web Application' &&
          project.CM_Project_Type !== 'Mobile Application' &&
          project.CM_Project_Type !== 'Web Development'
        );
      } else {
        filteredProjects = filteredProjects.filter(project =>
          project.CM_Project_Type === projectTypeFilter
        );
      }
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredProjects = filteredProjects.filter(project =>
        project.CM_Status === statusFilter
      );
    }

    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filteredProjects = filteredProjects.filter(project => {
        const safeStringCheck = (value) => {
          if (value == null) return false;
          return String(value).toLowerCase().includes(lowercaseSearch);
        };

        return (
          safeStringCheck(project.CM_Project_Name) ||
          safeStringCheck(project.CM_Project_ID) ||
          safeStringCheck(project.CM_Project_Code) ||
          safeStringCheck(project.CM_Project_Leader_ID) ||
          safeStringCheck(project.CM_Status) ||
          safeStringCheck(project.CM_Project_Status) ||
          safeStringCheck(project.CM_Company_ID) ||
          safeStringCheck(project.CM_Customer_ID) ||
          safeStringCheck(project.CM_Project_Location) ||
          safeStringCheck(project.CM_Project_Type) ||
          safeStringCheck(project.CM_Description) ||
          safeStringCheck(project.CM_Estimated_Cost)
        );
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredProjects.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle null/undefined values
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        // Handle numeric values
        if (sortConfig.key.includes('Cost') || sortConfig.key.includes('Budget')) {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        }

        // Handle date values
        if (sortConfig.key.includes('Date')) {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    } else {
      // Default sort by creation date if no sort config
      filteredProjects.sort((a, b) =>
        new Date(b.CM_Created_At) - new Date(a.CM_Created_At)
      );
    }

    return filteredProjects;
  }, [projects, searchTerm, sortConfig, projectTypeFilter, statusFilter]);

  // Count project types for displaying in filter
  const projectTypeCounts = useMemo(() => {
    const counts = {
      'Kilo Watts': 0,
      'Mega Watts': 0,
      'Others': 0,
      'total': projects.length
    };

    projects.forEach(project => {
      if (project.CM_Project_Type === 'Kilo Watts') {
        counts['Kilo Watts']++;
      } else if (project.CM_Project_Type === 'Mega Watts') {
        counts['Mega Watts']++;
      } else {
        counts['Others']++;
      }
    });

    return counts;
  }, [projects]);

  // Handle sort request
  const handleSort = (key) => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  // Render sort indicator
  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;

    return (
      <span className="ml-1">
        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
      </span>
    );
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setProjectTypeFilter('all');
    setStatusFilter('all');
    searchInputRef.current?.focus();
  };

  // Helper functions with international formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    // Handle various input types
    if (amount == null || amount === '') return '₹0';

    // Convert to number
    let numericAmount;
    if (typeof amount === 'string') {
      // Remove any existing currency symbols and commas
      const cleanAmount = amount.replace(/[₹,]/g, '').trim();
      numericAmount = parseFloat(cleanAmount);
    } else {
      numericAmount = Number(amount);
    }

    if (isNaN(numericAmount) || numericAmount === 0) return '₹0';

    // Format based on size
    if (numericAmount >= 100000) {
      // For lakhs and crores (Indian numbering system)
      if (numericAmount >= 10000000) { // 1 crore
        const crores = numericAmount / 10000000;
        return `₹${crores.toFixed(1)}Cr`;
      } else if (numericAmount >= 100000) { // 1 lakh
        const lakhs = numericAmount / 100000;
        return `₹${lakhs.toFixed(1)}L`;
      }
    }

    // Standard formatting for smaller amounts
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericAmount);
  };

  // International color palette for status badges
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'active':
        return 'bg-teal-100 text-teal-800 border border-teal-200';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'planning':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'on hold':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-800 border border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Get status badge icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '✅';
      case 'active':
        return '⚡';
      case 'inactive':
        return '💤';
      default:
        return '📝';
    }
  };

  // Mobile Project Card Component
  const MobileProjectCard = ({ project }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4">
        {/* Main Card Content */}
        <div className="flex justify-between items-center gap-2 mb-2">
          <ActionDropdown project={project} />
          <div className="flex items-center flex-1 min-w-0">
            <div className="min-w-0 flex-1 justify-between items-center">
              <h3 className="font-medium text-gray-900 text-sm truncate">{project.CM_Project_Name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{project.CM_Project_Code}</p>
            </div>
          </div>
        </div>

        {/* Status and Type Row */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.CM_Status)}`}>
            {getStatusIcon(project.CM_Status)} {project.CM_Status}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${project.CM_Project_Type === 'Web Application'
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            : project.CM_Project_Type === 'Mobile Application'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : project.CM_Project_Type === 'Web Development'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
            {project.CM_Project_Type || 'Unknown'}
          </span>
        </div>

        {/* Basic Info Grid */}
        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Customer:</span>
            <span className="text-gray-900 font-medium truncate ml-2">{project.CM_Customer_Name || 'No Customer'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Engineer:</span>
            <span className="text-gray-900 font-medium truncate ml-2">{project.Project_Leader_Name || 'Not Assigned'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Location:</span>
            <span className="text-gray-900 font-medium truncate ml-2">{project.CM_Project_Location || 'Not Assigned'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Est. Cost:</span>
            <span className="text-gray-900 font-medium">{formatCurrency(project.CM_Estimated_Cost)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Improved ActionDropdown component with payment functionality
  const ActionDropdown = ({ project }) => {
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState(null);
    const [showDropdownContent, setShowDropdownContent] = useState(false);

    const setLocalRef = useCallback((node) => {
      if (openDropdownId === project.CM_Project_ID) {
        currentOpenDropdownRef.current = node;
      }
    }, [openDropdownId, project.CM_Project_ID]);

    // Recalculate dropdown position and trigger animation
    useEffect(() => {
      let timer;
      if (openDropdownId === project.CM_Project_ID && buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        const estimatedDropdownHeight = 140; // Increased height for additional payment option
        const verticalGap = 8;
        const horizontalPadding = 8;

        let top;
        let left;

        const spaceBelow = viewportHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;

        if (spaceBelow >= estimatedDropdownHeight + verticalGap) {
          top = buttonRect.bottom + verticalGap;
        } else if (spaceAbove >= estimatedDropdownHeight + verticalGap) {
          top = buttonRect.top - (estimatedDropdownHeight + verticalGap);
        } else {
          top = buttonRect.bottom + verticalGap;
          top = Math.min(top, viewportHeight - estimatedDropdownHeight - verticalGap);
          top = Math.max(top, verticalGap);
        }

        const dropdownWidth = 224;
        const preferredLeft = buttonRect.right - dropdownWidth;
        left = Math.max(horizontalPadding, preferredLeft);
        if (left + dropdownWidth > viewportWidth - horizontalPadding) {
          left = viewportWidth - dropdownWidth - horizontalPadding;
        }
        left = Math.max(horizontalPadding, left);

        setDropdownPosition({ top, left });

        timer = setTimeout(() => {
          setShowDropdownContent(true);
        }, 0);

      } else {
        setDropdownPosition(null);
        setShowDropdownContent(false);
      }

      return () => {
        clearTimeout(timer);
      };
    }, [openDropdownId, project.CM_Project_ID]);

    const handleToggle = (e) => {
      e.stopPropagation();
      if (openDropdownId === project.CM_Project_ID) {
        setOpenDropdownId(null);
      } else {
        setOpenDropdownId(project.CM_Project_ID);
      }
    };

    const isDropdownOpenAndPositioned = openDropdownId === project.CM_Project_ID && dropdownPosition;

    return (
      <div className="relative inline-block text-right h-full" ref={setLocalRef} style={{ zIndex: 9999 }}>
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm p-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-150"
          id={`menu-button-${project.CM_Project_ID}`}
          aria-expanded={isDropdownOpenAndPositioned}
          aria-haspopup="true"
          aria-label="More actions"
          title="More actions"
        >
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {isDropdownOpenAndPositioned && (
          <div
            ref={dropdownRef}
            className={`absolute left-10 right-0 mt-2 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none 
          transform transition ease-out duration-150 
          ${showDropdownContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          origin-top-right`}
            style={{
              minWidth: "14rem",
              zIndex: 100,
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
            }}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby={`menu-button-${project.CM_Project_ID}`}
            tabIndex="-1"
          >
            <div className="py-1 z-[9999]" >
              <button
                onClick={() => { handleView(project); setOpenDropdownId(null); }}
                className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                role="menuitem"
              >
                <span className="mr-3 text-base">👁️</span>
                View Details
              </button>
              <button
                onClick={() => { handleProductAllocation(project); setOpenDropdownId(null); }}
                className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                role="menuitem"
              >
                <span className="mr-3 text-base">📦</span>
                Manage Products
              </button>
              <button
                onClick={() => { handlePayment(project); setOpenDropdownId(null); }}
                className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                role="menuitem"
              >
                <span className="mr-3 text-base">💰</span>
                Payment Management
              </button>
              <button
                onClick={() => { handleServices(project); setOpenDropdownId(null); }}
                className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                role="menuitem"
              >
                <span className="mr-3 text-base">🛠️</span>
                Services & Transport
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full">
      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* First Row: Filters + Search */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {/* Search Bar */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 sm:pl-10 pr-10 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-md text-black placeholder-gray-500 transition-colors duration-200"
                  placeholder="Search... (Ctrl+K)"
                  aria-label="Search projects"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                    aria-label="Clear search"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Project Type Filter */}
            <div className="relative inline-block text-left w-full sm:w-auto">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="inline-flex items-center justify-between w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-haspopup="true"
                aria-expanded={showFilterMenu}
              >
                <div className="flex items-center truncate">
                  <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {projectTypeFilter === 'all' ? 'All Types' : projectTypeFilter}
                  </span>
                </div>
                <svg
                  className={`ml-2 h-4 w-4 flex-shrink-0 transition-transform duration-200 ${showFilterMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showFilterMenu && (
                <div className="absolute left-0 mt-2 w-56 origin-top-left bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                  <div className="p-2">
                    <button
                      onClick={() => { setProjectTypeFilter('all'); setShowFilterMenu(false); }}
                      className={`flex items-center w-full px-3 py-3 text-sm rounded-lg transition-all duration-150 ${projectTypeFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <div className="w-2 h-2 rounded-full bg-gray-400 mr-3"></div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">All Types</div>
                        <div className="text-xs text-gray-500 mt-0.5">{projectTypeCounts.total} projects</div>
                      </div>
                      {projectTypeFilter === 'all' && (
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    {[
                      { key: 'Web Application', label: '🌐 Web Application' },
                      { key: 'Mobile Application', label: '📱 Mobile Application' },
                      { key: 'Web Development', label: '💻 Web Development' },
                      { key: 'Others', label: '📁 Others' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => { setProjectTypeFilter(key); setShowFilterMenu(false); }}
                        className={`flex items-center w-full px-3 py-3 text-sm rounded-lg transition-all duration-150 ${projectTypeFilter === key ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <div className="flex-1 text-left">
                          <div className="font-medium">{label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{projectTypeCounts[key] || 0} projects</div>
                        </div>
                        {projectTypeFilter === key && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative inline-block text-left w-full sm:w-auto">
              <button
                onClick={() => setShowStatusFilterMenu(!showStatusFilterMenu)}
                className="inline-flex items-center justify-between w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-haspopup="true"
                aria-expanded={showStatusFilterMenu}
              >
                <div className="flex items-center truncate">
                  <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {statusFilter === 'all' ? 'All Statuses' : statusFilter}
                  </span>
                </div>
                <svg
                  className={`ml-2 h-4 w-4 flex-shrink-0 transition-transform duration-200 ${showStatusFilterMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showStatusFilterMenu && (
                <div className="absolute left-0 mt-2 w-56 origin-top-left bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                  <div className="p-2 max-h-96 overflow-y-auto">
                    <button
                      onClick={() => { setStatusFilter('all'); setShowStatusFilterMenu(false); }}
                      className={`flex items-center w-full px-3 py-3 text-sm rounded-lg transition-all duration-150 ${statusFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <div className="w-2 h-2 rounded-full bg-gray-400 mr-3"></div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">All Statuses</div>
                        <div className="text-xs text-gray-500 mt-0.5">{statusCounts.all} projects</div>
                      </div>
                      {statusFilter === 'all' && (
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    {Object.keys(allStatuses).map((status) => (
                      <button
                        key={status}
                        onClick={() => { setStatusFilter(status); setShowStatusFilterMenu(false); }}
                        className={`flex items-center w-full px-3 py-3 text-sm rounded-lg transition-all duration-150 ${statusFilter === status ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-center w-6 h-6 mr-2">
                          <span className="text-sm">{getStatusIcon(status)}</span>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{status}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{statusCounts[status] || 0} projects</div>
                        </div>
                        {statusFilter === status && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Download Button */}
            <div className="relative inline-block text-left w-full sm:w-auto">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center justify-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-xs sm:text-sm font-medium"
                aria-haspopup="true"
                aria-expanded={showDownloadMenu}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden xs:inline">Download</span>
                <span className="xs:hidden">DL</span>
                <svg
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                  <div className="p-2">
                    <button
                      onClick={() => { setShowDownloadMenu(false); downloadExcel(); }}
                      className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-150 group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Excel</div>
                        <div className="text-xs text-gray-500">.xlsx</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowDownloadMenu(false); downloadPDF(); }}
                      className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-150 group mt-1"
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200 transition-colors flex-shrink-0">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">PDF</div>
                        <div className="text-xs text-gray-500">.pdf</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active filters indicator */}
          {(projectTypeFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Active filters:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {projectTypeFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    Type: {projectTypeFilter}
                    <button
                      onClick={() => setProjectTypeFilter('all')}
                      className="ml-1.5 text-blue-600 hover:text-blue-800 focus:outline-none"
                      aria-label={`Remove filter: ${projectTypeFilter}`}
                    >
                      ×
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="ml-1.5 text-green-600 hover:text-green-800 focus:outline-none"
                      aria-label={`Remove filter: ${statusFilter}`}
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <span className="truncate max-w-[120px]">"{searchTerm}"</span>
                    <button
                      onClick={clearSearch}
                      className="ml-1.5 text-yellow-600 hover:text-yellow-800 focus:outline-none flex-shrink-0"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      {!isMobile && (
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
              <tr>
                <th scope="col" className="w-12 relative py-3 px-2 sm:px-4">
                  <span className="sr-only">Actions</span>
                </th>
                <th
                  scope="col"
                  className="py-3 px-2 sm:px-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('CM_Project_Name')}
                >
                  <div className="flex items-center gap-1">
                    <span className="hidden sm:inline">Project Name</span>
                    <span className="sm:hidden">Project</span>
                    {renderSortIndicator('CM_Project_Name')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="hidden md:table-cell py-3 px-2 sm:px-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('CM_Customer_Name')}
                >
                  <div className="flex items-center gap-1">
                    Customer
                    {renderSortIndicator('CM_Customer_Name')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="hidden sm:table-cell py-3 px-2 sm:px-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('CM_Project_Type')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {renderSortIndicator('CM_Project_Type')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="hidden lg:table-cell py-3 px-2 sm:px-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('CM_Project_Location')}
                >
                  <div className="flex items-center gap-1">
                    Location
                    {renderSortIndicator('CM_Project_Location')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="hidden xl:table-cell py-3 px-2 sm:px-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('CM_Project_Leader_ID')}
                >
                  <div className="flex items-center gap-1">
                    Engineer
                    {renderSortIndicator('CM_Project_Leader_ID')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="py-3 px-2 sm:px-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('CM_Status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {renderSortIndicator('CM_Status')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="hidden sm:table-cell py-3 px-2 sm:px-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('CM_Estimated_Cost')}
                >
                  <div className="flex items-center gap-1">
                    <span className="hidden md:inline">Est. Cost</span>
                    <span className="md:hidden">Cost</span>
                    {renderSortIndicator('CM_Estimated_Cost')}
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            {!isLoading && !error && processedProjects.length > 0 && (
              <tbody className="bg-white divide-y divide-gray-200">
                {processedProjects.map((project) => (
                  <tr
                    key={project.CM_Project_ID}
                    className="hover:bg-blue-50 transition-colors duration-150"
                  >
                    <td className="px-2 sm:px-4 py-3 text-sm" style={{ position: 'relative', zIndex: '9999' }}>
                      <ActionDropdown project={project} />
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{project.CM_Project_Name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 truncate">{project.CM_Project_Code}</div>
                        </div>
                      </div>
                    </td>

                    <td className="hidden md:table-cell px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                      <span className="truncate">{project.CM_Customer_Name || 'No Customer'}</span>
                    </td>

                    <td className="hidden sm:table-cell px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${project.CM_Project_Type === 'Web Application'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : project.CM_Project_Type === 'Mobile Application'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : project.CM_Project_Type === 'Web Development'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                        {project.CM_Project_Type || 'Unknown'}
                      </span>
                    </td>

                    <td className="hidden lg:table-cell px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                      <span className="truncate">{project.CM_Project_Location || 'Not Specified'}</span>
                    </td>

                    <td className="hidden xl:table-cell px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
                      <span className="truncate">{project.Project_Leader_Name || 'Not Assigned'}</span>
                    </td>

                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.CM_Status)}`}>
                        {project.CM_Status}
                      </span>
                    </td>

                    <td className="hidden sm:table-cell px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900">
                      {formatCurrency(project.CM_Estimated_Cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      )}

      {/* Mobile Card View */}
      {isMobile && !isLoading && !error && processedProjects.length > 0 && (
        <div className="p-3 sm:p-4 space-y-3">
          {processedProjects.map((project) => (
            <MobileProjectCard key={project.CM_Project_ID} project={project} />
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="relative w-20 h-20">

            {/* Core Server */}
            <div className="absolute inset-6 bg-blue-600 rounded-lg animate-pulse shadow-lg"></div>

            {/* Data Lines */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-data-flow"></div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1 w-full bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-data-flow-reverse"></div>

            {/* Corner Nodes */}
            <span className="absolute top-0 left-0 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-150"></span>
            <span className="absolute bottom-0 left-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-300"></span>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-500"></span>

          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 sm:p-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg">
            <div className="flex gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-red-800">Error loading projects</h3>
                <p className="text-xs sm:text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && processedProjects.length === 0 && (
        <div className="text-center py-8 sm:py-12 px-3 sm:px-4">
          <svg className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
            {(searchTerm || projectTypeFilter !== 'all' || statusFilter !== 'all')
              ? 'No matching projects found'
              : 'No projects yet'}
          </h3>
          <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto mb-4 sm:mb-6">
            {projectTypeFilter !== 'all' && statusFilter !== 'all' && searchTerm
              ? `No ${projectTypeFilter === 'Others' ? 'other' : projectTypeFilter} projects with status "${statusFilter}" match your search "${searchTerm}".`
              : projectTypeFilter !== 'all' && statusFilter !== 'all'
                ? `No ${projectTypeFilter === 'Others' ? 'other' : projectTypeFilter} projects with status "${statusFilter}" found.`
                : projectTypeFilter !== 'all' && searchTerm
                  ? `No ${projectTypeFilter === 'Others' ? 'other' : projectTypeFilter} projects match your search "${searchTerm}".`
                  : statusFilter !== 'all' && searchTerm
                    ? `No projects with status "${statusFilter}" match your search "${searchTerm}".`
                    : projectTypeFilter !== 'all'
                      ? `No ${projectTypeFilter === 'Others' ? 'other' : projectTypeFilter} projects found.`
                      : statusFilter !== 'all'
                        ? `No projects with status "${statusFilter}" found.`
                        : searchTerm
                          ? `No projects match your search "${searchTerm}".`
                          : 'Get started by creating your first project.'}
          </p>
          {(searchTerm || projectTypeFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={clearAllFilters}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}