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
  selectedTask,
  setSelectedTask,
  expandedImages,
  setExpandedImages,
  selectedProject,
  updatesLoading,
  updatesError,
  calculateDelayDays,
  milestones // Make sure milestones prop contains the actual milestone data
}) {
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [expandedTaskId, setExpandedTaskId] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('All');

  const filteredTasks = React.useMemo(() => {
    return projectTasks.filter(task => {
      const taskDelayInfo = getTaskDelayInfo(task);
      const latestStatus = taskDelayInfo.latestStatus || 'Not Started';

      const matchesSearch = task.CM_Task_Name?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (filterStatus !== 'All') {
        matchesStatus = latestStatus === filterStatus;
      }

      return matchesSearch && matchesStatus;
    });
  }, [projectTasks, searchTerm, filterStatus, getTaskDelayInfo]);

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
            {isAddingTask ? 'Cancel.' : 'Add Task.'}
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
              className="w-full p-2.5 border rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 text-black"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Not Started">Not Started</option>
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
                    Task Name
                  </label>
                  <textarea
                    name="CM_Task_Name"
                    value={newTask.CM_Task_Name}
                    rows={2}
                    onChange={handleLocalTaskChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
                    placeholder="Enter task name"
                  />
                </div>

                {/* Milestone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Milestone
                  </label>
                  <select
                    name="CM_Milestone_ID"
                    value={newTask.CM_Milestone_ID || ""}
                    onChange={handleTaskChange}
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
                    Engineer
                  </label>

                  <select
                    name="CM_Engineer_ID"
                    value={newTask.CM_Engineer_ID}
                    onChange={handleTaskChange}
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
                    Assign Date
                  </label>

                  <input
                    type="date"
                    name="CM_Assign_Date"
                    value={newTask.CM_Assign_Date}
                    onChange={handleTaskChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>

                  <input
                    type="date"
                    name="CM_Due_Date"
                    value={newTask.CM_Due_Date}
                    onChange={handleTaskChange}
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
          {Object.entries(tasksByMilestone).map(([milestoneId, group]) => (
            <div key={milestoneId} className="border-b border-gray-200 last:border-b-0">
              {/* Milestone Header */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
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
                  <div className="mt-2 text-sm text-gray-600">
                    {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* Tasks Table for this Milestone */}
              {group.tasks.length > 0 ? (
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
                                {/* Edit Button Only */}
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
                              </td>
                            </tr>
                            {expandedTaskId === task.CM_Task_ID && selectedTask && selectedTask.CM_Task_ID === task.CM_Task_ID && (
                              <tr className="bg-slate-50 border-b border-gray-200">
                                <td colSpan="8" className="p-0">
                                  <div className="p-4 sm:p-6 border-l-4 border-blue-500 shadow-inner overflow-y-auto max-h-[400px]">
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
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {selectedTask.updates.map((update) => {
                                              const delayDays = calculateDelayDays(selectedTask.CM_Due_Date, update.CM_Update_Date);
                                              return (
                                                <tr key={update.CM_Update_ID} className="hover:bg-gray-50 transition-colors">
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
                                                          onClick={() => window.open(update.CM_Image_URL, '_blank', 'noopener,noreferrer')}
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
          ))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 p-2 sm:p-4 text-black">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto  border-5 border-blue-400">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                <input
                  type="text"
                  name="CM_Task_Name"
                  value={editTask.CM_Task_Name}
                  onChange={handleLocalEditTaskChange}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Milestone</label>
                <select
                  name="CM_Milestone_ID"
                  value={editTask.CM_Milestone_ID || ''}
                  onChange={handleEditTaskChange}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Engineer</label>
                <select
                  name="CM_Engineer_ID"
                  value={editTask.CM_Engineer_ID || ''}
                  onChange={handleEditTaskChange}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Date</label>
                  <input
                    type="date"
                    name="CM_Assign_Date"
                    value={editTask.CM_Assign_Date}
                    onChange={handleEditTaskChange}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    name="CM_Due_Date"
                    value={editTask.CM_Due_Date}
                    onChange={handleEditTaskChange}
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


    </div>
  );
}