'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/app/store/useAuthScreenStore';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

export default function EngineerProjectsPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectTypes, setProjectTypes] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
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

          const projectsWithMilestones = data.reduce((acc, item) => {
            const projectId = item.CM_Project_ID;

            // Initialize project if it doesn't exist
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
                milestones: {}
              };
            }

            // If there's a milestone in this row
            if (item.CM_Milestone_ID) {
              const milestoneId = item.CM_Milestone_ID;

              // Initialize milestone if it doesn't exist
              if (!acc[projectId].milestones[milestoneId]) {
                acc[projectId].milestones[milestoneId] = {
                  CM_Milestone_ID: item.CM_Milestone_ID,
                  CM_Milestone_Name: item.CM_Milestone_Name,
                  milestone_description: item.milestone_description,
                  milestone_status: item.milestone_status,
                  milestone_start_date: item.milestone_start_date,
                  milestone_end_date: item.milestone_end_date,
                  milestone_weightage: item.milestone_weightage,
                  tasks: []
                };
              }

              // Add the task to the milestone if it exists
              if (item.CM_Task_ID) {
                // Prevent duplicate tasks by checking if it already exists
                const existingTaskIndex = acc[projectId].milestones[milestoneId].tasks.findIndex(t => t.CM_Task_ID === item.CM_Task_ID);
                
                if (existingTaskIndex === -1) {
                  // Check if task_status exists, if not fall back to active_status
                  const taskStatus = item.task_status || (item.task_active_status === 'Active' ? 'Pending' : 'Inactive');

                  acc[projectId].milestones[milestoneId].tasks.push({
                    CM_Task_ID: item.CM_Task_ID,
                    CM_Task_Name: item.CM_Task_Name,
                    CM_Engineer_ID: item.CM_Engineer_ID,
                    CM_Assign_Date: item.CM_Assign_Date,
                    CM_Due_Date: item.CM_Due_Date,
                    task_status: taskStatus
                  });
                }
              }
            }

            return acc;
          }, {});

          // Convert to array and convert milestone objects to arrays
          const projectsArray = Object.values(projectsWithMilestones).map(project => {
            project.milestones = Object.values(project.milestones);
            return project;
          });

          setProjects(projectsArray);
          setFilteredProjects(projectsArray);

          // Extract unique project types
          const types = [...new Set(projectsArray.map(p => p.CM_Project_Type).filter(Boolean))];
          setProjectTypes(types);
        } catch (err) {
          console.error('Error loading projects:', err);
        } finally {
          setLoading(false);
        }
      }
      fetchProjects();
    }
  }, [user]);

  // Apply filters, search, and sort
  useEffect(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.CM_Project_Name?.toLowerCase().includes(term) ||
        project.CM_Project_Code?.toLowerCase().includes(term) ||
        project.CM_Customer_Name?.toLowerCase().includes(term)
      );
    }

    // Apply project type filter
    if (projectTypeFilter !== 'all') {
      filtered = filtered.filter(project => project.CM_Project_Type === projectTypeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.CM_Status === statusFilter);
    }

    // Sort projects: Most pending tasks first
    filtered.sort((a, b) => {
      const getPendingCount = (project) => {
        if (!project.milestones || project.milestones.length === 0) return 0;
        
        let pendingCount = 0;
        project.milestones.forEach(milestone => {
          if (milestone.tasks) {
            milestone.tasks.forEach(task => {
              if (
                task.task_status === 'Pending' ||
                task.task_status === 'Active' ||
                (!task.task_status && task.task_active_status === 'Active')
              ) {
                pendingCount++;
              }
            });
          }
        });
        return pendingCount;
      };

      const pendingA = getPendingCount(a);
      const pendingB = getPendingCount(b);

      // Primary sort: Most pending tasks first (descending)
      if (pendingA !== pendingB) {
        return pendingB - pendingA;
      }
      
      // Secondary sort by project name
      return (a.CM_Project_Name || '').localeCompare(b.CM_Project_Name || '');
    });

    setFilteredProjects(filtered);
  }, [searchTerm, projectTypeFilter, statusFilter, projects]);

  const toggleProjectExpansion = (projectId) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const handleUpdateTasks = (project) => {
    router.push(
      `/engineer/taskupdate?projectId=${project.CM_Project_ID}&projectName=${encodeURIComponent(project.CM_Project_Name)}`
    );
  };

  const handleAddProducts = (project) => {
    router.push(`/projects/products?projectId=${project.CM_Project_ID}&projectName=${encodeURIComponent(project.CM_Project_Name)}`);
  };

  const isOverdue = (dueDate, status) => {
    // If task is already completed, it's not overdue
    if (status === 'Completed') return false;

    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getTaskStatusBadge = (status) => {
    const statusConfig = {
      'Active': 'bg-green-100 text-green-800 border border-green-200',
      'Inactive': 'bg-gray-100 text-gray-500 border border-gray-200',
      'Completed': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      'On Hold': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'In Progress': 'bg-blue-100 text-blue-800 border border-blue-200',
      'Pending': 'bg-gray-100 text-gray-800 border border-gray-200',
      'Overdue': 'bg-red-100 text-red-800 border border-red-200',
      'Not Started': 'bg-gray-100 text-gray-800 border border-gray-200'
    };

    // If status is null/undefined, default to 'Pending'
    if (!status) return statusConfig['Pending'];

    return statusConfig[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  // Get color for project type
  const getProjectTypeColor = (projectType) => {
    const colorMap = {
      'Construction': 'bg-purple-100 text-purple-800 border-purple-200',
      'Maintenance': 'bg-orange-100 text-orange-800 border-orange-200',
      'Installation': 'bg-blue-100 text-blue-800 border-blue-200',
      'Renovation': 'bg-pink-100 text-pink-800 border-pink-200',
      'Inspection': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Repair': 'bg-red-100 text-red-800 border-red-200',
      'Development': 'bg-green-100 text-green-800 border-green-200',
      'Research': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Web Development': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Mobile Application': 'bg-teal-100 text-teal-800 border-teal-200',
      'Others': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return colorMap[projectType] || 'bg-blue-200 text-gray-700 border-blue-500';
  };

  const getTaskStats = (project) => {
    if (!project.milestones || project.milestones.length === 0) {
      return { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 };
    }

    // Flatten all tasks from all milestones
    const allTasks = project.milestones.reduce((tasks, milestone) => {
      return tasks.concat(milestone.tasks || []);
    }, []);

    return {
      total: allTasks.length,
      completed: allTasks.filter(task => task.task_status === 'Completed').length,
      inProgress: allTasks.filter(task => task.task_status === 'In Progress').length,
      pending: allTasks.filter(task =>
        task.task_status === 'Pending' ||
        task.task_status === 'Active' ||
        (!task.task_status && task.task_active_status === 'Active')
      ).length,
      overdue: allTasks.filter(task =>
        task.task_status !== 'Completed' && isOverdue(task.CM_Due_Date, task.task_status)
      ).length
    };
  };

  const clearFilters = () => {
    setSearchTerm('');
    setProjectTypeFilter('all');
    setStatusFilter('all');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white border border-red-200 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 text-center">Access Required</h2>
          <p className="text-gray-600 text-center mb-6 text-sm sm:text-base">Please log in to view your allocated projects.</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg text-sm sm:text-base"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen">
        <Navbar />
        <div className="flex-1 overflow-y-auto md:ml-64 pt-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 2xl:px-8">
            {/* Header Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="animate-pulse">
                <div className="h-6 sm:h-8 bg-slate-200 rounded w-1/2 sm:w-1/3 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 sm:w-1/2"></div>
              </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-200">
                <div className="animate-pulse">
                  <div className="h-5 sm:h-6 bg-slate-200 rounded w-1/3 sm:w-1/4"></div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 sm:gap-4 animate-pulse">
                      <div className="col-span-3 sm:col-span-2 h-4 bg-slate-200 rounded"></div>
                      <div className="col-span-4 sm:col-span-3 h-4 bg-slate-200 rounded"></div>
                      <div className="col-span-3 sm:col-span-2 h-4 bg-slate-200 rounded"></div>
                      <div className="col-span-2 sm:col-span-2 h-4 bg-slate-200 rounded"></div>
                      <div className="col-span-3 sm:col-span-2 h-4 bg-slate-200 rounded"></div>
                      <div className="col-span-1 h-4 bg-slate-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-screen">
        <Navbar />
        <div className="flex-1 p-3 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">My Allocated Projects & Tasks</h1>
            </div>

            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-700 mb-2 sm:mb-3">No Projects Assigned</h2>
                <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">You currently don't have any projects allocated. Check back later or contact your manager.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm sm:text-base"
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

  return (
    <div className="flex h-screen ">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full 2xl:max-w-[1800px]">
          {/* Toolbar (Header & Filters) - Excel Style */}
          <div className="mb-3 flex flex-col md:flex-row items-center justify-between gap-3 bg-white">
            {/* Left: Title & Stats */}
            <div className="flex items-center gap-4 border-r border-slate-300 pr-4">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap">
                Projects
              </h1>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">Total:</span>
                  <span className="text-blue-600">{projects.length}</span>
                </div>
              </div>
            </div>

            {/* Right: Filters */}
            <div className="flex flex-1 items-center gap-2 w-full justify-end">
              {/* Search Input */}
              <div className="relative max-w-xs w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-2 text-sm border border-slate-300 text-gray-700 rounded-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50"
                />
              </div>

              {/* Project Type Filter */}
              <select
                value={projectTypeFilter}
                onChange={(e) => setProjectTypeFilter(e.target.value)}
                className="px-2 py-2 text-sm border text-gray-700 border-slate-300 rounded-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 min-w-[120px]"
              >
                <option value="all">All Types</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Application">Mobile Application</option>
                <option value="Web Application">Web Application</option>
                <option value="Others">Others</option>
                {projectTypes
                  .filter(type => !['Web Development', 'Mobile Application','Web Application', 'Others'].includes(type))
                  .map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))
                }
              </select>

              {/* Clear Filters Button */}
              <button
                onClick={clearFilters}
                className="px-2 py-2 text-sm border text-gray-700 border-slate-300 rounded-sm hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium"
                title="Clear Filters"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear
              </button>
            </div>
          </div>

          {/* Projects List - Excel-style Table View */}
          <div className="bg-white shadow-sm border border-slate-300 overflow-hidden animate-slide-in">
            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Project Name</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Code</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Type</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Customer</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Location</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Status</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Tasks</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Progress</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center border border-slate-300">
                        <svg className="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-sm font-semibold text-slate-700 mb-1">No projects found</h3>
                        <p className="text-slate-500 text-xs mb-3">Try adjusting your search or filters</p>
                        <button
                          onClick={clearFilters}
                          className="px-3 py-1 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors text-xs"
                        >
                          Clear Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project, index) => {
                      const taskStats = getTaskStats(project);
                      const progressPercentage = taskStats.total > 0 
                        ? Math.round((taskStats.completed / taskStats.total) * 100) 
                        : 0;

                      return (
                        <tr 
                          key={project.CM_Project_ID}
                          className="hover:bg-blue-50 transition-colors duration-150 odd:bg-white even:bg-slate-50"
                        >
                          {/* Project Name */}
                          <td className="px-3 py-2 border border-slate-300 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{project.CM_Project_Name || '-'}</p>
                                <p className="text-xs text-gray-500">{project.Project_Leader_Name || '-'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Code */}
                          <td className="px-3 py-2 border border-slate-300 whitespace-nowrap">
                            <span className="text-xs font-medium text-gray-700">{project.CM_Project_Code || '-'}</span>
                          </td>

                          {/* Type */}
                          <td className="px-3 py-2 border border-slate-300 whitespace-nowrap">
                            {project.CM_Project_Type && (
                              <span className={`inline-flex px-1.5 py-0.5 text-[11px] font-semibold rounded border ${getProjectTypeColor(project.CM_Project_Type)}`}>
                                {project.CM_Project_Type}
                              </span>
                            )}
                          </td>

                          {/* Customer */}
                          <td className="px-3 py-2 border border-slate-300 whitespace-nowrap">
                            <span className="text-xs text-gray-700">{project.CM_Customer_Name || '-'}</span>
                          </td>

                          {/* Location */}
                          <td className="px-3 py-2 border border-slate-300 whitespace-nowrap">
                            <span className="text-xs text-gray-700">{project.CM_Project_Location || '-'}</span>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2 border border-slate-300 whitespace-nowrap">
                            <span className={`inline-flex px-1.5 py-0.5 text-[11px] font-semibold rounded ${getTaskStatusBadge(project.CM_Status)}`}>
                              {project.CM_Status || 'Unknown'}
                            </span>
                          </td>

                          {/* Tasks */}
                          <td className="px-3 py-2 border border-slate-300 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <div className="text-xs font-bold text-gray-900" title="Total Tasks">{taskStats.total}</div>
                              <div className="flex items-center gap-0.5 text-[11px]" title="Completed Tasks">
                                <span className="inline-flex items-center justify-center w-4 h-4 bg-emerald-100 text-emerald-700 rounded-full font-semibold">✓</span>
                                <span className="text-emerald-700 font-medium">{taskStats.completed}</span>
                              </div>
                              <div className="flex items-center gap-0.5 text-[11px]" title="Pending Tasks">
                                <span className="inline-flex items-center justify-center w-4 h-4 bg-amber-100 text-amber-700 rounded-full font-semibold text-[9px]">⏳</span>
                                <span className="text-amber-700 font-medium">{taskStats.pending}</span>
                              </div>
                            </div>
                          </td>

                          {/* Progress Bar */}
                          <td className="px-3 py-2 border border-slate-300 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-semibold text-gray-700 w-8">{progressPercentage}%</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="px-3 py-2 border border-slate-300 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleUpdateTasks(project)}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded shadow-sm hover:shadow-md transition-all duration-150"
                              title="Update Tasks"
                            >
                              Task
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>


        </div>
      </div>

      {/* Slide-in Animation */}
      <style jsx global>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slideInUp 0.4s ease-out forwards;
          opacity: 0;
        }

        /* Extra large screens (4K and above) */
        @media (min-width: 2560px) {
          .container\? {
            max-width: 2400px !important;
          }
        }
      `}</style>
    </div>
  );
}