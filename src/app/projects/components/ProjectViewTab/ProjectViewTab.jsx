'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CustomerDetails from './CustomerDetails';
import ProjectDetails from './ProjectDetails';
import EstimatedCost from './EstimatedCost';
import Milestones from './Milestones';
import TaskDetails from './TaskDetails';
import {
  ShieldCheck, FileText, ChevronDown, FileCog,
  FileSpreadsheet, File, Share2, Loader2
} from 'lucide-react';

export default function ProjectViewTab({
  selectedProject,
  handleEdit,
  setActiveTab,
  handleProductAllocation,
  authUser,
}) {
  const router = useRouter();

  // State declarations for various data
  const [projectTasks, setProjectTasks] = useState([]);
  const [taskUpdates, setTaskUpdates] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [solarEstimate, setSolarEstimate] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [showMenu, setShowMenu] = useState(false);


  // Loading states
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [updatesLoading, setUpdatesLoading] = useState(false);

  // UI states
  const [activeSection, setActiveSection] = useState('details');
  const [error, setError] = useState(null);
  const [updatesError, setUpdatesError] = useState(null);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [expandedImages, setExpandedImages] = useState({});
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [showAlert, setShowAlert] = useState(false);


  // Customer editing states
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  // Project editing states
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProject, setEditProject] = useState(null);

  // Task editing states
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    CM_Task_Name: '',
    CM_Engineer_ID: '',
    CM_Milestone_ID: '',
    CM_Assign_Date: '',
    CM_Due_Date: '',
    CM_Is_Active: 'Active'
  });

  // Milestone editing states
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [isEditingMilestone, setIsEditingMilestone] = useState(false);
  const [editMilestone, setEditMilestone] = useState(null);
  const [newMilestone, setNewMilestone] = useState({
    CM_Milestone_Name: '',
    CM_Description: '',
    CM_Planned_Start_Date: '',
    CM_Planned_End_Date: '',
    CM_Status: 'Not Started',
    CM_Percentage_Weightage: 0
  });

  // Helper to format currency
  const formatCurrency = (value) => {
    if (!value || value === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper to format date for display (FIXED)
  const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    try {
      // Parse the date string directly without timezone interference
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number);

      // Create date in local timezone but set the specific YMD
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

  // Convert date to input field value format (YYYY-MM-DD) - FIXED
  const toDateInputValue = (value) => {
    if (!value) return '';

    if (typeof value === 'string') {
      const dateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) return dateMatch[1];
    }

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';

      // Use local date components to avoid timezone shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Date conversion error:", error);
      return '';
    }
  };


  const getStatusBadge = (status) => {
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
      case 'active':
        return 'bg-emerald-500 text-white';
      case 'inactive':
        return 'bg-gray-500 text-white';
      case 'pending':
        return 'bg-orange-500 text-white';
      case 'not started':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const calculateDelayDays = useCallback((dueDate, completionDate) => {
    if (!dueDate || !completionDate) return 0;

    const due = new Date(dueDate);
    const complete = new Date(completionDate);

    // Normalize both to midnight to avoid partial-day rounding issues
    due.setHours(0, 0, 0, 0);
    complete.setHours(0, 0, 0, 0);

    if (complete > due) {
      const timeDiff = complete.getTime() - due.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      return Math.max(0, daysDiff);
    }
    return 0;
  }, []);

  // Project statistics using useMemo - FIXED
  const projectStats = useMemo(() => {
    if (!projectTasks.length) {
      return {
        completed: 0,
        inProgress: 0,
        total: 0,
        delayedTasks: 0,
        totalDelayDays: 0,
        averageDelay: 0
      };
    }

    const latestStatusMap = {};
    taskUpdates.forEach(update => {
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
  }, [projectTasks, taskUpdates, calculateDelayDays]);

  // Calculate Project Progress % - FIXED
  const projectProgress = useMemo(() => {
    if (!projectTasks.length) return 0;
    const baseProgress = (projectStats.completed / projectStats.total) * 100;
    const bonusProgress = projectStats.inProgress * 5;
    const totalProgress = Math.min(baseProgress + bonusProgress, 100);
    return Math.round(totalProgress);
  }, [projectTasks.length, projectStats.completed, projectStats.inProgress, projectStats.total]);

  // Get delay information for a specific task
  const getTaskDelayInfo = (task) => {
    if (!task) return { isDelayed: false, delayDays: 0, latestStatus: 'Not Updated' };

    // Find latest update for this task
    const latestUpdate = taskUpdates
      .filter(update => update.CM_Task_ID === task.CM_Task_ID)
      .sort((a, b) => new Date(b.CM_Uploaded_At) - new Date(a.CM_Uploaded_At))[0];

    const dueDate = new Date(task.CM_Due_Date);
    const now = new Date();

    if (!latestUpdate) {
      // No updates yet - check if current date is past due date
      const delayDays = calculateDelayDays(task.CM_Due_Date, now.toISOString().split('T')[0]);

      return {
        isDelayed: delayDays > 0,
        delayDays: delayDays,
        latestStatus: "Not Started",
        lastUpdated: 'Never'
      };
    }

    // Use the actual update date from the latest update for delay calculation
    const updateDate = latestUpdate.CM_Update_Date;
    const delayDays = calculateDelayDays(task.CM_Due_Date, updateDate);

    return {
      isDelayed: delayDays > 0,
      delayDays: delayDays,
      latestStatus: latestUpdate.CM_Status || "Not Updated",
      lastUpdated: latestUpdate ? formatDate(latestUpdate.CM_Uploaded_At) : 'Never'
    };
  };

  // Show custom alert
  const showCustomAlert = (message, type = 'info') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);

    // Auto-hide the alert after 4 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 4000);
  };

  // Customer change handler
  const handleCustomerChange = (e) => {
    if (!editCustomer) return;
    const { name, value } = e.target;
    setEditCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle customer edit mode
  const toggleCustomerEdit = () => {
    if (isEditingCustomer) {
      setIsEditingCustomer(false);
      setEditCustomer(null);
    } else {
      setEditCustomer({ ...selectedProject });
      setIsEditingCustomer(true);
    }
  };

  // Save customer changes
  const handleSaveCustomer = async () => {
    if (!editCustomer) return;

    try {
      const response = await fetch("/api/customers/add?_method=PUT", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editCustomer,
          CM_Project_ID: selectedProject.CM_Project_ID,
          CM_Customer_ID: selectedProject.CM_Customer_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update customer details");
      }

      const result = await response.json();

      // Update the selectedProject state with edited customer details
      const updatedProject = {
        ...selectedProject,
        CM_Customer_Name: editCustomer.CM_Customer_Name,
        CM_Email: editCustomer.CM_Email,
        CM_Phone_Number: editCustomer.CM_Phone_Number,
        CM_Alternate_Phone: editCustomer.CM_Alternate_Phone,
        CM_Address: editCustomer.CM_Address,
        CM_District: editCustomer.CM_District,
        CM_State: editCustomer.CM_State,
        CM_Country: editCustomer.CM_Country,
        CM_Postal_Code: editCustomer.CM_Postal_Code,
        CM_GST_Number: editCustomer.CM_GST_Number,
        CM_PAN_Number: editCustomer.CM_PAN_Number,
      };

      // Call the parent component's handler with updated project 
      handleEdit(updatedProject);

      setIsEditingCustomer(false);
      setEditCustomer(null);
      showCustomAlert("Customer details updated successfully", "success");
    } catch (error) {
      console.error("Error updating customer:", error);
      showCustomAlert(error.message, "error");
    }
  };

  // Project edit change handler
  const handleProjectChange = (e) => {
    if (!editProject) return;
    const { name, value } = e.target;
    setEditProject(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // Toggle project edit mode
  const toggleProjectEdit = () => {
    if (isEditingProject) {
      setIsEditingProject(false);
      setEditProject(null);
    } else {
      setEditProject({ ...selectedProject, engineers });
      setIsEditingProject(true);
    }
  };

  // Save project changes
  const handleSaveProject = async () => {
    if (!editProject) return;

    try {
      const response = await fetch("/api/projects?_method=PUT", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editProject,
          CM_Project_ID: selectedProject.CM_Project_ID,
          CM_Updated_By: authUser?.CM_Full_Name || 'Unknown User',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update project details");
      }

      const updatedProjectData = await response.json();

      // Find the project leader name for display
      const projectLeader = engineers.find(e => e.CM_User_ID === editProject.CM_Project_Leader_ID);

      // Update the selectedProject state with edited project details
      const updatedProject = {
        ...selectedProject,
        ...editProject,
        Project_Leader_Name: projectLeader?.CM_Full_Name || 'Not assigned',
      };

      // Call the parent component's handler with updated project
      handleEdit(updatedProject);

      // Refresh all related data
      await Promise.all([
        fetchProjectTasks(),
        fetchProjectMilestones(),
        fetchSolarEstimate()
      ]);

      setIsEditingProject(false);
      setEditProject(null);
      showCustomAlert("Project details updated successfully", "success");
    } catch (error) {
      console.error("Error updating project:", error);
      showCustomAlert(error.message, "error");
    }
  };

  // Task change handler
  const handleTaskChange = (e) => {
    const { name, value } = e.target;

    if (name === "CM_Milestone_ID" && value) {
      // Find the selected milestone
      const selectedMilestone = milestones.find(m => m.CM_Milestone_ID === value);

      if (selectedMilestone) {
        // Update the task with milestone dates
        setNewTask(prev => ({
          ...prev,
          [name]: value,
          // Set the assign date to the milestone's planned start date if it exists
          CM_Assign_Date: selectedMilestone.CM_Planned_Start_Date ?
            toDateInputValue(selectedMilestone.CM_Planned_Start_Date) :
            prev.CM_Assign_Date,
          // Set the due date to the milestone's planned end date if it exists
          CM_Due_Date: selectedMilestone.CM_Planned_End_Date ?
            toDateInputValue(selectedMilestone.CM_Planned_End_Date) :
            prev.CM_Due_Date
        }));
      } else {
        setNewTask(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setNewTask(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Edit task change handler
  const handleEditTaskChange = (e) => {
    if (!editTask) return;
    const { name, value } = e.target;
    setEditTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Milestone change handler
  const handleMilestoneChange = (e) => {
    const { name, value } = e.target;
    setNewMilestone(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Edit milestone change handler
  const handleEditMilestoneChange = (e) => {
    if (!editMilestone) return;
    const { name, value } = e.target;
    setEditMilestone(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch project tasks
  const fetchProjectTasks = async () => {
    if (!selectedProject?.CM_Project_ID) return;
    setLoadingTasks(true);
    setError(null);

    try {
      const response = await fetch(`/api/tasks?projectId=${selectedProject.CM_Project_ID}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setProjectTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching project tasks:', err);
      setError('Failed to load project tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  // Fetch task updates
  const fetchTaskUpdates = async () => {
    if (!selectedProject?.CM_Project_ID) return;
    setUpdatesLoading(true);
    setUpdatesError(null);

    try {
      const response = await fetch(`/api/task-updates?projectId=${selectedProject.CM_Project_ID}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setTaskUpdates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching task updates:', err);
      setUpdatesError('Failed to load task updates');
    } finally {
      setUpdatesLoading(false);
    }
  };

  // Fetch project milestones
  const fetchProjectMilestones = async () => {
    if (!selectedProject?.CM_Project_ID) return;
    setLoadingMilestones(true);

    try {
      const response = await fetch(`/api/milestones?projectId=${selectedProject.CM_Project_ID}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setMilestones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching project milestones:', err);
    } finally {
      setLoadingMilestones(false);
    }
  };

  // Fetch solar estimate
  const fetchSolarEstimate = async () => {
    if (!selectedProject?.CM_Project_ID) return;
    setLoadingEstimate(true);

    try {
      const response = await fetch(`/api/estimatedCost/get?projectId=${selectedProject.CM_Project_ID}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
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
      setLoadingEstimate(false);
    }
  };

  const handleEstimateUpdate = (updatedEstimate) => {
    setSolarEstimate(updatedEstimate);

    // Also update the selectedProject's estimated cost
    if (updatedEstimate) {
      const updatedProject = {
        ...selectedProject,
        CM_Estimated_Cost: updatedEstimate.CM_Total
      };
      handleEdit(updatedProject);
    }
  };

  // Fetch task detail updates
  const fetchTaskDetailUpdates = async (taskId) => {
    setUpdatesLoading(true);
    setUpdatesError(null);

    try {
      const response = await fetch(`/api/task-updates?taskId=${taskId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      // Find the task from projectTasks to get its name
      const task = projectTasks.find(t => t.CM_Task_ID === taskId);

      setSelectedTask({
        ...task, // Include all task details
        updates: Array.isArray(data) ? data : []
      });
      setShowUpdatesModal(true);
    } catch (err) {
      console.error('Error fetching task updates:', err);
      setUpdatesError('Failed to load task updates');
    } finally {
      setUpdatesLoading(false);
    }
  };

  // Fetch engineers
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

  // Update task
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

  // Add task
  const handleAddTask = async () => {
    if (!newTask.CM_Task_Name || !newTask.CM_Engineer_ID || !newTask.CM_Assign_Date || !newTask.CM_Due_Date) {
      showCustomAlert('Please fill all required fields', 'warning');
      return;
    }

    try {
      // Format dates properly
      const formattedTask = {
        ...newTask,
        CM_Assign_Date: newTask.CM_Assign_Date,
        CM_Due_Date: newTask.CM_Due_Date,
        CM_Project_ID: selectedProject.CM_Project_ID,
        CM_Company_ID: selectedProject.CM_Company_ID,
        CM_Created_By: authUser?.CM_Full_Name || 'Unknown User',
        // Ensure milestone ID is included (it could be empty string for no milestone)
        CM_Milestone_ID: newTask.CM_Milestone_ID || null
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedTask),
      });

      if (response.ok) {
        const newTaskData = await response.json();

        showCustomAlert('Task added successfully', 'success');
        setIsAddingTask(false);
        setNewTask({
          CM_Task_Name: '',
          CM_Engineer_ID: '',
          CM_Assign_Date: '',
          CM_Due_Date: '',
          CM_Is_Active: 'Active',
          CM_Milestone_ID: '' // Reset milestone ID too
        });

        // Refresh tasks and updates
        await Promise.all([
          fetchProjectTasks(),
          fetchTaskUpdates()
        ]);
      } else {
        const errorData = await response.json();
        showCustomAlert(errorData.message || 'Failed to add task', 'error');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      showCustomAlert('Error adding task', 'error');
    }
  };

  // Update milestone
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
      // Format dates properly
      const payload = {
        ...editMilestone,
        CM_Uploaded_By: authUser?.CM_Full_Name || 'Unknown User'
      };

      const response = await fetch('/api/milestones?_method=PUT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchProjectMilestones(); // Wait for refresh
        showCustomAlert('Milestone updated successfully', 'success');
        setIsEditingMilestone(false);
        setEditMilestone(null);
      } else {
        const errorData = await response.json();
        showCustomAlert(errorData.message || 'Failed to update milestone', 'error');
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      showCustomAlert('Error updating milestone', 'error');
    }
  };

  // Add milestone
  const handleAddMilestone = async () => {
    if (!newMilestone.CM_Milestone_Name || !newMilestone.CM_Planned_Start_Date || !newMilestone.CM_Planned_End_Date) {
      showCustomAlert('Please fill all required fields', 'warning');
      return;
    }

    try {
      // Format dates properly
      const formattedMilestone = {
        ...newMilestone,
        CM_Project_ID: selectedProject.CM_Project_ID,
        CM_Created_By: authUser?.CM_Full_Name || 'Unknown User'
      };

      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedMilestone),
      });

      if (response.ok) {
        await fetchProjectMilestones(); // Wait for refresh
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
      } else {
        const errorData = await response.json();
        showCustomAlert(errorData.message || 'Failed to add milestone', 'error');
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
      showCustomAlert('Error adding milestone', 'error');
    }
  };

  // Toggle download menu
  const toggleDownloadMenu = () => {
    setShowDownloadMenu(!showDownloadMenu);
  };

  const downloadExcel = async () => {
    try {
      setDownloadingExcel(true);
      let csvContent = "";
      let filename = `project-${selectedProject?.CM_Project_Name || "unknown"}-`;

      // Currency formatting function
      const formatNumberForCSV = (amount) => {
        if (typeof amount !== 'number') {
          amount = parseFloat(amount) || 0;
        }
        return amount.toFixed(2);
      };

      // Date formatting function
      const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // Determine what data to include based on active section
      if (activeSection === 'tasks' && projectTasks?.length > 0) {
        filename += 'tasks';
        csvContent = "Task ID,Task Name,Milestone,Assign Date,Due Date,Status,Engineer,Delay Days\n";

        projectTasks.forEach(task => {
          const taskInfo = getTaskDelayInfo(task);
          const milestone = milestones.find(m => m.CM_Milestone_ID === task.CM_Milestone_ID);

          csvContent += `${task.CM_Task_ID || ""},"${(task.CM_Task_Name || "").replace(/"/g, '""')}","${(milestone?.CM_Milestone_Name || "").replace(/"/g, '""')}",${formatDate(task.CM_Assign_Date)},${formatDate(task.CM_Due_Date)},"${(taskInfo.latestStatus || "Not Started").replace(/"/g, '""')}","${((task.Engineer_First_Name || "") + " " + (task.Engineer_Last_Name || "")).trim().replace(/"/g, '""')}",${taskInfo.delayDays || 0}\n`;
        });
      } else if (activeSection === 'milestones' && milestones?.length > 0) {
        filename += 'milestones';
        csvContent = "Milestone ID,Milestone Name,Status,Start Date,End Date,Weight %,Description\n";

        milestones.forEach(m => {
          csvContent += `${m.CM_Milestone_ID || ""},"${(m.CM_Milestone_Name || "").replace(/"/g, '""')}","${(m.CM_Status || "").replace(/"/g, '""')}",${formatDate(m.CM_Planned_Start_Date)},${formatDate(m.CM_Planned_End_Date)},${m.CM_Percentage_Weightage || 0},"${(m.CM_Description || "").replace(/"/g, '""')}"\n`;
        });
      } else if (activeSection === 'estimates' && solarEstimate) {
        filename += 'estimate';

        // Clear CSV
        csvContent = "";

        // Extract arrays safely
        const equipmentItems =
          solarEstimate.CM_Equipment_Items ?? solarEstimate.Equipment_Items ?? [];

        const laborItems =
          solarEstimate.CM_Labor_Items ?? solarEstimate.Labor_Items ?? [];

        const otherItems =
          solarEstimate.CM_Other_Items ?? solarEstimate.Other_Items ?? [];

        // Extract totals
        const equipmentTotal = parseFloat(solarEstimate.CM_Equipment_Total) || 0;
        const laborTotal = parseFloat(solarEstimate.CM_Labor_Total) || 0;
        const otherTotal = parseFloat(solarEstimate.CM_Other_Total) || 0;
        const grandTotal =
          parseFloat(solarEstimate.CM_Total) ||
          equipmentTotal + laborTotal + otherTotal;

        // -----------------------------------------------------
        // 1) Equipment Items
        // -----------------------------------------------------
        if (equipmentItems.length > 0) {
          csvContent += `Equipment Items\n`;
          csvContent += `Item,Quantity,Unit Cost,Total\n`;

          equipmentItems.forEach(item => {
            const quantity = item.quantity ?? 1;
            const cost = item.unitCost ?? item.price ?? 0;
            csvContent += `${item.name || ''},${quantity},${cost},${quantity * cost}\n`;
          });

          csvContent += `,,Total,${equipmentTotal}\n\n`;
        }

        // -----------------------------------------------------
        // 2) Labor Items
        // -----------------------------------------------------
        if (laborItems.length > 0) {
          csvContent += `Labor Items\n`;
          csvContent += `Service,Days,Rate,Total\n`;

          laborItems.forEach(item => {
            const hours = item.hours ?? item.quantity ?? 1;
            const rate = item.rate ?? item.price ?? 0;
            csvContent += `${item.position || item.name || ''},${hours},${rate},${hours * rate}\n`;
          });

          csvContent += `,,Total,${laborTotal}\n\n`;
        }

        // -----------------------------------------------------
        // 3) Other Costs
        // -----------------------------------------------------
        if (otherItems.length > 0) {
          csvContent += `Other Costs\n`;
          csvContent += `Description,Amount\n`;

          otherItems.forEach(item => {
            const cost = item.cost ?? item.price ?? 0;
            csvContent += `${item.name || ''},${cost}\n`;
          });

          csvContent += `Total,${otherTotal}\n\n`;
        }

        // -----------------------------------------------------
        // 4) PROJECT INFORMATION + MAIN ESTIMATE
        // -----------------------------------------------------
        csvContent += "Field,Value\n";
        csvContent += `Project Name,"${selectedProject.CM_Project_Name || ""}"\n`;
        csvContent += `Project Code,"${selectedProject.CM_Project_Code || ""}"\n`;
        csvContent += `Location,"${selectedProject.CM_Project_Location || ""}"\n`;
        csvContent += `System Size,"${solarEstimate.CM_System_Size || ""}"\n\n`;

        // -----------------------------
        // MATERIALS & EQUIPMENT
        // -----------------------------
        csvContent += "Materials & Equipment\n";
        csvContent += "Item,Description,Quantity,Unit Price,Total\n";

        equipmentItems.forEach(item => {
          const qty = parseFloat(item.quantity) || 0;
          const rate = parseFloat(item.unitCost ?? item.price) || 0;

          csvContent += `"${item.name || ""}","${item.description || ""}",${qty},${rate},${qty * rate}\n`;
        });

        csvContent += `,,,"Total",${equipmentTotal}\n\n`;

        // -----------------------------
        // LABOR & SERVICES
        // -----------------------------
        csvContent += "Labor & Services\n";
        csvContent += "Service,Description,Hours,Rate,Total\n";

        laborItems.forEach(item => {
          const hrs = parseFloat(item.hours ?? item.quantity) || 0;
          const rate = parseFloat(item.rate ?? item.price) || 0;

          csvContent += `"${item.position || item.name || ""}","${item.description || ""}",${hrs},${rate},${hrs * rate}\n`;
        });

        csvContent += `,,,"Total",${laborTotal}\n\n`;

        // -----------------------------
        // OTHER COSTS
        // -----------------------------
        csvContent += "Other Costs\n";
        csvContent += "Description,Category,Amount\n";

        otherItems.forEach(item => {
          const cost = parseFloat(item.cost ?? item.price) || 0;

          csvContent += `"${item.name || ""}","${item.category || ""}",${cost}\n`;
        });

        csvContent += `,,Total,${otherTotal}\n\n`;

        // -----------------------------
        // COST SUMMARY
        // -----------------------------
        csvContent += "Cost Summary\n";
        csvContent += "Category,Amount\n";
        csvContent += `Materials & Equipment,${equipmentTotal}\n`;
        csvContent += `Labor & Services,${laborTotal}\n`;
        csvContent += `Other Costs,${otherTotal}\n`;

        const subtotal = equipmentTotal + laborTotal + otherTotal;
        csvContent += `Subtotal,${subtotal}\n`;
        csvContent += `Grand Total,${grandTotal}\n`;
      }

      else {
        // Default to project details
        filename += 'details';
        csvContent = "Project Details\n\n";
        csvContent += "PROJECT INFORMATION\n";
        csvContent += "Project Code," + (selectedProject.CM_Project_Code || "") + "\n";
        csvContent += "Project Name," + (selectedProject.CM_Project_Name || "") + "\n";
        csvContent += "Project Type," + (selectedProject.CM_Project_Type || "") + "\n";
        csvContent += "Status," + (selectedProject.CM_Status || "") + "\n";
        csvContent += "Location," + (selectedProject.CM_Project_Location || "") + "\n";
        csvContent += "Estimated Cost," + formatNumberForCSV(selectedProject.CM_Estimated_Cost || 0) + "\n";
        csvContent += "Start Date," + formatDate(selectedProject.CM_Planned_Start_Date) + "\n";
        csvContent += "End Date," + formatDate(selectedProject.CM_Planned_End_Date) + "\n\n";

        csvContent += "CUSTOMER INFORMATION\n";
        csvContent += "Customer Name," + (selectedProject.CM_Customer_Name || "") + "\n";
        csvContent += "Email," + (selectedProject.CM_Email || "") + "\n";
        csvContent += "Phone," + (selectedProject.CM_Phone_Number || "") + "\n";
        csvContent += "Alternate Phone," + (selectedProject.CM_Alternate_Phone || "") + "\n";
        csvContent += "Address," + (selectedProject.CM_Address || "") + "\n";
        csvContent += "District," + (selectedProject.CM_District || "") + "\n";
        csvContent += "State," + (selectedProject.CM_State || "") + "\n";
        csvContent += "Country," + (selectedProject.CM_Country || "") + "\n";
        csvContent += "Postal Code," + (selectedProject.CM_Postal_Code || "") + "\n";
        csvContent += "GST Number," + (selectedProject.CM_GST_Number || "") + "\n";
        csvContent += "PAN Number," + (selectedProject.CM_PAN_Number || "") + "\n";
      }

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showCustomAlert("Excel file downloaded successfully", "success");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showCustomAlert("Error downloading Excel file", "error");
    } finally {
      setDownloadingExcel(false);
    }
  };


  const downloadPDF = async () => {
    try {
      setDownloadingPDF(true);

      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      let y = 20;

      // --------------------------
      // Helper functions
      // --------------------------
      const toNumber = (value) => {
        if (value === null || value === undefined || value === "") return 0;
        const cleaned = String(value).replace(/[^0-9.-]/g, "");
        const num = Number(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const formatCurrency = (value) => {
        const num = toNumber(value);
        return `₹${num.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      };

      const formatDate = (dateString) => {
        if (!dateString) return "—";
        try {
          return new Date(dateString).toLocaleDateString("en-IN");
        } catch {
          return "—";
        }
      };

      // --------------------------
      // HEADER
      // --------------------------
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(selectedProject.CM_Project_Name || "Project Report", 14, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, y);
      y += 15;

      // --------------------------
      // TASKS SECTION
      // --------------------------
      if (activeSection === "tasks" && projectTasks?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Project Tasks", 14, y);
        y += 10;

        autoTable(doc, {
          startY: y,
          head: [
            [
              "Task Name",
              "Milestone",
              "Assign Date",
              "Due Date",
              "Status",
              "Engineer",
              "Delay Days",
            ],
          ],
          body: projectTasks.map((task) => {
            const taskInfo = getTaskDelayInfo(task);
            const milestone = milestones.find(
              (m) => m.CM_Milestone_ID === task.CM_Milestone_ID
            );

            return [
              task.CM_Task_Name || "Unnamed Task",
              milestone?.CM_Milestone_Name || "—",
              formatDate(task.CM_Assign_Date),
              formatDate(task.CM_Due_Date),
              taskInfo.latestStatus || "Not Started",
              `${task.Engineer_First_Name || ""} ${task.Engineer_Last_Name || ""}`
                .trim() || "—",
              taskInfo.delayDays || 0,
            ];
          }),
          headStyles: { fillColor: [41, 128, 185] },
        });
      }

      // --------------------------
      // MILESTONES SECTION
      // --------------------------
      else if (activeSection === "milestones" && milestones?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Project Milestones", 14, y);
        y += 10;

        autoTable(doc, {
          startY: y,
          head: [["Milestone Name", "Status", "Start Date", "End Date", "Weight %"]],
          body: milestones.map((m) => [
            m.CM_Milestone_Name || "Unnamed Milestone",
            m.CM_Status || "Not Started",
            formatDate(m.CM_Planned_Start_Date),
            formatDate(m.CM_Planned_End_Date),
            m.CM_Percentage_Weightage || 0,
          ]),
          headStyles: { fillColor: [46, 204, 113] },
        });
      }

      // --------------------------
      // ESTIMATE SECTION
      // --------------------------
      else if (activeSection === "estimates" && solarEstimate) {
        const equip = solarEstimate.CM_Equipment_Items || [];
        const labor = solarEstimate.CM_Labor_Items || [];
        const other = solarEstimate.CM_Other_Items || [];

        const equipmentTotal = toNumber(solarEstimate.CM_Equipment_Total);
        const laborTotal = toNumber(solarEstimate.CM_Labor_Total);
        const otherTotal = toNumber(solarEstimate.CM_Other_Total);
        const grandTotal =
          toNumber(solarEstimate.CM_Total) ||
          equipmentTotal + laborTotal + otherTotal;

        // SUMMARY
        doc.setFont("helvetica", "bold");
        doc.text("Project Estimate Summary", 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          body: [
            ["Project Name", selectedProject.CM_Project_Name || ""],
            ["Project Code", selectedProject.CM_Project_Code || ""],
            ["System Size", solarEstimate.CM_System_Size || ""],
            ["Location", selectedProject.CM_Project_Location || ""],
            ["Equipment Total", equipmentTotal],
            ["Labor Total", laborTotal],
            ["Other Costs Total", otherTotal],
            ["GRAND TOTAL", grandTotal],
          ],
          theme: "grid",
          columnStyles: {
            1: { halign: "right" },
          },
          didDrawCell: (data) => {
            if ([1].includes(data.column.index)) {
              const val = data.cell.raw;
              data.cell.text = [
                `₹${Number(val).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
              ];
            }
          },
        });

        y = doc.lastAutoTable.finalY + 12;

        // EQUIPMENT TABLE
        doc.setFont("helvetica", "bold");
        doc.text("Equipment Items", 14, y);
        y += 5;

        autoTable(doc, {
          startY: y,
          head: [["Item", "Qty", "Unit Cost", "Total"]],
          body: equip.map((item) => {
            const qty = toNumber(item.quantity);
            const cost = toNumber(item.unitCost);
            return [item.name || "", qty, cost, qty * cost];
          }),
          foot: [["", "", "Total", equipmentTotal]],
          theme: "striped",
          columnStyles: {
            2: { halign: "right" },
            3: { halign: "right" },
          },
          didDrawCell: (data) => {
            if ([2, 3].includes(data.column.index)) {
              const val = data.cell.raw;
              data.cell.text = [
                `₹${Number(val).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
              ];
            }
          },
        });

        y = doc.lastAutoTable.finalY + 12;

        // LABOR TABLE
        doc.setFont("helvetica", "bold");
        doc.text("Labor Items", 14, y);
        y += 5;

        autoTable(doc, {
          startY: y,
          head: [["Service", "Days", "Rate", "Total"]],
          body: labor.map((item) => {
            const days = toNumber(item.days || item.hours || item.quantity);
            const rate = toNumber(item.rate || item.price || item.cost);
            return [item.name || item.position || "", days, rate, days * rate];
          }),
          foot: [["", "", "Total", laborTotal]],
          theme: "striped",
          columnStyles: {
            2: { halign: "right" },
            3: { halign: "right" },
          },
          didDrawCell: (data) => {
            if ([2, 3].includes(data.column.index)) {
              const val = data.cell.raw;
              data.cell.text = [
                `₹${Number(val).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
              ];
            }
          },
        });

        y = doc.lastAutoTable.finalY + 12;

        // OTHER COSTS TABLE
        doc.setFont("helvetica", "bold");
        doc.text("Other Costs", 14, y);
        y += 5;

        autoTable(doc, {
          startY: y,
          head: [["Description", "Category", "Amount"]],
          body: other.map((item) => [
            item.name || "",
            item.category || "",
            toNumber(item.cost || item.price),
          ]),
          foot: [["", "Total", otherTotal]],
          theme: "striped",
          columnStyles: { 2: { halign: "right" } },
          didDrawCell: (data) => {
            if (data.column.index === 2) {
              const val = data.cell.raw;
              data.cell.text = [
                `₹${Number(val).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
              ];
            }
          },
        });
      }

      // --------------------------
      // PROJECT & CUSTOMER INFO DEFAULT SECTION
      // --------------------------
      else {
        doc.setFont("helvetica", "bold");
        doc.text("Project Information", 14, y);
        y += 10;

        autoTable(doc, {
          startY: y,
          body: [
            ["Project ID", selectedProject.CM_Project_Code || "—"],
            ["Project Name", selectedProject.CM_Project_Name || "—"],
            ["Project Type", selectedProject.CM_Project_Type || "—"],
            ["Status", selectedProject.CM_Status || "—"],
            ["Location", selectedProject.CM_Project_Location || "—"],
            ["Estimated Cost", toNumber(selectedProject.CM_Estimated_Cost || 0)],
            ["Start Date", formatDate(selectedProject.CM_Planned_Start_Date)],
            ["End Date", formatDate(selectedProject.CM_Planned_End_Date)],
          ],
          theme: "striped",
          columnStyles: { 1: { halign: "right" } },
          didDrawCell: (data) => {
            if (data.column.index === 1 && data.cell.raw !== "—") {
              const val = data.cell.raw;
              data.cell.text = [
                `₹${Number(val).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
              ];
            }
          },
        });

        y = doc.lastAutoTable.finalY + 15;

        doc.setFont("helvetica", "bold");
        doc.text("Customer Information", 14, y);
        y += 10;

        autoTable(doc, {
          startY: y,
          body: [
            ["Customer Name", selectedProject.CM_Customer_Name || "—"],
            ["Email", selectedProject.CM_Email || "—"],
            ["Phone", selectedProject.CM_Phone_Number || "—"],
            ["Address", selectedProject.CM_Address || "—"],
            [
              "District / State",
              `${selectedProject.CM_District || "—"} / ${selectedProject.CM_State || "—"
              }`,
            ],
            ["Country", selectedProject.CM_Country || "—"],
            ["GST Number", selectedProject.CM_GST_Number || "—"],
            ["PAN Number", selectedProject.CM_PAN_Number || "—"],
          ],
          theme: "striped",
        });
      }

      // --------------------------
      // PAGE NUMBERS
      // --------------------------
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }

      // --------------------------
      // SAVE FILE
      // --------------------------
      doc.save(
        `${selectedProject.CM_Project_Code || "project"}-${activeSection}-${new Date()
          .toISOString()
          .split("T")[0]}.pdf`
      );

      showCustomAlert("PDF file downloaded successfully", "success");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      showCustomAlert("Error downloading PDF file", "error");
    } finally {
      setDownloadingPDF(false);
    }
  };


  // Reset edit states when selected project changes
  useEffect(() => {
    setIsEditingCustomer(false);
    setEditCustomer(null);
    setIsEditingProject(false);
    setEditProject(null);
    setIsEditingTask(false);
    setEditTask(null);
    setIsEditingMilestone(false);
    setEditMilestone(null);
  }, [selectedProject?.CM_Project_ID]);

  // Load data when selected project changes
  useEffect(() => {
    if (selectedProject) {
      fetchProjectTasks();
      fetchTaskUpdates();
      fetchProjectMilestones();
      fetchSolarEstimate();
      fetchEngineers();
    }
  }, [selectedProject]);

  // Add this useEffect for handling click outside to close the download dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadMenu && !event.target.closest('.download-btn-container')) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadMenu]);

  // Get section name for display
  const getSectionDisplayName = () => {
    switch (activeSection) {
      case 'details': return 'Project Details';
      case 'estimates': return 'Solar Estimate';
      case 'milestones': return 'Milestones';
      case 'tasks': return 'Tasks';
      default: return activeSection.charAt(0).toUpperCase() + activeSection.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - Responsive Design */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto px-3 sm:px-4 lg:px-6">
          <div className="py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab('projects')}
                  className="p-2 rounded-lg bg-blue-200 hover:bg-blue-300 transition-colors"
                  aria-label="Go back"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 rounded-xl text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                    {selectedProject.CM_Project_Name || 'Unnamed Project'}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-1">
                    {selectedProject.CM_Project_Code && (
                      <span className="text-xs sm:text-sm text-gray-500">
                        Code: {selectedProject.CM_Project_Code}
                      </span>
                    )}
                    <div className="flex items-center space-x-2">
                      {selectedProject.CM_Status && (
                        <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedProject.CM_Status)}`}>
                          {selectedProject.CM_Status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col xs:flex-row gap-2 sm:gap-4 w-full sm:w-auto items-start xs:items-center">
                {/* Download Dropdown */}
                <div className="relative inline-block text-left">
                  <div>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white  rounded-xl shadow-lg  ring-opacity-5 focus:outline-none z-20 animate-in fade-in-0 zoom-in-95">
                      <div className="p-2">
                        <button
                          onClick={() => { setShowMenu(false); downloadExcel(); }}
                          className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-150 group"
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
                          onClick={() => { setShowMenu(false); downloadPDF(); }}
                          className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-150 group mt-1"
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
                    </div>
                  )}
                </div>

                {/* Add Products Button */}
                {/* <button
                  onClick={() => handleProductAllocation(selectedProject)}
                  className="flex items-center gap-2 px-4 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 transform transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1v6m6-6v6" />
                  </svg>
                  <span>Add Products</span>
                </button> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Statistics Summary - Enhanced Design */}
      <div className="bg-gradient-to-r from-white to-gray-50  mb-4 sm:mb-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="w-full lg:w-auto">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Project Progress
              </h2>
              <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 mt-3">
                <div className="w-full xs:w-48 sm:w-64 h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out"
                    style={{ width: `${projectProgress}%` }}
                  ></div>
                </div>
                <span className="text-blue-700 font-bold text-sm sm:text-base whitespace-nowrap flex items-center">
                  <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-blue-100">
                    {projectProgress}% Complete
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 xs:grid-cols-4 gap-2 sm:gap-4 w-full lg:w-auto">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 sm:p-3 rounded-lg text-center border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Completed</div>
                <div className="text-lg sm:text-xl font-bold text-green-600">{projectStats.completed}</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-2 sm:p-3 rounded-lg text-center border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs sm:text-sm text-gray-600 font-medium">In Progress</div>
                <div className="text-lg sm:text-xl font-bold text-yellow-600">{projectStats.inProgress}</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-2 sm:p-3 rounded-lg text-center border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Delayed</div>
                <div className="text-lg sm:text-xl font-bold text-red-600">{projectStats.delayedTasks}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-3 rounded-lg text-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Total Tasks</div>
                <div className="text-lg sm:text-xl font-bold text-gray-700">{projectStats.total}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Enhanced Design */}
      <div className="bg-white sticky top-0 z-10 ">
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
                  if (tab.id === 'details' || tab.id === 'tasks') setSelectedTask(null);
                }}
                className={`py-3 md:py-4 px-2 md:px-4 border-b-3 font-medium text-sm flex items-center space-x-2 whitespace-nowrap flex-shrink-0 transition-all duration-200 ${activeSection === tab.id
                  ? 'border-blue-500 text-blue-600 scale-[1.02] transform -translate-y-0.5'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {/* Icon: show on all sizes now with better visibility */}
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>

                {/* Name: show on all sizes for consistency */}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 font-medium flex items-center">
            <svg className="h-5 w-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {activeSection === 'details' && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <CustomerDetails
              key={selectedProject?.CM_Project_ID + (selectedProject?.CM_Customer_Name || '')}
              selectedProject={selectedProject}
              editCustomer={editCustomer}
              isEditing={isEditingCustomer}
              handleCustomerChange={handleCustomerChange}
              handleSaveCustomer={handleSaveCustomer}
              toggleEdit={toggleCustomerEdit}
            />

            <ProjectDetails
              selectedProject={selectedProject}
              solarEstimate={solarEstimate}
              estimateLoading={loadingEstimate}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              editProject={editProject}
              isEditing={isEditingProject}
              handleProjectChange={handleProjectChange}
              handleSaveProject={handleSaveProject}
              toggleEdit={toggleProjectEdit}
              engineers={engineers}
              toDateInputValue={toDateInputValue}
            />
          </div>
        )}

        {activeSection === 'estimates' && (
          <EstimatedCost
            selectedProject={selectedProject}
            solarEstimate={solarEstimate}
            estimateLoading={loadingEstimate}
            formatCurrency={formatCurrency}
            onEstimateUpdate={handleEstimateUpdate} // Add this prop
          />
        )}

        {activeSection === 'milestones' && (
          <Milestones
            milestones={milestones}
            isAddingMilestone={isAddingMilestone}
            setIsAddingMilestone={setIsAddingMilestone}
            newMilestone={newMilestone}
            handleMilestoneChange={handleMilestoneChange}
            handleAddMilestone={handleAddMilestone}
            milestonesLoading={loadingMilestones}
            isEditingMilestone={isEditingMilestone}
            setIsEditingMilestone={setIsEditingMilestone}
            editMilestone={editMilestone}
            setEditMilestone={setEditMilestone}
            handleEditMilestoneChange={handleEditMilestoneChange}
            handleUpdateMilestone={handleUpdateMilestone}
            getStatusBadge={getStatusBadge}
            toDateInputValue={toDateInputValue}
            formatDate={formatDate}
            selectedProject={selectedProject}
          />
        )}

        {activeSection === 'tasks' && (
          <TaskDetails
            projectTasks={projectTasks}
            loading={loadingTasks}
            error={error}
            engineers={engineers}
            formatDate={formatDate}
            toDateInputValue={toDateInputValue}
            isEditingTask={isEditingTask}
            setIsEditingTask={setIsEditingTask}
            editTask={editTask}
            setEditTask={setEditTask}
            handleEditTaskChange={handleEditTaskChange}
            handleUpdateTask={handleUpdateTask}
            isAddingTask={isAddingTask}
            setIsAddingTask={setIsAddingTask}
            newTask={newTask}
            handleTaskChange={handleTaskChange}
            handleAddTask={handleAddTask}
            getStatusBadge={getStatusBadge}
            getTaskDelayInfo={getTaskDelayInfo}
            showUpdatesModal={showUpdatesModal}
            setShowUpdatesModal={setShowUpdatesModal}
            fetchTaskDetailUpdates={fetchTaskDetailUpdates}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            expandedImages={expandedImages}
            setExpandedImages={setExpandedImages}
            selectedProject={selectedProject}
            updatesLoading={updatesLoading}
            updatesError={updatesError}
            calculateDelayDays={calculateDelayDays}
            milestones={milestones}
          />
        )}
      </div>

      {/* Enhanced Toast Alert Component */}
      {showAlert && (
        <div className="fixed top-4 sm:top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up max-w-sm w-[90%]">
          <div
            className={`rounded-xl shadow-xl px-4 py-3 sm:px-6 sm:py-4 flex items-center w-full backdrop-blur-sm
             ${alertType === 'success'
                ? 'bg-green-50/95 border-l-4 border-green-500 text-green-800'
                : alertType === 'error'
                  ? 'bg-red-50/95 border-l-4 border-red-500 text-red-800'
                  : alertType === 'warning'
                    ? 'bg-yellow-50/95 border-l-4 border-yellow-500 text-yellow-800'
                    : 'bg-blue-50/95 border-l-4 border-blue-500 text-blue-800'
              }`}
          >
            <div className="flex-shrink-0 mr-3">
              {alertType === 'success' && (
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {alertType === 'error' && (
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {alertType === 'warning' && (
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {alertType === 'info' && (
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s cubic-bezier(0.21, 1.02, 0.73, 1);
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
        
        /* Enhanced transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }
        
        /* Glassmorphism for alerts */
        .backdrop-blur-sm {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        
        /* Pulse animation for progress bar */
        @keyframes pulse-blue {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-blue {
          animation: pulse-blue 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
