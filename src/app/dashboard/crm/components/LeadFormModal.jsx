import React, { useState, useEffect } from "react";
import { X, Edit2, Trash2, Plus, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const SOURCE_OPTIONS = ["Walk-in", "Reference", "Social Media", "Cold Call", "Website", "Other"];
const STATUS_OPTIONS = [
  "New Lead", "Follow-up Call", "Visited", "Demo Given", "Proposal Sent",
  "Follow Up", "Converted", "Not Interested"
];

export default function LeadFormModal({
  isOpen,
  onClose,
  selectedLead,
  user,
  onSuccess
}) {
  const [executives, setExecutives] = useState([]);
  const [industrials, setIndustrials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [isAddingIndustrial, setIsAddingIndustrial] = useState(false);
  const [isEditingIndustrial, setIsEditingIndustrial] = useState(false);
  const [industrialInput, setIndustrialInput] = useState("");

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");

  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [isEditingSubcategory, setIsEditingSubcategory] = useState(false);
  const [subcategoryInput, setSubcategoryInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    CM_Client_Name: "",
    CM_Company_Name: "",
    CM_Industrial_ID: "",
    CM_Category_ID: "",
    CM_Subcategory_ID: "",
    CM_Phone: "",
    CM_Alt_Phone: "",
    CM_Email: "",
    CM_City: "",
    CM_Address: "",
    CM_Lead_Source: "Cold Call",
    CM_Product_Required: "",
    CM_Expected_Budget: "",
    CM_Sales_Executive_ID: "",
    CM_Lead_Status: "New Lead",
    CM_Followup_Status: "Follow Up",
    CM_Next_Follow_Up_Date: "",
    CM_Next_Follow_Up_Time: "",
    CM_Remarks: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchExecutives();
      fetchIndustrials();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (selectedLead) {
        setFormData({ ...selectedLead });
        if (selectedLead.CM_Industrial_ID) {
          fetchCategories(selectedLead.CM_Industrial_ID);
        }
        if (selectedLead.CM_Category_ID) {
          fetchSubcategories(selectedLead.CM_Category_ID);
        }
      } else {
        setFormData({
          CM_Client_Name: "",
          CM_Company_Name: "",
          CM_Industrial_ID: "",
          CM_Category_ID: "",
          CM_Subcategory_ID: "",
          CM_Phone: "",
          CM_Alt_Phone: "",
          CM_Email: "",
          CM_City: "",
          CM_Address: "",
          CM_Lead_Source: "Cold Call",
          CM_Product_Required: "",
          CM_Expected_Budget: "",
          CM_Sales_Executive_ID: (user?.CM_User_ID || user?.id) || "",
          CM_Lead_Status: "New Lead",
          CM_Followup_Status: "Follow Up",
          CM_Next_Follow_Up_Date: "",
          CM_Next_Follow_Up_Time: "",
          CM_Remarks: ""
        });
        setCategories([]);
        setSubcategories([]);
      }
    }
  }, [isOpen, selectedLead]);

  const fetchExecutives = async () => {
    try {
      const res = await fetch("/api/sales-leads?type=executives");
      const data = await res.json();
      if (res.ok) setExecutives(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchIndustrials = async () => {
    try {
      const res = await fetch("/api/sales-industrial?type=industrials");
      const data = await res.json();
      if (res.ok) setIndustrials(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategories = async (industrialId) => {
    if (!industrialId) return;
    try {
      const res = await fetch(`/api/sales-industrial?type=categories&industrialId=${industrialId}`);
      const data = await res.json();
      if (res.ok) setCategories(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    if (!categoryId) return;
    try {
      const res = await fetch(`/api/sales-industrial?type=subcategories&categoryId=${categoryId}`);
      const data = await res.json();
      if (res.ok) setSubcategories(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleManageIndustrial = async (action, id = null) => {
    if (!industrialInput.trim() && action !== 'DELETE') return toast.error("Industrial name required");
    try {
      const url = id ? `/api/sales-industrial?_method=${action}` : '/api/sales-industrial';
      const payload = { entity: 'industrial', CM_Industrial_Name: industrialInput, CM_Created_By: user?.CM_User_ID || user?.id, CM_Updated_By: user?.CM_User_ID || user?.id, ...(id && { CM_Industrial_ID: id }) };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(`Industrial ${action === 'DELETE' ? 'deleted' : action === 'PUT' ? 'updated' : 'added'}`);
        setIndustrialInput(""); setIsAddingIndustrial(false); setIsEditingIndustrial(false);
        fetchIndustrials();
        if (action === 'DELETE') { setFormData(prev => ({ ...prev, CM_Industrial_ID: "", CM_Category_ID: "", CM_Subcategory_ID: "" })); setCategories([]); setSubcategories([]); }
      } else { toast.error((await res.json()).error || "Operation failed"); }
    } catch (error) { toast.error("An error occurred"); }
  };

  const handleManageCategory = async (action, id = null) => {
    if (!formData.CM_Industrial_ID && action !== 'DELETE') return toast.error("Select an Industrial first");
    if (!categoryInput.trim() && action !== 'DELETE') return toast.error("Category name required");
    try {
      const url = id ? `/api/sales-industrial?_method=${action}` : '/api/sales-industrial';
      const payload = { entity: 'category', CM_Category_Name: categoryInput, CM_Industrial_ID: formData.CM_Industrial_ID, CM_Created_By: user?.CM_User_ID || user?.id, CM_Updated_By: user?.CM_User_ID || user?.id, ...(id && { CM_Category_ID: id }) };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(`Category ${action === 'DELETE' ? 'deleted' : action === 'PUT' ? 'updated' : 'added'}`);
        setCategoryInput(""); setIsAddingCategory(false); setIsEditingCategory(false);
        fetchCategories(formData.CM_Industrial_ID);
        if (action === 'DELETE') { setFormData(prev => ({ ...prev, CM_Category_ID: "", CM_Subcategory_ID: "" })); setSubcategories([]); }
      } else { toast.error((await res.json()).error || "Operation failed"); }
    } catch (error) { toast.error("An error occurred"); }
  };

  const handleManageSubcategory = async (action, id = null) => {
    if (!formData.CM_Category_ID && action !== 'DELETE') return toast.error("Select a Category first");
    if (!subcategoryInput.trim() && action !== 'DELETE') return toast.error("Subcategory name required");
    try {
      const url = id ? `/api/sales-industrial?_method=${action}` : '/api/sales-industrial';
      const payload = { entity: 'subcategory', CM_Subcategory_Name: subcategoryInput, CM_Category_ID: formData.CM_Category_ID, CM_Created_By: user?.CM_User_ID || user?.id, CM_Updated_By: user?.CM_User_ID || user?.id, ...(id && { CM_Subcategory_ID: id }) };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success(`Subcategory ${action === 'DELETE' ? 'deleted' : action === 'PUT' ? 'updated' : 'added'}`);
        setSubcategoryInput(""); setIsAddingSubcategory(false); setIsEditingSubcategory(false);
        fetchSubcategories(formData.CM_Category_ID);
        if (action === 'DELETE') { setFormData(prev => ({ ...prev, CM_Subcategory_ID: "" })); }
      } else { toast.error((await res.json()).error || "Operation failed"); }
    } catch (error) { toast.error("An error occurred"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = selectedLead ? "PUT" : "POST";
      const url = selectedLead ? `/api/sales-leads?_method=PUT` : "/api/sales-leads";
      const payload = {
        ...formData,
        CM_Created_By: user?.CM_User_ID || user?.id,
        CM_Updated_By: user?.CM_User_ID || user?.id
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(selectedLead ? "Lead updated successfully" : "Lead created successfully");
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col text-gray-800 ">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-500 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {selectedLead ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {selectedLead ? "Edit Lead" : "Add New Lead"}
          </h2>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-lg transition-colors"><X className="h-6 w-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Client Name *</label>
              <input
                required
                type="text"
                value={formData.CM_Client_Name || ""}
                onChange={(e) => setFormData({ ...formData, CM_Client_Name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Company Name</label>
              <input
                type="text"
                value={formData.CM_Company_Name || ""}
                onChange={(e) => setFormData({ ...formData, CM_Company_Name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex justify-between items-center">
                Industrial
                <div className="flex gap-2">
                  {formData.CM_Industrial_ID && !isEditingIndustrial && !isAddingIndustrial && (
                    <>
                      <button type="button" onClick={() => { setIsEditingIndustrial(true); setIndustrialInput(industrials.find(i => i.CM_Industrial_ID == formData.CM_Industrial_ID)?.CM_Industrial_Name || ""); }} className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-100 px-2 py-1.5 rounded-xl"><Edit2 className="h-3 w-3" /></button>
                      <button type="button" onClick={() => { if (confirm("Delete this Industrial?")) handleManageIndustrial('DELETE', formData.CM_Industrial_ID); }} className="text-red-500 hover:text-red-700 transition-colors bg-red-100 px-2 py-1.5 rounded-xl"><Trash2 className="h-3 w-3" /></button>
                    </>
                  )}
                  {!isEditingIndustrial && !isAddingIndustrial && (
                    <button type="button" onClick={() => setIsAddingIndustrial(true)} className="text-emerald-500 hover:text-emerald-700 transition-colors bg-green-100 px-2 py-1.5 rounded-xl"><Plus className="h-3 w-3" /></button>
                  )}
                </div>
              </label>
              {isAddingIndustrial || isEditingIndustrial ? (
                <div className="flex gap-2">
                  <input type="text" value={industrialInput} onChange={(e) => setIndustrialInput(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all" placeholder="Industrial name" />
                  <button type="button" onClick={() => handleManageIndustrial(isEditingIndustrial ? 'PUT' : 'POST', isEditingIndustrial ? formData.CM_Industrial_ID : null)} className="px-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"><Check className="h-4 w-4" /></button>
                  <button type="button" onClick={() => { setIsAddingIndustrial(false); setIsEditingIndustrial(false); setIndustrialInput(""); }} className="px-3 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <select
                  value={formData.CM_Industrial_ID || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, CM_Industrial_ID: val, CM_Category_ID: "", CM_Subcategory_ID: "" });
                    fetchCategories(val);
                    setSubcategories([]);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="">Select Industrial</option>
                  {industrials.map(i => <option key={i.CM_Industrial_ID} value={i.CM_Industrial_ID}>{i.CM_Industrial_Name}</option>)}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex justify-between items-center">
                Category
                <div className="flex gap-2">
                  {formData.CM_Category_ID && !isEditingCategory && !isAddingCategory && (
                    <>
                      <button type="button" onClick={() => { setIsEditingCategory(true); setCategoryInput(categories.find(c => c.CM_Category_ID == formData.CM_Category_ID)?.CM_Category_Name || ""); }} className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-100 px-2 py-1.5 rounded-xl"><Edit2 className="h-3 w-3" /></button>
                      <button type="button" onClick={() => { if (confirm("Delete this Category?")) handleManageCategory('DELETE', formData.CM_Category_ID); }} className="text-red-500 hover:text-red-700 transition-colors bg-red-100 px-2 py-1.5 rounded-xl"><Trash2 className="h-3 w-3" /></button>
                    </>
                  )}
                  {!isEditingCategory && !isAddingCategory && formData.CM_Industrial_ID && (
                    <button type="button" onClick={() => setIsAddingCategory(true)} className="text-emerald-500 hover:text-emerald-700 transition-colors bg-green-100 px-2 py-1.5 rounded-xl"><Plus className="h-3 w-3" /></button>
                  )}
                </div>
              </label>
              {isAddingCategory || isEditingCategory ? (
                <div className="flex gap-2">
                  <input type="text" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all" placeholder="Category name" />
                  <button type="button" onClick={() => handleManageCategory(isEditingCategory ? 'PUT' : 'POST', isEditingCategory ? formData.CM_Category_ID : null)} className="px-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"><Check className="h-4 w-4" /></button>
                  <button type="button" onClick={() => { setIsAddingCategory(false); setIsEditingCategory(false); setCategoryInput(""); }} className="px-3 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <select
                  value={formData.CM_Category_ID || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, CM_Category_ID: val, CM_Subcategory_ID: "" });
                    fetchSubcategories(val);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
                  disabled={!formData.CM_Industrial_ID}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.CM_Category_ID} value={c.CM_Category_ID}>{c.CM_Category_Name}</option>)}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex justify-between items-center">
                Subcategory
                <div className="flex gap-2">
                  {formData.CM_Subcategory_ID && !isEditingSubcategory && !isAddingSubcategory && (
                    <>
                      <button type="button" onClick={() => { setIsEditingSubcategory(true); setSubcategoryInput(subcategories.find(s => s.CM_Subcategory_ID == formData.CM_Subcategory_ID)?.CM_Subcategory_Name || ""); }} className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-100 px-2 py-1.5 rounded-xl"><Edit2 className="h-3 w-3" /></button>
                      <button type="button" onClick={() => { if (confirm("Delete this Subcategory?")) handleManageSubcategory('DELETE', formData.CM_Subcategory_ID); }} className="text-red-500 hover:text-red-700 transition-colors bg-red-100 px-2 py-1.5 rounded-xl"><Trash2 className="h-3 w-3" /></button>
                    </>
                  )}
                  {!isEditingSubcategory && !isAddingSubcategory && formData.CM_Category_ID && (
                    <button type="button" onClick={() => setIsAddingSubcategory(true)} className="text-emerald-500 hover:text-emerald-700 transition-colors bg-green-100 px-2 py-1.5 rounded-xl"><Plus className="h-3 w-3" /></button>
                  )}
                </div>
              </label>
              {isAddingSubcategory || isEditingSubcategory ? (
                <div className="flex gap-2">
                  <input type="text" value={subcategoryInput} onChange={(e) => setSubcategoryInput(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all" placeholder="Subcategory name" />
                  <button type="button" onClick={() => handleManageSubcategory(isEditingSubcategory ? 'PUT' : 'POST', isEditingSubcategory ? formData.CM_Subcategory_ID : null)} className="px-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"><Check className="h-4 w-4" /></button>
                  <button type="button" onClick={() => { setIsAddingSubcategory(false); setIsEditingSubcategory(false); setSubcategoryInput(""); }} className="px-3 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <select
                  value={formData.CM_Subcategory_ID || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Subcategory_ID: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
                  disabled={!formData.CM_Category_ID}
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map(s => <option key={s.CM_Subcategory_ID} value={s.CM_Subcategory_ID}>{s.CM_Subcategory_Name}</option>)}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Phone Number *</label>
              <input
                required
                type="tel"
                value={formData.CM_Phone || ""}
                onChange={(e) => setFormData({ ...formData, CM_Phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. 9876543210"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Alt Phone</label>
              <input
                type="tel"
                value={formData.CM_Alt_Phone || ""}
                onChange={(e) => setFormData({ ...formData, CM_Alt_Phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
              <input
                type="email"
                value={formData.CM_Email || ""}
                onChange={(e) => setFormData({ ...formData, CM_Email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="client@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">City</label>
              <input
                type="text"
                value={formData.CM_City || ""}
                onChange={(e) => setFormData({ ...formData, CM_City: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Full Address</label>
              <textarea
                rows="2"
                value={formData.CM_Address || ""}
                onChange={(e) => setFormData({ ...formData, CM_Address: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Lead Source</label>
              <select
                value={formData.CM_Lead_Source || ""}
                onChange={(e) => setFormData({ ...formData, CM_Lead_Source: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
              >
                {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Product Required</label>
              <input
                type="text"
                value={formData.CM_Product_Required || ""}
                onChange={(e) => setFormData({ ...formData, CM_Product_Required: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. Billing"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Expected Budget</label>
              <input
                type="number"
                value={formData.CM_Expected_Budget || ""}
                onChange={(e) => setFormData({ ...formData, CM_Expected_Budget: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="Amount in ₹"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Sales Executive</label>
              <select
                value={formData.CM_Sales_Executive_ID || ""}
                onChange={(e) => setFormData({ ...formData, CM_Sales_Executive_ID: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
              >
                <option value="">Select Executive</option>
                {executives.map(e => <option key={e.CM_User_ID} value={e.CM_User_ID}>{e.CM_Full_Name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Lead Status</label>
              <select
                value={formData.CM_Lead_Status || ""}
                onChange={(e) => setFormData({ ...formData, CM_Lead_Status: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Follow-up Status</label>
              <select
                value={formData.CM_Followup_Status || "Follow Up"}
                onChange={(e) => setFormData({ ...formData, CM_Followup_Status: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Follow Up">Follow Up</option>
                <option value="Demo Given">Demo Given</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Converted">Converted</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Next Follow-up Date</label>
              <input
                type="date"
                value={formData.CM_Next_Follow_Up_Date || ""}
                onChange={(e) => setFormData({ ...formData, CM_Next_Follow_Up_Date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Next Follow-up Time</label>
              <input
                type="time"
                value={formData.CM_Next_Follow_Up_Time || ""}
                onChange={(e) => setFormData({ ...formData, CM_Next_Follow_Up_Time: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Remarks</label>
              <textarea
                rows="2"
                value={formData.CM_Remarks || ""}
                onChange={(e) => setFormData({ ...formData, CM_Remarks: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {selectedLead ? "Update Lead" : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
