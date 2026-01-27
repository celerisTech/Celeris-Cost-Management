'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectViewTab({
  selectedProject,
  handleEdit,
  setActiveTab,
  handleProductAllocation,
  authUser
}) {
  // =============================================
  // STATE MANAGEMENT SECTION
  // =============================================

  // Project data states
  const [projectTasks, setProjectTasks] = useState([]); // Stores all tasks for the project
  const [taskUpdates, setTaskUpdates] = useState([]); // Stores updates/history for tasks
  const [milestones, setMilestones] = useState([]); // Stores project milestones
  const [solarEstimate, setSolarEstimate] = useState(null); // Stores cost estimate data
  const [engineers, setEngineers] = useState([]); // Stores list of available engineers

  // Loading states for different sections
  const [loading, setLoading] = useState(true); // Main loading state
  const [milestonesLoading, setMilestonesLoading] = useState(false); // Milestones loading
  const [estimateLoading, setEstimateLoading] = useState(false); // Estimate loading
  const [updatesLoading, setUpdatesLoading] = useState(false); // Task updates loading

  // UI control states
  const [showUpdatesModal, setShowUpdatesModal] = useState(false); // Controls task history modal
  const [error, setError] = useState(null); // Error handling
  const [updatesError, setUpdatesError] = useState(null); // Task updates error
  const [activeSection, setActiveSection] = useState('details'); // Current active tab
  const [selectedTask, setSelectedTask] = useState(null); // Currently selected task for details
  const [expandedImages, setExpandedImages] = useState({}); // Image expansion state
  const [alertMessage, setAlertMessage] = useState(''); // Alert messages
  const [alertType, setAlertType] = useState(''); // Alert type: success/error/warning
  const [showAlert, setShowAlert] = useState(false); // Alert visibility

  // Editing states
  const [isEditing, setIsEditing] = useState(false); // Project/customer edit mode
  const [editProject, setEditProject] = useState({}); // Editable project data
  const [editCustomer, setEditCustomer] = useState({}); // Editable customer data
  const [editTask, setEditTask] = useState(null); // Currently edited task
  const [isEditingTask, setIsEditingTask] = useState(false); // Task edit mode
  const [isEditingMilestone, setIsEditingMilestone] = useState(false); // Milestone edit mode
  const [editMilestone, setEditMilestone] = useState(null); // Currently edited milestone

  // Add new item states
  const [isAddingTask, setIsAddingTask] = useState(false); // Add task form visibility
  const [isAddingMilestone, setIsAddingMilestone] = useState(false); // Add milestone form visibility

  // New item templates
  const [newTask, setNewTask] = useState({
    CM_Task_Name: '',
    CM_Engineer_ID: '',
    CM_Assign_Date: '',
    CM_Due_Date: '',
    CM_Is_Active: 'Active'
  });

  const [newMilestone, setNewMilestone] = useState({
    CM_Milestone_Name: '',
    CM_Description: '',
    CM_Planned_Start_Date: '',
    CM_Planned_End_Date: '',
    CM_Status: 'Not Started',
    CM_Percentage_Weightage: 0
  });

  const router = useRouter();

  // =============================================
  // UTILITY FUNCTIONS SECTION
  // =============================================

  /**
   * Formats date for HTML date input fields
   * Converts various date formats to YYYY-MM-DD
   */
  const toDateInputValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') {
      const dateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) return dateMatch[1];
    }
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Date conversion error:", error);
      return '';
    }
  };

  /**
   * Formats date to readable string (e.g., "January 15, 2024")
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    try {
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Format date error:", error);
      return 'Invalid Date';
    }
  };

  /**
   * Formats date with time information
   */
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not Set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  /**
   * Formats currency to Indian Rupees format
   */
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  /**
   * Returns CSS classes for status badges based on status
   */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in progress': return 'bg-blue-500 text-white';
      case 'planning': return 'bg-purple-500 text-white';
      case 'on hold': return 'bg-yellow-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      case 'active': return 'bg-emerald-500 text-white';
      case 'inactive': return 'bg-gray-500 text-white';
      case 'pending': return 'bg-orange-500 text-white';
      case 'not started': return 'bg-gray-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  /**
   * Calculates delay days between due date and completion date
   */
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

  // =============================================
  // DATA PROCESSING & MEMOIZED VALUES SECTION
  // =============================================

  /**
   * Groups task updates by task ID for easy access
   */
  const groupedTaskUpdates = useMemo(() => {
    const grouped = {};
    taskUpdates.forEach(update => {
      if (!grouped[update.CM_Task_ID]) {
        grouped[update.CM_Task_ID] = [];
      }
      grouped[update.CM_Task_ID].push(update);
    });
    // Sort updates by date (newest first)
    Object.keys(grouped).forEach(taskId => {
      grouped[taskId].sort((a, b) => new Date(b.CM_Uploaded_At) - new Date(a.CM_Uploaded_At));
    });
    return grouped;
  }, [taskUpdates]);

  /**
   * Gets the latest update for a specific task
   */
  const getLatestUpdate = (taskId) => {
    if (!groupedTaskUpdates[taskId] || groupedTaskUpdates[taskId].length === 0) return null;
    return groupedTaskUpdates[taskId][0];
  };

  /**
   * Gets delay information and status for a task
   */
  const getTaskDelayInfo = (task) => {
    if (!task) return { isDelayed: false, delayDays: 0, latestStatus: 'Not Updated' };
    const latestUpdate = getLatestUpdate(task.CM_Task_ID);
    const dueDate = new Date(task.CM_Due_Date);
    const now = new Date();

    if (!latestUpdate) {
      // No updates - check if overdue based on current date
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

  /**
   * Calculates project statistics from tasks and updates
   */
  const projectStats = useMemo(() => {
    if (!projectTasks.length) {
      return { completed: 0, inProgress: 0, total: 0, delayedTasks: 0, totalDelayDays: 0, averageDelay: 0 };
    }

    const latestStatusMap = {};
    taskUpdates.forEach(update => {
      const taskId = update.CM_Task_ID;
      if (!latestStatusMap[taskId] || new Date(update.CM_Uploaded_At) > new Date(latestStatusMap[taskId].CM_Uploaded_At)) {
        latestStatusMap[taskId] = update;
      }
    });

    let completedTasks = 0;
    let inProgressTasks = 0;
    let delayedTasks = 0;
    let totalDelayDays = 0;

    projectTasks.forEach(task => {
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
      } else {
        // Task has no updates, check if overdue
        const now = new Date().toISOString().split('T')[0];
        const delayDays = calculateDelayDays(task.CM_Due_Date, now);
        if (delayDays > 0) {
          delayedTasks++;
          totalDelayDays += delayDays;
        }
      }
    });

    const averageDelay = delayedTasks > 0 ? (totalDelayDays / delayedTasks).toFixed(1) : 0;

    return {
      completed: completedTasks,
      inProgress: inProgressTasks,
      total: projectTasks.length,
      delayedTasks,
      totalDelayDays,
      averageDelay
    };
  }, [projectTasks, taskUpdates]);

  /**
   * Calculates overall project progress percentage
   */
  const projectProgress = useMemo(() => {
    if (!projectTasks.length) return 0;
    const baseProgress = (projectStats.completed / projectStats.total) * 100;
    const bonusProgress = projectStats.inProgress * 5; // Bonus for in-progress tasks
    const totalProgress = Math.min(baseProgress + bonusProgress, 100);
    return Math.round(totalProgress);
  }, [projectTasks, projectStats]);

  // =============================================
  // DATA FETCHING SECTION
  // =============================================

  useEffect(() => {
    if (selectedProject) {
      // Fetch all project-related data when project is selected
      fetchProjectTasks();
      fetchTaskUpdates();
      fetchProjectMilestones();
      fetchSolarEstimate();
      fetchEngineers();

      // Initialize edit forms with current data
      setEditProject({
        ...selectedProject,
        CM_Planned_Start_Date: toDateInputValue(selectedProject.CM_Planned_Start_Date),
        CM_Planned_End_Date: toDateInputValue(selectedProject.CM_Planned_End_Date),
      });

      setEditCustomer({
        CM_Customer_Name: selectedProject.CM_Customer_Name,
        CM_Email: selectedProject.CM_Email,
        CM_Phone_Number: selectedProject.CM_Phone_Number,
        CM_Alternate_Phone: selectedProject.CM_Alternate_Phone,
        CM_Address: selectedProject.CM_Address,
        CM_District: selectedProject.CM_District,
        CM_State: selectedProject.CM_State,
        CM_Country: selectedProject.CM_Country,
        CM_Postal_Code: selectedProject.CM_Postal_Code,
        CM_GST_Number: selectedProject.CM_GST_Number,
        CM_PAN_Number: selectedProject.CM_PAN_Number
      });
    }
  }, [selectedProject]);

  /**
   * Fetches list of available engineers
   */
  const fetchEngineers = async () => {
    try {
      const response = await fetch('/api/projects?type=engineers');
      if (!response.ok) throw new Error('Failed to fetch engineers');
      const data = await response.json();
      setEngineers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching engineers:', err);
      setEngineers([]);
    }
  };

  /**
   * Fetches project milestones
   */
  const fetchProjectMilestones = async () => {
    if (!selectedProject?.CM_Project_ID) return;
    setMilestonesLoading(true);
    try {
      const response = await fetch(`/api/milestones?projectId=${selectedProject.CM_Project_ID}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setMilestones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching project milestones:', err);
      showCustomAlert('Failed to load milestones', 'error');
    } finally {
      setMilestonesLoading(false);
    }
  };

  /**
   * Fetches solar project cost estimate
   */
  const fetchSolarEstimate = async () => {
    if (!selectedProject?.CM_Project_ID) return;
    setEstimateLoading(true);
    try {
      const response = await fetch(`/api/estimatedCost/get?projectId=${selectedProject.CM_Project_ID}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (data && data.estimate) {
        setSolarEstimate(data.estimate);
      } else {
        setSolarEstimate(null);
      }
    } catch (err) {
      console.error('Error fetching solar estimate:', err);
      setSolarEstimate(null);
    } finally {
      setEstimateLoading(false);
    }
  };

  /**
   * Fetches all tasks for the project
   */
  const fetchProjectTasks = async () => {
    if (!selectedProject?.CM_Project_ID) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks?projectId=${selectedProject.CM_Project_ID}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setProjectTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching project tasks:', err);
      setError('Failed to load project tasks');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches task updates/history
   */
  const fetchTaskUpdates = async () => {
    if (!selectedProject?.CM_Project_ID) return;
    setUpdatesLoading(true);
    setUpdatesError(null);
    try {
      const response = await fetch(`/api/task-updates?projectId=${selectedProject.CM_Project_ID}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setTaskUpdates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching task updates:', err);
      setUpdatesError('Failed to load task updates');
    } finally {
      setUpdatesLoading(false);
    }
  };

  /**
   * Fetches detailed updates for a specific task (for modal view)
   */
  const fetchTaskDetailUpdates = async (taskId) => {
    setUpdatesLoading(true);
    setUpdatesError(null);
    try {
      const response = await fetch(`/api/task-updates?taskId=${taskId}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      const task = projectTasks.find(t => t.CM_Task_ID === taskId);
      setSelectedTask({
        ...task, // Include all task details
        updates: Array.isArray(data) ? data : []
      });
    } catch (err) {
      console.error('Error fetching task updates:', err);
      setUpdatesError('Failed to load task updates');
    } finally {
      setUpdatesLoading(false);
    }
  };

  // =============================================
  // EVENT HANDLERS SECTION
  // =============================================

  // Input change handlers for various forms
  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setEditProject(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setEditCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleEditTaskChange = (e) => {
    if (!editTask) return;
    const { name, value } = e.target;
    setEditTask(prev => ({ ...prev, [name]: value }));
  };

  const handleMilestoneChange = (e) => {
    const { name, value } = e.target;
    setNewMilestone(prev => ({ ...prev, [name]: value }));
  };

  const handleEditMilestoneChange = (e) => {
    if (!editMilestone) return;
    const { name, value } = e.target;
    setEditMilestone(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Saves updated project information
   */
  const handleSaveProject = async () => {
    try {
      const projectData = { ...editProject };
      // Format dates for API
      if (projectData.CM_Planned_Start_Date) {
        const [year, month, day] = projectData.CM_Planned_Start_Date.split('-');
        projectData.CM_Planned_Start_Date = `${year}-${month}-${day}`;
      }
      if (projectData.CM_Planned_End_Date) {
        const [year, month, day] = projectData.CM_Planned_End_Date.split('-');
        projectData.CM_Planned_End_Date = `${year}-${month}-${day}`;
      }

      const response = await fetch('/api/projects?_method=PUT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        showCustomAlert('Project updated successfully', 'success');
        setIsEditing(false);
        handleEdit(editProject);
      } else {
        showCustomAlert('Failed to update project', 'error');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      showCustomAlert('Error updating project', 'error');
    }
  };

  /**
   * Saves updated customer information
   */
  const handleSaveCustomer = async () => {
    try {
      const response = await fetch('/api/customers/add?_method=PUT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CM_Customer_ID: selectedProject.CM_Customer_ID,
          ...editCustomer,
          CM_Is_Active: 'Active'
        }),
      });

      if (response.ok) {
        showCustomAlert('Customer updated successfully', 'success');
        setIsEditing(false);
        handleEdit(editProject);
      } else {
        showCustomAlert('Failed to update customer', 'error');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      showCustomAlert('Error updating customer', 'error');
    }
  };

  /**
   * Adds a new task to the project
   */
  const handleAddTask = async () => {
    if (!newTask.CM_Task_Name || !newTask.CM_Engineer_ID || !newTask.CM_Assign_Date || !newTask.CM_Due_Date) {
      showCustomAlert('Please fill all required fields', 'warning');
      return;
    }

    try {
      const formattedTask = {
        ...newTask,
        CM_Assign_Date: newTask.CM_Assign_Date,
        CM_Due_Date: newTask.CM_Due_Date,
        CM_Project_ID: selectedProject.CM_Project_ID,
        CM_Company_ID: selectedProject.CM_Company_ID,
        CM_Created_By: authUser?.CM_Full_Name || 'Unknown User'
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedTask),
      });

      if (response.ok) {
        showCustomAlert('Task added successfully', 'success');
        setIsAddingTask(false);
        setNewTask({
          CM_Task_Name: '',
          CM_Engineer_ID: '',
          CM_Assign_Date: '',
          CM_Due_Date: '',
          CM_Is_Active: 'Active'
        });
        fetchProjectTasks(); // Refresh tasks list
      } else {
        showCustomAlert('Failed to add task', 'error');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      showCustomAlert('Error adding task', 'error');
    }
  };

  /**
   * Adds a new milestone to the project
   */
  const handleAddMilestone = async () => {
    if (!newMilestone.CM_Milestone_Name || !newMilestone.CM_Planned_Start_Date || !newMilestone.CM_Planned_End_Date) {
      showCustomAlert('Please fill all required fields', 'warning');
      return;
    }

    try {
      const formattedMilestone = {
        ...newMilestone,
        CM_Project_ID: selectedProject.CM_Project_ID,
        CM_Created_By: authUser?.CM_Full_Name || 'Unknown User'
      };

      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedMilestone),
      });

      if (response.ok) {
        showCustomAlert('Milestone added successfully', 'success');
        setIsAddingMilestone(false);
        setNewMilestone({
          CM_Milestone_Name: '',
          CM_Description: '',
          CM_Planned_Start_Date: '',
          CM_Planned_End_Date: '',
          CM_Status: 'Not Started',
          CM_Percentage_Weightage: 0
        });
        fetchProjectMilestones(); // Refresh milestones list
      } else {
        showCustomAlert('Failed to add milestone', 'error');
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
      showCustomAlert('Error adding milestone', 'error');
    }
  };

  /**
   * Updates an existing milestone
   */
  const handleUpdateMilestone = async () => {
    if (!editMilestone || !editMilestone.CM_Milestone_ID) {
      showCustomAlert('Invalid milestone data', 'error');
      return;
    }

    if (!editMilestone.CM_Milestone_Name || !editMilestone.CM_Planned_Start_Date || !editMilestone.CM_Planned_End_Date) {
      showCustomAlert('Please fill all required fields', 'warning');
      return;
    }

    try {
      const payload = {
        ...editMilestone,
        CM_Uploaded_By: authUser?.CM_Full_Name || 'Unknown User'
      };

      const response = await fetch('/api/milestones?_method=PUT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showCustomAlert('Milestone updated successfully', 'success');
        setIsEditingMilestone(false);
        setEditMilestone(null);
        fetchProjectMilestones(); // Refresh milestones list
      } else {
        showCustomAlert('Failed to update milestone', 'error');
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      showCustomAlert('Error updating milestone', 'error');
    }
  };

  /**
   * Updates an existing task
   */
  const handleUpdateTask = async () => {
    if (!editTask) return;

    const projectId = editTask.CM_Project_ID || selectedProject?.CM_Project_ID;
    const companyId =
      editTask.CM_Company_ID ||
      selectedProject?.CM_Company_ID ||
      authUser?.company?.CM_Company_ID ||
      authUser?.CM_Company_ID;

    if (!editTask.CM_Task_Name?.trim()) {
      showCustomAlert("Task name is required", "error");
      return;
    }

    if (!projectId) {
      showCustomAlert("Project ID is missing", "error");
      return;
    }

    if (!companyId) {
      showCustomAlert("Company ID is missing", "error");
      return;
    }

    // Format dates properly for API submission
    let formattedAssignDate = null;
    if (editTask.CM_Assign_Date) {
      const [year, month, day] = editTask.CM_Assign_Date.split('-');
      formattedAssignDate = `${year}-${month}-${day}`;
    }

    let formattedDueDate = null;
    if (editTask.CM_Due_Date) {
      const [year, month, day] = editTask.CM_Due_Date.split('-');
      formattedDueDate = `${year}-${month}-${day}`;
    }

    const payload = {
      CM_Task_ID: editTask.CM_Task_ID,
      CM_Task_Name: editTask.CM_Task_Name.trim(),
      CM_Project_ID: projectId,
      CM_Company_ID: companyId,
      CM_Engineer_ID: editTask.CM_Engineer_ID || null,
      CM_Milestone_ID: editTask.CM_Milestone_ID || null, // Add milestone ID
      CM_Assign_Date: formattedAssignDate,
      CM_Due_Date: formattedDueDate,
      CM_Is_Active: editTask.CM_Is_Active ?? "Active",
      CM_Image_URL: editTask.CM_Image_URL || null,
    };

    try {
      const response = await fetch("/api/tasks?_method=PUT", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update task");
      }

      const updatedTaskData = await response.json();

      // Refresh tasks and updates
      await Promise.all([
        fetchProjectTasks(),
        fetchTaskUpdates()
      ]);

      showCustomAlert("Task updated successfully", "success");
      setIsEditingTask(false);
      setEditTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      showCustomAlert(error.message, "error");
    }
  };

  /**
   * Shows custom alert messages
   */
  const showCustomAlert = (message, type = 'info') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000); // Auto-hide after 4 seconds
  };

  /**
   * Returns styled status badge component
   */
  const getStatusBadge = (status) => {
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
      case 'Cancelled':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
            Cancelled
          </span>
        );
      case 'Pending':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
            Pending
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

  /**
   * Toggles image expansion state
   */
  const toggleImage = (updateId) => {
    setExpandedImages(prev => ({
      ...prev,
      [updateId]: !prev[updateId]
    }));
  };

  // =============================================
  // RENDER SECTION
  // =============================================

  return (
    <div className="h-screen bg-gray-50">
      {/* HEADER SECTION - Project title and actions */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="py-4 sm:py-6">
            {/* Header content with back button, project name, and action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <button onClick={() => setActiveTab('projects')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  {/* Back button icon */}
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                    {selectedProject.CM_Project_Name || 'Unnamed Project'}
                  </h1>
                  {/* Project code and status */}
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-1">
                    {selectedProject.CM_Project_Code && (
                      <span className="text-xs sm:text-sm text-gray-500">
                        Code: {selectedProject.CM_Project_Code}
                      </span>
                    )}
                    <div className="flex items-center space-x-2">
                      {selectedProject.CM_Status && (
                        <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedProject.CM_Status)}`}>
                          {selectedProject.CM_Status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    // Context-aware edit button
                    if (activeSection === 'details') {
                      setIsEditing(!isEditing);
                    } else if (activeSection === 'tasks') {
                      setIsAddingTask(!isAddingTask);
                    } else if (activeSection === 'milestones') {
                      setIsAddingMilestone(!isAddingMilestone);
                    }
                  }}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>{isEditing || isAddingTask || isAddingMilestone ? 'Cancel' : 'Edit'}</span>
                </button>

                <button
                  onClick={() => handleProductAllocation(selectedProject)}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 font-medium text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1v6m6-6v6" />
                  </svg>
                  <span>Add Products</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROJECT STATISTICS SUMMARY - Progress bar and key metrics */}
      <div className="bg-white border-b mb-4 sm:mb-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="w-full lg:w-auto">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Project Progress</h2>
              <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 mt-2">
                <div className="w-full xs:w-48 sm:w-64 bg-gray-200 rounded-full h-3 sm:h-4">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${projectProgress}%` }}
                  ></div>
                </div>
                <span className="text-blue-700 font-bold text-sm sm:text-base whitespace-nowrap">
                  {projectProgress}% Complete
                </span>
              </div>
            </div>

            {/* Statistics cards */}
            <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 sm:gap-4 w-full lg:w-auto">
              <div className="bg-green-50 p-2 sm:p-3 rounded-lg text-center">
                <div className="text-xs sm:text-sm text-gray-500">Completed</div>
                <div className="text-lg sm:text-xl font-bold text-green-600">{projectStats.completed}</div>
              </div>
              <div className="bg-yellow-50 p-2 sm:p-3 rounded-lg text-center">
                <div className="text-xs sm:text-sm text-gray-500">In Progress</div>
                <div className="text-lg sm:text-xl font-bold text-yellow-600">{projectStats.inProgress}</div>
              </div>
              <div className="bg-red-50 p-2 sm:p-3 rounded-lg text-center">
                <div className="text-xs sm:text-sm text-gray-500">Delayed</div>
                <div className="text-lg sm:text-xl font-bold text-red-600">{projectStats.delayedTasks}</div>
              </div>
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg text-center">
                <div className="text-xs sm:text-sm text-gray-500">Total Tasks</div>
                <div className="text-lg sm:text-xl font-bold text-gray-700">{projectStats.total}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS - Section switching */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'details', name: 'Project Details', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
              { id: 'estimates', name: 'Estimates', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
              { id: 'milestones', name: 'Milestones', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
              { id: 'tasks', name: 'Project Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSection(tab.id);
                  if (tab.id === 'details' || tab.id === 'tasks') {
                    setSelectedTask(null);
                  }
                }}
                className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap flex-shrink-0 ${activeSection === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="hidden xs:inline">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA - Dynamic based on active section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">

        {/* PROJECT DETAILS SECTION - Customer and Project Information */}
        {activeSection === 'details' && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">

            {/* CUSTOMER INFORMATION CARD */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Information</h2>
                {isEditing && (
                  <button
                    onClick={handleSaveCustomer}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
                  >
                    Save Changes
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Contact Details Column */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Contact Details</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {/* Customer Name */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="CM_Customer_Name"
                          value={editCustomer.CM_Customer_Name || ''}
                          onChange={handleCustomerChange}
                          className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                        />
                      ) : (
                        <p className="text-base sm:text-lg text-gray-900 mt-1">
                          {selectedProject.CM_Customer_Name || 'Not provided'}
                        </p>
                      )}
                    </div>
                    {/* Email */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="CM_Email"
                          value={editCustomer.CM_Email || ''}
                          onChange={handleCustomerChange}
                          className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                        />
                      ) : (
                        <p className="text-base sm:text-lg text-gray-900 mt-1 break-all">
                          {selectedProject.CM_Email || 'Not provided'}
                        </p>
                      )}
                    </div>
                    {/* Phone Number */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="CM_Phone_Number"
                          value={editCustomer.CM_Phone_Number || ''}
                          onChange={handleCustomerChange}
                          className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                        />
                      ) : (
                        <p className="text-base sm:text-lg text-gray-900 mt-1">
                          {selectedProject.CM_Phone_Number || 'Not provided'}
                        </p>
                      )}
                    </div>
                    {/* Alternate Phone (if exists) */}
                    {selectedProject.CM_Alternate_Phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Alternate Phone</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="CM_Alternate_Phone"
                            value={editCustomer.CM_Alternate_Phone || ''}
                            onChange={handleCustomerChange}
                            className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                          />
                        ) : (
                          <p className="text-base sm:text-lg text-gray-900 mt-1">
                            {selectedProject.CM_Alternate_Phone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Address & Details Column */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Address & Details</h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                    {/* Address */}
                    {isEditing ? (
                      <textarea
                        name="CM_Address"
                        value={editCustomer.CM_Address || ''}
                        onChange={handleCustomerChange}
                        className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                        rows="3"
                      />
                    ) : (
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        {selectedProject.CM_Address || 'No address provided'}
                      </p>
                    )}
                    {/* Location Details */}
                    {isEditing ? (
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mt-2">
                        <input
                          type="text"
                          name="CM_District"
                          value={editCustomer.CM_District || ''}
                          onChange={handleCustomerChange}
                          className="p-2 border rounded text-sm"
                          placeholder="District"
                        />
                        <input
                          type="text"
                          name="CM_State"
                          value={editCustomer.CM_State || ''}
                          onChange={handleCustomerChange}
                          className="p-2 border rounded text-sm"
                          placeholder="State"
                        />
                        <input
                          type="text"
                          name="CM_Country"
                          value={editCustomer.CM_Country || ''}
                          onChange={handleCustomerChange}
                          className="p-2 border rounded text-sm"
                          placeholder="Country"
                        />
                        <input
                          type="text"
                          name="CM_Postal_Code"
                          value={editCustomer.CM_Postal_Code || ''}
                          onChange={handleCustomerChange}
                          className="p-2 border rounded text-sm"
                          placeholder="Postal Code"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 mt-2">
                        {(selectedProject.CM_District || selectedProject.CM_State || selectedProject.CM_Country) && (
                          <p className="text-gray-700 text-sm sm:text-base">
                            {[selectedProject.CM_District, selectedProject.CM_State, selectedProject.CM_Country].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {selectedProject.CM_Postal_Code && (
                          <p className="text-gray-700 text-sm sm:text-base">{selectedProject.CM_Postal_Code}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tax Information */}
                  {(selectedProject.CM_GST_Number || selectedProject.CM_PAN_Number) && (
                    <div className="space-y-2 sm:space-y-3">
                      {selectedProject.CM_GST_Number && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">GST Number</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="CM_GST_Number"
                              value={editCustomer.CM_GST_Number || ''}
                              onChange={handleCustomerChange}
                              className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                            />
                          ) : (
                            <p className="text-sm sm:text-base text-gray-900 mt-1 break-all">
                              {selectedProject.CM_GST_Number}
                            </p>
                          )}
                        </div>
                      )}
                      {selectedProject.CM_PAN_Number && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">PAN Number</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="CM_PAN_Number"
                              value={editCustomer.CM_PAN_Number || ''}
                              onChange={handleCustomerChange}
                              className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                            />
                          ) : (
                            <p className="text-sm sm:text-base text-gray-900 mt-1 break-all">
                              {selectedProject.CM_PAN_Number}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PROJECT INFORMATION CARD */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Project Information</h2>
                {isEditing && (
                  <button
                    onClick={handleSaveProject}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
                  >
                    Save Changes
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Basic Details Column */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Basic Details</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {/* Project Name */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Project Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="CM_Project_Name"
                          value={editProject.CM_Project_Name || ''}
                          onChange={handleProjectChange}
                          className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                        />
                      ) : (
                        <p className="text-base sm:text-lg text-gray-900 mt-1 break-words">
                          {selectedProject.CM_Project_Name || 'Not assigned'}
                        </p>
                      )}
                    </div>
                    {/* Project Code */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Project Code</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="CM_Project_Code"
                          value={editProject.CM_Project_Code || ''}
                          onChange={handleProjectChange}
                          className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                        />
                      ) : (
                        <p className="text-base sm:text-lg text-gray-900 mt-1">
                          {selectedProject.CM_Project_Code || 'Not assigned'}
                        </p>
                      )}
                    </div>
                    {/* Project Leader */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Project Leader</label>
                      {isEditing ? (
                        <select
                          name="CM_Project_Leader_ID"
                          value={editProject.CM_Project_Leader_ID || ""}
                          onChange={handleProjectChange}
                          className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                        >
                          <option value="">Select Project Leader</option>
                          {engineers.map((engineer) => (
                            <option key={engineer.CM_User_ID} value={engineer.CM_User_ID}>
                              {engineer.CM_Full_Name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-base sm:text-lg text-gray-900 mt-1">
                          {selectedProject.Project_Leader_Name || "Not assigned"}
                        </p>
                      )}
                    </div>
                    {/* Location */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="CM_Project_Location"
                          value={editProject.CM_Project_Location || ''}
                          onChange={handleProjectChange}
                          className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                        />
                      ) : (
                        <p className="text-base sm:text-lg text-gray-900 mt-1">
                          {selectedProject.CM_Project_Location || 'Not specified'}
                        </p>
                      )}
                    </div>
                    {/* Project Status */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Project Status</label>
                      {isEditing ? (
                        <select
                          name="CM_Status"
                          value={editProject.CM_Status || ''}
                          onChange={handleProjectChange}
                          className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      ) : (
                        <p className="text-base sm:text-lg text-gray-900 mt-1">
                          {selectedProject.CM_Project_Status || selectedProject.CM_Status || 'Not specified'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Schedule and Financials Column */}
                <div className="space-y-6 lg:col-span-2">
                  {/* Schedule Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Schedule</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {/* Planned Start Date */}
                      <div>
                        <label className="text-sm font-medium text-gray-500">Planned Start Date</label>
                        {isEditing ? (
                          <input
                            type="date"
                            name="CM_Planned_Start_Date"
                            value={editProject.CM_Planned_Start_Date || ''}
                            onChange={handleProjectChange}
                            className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                          />
                        ) : (
                          <p className="text-base sm:text-lg text-gray-900 mt-1">
                            {formatDate(selectedProject.CM_Planned_Start_Date)}
                          </p>
                        )}
                      </div>
                      {/* Planned End Date */}
                      <div>
                        <label className="text-sm font-medium text-gray-500">Planned End Date</label>
                        {isEditing ? (
                          <input
                            type="date"
                            name="CM_Planned_End_Date"
                            value={editProject.CM_Planned_End_Date || ''}
                            onChange={handleProjectChange}
                            className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                          />
                        ) : (
                          <p className="text-base sm:text-lg text-gray-900 mt-1">
                            {formatDate(selectedProject.CM_Planned_End_Date)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financials Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Financials</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {/* Estimated Cost */}
                      <div>
                        <label className="text-sm font-medium text-gray-500">Estimated Cost</label>
                        {isEditing ? (
                          <input
                            type="number"
                            name="CM_Estimated_Cost"
                            value={editProject.CM_Estimated_Cost || ''}
                            onChange={handleProjectChange}
                            className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                          />
                        ) : (
                          <p className="text-base sm:text-lg text-gray-900 mt-1">
                            {formatCurrency(selectedProject.CM_Estimated_Cost)}
                          </p>
                        )}
                      </div>
                      {/* Solar Estimate (if available) */}
                      {solarEstimate && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Solar Estimate Total</label>
                          <p className="text-base sm:text-lg text-gray-900 mt-1 font-semibold">
                            {formatCurrency(solarEstimate.CM_Total)}
                          </p>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div className="bg-blue-50 p-2 rounded text-center">
                              <span className="text-xs text-gray-500">Equipment</span>
                              <p className="text-sm text-gray-500 font-medium">{formatCurrency(solarEstimate.CM_Equipment_Total)}</p>
                            </div>
                            <div className="bg-green-50 p-2 rounded text-center">
                              <span className="text-xs text-gray-500">Labor</span>
                              <p className="text-sm text-gray-500 font-medium">{formatCurrency(solarEstimate.CM_Labor_Total)}</p>
                            </div>
                            <div className="bg-purple-50 p-2 rounded text-center">
                              <span className="text-xs text-gray-500">Other</span>
                              <p className="text-sm text-gray-500 font-medium">{formatCurrency(solarEstimate.CM_Other_Total)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Description */}
                  {selectedProject.CM_Description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Description</h3>
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                        {isEditing ? (
                          <textarea
                            name="CM_Description"
                            value={editProject.CM_Description || ''}
                            onChange={handleProjectChange}
                            className="w-full p-2 border rounded mt-1 text-sm sm:text-base"
                            rows="3"
                          />
                        ) : (
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                            {selectedProject.CM_Description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TASKS SECTION - Project Tasks Management */}
        {activeSection === 'tasks' && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Project Tasks
                </h2>
                <button
                  onClick={() => setIsAddingTask(!isAddingTask)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
                >
                  {isAddingTask ? 'Cancel' : 'Add Task'}
                </button>
              </div>
            </div>

            {/* ADD TASK FORM */}
            {isAddingTask && (
              <div className="p-4 sm:p-6 bg-blue-50 border-b border-blue-200 text-black">
                <h3 className="text-lg font-medium mb-4">Add New Task</h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  <div className="xs:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                    <input
                      type="text"
                      name="CM_Task_Name"
                      value={newTask.CM_Task_Name}
                      onChange={handleTaskChange}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                      placeholder="Enter task name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Engineer</label>
                    <select
                      name="CM_Engineer_ID"
                      value={newTask.CM_Engineer_ID}
                      onChange={handleTaskChange}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                    >
                      <option value="">Select Engineer</option>
                      {engineers.map((engineer) => (
                        <option key={engineer.CM_User_ID} value={engineer.CM_User_ID}>
                          {engineer.CM_Full_Name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Date</label>
                    <input
                      type="date"
                      name="CM_Assign_Date"
                      value={newTask.CM_Assign_Date}
                      onChange={handleTaskChange}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      name="CM_Due_Date"
                      value={newTask.CM_Due_Date}
                      onChange={handleTaskChange}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleAddTask}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            )}

            {/* TASKS TABLE */}
            {loading ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-gray-500 text-sm sm:text-base">Loading tasks...</p>
              </div>
            ) : error ? (
              <div className="p-4 sm:p-6 text-center">
                <div className="text-red-500 mb-2 text-sm sm:text-base">Error loading tasks</div>
                <div className="text-xs sm:text-sm text-gray-500">{error}</div>
              </div>
            ) : projectTasks.length > 0 ? (
              <div className="relative">
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
                          Status
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
                      {projectTasks.map((task) => {
                        const taskEngineer = engineers.find(e => e.CM_User_ID === task.CM_Engineer_ID);
                        const taskDelayInfo = getTaskDelayInfo(task);
                        return (
                          <tr key={task.CM_Task_ID} className="hover:bg-gray-50 transition-colors">
                            {/* Task Name Column */}
                            <td className="px-3 py-4 text-sm font-medium text-gray-900 max-w-[120px] sm:max-w-[200px]">
                              {isEditingTask && editTask?.CM_Task_ID === task.CM_Task_ID ? (
                                <input
                                  type="text"
                                  name="CM_Task_Name"
                                  value={editTask.CM_Task_Name}
                                  onChange={handleEditTaskChange}
                                  className="w-full p-1 border rounded text-sm"
                                />
                              ) : (
                                <div className="break-words line-clamp-2">
                                  {task.CM_Task_Name}
                                </div>
                              )}
                            </td>

                            {/* Assigned To Column */}
                            <td className="px-3 py-4 text-sm text-gray-900 hidden xs:table-cell">
                              {isEditingTask && editTask?.CM_Task_ID === task.CM_Task_ID ? (
                                <select
                                  name="CM_Engineer_ID"
                                  value={editTask.CM_Engineer_ID}
                                  onChange={handleEditTaskChange}
                                  className="w-full p-1 border rounded text-sm"
                                >
                                  <option value="">Select Engineer</option>
                                  {engineers.map((engineer) => (
                                    <option key={engineer.CM_User_ID} value={engineer.CM_User_ID}>
                                      {engineer.CM_Full_Name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="truncate max-w-[100px] sm:max-w-[150px]">
                                  {taskEngineer?.CM_Full_Name || task.Engineer_Name || 'Unassigned'}
                                </div>
                              )}
                            </td>

                            {/* Assign Date Column */}
                            <td className="px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                              {isEditingTask && editTask?.CM_Task_ID === task.CM_Task_ID ? (
                                <input
                                  type="date"
                                  name="CM_Assign_Date"
                                  value={toDateInputValue(editTask?.CM_Assign_Date)}
                                  onChange={handleEditTaskChange}
                                  className="w-full p-1 border rounded text-sm"
                                />
                              ) : (
                                <div className="text-xs sm:text-sm">{formatDate(task.CM_Assign_Date)}</div>
                              )}
                            </td>

                            {/* Due Date Column */}
                            <td className="px-3 py-4 text-sm text-gray-500 hidden md:table-cell">
                              {isEditingTask && editTask?.CM_Task_ID === task.CM_Task_ID ? (
                                <input
                                  type="date"
                                  name="CM_Due_Date"
                                  value={toDateInputValue(editTask?.CM_Due_Date)}
                                  onChange={handleEditTaskChange}
                                  className="w-full p-1 border rounded text-sm"
                                />
                              ) : (
                                <div className="text-xs sm:text-sm">{formatDate(task.CM_Due_Date)}</div>
                              )}
                            </td>

                            {/* Active Status Column */}
                            <td className="px-3 py-4">
                              {isEditingTask && editTask?.CM_Task_ID === task.CM_Task_ID ? (
                                <select
                                  name="CM_Is_Active"
                                  value={editTask.CM_Is_Active}
                                  onChange={handleEditTaskChange}
                                  className="w-full p-1 border rounded text-sm"
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              ) : (
                                <div className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center justify-center
                  ${task.CM_Is_Active === 'Active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {task.CM_Is_Active}
                                </div>
                              )}
                            </td>

                            {/* Task Status Column */}
                            <td className="px-3 py-4 hidden lg:table-cell">
                              {isEditingTask && editTask?.CM_Task_ID === task.CM_Task_ID ? (
                                <input
                                  type="text"
                                  name="CM_Task_Status"
                                  value={editTask.CM_Task_Status || ''}
                                  onChange={handleEditTaskChange}
                                  className="w-full p-1 border rounded text-sm"
                                  disabled
                                  placeholder="Set via updates"
                                />
                              ) : (
                                <div className="flex justify-start">
                                  {getStatusBadge(taskDelayInfo.latestStatus)}
                                </div>
                              )}
                            </td>

                            {/* Delay Column */}
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

                            {/* Actions Column */}
                            <td className="px-3 py-4 text-sm text-gray-500">
                              {isEditingTask && editTask?.CM_Task_ID === task.CM_Task_ID ? (
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={handleUpdateTask}
                                    className="text-green-600 hover:text-green-900 text-center px-2 py-1 border border-green-600 rounded text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setIsEditingTask(false)}
                                    className="text-gray-600 hover:text-gray-900 text-center px-2 py-1 border border-gray-300 rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col xs:flex-row gap-1">
                                  <button
                                    onClick={() => {
                                      setEditTask({
                                        ...task,
                                        CM_Assign_Date: toDateInputValue(task.CM_Assign_Date),
                                        CM_Due_Date: toDateInputValue(task.CM_Due_Date),
                                      });
                                      setIsEditingTask(true);
                                    }}
                                    className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 text-center"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedTask(task);
                                      fetchTaskDetailUpdates(task.CM_Task_ID);
                                      setShowUpdatesModal(true);
                                    }}
                                    className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 text-center"
                                  >
                                    History
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Legend */}
                <div className="sm:hidden px-3 py-2 bg-gray-50 text-gray-500 text-xs border-t border-gray-200">
                  <div className="text-center mb-1">Swipe to see more columns →</div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span>On Time</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                      <span>Delayed</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
                <p className="mt-1 text-sm text-gray-500 px-4">
                  There are no tasks assigned to this project yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* MILESTONES SECTION - Project Milestones Management */}
        {activeSection === 'milestones' && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Project Milestones
                </h2>
                <button
                  onClick={() => setIsAddingMilestone(!isAddingMilestone)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
                >
                  {isAddingMilestone ? 'Cancel' : 'Add Milestone'}
                </button>
              </div>
            </div>

            {/* ADD MILESTONE FORM */}
            {isAddingMilestone && (
              <div className="p-4 sm:p-6 bg-blue-50 border-b border-blue-200 text-black">
                <h3 className="text-lg font-medium mb-4">Add New Milestone</h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  <div className="xs:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Name</label>
                    <input
                      type="text"
                      name="CM_Milestone_Name"
                      value={newMilestone.CM_Milestone_Name}
                      onChange={handleMilestoneChange}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                      placeholder="Enter milestone name"
                    />
                  </div>
                  <div className="xs:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="CM_Description"
                      value={newMilestone.CM_Description}
                      onChange={handleMilestoneChange}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                      placeholder="Describe the milestone"
                      rows="3"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planned Start Date</label>
                    <input
                      type="date"
                      name="CM_Planned_Start_Date"
                      value={newMilestone.CM_Planned_Start_Date}
                      onChange={handleMilestoneChange}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planned End Date</label>
                    <input
                      type="date"
                      name="CM_Planned_End_Date"
                      value={newMilestone.CM_Planned_End_Date}
                      onChange={handleMilestoneChange}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="CM_Status"
                      value={newMilestone.CM_Status}
                      onChange={handleMilestoneChange}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Percentage Weightage (%)</label>
                    <input
                      type="number"
                      name="CM_Percentage_Weightage"
                      value={newMilestone.CM_Percentage_Weightage}
                      onChange={handleMilestoneChange}
                      className="w-full p-2 border rounded text-sm sm:text-base"
                      min="0"
                      max="100"
                      step="5"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleAddMilestone}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                  >
                    Add Milestone
                  </button>
                </div>
              </div>
            )}

            {/* MILESTONES TABLE */}
            {milestonesLoading ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-gray-500 text-sm sm:text-base">Loading milestones...</p>
              </div>
            ) : milestones.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500  tracking-wider">
                        Milestone
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500  tracking-wider hidden sm:table-cell">
                        Date Range
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500  tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500  tracking-wider hidden md:table-cell">
                        Weight
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500  tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-black">
                    {milestones.map((milestone) => (
                      <tr key={milestone.CM_Milestone_ID} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          {isEditingMilestone && editMilestone?.CM_Milestone_ID === milestone.CM_Milestone_ID ? (
                            <input
                              type="text"
                              name="CM_Milestone_Name"
                              value={editMilestone.CM_Milestone_Name}
                              onChange={handleEditMilestoneChange}
                              className="w-full p-1 border rounded text-sm"
                            />
                          ) : (
                            <div>
                              <div className="font-medium text-gray-900 text-sm sm:text-base">{milestone.CM_Milestone_Name}</div>
                              <div className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2">{milestone.CM_Description}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell ">
                          {isEditingMilestone && editMilestone?.CM_Milestone_ID === milestone.CM_Milestone_ID ? (
                            <div className="flex flex-col space-y-2">
                              <input
                                type="date"
                                name="CM_Planned_Start_Date"
                                value={toDateInputValue(editMilestone.CM_Planned_Start_Date)}
                                onChange={handleEditMilestoneChange}
                                className="w-full p-1 border rounded text-sm"
                              />
                              <input
                                type="date"
                                name="CM_Planned_End_Date"
                                value={toDateInputValue(editMilestone.CM_Planned_End_Date)}
                                onChange={handleEditMilestoneChange}
                                className="w-full p-1 border rounded text-sm"
                              />
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              <div>{formatDate(milestone.CM_Planned_Start_Date)}</div>
                              <div className="mt-1">to</div>
                              <div className="mt-1">{formatDate(milestone.CM_Planned_End_Date)}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isEditingMilestone && editMilestone?.CM_Milestone_ID === milestone.CM_Milestone_ID ? (
                            <select
                              name="CM_Status"
                              value={editMilestone.CM_Status}
                              onChange={handleEditMilestoneChange}
                              className="w-full p-1 border rounded text-sm"
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="On Hold">On Hold</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          ) : (
                            getStatusBadge(milestone.CM_Status)
                          )}
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          {isEditingMilestone && editMilestone?.CM_Milestone_ID === milestone.CM_Milestone_ID ? (
                            <input
                              type="number"
                              name="CM_Percentage_Weightage"
                              value={editMilestone.CM_Percentage_Weightage}
                              onChange={handleEditMilestoneChange}
                              className="w-full p-1 border rounded text-sm"
                              min="0"
                              max="100"
                              step="5"
                            />
                          ) : (
                            <div className="text-sm font-medium">{milestone.CM_Percentage_Weightage}%</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isEditingMilestone && editMilestone?.CM_Milestone_ID === milestone.CM_Milestone_ID ? (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={handleUpdateMilestone}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditingMilestone(false);
                                  setEditMilestone(null);
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditMilestone({
                                  ...milestone,
                                  CM_Planned_Start_Date: toDateInputValue(milestone.CM_Planned_Start_Date),
                                  CM_Planned_End_Date: toDateInputValue(milestone.CM_Planned_End_Date),
                                });
                                setIsEditingMilestone(true);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No milestones found</h3>
                <p className="mt-1 text-sm text-gray-500 px-4">
                  There are no milestones set for this project yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ESTIMATES SECTION - Project Cost Estimates */}
        {activeSection === 'estimates' && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Project Estimate
                </h2>
                <button
                  onClick={() => router.push(`/estimates/create?projectId=${selectedProject.CM_Project_ID}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
                >
                  {solarEstimate ? 'View/Edit Estimate' : 'Create Estimate'}
                </button>
              </div>
            </div>

            {estimateLoading ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-gray-500 text-sm sm:text-base">Loading estimate data...</p>
              </div>
            ) : solarEstimate ? (
              <div className="p-4 sm:p-6">
                {/* Estimate Header */}
                <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex flex-wrap items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{solarEstimate.CM_Project_Name}</h3>
                    <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                      {solarEstimate.CM_System_Size}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">Location: {solarEstimate.CM_Location || 'Not specified'}</div>
                </div>

                {/* Cost Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Equipment Total</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(solarEstimate.CM_Equipment_Total)}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Labor Total</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(solarEstimate.CM_Labor_Total)}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Other Costs</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(solarEstimate.CM_Other_Total)}</div>
                  </div>
                </div>

                {/* Total Estimate */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
                  <div className="text-sm font-medium text-green-800 mb-1">Total Project Estimate</div>
                  <div className="text-2xl font-bold text-green-900">{formatCurrency(solarEstimate.CM_Total)}</div>
                </div>

                {/* Detailed Line Items */}
                {(solarEstimate.CM_Equipment_Items || solarEstimate.CM_Labor_Items || solarEstimate.CM_Other_Items) && (
                  <div className="space-y-6 text-black">
                    {/* Equipment Items Table */}
                    {solarEstimate.CM_Equipment_Items && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Equipment Items</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {(typeof solarEstimate.CM_Equipment_Items === 'string'
                                ? JSON.parse(solarEstimate.CM_Equipment_Items)
                                : solarEstimate.CM_Equipment_Items).map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 text-sm">{item.name}</td>
                                    <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unitCost || item.price)}</td>
                                    <td className="px-4 py-2 text-sm text-right font-medium">
                                      {formatCurrency((item.quantity || 1) * (item.unitCost || item.price))}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Labor Items Table */}
                    {solarEstimate.CM_Labor_Items && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Labor Items</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hours/Units</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {(typeof solarEstimate.CM_Labor_Items === 'string'
                                ? JSON.parse(solarEstimate.CM_Labor_Items)
                                : solarEstimate.CM_Labor_Items).map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 text-sm">{item.position || item.name}</td>
                                    <td className="px-4 py-2 text-sm text-right">{item.hours || item.quantity || 1}</td>
                                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.rate || item.price)}</td>
                                    <td className="px-4 py-2 text-sm text-right font-medium">
                                      {formatCurrency((item.hours || item.quantity || 1) * (item.rate || item.price))}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Other Costs Table */}
                    {solarEstimate.CM_Other_Items && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Other Costs</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {(typeof solarEstimate.CM_Other_Items === 'string'
                                ? JSON.parse(solarEstimate.CM_Other_Items)
                                : solarEstimate.CM_Other_Items).map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 text-sm">{item.name}</td>
                                    <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.cost || item.price)}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No estimate found</h3>
                <p className="mt-1 text-sm text-gray-500 px-4">
                  No cost estimate has been created for this project yet.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => router.push(`/estimates/create?projectId=${selectedProject.CM_Project_ID}`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create New Estimate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TASK UPDATES MODAL - Task History and Updates */}
        {showUpdatesModal && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50 backdrop-blur-sm p-2 sm:p-4">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl w-full max-w-2xl lg:max-w-5xl max-h-[90vh] overflow-hidden border-3 border-blue-400">
              {/* Modal Header */}
              <div className="flex justify-between items-start sm:items-center px-4 sm:px-6 py-4  ">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words max-w-[70%]">
                  Task - {selectedTask.CM_Task_Name}
                </h2>
                <button
                  onClick={() => {
                    setShowUpdatesModal(false);
                    setSelectedTask(null);
                  }}
                  className="text-red-500 hover:text-red-700 text-xl font-bold p-1 ml-2 flex-shrink-0"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[70vh]">
                {updatesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="ml-3 text-gray-500 text-sm">Loading updates...</p>
                  </div>
                ) : updatesError ? (
                  <div className="p-4 text-center text-red-600 text-sm">{updatesError}</div>
                ) : selectedTask.updates && selectedTask.updates.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Remarks
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xs:table-cell">
                            Hours
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            Delay
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Image
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Updated By
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedTask.updates.map((update) => {
                          const delayDays = calculateDelayDays(selectedTask.CM_Due_Date, update.CM_Update_Date);

                          return (
                            <tr key={update.CM_Update_ID} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                                {formatDateTime(update.CM_Update_Date)}
                              </td>
                              <td className="px-3 py-3">
                                {getStatusBadge(update.CM_Status)}
                              </td>
                              <td className="px-3 py-3 max-w-[150px] hidden sm:table-cell">
                                <div className="text-xs text-gray-700 truncate hover:whitespace-normal hover:overflow-visible">
                                  {update.CM_Remarks || '—'}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-xs text-gray-900 hidden xs:table-cell">
                                {update.CM_Work_Hours || '—'}h
                              </td>
                              <td className="px-3 py-3 hidden md:table-cell">
                                {delayDays > 0 ? (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                    {delayDays}d
                                  </span>
                                ) : (
                                  <span className="text-green-600 text-xs">On time</span>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                {update.CM_Image_URL ? (
                                  <div className="group relative">
                                    <img
                                      src={update.CM_Image_URL}
                                      alt="Update"
                                      className="w-8 h-8 object-cover rounded border border-gray-200 cursor-zoom-in hover:shadow-md transition-shadow"
                                      onClick={() =>
                                        window.open(update.CM_Image_URL, '_blank', 'noopener,noreferrer')
                                      }
                                    />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                      View image
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-xs text-gray-900 hidden lg:table-cell">
                                <div className="truncate max-w-[100px]">
                                  {update.Uploaded_By_Name || update.CM_Uploaded_By || 'Unknown'}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Mobile swipe hint */}
                    <div className="lg:hidden px-3 py-2 bg-gray-50 text-gray-500 text-xs text-center border-t border-gray-200">
                      Swipe to see more details →
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No updates found</h3>
                    <p className="mt-1 text-sm text-gray-500 px-4">
                      No updates have been recorded for this task yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TOAST ALERT COMPONENT - Notification System */}
        {showAlert && (
          <div className="fixed top-4 sm:top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up max-w-sm w-[90%]">
            <div
              className={`rounded-lg shadow-lg px-4 py-3 sm:px-6 sm:py-4 flex items-center w-full
               ${alertType === 'success'
                  ? 'bg-green-50 border-l-4 border-green-500 text-green-800'
                  : alertType === 'error'
                    ? 'bg-red-50 border-l-4 border-red-500 text-red-800'
                    : alertType === 'warning'
                      ? 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800'
                      : 'bg-blue-50 border-l-4 border-blue-500 text-blue-800'
                }`}
            >
              <div className="flex-shrink-0 mr-3">
                {alertType === 'success' && (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {alertType === 'error' && (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {alertType === 'warning' && (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {alertType === 'info' && (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm sm:text-base">{alertMessage}</p>
              </div>
              <button
                onClick={() => setShowAlert(false)}
                className="ml-3 text-gray-500 hover:text-gray-700"
              >
                <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* CSS STYLES - Animation and utility classes */}
        <style jsx>{`
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out;
  }
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  /* Line clamp utility */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`}</style>

      </div>
    </div>
  );
}