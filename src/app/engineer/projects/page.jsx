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

  // Apply filters and search
  useEffect(() => {
    let filtered = projects;

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
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-yellow-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 md:gap-6">
              {/* Left: Title */}
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-800 tracking-tight mb-2">
                  Projects
                </h1>
                <p className="text-slate-600 text-sm sm:text-base">Manage your allocated projects and tasks</p>
              </div>

              {/* Right: Stats */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">{filteredProjects.length}</div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Projects</div>
                </div>
                <div className="h-6 sm:h-8 w-px bg-slate-300"></div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">{projects.length}</div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total</div>
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
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 border border-blue-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
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
                    .filter(type => !['Web Development', 'Mobile Application','Web Application', 'Others'].includes(type))
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

          {/* Projects List - Table View for Desktop, Grid for Mobile */}
          {isMobile ? (
            // Mobile Grid View
            <div className="space-y-3">
              {filteredProjects.map((project, index) => {
                const taskStats = getTaskStats(project);
                const progressPercentage = taskStats.total > 0 
                  ? Math.round((taskStats.completed / taskStats.total) * 100) 
                  : 0;

                return (
                  <div
                    key={project.CM_Project_ID}
                    className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all duration-150 animate-slide-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{project.CM_Project_Name || '-'}</h3>
                        <p className="text-xs text-gray-500">{project.CM_Project_Code || '-'}</p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap ${getTaskStatusBadge(project.CM_Status)}`}>
                        {project.CM_Status || 'Unknown'}
                      </span>
                    </div>

                    {/* Type & Customer */}
                    <div className="flex items-center gap-2 mb-2">
                      {project.CM_Project_Type && (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded border ${getProjectTypeColor(project.CM_Project_Type)}`}>
                          {project.CM_Project_Type}
                        </span>
                      )}
                      <span className="text-xs text-gray-600">{project.CM_Customer_Name || '-'}</span>
                    </div>

                    {/* Location & Engineer */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <p className="font-medium text-gray-700">{project.CM_Project_Location || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Engineer:</span>
                        <p className="font-medium text-gray-700 truncate">{project.Project_Leader_Name || '-'}</p>
                      </div>
                    </div>

                    {/* Task Stats - Compact */}
                    <div className="flex items-center gap-1.5 mb-2 text-xs">
                      <div className="flex items-center gap-0.5 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <span className="font-bold text-blue-700">{taskStats.total}</span>
                        <span className="text-blue-600">tasks</span>
                      </div>
                      <div className="flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="font-semibold text-emerald-700">✓</span>
                        <span className="font-bold text-emerald-700">{taskStats.completed}</span>
                      </div>
                      <div className="flex items-center gap-0.5 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        <span className="font-semibold text-red-700">⚠</span>
                        <span className="font-bold text-red-700">{taskStats.overdue}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-10 text-right">{progressPercentage}%</span>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleUpdateTasks(project)}
                      className="w-full px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all duration-150 shadow-sm flex items-center justify-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Update Tasks
                    </button>
                  </div>
                );
              })}

              {/* Empty State - Mobile */}
              {filteredProjects.length === 0 && projects.length > 0 && (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <svg className="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">No projects found</h3>
                  <p className="text-slate-500 text-xs mb-3">Try adjusting your search or filters</p>
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-xs"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Desktop Table View
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-slide-in">
              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">Project Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide">Tasks</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide">Progress</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProjects.map((project, index) => {
                      const taskStats = getTaskStats(project);
                      const progressPercentage = taskStats.total > 0 
                        ? Math.round((taskStats.completed / taskStats.total) * 100) 
                        : 0;

                      return (
                        <tr 
                          key={project.CM_Project_ID}
                          className="hover:bg-blue-50 transition-colors duration-150 animate-slide-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Project Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{project.CM_Project_Name || '-'}</p>
                                <p className="text-xs text-gray-500">{project.Project_Leader_Name || '-'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Code */}
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-700">{project.CM_Project_Code || '-'}</span>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3">
                            {project.CM_Project_Type && (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getProjectTypeColor(project.CM_Project_Type)}`}>
                                {project.CM_Project_Type}
                              </span>
                            )}
                          </td>

                          {/* Customer */}
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">{project.CM_Customer_Name || '-'}</span>
                          </td>

                          {/* Location */}
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">{project.CM_Project_Location || '-'}</span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getTaskStatusBadge(project.CM_Status)}`}>
                              {project.CM_Status || 'Unknown'}
                            </span>
                          </td>

                          {/* Tasks */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="text-sm font-bold text-gray-900">{taskStats.total}</div>
                              <div className="flex items-center gap-1 text-xs">
                                <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">✓</span>
                                <span className="text-emerald-700 font-medium">{taskStats.completed}</span>
                              </div>
                            </div>
                          </td>

                          {/* Progress Bar */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-semibold text-gray-700 w-8">{progressPercentage}%</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleUpdateTasks(project)}
                              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all duration-150 shadow-sm hover:shadow-md"
                              title="Update Tasks"
                            >
                              Task
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Empty State - Desktop */}
              {filteredProjects.length === 0 && projects.length > 0 && (
                <div className="text-center py-12 px-4">
                  <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">No projects found</h3>
                  <p className="text-slate-500 text-sm mb-4">Try adjusting your search or filters</p>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}


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