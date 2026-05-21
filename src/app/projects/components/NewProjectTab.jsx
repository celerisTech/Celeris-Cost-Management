// 'src\app\projects\components\NewProjectTab.jsx';

'use client';

import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthScreenStore";
import CustomerStep from "./steps/CustomerStep";
import ProjectDetailsStep from "./steps/ProjectDetailsStep";
import CostEstimationStep from "./steps/CostEstimationStep";
import MilestoneCreationStep from "./steps/MilestoneCreationStep";
import TaskAssignmentStep from "./steps/TaskAssignmentStep";
import SuccessStep from "./steps/SuccessStep";
import toast from "react-hot-toast";

export default function NewProjectTab({
  form = {},
  setForm,
  handleChange = () => { },
  handleSubmit = null,
  handleCancel = () => { },
  error = null,
  initialProjectId = null,
  refreshProjects = () => { },
  onSuccess = null,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  const authUser = useAuthStore((s) => s.user);

  // Customer state
  const [customerFormData, setCustomerFormData] = useState({
    CM_Customer_Name: "",
    CM_Email: "",
    CM_Phone_Number: "",
    CM_Alternate_Phone: "",
    CM_Address: "",
    CM_District: "",
    CM_State: "",
    CM_Country: "India",
    CM_Postal_Code: "",
    CM_Location: "",
    CM_GST_Number: "",
    CM_PAN_Number: "",
    CM_Payment_Terms: "",
    CM_Is_Active: "Active",
    CM_Create_Limit: "",
    CM_Created_By: authUser?.CM_Full_Name ?? "Admin",
    CM_Uploaded_By: authUser?.CM_Full_Name ?? "Admin",
  });
  const [customerErrors, setCustomerErrors] = useState({});
  const [customerTouched, setCustomerTouched] = useState({});
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerMessage, setCustomerMessage] = useState("");
  const [savedCustomer, setSavedCustomer] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchError, setCustomerSearchError] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);

  // Project state
  const [savingProject, setSavingProject] = useState(false);
  const [projectMessage, setProjectMessage] = useState(null);
  const [createdProjectId, setCreatedProjectId] = useState(null);
  const [createdProjectStartDate, setCreatedProjectStartDate] = useState(null);
  const [createdProjectEndDate, setCreatedProjectEndDate] = useState(null);
  const [projectCodeError, setProjectCodeError] = useState("");

  // Milestone state
  const [milestones, setMilestones] = useState([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [milestonesError, setMilestonesError] = useState(null);

  // Cost estimation state
  const [costEstimationData, setCostEstimationData] = useState({
    projectDetails: {},
    equipmentItems: [{ id: 1, name: '', quantity: 0, unitCost: 0, notes: '' }],
    laborItems: [{ id: 1, position: '', hours: 0, rate: 0, notes: '' }],
    otherItems: [{ id: 1, name: '', cost: 0, notes: '' }],
    totals: {
      equipmentTotal: 0,
      laborTotal: 0,
      otherTotal: 0,
      subtotal: 0,
      total: 0
    }
  });

  // Task state
  const blankTask = {
    CM_Task_Name: "",
    CM_Milestone_ID: "",
    CM_Company_ID: authUser?.company?.CM_Company_ID ?? authUser?.CM_Company_ID ?? "",
    CM_Project_ID: "",
    CM_Project_Code: "",
    CM_Engineer_ID: "",
    CM_Assign_Date: "",
    CM_Due_Date: "",
    CM_Is_Active: "Active",
    CM_Created_By: authUser?.CM_Full_Name ?? "",
    CM_Uploaded_By: authUser?.CM_Full_Name ?? "",
  };
  const [taskForms, setTaskForms] = useState([{ ...blankTask }]);
  const [taskErrorsArray, setTaskErrorsArray] = useState([{}]);
  const [taskMessagesArray, setTaskMessagesArray] = useState([""]);
  const [taskLoadingArray, setTaskLoadingArray] = useState([false]);
  const [taskGeneralMessage, setTaskGeneralMessage] = useState("");

  // History data
  const [engineers, setEngineers] = useState([]);
  const [loadingEngineers, setLoadingEngineers] = useState(true);
  const [engineersError, setEngineersError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState(null);
  const [projectsHistory, setProjectsHistory] = useState([]);
  const [tasksHistory, setTasksHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Effects

  // Load engineers and customers on initial mount
  useEffect(() => {
    let cancelled = false;
    const fetchEngineers = async () => {
      try {
        const res = await fetch("/api/projects?type=engineers");
        if (!res.ok) throw new Error("Failed to fetch engineers");
        const data = await res.json();
        if (!cancelled) {
          setEngineers(Array.isArray(data) ? data : []);
          setLoadingEngineers(false);
        }
      } catch (err) {
        if (!cancelled) {
          setEngineersError("Failed to load project leaders.");
          setLoadingEngineers(false);
        }
      }
    };

    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customers/add");
        if (!res.ok) throw new Error("Failed to fetch customers");
        const data = await res.json();
        if (!cancelled) {
          setCustomers(Array.isArray(data) ? data : []);
          setLoadingCustomers(false);
        }
      } catch (err) {
        if (!cancelled) {
          setCustomersError("Failed to load customers.");
          setLoadingCustomers(false);
        }
      }
    };

    fetchEngineers();
    fetchCustomers();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle initialProjectId changes
  useEffect(() => {
    if (initialProjectId) {
      setIsEditMode(true);
      setCreatedProjectId(initialProjectId);
      fetchProject(initialProjectId);
      fetchMilestonesForProject(initialProjectId);
      refreshProjects();
    }
  }, [initialProjectId]);

  // Fetch project history when not in edit mode
  useEffect(() => {
    if (!isEditMode) {
      fetchProjectsHistory();
    }
  }, [isEditMode]);

  // Update tasks when project ID changes
  useEffect(() => {
    if (createdProjectId) {
      fetchMilestonesForProject(createdProjectId);
      fetchTasksForProject(createdProjectId);

      // Only update task forms if they're empty
      if (taskForms.length === 1 && !taskForms[0].CM_Task_Name) {
        setTaskForms((prev) =>
          prev.map((t) => ({
            ...t,
            CM_Project_ID: t.CM_Project_ID || createdProjectId
          }))
        );
      }
    }
  }, [createdProjectId]);

  // Helper functions
  const fetchProject = async (projectId) => {
    if (!projectId) return;

    try {
      const res = await fetch(`/api/projects?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      const data = await res.json();

      // Update form with project data
      Object.keys(data).forEach(key => {
        if (key.startsWith('CM_')) {
          handleChange({ target: { name: key, value: data[key] } });
        }
      });

      // Set project dates
      if (data.CM_Planned_Start_Date) {
        setCreatedProjectStartDate(data.CM_Planned_Start_Date);
      }

      if (data.CM_Planned_End_Date || data.CM_Plenned_End_Date) {
        setCreatedProjectEndDate(data.CM_Planned_End_Date || data.CM_Plenned_End_Date);
      }

      // Fetch associated customer if available
      if (data.CM_Customer_ID) {
        await fetchCustomer(data.CM_Customer_ID);
      }

      // Fetch milestones and tasks for this project
      fetchMilestonesForProject(projectId);
      fetchTasksForProject(projectId);
    } catch (err) {
      console.error('Error fetching project data:', err);
    }
  };

  const fetchCustomer = async (customerId) => {
    if (!customerId) return;

    try {
      const res = await fetch(`/api/customers/add?customerId=${customerId}`);
      if (!res.ok) throw new Error('Failed to fetch customer');
      const data = await res.json();

      // Update customer state
      setCustomerFormData(data);
      setSavedCustomer(data);

      // Update project form with customer details
      handleChange({ target: { name: "CM_Project_Customer", value: data.CM_Customer_Name } });
      handleChange({ target: { name: "CM_Project_Customer_Phone", value: data.CM_Phone_Number } });
      handleChange({ target: { name: "CM_Customer_Address", value: data.CM_Address } });
      handleChange({ target: { name: "CM_Customer_ID", value: data.CM_Customer_ID } });
    } catch (err) {
      console.error('Error fetching customer data:', err);
    }
  };

  const fetchProjectsHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjectsHistory(Array.isArray(data) ? data : []);
      setLoadingHistory(false);
    } catch (err) {
      console.error("fetchProjectsHistory error:", err);
      setHistoryError("Failed to load projects history.");
      setLoadingHistory(false);
    }
  };

  const fetchMilestonesForProject = async (projectId) => {
    if (!projectId) return;

    try {
      setMilestonesLoading(true);
      const res = await fetch(`/api/milestones?projectId=${encodeURIComponent(projectId)}`);
      if (!res.ok) {
        setMilestones([]);
        setMilestonesLoading(false);
        return;
      }

      const data = await res.json();
      setMilestones(Array.isArray(data) ? data : []);
      setMilestonesLoading(false);
    } catch (err) {
      console.error("fetchMilestonesForProject error:", err);
      setMilestonesError("Failed to load milestones for the project.");
      setMilestones([]);
      setMilestonesLoading(false);
    }
  };

  const fetchTasksForProject = async (projectId) => {
    if (!projectId) return;

    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/tasks?projectId=${encodeURIComponent(projectId)}`);
      if (!res.ok) {
        setTasksHistory([]);
        setLoadingHistory(false);
        return;
      }

      const data = await res.json();
      const taskList = Array.isArray(data) ? data : [];
      setTasksHistory(taskList);

      // If in edit mode and we have tasks, update the task forms
      if (taskList.length > 0 && isEditMode) {
        setTaskForms(taskList.map(task => ({
          CM_Task_ID: task.CM_Task_ID,
          CM_Task_Name: task.CM_Task_Name,
          CM_Milestone_ID: task.CM_Milestone_ID || "",
          CM_Company_ID: task.CM_Company_ID || authUser?.company?.CM_Company_ID || authUser?.CM_Company_ID,
          CM_Project_ID: task.CM_Project_ID,
          CM_Engineer_ID: task.CM_Engineer_ID,
          CM_Assign_Date: toInputDate(task.CM_Assign_Date),
          CM_Due_Date: toInputDate(task.CM_Due_Date),
          CM_Is_Active: task.CM_Is_Active || "Active",
          CM_Created_By: task.CM_Created_By || authUser?.CM_Full_Name,
          CM_Uploaded_By: task.CM_Uploaded_By || authUser?.CM_Full_Name,
        })));

        // Reset the task validation and loading states
        setTaskErrorsArray(Array(taskList.length).fill({}));
        setTaskMessagesArray(Array(taskList.length).fill(""));
        setTaskLoadingArray(Array(taskList.length).fill(false));
      }
      // If no tasks found and no tasks in form, initialize with blank task
      else if (taskList.length === 0 && (!taskForms.length || !taskForms[0].CM_Task_Name)) {
        setTaskForms([{
          ...blankTask,
          CM_Project_ID: projectId
        }]);
      }

      setLoadingHistory(false);
    } catch (err) {
      console.error("fetchTasksForProject error:", err);
      setTasksHistory([]);
      setHistoryError("Failed to load tasks for the project.");
      setLoadingHistory(false);
    }
  };

  // Date helpers
  const formatDateForApi = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
  };

  const toInputDate = (d) => {
    if (!d) return "";
    const dd = new Date(d);
    if (isNaN(dd.getTime())) return "";
    const yyyy = dd.getFullYear();
    const mm = String(dd.getMonth() + 1).padStart(2, "0");
    const ddv = String(dd.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${ddv}`;
  };

  // Reset function
  const resetAll = () => {
    setIsEditMode(false);
    setCustomerFormData({
      CM_Customer_Name: "",
      CM_Email: "",
      CM_Phone_Number: "",
      CM_Alternate_Phone: "",
      CM_Address: "",
      CM_District: "",
      CM_State: "",
      CM_Country: "India",
      CM_Postal_Code: "",
      CM_Location: "",
      CM_GST_Number: "",
      CM_PAN_Number: "",
      CM_Payment_Terms: "",
      CM_Is_Active: "Active",
      CM_Create_Limit: "",
      CM_Created_By: authUser?.CM_Full_Name ?? "Admin",
      CM_Uploaded_By: authUser?.CM_Full_Name ?? "Admin",
    });
    setCustomerTouched({});
    setCustomerErrors({});
    setCustomerMessage("");
    setSavedCustomer(null);

    const keysToClear = [
      "CM_Project_Name",
      "CM_Project_Code",
      "CM_Company_ID",
      "CM_Project_Leader_ID",
      "CM_Project_Type",
      "CM_Project_Location",
      "CM_Project_Customer",
      "CM_Project_Customer_Phone",
      "CM_Customer_Address",
      "CM_Estimated_Cost",
      "CM_Actual_Cost",
      "CM_Status",
      "CM_Planned_Start_Date",
      "CM_Plenned_End_Date",
      "CM_Planned_End_Date",
      "CM_Description",
      "CM_Customer_ID",
      "CM_Project_ID",
    ];

    keysToClear.forEach((k) => handleChange({ target: { name: k, value: "" } }));

    setCreatedProjectId(null);
    setProjectMessage(null);
    setCreatedProjectStartDate(null);
    setCreatedProjectEndDate(null);

    setCostEstimationData({
      projectDetails: {},
      equipmentItems: [{ id: 1, name: '', quantity: 0, unitCost: 0, notes: '' }],
      laborItems: [{ id: 1, position: '', hours: 0, rate: 0, notes: '' }],
      otherItems: [{ id: 1, name: '', cost: 0, notes: '' }],
      totals: {
        equipmentTotal: 0,
        laborTotal: 0,
        otherTotal: 0,
        subtotal: 0,
        total: 0
      }
    });

    // Reset milestones
    setMilestones([]);

    // Reset tasks
    setTaskForms([{ ...blankTask }]);
    setTaskErrorsArray([{}]);
    setTaskLoadingArray([false]);
    setTaskMessagesArray([""]);
    setTaskGeneralMessage("");

    setActiveStep(0);
  };

  const handleStepNavigation = (step) => {
  let canNavigate = false;

  switch (step) {
    case 0:
      canNavigate = true;
      break;
    case 1:
      canNavigate = !!savedCustomer;
      break;
    case 2:
    case 3:
    case 4:
    case 5:
      canNavigate = !!createdProjectId;
      break;
    default:
      canNavigate = false;
  }

  if (canNavigate) {
    setActiveStep(step);
  } else {
    if (step === 1 && !savedCustomer) {
      toast.error("⚠️ Please complete customer details first.");
    } else if ([2, 3, 4, 5].includes(step) && !createdProjectId) {
      toast.error("🚧 Please complete project details first.");
    }
  }
};

  // Step Indicator Component
  const StepIndicator = ({ step }) => {
    const steps = ["Customer Details", "Project Details", "Estimated Cost", "Milestones", "Tasks", "Success"];

    return (
      <div className="w-full px-2">
        {/* Mobile Step Indicator */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-1 cursor-pointer ${step === 0
                  ? "bg-blue-600 text-white shadow-lg"
                  : step > 0
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                  }`}
                onClick={() => handleStepNavigation(0)}
              >
                {step > 0 ? "✓" : "1"}
              </div>
              <span className="text-xs font-medium text-gray-700">Customer</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-300">
              <div className={`h-full ${step > 0 ? "bg-green-500" : "bg-gray-300"}`}></div>
            </div>
            <div className="text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-1 cursor-pointer ${step === 1
                  ? "bg-blue-600 text-white shadow-lg"
                  : step > 1
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                  }`}
                onClick={() => handleStepNavigation(1)}
              >
                {step > 1 ? "✓" : "2"}
              </div>
              <span className="text-xs font-medium text-gray-700">Project</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-300">
              <div className={`h-full ${step > 1 ? "bg-green-500" : "bg-gray-300"}`}></div>
            </div>
            <div className="text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-1 cursor-pointer ${step === 2
                  ? "bg-blue-600 text-white shadow-lg"
                  : step > 2
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                  }`}
                onClick={() => handleStepNavigation(2)}
              >
                {step > 2 ? "✓" : "3"}
              </div>
              <span className="text-xs font-medium text-gray-700">Cost</span>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-1 cursor-pointer ${step === 3
                  ? "bg-blue-600 text-white shadow-lg"
                  : step > 3
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                  }`}
                onClick={() => handleStepNavigation(3)}
              >
                {step > 3 ? "✓" : "4"}
              </div>
              <span className="text-xs font-medium text-gray-700">Milestones</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-300">
              <div className={`h-full ${step > 3 ? "bg-green-500" : "bg-gray-300"}`}></div>
            </div>
            <div className="text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-1 cursor-pointer ${step === 4
                  ? "bg-blue-600 text-white shadow-lg"
                  : step > 4
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                  }`}
                onClick={() => handleStepNavigation(4)}
              >
                {step > 4 ? "✓" : "5"}
              </div>
              <span className="text-xs font-medium text-gray-700">Tasks</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-300">
              <div className={`h-full ${step > 4 ? "bg-green-500" : "bg-gray-300"}`}></div>
            </div>
            <div className="text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-1 cursor-pointer ${step === 5
                  ? "bg-blue-600 text-white shadow-lg"
                  : step > 5
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                  }`}
                onClick={() => handleStepNavigation(5)}
              >
                {step > 5 ? "✓" : "6"}
              </div>
              <span className="text-xs font-medium text-gray-700">Success</span>
            </div>
          </div>
        </div>

        {/* Desktop Step Indicator */}
        <div className="hidden lg:flex items-center justify-center space-x-4">
          {steps.map((label, index) => (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center 
                    font-medium transition-all duration-300 text-sm
                    ${index === activeStep
                      ? "bg-blue-600 text-white shadow-lg"
                      : index < activeStep
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }
                    cursor-pointer
                  `}
                  onClick={() => handleStepNavigation(index)}
                >
                  {index < activeStep ? "✓" : index + 1}
                </div>
                <span className="mt-2 text-xs font-medium text-gray-700 text-center max-w-20">
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-1 ${index < activeStep ? "bg-green-500" : "bg-gray-300"}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 min-h-[600px]">
      {/* Header with Step Indicator */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isEditMode ? "Create New Project" : "Create New Project"}
            </h1>
            <div className="text-sm text-gray-600 bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
              Step {activeStep + 1} of 6
            </div>
          </div>
          <StepIndicator step={activeStep} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative overflow-hidden p-4 sm:p-6">
        {/* Step 1: Customer Details */}
        {activeStep === 0 && (
          <CustomerStep
            customerFormData={customerFormData}
            setCustomerFormData={setCustomerFormData}
            customerErrors={customerErrors}
            setCustomerErrors={setCustomerErrors}
            customerTouched={customerTouched}
            setCustomerTouched={setCustomerTouched}
            customerLoading={customerLoading}
            setCustomerLoading={setCustomerLoading}
            customerMessage={customerMessage}
            setCustomerMessage={setCustomerMessage}
            savedCustomer={savedCustomer}
            setSavedCustomer={setSavedCustomer}
            customerSearchQuery={customerSearchQuery}
            setCustomerSearchQuery={setCustomerSearchQuery}
            customerSearchError={customerSearchError}
            setCustomerSearchError={setCustomerSearchError}
            customerSuggestions={customerSuggestions}
            setCustomerSuggestions={setCustomerSuggestions}
            handleChange={handleChange}
            authUser={authUser}
            setActiveStep={setActiveStep}
            customers={customers}
            handleStepNavigation={handleStepNavigation}
          />
        )}

        {/* Step 2: Project Details */}
        {activeStep === 1 && (
          <ProjectDetailsStep
            form={form}
            setForm={setForm}
            handleChange={handleChange}
            handleCancel={handleCancel}
            error={error}
            savedCustomer={savedCustomer}
            customerFormData={customerFormData}
            setActiveStep={setActiveStep}
            savingProject={savingProject}
            setSavingProject={setSavingProject}
            projectMessage={projectMessage}
            setProjectMessage={setProjectMessage}
            createdProjectId={createdProjectId}
            setCreatedProjectId={setCreatedProjectId}
            setCreatedProjectStartDate={setCreatedProjectStartDate}
            setCreatedProjectEndDate={setCreatedProjectEndDate}
            engineers={engineers}
            loadingEngineers={loadingEngineers}
            engineersError={engineersError}
            projectCodeError={projectCodeError}
            setProjectCodeError={setProjectCodeError}
            projectsHistory={projectsHistory}
            authUser={authUser}
            taskForms={taskForms}
            setTaskForms={setTaskForms}
            isEditMode={isEditMode}
            handleStepNavigation={handleStepNavigation}
          />
        )}

        {/* Step 3: Estimated Cost */}
        {activeStep === 2 && (
          <CostEstimationStep
            costEstimationData={costEstimationData}
            setCostEstimationData={setCostEstimationData}
            createdProjectId={createdProjectId}
            form={form}
            setActiveStep={setActiveStep}
            handleStepNavigation={handleStepNavigation}
          />
        )}

        {/* Step 4: Milestones */}
        {activeStep === 3 && (
          <MilestoneCreationStep
            form={form}
            createdProjectId={createdProjectId}
            setActiveStep={setActiveStep}
            authUser={authUser}
            resetAll={resetAll}
            projectStartDate={createdProjectStartDate || form.CM_Planned_Start_Date}
            projectEndDate={createdProjectEndDate || form.CM_Plenned_End_Date || form.CM_Planned_End_Date}
            fetchMilestonesForProject={fetchMilestonesForProject}
            existingMilestones={milestones}
            isLoading={milestonesLoading}
            error={milestonesError}
            handleStepNavigation={handleStepNavigation}
          />
        )}

        {/* Step 5: Tasks */}
        {activeStep === 4 && (
          <TaskAssignmentStep
            form={form}
            createdProjectId={createdProjectId}
            createdProjectStartDate={createdProjectStartDate}
            createdProjectEndDate={createdProjectEndDate}
            taskForms={taskForms}
            setTaskForms={setTaskForms}
            taskErrorsArray={taskErrorsArray}
            setTaskErrorsArray={setTaskErrorsArray}
            taskMessagesArray={taskMessagesArray}
            setTaskMessagesArray={setTaskMessagesArray}
            taskLoadingArray={taskLoadingArray}
            setTaskLoadingArray={setTaskLoadingArray}
            taskGeneralMessage={taskGeneralMessage}
            setTaskGeneralMessage={setTaskGeneralMessage}
            authUser={authUser}
            engineers={engineers}
            savedCustomer={savedCustomer}
            customerFormData={customerFormData}
            blankTask={blankTask}
            isEditMode={isEditMode}
            setActiveStep={setActiveStep}
            resetAll={resetAll}
            fetchTasksForProject={fetchTasksForProject}
            milestones={milestones}
            fetchMilestonesForProject={fetchMilestonesForProject}
            formatDateForApi={formatDateForApi}
            toInputDate={toInputDate}
            handleStepNavigation={handleStepNavigation}
          />
        )}

        {/* Step 6: Success */}
        {activeStep === 5 && (
          <SuccessStep
            isEditMode={isEditMode}
            createdProjectId={createdProjectId}
            form={form}
            savedCustomer={savedCustomer}
            customerFormData={customerFormData}
            tasksHistory={tasksHistory}
            engineers={engineers}
            milestones={milestones}
            resetAll={resetAll}
            handleCancel={handleCancel}
            setActiveStep={setActiveStep}
            onSuccess={onSuccess}
            handleStepNavigation={handleStepNavigation}
          />
        )}
      </div>
    </div>
  );
}