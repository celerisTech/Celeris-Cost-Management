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

      filtered = filtered.filter(task => {
        const latestUpdate = latestStatusMap[task.CM_Task_ID];
        const currentStatus = latestUpdate?.CM_Status || 'Not Started';
        return currentStatus === selectedStatus;
      });
    }

    // Sort tasks: Pending first, then by status priority, then by oldest assign date
    return filtered.sort((a, b) => {
      // Get latest status for each task
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

      const statusA = latestStatusMap[a.CM_Task_ID]?.CM_Status || 'Not Started';
      const statusB = latestStatusMap[b.CM_Task_ID]?.CM_Status || 'Not Started';

      // Status priority order: Pending (0), Not Started (1), In Progress (2), On Hold (3), Completed (4)
      const statusPriority = {
        'Pending': 0,
        'Not Started': 1,
        'In Progress': 2,
        'On Hold': 3,
        'Completed': 4
      };

      const priorityA = statusPriority[statusA] !== undefined ? statusPriority[statusA] : 5;
      const priorityB = statusPriority[statusB] !== undefined ? statusPriority[statusB] : 5;

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
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                {projectName}
              </h1>

              <div className="mt-4 lg:mt-6">
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Your Progress
                  </span>
                  <span className="text-blue-600 font-bold">
                    {projectProgress}% ({projectStats.completed}/{projectStats.total} tasks completed)
                    {projectStats.inProgress > 0 && ` + ${projectStats.inProgress} in progress`}
                  </span>
                </div>

                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-700 ease-out"
                    style={{ width: `${projectProgress}%` }}
                  ></div>
                </div>

                {projectStats.delayedTasks > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl animate-pulse-slow">
                    <div className="flex items-start gap-2 text-red-700">
                      <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <span className="font-semibold">Delay Alert</span>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-red-600 font-medium">{projectStats.delayedTasks}</span> delayed
                          </div>
                          <div>
                            <span className="text-red-600 font-medium">{projectStats.totalDelayDays}</span> days total
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                  {projectProgress === 100
                    ? "🎉 Fantastic! All tasks are completed—great job!"
                    : projectProgress > 0
                      ? `✅ ${projectStats.completed} task${projectStats.completed !== 1 ? 's' : ''} done`
                      + (projectStats.inProgress > 0 ? ` • 🚧 ${projectStats.inProgress} in progress` : '')
                      : "Start marking tasks to track your progress."}
                </p>

                {projectStats.total > 0 && (
                  <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg text-green-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Completed: {projectStats.completed}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg text-yellow-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>In Progress: {projectStats.inProgress}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg text-gray-700">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Remaining: {projectStats.total - projectStats.completed - projectStats.inProgress}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-red-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>Delayed: {projectStats.delayedTasks}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-row gap-3 mt-4 lg:mt-0">
              {/* <button
                onClick={() =>
                  handleUpdateProducts({
                    CM_Project_ID: projectId,
                    CM_Project_Name: projectName,
                  })
                }
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Update Products
              </button> */}
              <button
                onClick={() => router.back()}
                className="px-4 py-2.5 bg-blue-200 border border-blue-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-blue-300 transition shadow-sm flex items-center justify-center gap-1"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8 border border-gray-100">
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="w-full">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Tasks & Milestones
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by task name or milestone name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Milestone Filter */}
              <div className="w-full">
                <label htmlFor="milestone" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Milestone
                </label>
                <select
                  id="milestone"
                  value={selectedMilestone}
                  onChange={(e) => setSelectedMilestone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="all">All Milestones</option>
                  {milestones.map((milestone) => (
                    <option key={milestone.CM_Milestone_ID} value={milestone.CM_Milestone_ID}>
                      {milestone.CM_Milestone_Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-full">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="w-full flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section - Grouped by Milestone */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="inline-block w-2 h-6 bg-blue-500 rounded mr-3"></span>
            Your Assigned Tasks ({filteredTasks.length})
          </h2>

          {filteredTasks.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(tasksByMilestone).map(([milestoneId, milestoneData]) => (
                <div key={milestoneId} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Milestone Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {milestoneData.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {milestoneData.tasks.length} task{milestoneData.tasks.length !== 1 ? 's' : ''} in this milestone
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-sm">
                          {/* Calculate progress */}
                          {(() => {
                            const completed = milestoneData.tasks.filter(task => {
                              const latestUpdate = getLatestUpdate(task.CM_Task_ID);
                              return latestUpdate?.CM_Status === 'Completed';
                            }).length;
                            const total = milestoneData.tasks.length;
                            const percent = total ? Math.round((completed / total) * 100) : 0;

                            // Color based on completion
                            const colorClass =
                              percent === 100
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : percent >= 50
                                  ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                  : 'bg-red-100 text-red-700 border-red-300';

                            return (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Completed:</span>
                                <span
                                  className={`rounded-full border px-3 py-1 font-medium ${colorClass}`}
                                >
                                  {completed} / {total} ({percent}%)
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tasks for this Milestone */}
                  <div className="divide-y divide-gray-100">
                    {milestoneData.tasks.map((task, index) => {
                      const delayInfo = getTaskDelayInfo(task);
                      const taskUpdates = groupedTaskHistory[task.CM_Task_ID] || [];
                      const isExpanded = expandedTasks[task.CM_Task_ID];

                      return (
                        <div key={`${task.CM_Task_ID}-${index}`} className="hover:bg-gray-50 transition-colors">
                          {/* Task Header */}
                          <div className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-800">{task.CM_Task_Name}</h4>
                                  {getStatusBadge(delayInfo.latestStatus)}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Assign: {formatDate(task.CM_Assign_Date)}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Due: {formatDate(task.CM_Due_Date)}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Last Updated: {delayInfo.lastUpdated}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  {delayInfo.latestStatus === "Not Started" ? (
                                    delayInfo.isDelayed ? (
                                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full flex items-center">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                        Not Started • {delayInfo.delayDays} day{delayInfo.delayDays !== 1 ? "s" : ""} overdue
                                      </span>
                                    ) : (
                                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                        Not Started
                                      </span>
                                    )
                                  ) : delayInfo.isDelayed ? (
                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
                                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                      {delayInfo.delayDays} day{delayInfo.delayDays !== 1 ? "s" : ""} delay
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                      On Time
                                    </span>
                                  )}
                                </div>
                                {delayInfo.latestStatus === "Completed" ? (
                                  <span className="px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
                                    Task Completed
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateTask(task)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                  >
                                    Update
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Task History */}
                            {taskUpdates.length > 0 && (
                              <div className="mt-4">
                                <button
                                  onClick={() => toggleTaskHistory(task.CM_Task_ID)}
                                  className="w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center justify-between py-2"
                                >
                                  <span className="flex items-center">
                                    <svg className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                    Task Update History ({taskUpdates.length} update{taskUpdates.length !== 1 ? 's' : ''})
                                  </span>
                                  <span className="text-gray-500">{isExpanded ? 'Hide' : 'Show'}</span>
                                </button>

                                {isExpanded && (
                                  <div className="mt-3 bg-gray-50 rounded-lg p-4">
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full divide-y divide-gray-200 task-history-table">
                                        <thead className="task-history-header">
                                          <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Hours</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay Days</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                          {taskUpdates.map((update, idx) => {
                                            const delayDays = calculateDelayDays(task.CM_Due_Date, update.CM_Update_Date);

                                            return (
                                              <tr key={update.CM_Update_ID || idx} className="hover:bg-white transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                  {formatDateTime(update.CM_Update_Date)}
                                                </td>
                                                <td className="px-4 py-3">
                                                  {getStatusBadge(update.CM_Status)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                  <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {update.CM_Work_Hours || '0.00'}h
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs break-words">
                                                  {update.CM_Remarks || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                  {delayDays > 0 ? (
                                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                                      {delayDays} day{delayDays !== 1 ? 's' : ''}
                                                    </span>
                                                  ) : (
                                                    <span className="text-green-600 text-xs">On time</span>
                                                  )}
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="flex items-center gap-2">
                                                    {update.CM_Image_URL ? (
                                                      <a
                                                        href={update.CM_Image_URL}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center text-xs"
                                                      >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View
                                                      </a>
                                                    ) : (
                                                      <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                  {update.CM_Uploaded_By || 'System'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                  {formatDateTime(update.CM_Uploaded_At)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                  <button
                                                    onClick={() => handleEditUpdate(update, task)}
                                                    className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
                                                  >
                                                    Edit
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
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