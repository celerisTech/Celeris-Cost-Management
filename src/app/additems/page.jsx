"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from '../components/Navbar';
import { useAuthStore } from "@/app/store/useAuthScreenStore";
import { ArrowLeft } from 'lucide-react';

const AddItemForm = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);

  // State for creating/editing entries
  const [newCategory, setNewCategory] = useState({ name: '', code: '' });
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [newSubcategory, setNewSubcategory] = useState({ name: '' });
  const [showSubcategoryInput, setShowSubcategoryInput] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);

  // State for unit type management
  const [newUnitType, setNewUnitType] = useState({ name: '', description: '' });
  const [showUnitTypeInput, setShowUnitTypeInput] = useState(false);
  const [editingUnitType, setEditingUnitType] = useState(null);


  const [formData, setFormData] = useState({
    CM_Item_Code: "",
    CM_Item_Name: "",
    CM_Item_Description: "",
    CM_Category_ID: "",
    CM_Subcategory_ID: "",
    CM_Unit_Type: "",
    CM_Stock_Level: 0,
    CM_HSN_ASC_Code: "",
    CM_Is_Status: "Active",
    CM_Company_ID: user?.CM_Company_ID || "",
    CM_Created_By: user?.CM_Full_Name || "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // ✅ Fetch categories - Updated to handle different response formats
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/categories");
        // Handle different response formats
        const categoriesData = res.data?.data || res.data || [];
        setCategories(categoriesData);
        console.log("Fetched categories:", categoriesData);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // ✅ Fetch unit types - Updated
  useEffect(() => {
    const fetchUnitTypes = async () => {
      try {
        const res = await axios.get("/api/unit-types");
        // Handle different response formats
        const unitTypesData = res.data?.data || res.data || [];
        setUnitTypes(unitTypesData);

        // Set default unit type if available
        if (unitTypesData.length > 0) {
          setFormData(prev => ({
            ...prev,
            CM_Unit_Type: unitTypesData[0].CM_Unit_ID
          }));
        }
      } catch (err) {
        console.error("Error fetching unit types:", err);
      }
    };
    fetchUnitTypes();
  }, []);

  // ✅ Fetch subcategories when category changes - Updated
  useEffect(() => {
    if (!formData.CM_Category_ID) {
      setSubcategories([]);
      setFormData(prev => ({ ...prev, CM_Subcategory_ID: "" }));
      return;
    }

    const fetchSubcategories = async () => {
      try {
        const res = await axios.get(`/api/subcategories?categoryId=${formData.CM_Category_ID}`);
        // Handle different response formats
        const subcategoriesData = res.data?.data || res.data || [];
        setSubcategories(subcategoriesData);
        console.log("Fetched subcategories:", subcategoriesData);
      } catch (err) {
        console.error("Error fetching subcategories:", err);
      }
    };
    fetchSubcategories();
  }, [formData.CM_Category_ID]);

  useEffect(() => {
    if (user?.CM_Company_ID || user?.CM_Full_Name) {
      setFormData(prev => ({
        ...prev,
        CM_Company_ID: user?.CM_Company_ID || prev.CM_Company_ID,
        CM_Created_By: user?.CM_Full_Name || prev.CM_Created_By,
      }));
    }
  }, [user]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "CM_Stock_Level" ? parseInt(value) || 0 : value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle editing a category
  const handleEditCategory = async (category) => {
    try {
      console.log("Initial category data for editing:", category);

      // If category code is missing, fetch the full category details
      if (category.CM_Category_Code === undefined) {
        const res = await axios.get(`/api/categories?categoryId=${category.CM_Category_ID}`);
        category = res.data?.data || res.data;
        console.log("Fetched complete category data:", category);
      }

      setEditingCategory(category);
      setNewCategory({
        name: category.CM_Category_Name || '',
        code: category.CM_Category_Code || ''
      });
      setShowCategoryInput(true);
    } catch (error) {
      console.error("Error preparing category for edit:", error);
      setMessage("Failed to load category details");
    }
  };

  // Handle editing a subcategory
  const handleEditSubcategory = async (subcategory) => {
    try {
      console.log("Initial subcategory data for editing:", subcategory);

      // If subcategory details are incomplete, fetch full details
      if (!subcategory.CM_Category_ID) {
        const res = await axios.get(`/api/subcategories?subcategoryId=${subcategory.CM_Subcategory_ID}`);
        subcategory = res.data?.data || res.data;
        console.log("Fetched complete subcategory data:", subcategory);
      }

      setEditingSubcategory(subcategory);
      setNewSubcategory({
        name: subcategory.CM_Subcategory_Name || ''
      });
      setShowSubcategoryInput(true);
    } catch (error) {
      console.error("Error preparing subcategory for edit:", error);
      setMessage("Failed to load subcategory details");
    }
  };

  // Handle editing a unit type
  const handleEditUnitType = async (unitType) => {
    try {
      console.log("Initial unit type data for editing:", unitType);

      // If unit type details are incomplete, fetch full details
      if (!unitType.CM_Description) {
        const res = await axios.get(`/api/unit-types?unitId=${unitType.CM_Unit_ID}`);
        unitType = res.data?.data || res.data;
        console.log("Fetched complete unit type data:", unitType);
      }

      setEditingUnitType(unitType);
      setNewUnitType({
        name: unitType.CM_Unit_Name || '',
        description: unitType.CM_Description || ''
      });
      setShowUnitTypeInput(true);
    } catch (error) {
      console.error("Error preparing unit type for edit:", error);
      setMessage("Failed to load unit type details");
    }
  };

  // Handle create or update entry (category, subcategory, or unit type)
  const handleCreateEntry = async (type, value) => {
    try {
      let endpoint = '';
      let payload = {};
      let isUpdate = false;

      if (type === 'category') {
        if (!value.name?.trim()) {
          setMessage("Category name is required");
          return;
        }

        endpoint = '/api/categories';
        payload = {
          CM_Category_Name: value.name.trim(),
          CM_Category_Code: value.code?.trim() || '',
          isUpdate: false
        };

        if (editingCategory) {
          isUpdate = true;
          payload.CM_Category_ID = editingCategory.CM_Category_ID;
          payload.isUpdate = true;
        }
      } else if (type === 'subcategory') {
        if (!value.name?.trim()) {
          setMessage("Subcategory name is required");
          return;
        }

        if (!formData.CM_Category_ID) {
          setMessage("Please select a category first");
          return;
        }

        endpoint = '/api/subcategories';
        payload = {
          CM_Subcategory_Name: value.name.trim(),
          CM_Category_ID: formData.CM_Category_ID,
          isUpdate: false
        };

        if (editingSubcategory) {
          isUpdate = true;
          payload.CM_Subcategory_ID = editingSubcategory.CM_Subcategory_ID;
          payload.isUpdate = true;
        }
      } else if (type === 'unitType') {
        if (!value.name?.trim()) {
          setMessage("Unit type name is required");
          return;
        }

        endpoint = '/api/unit-types';
        payload = {
          CM_Unit_Name: value.name.trim(),
          CM_Description: value.description?.trim() || '',
          CM_Created_By: user?.CM_Full_Name || 'system',
          isUpdate: false
        };

        if (editingUnitType) {
          isUpdate = true;
          payload.CM_Unit_ID = editingUnitType.CM_Unit_ID;
          payload.isUpdate = true;
        }
      }

      console.log(`Sending ${type} payload:`, payload);

      // Always use POST method with isUpdate flag
      const response = await axios.post(endpoint, payload);
      console.log(`API response for ${type}:`, response.data);

      // Extract the actual data from response (handle different API response formats)
      const responseData = response.data?.data || response.data;

      if (!responseData) {
        throw new Error(`No data returned from ${type} API`);
      }

      if (type === 'category') {
        if (isUpdate) {
          // Update the categories list
          setCategories(prev => prev.map(c =>
            c.CM_Category_ID === editingCategory.CM_Category_ID ? responseData : c
          ));
          setEditingCategory(null);
          setMessage("Category updated successfully!");
        } else {
          // Add new category to the list and select it
          setCategories(prev => {
            const newCategories = [...prev, responseData];
            console.log("Updated categories list:", newCategories);
            return newCategories;
          });

          // Auto-select the newly created category
          setFormData(prev => ({
            ...prev,
            CM_Category_ID: responseData.CM_Category_ID
          }));

          setMessage("Category added successfully!");
        }
      } else if (type === 'subcategory') {
        if (isUpdate) {
          // Update the subcategories list
          setSubcategories(prev => prev.map(sc =>
            sc.CM_Subcategory_ID === editingSubcategory.CM_Subcategory_ID ? responseData : sc
          ));
          setEditingSubcategory(null);
          setMessage("Subcategory updated successfully!");
        } else {
          // Add new subcategory to the list and select it
          setSubcategories(prev => {
            const newSubcategories = [...prev, responseData];
            console.log("Updated subcategories list:", newSubcategories);
            return newSubcategories;
          });

          // Auto-select the newly created subcategory
          setFormData(prev => ({
            ...prev,
            CM_Subcategory_ID: responseData.CM_Subcategory_ID
          }));

          setMessage("Subcategory added successfully!");
        }
      } else if (type === 'unitType') {
        if (isUpdate) {
          // Update the unit types list
          setUnitTypes(prev => prev.map(ut =>
            ut.CM_Unit_ID === editingUnitType.CM_Unit_ID ? responseData : ut
          ));
          setEditingUnitType(null);
          setMessage("Unit type updated successfully!");
        } else {
          // Add new unit type to the list and select it
          setUnitTypes(prev => {
            const newUnitTypes = [...prev, responseData];
            console.log("Updated unit types list:", newUnitTypes);
            return newUnitTypes;
          });

          // Auto-select the newly created unit type
          setFormData(prev => ({
            ...prev,
            CM_Unit_Type: responseData.CM_Unit_ID
          }));

          setMessage("Unit type added successfully!");
        }
      }

      // Reset form states
      if (type === 'category') {
        setNewCategory({ name: '', code: '' });
        setShowCategoryInput(false);
      } else if (type === 'subcategory') {
        setNewSubcategory({ name: '' });
        setShowSubcategoryInput(false);
      } else if (type === 'unitType') {
        setNewUnitType({ name: '', description: '' });
        setShowUnitTypeInput(false);
      }

      // Refresh the lists to ensure we have the latest data
      setTimeout(() => {
        if (type === 'category') {
          const fetchCategories = async () => {
            try {
              const res = await axios.get("/api/categories");
              const categoriesData = res.data?.data || res.data || [];
              setCategories(categoriesData);
            } catch (err) {
              console.error("Error refreshing categories:", err);
            }
          };
          fetchCategories();
        } else if (type === 'subcategory' && formData.CM_Category_ID) {
          const fetchSubcategories = async () => {
            try {
              const res = await axios.get(`/api/subcategories?categoryId=${formData.CM_Category_ID}`);
              const subcategoriesData = res.data?.data || res.data || [];
              setSubcategories(subcategoriesData);
            } catch (err) {
              console.error("Error refreshing subcategories:", err);
            }
          };
          fetchSubcategories();
        } else if (type === 'unitType') {
          const fetchUnitTypes = async () => {
            try {
              const res = await axios.get("/api/unit-types");
              const unitTypesData = res.data?.data || res.data || [];
              setUnitTypes(unitTypesData);
            } catch (err) {
              console.error("Error refreshing unit types:", err);
            }
          };
          fetchUnitTypes();
        }
      }, 500);

      setTimeout(() => setMessage(""), 3000);

    } catch (error) {
      console.error(`Failed to ${editingCategory || editingSubcategory || editingUnitType ? 'update' : 'add'} ${type}:`, error);

      // Log detailed error information
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }

      let errorMessage = `Failed to ${editingCategory || editingSubcategory || editingUnitType ? 'update' : 'add'} ${type}`;
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.response?.data?.error) {
        errorMessage += `: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      setMessage(errorMessage);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setValidationErrors({});

    try {
      const response = await axios.post("/api/additems", formData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        setMessage("Item added successfully!");
        setFormData({
          CM_Item_Code: "",
          CM_Item_Name: "",
          CM_Item_Description: "",
          CM_Category_ID: "",
          CM_Subcategory_ID: "",
          CM_Unit_Type: "",
          CM_Stock_Level: 0,
          CM_HSN_ASC_Code: "",
          CM_Is_Status: "Active",
          CM_Company_ID: user?.CM_Company_ID || "",
          CM_Created_By: user?.CM_Full_Name || 'system',
        });
        // Redirect after successful submission
        setTimeout(() => router.push("/addproduct"), 2000);
      }
    } catch (error) {
      // Handle validation errors
      if (error.response?.status === 400 && error.response.data.details) {
        const errors = {};
        error.response.data.details.forEach(err => {
          errors[err.field] = err.message;
        });
        setValidationErrors(errors);
        setMessage("Please fix the validation errors below.");
      }
      // Handle duplicate item code errors
      else if (error.response?.status === 409) {
        setMessage(error.response.data.error);
      }
      // Handle other errors
      else {
        setMessage(error.response?.data?.error || "Error adding item");
      }
    } finally {
      setLoading(false);
    }
  };
  if (loading)
    return (
      <div className="flex flex-row h-screen bg-white">
        {/* Navbar */}
        <Navbar />
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full items-center justify-center">
          <div className="flex justify-center items-center h-64">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mt-70">
              {/* Sun */}
              <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
              {/* Orbit 1 */}
              <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              {/* Orbit 2 */}
              <div className="absolute inset-2 border-2 border-green-300/30 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  return (
    <div className="flex flex-col md:flex-row h-screen bg-white">
      {/* Sidebar / Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-3xl bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 mx-2 md:mx-0">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => router.push("/addproduct")}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6 text-blue-600" />
            </button>

            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">
              📦 Add New Item
            </h2>
          </div>

          {/* Success / Error Messages */}
          {message && (
            <div
              className={`mb-4 md:mb-6 p-3 md:p-4 rounded-lg md:rounded-xl text-sm font-medium shadow-sm ${message.includes("Error") || message.includes("Failed") || message.includes("Please fix")
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-white text-green-700 border border-green-200"
                }`}
            >
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Item Code + Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Code *
                </label>
                <input
                  type="text"
                  name="CM_Item_Code"
                  value={formData.CM_Item_Code}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 md:px-4 py-2 md:py-3 text-gray-800 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm md:text-base ${validationErrors.CM_Item_Code ? "border-red-500" : ""
                    }`}
                  placeholder="Enter item code"
                />
                {validationErrors.CM_Item_Code && (
                  <p className="mt-1 text-xs md:text-sm text-red-600">{validationErrors.CM_Item_Code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="CM_Item_Name"
                  value={formData.CM_Item_Name}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 md:px-4 py-2 md:py-3 text-gray-800 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm md:text-base ${validationErrors.CM_Item_Name ? "border-red-500" : ""
                    }`}
                  placeholder="Enter item name"
                />
                {validationErrors.CM_Item_Name && (
                  <p className="mt-1 text-xs md:text-sm text-red-600">{validationErrors.CM_Item_Name}</p>
                )}
              </div>
            </div>

            {/* Item Description - Full width on mobile */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Item Description *
              </label>
              <input
                type="text"
                name="CM_Item_Description"
                value={formData.CM_Item_Description}
                onChange={handleChange}
                required
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-gray-800 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm md:text-base ${validationErrors.CM_Item_Description ? "border-red-500" : ""
                  }`}
                placeholder="Enter Item Description"
              />
              {validationErrors.CM_Item_Description && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{validationErrors.CM_Item_Description}</p>
              )}
            </div>

            {/* Category + Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Category *</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <select
                      name="CM_Category_ID"
                      value={formData.CM_Category_ID}
                      onChange={handleChange}
                      className={`w-full p-2 md:p-3 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none text-sm md:text-base ${validationErrors.CM_Category_ID ? "border-red-500" : ""
                        }`}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c, idx) => (
                        <option key={c.CM_Category_ID || `cat-${idx}`} value={c.CM_Category_ID}>
                          {c.CM_Category_Name || `Category ${idx}`}
                        </option>
                      ))}
                    </select>
                    {Boolean(formData.CM_Category_ID) && (
                      <button
                        type="button"
                        onClick={() => {
                          const category = categories.find(
                            c => String(c.CM_Category_ID) === String(formData.CM_Category_ID)
                          );
                          if (category) handleEditCategory(category);
                        }}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 text-sm"
                        title="Edit category"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setNewCategory({ name: '', code: '' });
                      setShowCategoryInput(true);
                    }}
                    className="p-2 md:p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm md:text-base"
                  >
                    +
                  </button>
                </div>
                {validationErrors.CM_Category_ID && (
                  <p className="mt-1 text-xs md:text-sm text-red-600">{validationErrors.CM_Category_ID}</p>
                )}

                {showCategoryInput && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Category name *"
                      value={newCategory.name || ''}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="p-2 text-gray-800 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Category code"
                      value={newCategory.code || ''}
                      onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value })}
                      className="p-2 text-gray-800 border border-gray-300 rounded text-sm"
                    />
                    <div className="md:col-span-2 flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleCreateEntry('category', newCategory)}
                        disabled={!newCategory.name?.trim()}
                        className="p-2 text-xs md:text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        {editingCategory ? "Update" : "✓"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCategory({ name: '', code: '' });
                          setShowCategoryInput(false);
                          setEditingCategory(null);
                        }}
                        className="p-2 text-xs md:text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Subcategory */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Subcategory</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <select
                      name="CM_Subcategory_ID"
                      value={formData.CM_Subcategory_ID}
                      onChange={handleChange}
                      disabled={!formData.CM_Category_ID}
                      className={`w-full p-2 md:p-3 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none disabled:bg-gray-100 text-sm md:text-base ${validationErrors.CM_Subcategory_ID ? "border-red-500" : ""
                        }`}
                    >
                      <option value="">Select Subcategory</option>
                      {subcategories
                        .filter((sc) => String(sc.CM_Category_ID) === String(formData.CM_Category_ID))
                        .map((sc, idx) => (
                          <option key={sc.CM_Subcategory_ID || `subcat-${idx}`} value={sc.CM_Subcategory_ID}>
                            {sc.CM_Subcategory_Name || `Subcategory ${idx}`}
                          </option>
                        ))}
                    </select>
                    {Boolean(formData.CM_Subcategory_ID) && (
                      <button
                        type="button"
                        onClick={() => {
                          const subcategory = subcategories.find(
                            sc => String(sc.CM_Subcategory_ID) === String(formData.CM_Subcategory_ID)
                          );
                          if (subcategory) handleEditSubcategory(subcategory);
                        }}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 text-sm"
                        title="Edit subcategory"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSubcategory(null);
                      setNewSubcategory({ name: '' });
                      setShowSubcategoryInput(true);
                    }}
                    disabled={!formData.CM_Category_ID}
                    className="p-2 md:p-3 bg-green-500 hover:bg-green-600 text-white rounded transition disabled:opacity-50 text-sm md:text-base"
                  >
                    +
                  </button>
                </div>
                {validationErrors.CM_Subcategory_ID && (
                  <p className="mt-1 text-xs md:text-sm text-red-600">{validationErrors.CM_Subcategory_ID}</p>
                )}

                {showSubcategoryInput && (
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      placeholder="Subcategory name *"
                      value={newSubcategory.name || ''}
                      onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                      className="p-2 text-gray-800 border border-gray-300 rounded text-sm w-full"
                    />

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleCreateEntry('subcategory', newSubcategory)}
                        disabled={!newSubcategory.name?.trim()}
                        className="p-2 text-xs md:text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        {editingSubcategory ? "Update" : "✓"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewSubcategory({ name: '' });
                          setShowSubcategoryInput(false);
                          setEditingSubcategory(null);
                        }}
                        className="p-2 text-xs md:text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Unit Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Unit Type *</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <select
                      name="CM_Unit_Type"
                      value={formData.CM_Unit_Type}
                      onChange={handleChange}
                      className="w-full p-2 md:p-3 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none text-sm md:text-base"
                      required
                    >
                      <option value="">Select Unit Type</option>
                      {unitTypes.map((unit, index) => (
                        <option
                          key={unit?.CM_Unit_ID || `unit-${index}`}
                          value={unit.CM_Unit_ID}
                        >
                          {unit.CM_Unit_Name}
                        </option>
                      ))}
                    </select>

                    {formData.CM_Unit_Type && (
                      <button
                        type="button"
                        onClick={() => {
                          const unitType = unitTypes.find(ut => String(ut.CM_Unit_ID) === String(formData.CM_Unit_Type));
                          if (unitType) handleEditUnitType(unitType);
                        }}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 text-sm"
                        title="Edit unit type"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUnitType(null);
                      setNewUnitType({ name: '', description: '' });
                      setShowUnitTypeInput(true);
                    }}
                    className="p-2 md:p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm md:text-base"
                  >
                    +
                  </button>
                </div>
                {validationErrors.CM_Unit_Type && (
                  <p className="mt-1 text-xs md:text-sm text-red-600">{validationErrors.CM_Unit_Type}</p>
                )}

                {showUnitTypeInput && (
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      placeholder="Unit type name *"
                      value={newUnitType.name || ''}
                      onChange={(e) => setNewUnitType({ ...newUnitType, name: e.target.value })}
                      className="p-2 text-gray-800 border border-gray-300 rounded text-sm w-full"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newUnitType.description || ''}
                      onChange={(e) => setNewUnitType({ ...newUnitType, description: e.target.value })}
                      className="p-2 text-gray-800 border border-gray-300 rounded text-sm w-full"
                    />

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleCreateEntry('unitType', newUnitType)}
                        disabled={!newUnitType.name?.trim()}
                        className="p-2 text-xs md:text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        {editingUnitType ? "Update" : "✓"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewUnitType({ name: '', description: '' });
                          setShowUnitTypeInput(false);
                          setEditingUnitType(null);
                        }}
                        className="p-2 text-xs md:text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* HSN + Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  HSN/ASC Code
                </label>
                <input
                  type="text"
                  name="CM_HSN_ASC_Code"
                  value={formData.CM_HSN_ASC_Code}
                  onChange={handleChange}
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-gray-800 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm md:text-base"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="CM_Is_Status"
                  value={formData.CM_Is_Status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-gray-800 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm md:text-base"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 pt-4 md:pt-6">
              <button
                type="button"
                onClick={() => router.push("/addproduct")}
                className="px-4 md:px-6 py-2 md:py-3 border border-gray-500 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium text-sm md:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium disabled:opacity-50 text-sm md:text-base order-1 sm:order-2"
              >
                {loading ? "Adding..." : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddItemForm;