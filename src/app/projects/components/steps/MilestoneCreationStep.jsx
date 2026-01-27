// src\app\projects\components\steps\MilestoneCreationStep.jsx

'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatTitleCase, formatSentenceCase } from "../../../utils/textUtils";

const MilestoneCreationStep = ({
    form,
    createdProjectId,
    setActiveStep,
    authUser,
    resetAll,
    projectStartDate,
    projectEndDate,
    fetchMilestonesForProject,
    existingMilestones = [],
    handleStepNavigation
}) => {
    const initialMilestoneState = {
        CM_Milestone_ID: '',
        CM_Project_ID: createdProjectId,
        CM_Milestone_Name: '',
        CM_Description: '',
        CM_Planned_Start_Date: '',
        CM_Planned_End_Date: '',
        CM_Status: 'Not Started',
        CM_Percentage_Weightage: '0',
    };

    // State management similar to task component
    const [milestoneForms, setMilestoneForms] = useState(
        existingMilestones.length ?
            existingMilestones :
            [{ ...initialMilestoneState }]
    );
    const [milestoneErrorsArray, setMilestoneErrorsArray] = useState(
        existingMilestones.length ?
            Array(existingMilestones.length).fill({}) :
            [{}]
    );
    const [milestoneLoadingArray, setMilestoneLoadingArray] = useState(
        existingMilestones.length ?
            Array(existingMilestones.length).fill(false) :
            [false]
    );
    const [milestoneMessagesArray, setMilestoneMessagesArray] = useState(
        existingMilestones.length ?
            Array(existingMilestones.length).fill('') :
            ['']
    );
    const [milestoneGeneralMessage, setMilestoneGeneralMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Add the missing function
    const handleContinueWithoutSaving = () => {
        handleStepNavigation(4); // Navigate to Tasks step
    };

    // Format date helper for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
        try {
            const d = new Date(dateString);
            if (!isNaN(d.getTime())) {
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
            return '';
        } catch (e) {
            return '';
        }
    };

    // Load existing milestones on component mount
    useEffect(() => {
        if (createdProjectId && !existingMilestones.length) {
            loadExistingMilestones();
        }
    }, [createdProjectId]);

    const loadExistingMilestones = async () => {
        if (!createdProjectId) return;

        setIsLoading(true);
        try {
            const response = await axios.get(`/api/milestones?projectId=${createdProjectId}`);

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                // Format dates for display
                const formattedMilestones = response.data.map(m => ({
                    ...m,
                    CM_Planned_Start_Date: formatDate(m.CM_Planned_Start_Date),
                    CM_Planned_End_Date: formatDate(m.CM_Planned_End_Date),
                }));

                setMilestoneForms(formattedMilestones);
                setMilestoneErrorsArray(Array(formattedMilestones.length).fill({}));
                setMilestoneLoadingArray(Array(formattedMilestones.length).fill(false));
                setMilestoneMessagesArray(Array(formattedMilestones.length).fill(''));
            } else {
                // If no existing milestones, initialize with one empty milestone
                setMilestoneForms([{ ...initialMilestoneState }]);
            }
        } catch (error) {
            console.error("Error loading milestones:", error);
            setMilestoneGeneralMessage(`Failed to load existing milestones: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMilestoneFieldChange = (index, e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === "CM_Milestone_Name") {
            formattedValue = formatTitleCase(value);
        } else if (name === "CM_Description") {
            formattedValue = formatSentenceCase(value);
        }

        setMilestoneForms((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [name]: formattedValue };
            return updated;
        });

        // Clear error for this field
        setMilestoneErrorsArray((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [name]: '' };
            return updated;
        });

        // Clear message on change
        setMilestoneMessagesArray((prev) => {
            const updated = [...prev];
            updated[index] = '';
            return updated;
        });

        // Clear general message when user makes changes
        if (milestoneGeneralMessage) {
            setMilestoneGeneralMessage('');
        }
    };

    const validateMilestone = (milestone, index) => {
        const errors = {};

        if (!milestone.CM_Milestone_Name) {
            errors.CM_Milestone_Name = 'Milestone name is required';
        }

        if (!milestone.CM_Planned_Start_Date) {
            errors.CM_Planned_Start_Date = 'Start date is required';
        }

        if (!milestone.CM_Planned_End_Date) {
            errors.CM_Planned_End_Date = 'End date is required';
        }

        // Date validation
        if (milestone.CM_Planned_Start_Date && milestone.CM_Planned_End_Date) {
            const start = new Date(milestone.CM_Planned_Start_Date);
            const end = new Date(milestone.CM_Planned_End_Date);

            if (end < start) {
                errors.CM_Planned_End_Date = 'End date must be after start date';
            }

            // Check if milestone dates are within project dates
            if (projectStartDate) {
                const projStart = new Date(projectStartDate);
                projStart.setHours(0, 0, 0, 0); // normalize to start of day

                const startDate = new Date(start);
                startDate.setHours(0, 0, 0, 0);

                if (startDate < projStart) {
                    errors.CM_Planned_Start_Date = 'Start date cannot be before project start date';
                }
            }

            if (projectEndDate) {
                const projEnd = new Date(projectEndDate);
                projEnd.setHours(23, 59, 59, 999); // include entire end day ✅

                const endDate = new Date(end);
                endDate.setHours(0, 0, 0, 0);

                if (endDate > projEnd) {
                    errors.CM_Planned_End_Date = 'End date cannot be after project end date';
                }
            }
        }

        // Check for overlapping dates with other milestones
        if (milestone.CM_Planned_Start_Date && milestone.CM_Planned_End_Date) {
            const start = new Date(milestone.CM_Planned_Start_Date);
            const end = new Date(milestone.CM_Planned_End_Date);

            milestoneForms.forEach((m, i) => {
                if (i !== index && m.CM_Planned_Start_Date && m.CM_Planned_End_Date) {
                    const otherStart = new Date(m.CM_Planned_Start_Date);
                    const otherEnd = new Date(m.CM_Planned_End_Date);

                    // Check for date overlaps
                    if ((start <= otherEnd && end >= otherStart)) {
                        if (!errors.CM_Planned_Start_Date) {
                            errors.CM_Planned_Start_Date = `Dates overlap with milestone "${m.CM_Milestone_Name}"`;
                        }
                    }
                }
            });
        }

        return errors;
    };

    const addMilestoneRow = () => {
        setMilestoneForms((prev) => [...prev, { ...initialMilestoneState, CM_Project_ID: createdProjectId }]);
        setMilestoneErrorsArray((prev) => [...prev, {}]);
        setMilestoneLoadingArray((prev) => [...prev, false]);
        setMilestoneMessagesArray((prev) => [...prev, '']);
        setMilestoneGeneralMessage(''); // Clear general message when adding new milestone
    };

    const removeMilestoneRow = (index) => {
        setMilestoneForms((prev) => prev.filter((_, i) => i !== index));
        setMilestoneErrorsArray((prev) => prev.filter((_, i) => i !== index));
        setMilestoneLoadingArray((prev) => prev.filter((_, i) => i !== index));
        setMilestoneMessagesArray((prev) => prev.filter((_, i) => i !== index));
        setMilestoneGeneralMessage(''); // Clear general message when removing milestone
    };

    const handleDeleteMilestone = async (index) => {
        const milestone = milestoneForms[index];
        if (!milestone.CM_Milestone_ID) {
            // If it's not saved yet, just remove it
            removeMilestoneRow(index);
            return;
        }

        if (!confirm(`Are you sure you want to delete milestone "${milestone.CM_Milestone_Name}"?\nThis will NOT delete associated tasks, but they will no longer be linked to a milestone.`)) {
            return;
        }

        // Set loading state for this milestone
        setMilestoneLoadingArray((prev) => {
            const updated = [...prev];
            updated[index] = true;
            return updated;
        });

        try {
            const response = await axios.delete(`/api/milestones?milestoneId=${milestone.CM_Milestone_ID}`);

            setMilestoneMessagesArray((prev) => {
                const updated = [...prev];
                updated[index] = '✅ Milestone deleted successfully!';
                return updated;
            });

            // Remove the milestone after a brief delay
            setTimeout(() => {
                removeMilestoneRow(index);

                // Refresh milestones list from the server
                if (fetchMilestonesForProject && typeof fetchMilestonesForProject === 'function') {
                    fetchMilestonesForProject(createdProjectId);
                }
            }, 1000);

        } catch (error) {
            console.error("Error deleting milestone:", error);

            // Show error message
            setMilestoneMessagesArray((prev) => {
                const updated = [...prev];
                updated[index] = `❌ Error: ${error.response?.data?.error || error.message}`;
                return updated;
            });
        } finally {
            // Clear loading state
            setMilestoneLoadingArray((prev) => {
                const updated = [...prev];
                updated[index] = false;
                return updated;
            });
        }
    };

    const saveMilestones = async () => {
        // Validate all milestones
        const validationErrors = milestoneForms.map((m, index) => validateMilestone(m, index));
        setMilestoneErrorsArray(validationErrors);

        // Check if any milestone has errors
        const hasErrors = validationErrors.some(errors => Object.keys(errors).length > 0);
        if (hasErrors) {
            setMilestoneGeneralMessage("❌ Please fix the errors in the highlighted fields before saving.");
            return;
        }

        // Set loading state
        const loadingState = Array(milestoneForms.length).fill(true);
        setMilestoneLoadingArray(loadingState);
        setMilestoneGeneralMessage('Saving milestones...');

        try {
            const results = [];

            // Process each milestone
            for (let i = 0; i < milestoneForms.length; i++) {
                const milestone = { ...milestoneForms[i], CM_Project_ID: createdProjectId };

                // Add creator info
                milestone.CM_Created_By = authUser?.CM_Full_Name || '';
                milestone.CM_Uploaded_By = authUser?.CM_Full_Name || '';

                try {
                    let response;
                    if (milestone.CM_Milestone_ID) {
                        // Update existing milestone
                        response = await axios.post('/api/milestones?_method=PUT', milestone);
                        setMilestoneMessagesArray((prev) => {
                            const updated = [...prev];
                            updated[i] = '✅ Milestone updated successfully!';
                            return updated;
                        });
                    } else {
                        // Create new milestone
                        response = await axios.post('/api/milestones', milestone);

                        // Update the milestone with the new ID
                        if (response.data.CM_Milestone_ID) {
                            setMilestoneForms((prev) => {
                                const updated = [...prev];
                                updated[i] = { ...updated[i], CM_Milestone_ID: response.data.CM_Milestone_ID };
                                return updated;
                            });
                        }
                        setMilestoneMessagesArray((prev) => {
                            const updated = [...prev];
                            updated[i] = '✅ Milestone created successfully!';
                            return updated;
                        });
                    }

                    results.push({ success: true, index: i, data: response.data });
                } catch (error) {
                    console.error(`Error with milestone ${i}:`, error);
                    setMilestoneMessagesArray((prev) => {
                        const updated = [...prev];
                        updated[i] = `❌ Error: ${error.response?.data?.error || error.message}`;
                        return updated;
                    });
                    results.push({ success: false, index: i, error });
                } finally {
                    // Update loading state for this milestone
                    setMilestoneLoadingArray((prev) => {
                        const updated = [...prev];
                        updated[i] = false;
                        return updated;
                    });
                }
            }

            // Refresh milestones list from the server
            if (fetchMilestonesForProject && typeof fetchMilestonesForProject === 'function') {
                await fetchMilestonesForProject(createdProjectId);
            }

            // Set general message based on results
            const successCount = results.filter(r => r.success).length;
            if (successCount === milestoneForms.length) {
                setMilestoneGeneralMessage(`✅ All ${successCount} milestones saved successfully!`);

                // Automatically proceed to the next step
                setTimeout(() => {
                    handleStepNavigation(4); // Navigate to Tasks step
                }, 800);
            } else if (successCount > 0) {
                setMilestoneGeneralMessage(`✅ ${successCount} of ${milestoneForms.length} milestones saved successfully. Please check error messages for details.`);
            } else {
                setMilestoneGeneralMessage('❌ Failed to save any milestones. Please check error messages for details.');
            }

        } catch (error) {
            console.error("General error saving milestones:", error);
            setMilestoneGeneralMessage(`❌ Error: ${error.message}`);
        } finally {
            setMilestoneLoadingArray(Array(milestoneForms.length).fill(false));
        }
    };

    // Get current milestone (last one in array for the form)
    const currentMilestone = milestoneForms[milestoneForms.length - 1];

    return (
        <div className="min-h-full">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Project Milestones</h2>
                <p className="text-sm text-gray-600 mt-1">Define key phases of your project before assigning tasks.</p>
            </div>

            {isLoading ? (
                <div className="py-8 flex justify-center">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <p className="text-gray-600 mt-3">Loading milestones...</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Project Summary Section */}
                    <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center mb-4">
                            <div className="w-2 h-7 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md"></div>
                            <div className="ml-3">
                                <h2 className="text-lg font-bold text-gray-800">Project Summary</h2>
                                <p className="text-xs text-gray-500 mt-1">Timeline information for planning milestones</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Project Name</label>
                                <input
                                    readOnly
                                    value={form?.CM_Project_Name || ''}
                                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 text-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Project Start</label>
                                <input
                                    readOnly
                                    value={formatDate(projectStartDate || form?.CM_Planned_Start_Date)}
                                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 text-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Project End</label>
                                <input
                                    readOnly
                                    value={formatDate(projectEndDate || form?.CM_Plenned_End_Date || form?.CM_Planned_End_Date)}
                                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-gray-50 text-gray-800"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Milestone Entry Form - Sticky Section */}
                    <section className="sticky top-4 z-10 bg-white p-4 rounded-lg border border-gray-200 shadow-md">
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-center">
                                    <div className="w-2 h-7 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md"></div>
                                    <h3 className="ml-2 text-lg font-bold text-gray-800">
                                        Milestone Creation
                                    </h3>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={addMilestoneRow}
                                        className="px-3 py-1.5 bg-green-500 border border-green-500 rounded-md text-white hover:bg-green-600 transition text-sm font-medium flex items-center gap-1"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Milestone
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMilestoneForms([{ ...initialMilestoneState, CM_Project_ID: createdProjectId }]);
                                            setMilestoneErrorsArray([{}]);
                                            setMilestoneMessagesArray(['']);
                                        }}
                                        className="px-3 py-1.5 border border-gray-300 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition text-sm font-medium"
                                    >
                                        Reset Milestones
                                    </button>
                                </div>
                            </div>

                            {/* Current Milestone Entry */}
                            <div className="p-4 rounded-md border border-gray-200 bg-blue-50/30 text-black">
                                <div className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    {currentMilestone?.CM_Milestone_ID
                                        ? `Milestone : ${milestoneForms.length}`
                                        : `New Milestone : ${milestoneForms.length}`}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-full">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Milestone Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="CM_Milestone_Name"
                                            value={currentMilestone?.CM_Milestone_Name || ''}
                                            onChange={(e) => handleMilestoneFieldChange(milestoneForms.length - 1, e)}
                                            placeholder="e.g., Foundation Work, Electrical Installation"
                                            className={`w-full px-3 py-2 text-sm border rounded-md ${milestoneErrorsArray[milestoneForms.length - 1]?.CM_Milestone_Name
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                                }`}
                                        />
                                        {milestoneErrorsArray[milestoneForms.length - 1]?.CM_Milestone_Name && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {milestoneErrorsArray[milestoneForms.length - 1].CM_Milestone_Name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="CM_Planned_Start_Date"
                                            value={formatDate(currentMilestone?.CM_Planned_Start_Date) || ''}
                                            onChange={(e) => handleMilestoneFieldChange(milestoneForms.length - 1, e)}
                                            min={formatDate(projectStartDate || form?.CM_Planned_Start_Date)}
                                            max={formatDate(projectEndDate || form?.CM_Plenned_End_Date || form?.CM_Planned_End_Date)}
                                            className={`w-full px-3 py-2 text-sm border rounded-md ${milestoneErrorsArray[milestoneForms.length - 1]?.CM_Planned_Start_Date
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                                }`}
                                        />
                                        {milestoneErrorsArray[milestoneForms.length - 1]?.CM_Planned_Start_Date && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {milestoneErrorsArray[milestoneForms.length - 1].CM_Planned_Start_Date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="CM_Planned_End_Date"
                                            value={formatDate(currentMilestone?.CM_Planned_End_Date) || ''}
                                            onChange={(e) => handleMilestoneFieldChange(milestoneForms.length - 1, e)}
                                            min={
                                                formatDate(currentMilestone?.CM_Planned_Start_Date) ||
                                                formatDate(projectStartDate || form?.CM_Planned_Start_Date)
                                            }
                                            max={
                                                formatDate(
                                                    projectEndDate ||
                                                    form?.CM_Plenned_End_Date ||
                                                    form?.CM_Planned_End_Date
                                                ) || ''
                                            }
                                            className={`w-full px-3 py-2 text-sm border rounded-md ${milestoneErrorsArray[milestoneForms.length - 1]?.CM_Planned_End_Date
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                                }`}
                                        />
                                        {milestoneErrorsArray[milestoneForms.length - 1]?.CM_Planned_End_Date && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {milestoneErrorsArray[milestoneForms.length - 1].CM_Planned_End_Date}
                                            </p>
                                        )}
                                    </div>

                                    <div className="col-span-full">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            name="CM_Description"
                                            value={currentMilestone?.CM_Description || ''}
                                            onChange={(e) => handleMilestoneFieldChange(milestoneForms.length - 1, e)}
                                            rows="2"
                                            placeholder="Describe this project phase..."
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {milestoneMessagesArray[milestoneForms.length - 1] && (
                                    <div className={`mt-3 p-2 text-sm rounded-md ${milestoneMessagesArray[milestoneForms.length - 1].includes('✅')
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                        {milestoneMessagesArray[milestoneForms.length - 1]}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row justify-between pt-4 border-t border-gray-200 gap-4">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleStepNavigation(2)}
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
                                        Skip to Tasks
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveMilestones}
                                        disabled={milestoneLoadingArray.some(Boolean)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70 transition text-sm font-medium flex items-center"
                                    >
                                        {milestoneLoadingArray.some(Boolean) ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Milestones & Continue'
                                        )}
                                    </button>
                                </div>
                            </div>

                            {milestoneGeneralMessage && (
                                <div className={`p-3 rounded-md text-sm ${milestoneGeneralMessage.includes('✅')
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : milestoneGeneralMessage.includes('❌')
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}>
                                    {milestoneGeneralMessage}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Existing Milestones Grid */}
                    {milestoneForms.length > 1 && (
                        <section className="mt-6">
                            <div className="flex items-center mb-4">
                                <div className="w-2 h-7 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md"></div>
                                <h3 className="ml-2 text-lg font-bold text-gray-800">
                                    Existing Milestones <span className="text-sm font-normal text-gray-500 ml-2">({milestoneForms.length - 1})</span>
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {milestoneForms.slice(0, -1).map((milestone, idx) => (
                                    <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                {milestone.CM_Milestone_ID ? `Milestone ${idx + 1}` : `Milestone #${idx + 1}`}
                                            </div>
                                            <div className="flex gap-1">
                                                {milestoneLoadingArray && milestoneLoadingArray[idx] && (
                                                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                        </svg>
                                                        Processing...
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const milestoneToEdit = { ...milestoneForms[idx] };
                                                        removeMilestoneRow(idx);
                                                        setMilestoneForms((prev) => [...prev.slice(0, -1), milestoneToEdit]);
                                                    }}
                                                    disabled={milestoneLoadingArray && milestoneLoadingArray[idx]}
                                                    className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                                    title="Edit Milestone"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMilestone(idx)}
                                                    disabled={milestoneForms.length === 1 || (milestoneLoadingArray && milestoneLoadingArray[idx])}
                                                    className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                                    title="Delete Milestone"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Milestone Name</label>
                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]" title={milestone.CM_Milestone_Name}>
                                                    {milestone.CM_Milestone_Name || '—'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                                                    <p className="text-sm text-gray-900">{formatDate(milestone.CM_Planned_Start_Date) || '—'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                                                    <p className="text-sm text-gray-900">{formatDate(milestone.CM_Planned_End_Date) || '—'}</p>
                                                </div>
                                            </div>

                                            {milestone.CM_Description && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                                    <p className="text-sm text-gray-700 line-clamp-2" title={milestone.CM_Description}>
                                                        {milestone.CM_Description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {milestoneMessagesArray[idx] && (
                                            <div className={`mt-3 p-2 rounded-md text-xs ${milestoneMessagesArray[idx].includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                {milestoneMessagesArray[idx]}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

export default MilestoneCreationStep;