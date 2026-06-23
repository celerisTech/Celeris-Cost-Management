"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const COLORS = [
  { name: "Blue", value: "blue" },
  { name: "Emerald", value: "emerald" },
  { name: "Red", value: "red" },
  { name: "Amber", value: "amber" },
  { name: "Indigo", value: "indigo" },
  { name: "Purple", value: "purple" },
  { name: "Pink", value: "pink" },
  { name: "Teal", value: "teal" },
  { name: "Cyan", value: "cyan" },
  { name: "Fuchsia", value: "fuchsia" },
  { name: "Slate", value: "slate" },
];

export default function VisitStatusMasterPage({ onClose }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    Status_ID: null,
    Status_Name: "",
    Color_Code: "blue",
    Is_Active: 1,
    cascadeUpdate: false
  });

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master/visit-status");
      const data = await res.json();
      if (data.success) {
        setStatuses(data.data);
      } else {
        toast.error("Failed to load statuses");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Status_Name.trim()) {
      toast.error("Status Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!formData.Status_ID;
      const res = await fetch("/api/master/visit-status", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Status ${isEdit ? "updated" : "created"} successfully`);
        setIsModalOpen(false);
        fetchStatuses();
      } else {
        toast.error(data.error || "Failed to save status");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the status "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/master/visit-status?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Status deleted successfully");
        fetchStatuses();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    }
  };

  const openModal = (status = null) => {
    if (status) {
      setFormData({
        Status_ID: status.Status_ID,
        Status_Name: status.Status_Name,
        Color_Code: status.Color_Code || "blue",
        Is_Active: status.Is_Active,
        cascadeUpdate: false
      });
    } else {
      setFormData({
        Status_ID: null,
        Status_Name: "",
        Color_Code: "blue",
        Is_Active: 1,
        cascadeUpdate: false
      });
    }
    setIsModalOpen(true);
  };

  const getBadgeClass = (color) => {
    return `bg-${color}-100 text-${color}-700 border-${color}-200 border px-3 py-1 rounded-full text-xs font-bold`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Visit Status Master</h1>
          <p className="text-sm text-slate-500 mt-1">Manage the dropdown options for Visit Statuses</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchStatuses}
            className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium text-sm"
          >
            <Plus size={18} /> Add Status
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm font-bold text-sm ml-2"
            >
              Close & Return
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status Name</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Badge Preview</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading statuses...
                  </td>
                </tr>
              ) : statuses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No statuses found. Click "Add Status" to create one.
                  </td>
                </tr>
              ) : (
                statuses.map((status) => (
                  <tr key={status.Status_ID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">#{status.Status_ID}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{status.Status_Name}</td>
                    <td className="px-6 py-4">
                      <span className={getBadgeClass(status.Color_Code)}>{status.Status_Name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${status.Is_Active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {status.Is_Active ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {status.Is_Active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(status)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(status.Status_ID, status.Status_Name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {formData.Status_ID ? "Edit Visit Status" : "Create Visit Status"}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status Name *</label>
                <input
                  type="text"
                  required
                  value={formData.Status_Name}
                  onChange={(e) => setFormData({ ...formData, Status_Name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  placeholder="e.g. Needs Follow-up"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Badge Color</label>
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, Color_Code: color.value })}
                      title={color.name}
                      className={`h-8 rounded-lg border flex items-center justify-center transition-all ${
                        formData.Color_Code === color.value 
                          ? `bg-${color.value}-100 border-${color.value}-400 ring-2 ring-${color.value}-500/20` 
                          : `bg-${color.value}-50 border-${color.value}-200 hover:bg-${color.value}-100`
                      }`}
                    >
                      {formData.Color_Code === color.value && <CheckCircle2 size={14} className={`text-${color.value}-600`} />}
                    </button>
                  ))}
                </div>
                <div className="pt-3 flex items-center gap-3">
                  <span className="text-xs text-slate-500">Preview:</span>
                  <span className={getBadgeClass(formData.Color_Code)}>{formData.Status_Name || "Status Preview"}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.Is_Active === 1}
                      onChange={(e) => setFormData({ ...formData, Is_Active: e.target.checked ? 1 : 0 })}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.Is_Active ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.Is_Active ? "transform translate-x-4" : ""}`}></div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-700">Active Status</div>
                    <div className="text-xs text-slate-500">Available to select in dropdowns</div>
                  </div>
                </label>
              </div>

              {formData.Status_ID && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-3 cursor-pointer p-3 border border-amber-100 bg-amber-50/50 rounded-xl hover:bg-amber-50 transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                      checked={formData.cascadeUpdate}
                      onChange={(e) => setFormData({ ...formData, cascadeUpdate: e.target.checked })}
                    />
                    <div>
                      <div className="text-sm font-bold text-amber-800">Update Existing Records</div>
                      <div className="text-xs text-amber-600">Update past visits that used this status name</div>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-slate-600 font-bold bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] flex justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
