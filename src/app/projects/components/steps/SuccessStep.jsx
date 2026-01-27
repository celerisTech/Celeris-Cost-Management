// src\app\projects\components\steps\SuccessStep.jsx

import React from 'react';

const SuccessStep = ({
  isEditMode,
  createdProjectId,
  form,
  savedCustomer,
  customerFormData,
  tasksHistory,
  engineers,
  milestones,
  resetAll,
  handleCancel,
  setActiveStep,
  onSuccess,
  handleStepNavigation
}) => {
  const getProjectLeaderName = () => {
    const leaderId = form.CM_Project_Leader_ID;
    if (!leaderId) return "—";
    const found = engineers.find((e) => String(e.CM_User_ID) === String(leaderId));
    return found ? found.CM_Full_Name : leaderId;
  };

  const getMilestoneName = (milestoneId) => {
    if (!milestoneId) return '—';
    const found = (milestones || []).find(m => m.CM_Milestone_ID === milestoneId);
    return found ? found.CM_Milestone_Name : milestoneId;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="bg-green-50 border border-green-200 rounded-full p-6 mb-6">
        <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
        </svg>
      </div>

      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
        {isEditMode ? "Project Updated Successfully!" : "Project Created Successfully!"}
      </h3>

      <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
        {isEditMode
          ? "Your project and associated tasks have been updated successfully."
          : "Your project has been created and is ready for execution. Review the details below."
        }
      </p>

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Project Summary */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
            Project Summary
          </h4>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Project Name:</span>
              <span className="font-medium text-gray-900">{form.CM_Project_Name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Project Type:</span>
              <span className="font-medium text-gray-900">{form.CM_Project_Type || "Kilo Watts"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Project Leader:</span>
              <span className="font-medium text-gray-900">{getProjectLeaderName() || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium text-gray-900">{savedCustomer?.CM_Customer_Name || customerFormData.CM_Customer_Name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Timeline:</span>
              <span className="font-medium text-gray-900">
                {formatDate(form.CM_Planned_Start_Date)} to {formatDate(form.CM_Planned_End_Date || form.CM_Plenned_End_Date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-gray-900">{form.CM_Status || "Active"}</span>
            </div>
          </div>
        </div>

        {/* Associated Tasks */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
            Associated Tasks
            <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {tasksHistory?.length || 0}
            </span>
          </h4>

          {tasksHistory && tasksHistory.length > 0 ? (
            <div className="max-h-48 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milestone</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tasksHistory.map((task, i) => (
                    <tr key={task.CM_Task_ID || i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-900">
                        <div className="font-medium">{task.CM_Task_Name || "Unnamed Task"}</div>
                        <div className="text-xs text-gray-500">
                          {task.Engineer_Name || "Not assigned"}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {getMilestoneName(task.CM_Milestone_ID)}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {formatDate(task.CM_Due_Date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-gray-500 italic">No tasks found for this project</p>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => handleStepNavigation(4)}
              className="text-blue-600 text-sm hover:underline font-medium"
            >
              {tasksHistory && tasksHistory.length > 0 ? "Manage Tasks" : "Add Tasks"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Navigation Buttons */}
      <div className="w-full max-w-2xl mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Quick Actions</h4>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => handleStepNavigation(0)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Edit Customer
          </button>
          <button
            onClick={() => handleStepNavigation(1)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Edit Project
          </button>
          <button
            onClick={() => handleStepNavigation(2)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Edit Cost
          </button>
          <button
            onClick={() => handleStepNavigation(3)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Edit Milestones
          </button>
          <button
            onClick={() => handleStepNavigation(4)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Edit Tasks
          </button>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <button
          onClick={resetAll}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Another Project
        </button>
        <button
          onClick={handleCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SuccessStep;