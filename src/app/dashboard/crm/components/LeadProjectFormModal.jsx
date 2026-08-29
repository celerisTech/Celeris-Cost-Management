import React, { useState, useEffect } from "react";
import { X, Check, Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  "New Lead", "Visited", "Demo Given", "Proposal Sent", "Negotiation", "Converted", "Rejected", "On Hold"
];

export default function LeadProjectFormModal({
  isOpen,
  onClose,
  selectedProject,
  leadId,
  leadName,
  user,
  onSuccess
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    CM_Product_Name: "",
    CM_Amount: "",
    CM_Status: "New Lead",
    CM_Proposal_Doc: ""
  });

  useEffect(() => {
    if (!isOpen) return;

    if (selectedProject) {
      setFormData({
        CM_Product_Name: selectedProject.CM_Product_Name || "",
        CM_Amount: selectedProject.CM_Amount || "",
        CM_Status: selectedProject.CM_Status || "New Lead",
        CM_Proposal_Doc: selectedProject.CM_Proposal_Doc || ""
      });
    } else {
      setFormData({
        CM_Product_Name: "",
        CM_Amount: "",
        CM_Status: "New Lead",
        CM_Proposal_Doc: ""
      });
    }
  }, [isOpen, selectedProject]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload only PDF files");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File size exceeds 5MB limit");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, CM_Proposal_Doc: reader.result }));
      toast.success("Proposal document uploaded successfully");
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.CM_Product_Name.trim()) {
      return toast.error("Product name is required");
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!selectedProject;
      const url = isEdit 
        ? "/api/sales-leads/projects?_method=PUT" 
        : "/api/sales-leads/projects";

      const payload = {
        ...formData,
        CM_Lead_ID: leadId,
        CM_Created_By: user?.CM_User_ID || user?.id,
        CM_Updated_By: user?.CM_User_ID || user?.id,
        ...(isEdit && { CM_Lead_Project_ID: selectedProject.CM_Lead_Project_ID })
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(isEdit ? "Project updated successfully" : "Project added successfully");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-gray-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {selectedProject ? "Edit Lead Project/Product" : "Add Product/Project to Lead"}
          </h2>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Lead Name</label>
            <input
              type="text"
              readOnly
              value={leadName || ""}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 outline-none text-gray-500 text-sm font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Product/Project Name *</label>
            <input
              required
              type="text"
              value={formData.CM_Product_Name}
              onChange={(e) => setFormData({ ...formData, CM_Product_Name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none text-sm transition-all"
              placeholder="e.g. Billing Project, Pay+ Project"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Amount (₹)</label>
              <input
                type="number"
                value={formData.CM_Amount}
                onChange={(e) => setFormData({ ...formData, CM_Amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none text-sm transition-all"
                placeholder="e.g. 250000"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
              <select
                value={formData.CM_Status}
                onChange={(e) => setFormData({ ...formData, CM_Status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none text-sm transition-all"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Proposal Document (PDF)</label>
            <div className="flex items-center gap-3 p-3 border border-dashed border-gray-300 rounded-xl bg-gray-50">
              {formData.CM_Proposal_Doc ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-red-100 text-red-700 rounded-lg font-bold text-xs">PDF</span>
                    <div>
                      <p className="text-xs font-bold text-gray-700">Proposal Document Attached</p>
                      <button
                        type="button"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = formData.CM_Proposal_Doc;
                          link.download = `${formData.CM_Product_Name || 'Project'}_Proposal.pdf`;
                          link.click();
                        }}
                        className="text-[11px] text-blue-600 hover:underline font-semibold"
                      >
                        Download / View Proposal
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, CM_Proposal_Doc: "" }))}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full">
                  <input
                    type="file"
                    accept=".pdf"
                    id="modal-proposal-upload"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="modal-proposal-upload"
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer font-bold text-xs transition-colors"
                  >
                    <Plus className="h-4 w-4 text-gray-500" />
                    Upload Proposal PDF
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {selectedProject ? "Update Project" : "Save Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
