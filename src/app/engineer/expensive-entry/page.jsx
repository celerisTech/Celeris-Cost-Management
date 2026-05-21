// src\app\engineer\expensive-entry\page.jsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/app/store/useAuthScreenStore';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

export default function EngineerExpenseEntryPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isExtraSmallScreen, setIsExtraSmallScreen] = useState(false);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');

  const router = useRouter();

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsExtraSmallScreen(width < 375);
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsLargeScreen(width >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (user?.CM_User_ID) {
      async function fetchProjects() {
        try {
          const res = await fetch(`/api/engineer-projects?engineerId=${user.CM_User_ID}`);
          if (!res.ok) throw new Error('Failed to fetch projects');
          const data = await res.json();

          const projectsWithDetails = data.reduce((acc, item) => {
            const projectId = item.CM_Project_ID;

            if (!acc[projectId]) {
              acc[projectId] = {
                CM_Project_ID: item.CM_Project_ID,
                CM_Project_Code: item.CM_Project_Code,
                CM_Project_Type: item.CM_Project_Type,
                Project_Leader_Name: item.Project_Leader_Name,
                CM_Project_Name: item.CM_Project_Name,
                CM_Project_Location: item.CM_Project_Location,
                CM_Customer_Name: item.CM_Customer_Name,
                CM_Status: item.CM_Status,
                CM_Planned_Start_Date: item.CM_Planned_Start_Date,
                CM_Planned_End_Date: item.CM_Planned_End_Date,
              };
            }
            return acc;
          }, {});

          setProjects(Object.values(projectsWithDetails));
        } catch (err) {
          console.error('Error loading projects:', err);
        } finally {
          setLoading(false);
        }
      }
      fetchProjects();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Get unique project types for filters
  const projectTypes = useMemo(() => {
    const types = [...new Set(projects.map(project => project.CM_Project_Type).filter(Boolean))];
    return types.sort();
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch =
        project.CM_Project_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.CM_Project_Code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.CM_Customer_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.CM_Project_Location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.Project_Leader_Name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = projectTypeFilter === 'all' || project.CM_Project_Type === projectTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [projects, searchTerm, projectTypeFilter]);

  const handleUpdateProducts = (project) => {
    router.push(`/engineer/productupdate?projectId=${project.CM_Project_ID}&projectName=${encodeURIComponent(project.CM_Project_Name)}`);
  };

  const handleAddProducts = (project) => {
    router.push(`/projects/products?projectId=${project.CM_Project_ID}&projectName=${encodeURIComponent(project.CM_Project_Name)}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setProjectTypeFilter('all');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Active': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'Completed': 'bg-blue-50 text-blue-700 border border-blue-200',
      'On Hold': 'bg-amber-50 text-amber-700 border border-amber-200',
      'In Progress': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      'Pending': 'bg-slate-100 text-slate-700 border border-slate-200',
      'Cancelled': 'bg-red-50 text-red-700 border border-red-200'
    };
    return statusConfig[status] || 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  // Enhanced Loading State with better responsive design
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Navbar />
        <div className="flex-1 md:ml-0 pt-16 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
            {/* Header Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="animate-pulse">
                <div className="h-6 sm:h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>

            {/* Search Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 animate-pulse">
              <div className="h-12 bg-slate-200 rounded mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-200 rounded"></div>
                ))}
              </div>
            </div>

            {/* Responsive Skeleton Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 animate-pulse">
                  <div className="space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-200 rounded"></div>
                      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                      <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                    </div>
                    <div className="h-10 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No User State
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-3 text-center">Authentication Required</h2>
          <p className="text-slate-600 text-center mb-6 leading-relaxed text-sm sm:text-base">
            Please sign in to access project management features.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-all duration-200 shadow-sm text-sm sm:text-base"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // No Projects State
  if (projects.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Navbar />
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="mx-auto project-container">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-800 mb-2">Project Management</h1>
            </div>

            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-700 mb-3">No Projects Available</h2>
                <p className="text-slate-500 mb-6 leading-relaxed text-sm sm:text-base">
                  There are currently no projects assigned to your account. Please check back later or contact your project manager.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors duration-200 font-medium text-sm sm:text-base"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No Search Results State
  if (filteredProjects.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Navbar />
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="mx-auto project-container">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 md:gap-6">
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight mb-2">
                    Project Expenses & Products Updates
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base">
                    Manage products and expenses for your assigned projects
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">{filteredProjects.length}</div>
                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Projects</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-end">
                {/* Search Input */}
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search Projects
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by project name, code, or customer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-4 py-2.5 border border-slate-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    />
                    <svg
                      className="absolute left-3 top-3 h-4 w-4 text-slate-400"
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
                </div>

                {/* Project Type Filter */}
                <div className="w-full lg:w-48">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Project Type
                  </label>
                  <select
                    value={projectTypeFilter}
                    onChange={(e) => setProjectTypeFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  >
                    <option value="all">All Types</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Application">Mobile Application</option>
                    <option value="Web Application">Web Application</option>
                    <option value="Others">Others</option>
                    {projectTypes
                      .filter(type => !['Web Development', 'Mobile Application', 'Web Application', 'Others'].includes(type))
                      .map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={clearFilters}
                  className="w-full lg:w-auto px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear
                </button>
              </div>
            </div>

            {/* No Results */}
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-700 mb-3">No Projects Found</h2>
                <p className="text-slate-500 mb-6 leading-relaxed text-sm sm:text-base">
                  No projects match your current search and filter criteria. Try adjusting your filters or search term.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm sm:text-base"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Mobile Card Component
  const MobileProjectCard = ({ project }) => {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1 pr-3 sm:pr-4">
              <h3 className={`font-semibold text-slate-900 ${isExtraSmallScreen ? 'text-sm' : 'text-base sm:text-lg'} leading-tight mb-2 line-clamp-2 project-title`}>
                {project.CM_Project_Name || 'Unnamed Project'}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`${isExtraSmallScreen ? 'text-xs' : 'text-xs sm:text-sm'} text-slate-600 font-medium bg-slate-100 px-2 sm:px-3 py-1 rounded-lg`}>
                  {project.CM_Project_Code || 'N/A'}
                </span>
                <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(project.CM_Status)}`}>
                  {project.CM_Status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-3 sm:space-y-4 project-details">
            {/* Project Type */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`${isExtraSmallScreen ? 'text-xs' : 'text-xs'} text-slate-500 font-medium uppercase tracking-wide`}>Project Type</p>
                <p className={`${isExtraSmallScreen ? 'text-xs' : 'text-sm'} font-medium text-slate-800 truncate`}>{project.CM_Project_Type || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`${isExtraSmallScreen ? 'text-xs' : 'text-xs'} text-slate-500 font-medium uppercase tracking-wide`}>Location</p>
                <p className={`${isExtraSmallScreen ? 'text-xs' : 'text-sm'} font-medium text-slate-800 truncate`}>{project.CM_Project_Location || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`${isExtraSmallScreen ? 'text-xs' : 'text-xs'} text-slate-500 font-medium uppercase tracking-wide`}>Customer</p>
                <p className={`${isExtraSmallScreen ? 'text-xs' : 'text-sm'} font-medium text-slate-800 truncate`}>{project.CM_Customer_Name || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`${isExtraSmallScreen ? 'text-xs' : 'text-xs'} text-slate-500 font-medium uppercase tracking-wide`}>Project Lead</p>
                <p className={`${isExtraSmallScreen ? 'text-xs' : 'text-sm'} font-medium text-slate-800 truncate`}>{project.Project_Leader_Name || 'Not assigned'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex ${isExtraSmallScreen ? 'flex-col' : 'flex-col sm:flex-row'} gap-2 action-buttons`}>
            <button
              onClick={() => handleUpdateProducts(project)}
              className={`flex-1 px-3 py-${isExtraSmallScreen ? '2.5' : '2'} bg-blue-800 text-white text-xs font-medium rounded-lg hover:bg-blue-900 transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group`}
            >
              <svg className="w-3 h-3 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Update Products
            </button>

            <button
              onClick={() => handleAddProducts(project)}
              className={`flex-1 px-3 py-${isExtraSmallScreen ? '2.5' : '2'} bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Products
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Tablet Card Component
  const TabletProjectCard = ({ project }) => {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-base sm:text-lg mb-2 line-clamp-2 project-title">
                {project.CM_Project_Name || 'Unnamed Project'}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm text-slate-600 font-medium bg-slate-100 px-2 sm:px-3 py-1 rounded-lg">
                  {project.CM_Project_Code || 'N/A'}
                </span>
                <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(project.CM_Status)}`}>
                  {project.CM_Status || 'Unknown'}
                </span>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 project-details">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-medium">Type</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{project.CM_Project_Type || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-medium">Customer</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{project.CM_Customer_Name || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3 project-details">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-medium">Location</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{project.CM_Project_Location || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-medium">Project Lead</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{project.Project_Leader_Name || 'Not assigned'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1 sm:pt-2 action-buttons">
              <button
                onClick={() => handleAddProducts(project)}
                className="flex-1 px-2 sm:px-3 py-2.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-all duration-200 shadow-sm flex items-center justify-center gap-1 sm:gap-2 touch-manipulation"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                {isTablet && !isExtraSmallScreen ? "Add Products" : "Add"}
              </button>

              <button
                onClick={() => handleUpdateProducts(project)}
                className="flex-1 px-2 sm:px-3 py-2.5 bg-blue-800 text-white text-xs font-medium rounded-lg hover:bg-blue-900 transition-all duration-200 shadow-sm flex items-center justify-center gap-1 sm:gap-2 touch-manipulation"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isTablet && !isExtraSmallScreen ? "Update Products" : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Desktop Card Component for Large Screens
  const DesktopProjectCard = ({ project }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(project.CM_Status)}`}>
                {project.CM_Status || 'Unknown'}
              </span>
              <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded">
                {project.CM_Project_Code || 'N/A'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1 line-clamp-2">
              {project.CM_Project_Name || 'Unnamed Project'}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-1">
              {project.CM_Customer_Name || 'Not specified'}
            </p>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-3 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Type</p>
                <p className="text-sm font-medium text-slate-700 truncate">{project.CM_Project_Type || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Location</p>
                <p className="text-sm font-medium text-slate-700 truncate">{project.CM_Project_Location || 'Not specified'}</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-slate-500 font-medium mb-1">Project Lead</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700 truncate">{project.Project_Leader_Name || 'Not assigned'}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 mt-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddProducts(project)}
                className="flex-1 px-3 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 active:scale-95 transition-all duration-200 shadow-sm flex items-center justify-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Products
              </button>

              <button
                onClick={() => handleUpdateProducts(project)}
                className="flex-1 px-3 py-2 bg-blue-800 text-white text-xs font-medium rounded-lg hover:bg-blue-900 active:scale-95 transition-all duration-200 shadow-sm flex items-center justify-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Update Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
        <div className="mx-auto project-container">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 md:gap-6">
              {/* Left: Title */}
              <div className="text-center sm:text-left">
                <h1 className={`${isExtraSmallScreen ? 'text-lg' : 'text-xl sm:text-2xl md:text-3xl'} font-semibold text-slate-800 tracking-tight mb-2`}>
                  Project Expenses & Products Updates
                </h1>
                <p className={`text-slate-600 ${isExtraSmallScreen ? 'text-xs' : 'text-sm sm:text-base'}`}>
                  Manage products and expenses for your assigned projects
                </p>
              </div>

              {/* Right: Stats */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-center">
                  <div className={`${isExtraSmallScreen ? 'text-lg' : 'text-xl sm:text-2xl md:text-3xl'} font-bold text-slate-800`}>{filteredProjects.length}</div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Projects</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-end">
              {/* Search Input */}
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Search Projects
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={isExtraSmallScreen ? "Search projects..." : "Search by project name, code, or customer..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 border border-slate-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  />
                  <svg
                    className="absolute left-3 top-3 h-4 w-4 text-slate-400"
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
              </div>

              {/* Project Type Filter */}
              <div className="w-full lg:w-48">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Type
                </label>
                <select
                  value={projectTypeFilter}
                  onChange={(e) => setProjectTypeFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                >
                  <option value="all">All Types</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Application">Mobile Application</option>
                  <option value="Web Application">Web Application</option>
                  <option value="Others">Others</option>
                  {projectTypes
                    .filter(type => !['Web Development', 'Mobile Application', 'Web Application', 'Others'].includes(type))
                    .map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={clearFilters}
                className="w-full lg:w-auto px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear
              </button>
            </div>
          </div>

          {/* Projects List */}
          {isMobile ? (
            <div className="space-y-4 sm:space-y-6">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.CM_Project_ID}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MobileProjectCard project={project} />
                </div>
              ))}
            </div>
          ) : isTablet ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.CM_Project_ID}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TabletProjectCard project={project} />
                </div>
              ))}
            </div>
          ) : isLargeScreen && filteredProjects.length > 3 ? (
            // Grid view for large screens with many projects
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.CM_Project_ID}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <DesktopProjectCard project={project} />
                </div>
              ))}
            </div>
          ) : (
            // Table view for large screens with fewer projects
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Table Header */}
              <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-12 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm font-bold text-blue-600 tracking-wide">
                  <div className="col-span-4 lg:col-span-2">Project Name & Code</div>
                  <div className="col-span-3 lg:col-span-2">Customer</div>
                  <div className="col-span-2 lg:col-span-2">Project Type</div>
                  <div className="col-span-3 lg:col-span-2 hidden sm:block">Location</div>
                  <div className="col-span-3 lg:col-span-2 hidden md:block">Project Lead</div>
                  <div className="col-span-2 lg:col-span-1">Status</div>
                  <div className="col-span-2 lg:col-span-1 text-right">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-200">
                {filteredProjects.map((project, index) => (
                  <div
                    key={project.CM_Project_ID}
                    className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hover:bg-slate-50/50 transition-colors duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="grid grid-cols-12 gap-2 sm:gap-3 lg:gap-4 items-center">
                      {/* Project Name & Code */}
                      <div className="col-span-4 lg:col-span-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-sm mb-1 truncate">
                            {project.CM_Project_Name || 'Unnamed Project'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium truncate">
                            {project.CM_Project_Code || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Customer */}
                      <div className="col-span-3 lg:col-span-2">
                        <span className="text-sm text-slate-700 truncate block">
                          {project.CM_Customer_Name || 'Not specified'}
                        </span>
                      </div>

                      {/* Project Type */}
                      <div className="col-span-2 lg:col-span-2">
                        <span className="text-sm text-slate-700 truncate block">
                          {project.CM_Project_Type || 'Not specified'}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="col-span-3 lg:col-span-2 hidden sm:block">
                        <span className="text-sm text-slate-700 truncate block">
                          {project.CM_Project_Location || 'Not specified'}
                        </span>
                      </div>

                      {/* Project Lead */}
                      <div className="col-span-3 lg:col-span-2 hidden md:block">
                        <span className="text-sm text-slate-700 truncate block">
                          {project.Project_Leader_Name || 'Not assigned'}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 lg:col-span-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full truncate ${getStatusBadge(project.CM_Status)}`}>
                          {project.CM_Status || 'Unknown'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="col-span-2 lg:col-span-1">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-end">
                          <button
                            onClick={() => handleAddProducts(project)}
                            className="px-2 sm:px-3 py-1 sm:py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 active:scale-95 transition-all duration-200 shadow-sm flex items-center justify-center gap-1 group min-w-[60px] sm:min-w-[80px] touch-manipulation"
                            title="Add Products"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Add</span>
                          </button>

                          <button
                            onClick={() => handleUpdateProducts(project)}
                            className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-800 text-white text-xs font-medium rounded-lg hover:bg-blue-900 active:scale-95 transition-all duration-200 shadow-sm flex items-center justify-center gap-1 group min-w-[60px] sm:min-w-[80px] touch-manipulation"
                            title="Update Products"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="hidden sm:inline">Update</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Extra small devices (375px and down) */
        @media (max-width: 375px) {
          .project-title {
            font-size: 0.875rem;
            line-height: 1.25rem;
          }
          .project-details {
            font-size: 0.75rem;
            line-height: 1rem;
          }
          .action-buttons {
            flex-direction: column;
          }
          .p-2-responsive {
            padding: 0.5rem !important;
          }
          .touch-manipulation {
            touch-action: manipulation;
          }
        }
        
        /* Enhanced responsive design for very large screens */
        @media (min-width: 1920px) {
          .project-container {
            max-width: 1800px;
            margin: 0 auto;
          }
        }
        
        @media (min-width: 2560px) {
          .project-container {
            max-width: 2200px;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
