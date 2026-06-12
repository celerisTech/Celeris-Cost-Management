"use client";
import React from 'react';
import { formatTitleCase, formatSentenceCase } from "../../../utils/textUtils";
import dynamic from "next/dynamic";
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  FolderPlus, 
  FolderOpen, 
  Trash2, 
  Search, 
  Check, 
  Briefcase 
} from "lucide-react";

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
  projectsHistory = [],
  authUser,
  taskForms,
  setTaskForms,
  isEditMode,
  setForm,
  fetchProject,
  refreshProjects
}) => {
  const [activeProjectTab, setActiveProjectTab] = React.useState("add"); // "add" or "list"
  const [localSearch, setLocalSearch] = React.useState("");

  // Dynamically import MapPicker with no SSR
  const MapPicker = dynamic(() => import("./MapPicker"), {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  });

  const clearProjectForm = () => {
    const keysToClear = [
      "CM_Project_Name",
      "CM_Project_Code",
      "CM_Project_Leader_ID",
      "CM_Project_Type",
      "CM_Project_Location",
      "CM_Latitude",
      "CM_Longitude",
      "CM_Radius_Meters",
      "CM_Estimated_Cost",
      "CM_Actual_Cost",
      "CM_Status",
      "CM_Planned_Start_Date",
      "CM_Planned_End_Date",
      "CM_Description",
      "CM_Project_ID"
    ];
    keysToClear.forEach(k => {
      setForm(prev => ({
        ...prev,
        [k]: k === "CM_Radius_Meters" ? 150 : k === "CM_Project_Type" ? "Web Development" : k === "CM_Status" ? "Active" : ""
      }));
    });
    setCreatedProjectId(null);
    setProjectMessage(null);
    setCreatedProjectStartDate(null);
    setCreatedProjectEndDate(null);
  };

  const validateProjectCode = async (code) => {
    if (!code) return true;

    try {
      const existingProject = (projectsHistory || []).find(p =>
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

  const handleMapSelect = (lat, lng, address = null) => {
    setForm(prev => {
      const updates = {
        ...prev,
        CM_Latitude: lat,
        CM_Longitude: lng,
      };

      if (address) {
        updates.CM_Project_Location = address;
      }

      return updates;
    });
  };

  const handleCoordinateChange = (e) => {
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

    handleChange({
      ...e,
      target: {
        ...e.target,
        name,
        value: formattedValue
      }
    });

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
      if (refreshProjects) refreshProjects();
      setTimeout(() => setActiveStep(2), 200);
    } catch (err) {
      console.error("Error with project operation:", err);
      setProjectMessage("❌ Something went wrong during project operation.");
      alert("❌ Something went wrong. Please try again.");
      setSavingProject(false);
    }
  };

  const handleSelectProject = async (proj) => {
    setSavingProject(true);
    try {
      if (fetchProject) {
        await fetchProject(proj.CM_Project_ID);
      }
      setCreatedProjectId(proj.CM_Project_ID);
      setProjectMessage(`✅ Selected project: ${proj.CM_Project_Name}`);
      setActiveProjectTab("add");
    } catch (err) {
      console.error(err);
      setProjectMessage("❌ Failed to select project.");
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/projects?_method=DELETE&projectId=${projectId}`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`❌ Failed to delete project: ${data.error || data.message || "Unknown error"}`);
        return;
      }

      if (createdProjectId === projectId) {
        clearProjectForm();
      }

      if (refreshProjects) refreshProjects();
      setProjectMessage("✅ Project deleted successfully.");
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("❌ Error deleting project.");
    }
  };

  const filteredProjects = (projectsHistory || []).filter(p => {
    const q = localSearch.toLowerCase();
    return (
      (p.CM_Project_Name || "").toLowerCase().includes(q) ||
      (p.CM_Project_Code || "").toLowerCase().includes(q) ||
      (p.CM_Project_ID || "").toString().includes(q) ||
      (p.Project_Leader_Name || "").toLowerCase().includes(q) ||
      (p.CM_Customer_Name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-slate-800">
      {/* Sleek Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveProjectTab("add")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeProjectTab === "add"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <FolderPlus size={16} />
          {createdProjectId ? "Edit Project Details" : "Add Project Details"}
        </button>
        <button
          type="button"
          onClick={() => setActiveProjectTab("list")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeProjectTab === "list"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <FolderOpen size={16} />
          Existing Projects ({(projectsHistory || []).length})
        </button>
      </div>

      {/* Tab Content 1: Add/Edit Project Form */}
      {activeProjectTab === "add" && (
        <form onSubmit={handleProjectSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-red-700 font-medium">{error}</div>
            </div>
          )}

          {/* Customer Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="text-gray-500" size={18} />
                <h3 className="font-semibold text-gray-800 text-sm">Customer Information</h3>
              </div>
              {createdProjectId && (
                <button
                  type="button"
                  onClick={clearProjectForm}
                  className="px-3 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  Clear / Add New
                </button>
              )}
            </div>
            <div className="p-6">
              {savedCustomer || customerFormData.CM_Customer_ID ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500">Linked Customer</label>
                    <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-medium">
                      {savedCustomer?.CM_Customer_Name || customerFormData.CM_Customer_Name}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500">Contact Number</label>
                    <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                      {savedCustomer?.CM_Phone_Number || customerFormData.CM_Phone_Number}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs">
                  ⚠️ No customer linked. Please go back to the Customer tab.
                </div>
              )}
            </div>
          </div>

          {/* Basic Project Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <Layers className="text-gray-500" size={18} />
              <h3 className="font-semibold text-gray-800 text-sm">Basic Specifications</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Project Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Project Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="CM_Project_Name"
                  value={form.CM_Project_Name || ""}
                  onChange={handleProjectInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter project name"
                  required
                />
              </div>

              {/* Project Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Project Code</label>
                <input
                  type="text"
                  name="CM_Project_Code"
                  value={form.CM_Project_Code || ""}
                  onChange={handleProjectInputChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    projectCodeError ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="e.g. PRJ-X1"
                />
                {projectCodeError && (
                  <p className="text-[11px] text-red-600 mt-1">{projectCodeError}</p>
                )}
              </div>

              {/* Project Leader */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Project Leader <span className="text-red-500">*</span></label>
                {loadingEngineers ? (
                  <div className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 flex items-center gap-2">
                    <RefreshCw className="animate-spin" size={14} /> Loading...
                  </div>
                ) : engineersError ? (
                  <div className="px-3 py-2 text-sm border border-red-200 rounded-lg bg-red-50 text-red-700">{engineersError}</div>
                ) : (
                  <select
                    name="CM_Project_Leader_ID"
                    value={form.CM_Project_Leader_ID || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white outline-none transition-all"
                    required
                  >
                    <option value="">Select Project Leader</option>
                    {engineers.map(engineer => (
                      <option key={engineer.CM_User_ID} value={engineer.CM_User_ID}>
                        {engineer.CM_Full_Name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Project Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Project Type <span className="text-red-500">*</span></label>
                <select
                  name="CM_Project_Type"
                  value={form.CM_Project_Type || "Web Development"}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white outline-none transition-all"
                  required
                >
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Application">Mobile Application</option>
                  <option value="Web Application">Web Application</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {/* Project Location String */}
              <div className="col-span-full space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Project Location Site Address</label>
                <input
                  type="text"
                  name="CM_Project_Location"
                  value={form.CM_Project_Location || ""}
                  onChange={handleProjectInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Science Park, Block B"
                />
              </div>
            </div>
          </div>

          {/* Geographic Coordinates and Map */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <MapPin className="text-gray-500" size={18} />
              <h3 className="font-semibold text-gray-800 text-sm">Geographical Location Settings</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-700">Latitude</label>
                  <input
                    type="number"
                    step="0.00000001"
                    name="CM_Latitude"
                    value={form.CM_Latitude || ""}
                    onChange={handleCoordinateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. 11.0168"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-700">Longitude</label>
                  <input
                    type="number"
                    step="0.00000001"
                    name="CM_Longitude"
                    value={form.CM_Longitude || ""}
                    onChange={handleCoordinateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. 76.9558"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-700">Radius Boundary (Meters)</label>
                  <input
                    type="number"
                    name="CM_Radius_Meters"
                    value={form.CM_Radius_Meters ?? 150}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="150"
                  />
                </div>
              </div>

              {/* Map Picker Visual Area */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Map Pin Setter</label>
                <MapPicker
                  lat={form.CM_Latitude ? parseFloat(form.CM_Latitude) : null}
                  lng={form.CM_Longitude ? parseFloat(form.CM_Longitude) : null}
                  radius={form.CM_Radius_Meters ? parseInt(form.CM_Radius_Meters) : 150}
                  onSelect={handleMapSelect}
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <Calendar className="text-gray-500" size={18} />
              <h3 className="font-semibold text-gray-800 text-sm">Project Timeline</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Planned Start Date</label>
                <input
                  type="date"
                  name="CM_Planned_Start_Date"
                  value={form.CM_Planned_Start_Date || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Planned End Date</label>
                <input
                  type="date"
                  name="CM_Planned_End_Date"
                  value={form.CM_Planned_End_Date || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <FileText className="text-gray-500" size={18} />
              <h3 className="font-semibold text-gray-800 text-sm">Project Description & Scope</h3>
            </div>
            <div className="p-6">
              <textarea
                name="CM_Description"
                value={form.CM_Description || ""}
                onChange={handleProjectInputChange}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                placeholder="Scope details, goals, milestones targets, etc."
              />
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {projectMessage && (
                <span
                  className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    projectMessage.includes("✅")
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {projectMessage}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveStep(0)}
                className="px-5 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-lg shadow-sm transition"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-lg shadow-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinueWithoutSaving}
                disabled={!createdProjectId}
                className="px-5 py-2.5 border border-blue-600 text-blue-600 font-semibold text-sm rounded-lg hover:bg-blue-50 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue Without Saving
              </button>
              <button
                type="submit"
                disabled={savingProject}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {savingProject ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Saving...
                  </>
                ) : createdProjectId ? (
                  <>
                    Update Project
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    Save Project & Continue
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab Content 2: Existing Projects */}
      {activeProjectTab === "list" && (
        <div className="space-y-4">
          {/* Filters & Refresh Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Filter projects by Name, Code, Leader or Customer..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            {refreshProjects && (
              <button
                type="button"
                onClick={refreshProjects}
                className="px-3.5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <RefreshCw size={14} />
                Refresh Database
              </button>
            )}
          </div>

          {/* Project Table Grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-12 select-none bg-gray-100/50">#</th>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Project Code</th>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Project Name</th>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Linked Customer</th>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Leader</th>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Type / Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500 bg-white">
                        No projects found in database matching your filter query.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((proj, idx) => {
                      const isSelected = createdProjectId === proj.CM_Project_ID;
                      return (
                        <tr
                          key={proj.CM_Project_ID}
                          onDoubleClick={() => handleSelectProject(proj)}
                          className={`hover:bg-blue-50/30 cursor-pointer transition ${
                            isSelected ? "bg-blue-50/50 font-medium text-blue-900" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          }`}
                        >
                          <td className="px-4 py-3 border-r border-gray-200 bg-gray-50 text-center font-bold text-gray-500 select-none">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-700 font-mono text-xs font-semibold">
                            {proj.CM_Project_Code || proj.CM_Project_ID}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-900 font-semibold">
                            {proj.CM_Project_Name}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-600 text-xs">
                            {proj.CM_Customer_Name || proj.CM_Project_Customer || "—"}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-600 text-xs">
                            👤 {proj.Project_Leader_Name || "—"}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-600 text-xs">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-gray-500">{proj.CM_Project_Type}</span>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] w-max font-semibold ${
                                proj.CM_Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {proj.CM_Status || 'Active'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSelectProject(proj)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold shadow-sm transition flex items-center gap-1 ${
                                  isSelected
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check size={12} />
                                    Selected
                                  </>
                                ) : (
                                  "Select"
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteProject(proj.CM_Project_ID, e)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors"
                                title="Delete Project"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsStep;