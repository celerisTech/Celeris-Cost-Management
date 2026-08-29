import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2, Activity, CheckCircle2, Settings } from "lucide-react";
import toast from "react-hot-toast";
import VisitStatusMasterPage from "../master/visit-status/page";
import VisitProductsMasterPage from "../master/visit-products/page";

export default function VisitFormModal({
  isOpen,
  onClose,
  selectedVisit,
  preselectedLeadId,
  user,
  onSuccess
}) {
  const [leads, setLeads] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [statusColorsMap, setStatusColorsMap] = useState({});
  const [productOptions, setProductOptions] = useState([]);
  const [productColorsMap, setProductColorsMap] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManageStatusModalOpen, setIsManageStatusModalOpen] = useState(false);
  const [isManageProductModalOpen, setIsManageProductModalOpen] = useState(false);

  const [leadSearchText, setLeadSearchText] = useState("");
  const [showLeadSuggestions, setShowLeadSuggestions] = useState(false);
  const [assignedProducts, setAssignedProducts] = useState([]);

  const [formData, setFormData] = useState({
    CM_Lead_ID: "",
    CM_Sales_Executive_ID: "",
    CM_Visit_Date: new Date().toISOString().split('T')[0],
    CM_Purpose: "",
    CM_Product_Discussed: "",
    CM_Scope_Given: "",
    CM_Demo_Given: "No",
    CM_Proposal_Value: "",
    CM_GST_Type: "Exclusive",
    CM_Scope_Alteration: "",
    CM_Value_Alteration: "",
    CM_Further_Enhancement: "",
    CM_Issues_Raised: "",
    CM_Project_Handed_Over: "No",
    CM_Trial_Version_Given: "No",
    CM_Next_Followup_Date: "",
    CM_Next_Followup_Time: "",
    CM_Visit_Status: "Follow-up Needed",
    CM_Visit_Products: "",
    CM_Remarks: "",
    CM_Images: []
  });

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
      fetchExecutives();
      fetchStatuses();
      fetchProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setLeadSearchText("");
      setShowLeadSuggestions(false);
      return;
    }

    if (selectedVisit) {
      setFormData({ ...selectedVisit });
      const matchingLead = leads.find(l => String(l.CM_Lead_ID) === String(selectedVisit.CM_Lead_ID));
      if (matchingLead) {
        setLeadSearchText(`${matchingLead.CM_Client_Name} - ${matchingLead.CM_Company_Name || "Individual"}`);
      } else {
        setLeadSearchText("");
      }
    } else {
      const initialLeadId = preselectedLeadId || "";
      setFormData({
        CM_Lead_ID: initialLeadId,
        CM_Sales_Executive_ID: (user?.CM_User_ID || user?.id) || "",
        CM_Visit_Date: new Date().toISOString().split('T')[0],
        CM_Purpose: "",
        CM_Product_Discussed: "",
        CM_Scope_Given: "",
        CM_Demo_Given: "No",
        CM_Proposal_Value: "",
        CM_GST_Type: "Exclusive",
        CM_Scope_Alteration: "",
        CM_Value_Alteration: "",
        CM_Further_Enhancement: "",
        CM_Issues_Raised: "",
        CM_Project_Handed_Over: "No",
        CM_Trial_Version_Given: "No",
        CM_Next_Followup_Date: "",
        CM_Next_Followup_Time: "",
        CM_Visit_Status: "Follow-up Needed",
        CM_Visit_Products: "",
        CM_Remarks: "",
        CM_Images: []
      });

      if (initialLeadId && leads.length > 0) {
        const matchingLead = leads.find(l => String(l.CM_Lead_ID) === String(initialLeadId));
        if (matchingLead) {
          setLeadSearchText(`${matchingLead.CM_Client_Name} - ${matchingLead.CM_Company_Name || "Individual"}`);
        }
      } else {
        setLeadSearchText("");
      }
    }
  }, [isOpen, selectedVisit, preselectedLeadId]);

  useEffect(() => {
    if (isOpen && formData.CM_Lead_ID && leads.length > 0 && !leadSearchText) {
      const matchingLead = leads.find(l => String(l.CM_Lead_ID) === String(formData.CM_Lead_ID));
      if (matchingLead) {
        setLeadSearchText(`${matchingLead.CM_Client_Name} - ${matchingLead.CM_Company_Name || "Individual"}`);
      }
    }
  }, [isOpen, formData.CM_Lead_ID, leads, leadSearchText]);

  useEffect(() => {
    if (isOpen && formData.CM_Lead_ID) {
      const fetchLeadProjects = async () => {
        try {
          const res = await fetch(`/api/sales-leads/projects?leadId=${formData.CM_Lead_ID}`);
          const projects = await res.json();
          if (Array.isArray(projects)) {
            const prodNames = projects.map(p => p.CM_Product_Name).filter(Boolean);
            setAssignedProducts(prodNames);
            
            if (!selectedVisit && !formData.CM_Visit_Products && prodNames.length > 0) {
              setFormData(prev => ({
                ...prev,
                CM_Visit_Products: prodNames[0]
              }));
            }
          } else {
            setAssignedProducts([]);
          }
        } catch (error) {
          console.error("Failed to fetch lead projects:", error);
          setAssignedProducts([]);
        }
      };
      fetchLeadProjects();
    } else {
      setAssignedProducts([]);
    }
  }, [formData.CM_Lead_ID, isOpen, selectedVisit]);

  useEffect(() => {
    if (!isOpen || !leadSearchText.trim() || formData.CM_Lead_ID) return;
    const timer = setTimeout(() => {
      fetchLeads(leadSearchText.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [leadSearchText, isOpen, formData.CM_Lead_ID]);

  const fetchLeads = async (searchQuery = "") => {
    try {
      const url = searchQuery
        ? `/api/sales-leads?limit=100&search=${encodeURIComponent(searchQuery)}`
        : "/api/sales-leads?limit=10000";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        if (searchQuery) {
          setLeads(prev => {
            const existingIds = new Set(prev.map(l => l.CM_Lead_ID));
            const newLeads = (data.leads || []).filter(l => !existingIds.has(l.CM_Lead_ID));
            return [...prev, ...newLeads];
          });
        } else {
          setLeads(data.leads || []);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchExecutives = async () => {
    try {
      const res = await fetch("/api/sales-leads?type=executives");
      const data = await res.json();
      if (res.ok) setExecutives(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await fetch("/api/master/visit-status?active=true");
      const data = await res.json();
      if (data.success) {
        setStatusOptions(data.data.map(s => s.Status_Name));
        const colors = {};
        data.data.forEach(s => {
          colors[s.Status_Name] = `bg-${s.Color_Code}-100 text-${s.Color_Code}-700 border-${s.Color_Code}-200`;
        });
        setStatusColorsMap(colors);
      }
    } catch (err) {
      console.error("Failed to fetch visit statuses", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/master/visit-products?active=true");
      const data = await res.json();
      if (data.success) {
        setProductOptions(data.data.map(p => p.Product_Name));
        const colors = {};
        data.data.forEach(p => {
          colors[p.Product_Name] = `bg-${p.Color_Code}-100 text-${p.Color_Code}-700 border-${p.Color_Code}-200`;
        });
        setProductColorsMap(colors);
      }
    } catch (err) {
      console.error("Failed to fetch visit products", err);
    }
  };

  const filteredLeads = useMemo(() => {
    const query = leadSearchText.trim().toLowerCase();
    if (!query) return [];
    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];
    return leads.filter(l => {
      const rawPhone = (l.CM_Phone || "").replace(/\D/g, "");
      const rawAltPhone = (l.CM_Alt_Phone || "").replace(/\D/g, "");
      const searchFields = [
        l.CM_Lead_ID,
        l.CM_Client_Name,
        l.CM_Company_Name,
        l.CM_Phone,
        rawPhone,
        l.CM_Alt_Phone,
        rawAltPhone,
        l.CM_Email,
        l.CM_City,
        l.CM_Address,
        l.CM_Product_Required,
        l.CM_Lead_Source,
        l.CM_Lead_Status,
        l.CM_Followup_Status,
        l.Executive_Name,
        l.CM_Industrial_Name,
        l.CM_Category_Name,
        l.CM_Subcategory_Name,
        l.CM_Remarks
      ].map(val => (val || "").toString().toLowerCase());

      const combinedText = searchFields.join(" ");
      return tokens.every(token => combinedText.includes(token));
    });
  }, [leads, leadSearchText]);

  const selectedProducts = useMemo(() => {
    return formData.CM_Visit_Products
      ? formData.CM_Visit_Products.split(",").map(p => p.trim()).filter(Boolean)
      : [];
  }, [formData.CM_Visit_Products]);

  const handleProductToggle = (productName) => {
    if (!productName) {
      setFormData(prev => ({ ...prev, CM_Visit_Products: "" }));
      return;
    }
    const exists = selectedProducts.includes(productName);
    let updated;
    if (exists) {
      updated = selectedProducts.filter(p => p !== productName);
    } else {
      updated = [...selectedProducts, productName];
    }
    setFormData(prev => ({ ...prev, CM_Visit_Products: updated.join(", ") }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = selectedVisit ? "PUT" : "POST";
      const url = selectedVisit ? `/api/sales-visits?_method=PUT` : "/api/sales-visits";
      const payload = {
        ...formData,
        CM_Created_By: user?.CM_User_ID || user?.name || user?.id,
        CM_Updated_By: user?.CM_User_ID || user?.name || user?.id
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(selectedVisit ? "Visit updated" : "Visit logged");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const error = await res.json();
        toast.error(error.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm text-gray-800">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-800 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-400" />
            {selectedVisit ? "Update Visit Log" : "Log New Client Visit"}
          </h2>
          <button onClick={onClose} className="hover:bg-white/10 p-1.5 rounded-sm transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            
            {/* 1. Select Lead */}
            <div className="space-y-1 relative lg:col-span-2">
              <label className="text-sm font-bold text-gray-700 uppercase">Select Lead *</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="Search lead by name, company, phone, city..."
                  value={leadSearchText}
                  onFocus={() => setShowLeadSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowLeadSuggestions(false), 250)}
                  onChange={(e) => {
                    setLeadSearchText(e.target.value);
                    setShowLeadSuggestions(true);
                    if (formData.CM_Lead_ID) {
                      setFormData(prev => ({ ...prev, CM_Lead_ID: "", CM_Visit_Products: "" }));
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none pr-24 text-sm"
                />
                {formData.CM_Lead_ID && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, CM_Lead_ID: "", CM_Visit_Products: "" }));
                      setLeadSearchText("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-600 hover:text-rose-800 font-extrabold text-[10px] flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-sm border border-rose-200 transition-colors shadow-xs"
                  >
                    <X className="w-3 h-3 text-rose-600" />
                    <span>REMOVE</span>
                  </button>
                )}
              </div>

              {showLeadSuggestions && leadSearchText.trim() !== "" && (
                <div className="absolute z-[70] left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-sm shadow-lg divide-y divide-gray-100">
                  {filteredLeads.length === 0 ? (
                    <div className="p-3 text-xs text-gray-500 italic">No matching leads found</div>
                  ) : (
                    filteredLeads.map((l) => (
                      <button
                        key={l.CM_Lead_ID}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData(prev => ({ ...prev, CM_Lead_ID: l.CM_Lead_ID }));
                          setLeadSearchText(`${l.CM_Client_Name} - ${l.CM_Company_Name || "Individual"}`);
                          setShowLeadSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-xs font-medium flex flex-col gap-0.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-900">{l.CM_Client_Name}</span>
                          {l.CM_Phone && <span className="text-[10px] text-gray-400 font-mono">{l.CM_Phone}</span>}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-500">
                          <span>{l.CM_Company_Name || "Individual"}{l.CM_City ? ` (${l.CM_City})` : ""}</span>
                          {l.CM_Lead_Status && <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 font-medium text-gray-600">{l.CM_Lead_Status}</span>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              <input
                type="hidden"
                name="CM_Lead_ID"
                value={formData.CM_Lead_ID || ""}
                required
              />
            </div>

            {/* 2. Visit Date */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">Visit Date *</label>
              <input
                required
                type="date"
                value={formData.CM_Visit_Date || ""}
                onChange={(e) => setFormData({ ...formData, CM_Visit_Date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            {/* 3. Purpose of Visit */}
            <div className="space-y-1 lg:col-span-2">
              <label className="text-sm font-bold text-gray-700 uppercase">Purpose of Visit *</label>
              <input
                required
                type="text"
                value={formData.CM_Purpose || ""}
                onChange={(e) => setFormData({ ...formData, CM_Purpose: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-sm"
                placeholder="e.g. Site Survey, Product Demo, Negotiation..."
              />
            </div>

            {/* 4. Sales Executive */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">Sales Executive</label>
              <select
                value={formData.CM_Sales_Executive_ID || ""}
                onChange={(e) => setFormData({ ...formData, CM_Sales_Executive_ID: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none text-sm bg-white"
              >
                <option value="">Select Executive</option>
                {executives.map(e => <option key={e.CM_User_ID} value={e.CM_User_ID}>{e.CM_Full_Name}</option>)}
              </select>
            </div>

            {/* 5. Demo Given Toggle */}
            <div className="p-3 bg-gray-50 rounded-sm border border-gray-200 flex items-center justify-between h-[42px] mt-6">
              <span className="text-xs font-bold text-gray-700 uppercase">Demo Given?</span>
              <div className="flex bg-white p-0.5 rounded-sm border border-gray-200 shadow-inner">
                {['Yes', 'No'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, CM_Demo_Given: opt })}
                    className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${
                      formData.CM_Demo_Given === opt ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Visit Status */}
            <div className="space-y-1 lg:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-bold text-gray-700 uppercase">Visit Status</label>
                <button
                  type="button"
                  onClick={() => setIsManageStatusModalOpen(true)}
                  className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 transition-colors bg-indigo-50 px-2 py-0.5 rounded-sm border border-indigo-150"
                >
                  <Settings size={11} /> Manage Options
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {statusOptions.map(s => (
                  <button
                    key={s}
                    type="button"
                    title={s}
                    onClick={() => setFormData({ ...formData, CM_Visit_Status: s })}
                    className={`w-full truncate px-3 py-1.5 rounded-sm text-xs font-bold border transition-all ${
                      formData.CM_Visit_Status === s
                        ? `${statusColorsMap[s] || "bg-blue-100 text-blue-700 border-blue-200"} shadow-xs`
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Visit Product */}
            <div className="space-y-3 lg:col-span-3">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-bold text-gray-700 uppercase">Visit Product</label>
                <button
                  type="button"
                  onClick={() => setIsManageProductModalOpen(true)}
                  className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 transition-colors bg-indigo-50 px-2 py-0.5 rounded-sm border border-indigo-150"
                >
                  <Settings size={11} /> Manage Options
                </button>
              </div>

              {formData.CM_Lead_ID && assignedProducts.length > 0 && (
                <div className="space-y-1 bg-emerald-50/50 p-2.5 rounded-sm border border-emerald-100">
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block mb-1">
                    ★ Assigned to Selected Lead (First Reference)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {assignedProducts.map(p => (
                      <button
                        key={`assigned-${p}`}
                        type="button"
                        title={p}
                        onClick={() => handleProductToggle(p)}
                        className={`w-full truncate px-3 py-1.5 rounded-sm text-xs font-bold border transition-all ${
                          selectedProducts.includes(p)
                            ? `${productColorsMap[p] || "bg-emerald-600 text-white border-emerald-700"} shadow-xs`
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {formData.CM_Lead_ID && assignedProducts.length > 0 && (
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">
                    All Available Products
                  </span>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => handleProductToggle("")}
                    className={`w-full truncate px-3 py-1.5 rounded-sm text-xs font-bold border transition-all ${
                      selectedProducts.length === 0 ? `bg-gray-100 text-gray-700 border-gray-300 shadow-xs` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    None
                  </button>
                  {productOptions.map(p => (
                    <button
                      key={`all-${p}`}
                      type="button"
                      title={p}
                      onClick={() => handleProductToggle(p)}
                      className={`w-full truncate px-3 py-1.5 rounded-sm text-xs font-bold border transition-all ${
                        selectedProducts.includes(p)
                          ? `${productColorsMap[p] || "bg-blue-600 text-white border-blue-700"} shadow-xs`
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 8. Detailed Remarks & Issues */}
            <div className="space-y-1 lg:col-span-2">
              <label className="text-sm font-bold text-gray-700 uppercase">Detailed Remarks & Issues</label>
              <textarea
                rows="4"
                value={formData.CM_Remarks || ""}
                onChange={(e) => setFormData({ ...formData, CM_Remarks: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none resize-none text-sm"
                placeholder="Record what was discussed, any issues raised, scope changes..."
              />
            </div>

            {/* 9. Next Follow-up Stack */}
            <div className="space-y-3 lg:col-span-1">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 uppercase">Next Follow-up Date</label>
                <input
                  type="date"
                  value={formData.CM_Next_Followup_Date || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Next_Followup_Date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 uppercase">Next Follow-up Time</label>
                <input
                  type="time"
                  value={formData.CM_Next_Followup_Time || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Next_Followup_Time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                />
              </div>
            </div>

          </div>

          <div className="py-4 flex gap-3 border-t border-gray-200 mt-6 bg-white sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-sm hover:bg-gray-50 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] px-6 py-2.5 bg-blue-600 text-white font-bold rounded-sm hover:bg-blue-700 shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {selectedVisit ? "Update Log Entry" : "Save Visit Entry"}
            </button>
          </div>
        </form>

        {isManageStatusModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] overflow-y-auto p-4 md:p-8">
            <div className="bg-slate-50 min-h-[80vh] rounded-2xl shadow-2xl relative max-w-5xl mx-auto">
              <div className="pt-2 pb-6">
                <VisitStatusMasterPage onClose={() => { setIsManageStatusModalOpen(false); fetchStatuses(); }} />
              </div>
            </div>
          </div>
        )}

        {isManageProductModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] overflow-y-auto p-4 md:p-8">
            <div className="bg-slate-50 min-h-[80vh] rounded-2xl shadow-2xl relative max-w-5xl mx-auto">
              <div className="pt-2 pb-6">
                <VisitProductsMasterPage onClose={() => { setIsManageProductModalOpen(false); fetchProducts(); }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
