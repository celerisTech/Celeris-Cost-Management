'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Helper function to safely format currency
const formatCurrency = (value) => {
  if (value == null || value === '') return '₹0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `₹${num.toFixed(2)}`;
};

// Helper function to ensure string values (handle null/undefined)
const ensureString = (value) => {
  return value == null ? '' : String(value);
};

export default function Milestones({
  milestones,
  isAddingMilestone,
  setIsAddingMilestone,
  newMilestone,
  handleMilestoneChange,
  handleAddMilestone,
  milestonesLoading,
  isEditingMilestone,
  setIsEditingMilestone,
  editMilestone,
  setEditMilestone,
  handleEditMilestoneChange,
  handleUpdateMilestone,
  getStatusBadge,
  toDateInputValue,
  formatDate,
  selectedProject,
  onDeleteSuccess
}) {
  const { id } = useParams();
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [milestoneData, setMilestoneData] = useState(null);
  const [milestoneLoading, setMilestoneLoading] = useState(false);

  const [alertInfo, setAlertInfo] = useState({ show: false, message: '', type: 'info' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const showLocalAlert = (message, type = 'info') => {
    setAlertInfo({ show: true, message, type });
    setTimeout(() => {
      setAlertInfo(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  const performDeleteMilestone = async (milestoneId) => {
    try {
      const response = await fetch('/api/milestones', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: milestoneId,
          _method: "DELETE",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showLocalAlert(data.error || "Failed to delete milestone", "error");
        return;
      }

      showLocalAlert("Milestone deleted successfully", "success");
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err) {
      console.error("Error deleting milestone:", err);
      showLocalAlert("An error occurred while deleting the milestone", "error");
    }
  };

  const handleDeleteMilestone = (milestoneId) => {
    setDeleteConfirmId(milestoneId);
  };

  useEffect(() => {
    if (!selectedMilestone) return;

    const fetchMilestoneData = async () => {
      setMilestoneLoading(true);
      try {
        const res = await fetch(`/api/milestones/${selectedMilestone}`);
        const json = await res.json();
        if (json.success) setMilestoneData(json.data);
      } catch (e) {
        console.error('Error fetching milestone:', e);
      } finally {
        setMilestoneLoading(false);
      }
    };

    fetchMilestoneData();
  }, [selectedMilestone]);

  const handleMilestoneSelect = (milestoneId) => {
    if (selectedMilestone === milestoneId) {
      setSelectedMilestone(null);
      setMilestoneData(null);
    } else {
      setSelectedMilestone(milestoneId);
    }
  };

  // Helper function for status badge styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Not Started':
        return 'bg-gray-200 text-gray-800';
      case 'On Hold':
        return 'bg-orange-100 text-orange-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
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

      {/* Add Milestone Modal */}
      {isAddingMilestone && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

          {/* Modal Box */}
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-blue-500 text-white">
              <h2 className="text-xl font-semibold">Add New Milestone</h2>

              <button
                onClick={() => setIsAddingMilestone(false)}
                className="text-white hover:text-red-400 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 text-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Milestone Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Milestone Name
                  </label>

                  <input
                    type="text"
                    name="CM_Milestone_Name"
                    value={ensureString(newMilestone?.CM_Milestone_Name)}
                    onChange={handleMilestoneChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                    placeholder="Enter milestone name"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>

                  <textarea
                    name="CM_Description"
                    value={ensureString(newMilestone?.CM_Description)}
                    onChange={handleMilestoneChange}
                    rows="4"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                    placeholder="Describe the milestone"
                  ></textarea>
                </div>

                {/* Planned Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Start Date
                  </label>

                  <input
                    type="date"
                    name="CM_Planned_Start_Date"
                    value={ensureString(newMilestone?.CM_Planned_Start_Date)}
                    onChange={handleMilestoneChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                  />
                </div>

                {/* Planned End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned End Date
                  </label>

                  <input
                    type="date"
                    name="CM_Planned_End_Date"
                    value={ensureString(newMilestone?.CM_Planned_End_Date)}
                    onChange={handleMilestoneChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setIsAddingMilestone(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddMilestone}
                  className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Add Milestone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4/12">
                  Milestone Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-black">
              {milestones.map((milestone) => (
                <React.Fragment key={milestone.CM_Milestone_ID}>
                  <tr
                    className={`hover:bg-gray-50 cursor-pointer ${selectedMilestone === milestone.CM_Milestone_ID ? 'bg-blue-50' : ''}`}
                    onClick={() => !isEditingMilestone && handleMilestoneSelect(milestone.CM_Milestone_ID)}
                  >
                    {/* Milestone Name */}
                    <td className="px-4 py-4">
                      {isEditingMilestone && editMilestone?.CM_Milestone_ID === milestone.CM_Milestone_ID ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            name="CM_Milestone_Name"
                            value={ensureString(editMilestone?.CM_Milestone_Name)}
                            onChange={handleEditMilestoneChange}
                            className="w-full p-1 border rounded text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <textarea
                            name="CM_Description"
                            value={ensureString(editMilestone?.CM_Description)}
                            onChange={handleEditMilestoneChange}
                            className="w-full p-1 border rounded text-sm"
                            placeholder="Description"
                            rows="2"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">
                            {milestone.CM_Milestone_Name}
                          </p>
                          {milestone.CM_Description && (
                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                              {milestone.CM_Description}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Start Date */}
                    <td className="px-4 py-4">
                      {isEditingMilestone && editMilestone?.CM_Milestone_ID === milestone.CM_Milestone_ID ? (
                        <input
                          type="date"
                          name="CM_Planned_Start_Date"
                          value={toDateInputValue(editMilestone?.CM_Planned_Start_Date)}
                          onChange={handleEditMilestoneChange}
                          className="w-full p-1 border rounded text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {formatDate(milestone.CM_Planned_Start_Date)}
                        </div>
                      )}
                    </td>

                    {/* End Date */}
                    <td className="px-4 py-4">
                      {isEditingMilestone && editMilestone?.CM_Milestone_ID === milestone.CM_Milestone_ID ? (
                        <input
                          type="date"
                          name="CM_Planned_End_Date"
                          value={toDateInputValue(editMilestone?.CM_Planned_End_Date)}
                          onChange={handleEditMilestoneChange}
                          className="w-full p-1 border rounded text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {formatDate(milestone.CM_Planned_End_Date)}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                      {isEditingMilestone && editMilestone?.CM_Milestone_ID === milestone.CM_Milestone_ID ? (
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateMilestone();
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditingMilestone(false);
                              setEditMilestone(null);
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMilestone(milestone.CM_Milestone_ID);
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Milestone Details Panel - Shows when milestone is selected */}
                  {selectedMilestone === milestone.CM_Milestone_ID && (
                    <tr>
                      <td colSpan="4" className="p-0">
                        <div className="bg-gray-50 border-t border-b border-gray-200 p-4">
                          {milestoneLoading ? (
                            <div className="flex justify-center items-center p-8 text-gray-600">
                              <Loader2 className="animate-spin mr-2 h-5 w-5" /> Loading milestone details...
                            </div>
                          ) : milestoneData ? (
                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Dates and Progress */}
                              <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                                <h3 className="text-md font-semibold mb-3 text-gray-700">Dates & Progress</h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                  <p>
                                    <span className="inline-block w-20 font-medium">Planned:</span>
                                    {formatDate(milestoneData.CM_Planned_Start_Date)} → {formatDate(milestoneData.CM_Planned_End_Date)}
                                  </p>
                                  <p>
                                    <span className="inline-block w-20 font-medium">Tasks:</span>
                                    {milestoneData.completed_tasks || 0} / {milestoneData.total_tasks || 0}
                                  </p>
                                </div>
                              </div>

                              {/* Cost Summary */}
                              <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                                <h3 className="text-md font-semibold mb-3 text-gray-700">Cost Summary</h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                  <p>
                                    <span className="inline-block w-28 font-medium">Total Labour:</span>
                                    {formatCurrency(milestoneData.total_labor_cost)}
                                  </p>
                                  <p>
                                    <span className="inline-block w-28 font-medium">Total Cost:</span>
                                    {formatCurrency(milestoneData.total_project_cost)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center p-4 text-gray-500">No detailed data available for this milestone.</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
          <div className="mt-4">
            <button
              onClick={() => setIsAddingMilestone(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add First Milestone
            </button>
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
              <p className="text-gray-700 font-medium mb-1">Are you sure you want to delete this milestone?</p>
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
                  performDeleteMilestone(deleteConfirmId);
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

    </div>
  );
}