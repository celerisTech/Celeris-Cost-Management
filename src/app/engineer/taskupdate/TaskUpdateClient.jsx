// 'src\app\engineer\taskupdate\TaskUpdateClient.jsx'
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { useAuthStore } from '@/app/store/useAuthScreenStore';
import { formatSentenceCase } from '@/app/utils/textUtils';

export default function EngineerUpdatePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const projectName = searchParams.get('projectName');

  const { user } = useAuthStore();
  const engineerId = user?.CM_User_ID;

  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    remarks: '',
    workHours: '',
    image: null,
    updateDate: new Date().toISOString().split('T')[0],
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [taskHistory, setTaskHistory] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState({});
  const router = useRouter();
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    status: '',
    remarks: '',
    workHours: '',
    image: null,
    updateDate: '',
  });

  // New state for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate delay days for a task based on actual completion/update
  const calculateDelayDays = (dueDate, completionDate) => {
    if (!dueDate || !completionDate) return 0;

    const due = new Date(dueDate);
    const complete = new Date(completionDate);

    due.setHours(0, 0, 0, 0);
    complete.setHours(0, 0, 0, 0);

    if (complete > due) {
      const timeDiff = complete.getTime() - due.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      return Math.max(0, daysDiff);
    }
    return 0;
  };

  // Validate work hours (0-24)
  const validateWorkHours = (hours) => {
    const numHours = parseFloat(hours);
    return numHours >= 0 && numHours <= 24;
  };

  // Filter tasks based on search term, milestone, and status
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Get latest status for each task (compute once to avoid repeating in filters and sorts)
    const latestStatusMap = {};
    taskHistory.forEach(update => {
      const taskId = update.CM_Task_ID;
      if (
        !latestStatusMap[taskId] ||
        new Date(update.CM_Uploaded_At) > new Date(latestStatusMap[taskId].CM_Uploaded_At)
      ) {
        latestStatusMap[taskId] = update;
      }
    });

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.CM_Task_Name?.toLowerCase().includes(term) ||
        task.CM_Milestone_Name?.toLowerCase().includes(term)
      );
    }

    // Apply milestone filter
    if (selectedMilestone !== 'all') {
      filtered = filtered.filter(task => task.CM_Milestone_ID === selectedMilestone);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => {
        const latestUpdate = latestStatusMap[task.CM_Task_ID];
        const currentStatus = latestUpdate?.CM_Status || 'Not Started';
        return currentStatus === selectedStatus;
      });
    }

    // Sort tasks: Pending and Delayed first, Completed last
    return filtered.sort((a, b) => {
      const latestUpdateA = latestStatusMap[a.CM_Task_ID];
      const latestUpdateB = latestStatusMap[b.CM_Task_ID];

      const statusA = latestUpdateA?.CM_Status || 'Not Started';
      const statusB = latestUpdateB?.CM_Status || 'Not Started';

      const checkDelayed = (task, update) => {
        if (!task.CM_Due_Date) return false;
        if (update?.CM_Status === 'Completed') return false;
        
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        if (!update) {
          return calculateDelayDays(task.CM_Due_Date, todayStr) > 0;
        }
        
        return calculateDelayDays(task.CM_Due_Date, update.CM_Update_Date) > 0;
      };

      const isDelayedA = checkDelayed(a, latestUpdateA);
      const isDelayedB = checkDelayed(b, latestUpdateB);

      // Status priority order: 
      // 0: Pending or Delayed
      // 1: In Progress
      // 2: Not Started
      // 3: On Hold
      // 4: Completed
      const getPriority = (status, isDelayed) => {
        if (status === 'Pending' || isDelayed) return 0;
        if (status === 'In Progress') return 1;
        if (status === 'Not Started') return 2;
        if (status === 'On Hold') return 3;
        if (status === 'Completed') return 4;
        return 5;
      };

      const priorityA = getPriority(statusA, isDelayedA);
      const priorityB = getPriority(statusB, isDelayedB);

      // First sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Then sort by oldest assign date
      return new Date(a.CM_Assign_Date) - new Date(b.CM_Assign_Date);
    });
  }, [tasks, searchTerm, selectedMilestone, selectedStatus, taskHistory]);

  // Group filtered tasks by milestone
  const tasksByMilestone = useMemo(() => {
    const grouped = {};

    filteredTasks.forEach(task => {
      const milestoneId = task.CM_Milestone_ID || 'unassigned';
      const milestoneName = task.CM_Milestone_Name || 'Unassigned to Milestone';

      if (!grouped[milestoneId]) {
        grouped[milestoneId] = {
          name: milestoneName,
          tasks: []
        };
      }
      grouped[milestoneId].tasks.push(task);
    });

    return grouped;
  }, [filteredTasks]);

  // Calculate project statistics including delays (only for assigned tasks)
  const projectStats = useMemo(() => {
    if (!tasks.length || !taskHistory.length) {
      return {
        completed: 0,
        inProgress: 0,
        total: tasks.length,
        delayedTasks: 0,
        totalDelayDays: 0,
        averageDelay: 0
      };
    }

    const latestStatusMap = {};
    taskHistory.forEach(update => {
      const taskId = update.CM_Task_ID;
      if (
        !latestStatusMap[taskId] ||
        new Date(update.CM_Uploaded_At) > new Date(latestStatusMap[taskId].CM_Uploaded_At)
      ) {
        latestStatusMap[taskId] = update;
      }
    });

    let completedTasks = 0;
    let inProgressTasks = 0;
    let delayedTasks = 0;
    let totalDelayDays = 0;

    tasks.forEach(task => {
      const latestUpdate = latestStatusMap[task.CM_Task_ID];
      if (latestUpdate) {
        if (latestUpdate.CM_Status === "Completed") {
          completedTasks++;

          const delayDays = calculateDelayDays(task.CM_Due_Date, latestUpdate.CM_Update_Date);
          if (delayDays > 0) {
            delayedTasks++;
            totalDelayDays += delayDays;
          }
        } else if (latestUpdate.CM_Status === "In Progress") {
          inProgressTasks++;

          const delayDays = calculateDelayDays(task.CM_Due_Date, latestUpdate.CM_Update_Date);
          if (delayDays > 0) {
            delayedTasks++;
            totalDelayDays += delayDays;
          }
        }
      }
    });

    const averageDelay = delayedTasks > 0 ? (totalDelayDays / delayedTasks).toFixed(1) : 0;

    return {
      completed: completedTasks,
      inProgress: inProgressTasks,
      total: tasks.length,
      delayedTasks,
      totalDelayDays,
      averageDelay
    };
  }, [tasks, taskHistory]);

  // Calculate Project Progress %
  const projectProgress = useMemo(() => {
    if (!tasks.length || !taskHistory.length) return 0;

    const baseProgress = (projectStats.completed / projectStats.total) * 100;
    const bonusProgress = projectStats.inProgress * 5;
    const totalProgress = Math.min(baseProgress + bonusProgress, 100);
    return Math.round(totalProgress);
  }, [tasks, taskHistory, projectStats]);

  // Group task history by task
  const groupedTaskHistory = useMemo(() => {
    const grouped = {};

    taskHistory.forEach(update => {
      if (!grouped[update.CM_Task_ID]) {
        grouped[update.CM_Task_ID] = [];
      }
      grouped[update.CM_Task_ID].push(update);
    });

    Object.keys(grouped).forEach(taskId => {
      grouped[taskId].sort((a, b) => new Date(b.CM_Uploaded_At) - new Date(a.CM_Uploaded_At));
    });

    return grouped;
  }, [taskHistory]);

  // Get latest update for each task
  const getLatestUpdate = (taskId) => {
    if (!groupedTaskHistory[taskId] || groupedTaskHistory[taskId].length === 0) return null;
    return groupedTaskHistory[taskId][0];
  };

  // Helper function to get the latest In Progress date
  const getLatestInProgressDate = (taskId) => {
    const taskUpdates = groupedTaskHistory[taskId] || [];
    let latestDate = null;
    let latestDateStr = null;

    for (const update of taskUpdates) {
      if (update.CM_Status === "In Progress") {
        const updateDate = new Date(update.CM_Update_Date);
        if (!latestDate || updateDate > latestDate) {
          latestDate = updateDate;
          latestDateStr = update.CM_Update_Date;
        }
      }
    }

    return latestDateStr;
  };

  // Validate that completion date is not before latest In Progress date
  const validateCompletionDate = (taskId, selectedDate, selectedStatus) => {
    if (selectedStatus !== "Completed") return true;

    const taskUpdates = groupedTaskHistory[taskId] || [];
    let latestInProgressDate = null;

    for (const update of taskUpdates) {
      if (update.CM_Status === "In Progress") {
        const updateDate = new Date(update.CM_Update_Date);
        if (!latestInProgressDate || updateDate > latestInProgressDate) {
          latestInProgressDate = updateDate;
        }
      }
    }

    if (!latestInProgressDate) return true;

    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    latestInProgressDate.setHours(0, 0, 0, 0);

    return selectedDateObj >= latestInProgressDate;
  };

  useEffect(() => {
    if (!projectId || !engineerId) return;

    async function fetchData() {
      try {
        // Fetch tasks with milestone information
        const taskRes = await fetch(`/api/engineer-projects/${projectId}/task?engineerId=${engineerId}`);
        if (!taskRes.ok) throw new Error('Failed to fetch tasks');
        const taskData = await taskRes.json();
        setTasks(taskData);

        // Fetch milestones for this project
        const milestoneRes = await fetch(`/api/engineer-projects/${projectId}/milestones`);
        if (!milestoneRes.ok) throw new Error('Failed to fetch milestones');
        const milestoneData = await milestoneRes.json();
        setMilestones(milestoneData);

        // Fetch history only for assigned tasks
        const historyRes = await fetch(`/api/engineer-projects/${projectId}/task-history?engineerId=${engineerId}`);
        if (!historyRes.ok) throw new Error('Failed to fetch history');
        const historyData = await historyRes.json();
        setTaskHistory(historyData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId, engineerId]);

  const handleUpdateProducts = (proj) => {
    router.push(`/engineer/productupdate?projectId=${proj.CM_Project_ID}&projectName=${encodeURIComponent(proj.CM_Project_Name)}`);
  };

  const handleUpdateTask = (task) => {
    setUpdatingTask(task);
    setUpdateData({
      status: '',
      remarks: '',
      workHours: '',
      image: null,
      updateDate: new Date().toISOString().split('T')[0],
    });
    setShowUpdateModal(true);
  };

  const showCustomAlert = (message, type = 'info') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);

    setTimeout(() => {
      setShowAlert(false);
    }, 4000);
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    if (!engineerId) {
      showCustomAlert('Please log in to update tasks', 'warning');
      return;
    }

    if (updateData.workHours && !validateWorkHours(updateData.workHours)) {
      showCustomAlert('Work hours must be between 0 and 24 hours', 'error');
      return;
    }

    if (updateData.status === "Completed") {
      const isValidCompletionDate = validateCompletionDate(
        updatingTask.CM_Task_ID,
        updateData.updateDate,
        updateData.status
      );

      if (!isValidCompletionDate) {
        showCustomAlert('Completion date must be on or after the latest "In Progress" date', 'error');
        return;
      }
    }

    setAlertMessage('Updating task...');
    setAlertType('info');
    setShowAlert(true);

    // Set submitting state to true
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('engineerId', engineerId);
      formData.append('status', updateData.status);
      formData.append('remarks', updateData.remarks);
      formData.append('workHours', updateData.workHours || '0');
      formData.append('updateDate', updateData.updateDate);
      formData.append('uploadedBy', user?.CM_Full_Name || 'Unknown');

      if (updateData.image) {
        formData.append('image', updateData.image);
      }

      const response = await fetch(`/api/task-update/${updatingTask.CM_Task_ID}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        showCustomAlert('Task updated successfully!', 'success');
        setShowUpdateModal(false);

        // Refresh data
        const taskRes = await fetch(`/api/engineer-projects/${projectId}/task?engineerId=${engineerId}`);
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setTasks(taskData);
        }

        const historyRes = await fetch(`/api/engineer-projects/${projectId}/task-history?engineerId=${engineerId}`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setTaskHistory(historyData);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      showCustomAlert(`Error: ${err.message || 'Failed to update task'}. Please try again.`, 'error');
    } finally {
      // Reset submitting state
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUpdateData({ ...updateData, image: e.target.files[0] });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Toggle task history expansion
  const toggleTaskHistory = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Get delay information for a specific task based on actual updates
  const getTaskDelayInfo = (task) => {
    if (!task) return { isDelayed: false, delayDays: 0, latestStatus: 'Not Updated' };

    const latestUpdate = getLatestUpdate(task.CM_Task_ID);
    const dueDate = new Date(task.CM_Due_Date);
    const now = new Date();

    if (!latestUpdate) {
      const delayDays = calculateDelayDays(task.CM_Due_Date, now.toISOString().split('T')[0]);

      return {
        isDelayed: delayDays > 0,
        delayDays: delayDays,
        latestStatus: "Not Started",
        lastUpdated: 'Never'
      };
    }

    const updateDate = latestUpdate.CM_Update_Date;
    const delayDays = calculateDelayDays(task.CM_Due_Date, updateDate);

    return {
      isDelayed: delayDays > 0,
      delayDays: delayDays,
      latestStatus: latestUpdate.CM_Status || "Not Updated",
      lastUpdated: latestUpdate ? formatDateTime(latestUpdate.CM_Uploaded_At) : 'Never'
    };
  };

  // Function to handle edit button click
  const handleEditUpdate = (update, task) => {
    setUpdatingTask(task);
    setEditingUpdate(update);
    setEditData({
      status: update.CM_Status || '',
      remarks: update.CM_Remarks || '',
      workHours: update.CM_Work_Hours?.toString() || '',
      image: null,
      updateDate: update.CM_Update_Date || new Date().toISOString().split('T')[0],
    });
    setShowEditModal(true);
  };

  // Function to submit the edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    if (!engineerId) {
      showCustomAlert('Please log in to edit task updates', 'warning');
      return;
    }

    if (editData.workHours && !validateWorkHours(editData.workHours)) {
      showCustomAlert('Work hours must be between 0 and 24 hours', 'error');
      return;
    }

    if (editData.status === "Completed") {
      const isValidCompletionDate = validateCompletionDate(
        updatingTask.CM_Task_ID,
        editData.updateDate,
        editData.status
      );

      if (!isValidCompletionDate) {
        showCustomAlert('Completion date must be on or after the latest "In Progress" date', 'error');
        return;
      }
    }

    setAlertMessage('Updating task...');
    setAlertType('info');
    setShowAlert(true);

    try {
      const formData = new FormData();
      formData.append('updateId', editingUpdate.CM_Update_ID);
      formData.append('projectId', projectId);
      formData.append('engineerId', engineerId);
      formData.append('status', editData.status);
      formData.append('remarks', editData.remarks);
      formData.append('workHours', editData.workHours || '0');
      formData.append('updateDate', editData.updateDate);
      formData.append('uploadedBy', user?.CM_Full_Name || 'Unknown');
      formData.append('currentImageUrl', editingUpdate.CM_Image_URL || '');

      if (editData.image) {
        formData.append('image', editData.image);
      }

      const response = await fetch(`/api/task-update/${updatingTask.CM_Task_ID}/edit?_method=PUT`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        showCustomAlert('Task update edited successfully!', 'success');
        setShowEditModal(false);

        const taskRes = await fetch(`/api/engineer-projects/${projectId}/task?engineerId=${engineerId}`);
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setTasks(taskData);
        }

        const historyRes = await fetch(`/api/engineer-projects/${projectId}/task-history?engineerId=${engineerId}`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setTaskHistory(historyData);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to edit task update');
      }
    } catch (err) {
      console.error('Error editing task update:', err);
      showCustomAlert(`Error: ${err.message || 'Failed to edit task update'}. Please try again.`, 'error');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMilestone('all');
    setSelectedStatus('all');
  };

  if (loading) {
    return (
      <div className="flex flex-row h-screen bg-white">
        {/* Navbar */}
        <Navbar />
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full items-center justify-center">
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
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'On Hold':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            On Hold
          </span>
        );
      case 'Pending':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
            Pending
          </span>
        );
      case 'Not Started':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            Not Started
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
            Not Updated
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen">
      <Navbar />
      <div className="p-6 flex-1 overflow-y-auto mx-auto w-full">
        {/* Header Card with Progress & Delay Stats */}
        <div className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                {projectName}
              </h1>
            </div>

            <div className="flex flex-row gap-3 mt-4 lg:mt-0">
              <button
                onClick={() => router.back()}
                className="px-4 py-1 bg-blue-200 border border-blue-300 text-gray-700 rounded-full text-sm font-medium hover:bg-blue-300 transition shadow-sm flex items-center justify-center gap-1"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar (Header & Filters) - Excel Style */}
        <div className="mb-4 mt-2 flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-2">
          {/* Left: Title & Stats */}
          <div className="flex items-center gap-4 border-r border-slate-300 pr-4">
            <h2 className="text-md font-bold text-slate-800 tracking-tight whitespace-nowrap">
              Assigned Tasks
            </h2>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700">Total:</span>
                <span className="text-slate-600">{tasks.length}</span>
              </div>
            </div>
          </div>

          {/* Right: Filters */}
          <div className="flex flex-1 items-center gap-2 w-full justify-end flex-wrap">
            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search tasks or milestones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-2.5 text-sm text-gray-700 border border-slate-300 rounded-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50"
              />
            </div>

            {/* Milestone Filter */}
            <select
              value={selectedMilestone}
              onChange={(e) => setSelectedMilestone(e.target.value)}
              className="px-2 py-2.5 text-sm text-gray-700 border border-slate-300 rounded-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 min-w-[120px] max-w-[150px] truncate"
            >
              <option value="all">All Milestones</option>
              {milestones.map((milestone) => (
                <option key={milestone.CM_Milestone_ID} value={milestone.CM_Milestone_ID}>
                  {milestone.CM_Milestone_Name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2 py-2.5 text-sm text-gray-700 border border-slate-300 rounded-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 min-w-[100px]"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Clear Filters Button */}
            <button
              onClick={clearFilters}
              className="px-2 py-2.5 bg-slate-100 border border-slate-300 text-slate-700 rounded-sm hover:bg-slate-200 transition-colors flex items-center gap-1 text-sm font-medium"
              title="Clear Filters"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Clear
            </button>
          </div>
        </div>

        {/* Tasks List - Excel-style Table View (Desktop) & Grid (Mobile) */}
        <div className="mb-8">
          {filteredTasks.length > 0 ? (
            <>
              {/* Mobile Grid View */}
              <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-in">
                {filteredTasks.map((task, index) => {
                  const delayInfo = getTaskDelayInfo(task);
                  const taskUpdates = groupedTaskHistory[task.CM_Task_ID] || [];
                  const isExpanded = expandedTasks[task.CM_Task_ID];

                  return (
                    <div key={`mobile-${task.CM_Task_ID}`} className="bg-white border border-slate-300 rounded-md shadow-sm p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-blue-600 text-sm leading-tight">{task.CM_Task_Name}</h3>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {getStatusBadge(delayInfo.latestStatus)}
                          {delayInfo.isDelayed && delayInfo.latestStatus !== "Completed" && (
                            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                              {delayInfo.delayDays}d overdue
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-600 grid grid-cols-2 gap-2 mt-1">
                        <div className="col-span-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span className="font-semibold text-slate-700 inline-block mr-1">Milestone:</span>
                          {task.CM_Milestone_Name || 'Unassigned'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 block">Assign Date:</span>
                          {formatDate(task.CM_Assign_Date)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 block">Due Date:</span>
                          {formatDate(task.CM_Due_Date)}
                        </div>
                        <div className="col-span-2">
                          <span className="font-semibold text-slate-700 inline-block mr-1">Last Updated:</span>
                          {delayInfo.lastUpdated}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-200">
                        {taskUpdates.length > 0 ? (
                          <button
                            onClick={() => toggleTaskHistory(task.CM_Task_ID)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-200 hover:bg-slate-200 transition-colors shadow-sm"
                          >
                            {isExpanded ? 'Hide History' : 'View History'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No updates yet</span>
                        )}
                        {delayInfo.latestStatus !== "Completed" ? (
                          <button
                            onClick={() => handleUpdateTask(task)}
                            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors shadow-sm ml-auto"
                          >
                            Update
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 text-slate-400 text-xs font-medium rounded border border-slate-200 ml-auto">
                            Done
                          </span>
                        )}
                      </div>

                      {/* Mobile Expanded History */}
                      {isExpanded && taskUpdates.length > 0 && (
                        <div className="mt-1 bg-slate-50 border border-slate-200 rounded p-2 flex flex-col gap-2 shadow-inner">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-1">
                            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Update History</h4>
                            <span className="text-[10px] font-medium text-slate-500">{taskUpdates.length} update{taskUpdates.length !== 1 ? 's' : ''}</span>
                          </div>
                          {taskUpdates.map((update, idx) => (
                            <div key={update.CM_Update_ID || idx} className="bg-white p-2 border border-slate-200 rounded shadow-sm text-[11px] flex flex-col gap-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800">{formatDateTime(update.CM_Update_Date)}</span>
                                {getStatusBadge(update.CM_Status)}
                              </div>
                              <div className="flex gap-4">
                                <p className="text-slate-600"><span className="font-semibold text-slate-700">Hours:</span> {update.CM_Work_Hours || '0.00'}h</p>
                                <p className="text-slate-600"><span className="font-semibold text-slate-700">By:</span> {update.CM_Uploaded_By || 'System'}</p>
                              </div>
                              <p className="text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100"><span className="font-semibold text-slate-700 block mb-0.5">Remarks:</span> {update.CM_Remarks || '-'}</p>
                              <div className="flex justify-end items-center mt-1 pt-1.5 border-t border-slate-100 gap-2">
                                {update.CM_Image_URL && (
                                  <a href={update.CM_Image_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    View Image
                                  </a>
                                )}
                                <button
                                  onClick={() => handleEditUpdate(update, task)}
                                  className="text-[10px] px-2.5 py-1 bg-emerald-50 text-emerald-700 font-medium rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                >
                                  Edit Update
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-white shadow-sm border border-slate-300 overflow-hidden animate-slide-in">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-300">
                        <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Task Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Milestone</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Assign Date</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Due Date</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Last Updated</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Status</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-700 border border-slate-300 whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    {filteredTasks.map((task, index) => {
                      const delayInfo = getTaskDelayInfo(task);
                      const taskUpdates = groupedTaskHistory[task.CM_Task_ID] || [];
                      const isExpanded = expandedTasks[task.CM_Task_ID];

                      return (
                        <tbody key={task.CM_Task_ID}>
                          <tr className="border-b border-slate-300 hover:bg-slate-50 transition-colors odd:bg-white even:bg-slate-50">
                            <td className="px-3 py-2 border border-slate-300 font-medium text-blue-600">
                              {task.CM_Task_Name}
                            </td>
                            <td className="px-3 py-2 border border-slate-300 text-slate-600">
                              {task.CM_Milestone_Name || 'Unassigned'}
                            </td>
                            <td className="px-3 py-2 border border-slate-300 text-slate-600">
                              {formatDate(task.CM_Assign_Date)}
                            </td>
                            <td className="px-3 py-2 border border-slate-300 text-slate-600 whitespace-nowrap">
                              {formatDate(task.CM_Due_Date)}
                            </td>
                            <td className="px-3 py-2 border border-slate-300 text-center text-slate-600 whitespace-nowrap">
                              {delayInfo.lastUpdated}
                            </td>
                            <td className="px-3 py-2 border border-slate-300 text-center">
                              <div className="flex flex-col items-center gap-1 justify-center">
                                {getStatusBadge(delayInfo.latestStatus)}
                                {delayInfo.isDelayed && delayInfo.latestStatus !== "Completed" && (
                                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                                    {delayInfo.delayDays} day{delayInfo.delayDays !== 1 ? 's' : ''} overdue
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 border border-slate-300 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                {delayInfo.latestStatus !== "Completed" ? (
                                  <button
                                    onClick={() => handleUpdateTask(task)}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
                                  >
                                    Update
                                  </button>
                                ) : (
                                  <span className="px-3 py-1 bg-slate-100 text-slate-400 text-xs font-medium rounded border border-slate-200">
                                    Done
                                  </span>
                                )}
                                {taskUpdates.length > 0 && (
                                  <button
                                    onClick={() => toggleTaskHistory(task.CM_Task_ID)}
                                    className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded hover:bg-slate-300 transition-colors shadow-sm"
                                    title="Toggle History"
                                  >
                                    {isExpanded ? 'Hide History' : 'History'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {/* Expanded History Row */}
                          {isExpanded && taskUpdates.length > 0 && (
                            <tr>
                              <td colSpan="7" className="p-0 border border-slate-300 bg-slate-50">
                                <div className="p-3 bg-slate-100 shadow-inner">
                                  <div className="border border-slate-300 bg-white rounded-sm overflow-hidden">
                                    <div className="bg-slate-200 px-3 py-1.5 border-b border-slate-300 flex justify-between items-center">
                                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Update History</h4>
                                      <span className="text-xs text-slate-500 font-medium">{taskUpdates.length} update{taskUpdates.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full border-collapse text-xs">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                          <tr>
                                            <th className="px-3 py-1.5 text-left font-semibold text-slate-600 border-r border-slate-200">Date</th>
                                            <th className="px-3 py-1.5 text-left font-semibold text-slate-600 border-r border-slate-200">Status</th>
                                            <th className="px-3 py-1.5 text-left font-semibold text-slate-600 border-r border-slate-200">Hours</th>
                                            <th className="px-3 py-1.5 text-left font-semibold text-slate-600 border-r border-slate-200">Remarks</th>
                                            <th className="px-3 py-1.5 text-center font-semibold text-slate-600 border-r border-slate-200">Image</th>
                                            <th className="px-3 py-1.5 text-left font-semibold text-slate-600 border-r border-slate-200">Updated By</th>
                                            <th className="px-3 py-1.5 text-center font-semibold text-slate-600">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {taskUpdates.map((update, idx) => (
                                            <tr key={update.CM_Update_ID || idx} className="border-b border-slate-200 hover:bg-slate-50">
                                              <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-slate-600">{formatDateTime(update.CM_Update_Date)}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-200">{getStatusBadge(update.CM_Status)}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-200 text-slate-600">{update.CM_Work_Hours || '0.00'}h</td>
                                              <td className="px-3 py-1.5 border-r border-slate-200 text-slate-600 max-w-[200px] truncate" title={update.CM_Remarks || ''}>{update.CM_Remarks || '-'}</td>
                                              <td className="px-3 py-1.5 border-r border-slate-200 text-center">
                                                {update.CM_Image_URL ? (
                                                  <a href={update.CM_Image_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                                                ) : '-'}
                                              </td>
                                              <td className="px-3 py-1.5 border-r border-slate-200 text-slate-600">{update.CM_Uploaded_By || 'System'}</td>
                                              <td className="px-3 py-1.5 text-center">
                                                <button
                                                  onClick={() => handleEditUpdate(update, task)}
                                                  className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                                >
                                                  Edit
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      );
                    })}
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-4 text-gray-500 text-lg font-medium">
                {tasks.length === 0
                  ? "No tasks assigned to you for this project."
                  : "No tasks match your current filters."
                }
              </p>
              {tasks.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Update Task Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white border-3 border-blue-500 rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 hover:scale-100">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Update Task Status</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 break-words"><span className="font-semibold text-blue-600">{updatingTask?.CM_Task_Name}</span></p>

              <form onSubmit={handleSubmitUpdate} className="space-y-4 sm:space-y-5 md:space-y-6">
                <div>
                  <label htmlFor="updateDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Working Date *
                  </label>
                  <input
                    type="date"
                    id="updateDate"
                    name="updateDate"
                    required
                    value={updateData.updateDate}
                    onChange={(e) => setUpdateData({ ...updateData, updateDate: e.target.value })}
                    className="w-full text-black text-xs sm:text-sm px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Due Date: {formatDate(updatingTask?.CM_Due_Date)} •
                    {calculateDelayDays(updatingTask?.CM_Due_Date, updateData.updateDate) > 0 ? (
                      <span className="text-red-600 font-medium">
                        {' '}Will be delayed by {calculateDelayDays(updatingTask?.CM_Due_Date, updateData.updateDate)} day{calculateDelayDays(updatingTask?.CM_Due_Date, updateData.updateDate) !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium"> On Time</span>
                    )}
                  </p>
                </div>

                <div>
                  <label htmlFor="status" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    id="status"
                    name="status"
                    required
                    value={updateData.status}
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 text-black text-xs sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="" disabled>Select a status</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Pending">Pending</option>
                  </select>

                  {updateData.status === "Completed" && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs sm:text-sm">
                      <p className="font-medium text-yellow-700">
                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Important:
                      </p>
                      <p className="text-yellow-600 text-xs mt-1">
                        {getLatestInProgressDate(updatingTask?.CM_Task_ID)
                          ? `Latest "In Progress" date: ${formatDate(getLatestInProgressDate(updatingTask?.CM_Task_ID))} - Completion date must be on or after this date.`
                          : 'No "In Progress" updates yet - you can complete this task on any date'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="workHours" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Work Hours * (0–24 hours)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="workHours"
                      name="workHours"
                      step="0.1"
                      min="0"
                      max="24"
                      required
                      value={updateData.workHours}
                      onChange={(e) => setUpdateData({ ...updateData, workHours: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border text-black text-xs sm:text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition pr-12"
                      placeholder="e.g., 8.5"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 text-xs sm:text-sm">hours</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 mt-1">
                    Must be between 0 and 24 hours. Current: {updateData.workHours || 0}h
                    {updateData.workHours && !validateWorkHours(updateData.workHours) && (
                      <span className="text-red-600 font-medium ml-2">⚠️ Invalid hours</span>
                    )}
                  </p>
                </div>

                <div>
                  <label htmlFor="remarks" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    rows="2"
                    value={updateData.remarks}
                    onChange={(e) => setUpdateData({ ...updateData, remarks: formatSentenceCase(e.target.value) })}
                    className="w-full px-3 sm:px-4 py-2 text-black text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Add any relevant notes or comments..."
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="image" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Upload Image (optional)</label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-xs sm:text-sm text-gray-800 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-300 file:text-blue-900 hover:file:bg-blue-300"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4 sm:pt-6">
                  <button type="button" onClick={() => setShowUpdateModal(false)} className="px-4 sm:px-5 py-2 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 transition-colors order-2 sm:order-1">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      (updateData.workHours && !validateWorkHours(updateData.workHours)) ||
                      (updateData.status === "Completed" && !validateCompletionDate(updatingTask?.CM_Task_ID, updateData.updateDate, updateData.status))
                    }
                    className={`px-4 sm:px-5 py-2 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md order-1 sm:order-2
                      ${(updateData.workHours && !validateWorkHours(updateData.workHours)) ||
                        (updateData.status === "Completed" && !validateCompletionDate(updatingTask?.CM_Task_ID, updateData.updateDate, updateData.status))
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                  >
                    Submit Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Task Update Modal */}
        {showEditModal && editingUpdate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white border-3 border-emerald-500 rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 hover:scale-100">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex-1">Edit Task Update</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors ml-2"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 break-words">
                Editing update from <span className="font-semibold text-emerald-600">{formatDateTime(editingUpdate.CM_Update_Date)}</span>
                for task <span className="font-semibold text-blue-600">{updatingTask?.CM_Task_Name}</span>
              </p>

              <form onSubmit={handleSubmitEdit} className="space-y-4 sm:space-y-5">
                <div>
                  <label htmlFor="editUpdateDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Working Date *
                  </label>
                  <input
                    type="date"
                    id="editUpdateDate"
                    name="editUpdateDate"
                    required
                    value={editData.updateDate}
                    onChange={(e) => setEditData({ ...editData, updateDate: e.target.value })}
                    className="w-full text-black text-xs sm:text-sm px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Due Date: {formatDate(updatingTask?.CM_Due_Date)} •
                    {calculateDelayDays(updatingTask?.CM_Due_Date, editData.updateDate) > 0 ? (
                      <span className="text-red-600 font-medium">
                        {' '}Will be delayed by {calculateDelayDays(updatingTask?.CM_Due_Date, editData.updateDate)} day{calculateDelayDays(updatingTask?.CM_Due_Date, editData.updateDate) !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium"> On Time</span>
                    )}
                  </p>
                </div>

                <div>
                  <label htmlFor="editStatus" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    id="editStatus"
                    name="editStatus"
                    required
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 text-black text-xs sm:text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
                  >
                    <option value="" disabled>Select a status</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Pending">Pending</option>
                  </select>

                  {editData.status === "Completed" && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs sm:text-sm">
                      <p className="font-medium text-yellow-700">
                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Important:
                      </p>
                      <p className="text-yellow-600 text-xs mt-1">
                        {getLatestInProgressDate(updatingTask?.CM_Task_ID)
                          ? `Latest "In Progress" date: ${formatDate(getLatestInProgressDate(updatingTask?.CM_Task_ID))} - Completion date must be on or after this date.`
                          : 'No "In Progress" updates yet - you can complete this task on any date'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="editWorkHours" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Work Hours * (0–24 hours)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="editWorkHours"
                      name="editWorkHours"
                      step="0.1"
                      min="0"
                      max="24"
                      required
                      value={editData.workHours}
                      onChange={(e) => setEditData({ ...editData, workHours: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border text-black text-xs sm:text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition pr-12"
                      placeholder="e.g., 8.5"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 text-xs sm:text-sm">hours</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 mt-1">
                    Must be between 0 and 24 hours. Current: {editData.workHours || 0}h
                    {editData.workHours && !validateWorkHours(editData.workHours) && (
                      <span className="text-red-600 font-medium ml-2">⚠️ Invalid hours</span>
                    )}
                  </p>
                </div>

                <div>
                  <label htmlFor="editRemarks" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                  <textarea
                    id="editRemarks"
                    name="editRemarks"
                    rows="2"
                    value={editData.remarks}
                    onChange={(e) => setEditData({ ...editData, remarks: formatSentenceCase(e.target.value) })}
                    className="w-full px-3 sm:px-4 py-2 text-black text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Add any relevant notes or comments..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Current Image</label>
                  {editingUpdate.CM_Image_URL ? (
                    <div className="flex items-center gap-3 mb-3">
                      <a
                        href={editingUpdate.CM_Image_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs sm:text-sm flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Current Image
                      </a>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs sm:text-sm mb-3">No image currently attached</p>
                  )}

                  <label htmlFor="editImage" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Upload New Image (optional)
                  </label>
                  <input
                    type="file"
                    id="editImage"
                    name="editImage"
                    accept="image/*"
                    onChange={(e) => setEditData({ ...editData, image: e.target.files?.[0] || null })}
                    className="w-full text-xs sm:text-sm text-gray-800 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-emerald-300 file:text-emerald-900 hover:file:bg-emerald-300"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to keep the current image</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 sm:px-5 py-2 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 transition-colors order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      (editData.workHours && !validateWorkHours(editData.workHours)) ||
                      (editData.status === "Completed" && !validateCompletionDate(updatingTask?.CM_Task_ID, editData.updateDate, editData.status))
                    }
                    className={`px-4 sm:px-5 py-2 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md order-1 sm:order-2
              ${(editData.workHours && !validateWorkHours(editData.workHours)) ||
                        (editData.status === "Completed" && !validateCompletionDate(updatingTask?.CM_Task_ID, editData.updateDate, editData.status))
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {showAlert && (
          <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
            <div className={`rounded-lg shadow-xl border-l-4 px-6 py-4 flex items-center ${alertType === 'success'
              ? 'bg-green-50 border-green-500 text-green-800'
              : alertType === 'error'
                ? 'bg-red-50 border-red-500 text-red-800'
                : alertType === 'warning'
                  ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                  : 'bg-blue-50 border-blue-500 text-blue-800'
              }`}>
              <div className="flex-shrink-0 mr-3">
                {alertType === 'success' && (
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {alertType === 'error' && (
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {alertType === 'warning' && (
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {alertType === 'info' && (
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 mr-2">
                <p className="text-sm font-medium">
                  {alertType === 'success' && 'Success!'}
                  {alertType === 'error' && 'Error!'}
                  {alertType === 'warning' && 'Warning!'}
                  {alertType === 'info' && 'Info'}
                </p>
                <p className="text-sm">{alertMessage}</p>
              </div>

              <button
                onClick={() => setShowAlert(false)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes slide-in {
            0% {
              opacity: 0;
              transform: translateX(20px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out forwards;
          }
        `}</style>

        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
        `}</style>

        <style jsx global>{`
          @media (max-width: 768px) {
            .task-history-table {
              display: block;
              width: 100%;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }
            
            .task-history-header {
              position: sticky;
              top: 0;
              background-color: white;
              z-index: 10;
            }
          }

          @keyframes toast-slide {
            0% {
              transform: translateY(-20px) translateX(20px);
              opacity: 0;
            }
            100% {
              transform: translateY(0) translateX(0);
              opacity: 1;
            }
          }
          
          .animate-toast {
            animation: toast-slide 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
}