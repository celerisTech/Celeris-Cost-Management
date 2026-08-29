import React, { useState, useEffect, useRef } from "react";
import { X, Edit2, Trash2, Plus, Check, Loader2, ChevronDown, Settings } from "lucide-react";
import toast from "react-hot-toast";
import VisitProductsMasterPage from "../master/visit-products/page";

const SOURCE_OPTIONS = ["Walk-in", "Reference", "Social Media", "Cold Call", "Website", "Other"];
const STATUS_OPTIONS = [
  "New Lead", "Follow-up Call", "Visited", "Demo Given", "Proposal Sent",
  "Follow Up", "Converted", "Not Interested"
];

// ---------- Searchable Select Component ----------
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  required = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Position on top if space below is insufficient (< 250px) and there's more space above
      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : "";

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearch("");
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        className={`flex items-center border border-gray-300 rounded-sm px-3 py-2.5 bg-white cursor-text ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <input
          ref={inputRef}
          type="text"
          className="w-full outline-none bg-transparent text-sm"
          placeholder={placeholder}
          value={isOpen ? search : displayLabel}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          required={required}
        />
        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </div>

      {isOpen && !disabled && (
        <ul className={`absolute z-50 left-0 right-0 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-sm shadow-lg ${
          dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
        }`}>
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-2 text-sm text-gray-700">No options found</li>
          ) : (
            filteredOptions.map((opt) => (
              <li
                key={opt.value}
                className={`px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer ${
                  opt.value === value ? "bg-blue-100 font-semibold" : ""
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

// ---------- Main Component ----------
export default function LeadFormModal({
  isOpen,
  onClose,
  selectedLead,
  user,
  onSuccess,
}) {
  const [executives, setExecutives] = useState([]);
  const [industrials, setIndustrials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [visitProducts, setVisitProducts] = useState([]);

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

  const [addingProductAtIndex, setAddingProductAtIndex] = useState(null);
  const [newProductName, setNewProductName] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isManageProductModalOpen, setIsManageProductModalOpen] = useState(false);

  // Dynamic products list
  const [productsList, setProductsList] = useState([
    { CM_Lead_Project_ID: null, CM_Product_Name: "", CM_Amount: "", CM_Proposal_Doc: "", CM_Status: "New Lead" },
  ]);

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
    CM_Sales_Executive_ID: "",
    CM_Lead_Status: "New Lead",
    CM_Followup_Status: "Follow Up",
    CM_Next_Follow_Up_Date: "",
    CM_Next_Follow_Up_Time: "",
    CM_Remarks: "",
  });

  // ---------- Data fetching (unchanged) ----------
  useEffect(() => {
    if (isOpen) {
      fetchExecutives();
      fetchIndustrials();
      fetchVisitProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIndustrialInput("");
      setCategoryInput("");
      setSubcategoryInput("");
      setIsAddingIndustrial(false);
      setIsEditingIndustrial(false);
      setIsAddingCategory(false);
      setIsEditingCategory(false);
      setIsAddingSubcategory(false);
      setIsEditingSubcategory(false);
      setAddingProductAtIndex(null);
      setNewProductName("");
      setIsSavingProduct(false);
      setIsManageProductModalOpen(false);
      return;
    }

    if (selectedLead) {
      setFormData({
        CM_Client_Name: selectedLead.CM_Client_Name || "",
        CM_Company_Name: selectedLead.CM_Company_Name || "",
        CM_Industrial_ID: selectedLead.CM_Industrial_ID || "",
        CM_Category_ID: selectedLead.CM_Category_ID || "",
        CM_Subcategory_ID: selectedLead.CM_Subcategory_ID || "",
        CM_Phone: selectedLead.CM_Phone || "",
        CM_Alt_Phone: selectedLead.CM_Alt_Phone || "",
        CM_Email: selectedLead.CM_Email || "",
        CM_City: selectedLead.CM_City || "",
        CM_Address: selectedLead.CM_Address || "",
        CM_Lead_Source: selectedLead.CM_Lead_Source || "Cold Call",
        CM_Sales_Executive_ID: selectedLead.CM_Sales_Executive_ID || "",
        CM_Lead_Status: selectedLead.CM_Lead_Status || "New Lead",
        CM_Followup_Status: selectedLead.CM_Followup_Status || "Follow Up",
        CM_Next_Follow_Up_Date: selectedLead.CM_Next_Follow_Up_Date || "",
        CM_Next_Follow_Up_Time: selectedLead.CM_Next_Follow_Up_Time || "",
        CM_Remarks: selectedLead.CM_Remarks || "",
      });

      if (selectedLead.CM_Industrial_ID) {
        fetchCategories(selectedLead.CM_Industrial_ID);
      }
      if (selectedLead.CM_Category_ID) {
        fetchSubcategories(selectedLead.CM_Category_ID);
      }
      fetchLeadProjects(selectedLead.CM_Lead_ID);
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
        CM_Sales_Executive_ID: (user?.CM_User_ID || user?.id) || "",
        CM_Lead_Status: "New Lead",
        CM_Followup_Status: "Follow Up",
        CM_Next_Follow_Up_Date: "",
        CM_Next_Follow_Up_Time: "",
        CM_Remarks: "",
      });
      setProductsList([
        { CM_Lead_Project_ID: null, CM_Product_Name: "", CM_Amount: "", CM_Proposal_Doc: "", CM_Status: "New Lead" },
      ]);
      setCategories([]);
      setSubcategories([]);
    }
  }, [isOpen, selectedLead, user]);

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

  const fetchVisitProducts = async () => {
    try {
      const res = await fetch("/api/master/visit-products?active=true");
      const data = await res.json();
      if (data.success) {
        setVisitProducts(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch visit products options:", error);
    }
  };

  const fetchLeadProjects = async (leadId) => {
    try {
      const res = await fetch(`/api/sales-leads/projects?leadId=${leadId}`);
      const data = await res.json();
      if (res.ok && data && data.length > 0) {
        setProductsList(
          data.map((p) => ({
            CM_Lead_Project_ID: p.CM_Lead_Project_ID,
            CM_Product_Name: p.CM_Product_Name,
            CM_Amount: p.CM_Amount || "",
            CM_Proposal_Doc: p.CM_Proposal_Doc || "",
            CM_Status: p.CM_Status || "New Lead",
          }))
        );
      } else {
        setProductsList([
          { CM_Lead_Project_ID: null, CM_Product_Name: "", CM_Amount: "", CM_Proposal_Doc: "", CM_Status: "New Lead" },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch lead projects:", error);
    }
  };

  const handleCreateProduct = async (index) => {
    if (!newProductName.trim()) {
      return toast.error("Product name cannot be empty");
    }
    setIsSavingProduct(true);
    try {
      const res = await fetch("/api/master/visit-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Product_Name: newProductName.trim(),
          Color_Code: "blue",
          Is_Active: 1,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Product created successfully");
        await fetchVisitProducts();
        handleProductFieldChange(index, "CM_Product_Name", newProductName.trim());
        setAddingProductAtIndex(null);
        setNewProductName("");
      } else {
        toast.error(data.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("An error occurred while creating product");
    } finally {
      setIsSavingProduct(false);
    }
  };

  // ---------- Management handlers (unchanged) ----------
  const handleManageIndustrial = async (action, id = null) => {
    if (!industrialInput.trim() && action !== "DELETE") return toast.error("Industrial name required");
    try {
      const url = id ? `/api/sales-industrial?_method=${action}` : "/api/sales-industrial";
      const payload = {
        entity: "industrial",
        CM_Industrial_Name: industrialInput,
        CM_Created_By: user?.CM_User_ID || user?.id,
        CM_Updated_By: user?.CM_User_ID || user?.id,
        ...(id && { CM_Industrial_ID: id }),
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`Industrial ${action === "DELETE" ? "deleted" : action === "PUT" ? "updated" : "added"}`);
        setIndustrialInput("");
        setIsAddingIndustrial(false);
        setIsEditingIndustrial(false);
        fetchIndustrials();
        if (action === "DELETE") {
          setFormData((prev) => ({ ...prev, CM_Industrial_ID: "", CM_Category_ID: "", CM_Subcategory_ID: "" }));
          setCategories([]);
          setSubcategories([]);
        }
      } else {
        toast.error((await res.json()).error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleManageCategory = async (action, id = null) => {
    if (!formData.CM_Industrial_ID && action !== "DELETE") return toast.error("Select an Industrial first");
    if (!categoryInput.trim() && action !== "DELETE") return toast.error("Category name required");
    try {
      const url = id ? `/api/sales-industrial?_method=${action}` : "/api/sales-industrial";
      const payload = {
        entity: "category",
        CM_Category_Name: categoryInput,
        CM_Industrial_ID: formData.CM_Industrial_ID,
        CM_Created_By: user?.CM_User_ID || user?.id,
        CM_Updated_By: user?.CM_User_ID || user?.id,
        ...(id && { CM_Category_ID: id }),
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`Category ${action === "DELETE" ? "deleted" : action === "PUT" ? "updated" : "added"}`);
        setCategoryInput("");
        setIsAddingCategory(false);
        setIsEditingCategory(false);
        fetchCategories(formData.CM_Industrial_ID);
        if (action === "DELETE") {
          setFormData((prev) => ({ ...prev, CM_Category_ID: "", CM_Subcategory_ID: "" }));
          setSubcategories([]);
        }
      } else {
        toast.error((await res.json()).error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleManageSubcategory = async (action, id = null) => {
    if (!formData.CM_Category_ID && action !== "DELETE") return toast.error("Select a Category first");
    if (!subcategoryInput.trim() && action !== "DELETE") return toast.error("Subcategory name required");
    try {
      const url = id ? `/api/sales-industrial?_method=${action}` : "/api/sales-industrial";
      const payload = {
        entity: "subcategory",
        CM_Subcategory_Name: subcategoryInput,
        CM_Category_ID: formData.CM_Category_ID,
        CM_Created_By: user?.CM_User_ID || user?.id,
        CM_Updated_By: user?.CM_User_ID || user?.id,
        ...(id && { CM_Subcategory_ID: id }),
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`Subcategory ${action === "DELETE" ? "deleted" : action === "PUT" ? "updated" : "added"}`);
        setSubcategoryInput("");
        setIsAddingSubcategory(false);
        setIsEditingSubcategory(false);
        fetchSubcategories(formData.CM_Category_ID);
        if (action === "DELETE") {
          setFormData((prev) => ({ ...prev, CM_Subcategory_ID: "" }));
        }
      } else {
        toast.error((await res.json()).error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  // ---------- Product rows management ----------
  const addProductRow = () => {
    setProductsList([
      ...productsList,
      {
        CM_Lead_Project_ID: null,
        CM_Product_Name: "",
        CM_Amount: "",
        CM_Proposal_Doc: "",
        CM_Status: formData.CM_Lead_Status || "New Lead",
      },
    ]);
  };

  const removeProductRow = (index) => {
    const list = [...productsList];
    list.splice(index, 1);
    setProductsList(list);
    setAddingProductAtIndex(null);
    setNewProductName("");
  };

  const handleProductFieldChange = (index, field, value) => {
    const list = [...productsList];
    list[index] = { ...list[index], [field]: value };
    setProductsList(list);
  };

  const handleProductFileChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload only PDF files");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      handleProductFieldChange(index, "CM_Proposal_Doc", reader.result);
      toast.success("Proposal document uploaded successfully");
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validProducts = productsList.filter((p) => p.CM_Product_Name.trim() !== "");
    if (validProducts.length === 0) {
      return toast.error("Please add at least one product/project with a valid name");
    }

    setIsSubmitting(true);
    try {
      const url = selectedLead ? `/api/sales-leads?_method=PUT` : "/api/sales-leads";
      const payload = {
        ...formData,
        products: productsList,
        CM_Created_By: user?.CM_User_ID || user?.id,
        CM_Updated_By: user?.CM_User_ID || user?.id,
        ...(selectedLead && { CM_Lead_ID: selectedLead.CM_Lead_ID }),
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // ---------- Helper to get option arrays for searchable selects ----------
  const industrialOptions = industrials.map((i) => ({
    value: i.CM_Industrial_ID,
    label: i.CM_Industrial_Name,
  }));
  const categoryOptions = categories.map((c) => ({
    value: c.CM_Category_ID,
    label: c.CM_Category_Name,
  }));
  const subcategoryOptions = subcategories.map((s) => ({
    value: s.CM_Subcategory_ID,
    label: s.CM_Subcategory_Name,
  }));
  const executiveOptions = executives.map((e) => ({
    value: e.CM_User_ID,
    label: e.CM_Full_Name,
  }));
  const sourceOptions = SOURCE_OPTIONS.map((s) => ({ value: s, label: s }));
  const statusOptions = STATUS_OPTIONS.map((s) => ({ value: s, label: s }));
  const followupOptions = ["Follow Up", "Demo Given", "Proposal Sent", "Converted"].map((s) => ({
    value: s,
    label: s,
  }));
  const productOptions = visitProducts.map((vp) => ({
    value: vp.Product_Name,
    label: vp.Product_Name,
  }));

  // ---------- Render ----------
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col text-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-500 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {selectedLead ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {selectedLead ? "Edit Lead" : "Add New Lead"}
          </h2>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pb-12">
          {/* ---------- 3‑column Grid Form ---------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {/* 1. Client Name */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">Client Name *</label>
              <input
                required
                type="text"
                value={formData.CM_Client_Name || ""}
                onChange={(e) => setFormData({ ...formData, CM_Client_Name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter full name"
              />
            </div>

            {/* 2. Company Name */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">Company Name</label>
              <input
                type="text"
                value={formData.CM_Company_Name || ""}
                onChange={(e) => setFormData({ ...formData, CM_Company_Name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter company name"
              />
            </div>

            {/* 3. Industrial (with add/edit/delete) */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase flex justify-between items-center">
                Industrial
                <div className="flex gap-2">
                  {formData.CM_Industrial_ID && !isEditingIndustrial && !isAddingIndustrial && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingIndustrial(true);
                          setIndustrialInput(
                            industrials.find((i) => i.CM_Industrial_ID == formData.CM_Industrial_ID)
                              ?.CM_Industrial_Name || ""
                          );
                        }}
                        className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-100 px-2 py-1.5 rounded-sm"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this Industrial?"))
                            handleManageIndustrial("DELETE", formData.CM_Industrial_ID);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors bg-red-100 px-2 py-1.5 rounded-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  {!isEditingIndustrial && !isAddingIndustrial && (
                    <button
                      type="button"
                      onClick={() => setIsAddingIndustrial(true)}
                      className="text-emerald-500 hover:text-emerald-700 transition-colors bg-green-100 px-2 py-1.5 rounded-sm"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </label>

              {isAddingIndustrial || isEditingIndustrial ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={industrialInput}
                    onChange={(e) => setIndustrialInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all"
                    placeholder="Industrial name"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleManageIndustrial(
                        isEditingIndustrial ? "PUT" : "POST",
                        isEditingIndustrial ? formData.CM_Industrial_ID : null
                      )
                    }
                    className="px-3 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingIndustrial(false);
                      setIsEditingIndustrial(false);
                      setIndustrialInput("");
                    }}
                    className="px-3 bg-gray-200 text-gray-600 rounded-sm hover:bg-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <SearchableSelect
                  options={industrialOptions}
                  value={formData.CM_Industrial_ID || ""}
                  onChange={(val) => {
                    setFormData({ ...formData, CM_Industrial_ID: val, CM_Category_ID: "", CM_Subcategory_ID: "" });
                    fetchCategories(val);
                    setSubcategories([]);
                  }}
                  placeholder="Select Industrial"
                />
              )}
            </div>

            {/* 4. Category */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase flex justify-between items-center">
                Category
                <div className="flex gap-2">
                  {formData.CM_Category_ID && !isEditingCategory && !isAddingCategory && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingCategory(true);
                          setCategoryInput(
                            categories.find((c) => c.CM_Category_ID == formData.CM_Category_ID)?.CM_Category_Name || ""
                          );
                        }}
                        className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-100 px-2 py-1.5 rounded-sm"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this Category?"))
                            handleManageCategory("DELETE", formData.CM_Category_ID);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors bg-red-100 px-2 py-1.5 rounded-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  {!isEditingCategory && !isAddingCategory && formData.CM_Industrial_ID && (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="text-emerald-500 hover:text-emerald-700 transition-colors bg-green-100 px-2 py-1.5 rounded-sm"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </label>

              {isAddingCategory || isEditingCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all"
                    placeholder="Category name"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleManageCategory(
                        isEditingCategory ? "PUT" : "POST",
                        isEditingCategory ? formData.CM_Category_ID : null
                      )
                    }
                    className="px-3 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setIsEditingCategory(false);
                      setCategoryInput("");
                    }}
                    className="px-3 bg-gray-200 text-gray-600 rounded-sm hover:bg-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <SearchableSelect
                  options={categoryOptions}
                  value={formData.CM_Category_ID || ""}
                  onChange={(val) => {
                    setFormData({ ...formData, CM_Category_ID: val, CM_Subcategory_ID: "" });
                    fetchSubcategories(val);
                  }}
                  placeholder="Select Category"
                  disabled={!formData.CM_Industrial_ID}
                />
              )}
            </div>

            {/* 5. Subcategory */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase flex justify-between items-center">
                Subcategory
                <div className="flex gap-2">
                  {formData.CM_Subcategory_ID && !isEditingSubcategory && !isAddingSubcategory && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingSubcategory(true);
                          setSubcategoryInput(
                            subcategories.find((s) => s.CM_Subcategory_ID == formData.CM_Subcategory_ID)
                              ?.CM_Subcategory_Name || ""
                          );
                        }}
                        className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-100 px-2 py-1.5 rounded-sm"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this Subcategory?"))
                            handleManageSubcategory("DELETE", formData.CM_Subcategory_ID);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors bg-red-100 px-2 py-1.5 rounded-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  {!isEditingSubcategory && !isAddingSubcategory && formData.CM_Category_ID && (
                    <button
                      type="button"
                      onClick={() => setIsAddingSubcategory(true)}
                      className="text-emerald-500 hover:text-emerald-700 transition-colors bg-green-100 px-2 py-1.5 rounded-sm"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </label>

              {isAddingSubcategory || isEditingSubcategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subcategoryInput}
                    onChange={(e) => setSubcategoryInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all"
                    placeholder="Subcategory name"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleManageSubcategory(
                        isEditingSubcategory ? "PUT" : "POST",
                        isEditingSubcategory ? formData.CM_Subcategory_ID : null
                      )
                    }
                    className="px-3 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSubcategory(false);
                      setIsEditingSubcategory(false);
                      setSubcategoryInput("");
                    }}
                    className="px-3 bg-gray-200 text-gray-600 rounded-sm hover:bg-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <SearchableSelect
                  options={subcategoryOptions}
                  value={formData.CM_Subcategory_ID || ""}
                  onChange={(val) => setFormData({ ...formData, CM_Subcategory_ID: val })}
                  placeholder="Select Subcategory"
                  disabled={!formData.CM_Category_ID}
                />
              )}
            </div>

            {/* 6. Phone Number */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">Phone Number *</label>
              <input
                required
                type="tel"
                value={formData.CM_Phone || ""}
                onChange={(e) => setFormData({ ...formData, CM_Phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. 9876543210"
              />
            </div>

            {/* 7. Alt Phone */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">Alt Phone</label>
              <input
                type="tel"
                value={formData.CM_Alt_Phone || ""}
                onChange={(e) => setFormData({ ...formData, CM_Alt_Phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="Alternative contact number"
              />
            </div>

            {/* 8. Email Address */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">Email Address</label>
              <input
                type="email"
                value={formData.CM_Email || ""}
                onChange={(e) => setFormData({ ...formData, CM_Email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="client@example.com"
              />
            </div>

            {/* 9. City */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">City</label>
              <input
                type="text"
                value={formData.CM_City || ""}
                onChange={(e) => setFormData({ ...formData, CM_City: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter city"
              />
            </div>

            {/* 10. Full Address (spans 2 columns on lg, 1 on smaller) */}
            <div className="space-y-1 lg:col-span-2">
              <label className="text-sm font-bold text-gray-700 uppercase">Full Address</label>
              <textarea
                rows="2"
                value={formData.CM_Address || ""}
                onChange={(e) => setFormData({ ...formData, CM_Address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Enter full address"
              />
            </div>

            {/* 11. Lead Source */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">Lead Source</label>
              <SearchableSelect
                options={sourceOptions}
                value={formData.CM_Lead_Source || ""}
                onChange={(val) => setFormData({ ...formData, CM_Lead_Source: val })}
                placeholder="Select Lead Source"
              />
            </div>

            {/* 12. Sales Executive */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">Sales Executive</label>
              <SearchableSelect
                options={executiveOptions}
                value={formData.CM_Sales_Executive_ID || ""}
                onChange={(val) => setFormData({ ...formData, CM_Sales_Executive_ID: val })}
                placeholder="Select Executive"
              />
            </div>

            {/* 13. Lead Status */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">Lead Status</label>
              <SearchableSelect
                options={statusOptions}
                value={formData.CM_Lead_Status || ""}
                onChange={(val) => {
                  setFormData({ ...formData, CM_Lead_Status: val });
                  setProductsList((prev) => prev.map((p) => ({ ...p, CM_Status: val })));
                }}
                placeholder="Select Status"
              />
            </div>

            {/* 14. Follow-up Status */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 uppercase">Follow-up Status</label>
              <SearchableSelect
                options={followupOptions}
                value={formData.CM_Followup_Status || "Follow Up"}
                onChange={(val) => setFormData({ ...formData, CM_Followup_Status: val })}
                placeholder="Select Follow-up Status"
              />
            </div>

            {/* 20. Remarks (spans 2 columns on lg) */}
            <div className="space-y-1 lg:col-span-2">
              <label className="text-sm font-bold text-gray-700 uppercase">Remarks</label>
              <textarea
                rows="4"
                value={formData.CM_Remarks || ""}
                onChange={(e) => setFormData({ ...formData, CM_Remarks: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Any additional notes..."
              />
            </div>

            {/* Next Follow-up Date & Time (stacked vertically in the 3rd column) */}
            <div className="space-y-3">
              {/* 15. Next Follow-up Date */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 uppercase">Next Follow-up Date</label>
                <input
                  type="date"
                  value={formData.CM_Next_Follow_Up_Date || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Next_Follow_Up_Date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* 16. Next Follow-up Time */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 uppercase">Next Follow-up Time</label>
                <input
                  type="time"
                  value={formData.CM_Next_Follow_Up_Time || ""}
                  onChange={(e) => setFormData({ ...formData, CM_Next_Follow_Up_Time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* ---------- Products / Projects Section ---------- */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                Products*
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsManageProductModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-sm hover:bg-indigo-100 transition-colors shadow-sm text-sm font-bold"
                >
                  <Settings className="h-4 w-4" />
                  Manage Products
                </button>
                <button
                  type="button"
                  onClick={addProductRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-sm hover:bg-indigo-700 transition-colors shadow-md text-sm font-bold"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              </div>
            </div>

            {productsList.map((product, index) => (
              <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-sm relative mb-4 last:mb-0">
                {productsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProductRow(index)}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 17. Product Name */}
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 uppercase flex justify-between items-center">
                      Product Required *
                      {addingProductAtIndex !== index && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddingProductAtIndex(index);
                            setNewProductName("");
                          }}
                          className="text-emerald-500 hover:text-emerald-700 transition-colors bg-green-100 px-2 py-1 rounded-sm text-xs flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add Product
                        </button>
                      )}
                    </label>
                    {addingProductAtIndex === index ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all text-sm"
                          placeholder="New Product Name"
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          disabled={isSavingProduct}
                          onClick={() => handleCreateProduct(index)}
                          className="px-3 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                          {isSavingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          disabled={isSavingProduct}
                          onClick={() => {
                            setAddingProductAtIndex(null);
                            setNewProductName("");
                          }}
                          className="px-3 bg-gray-200 text-gray-600 rounded-sm hover:bg-gray-300 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <SearchableSelect
                        options={productOptions}
                        value={product.CM_Product_Name || ""}
                        onChange={(val) => handleProductFieldChange(index, "CM_Product_Name", val)}
                        placeholder="Search Product"
                        required
                      />
                    )}
                  </div>

                  {/* 18. Expected Budget */}
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 uppercase">Expected Budget (₹)</label>
                    <input
                      type="number"
                      value={product.CM_Amount || ""}
                      onChange={(e) => handleProductFieldChange(index, "CM_Amount", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all text-sm"
                      placeholder="Amount in ₹"
                    />
                  </div>

                  {/* 19. Proposal Document */}
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 uppercase">Proposal Document (PDF)</label>
                    {product.CM_Proposal_Doc ? (
                      <div className="flex items-center justify-between p-2.5 border border-gray-200 rounded-sm bg-white text-sm">
                        <span className="font-semibold text-gray-600 truncate max-w-[120px]">Proposal Attached</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = product.CM_Proposal_Doc;
                              link.download = `${product.CM_Product_Name || "Product"}_Proposal.pdf`;
                              link.click();
                            }}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProductFieldChange(index, "CM_Proposal_Doc", "")}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept=".pdf"
                          id={`proposal-file-${index}`}
                          onChange={(e) => handleProductFileChange(index, e)}
                          className="hidden"
                        />
                        <label
                          htmlFor={`proposal-file-${index}`}
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-100 cursor-pointer font-bold text-sm transition-colors"
                        >
                          <Plus className="h-4 w-4 text-gray-700" />
                          Upload PDF
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-sm hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-sm hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {selectedLead ? "Update Lead" : "Save Lead"}
            </button>
          </div>
        </form>
      </div>

      {isManageProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] overflow-y-auto p-4 md:p-8">
          <div className="bg-slate-50 min-h-[80vh] rounded-2xl shadow-2xl relative max-w-5xl mx-auto text-gray-800">
            <div className="pt-2 pb-6">
              <VisitProductsMasterPage onClose={() => { setIsManageProductModalOpen(false); fetchVisitProducts(); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}