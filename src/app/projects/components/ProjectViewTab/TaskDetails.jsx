// src/app/projects/components/ProjectViewTab/TaskDetails.jsx

import React from 'react';
import { formatTitleCase, formatSentenceCase } from "../../../utils/textUtils";

export default function TaskDetails({
  projectTasks,
  loading,
  error,
  engineers,
  formatDate,
  toDateInputValue,
  // isEditingTask,  // No longer needed
  // setIsEditingTask,
  editTask,
  setEditTask,
  handleEditTaskChange,
  handleUpdateTask,
  isAddingTask,
  setIsAddingTask,
  newTask,
  handleTaskChange,
  handleAddTask,
  getStatusBadge,
  getTaskDelayInfo,
  showUpdatesModal,
  setShowUpdatesModal,
  fetchTaskDetailUpdates,
  fetchTaskUpdates,
  authUser,
  selectedTask,
  setSelectedTask,
  expandedImages,
  setExpandedImages,
  selectedProject,
  updatesLoading,
  updatesError,
  calculateDelayDays,
  milestones, // Make sure milestones prop contains the actual milestone data
  onDeleteSuccess
}) {
  const [alertInfo, setAlertInfo] = React.useState({ show: false, message: '', type: 'info' });
  const [deleteConfirmId, setDeleteConfirmId] = React.useState(null);
  const [previewImage, setPreviewImage] = React.useState(null);

  const showLocalAlert = (message, type = 'info') => {
    setAlertInfo({ show: true, message, type });
    setTimeout(() => {
      setAlertInfo(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  const performDeleteTask = async (taskId) => {
    try {
      const response = await fetch('/api/tasks', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: taskId,
          _method: "DELETE",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showLocalAlert(data.error || "Failed to delete task", "error");
        return;
      }

      showLocalAlert("Task deleted successfully", "success");
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      showLocalAlert("An error occurred while deleting the task", "error");
    }
  };

  const handleDeleteTask = (taskId) => {
    setDeleteConfirmId(taskId);
  };

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // State for edit update modal
  const [showEditUpdateModal, setShowEditUpdateModal] = React.useState(false);
  const [editingUpdate, setEditingUpdate] = React.useState(null);
  const [editUpdateData, setEditUpdateData] = React.useState({
    updateDate: '',
    status: '',
    workHours: '',
    remarks: '',
    image: null
  });

  // State for add update modal
  const [showAddUpdateModal, setShowAddUpdateModal] = React.useState(false);
  const [addUpdateData, setAddUpdateData] = React.useState({
    status: '',
    workHours: '',
    remarks: '',
    image: null
  });

  const validateWorkHours = (hours) => {
    const num = parseFloat(hours);
    return !isNaN(num) && num >= 0 && num <= 24;
  };

  const getLatestInProgressDate = (taskId) => {
    if (!selectedTask || selectedTask.CM_Task_ID !== taskId || !selectedTask.updates) return null;
    const inProgressUpdates = selectedTask.updates.filter(u => u.CM_Status === "In Progress");
    if (inProgressUpdates.length === 0) return null;
    return new Date(Math.max(...inProgressUpdates.map(u => new Date(u.CM_Update_Date))));
  };

  const validateCompletionDate = (taskId, updateDate, status) => {
    if (status !== "Completed") return true;
    const latestInProgress = getLatestInProgressDate(taskId);
    if (!latestInProgress) return true;
    const completionDate = new Date(updateDate);
    completionDate.setHours(0, 0, 0, 0);
    latestInProgress.setHours(0, 0, 0, 0);
    return completionDate >= latestInProgress;
  };

  const handleSubmitEditUpdate = async (e) => {
    e.preventDefault();

    if (editUpdateData.workHours && !validateWorkHours(editUpdateData.workHours)) {
      showLocalAlert('Work hours must be between 0 and 24', 'error');
      return;
    }

    if (editUpdateData.status === "Completed" && !validateCompletionDate(selectedTask?.CM_Task_ID, editUpdateData.updateDate, editUpdateData.status)) {
      showLocalAlert('Completion date cannot be earlier than the latest "In Progress" date', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('updateId', editingUpdate.CM_Update_ID);
      formData.append('projectId', selectedTask?.CM_Project_ID || selectedProject?.CM_Project_ID || '');
      formData.append('engineerId', editingUpdate.CM_Engineer_ID || '');
      formData.append('status', editUpdateData.status);
      formData.append('remarks', editUpdateData.remarks);
      formData.append('workHours', editUpdateData.workHours || '0');
      formData.append('updateDate', editUpdateData.updateDate);
      formData.append('uploadedBy', editingUpdate.CM_Uploaded_By || 'Project Manager');
      formData.append('currentImageUrl', editingUpdate.CM_Image_URL || '');

      if (editUpdateData.image) {
        formData.append('image', editUpdateData.image);
      }

      const response = await fetch(`/api/task-update/${selectedTask?.CM_Task_ID}/edit?_method=PUT`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        showLocalAlert('Task update edited successfully!', 'success');
        setShowEditUpdateModal(false);
        if (fetchTaskDetailUpdates && selectedTask) {
          fetchTaskDetailUpdates(selectedTask.CM_Task_ID);
        }
        if (fetchTaskUpdates) {
          fetchTaskUpdates();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to edit task update');
      }
    } catch (err) {
      console.error('Error editing task update:', err);
      showLocalAlert(`Error: ${err.message || 'Failed to edit task update'}. Please try again.`, 'error');
    }
  };

  const handleAddUpdateSubmit = async (e) => {
    e.preventDefault();
    if (addUpdateData.workHours && !validateWorkHours(addUpdateData.workHours)) {
      showLocalAlert('Work hours must be between 0 and 24', 'warning');
      return;
    }

    if (addUpdateData.status === "Completed" && !validateCompletionDate(selectedTask?.CM_Task_ID, new Date().toISOString().split('T')[0], addUpdateData.status)) {
      showLocalAlert('Completion date cannot be earlier than the latest "In Progress" date.', 'warning');
      return;
    }

    try {
      const payload = {
        CM_Task_ID: selectedTask?.CM_Task_ID,
        CM_Project_ID: selectedProject?.CM_Project_ID,
        CM_Engineer_ID: selectedTask?.CM_Engineer_ID || null, // Assuming assigned engineer
        CM_Status: addUpdateData.status,
        CM_Work_Hours: addUpdateData.workHours || 0,
        CM_Remarks: addUpdateData.remarks,
        CM_Image_URL: addUpdateData.image, // base64 string
        CM_Uploaded_By: authUser?.CM_User_ID || authUser?.id || authUser || null
      };

      const response = await fetch('/api/task-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showLocalAlert('Task update added successfully!', 'success');
        setShowAddUpdateModal(false);
        if (fetchTaskDetailUpdates && selectedTask) {
          fetchTaskDetailUpdates(selectedTask.CM_Task_ID);
        }
        if (fetchTaskUpdates) {
          fetchTaskUpdates();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add task update');
      }
    } catch (err) {
      console.error('Error adding task update:', err);
      showLocalAlert(`Error: ${err.message || 'Failed to add task update'}. Please try again.`, 'error');
    }
  };

  const [expandedTaskId, setExpandedTaskId] = React.useState(null);
  const [expandedMilestones, setExpandedMilestones] = React.useState({});

  const toggleMilestone = (milestoneId) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('All');
  const [filterEngineer, setFilterEngineer] = React.useState('All');

  const projectEngineers = React.useMemo(() => {
    if (!engineers || !projectTasks) return [];
    const activeEngineerIds = new Set(projectTasks.map(t => t.CM_Engineer_ID).filter(Boolean));
    return engineers.filter(e => activeEngineerIds.has(e.CM_User_ID));
  }, [engineers, projectTasks]);

  const filteredTasks = React.useMemo(() => {
    return projectTasks.filter(task => {
      const taskDelayInfo = getTaskDelayInfo(task);
      const latestStatus = taskDelayInfo.latestStatus || 'Not Started';

      const matchesSearch = task.CM_Task_Name?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (filterStatus !== 'All') {
        matchesStatus = latestStatus === filterStatus;
      }

      let matchesEngineer = true;
      if (filterEngineer !== 'All') {
        if (filterEngineer === 'Unassigned') {
          matchesEngineer = !task.CM_Engineer_ID;
        } else {
          matchesEngineer = String(task.CM_Engineer_ID) === String(filterEngineer);
        }
      }

      return matchesSearch && matchesStatus && matchesEngineer;
    });
  }, [projectTasks, searchTerm, filterStatus, filterEngineer, getTaskDelayInfo]);

  // Group tasks by milestone with proper milestone data
  const tasksByMilestone = React.useMemo(() => {
    const grouped = { 'no-milestone': { milestone: null, tasks: [] } };

    filteredTasks.forEach(task => {
      if (task.CM_Milestone_ID) {
        const actualMilestone = milestones.find(m => m.CM_Milestone_ID === task.CM_Milestone_ID);
        if (actualMilestone) {
          if (!grouped[task.CM_Milestone_ID]) {
            grouped[task.CM_Milestone_ID] = {
              milestone: {
                CM_Milestone_ID: actualMilestone.CM_Milestone_ID,
                CM_Milestone_Name: actualMilestone.CM_Milestone_Name,
                CM_Status: actualMilestone.CM_Status || 'Not Started',
                CM_Planned_Start_Date: actualMilestone.CM_Planned_Start_Date,
                CM_Planned_End_Date: actualMilestone.CM_Planned_End_Date
              },
              tasks: []
            };
          }
          grouped[task.CM_Milestone_ID].tasks.push(task);
        } else {
          if (!grouped[task.CM_Milestone_ID]) {
            grouped[task.CM_Milestone_ID] = {
              milestone: {
                CM_Milestone_ID: task.CM_Milestone_ID,
                CM_Milestone_Name: task.CM_Milestone_Name || `Milestone ${task.CM_Milestone_ID}`,
                CM_Status: task.CM_Milestone_Status || 'Not Started',
                CM_Planned_Start_Date: task.CM_Milestone_Start_Date,
                CM_Planned_End_Date: task.CM_Milestone_End_Date
              },
              tasks: []
            };
          }
          grouped[task.CM_Milestone_ID].tasks.push(task);
        }
      } else {
        grouped['no-milestone'].tasks.push(task);
      }
    });

    return grouped;
  }, [filteredTasks, milestones]);

  // Get status display component
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'On Hold':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
            On Hold
          </span>
        );
      case 'Not Started':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full flex items-center">
            <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
            Not Started
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
            Not Updated
          </span>
        );
    }
  };

  // Get milestone status badge
  const getMilestoneStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'in progress':
        return 'bg-blue-500 text-white';
      case 'planning':
        return 'bg-purple-500 text-white';
      case 'on hold':
        return 'bg-yellow-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      case 'not started':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  // Format milestone dates for display
  const formatMilestoneDates = (startDate, endDate) => {
    if (!startDate && !endDate) return null;

    const formattedStart = startDate ? formatDate(startDate) : 'Not set';
    const formattedEnd = endDate ? formatDate(endDate) : 'Not set';

    return `${formattedStart} - ${formattedEnd}`;
  };

  const handleLocalTaskChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "CM_Task_Name") {
      formattedValue = formatTitleCase(value);
    }

    handleTaskChange({
      ...e,
      target: {
        ...e.target,
        name,
        value: formattedValue
      }
    });
  };

  const handleLocalEditTaskChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "CM_Task_Name") {
      formattedValue = formatTitleCase(value);
    }

    handleEditTaskChange({
      ...e,
      target: {
        ...e.target,
        name,
        value: formattedValue
      }
    });
  };

  return (
    <div className="bg-white">
      <div className="p-2 sm:p-3 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl sm:text-xl font-bold text-gray-900">
            Project Tasks by Milestone
          </h2>
          <button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
          >
            {isAddingTask ? 'Cancel.' : 'Add Task'}
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 text-black"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 text-black font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Not Started">Not Started</option>
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={filterEngineer}
              onChange={(e) => setFilterEngineer(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 text-black font-medium"
            >
              <option value="All">All Engineers</option>
              {projectEngineers && projectEngineers.map((engineer) => (
                <option key={engineer.CM_User_ID} value={engineer.CM_User_ID}>
                  {engineer.CM_Full_Name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

          {/* Modal Box */}
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-blue-500 text-white">
              <h2 className="text-xl font-semibold">Add New Task</h2>

              <button
                onClick={() => setIsAddingTask(false)}
                className="text-white hover:text-red-400 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 text-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Task Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Name *
                  </label>
                  <textarea
                    name="CM_Task_Name"
                    value={newTask.CM_Task_Name}
                    rows={2}
                    onChange={handleLocalTaskChange}
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
                    placeholder="Enter task name"
                  />
                </div>

                {/* Milestone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Milestone *
                  </label>
                  <select
                    name="CM_Milestone_ID"
                    value={newTask.CM_Milestone_ID || ""}
                    onChange={handleTaskChange}
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="">No Milestone</option>

                    {milestones.map((milestone) => (
                      <option
                        key={milestone.CM_Milestone_ID}
                        value={milestone.CM_Milestone_ID}
                      >
                        {milestone.CM_Milestone_Name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Engineer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Engineer *
                  </label>

                  <select
                    name="CM_Engineer_ID"
                    value={newTask.CM_Engineer_ID}
                    onChange={handleTaskChange}
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="">Select engineer</option>

                    {engineers.map((engineer) => (
                      <option
                        key={engineer.CM_User_ID}
                        value={engineer.CM_User_ID}
                      >
                        {engineer.CM_Full_Name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assign Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Date *
                  </label>

                  <input
                    type="date"
                    name="CM_Assign_Date"
                    value={newTask.CM_Assign_Date}
                    onChange={handleTaskChange}
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>

                  <input
                    type="date"
                    name="CM_Due_Date"
                    value={newTask.CM_Due_Date}
                    onChange={handleTaskChange}
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>

                  <select
                    name="CM_Is_Active"
                    value={newTask.CM_Is_Active}
                    onChange={handleTaskChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Task Image */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Image
                  </label>
                  {newTask.CM_Image_URL && (
                    <div className="mb-2 relative w-32 h-32 group">
                      <img
                        src={newTask.CM_Image_URL}
                        alt="Preview"
                        className="w-full h-full object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleTaskChange({
                            target: { name: 'CM_Image_URL', value: '' }
                          });
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 shadow-md transition"
                        title="Remove Image"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          handleTaskChange({
                            target: { name: 'CM_Image_URL', value: reader.result }
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddTask}
                  className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-500 text-sm sm:text-base">Loading tasks...</p>
        </div>
      ) : error ? (
        <div className="p-4 sm:p-6 text-center">
          <div className="text-red-500 mb-2 text-sm sm:text-base">Error loading tasks.</div>
          <div className="text-xs sm:text-sm text-gray-500">{error}.</div>
        </div>
      ) : projectTasks.length > 0 ? (
        <div className="relative">


          {/* Milestone Groups */}
          {Object.entries(tasksByMilestone).map(([milestoneId, group]) => {
            const isExpanded = expandedMilestones[milestoneId] !== false;
            return (
            <div key={milestoneId} className="border-b border-gray-200 last:border-b-0">
              {/* Milestone Header */}
              <div 
                className="bg-gray-50 px-4 py-3 sm:px-6 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleMilestone(milestoneId)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {group.milestone?.CM_Milestone_Name?.trim() && (
                      <h3 className="text-lg font-semibold text-gray-900">
                        {group.milestone.CM_Milestone_Name}
                      </h3>
                    )}
                  </div>
                  {/* Display milestone dates */}
                  {group.milestone && (
                    <div className="text-sm text-gray-500">
                      {formatMilestoneDates(
                        group.milestone.CM_Planned_Start_Date,
                        group.milestone.CM_Planned_End_Date
                      )}
                    </div>
                  )}
                </div>
                {group.tasks.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600 pl-8">
                    {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* Tasks Table for this Milestone */}
              {isExpanded && group.tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xs:table-cell">
                          Assigned To
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Assign Date
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Due Date
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Engineer
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Task Status
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                          Delay
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.tasks.map((task) => {
                        const taskEngineer = engineers.find(e => e.CM_User_ID === task.CM_Engineer_ID);
                        const taskDelayInfo = getTaskDelayInfo(task);
                        return (
                          <React.Fragment key={task.CM_Task_ID}>
                            <tr
                              className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedTaskId === task.CM_Task_ID ? 'bg-blue-50/50' : ''}`}
                              onClick={() => {
                                if (expandedTaskId === task.CM_Task_ID) {
                                  setExpandedTaskId(null);
                                } else {
                                  fetchTaskDetailUpdates(task.CM_Task_ID);
                                  setSelectedTask(task);
                                  setExpandedTaskId(task.CM_Task_ID);
                                }
                              }}
                            >
                              <td className="px-3 py-4 text-sm font-medium text-gray-900 max-w-[120px] sm:max-w-[200px]">
                                <div className="break-words line-clamp-2">
                                  {task.CM_Task_Name}
                                </div>
                                {task.CM_Image_URL && (
                                  <div className="mt-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <img
                                      src={task.CM_Image_URL}
                                      alt="Attachment"
                                      className="w-10 h-10 object-cover rounded border border-gray-200 cursor-zoom-in hover:scale-105 transition-transform"
                                      onClick={() => setPreviewImage(task.CM_Image_URL)}
                                    />
                                    <span className="text-[10px] text-gray-500 font-mono">Attachment</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-900 hidden xs:table-cell">
                                <div className="truncate max-w-[100px] sm:max-w-[150px]">
                                  {taskEngineer?.CM_Full_Name || task.Engineer_Name || 'Unassigned.'}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                                <div className="text-xs sm:text-sm">{formatDate(task.CM_Assign_Date)}</div>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500 hidden md:table-cell">
                                <div className="text-xs sm:text-sm">{formatDate(task.CM_Due_Date)}</div>
                              </td>
                              <td className="px-3 py-4 text-gray-800">
                                <div className="truncate max-w-[100px] sm:max-w-[150px]">
                                  {taskEngineer?.CM_Full_Name || task.Engineer_Name || 'Unassigned.'}
                                </div>
                              </td>
                              <td className="px-3 py-4 hidden lg:table-cell">
                                <div className="flex justify-start">
                                  {getStatusDisplay(taskDelayInfo.latestStatus)}
                                </div>
                              </td>
                              <td className="px-3 py-4 hidden xl:table-cell">
                                {taskDelayInfo.isDelayed ? (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                                    {taskDelayInfo.delayDays}d delay
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                    On Time
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                  <div className="flex gap-2 flex-wrap">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent row click
                                        setSelectedTask(task);
                                        setAddUpdateData({
                                          status: '',
                                          workHours: '',
                                          remarks: '',
                                          image: null
                                        });
                                        setShowAddUpdateModal(true);
                                      }}
                                      className="px-2 py-1 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 text-center"
                                    >
                                      Update
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent row click
                                        const actualMilestone = milestones.find(m => m.CM_Milestone_ID === task.CM_Milestone_ID);
                                        setEditTask({
                                          ...task,
                                          CM_Assign_Date: toDateInputValue(task.CM_Assign_Date),
                                          CM_Due_Date: toDateInputValue(task.CM_Due_Date),
                                          _milestone: actualMilestone || null,
                                        });
                                        setIsEditModalOpen(true);
                                      }}
                                      className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 text-center"
                                    >
                                      Edit
                                    </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent row click
                                      handleDeleteTask(task.CM_Task_ID);
                                    }}
                                    className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 text-center"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedTaskId === task.CM_Task_ID && selectedTask && selectedTask.CM_Task_ID === task.CM_Task_ID && (
                              <tr className="bg-slate-50 border-b border-gray-200">
                                <td colSpan="8" className="p-0">
                                  <div className="p-4 sm:p-6 border-l-4 border-blue-500 shadow-inner overflow-y-auto max-h-[400px]">
                                    <div className="flex justify-between items-center mb-4">
                                      <h4 className="text-sm font-semibold text-gray-800">Task Updates</h4>
                                      <button
                                        onClick={() => {
                                          setAddUpdateData({
                                            status: '',
                                            workHours: '',
                                            remarks: '',
                                            image: null
                                          });
                                          setShowAddUpdateModal(true);
                                        }}
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 flex items-center gap-1"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                        Add Update
                                      </button>
                                    </div>
                                    {updatesLoading ? (
                                      <div className="flex justify-center items-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <p className="ml-3 text-gray-500 text-sm">Loading updates...</p>
                                      </div>
                                    ) : updatesError ? (
                                      <div className="p-4 text-center text-red-600 text-sm">{updatesError}</div>
                                    ) : selectedTask.updates && selectedTask.updates.length > 0 ? (
                                      <div className="overflow-x-auto bg-white rounded border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Remarks</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xs:table-cell">Hours</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Delay</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Updated By</th>
                                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-100 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {selectedTask.updates.map((update) => {
                                              const delayDays = calculateDelayDays(selectedTask.CM_Due_Date, update.CM_Update_Date);
                                              return (
                                                <tr key={update.CM_Update_ID} className="group hover:bg-gray-50 transition-colors">
                                                  <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{formatDate(update.CM_Update_Date)}</td>
                                                  <td className="px-3 py-2">{getStatusDisplay(update.CM_Status)}</td>
                                                  <td className="px-3 py-2 max-w-[150px] hidden sm:table-cell">
                                                    <div className="text-xs text-gray-700 truncate hover:whitespace-normal hover:overflow-visible">
                                                      {update.CM_Remarks || '—'}
                                                    </div>
                                                  </td>
                                                  <td className="px-3 py-2 text-xs text-gray-900 hidden xs:table-cell">{update.CM_Work_Hours || '—'}h</td>
                                                  <td className="px-3 py-2 hidden md:table-cell">
                                                    {delayDays > 0 ? (
                                                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">{delayDays}d</span>
                                                    ) : (
                                                      <span className="text-green-600 text-xs">On time</span>
                                                    )}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    {update.CM_Image_URL ? (
                                                      <div className="group relative">
                                                        <img
                                                          src={update.CM_Image_URL}
                                                          alt="Update"
                                                          className="w-8 h-8 object-cover rounded border border-gray-200 cursor-zoom-in hover:shadow-md transition-shadow"
                                                          onClick={() => setPreviewImage(update.CM_Image_URL)}
                                                        />
                                                      </div>
                                                    ) : (
                                                      <span className="text-gray-400 text-xs">—</span>
                                                    )}
                                                  </td>
                                                  <td className="px-3 py-2 text-xs text-gray-900 hidden lg:table-cell">
                                                    <div className="truncate max-w-[100px]">
                                                      {update.Uploaded_By_Name || update.CM_Uploaded_By || 'Unknown'}
                                                    </div>
                                                  </td>
                                                  <td className="px-3 py-2 text-center sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)] transition-colors">
                                                    <button
                                                      onClick={() => {
                                                        setEditingUpdate(update);
                                                        setEditUpdateData({
                                                          updateDate: update.CM_Update_Date ? new Date(update.CM_Update_Date).toISOString().split('T')[0] : '',
                                                          status: update.CM_Status || '',
                                                          workHours: update.CM_Work_Hours || '',
                                                          remarks: update.CM_Remarks || '',
                                                          image: null
                                                        });
                                                        setShowEditUpdateModal(true);
                                                      }}
                                                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
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
                                    ) : (
                                      <div className="text-center py-6 bg-white rounded border border-gray-200">
                                        <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No updates found</h3>
                                        <p className="mt-1 text-xs text-gray-500 px-4">No updates have been recorded for this task yet.</p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                </div>
              )}
            </div>
          );
          })}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found.</h3>
          <p className="mt-1 text-sm text-gray-500 px-4">
            There are no tasks assigned to this project yet.
          </p>
          <div className="mt-4">
            <button
              onClick={() => setIsAddingTask(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add first task.
            </button>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && editTask && (
        <div className="fixed bg-black/50 inset-0 z-50 flex items-center justify-center bg-opacity-50 p-2 sm:p-4 text-black">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto  border border-blue-400">
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Task</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditTask(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Milestone Context (Read-only) */}
              {editTask._milestone && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-800 text-sm mb-1">Milestone</h3>
                  <p className="text-sm text-gray-700">
                    <strong>{editTask._milestone.CM_Milestone_Name}</strong>
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatMilestoneDates(
                      editTask._milestone.CM_Planned_Start_Date,
                      editTask._milestone.CM_Planned_End_Date
                    )}
                  </p>
                </div>
              )}

              {/* Editable Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
                <input
                  type="text"
                  name="CM_Task_Name"
                  value={editTask.CM_Task_Name}
                  onChange={handleLocalEditTaskChange}
                  required
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Milestone *</label>
                <select
                  name="CM_Milestone_ID"
                  value={editTask.CM_Milestone_ID || ''}
                  onChange={handleEditTaskChange}
                  required
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="">No Milestone</option>
                  {milestones.map((m) => (
                    <option key={m.CM_Milestone_ID} value={m.CM_Milestone_ID}>
                      {m.CM_Milestone_Name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engineer *</label>
                <select
                  name="CM_Engineer_ID"
                  value={editTask.CM_Engineer_ID || ''}
                  onChange={handleEditTaskChange}
                  required
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="">Select Engineer</option>
                  {engineers.map((e) => (
                    <option key={e.CM_User_ID} value={e.CM_User_ID}>
                      {e.CM_Full_Name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Date *</label>
                  <input
                    type="date"
                    name="CM_Assign_Date"
                    value={editTask.CM_Assign_Date}
                    onChange={handleEditTaskChange}
                    required
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    name="CM_Due_Date"
                    value={editTask.CM_Due_Date}
                    onChange={handleEditTaskChange}
                    required
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="CM_Is_Active"
                  value={editTask.CM_Is_Active || 'Active'}
                  onChange={handleEditTaskChange}
                  className="w-full p-2 border rounded text-sm text-black"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Image</label>
                {editTask.CM_Image_URL && (
                  <div className="mb-2 relative w-32 h-32 group">
                    <img
                      src={editTask.CM_Image_URL}
                      alt="Task Attachment"
                      className="w-full h-full object-cover rounded border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditTask(prev => ({
                          ...prev,
                          CM_Image_URL: ''
                        }));
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 shadow-md transition"
                      title="Remove Image"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditTask(prev => ({
                          ...prev,
                          CM_Image_URL: reader.result
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full p-2 border rounded text-sm bg-gray-50 text-black"
                />
                <p className="text-[10px] text-gray-500 mt-1 font-mono">Select an image to attach/update. Stored in Base64 format.</p>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditTask(null);
                }}
                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleUpdateTask();
                  setIsEditModalOpen(false);
                }}
                className="px-3 py-1.5 text-sm text-white bg-green-600 rounded hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-red-500 text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
            </div>
            
            {/* Content */}
            <div className="p-6 text-black">
              <p className="text-gray-700 font-medium mb-1">Are you sure you want to delete this task?</p>
              <p className="text-gray-500 text-xs">This action is permanent and cannot be undone.</p>
            </div>
            
            {/* Action buttons */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  performDeleteTask(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Premium Toast Alert */}
      {alertInfo.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm w-[90%] animate-fade-in-up">
          <div className={`rounded-xl shadow-xl px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3 border backdrop-blur-md transition-all duration-300 ${
            alertInfo.type === 'success'
              ? 'bg-green-50/95 border-green-200 text-green-800'
              : alertInfo.type === 'error'
              ? 'bg-red-50/95 border-red-200 text-red-800'
              : 'bg-blue-50/95 border-blue-200 text-blue-800'
          }`}>
            <div className="flex-shrink-0">
              {alertInfo.type === 'success' ? (
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : alertInfo.type === 'error' ? (
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{alertInfo.message}</p>
            </div>
            <button onClick={() => setAlertInfo(prev => ({ ...prev, show: false }))} className="ml-auto text-gray-400 hover:text-gray-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Lightbox */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewImage} 
              alt="Task Attachment Fullscreen" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl shadow-lg transition-all"
              title="Close Fullscreen View"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Add Task Update Modal */}
      {showAddUpdateModal && (
        <div className="fixed bg-black/50 inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white border border-emerald-500 rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 hover:scale-100 text-black">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex-1">Add Task Update</h3>
              <button
                onClick={() => setShowAddUpdateModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors ml-2"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 break-words">
              Adding new update for task <span className="font-semibold text-blue-600">{selectedTask?.CM_Task_Name}</span>
            </p>

            <form onSubmit={handleAddUpdateSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="addStatus" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  id="addStatus"
                  name="addStatus"
                  required
                  value={addUpdateData.status}
                  onChange={(e) => setAddUpdateData({ ...addUpdateData, status: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 text-black text-xs sm:text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
                >
                  <option value="" disabled>Select a status</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Pending">Pending</option>
                </select>

                {addUpdateData.status === "Completed" && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs sm:text-sm">
                    <p className="font-medium text-yellow-700">
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Important:
                    </p>
                    <p className="text-yellow-600 text-xs mt-1">
                      {getLatestInProgressDate(selectedTask?.CM_Task_ID)
                        ? `Latest "In Progress" date: ${formatDate(getLatestInProgressDate(selectedTask?.CM_Task_ID))} - Completion date must be on or after this date.`
                        : 'No "In Progress" updates yet - you can complete this task on any date'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="addWorkHours" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Work Hours * (0–24 hours)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="addWorkHours"
                    name="addWorkHours"
                    step="0.1"
                    min="0"
                    max="24"
                    required
                    value={addUpdateData.workHours}
                    onChange={(e) => setAddUpdateData({ ...addUpdateData, workHours: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border text-black text-xs sm:text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition pr-12"
                    placeholder="e.g., 8.5"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-xs sm:text-sm">hours</span>
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-1">
                  Must be between 0 and 24 hours. Current: {addUpdateData.workHours || 0}h
                  {addUpdateData.workHours && !validateWorkHours(addUpdateData.workHours) && (
                    <span className="text-red-600 font-medium ml-2">⚠️ Invalid hours</span>
                  )}
                </p>
              </div>

              <div>
                <label htmlFor="addRemarks" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                <textarea
                  id="addRemarks"
                  name="addRemarks"
                  rows="2"
                  value={addUpdateData.remarks}
                  onChange={(e) => setAddUpdateData({ ...addUpdateData, remarks: formatSentenceCase(e.target.value) })}
                  className="w-full px-3 sm:px-4 py-2 text-black text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Add any relevant notes or comments..."
                ></textarea>
              </div>

              <div>
                <label htmlFor="addImage" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Upload Task Image (optional)
                </label>
                <input
                  type="file"
                  id="addImage"
                  name="addImage"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAddUpdateData({ ...addUpdateData, image: reader.result });
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setAddUpdateData({ ...addUpdateData, image: null });
                    }
                  }}
                  className="w-full text-xs sm:text-sm text-gray-800 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-emerald-300 file:text-emerald-900 hover:file:bg-emerald-300"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddUpdateModal(false)}
                  className="px-4 sm:px-5 py-2 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    (addUpdateData.workHours && !validateWorkHours(addUpdateData.workHours)) ||
                    (addUpdateData.status === "Completed" && !validateCompletionDate(selectedTask?.CM_Task_ID, new Date().toISOString().split('T')[0], addUpdateData.status))
                  }
                  className={`px-4 sm:px-5 py-2 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md order-1 sm:order-2
            ${(addUpdateData.workHours && !validateWorkHours(addUpdateData.workHours)) ||
                      (addUpdateData.status === "Completed" && !validateCompletionDate(selectedTask?.CM_Task_ID, new Date().toISOString().split('T')[0], addUpdateData.status))
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                >
                  Save Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Update Modal */}
      {showEditUpdateModal && editingUpdate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white border-3 border-emerald-500 rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 hover:scale-100 text-black">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex-1">Edit Task Update</h3>
              <button
                onClick={() => setShowEditUpdateModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors ml-2"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 break-words">
              Editing update from <span className="font-semibold text-emerald-600">{formatDate(editingUpdate.CM_Update_Date)}</span>
              for task <span className="font-semibold text-blue-600">{selectedTask?.CM_Task_Name}</span>
            </p>

            <form onSubmit={handleSubmitEditUpdate} className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="editUpdateDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Working Date *
                </label>
                <input
                  type="date"
                  id="editUpdateDate"
                  name="editUpdateDate"
                  required
                  value={editUpdateData.updateDate}
                  onChange={(e) => setEditUpdateData({ ...editUpdateData, updateDate: e.target.value })}
                  className="w-full text-black text-xs sm:text-sm px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Due Date: {formatDate(selectedTask?.CM_Due_Date)} •
                  {calculateDelayDays(selectedTask?.CM_Due_Date, editUpdateData.updateDate) > 0 ? (
                    <span className="text-red-600 font-medium">
                      {' '}Will be delayed by {calculateDelayDays(selectedTask?.CM_Due_Date, editUpdateData.updateDate)} day{calculateDelayDays(selectedTask?.CM_Due_Date, editUpdateData.updateDate) !== 1 ? 's' : ''}
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
                  value={editUpdateData.status}
                  onChange={(e) => setEditUpdateData({ ...editUpdateData, status: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 text-black text-xs sm:text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
                >
                  <option value="" disabled>Select a status</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Pending">Pending</option>
                </select>

                {editUpdateData.status === "Completed" && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs sm:text-sm">
                    <p className="font-medium text-yellow-700">
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Important:
                    </p>
                    <p className="text-yellow-600 text-xs mt-1">
                      {getLatestInProgressDate(selectedTask?.CM_Task_ID)
                        ? `Latest "In Progress" date: ${formatDate(getLatestInProgressDate(selectedTask?.CM_Task_ID))} - Completion date must be on or after this date.`
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
                    value={editUpdateData.workHours}
                    onChange={(e) => setEditUpdateData({ ...editUpdateData, workHours: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border text-black text-xs sm:text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition pr-12"
                    placeholder="e.g., 8.5"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-xs sm:text-sm">hours</span>
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-1">
                  Must be between 0 and 24 hours. Current: {editUpdateData.workHours || 0}h
                  {editUpdateData.workHours && !validateWorkHours(editUpdateData.workHours) && (
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
                  value={editUpdateData.remarks}
                  onChange={(e) => setEditUpdateData({ ...editUpdateData, remarks: formatSentenceCase(e.target.value) })}
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditUpdateData({ ...editUpdateData, image: reader.result });
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setEditUpdateData({ ...editUpdateData, image: null });
                    }
                  }}
                  className="w-full text-xs sm:text-sm text-gray-800 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-emerald-300 file:text-emerald-900 hover:file:bg-emerald-300"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to keep the current image</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditUpdateModal(false)}
                  className="px-4 sm:px-5 py-2 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    (editUpdateData.workHours && !validateWorkHours(editUpdateData.workHours)) ||
                    (editUpdateData.status === "Completed" && !validateCompletionDate(selectedTask?.CM_Task_ID, editUpdateData.updateDate, editUpdateData.status))
                  }
                  className={`px-4 sm:px-5 py-2 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md order-1 sm:order-2
            ${(editUpdateData.workHours && !validateWorkHours(editUpdateData.workHours)) ||
                      (editUpdateData.status === "Completed" && !validateCompletionDate(selectedTask?.CM_Task_ID, editUpdateData.updateDate, editUpdateData.status))
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

    </div>
  );
}