"use client";
import React from 'react';
import { formatTitleCase, formatSentenceCase } from "../../../utils/textUtils";
import dynamic from "next/dynamic";

const ProjectDetailsStep = ({
  form,
  handleChange,
  handleCancel,
  error,
  savedCustomer,
  customerFormData,
  setActiveStep,
  savingProject,
  setSavingProject,
  projectMessage,
  setProjectMessage,
  createdProjectId,
  setCreatedProjectId,
  setCreatedProjectStartDate,
  setCreatedProjectEndDate,
  engineers,
  loadingEngineers,
  engineersError,
  projectCodeError,
  setProjectCodeError,
  projectsHistory,
  authUser,
  taskForms,
  setTaskForms,
  isEditMode,
  setForm
}) => {
  // Dynamically import MapPicker with no SSR
  const MapPicker = dynamic(() => import("./MapPicker"), {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  });

  const validateProjectCode = async (code) => {
    if (!code) return true;

    try {
      const existingProject = projectsHistory.find(p =>
        p.CM_Project_Code === code &&
        (!createdProjectId || p.CM_Project_ID !== createdProjectId)
      );

      if (existingProject) {
        setProjectCodeError("This Project Code already exists. Please use a different code.");
        return false;
      }

      setProjectCodeError("");
      return true;
    } catch (err) {
      console.error("Error validating project code:", err);
      setProjectCodeError("Could not validate project code");
      return false;
    }
  };

  const handleContinueWithoutSaving = () => {
    if (!savedCustomer && !customerFormData.CM_Customer_ID) {
      alert("Please complete customer details first.");
      setActiveStep(0);
      return;
    }
    setActiveStep(2);
  };

  // Handle map selection - properly update both latitude and longitude
  const handleMapSelect = (lat, lng, address = null) => {
    setForm(prev => {
      const updates = {
        ...prev,
        CM_Latitude: lat,
        CM_Longitude: lng,
      };

      // Only update location text if an address is returned from search
      // and the field is empty or user wants to overwrite (we'll just overwrite for now as it's a direct action)
      if (address) {
        updates.CM_Project_Location = address;
      }

      return updates;
    });
  };




  // Handle coordinate input changes
  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    handleChange(e);
  };

  const handleProjectInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (["CM_Project_Name", "CM_Project_Location"].includes(name)) {
      formattedValue = formatTitleCase(value);
    } else if (name === "CM_Description") {
      formattedValue = formatSentenceCase(value);
    } else if (name === "CM_Project_Code") {
      formattedValue = value.toUpperCase();
    }

    // Call parent handleChange with formatted value
    // Create a synthetic event-like object to pass to handleChange
    // Assuming handleChange expects { target: { name, value } }
    handleChange({
      ...e,
      target: {
        ...e.target,
        name,
        value: formattedValue
      }
    });

    // Also validate project code if needed
    if (name === "CM_Project_Code") {
      validateProjectCode(formattedValue);
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();

    const isCodeValid = await validateProjectCode(form.CM_Project_Code);
    if (!isCodeValid) {
      alert("Please fix the Project Code issue before continuing.");
      return;
    }

    const cmCustomerId = savedCustomer?.CM_Customer_ID || customerFormData.CM_Customer_ID;
    if (!cmCustomerId) {
      alert("Please create or select a customer first.");
      setActiveStep(0);
      return;
    }

    const requiredFields = ["CM_Project_Name", "CM_Project_Leader_ID"];
    const missing = requiredFields.filter((f) => {
      const v = form[f] ?? "";
      return !v || (typeof v === "string" && v.trim() === "");
    });

    if (missing.length > 0) {
      alert("Please fill required project fields: " + missing.join(", "));
      return;
    }

    setSavingProject(true);
    setProjectMessage(null);

    // Ensure coordinates are properly formatted
    const latitude = form.CM_Latitude ? parseFloat(form.CM_Latitude) : null;
    const longitude = form.CM_Longitude ? parseFloat(form.CM_Longitude) : null;

    const payload = {
      CM_Project_Name: form.CM_Project_Name || null,
      CM_Project_Code: form.CM_Project_Code || null,
      CM_Company_ID: form.CM_Company_ID || authUser?.company?.CM_Company_ID || authUser?.CM_Company_ID || null,
      CM_Customer_ID: cmCustomerId,
      CM_Project_Type: form.CM_Project_Type || "Web Development",
      CM_Description: form.CM_Description || null,
      CM_Project_Location: form.CM_Project_Location || null,
      CM_Latitude: !isNaN(latitude) ? latitude : null,
      CM_Longitude: !isNaN(longitude) ? longitude : null,
      CM_Radius_Meters: form.CM_Radius_Meters ?? 150,
      CM_Estimated_Cost: form.CM_Estimated_Cost || null,
      CM_Actual_Cost: form.CM_Actual_Cost || null,
      CM_Status: form.CM_Status || "Active",
      CM_Planned_Start_Date: form.CM_Planned_Start_Date || null,
      CM_Planned_End_Date: form.CM_Planned_End_Date || null,
      CM_Project_Leader_ID: form.CM_Project_Leader_ID || null,
      CM_Created_By: authUser?.CM_Full_Name || "Admin",
      CM_Uploaded_By: authUser?.CM_Full_Name || "Admin",
    };

    if (createdProjectId) {
      payload.CM_Project_ID = createdProjectId;
    }

    try {
      const method = "POST";
      const url = createdProjectId ? "/api/projects?_method=PUT" : "/api/projects";
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || `Failed to ${createdProjectId ? 'update' : 'create'} project`;
        setProjectMessage("❌ " + msg);
        alert(`❌ Failed to save project. ${msg}`);
        setSavingProject(false);
        return;
      }

      const projectId = createdProjectId || data?.CM_Project_ID || data?.insertedId || data?.insertId;
      setCreatedProjectId(projectId);
      setProjectMessage(`✅ Project ${createdProjectId ? 'updated' : 'created'} successfully!`);

      const startDate = payload.CM_Planned_Start_Date;
      const endDate = payload.CM_Planned_End_Date;
      setCreatedProjectStartDate(startDate);
      setCreatedProjectEndDate(endDate);
      handleChange({ target: { name: "CM_Project_ID", value: projectId } });

      setTaskForms((prev) =>
        prev.map((t) => ({
          ...t,
          CM_Project_ID: projectId,
          CM_Company_ID: payload.CM_Company_ID,
          CM_Created_By: authUser?.CM_Full_Name,
          CM_Uploaded_By: authUser?.CM_Full_Name,
        }))
      );

      setSavingProject(false);
      setTimeout(() => setActiveStep(2), 200);
    } catch (err) {
      console.error("Error with project operation:", err);
      setProjectMessage("❌ Something went wrong during project operation.");
      alert("❌ Something went wrong. Please try again.");
      setSavingProject(false);
    }
  };

  return (
    <div className="min-h-full text-black">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isEditMode ? "Edit Project" : "Create New Project"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isEditMode
                ? "Update project details and specifications"
                : "Define project scope, timeline, and requirements"}
            </p>
          </div>
          {isEditMode && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Edit Mode
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleProjectSubmit} className="space-y-8">
        {/* Customer Information Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                <p className="text-sm text-gray-500 mt-1">Linked customer details for this project</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {savedCustomer || customerFormData.CM_Customer_ID ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <div className="flex items-center px-4 py-3 rounded-lg border border-gray-200 bg-gray-50">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-900 font-medium">
                      {savedCustomer?.CM_Customer_Name || customerFormData.CM_Customer_Name}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="flex items-center px-4 py-3 rounded-lg border border-gray-200 bg-gray-50">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-900">
                      {savedCustomer?.CM_Phone_Number || customerFormData.CM_Phone_Number}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Customer Required</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please add or select a customer first to proceed with project creation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Basic Information Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <p className="text-sm text-gray-500 mt-1">Core project details and specifications</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Project Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  name="CM_Project_Name"
                  onChange={handleProjectInputChange}
                  value={form.CM_Project_Name || ""}
                  required
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Project Code
                </label>
                <input
                  name="CM_Project_Code"
                  onChange={handleProjectInputChange}
                  value={form.CM_Project_Code || ""}
                  className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${projectCodeError ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                  placeholder="e.g., PRJ-2024-001"
                />
                {projectCodeError && (
                  <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {projectCodeError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Project Leader <span className="text-red-500 ml-1">*</span>
                </label>
                {loadingEngineers ? (
                  <div className="flex items-center px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
                    <svg className="animate-spin h-4 w-4 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Loading engineers...
                  </div>
                ) : engineersError ? (
                  <div className="flex items-center px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {engineersError}
                  </div>
                ) : (
                  <select
                    name="CM_Project_Leader_ID"
                    onChange={handleChange}
                    value={form.CM_Project_Leader_ID || ""}
                    required
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Select a Project Leader</option>
                    {engineers.map((engineer) => (
                      <option key={engineer.CM_User_ID} value={engineer.CM_User_ID}>
                        {engineer.CM_Full_Name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Project Type <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="CM_Project_Type"
                  onChange={handleChange}
                  value={form.CM_Project_Type || "Web Development"}
                  required
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Application">Mobile Application</option>
                  <option value="Web Application">Web Application</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Project Location
                </label>
                <input
                  name="CM_Project_Location"
                  onChange={handleProjectInputChange}
                  value={form.CM_Project_Location || ""}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Project site location"
                />
              </div>
            </div>

            {/* Location Coordinates and Map */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                <h4 className="text-base font-semibold text-gray-900">Geographic Location</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Latitude</label>
                  <input
                    name="CM_Latitude"
                    onChange={handleCoordinateChange}
                    value={form.CM_Latitude || ""}
                    type="number"
                    step="0.00000001"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="e.g., 11.0168"
                  />
                  {form.CM_Latitude && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Latitude set: {form.CM_Latitude}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Longitude</label>
                  <input
                    name="CM_Longitude"
                    onChange={handleCoordinateChange}
                    value={form.CM_Longitude || ""}
                    type="number"
                    step="0.00000001"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="e.g., 76.9558"
                  />
                  {form.CM_Longitude && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Longitude set: {form.CM_Longitude}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Radius (Meters)</label>
                  <input
                    name="CM_Radius_Meters"
                    onChange={handleChange}
                    type="number"
                    value={form.CM_Radius_Meters ?? 150}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Radius in meters"
                  />
                </div>
              </div>

              {/* Map Picker */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Select Location on Map</label>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-700 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    Debug coordinates: Latitude={form.CM_Latitude || 'null'}, Longitude={form.CM_Longitude || 'null'}
                  </div>
                </div>
                <MapPicker
                  lat={form.CM_Latitude ? parseFloat(form.CM_Latitude) : null}
                  lng={form.CM_Longitude ? parseFloat(form.CM_Longitude) : null}
                  radius={form.CM_Radius_Meters ? parseInt(form.CM_Radius_Meters) : 150}
                  onSelect={handleMapSelect}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Project Timeline Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Project Timeline</h3>
                <p className="text-sm text-gray-500 mt-1">Schedule and important dates</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Planned Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="CM_Planned_Start_Date"
                    onChange={handleChange}
                    value={form.CM_Planned_Start_Date || ""}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Planned End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="CM_Planned_End_Date"
                    onChange={handleChange}
                    value={form.CM_Planned_End_Date || ""}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Description Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Project Description</h3>
                <p className="text-sm text-gray-500 mt-1">Detailed project overview and objectives</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <textarea
              name="CM_Description"
              onChange={handleProjectInputChange}
              value={form.CM_Description || ""}
              rows={4}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              placeholder="Detailed project description including scope, objectives, key requirements, and any special notes..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveStep(0)}
                className="px-5 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Previous
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleContinueWithoutSaving}
                disabled={!createdProjectId}
                className="px-5 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue Without Saving
              </button>
              <button
                type="submit"
                disabled={savingProject}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow"
              >
                {savingProject ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Saving...
                  </>
                ) : createdProjectId ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Project & Continue
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Project & Continue
                  </>
                )}
              </button>
            </div>
          </div>

          {projectMessage && (
            <div className={`mt-4 p-4 rounded-xl border ${projectMessage.includes("✅")
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
              }`}>
              <div className="flex items-start gap-3">
                {projectMessage.includes("✅") ? (
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="text-sm">{projectMessage}</div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProjectDetailsStep;