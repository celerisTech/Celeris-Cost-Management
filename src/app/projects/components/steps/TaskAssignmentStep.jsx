// src/app/projects/components/steps/TaskAssignmentStep.jsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { formatTitleCase, formatSentenceCase } from "../../../utils/textUtils";

const pad = (n) => String(n).padStart(2, '0');

/**
 * Convert various date inputs to a safe YYYY-MM-DD string without timezone shifts.
 */
const toInputDateSafe = (value) => {
  if (!value && value !== 0) return '';
  // If already a plain YYYY-MM-DD
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // If it's a number (timestamp)
  if (typeof value === 'number') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    }
    return '';
  }
  // If it's a Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  // If it's an ISO-like string, try to parse and get UTC date components
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}`;
    }
    // fallback: split on T (best effort)
    if (value.includes('T')) {
      return value.split('T')[0];
    }
    // fallback last resort
    return value;
  }
  return '';
};

/**
 * Parse a YYYY-MM-DD string to a UTC numeric value (ms since epoch)
 */
const ymdToUtcMs = (ymd) => {
  if (!ymd || typeof ymd !== 'string') return NaN;
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return NaN;
  const year = Number(m[1]), month = Number(m[2]) - 1, day = Number(m[3]);
  return Date.UTC(year, month, day);
};

export default function TaskAssignmentStep({
  form,
  createdProjectId,
  createdProjectStartDate,
  createdProjectEndDate,
  taskForms,
  setTaskForms,
  taskErrorsArray,
  setTaskErrorsArray,
  taskMessagesArray,
  setTaskMessagesArray,
  taskLoadingArray,
  setTaskLoadingArray,
  taskGeneralMessage,
  setTaskGeneralMessage,
  authUser,
  engineers = [],
  savedCustomer,
  customerFormData = {},
  blankTask = {},
  isEditMode,
  setActiveStep,
  resetAll,
  fetchTasksForProject,
  // New props for milestones
  milestones = [],
  fetchMilestonesForProject,
  formatDateForApi,
  toInputDate,
  handleStepNavigation
}) {
  // Use safe helpers if parent didn't provide them
  const _toInputDate = toInputDate || toInputDateSafe;
  const _formatDateForApi = formatDateForApi || ((d) => {
    return _toInputDate(d) || null;
  });
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);

  // Fetch milestones on component mount if not provided
  useEffect(() => {
    if (createdProjectId && (!milestones || milestones.length === 0) && fetchMilestonesForProject) {
      fetchMilestonesForProject(createdProjectId);
    }
  }, [createdProjectId, milestones, fetchMilestonesForProject]);

  // Fixed validation function
  const validateTaskGeneric = useCallback((tf) => {
    const errs = {};
    const projectId = tf.CM_Project_ID || createdProjectId;

    if (!projectId) {
      errs.CM_Project_ID = 'No project selected.';
      return errs;
    }

    // Task name validation
    if (!tf.CM_Task_Name || tf.CM_Task_Name.trim() === '') {
      errs.CM_Task_Name = 'Task name is required.';
    }

    // Milestone validation - now required
    if (!tf.CM_Milestone_ID) {
      errs.CM_Milestone_ID = 'Milestone selection is required.';
    }

    // Date validations - use direct values since inputs are already YYYY-MM-DD
    if (!tf.CM_Assign_Date) {
      errs.CM_Assign_Date = 'Assign date is required.';
    }

    if (!tf.CM_Due_Date) {
      errs.CM_Due_Date = 'Due date is required.';
    }

    if (tf.CM_Assign_Date && tf.CM_Due_Date) {
      const aMs = ymdToUtcMs(tf.CM_Assign_Date); // Use direct value
      const dMs = ymdToUtcMs(tf.CM_Due_Date); // Use direct value

      if (isNaN(aMs) || isNaN(dMs)) {
        errs.CM_Assign_Date = errs.CM_Assign_Date || 'Invalid date format.';
        errs.CM_Due_Date = errs.CM_Due_Date || 'Invalid date format.';
      } else if (dMs < aMs) {
        errs.CM_Due_Date = 'Due date must be the same or after assign date.';
      } else if (createdProjectStartDate && createdProjectEndDate) {
        const psMs = ymdToUtcMs(_toInputDate(createdProjectStartDate));
        const peMs = ymdToUtcMs(_toInputDate(createdProjectEndDate));

        if (!isNaN(psMs) && !isNaN(peMs)) {
          if (aMs < psMs) {
            errs.CM_Assign_Date = 'Assign date cannot be before project start date.';
          }
          if (dMs > peMs) {
            errs.CM_Due_Date = 'Due date cannot be after project end date.';
          }
        }
      }

      // Validate task dates against milestone dates if a milestone is selected
      if (tf.CM_Milestone_ID && !errs.CM_Milestone_ID) {
        const selectedMilestone = milestones.find(m => m.CM_Milestone_ID === tf.CM_Milestone_ID);
        if (selectedMilestone) {
          const msMs = ymdToUtcMs(_toInputDate(selectedMilestone.CM_Planned_Start_Date));
          const meMs = ymdToUtcMs(_toInputDate(selectedMilestone.CM_Planned_End_Date));

          if (!isNaN(msMs) && !isNaN(meMs)) {
            if (aMs < msMs) {
              errs.CM_Assign_Date = 'Assign date cannot be before milestone start date.';
            }
            if (dMs > meMs) {
              errs.CM_Due_Date = 'Due date cannot be after milestone end date.';
            }
          }
        }
      }
    }

    return errs;
  }, [createdProjectId, createdProjectStartDate, createdProjectEndDate, milestones, _toInputDate]);

  // Fixed field change handler
  const handleSingleTaskFieldChange = (index, e) => {
    const { name, value } = e.target;

    let formattedValue = value;
    if (name === "CM_Task_Name") {
      formattedValue = formatTitleCase(value);
    }

    setTaskForms((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [name]: formattedValue };
      return next;
    });

    // Clear error for this field when user modifies it
    setTaskErrorsArray((prev) => {
      const next = [...prev];
      next[index] = { ...(next[index] || {}), [name]: '' };
      return next;
    });

    // Clear message when making changes
    setTaskMessagesArray((prev) => {
      const next = [...prev];
      next[index] = '';
      return next;
    });

    // Clear general message when user makes changes
    if (taskGeneralMessage) {
      setTaskGeneralMessage('');
    }

    // When milestone changes, adjust date limits based on milestone dates
    if (name === 'CM_Milestone_ID') {
      const selectedMilestone = milestones.find(m => m.CM_Milestone_ID === value);
      if (selectedMilestone) {
        const milestoneStart = _toInputDate(selectedMilestone.CM_Planned_Start_Date);
        const milestoneEnd = _toInputDate(selectedMilestone.CM_Planned_End_Date);

        if (milestoneStart && milestoneEnd) {
          setTaskForms((prev) => {
            const next = [...prev];
            const currentTask = next[index];
            let updatedTask = { ...currentTask };

            // Adjust assign date if needed
            if (!currentTask.CM_Assign_Date ||
              ymdToUtcMs(currentTask.CM_Assign_Date) < ymdToUtcMs(milestoneStart)) {
              updatedTask.CM_Assign_Date = milestoneStart;
            }

            // Adjust due date if needed
            if (!currentTask.CM_Due_Date ||
              ymdToUtcMs(currentTask.CM_Due_Date) > ymdToUtcMs(milestoneEnd)) {
              updatedTask.CM_Due_Date = milestoneEnd;
            }

            next[index] = updatedTask;
            return next;
          });

          // Clear date errors after auto-adjustment
          setTimeout(() => {
            setTaskErrorsArray((prev) => {
              const next = [...prev];
              next[index] = {
                ...(next[index] || {}),
                CM_Assign_Date: '',
                CM_Due_Date: ''
              };
              return next;
            });
          }, 0);
        }
      }
    }
  };

  const handleContinueWithoutSaving = () => {
    handleStepNavigation(5); // Navigate to Success step
  };


  const addTaskRow = () => {
    setTaskForms((prev) => [...prev, { ...blankTask, CM_Project_ID: createdProjectId }]);
    setTaskErrorsArray((prev) => [...prev, {}]);
    setTaskLoadingArray((prev) => [...prev, false]);
    setTaskMessagesArray((prev) => [...prev, '']);
    setTaskGeneralMessage(''); // Clear general message when adding new task
  };

  const removeTaskRow = (index) => {
    setTaskForms((prev) => prev.filter((_, i) => i !== index));
    setTaskErrorsArray((prev) => prev.filter((_, i) => i !== index));
    setTaskLoadingArray((prev) => prev.filter((_, i) => i !== index));
    setTaskMessagesArray((prev) => prev.filter((_, i) => i !== index));
    setTaskGeneralMessage(''); // Clear general message when removing task
  };

  const handleSubmitAllTasks = async (e) => {
    e.preventDefault();
    setTaskGeneralMessage('');

    const projectId = createdProjectId;

    if (!projectId) {
      setTaskGeneralMessage('❌ No project found. Create a project first.');
      handleStepNavigation(1);
      return;
    }

    // Validate all tasks using the fixed validation function
    const errsArr = taskForms.map((t) => validateTaskGeneric({
      ...t,
      CM_Project_ID: projectId
    }));

    const hasErrors = errsArr.some((errs) => Object.keys(errs).length > 0);
    if (hasErrors) {
      setTaskErrorsArray(errsArr);
      setTaskGeneralMessage('❌ Please fix the errors in the highlighted tasks.');
      return;
    }

    // Clear all previous errors before submission
    setTaskErrorsArray(taskForms.map(() => ({})));

    // Set loading state for all tasks
    setTaskLoadingArray(taskForms.map(() => true));
    setTaskMessagesArray(taskForms.map(() => ''));

    const results = [];

    // Process each task
    for (let i = 0; i < taskForms.length; i++) {
      const t = { ...taskForms[i], CM_Project_ID: projectId };

      // If no engineer specified, use project leader
      if (!t.CM_Engineer_ID || String(t.CM_Engineer_ID).trim() === '') {
        const pl = form.CM_Project_Leader_ID;
        if (pl) t.CM_Engineer_ID = pl;
      }

      const payload = {
        CM_Task_Name: t.CM_Task_Name || null,
        CM_Milestone_ID: t.CM_Milestone_ID || null,
        CM_Company_ID:
          t.CM_Company_ID ||
          authUser?.company?.CM_Company_ID ||
          authUser?.CM_Company_ID ||
          null,
        CM_Project_ID: projectId,
        CM_Engineer_ID: t.CM_Engineer_ID,
        CM_Assign_Date: _formatDateForApi(t.CM_Assign_Date),
        CM_Due_Date: _formatDateForApi(t.CM_Due_Date),
        CM_Is_Active: t.CM_Is_Active ?? 'Active',
        CM_Created_By: t.CM_Created_By || authUser?.CM_Full_Name,
        CM_Uploaded_By: authUser?.CM_Full_Name || t.CM_Uploaded_By,
      };

      const isUpdate = !!t.CM_Task_ID;
      if (isUpdate) payload.CM_Task_ID = t.CM_Task_ID;

      try {
        const method = 'POST';
        const url = isUpdate ? '/api/tasks?_method=PUT' : '/api/tasks';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.error || data?.message || `Failed to ${isUpdate ? 'update' : 'assign'} task`;
          setTaskMessagesArray((prev) => {
            const next = [...prev];
            next[i] = '❌ ' + msg;
            return next;
          });
          setTaskLoadingArray((prev) => {
            const next = [...prev];
            next[i] = false;
            return next;
          });
          results.push({ success: false, index: i, error: msg });
          continue;
        }

        setTaskMessagesArray((prev) => {
          const next = [...prev];
          next[i] = `✅ Task ${isUpdate ? 'updated' : 'assigned'} successfully!`;
          return next;
        });
        setTaskLoadingArray((prev) => {
          const next = [...prev];
          next[i] = false;
          return next;
        });

        if (!isUpdate && data.CM_Task_ID) {
          setTaskForms((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], CM_Task_ID: data.CM_Task_ID };
            return next;
          });
        }
        results.push({ success: true, index: i, data });
      } catch (err) {
        setTaskMessagesArray((prev) => {
          const next = [...prev];
          next[i] = '❌ Something went wrong with the task operation.';
          return next;
        });
        setTaskLoadingArray((prev) => {
          const next = [...prev];
          next[i] = false;
          return next;
        });
        results.push({ success: false, index: i, error: String(err) });
      }
    }

    // Refresh tasks list after processing
    if (fetchTasksForProject) {
      fetchTasksForProject(projectId);
    }

    const anySuccess = results.some((r) => r.success);
    if (anySuccess) {
      setTaskGeneralMessage('✅ Tasks processed successfully. See per-task messages for details.');
      setTimeout(() => handleStepNavigation(5), 500); // Navigate to Success step
    } else {
      setTaskGeneralMessage('❌ All tasks failed. Check per-task messages for details.');
    }
  };

  // ... rest of the component (getProjectLeaderName, getMilestoneName, getMilestoneDateRange, etc.) remains the same

  const getProjectLeaderName = () => {
    const leaderId = form?.CM_Project_Leader_ID;
    if (!leaderId) return '—';
    const found = (engineers || []).find((e) => String(e.CM_User_ID) === String(leaderId));
    return found ? found.CM_Full_Name : leaderId;
  };

  const getMilestoneName = (milestoneId) => {
    if (!milestoneId) return '—';
    const found = (milestones || []).find(m => m.CM_Milestone_ID === milestoneId);
    return found ? found.CM_Milestone_Name : milestoneId;
  };

  const getMilestoneDateRange = (milestoneId) => {
    if (!milestoneId) return { min: '', max: '' };
    const found = (milestones || []).find(m => m.CM_Milestone_ID === milestoneId);
    if (!found) return { min: '', max: '' };

    return {
      min: _toInputDate(found.CM_Planned_Start_Date) || '',
      max: _toInputDate(found.CM_Planned_End_Date) || ''
    };
  };

  // Safe displayed project start/end (YYYY-MM-DD)
  const displayedProjectStart = _toInputDate(createdProjectStartDate || form?.CM_Planned_Start_Date);
  const displayedProjectEnd = _toInputDate(createdProjectEndDate || form?.CM_Planned_End_Date || form?.CM_Plenned_End_Date);

  return (
    <div className="min-h-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {isEditMode ? 'Edit Tasks' : 'Assign Task(s)'}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Project Summary Section */}
        <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-2 h-7 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md"></div>
            <div className="ml-3">
              <h2 className="text-lg font-bold text-gray-800">Project Summary</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Project Name</label>
              <input
                readOnly
                value={form?.CM_Project_Name || form?.CM_Project_code || ''}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
              <input
                readOnly
                value={savedCustomer?.CM_Customer_Name || customerFormData?.CM_Customer_Name || ''}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigned by</label>
              <input
                readOnly
                value={authUser?.CM_Full_Name || ''}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 text-gray-800"
              />
            </div>

            <div className="md:col-span-3 mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Timeline</label>
              <div className="text-sm text-gray-600 flex flex-col md:flex-row md:items-center gap-2">
                <span className="flex items-center gap-2">
                  <span className="font-medium">Start Date:</span>
                  <span className="bg-blue-50 px-2 py-1 rounded text-blue-700">{displayedProjectStart || '—'}</span>
                </span>
                <span className="hidden md:inline mx-3 text-gray-400">|</span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">End Date:</span>
                  <span className="bg-blue-50 px-2 py-1 rounded text-blue-700">{displayedProjectEnd || '—'}</span>
                </span>
              </div>
            </div>

            <div className="md:col-span-3 mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Leader (Default Engineer)</label>
              <input
                readOnly
                value={getProjectLeaderName()}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 text-gray-800"
              />
            </div>

            {/* Add milestone count summary if there are milestones */}
            {milestones && milestones.length > 0 && (
              <div className="md:col-span-3 mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Milestones</label>
                <div className="flex flex-wrap gap-2">
                  {milestones.map(milestone => (
                    <div key={milestone.CM_Milestone_ID} className="px-3 py-1.5 border border-gray-300 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {milestone.CM_Milestone_Name}
                      <span className="text-blue-400 mx-1">•</span>
                      {_toInputDate(milestone.CM_Planned_Start_Date)} to {_toInputDate(milestone.CM_Planned_End_Date)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>


        {/* Task Entry Form - Sticky Section */}
        <section className="sticky top-4 z-10 bg-white p-4 rounded-lg border border-gray-200 shadow-md">
          <form onSubmit={handleSubmitAllTasks} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center">
                <div className="w-2 h-7 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md"></div>
                <h3 className="ml-2 text-lg font-bold text-gray-800">Task Assignment</h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addTaskRow}
                  className="px-3 py-1.5 border border-green-300 rounded-md text-white bg-green-500 hover:bg-green-600 transition text-sm font-medium flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTaskForms([{ ...blankTask, CM_Project_ID: createdProjectId }]);
                    setTaskErrorsArray([{}]);
                    setTaskMessagesArray(['']);
                  }}
                  className="px-3 py-1.5 border border-blue-300 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition text-sm font-medium"
                >
                  Reset Tasks
                </button>
              </div>
            </div>

            {/* Current Task Entry */}
            <div className="p-4 rounded-md border border-gray-200 bg-blue-50/30 text-black">
              <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                {taskForms[taskForms.length - 1]?.CM_Task_ID
                  ? `Task : ${taskForms.length} (ID: ${taskForms[taskForms.length - 1].CM_Task_ID})`
                  : `New Task : ${taskForms.length}`}
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="CM_Task_Name"
                  value={taskForms[taskForms.length - 1]?.CM_Task_Name || ''}
                  onChange={(e) => handleSingleTaskFieldChange(taskForms.length - 1, e)}
                  placeholder="e.g. Site inspection, Foundation work"
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${taskErrorsArray[taskForms.length - 1]?.CM_Task_Name
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                    }`}
                />
                {taskErrorsArray[taskForms.length - 1]?.CM_Task_Name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {taskErrorsArray[taskForms.length - 1].CM_Task_Name}
                  </p>
                )}
              </div>

              {/* Add Milestone Selection - New field */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Milestone <span className="text-red-500">*</span>
                </label>
                <select
                  name="CM_Milestone_ID"
                  value={taskForms[taskForms.length - 1]?.CM_Milestone_ID || ''}
                  onChange={(e) => handleSingleTaskFieldChange(taskForms.length - 1, e)}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${taskErrorsArray[taskForms.length - 1]?.CM_Milestone_ID
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                    }`}
                >
                  <option value="">Select a Milestone</option>
                  {(milestones || []).map((milestone) => (
                    <option key={milestone.CM_Milestone_ID} value={milestone.CM_Milestone_ID}>
                      {milestone.CM_Milestone_Name} ({_toInputDate(milestone.CM_Planned_Start_Date)} to {_toInputDate(milestone.CM_Planned_End_Date)})
                    </option>
                  ))}
                </select>
                {taskErrorsArray[taskForms.length - 1]?.CM_Milestone_ID && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {taskErrorsArray[taskForms.length - 1].CM_Milestone_ID}
                  </p>
                )}
                {milestones && milestones.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    No milestones defined. Go back to add milestones first.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Engineer</label>
                  <select
                    name="CM_Engineer_ID"
                    value={taskForms[taskForms.length - 1]?.CM_Engineer_ID || ''}
                    onChange={(e) => handleSingleTaskFieldChange(taskForms.length - 1, e)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Default to Project Leader</option>
                    {(engineers || []).map((engineer) => (
                      <option key={engineer.CM_User_ID} value={engineer.CM_User_ID}>
                        {engineer.CM_Full_Name}
                      </option>
                    ))}
                  </select>
                  {taskErrorsArray[taskForms.length - 1]?.CM_Engineer_ID && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {taskErrorsArray[taskForms.length - 1].CM_Engineer_ID}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="CM_Assign_Date"
                    value={_toInputDate(taskForms[taskForms.length - 1]?.CM_Assign_Date) || ''}
                    onChange={(e) => handleSingleTaskFieldChange(taskForms.length - 1, e)}
                    // Use milestone date range if available, otherwise use project dates
                    min={taskForms[taskForms.length - 1]?.CM_Milestone_ID
                      ? getMilestoneDateRange(taskForms[taskForms.length - 1].CM_Milestone_ID).min
                      : displayedProjectStart || undefined}
                    max={taskForms[taskForms.length - 1]?.CM_Milestone_ID
                      ? getMilestoneDateRange(taskForms[taskForms.length - 1].CM_Milestone_ID).max
                      : displayedProjectEnd || undefined}
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${taskErrorsArray[taskForms.length - 1]?.CM_Assign_Date
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                      }`}
                  />
                  {taskErrorsArray[taskForms.length - 1]?.CM_Assign_Date && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {taskErrorsArray[taskForms.length - 1].CM_Assign_Date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="CM_Due_Date"
                    value={_toInputDate(taskForms[taskForms.length - 1]?.CM_Due_Date) || ''}
                    onChange={(e) => handleSingleTaskFieldChange(taskForms.length - 1, e)}
                    min={
                      taskForms[taskForms.length - 1]?.CM_Assign_Date
                        ? _toInputDate(taskForms[taskForms.length - 1]?.CM_Assign_Date)
                        : taskForms[taskForms.length - 1]?.CM_Milestone_ID
                          ? getMilestoneDateRange(taskForms[taskForms.length - 1].CM_Milestone_ID).min
                          : displayedProjectStart || undefined
                    }
                    max={taskForms[taskForms.length - 1]?.CM_Milestone_ID
                      ? getMilestoneDateRange(taskForms[taskForms.length - 1].CM_Milestone_ID).max
                      : displayedProjectEnd || undefined}
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${taskErrorsArray[taskForms.length - 1]?.CM_Due_Date
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                      }`}
                  />
                  {taskErrorsArray[taskForms.length - 1]?.CM_Due_Date && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {taskErrorsArray[taskForms.length - 1].CM_Due_Date}
                    </p>
                  )}
                </div>
              </div>

              {taskMessagesArray[taskForms.length - 1] && (
                <div
                  className={`mt-3 p-2 rounded-md text-sm ${taskMessagesArray[taskForms.length - 1].includes('✅')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                >
                  {taskMessagesArray[taskForms.length - 1]}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between pt-4 border-t border-gray-200 gap-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition text-sm font-medium"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition text-sm font-medium"
                >
                  Reset All
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleContinueWithoutSaving}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition text-sm font-medium"
                >
                  Skip to Success
                </button>
                <button
                  type="submit"
                  disabled={(taskLoadingArray || []).some(Boolean)}
                  className="px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-70 text-sm font-medium"
                >
                  {(taskLoadingArray || []).some(Boolean) ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : isEditMode ? (
                    'Update All Tasks & Continue'
                  ) : (
                    'Assign All Tasks & Continue'
                  )}
                </button>
              </div>
            </div>

            {taskGeneralMessage && (
              <div
                className={`p-3 rounded-md text-sm ${taskGeneralMessage.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
              >
                {taskGeneralMessage}
              </div>
            )}
          </form>
        </section>

        {/* Existing Tasks Grid */}
        {taskForms.length > 1 && (
          <section className="mt-6">
            <div className="flex items-center mb-4">
              <div className="w-2 h-7 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md"></div>
              <h3 className="ml-2 text-lg font-bold text-gray-800">
                Existing Tasks <span className="text-sm font-normal text-gray-500 ml-2">({taskForms.length - 1})</span>
              </h3>
            </div>
            <div className="border border-gray-300 rounded-sm overflow-hidden">
              {/* Excel-like Header */}
              <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-300 text-xs font-semibold text-gray-700">
                <div className="p-3 border-r border-gray-300">Task Name</div>
                <div className="p-3 border-r border-gray-300">Milestone</div>
                <div className="p-3 border-r border-gray-300">Engineer</div>
                <div className="p-3 border-r border-gray-300">Dates</div>
                <div className="p-3">Actions</div>
              </div>

              {/* Excel-like Rows */}
              {taskForms.slice(0, -1).map((task, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-5 border-b border-gray-200 last:border-b-0 hover:bg-blue-50/50"
                >

                  {/* Task Name Cell */}
                  <div className="p-3 border-r border-gray-200 text-sm text-black truncate">
                    {task.CM_Task_Name || "—"}
                  </div>

                  {/* Milestone Cell */}
                  <div className="p-3 border-r border-gray-200 text-sm truncate text-blue-600">
                    {getMilestoneName(task.CM_Milestone_ID)}
                  </div>

                  {/* Engineer Cell */}
                  <div className="p-3 border-r border-gray-200 text-sm text-black truncate">
                    {task.CM_Engineer_ID
                      ? engineers.find(e => String(e.CM_User_ID) === String(task.CM_Engineer_ID))
                        ?.CM_Full_Name || "—"
                      : "Leader"}
                  </div>

                  {/* Dates Cell */}
                  <div className="p-3 border-r border-gray-200 text-sm text-gray-500">
                    {_toInputDate(task.CM_Assign_Date)} → {_toInputDate(task.CM_Due_Date)}
                  </div>

                  {/* Actions Cell */}
                  <div className="p-3 flex items-center gap-2">
                    {taskLoadingArray?.[idx] && (
                      <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                        <path d="M4 12a8 8 0 018-8V0" fill="currentColor" opacity="0.75" />
                      </svg>
                    )}

                    <button
                      onClick={() => {
                        const taskToEdit = { ...taskForms[idx] };
                        removeTaskRow(idx);
                        setTaskForms(prev => [...prev.slice(0, -1), taskToEdit]);
                      }}
                      className="text-blue-600 hover:bg-blue-100 p-1.5 rounded"
                      title="Edit"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => removeTaskRow(idx)}
                      className="text-red-600 hover:bg-red-100 p-1.5 rounded"
                      title="Remove"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
