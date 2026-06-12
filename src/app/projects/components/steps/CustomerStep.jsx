import React, { useEffect, useState } from "react";
import { formatTitleCase, formatSentenceCase } from "../../../utils/textUtils";
import { Trash2, UserPlus, Users, Search, RefreshCw, Check, ArrowRight } from "lucide-react";

const CustomerStep = ({
  customerFormData,
  setCustomerFormData,
  customerErrors,
  setCustomerErrors,
  customerTouched,
  setCustomerTouched,
  customerLoading,
  setCustomerLoading,
  customerMessage,
  setCustomerMessage,
  savedCustomer,
  setSavedCustomer,
  customerSearchQuery,
  setCustomerSearchQuery,
  customerSearchError,
  setCustomerSearchError,
  customerSuggestions,
  setCustomerSuggestions,
  handleChange,
  authUser,
  setActiveStep,
  customers = [],
  loadingCustomers = false,
  refreshCustomers
}) => {
  const [activeCustomerTab, setActiveCustomerTab] = useState("add"); // "add" or "list"
  const [localSearch, setLocalSearch] = useState("");

  const customerFieldLabels = {
    CM_Customer_Name: "Customer Name",
    CM_Email: "Email Address",
    CM_Phone_Number: "Phone Number",
    CM_Alternate_Phone: "Alternate Phone",
    CM_Address: "Address",
    CM_District: "District",
    CM_State: "State",
    CM_Country: "Country",
    CM_Postal_Code: "Postal Code",
    CM_Location: "Town",
    CM_GST_Number: "GST Number",
    CM_PAN_Number: "PAN Number",
    CM_Payment_Terms: "Payment Terms",
    CM_Is_Active: "Status",
    CM_Create_Limit: "Credit Limit"
  };

  const paymentTermsOptions = [
    { value: "UPI", label: "UPI" },
    { value: "10_Days", label: "10 Days" },
    { value: "15_Days", label: "15 Days" },
    { value: "20_Days", label: "20 Days" },
    { value: "30_Days", label: "30 Days" }
  ];

  const handleContinue = () => {
    if (savedCustomer || customerFormData.CM_Customer_ID) {
      setActiveStep(1);
    } else {
      setCustomerMessage("❌ Please save customer details before continuing.");
    }
  };

  const validateCustomerField = (name, value) => {
    let error = "";
    const val = value === undefined || value === null ? "" : String(value).trim();

    switch (name) {
      case "CM_Customer_Name":
        if (!val) error = "Customer name is required";
        else if (val.length < 2) error = "At least 2 characters required";
        break;
      case "CM_Email":
        if (!val) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) error = "Invalid email format";
        break;
      case "CM_Phone_Number":
        if (!val) error = "Phone number is required";
        else if (!/^[0-9]{10}$/.test(val)) error = "Must be a 10-digit number";
        break;
      case "CM_PAN_Number":
        if (!val) error = "PAN number is required";
        else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val)) error = "Invalid PAN format";
        break;
      case "CM_GST_Number":
        if (val && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val))
          error = "Invalid GST format";
        break;
      case "CM_Postal_Code":
        if (!val) error = "Postal code is required";
        else if (!/^[1-9][0-9]{5}$/.test(val)) error = "Invalid postal code";
        break;
      case "CM_Payment_Terms":
        if (!val) error = "Payment terms are required";
        break;
      case "CM_Address":
        if (!val) error = "Address is required";
        break;
      case "CM_District":
        if (!val) error = "District is required";
        break;
      case "CM_State":
        if (!val) error = "State is required";
        break;
      case "CM_Country":
        if (!val) error = "Country is required";
        break;
      case "CM_Location":
        if (!val) error = "Town is required";
        break;
      default:
        break;
    }
    return error;
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (["CM_Customer_Name", "CM_District", "CM_State", "CM_Country", "CM_Location", "CM_Payment_Terms"].includes(name)) {
      formattedValue = formatTitleCase(value);
    } else if (name === "CM_Address") {
      formattedValue = formatSentenceCase(value);
    } else if (name === "CM_GST_Number" || name === "CM_PAN_Number") {
      formattedValue = value.toUpperCase();
    }

    setCustomerFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (customerTouched[name]) {
      const err = validateCustomerField(name, formattedValue);
      setCustomerErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleCustomerBlur = (e) => {
    const { name, value } = e.target;
    setCustomerTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateCustomerField(name, value);
    setCustomerErrors((prev) => ({ ...prev, [name]: err }));
  };

  const validateCustomerForm = () => {
    const requiredFields = [
      "CM_Customer_Name", "CM_Email", "CM_Phone_Number",
      "CM_Address", "CM_District", "CM_State",
      "CM_Country", "CM_Postal_Code", "CM_Location",
      "CM_PAN_Number", "CM_Payment_Terms"
    ];

    const newErrors = {};
    let isValid = true;

    requiredFields.forEach(field => {
      const value = customerFormData[field] ?? "";
      const error = validateCustomerField(field, value);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setCustomerErrors(newErrors);
    return isValid;
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    const allTouched = {};
    Object.keys(customerFormData).forEach((k) => (allTouched[k] = true));
    setCustomerTouched(allTouched);

    if (!validateCustomerForm()) {
      setCustomerMessage("❌ Please fix the errors in the form.");
      return;
    }

    setCustomerLoading(true);
    setCustomerMessage("");

    try {
      const isUpdate = !!customerFormData.CM_Customer_ID;
      const method = "POST";
      const url = isUpdate ? "/api/customers/add?_method=PUT" : "/api/customers/add";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerFormData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || data?.error || `Failed to save customer`;
        setCustomerMessage("❌ " + msg);
        setCustomerLoading(false);
        return;
      }

      const customerId = isUpdate ? customerFormData.CM_Customer_ID : (data?.CM_Customer_ID ?? data?.insertedId ?? data?.insertId);
      if (!customerId) {
        setCustomerMessage(`❌ No customer ID was returned.`);
        setCustomerLoading(false);
        return;
      }

      const saved = { ...customerFormData, CM_Customer_ID: customerId };
      setCustomerFormData(saved);
      setSavedCustomer(saved);

      handleChange({ target: { name: "CM_Customer_ID", value: customerId } });

      if (!isUpdate) {
        handleChange({ target: { name: "CM_Project_Customer", value: customerFormData.CM_Customer_Name } });
        handleChange({ target: { name: "CM_Project_Customer_Phone", value: customerFormData.CM_Phone_Number } });
        handleChange({ target: { name: "CM_Customer_Address", value: customerFormData.CM_Address } });
      }

      setCustomerMessage(`✅ Saved customer successfully!`);
      setCustomerLoading(false);
      if (refreshCustomers) refreshCustomers();
      setTimeout(() => setActiveStep(1), 300);
    } catch (err) {
      console.error("Error saving customer:", err);
      setCustomerMessage("❌ Error saving customer details.");
      setCustomerLoading(false);
    }
  };

  const handleSelectCustomer = async (customer) => {
    setCustomerLoading(true);
    try {
      const res = await fetch(`/api/customers/add?customerId=${encodeURIComponent(customer.CM_Customer_ID)}`);
      if (!res.ok) throw new Error("Failed to load details");
      const data = await res.json();

      setCustomerFormData(data);
      setSavedCustomer(data);
      setCustomerMessage(`✅ Selected customer: ${data.CM_Customer_Name}`);

      handleChange({ target: { name: "CM_Customer_ID", value: data.CM_Customer_ID } });
      handleChange({ target: { name: "CM_Project_Customer", value: data.CM_Customer_Name } });
      handleChange({ target: { name: "CM_Project_Customer_Phone", value: data.CM_Phone_Number } });
      handleChange({ target: { name: "CM_Customer_Address", value: data.CM_Address } });
      
      // Auto switch back to Tab 1 to see/edit details
      setActiveCustomerTab("add");
    } catch (err) {
      console.error(err);
      setCustomerMessage("❌ Failed to select customer.");
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/customers/add?customerId=${customerId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`❌ Failed to delete: ${data.error || data.message || "Unknown error"}`);
        return;
      }

      // If the currently selected customer is deleted, reset form
      if (customerFormData.CM_Customer_ID === customerId) {
        resetForm();
      }

      if (refreshCustomers) refreshCustomers();
      setCustomerMessage("✅ Customer deleted successfully.");
    } catch (err) {
      console.error("Error deleting customer:", err);
      alert("❌ Error deleting customer.");
    }
  };

  const resetForm = () => {
    setCustomerFormData({
      CM_Customer_Name: "",
      CM_Email: "",
      CM_Phone_Number: "",
      CM_Alternate_Phone: "",
      CM_Address: "",
      CM_District: "",
      CM_State: "",
      CM_Country: "India",
      CM_Postal_Code: "",
      CM_Location: "",
      CM_GST_Number: "",
      CM_PAN_Number: "",
      CM_Payment_Terms: "",
      CM_Is_Active: "Active",
      CM_Create_Limit: "",
      CM_Created_By: authUser?.CM_Full_Name ?? "Admin",
      CM_Uploaded_By: authUser?.CM_Full_Name ?? "Admin"
    });
    setSavedCustomer(null);
    setCustomerTouched({});
    setCustomerErrors({});
    setCustomerMessage("");
  };

  const filteredCustomers = customers.filter(c => {
    const q = localSearch.toLowerCase();
    return (
      (c.CM_Customer_Name || "").toLowerCase().includes(q) ||
      (c.CM_Phone_Number || "").includes(q) ||
      (c.CM_Email || "").toLowerCase().includes(q) ||
      (c.CM_Customer_ID || "").toString().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-slate-800">
      {/* Sleek Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveCustomerTab("add")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeCustomerTab === "add"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <UserPlus size={16} />
          {customerFormData.CM_Customer_ID ? "Edit Customer Details" : "Add New Customer"}
        </button>
        <button
          type="button"
          onClick={() => setActiveCustomerTab("list")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeCustomerTab === "list"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Users size={16} />
          Existing Customers ({customers.length})
        </button>
      </div>

      {/* Tab Content 1: Add/Edit Customer */}
      {activeCustomerTab === "add" && (
        <form onSubmit={handleCustomerSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-sm">
                {customerFormData.CM_Customer_ID ? "UPDATE CUSTOMER DETAILS" : "NEW CUSTOMER METADATA RECORD"}
              </h3>
              {customerFormData.CM_Customer_ID && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  Clear / Add New
                </button>
              )}
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Customer Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="CM_Customer_Name"
                  value={customerFormData.CM_Customer_Name || ""}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    customerErrors.CM_Customer_Name && customerTouched.CM_Customer_Name ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="e.g. John Doe / Company Ltd"
                />
                {customerErrors.CM_Customer_Name && customerTouched.CM_Customer_Name && (
                  <p className="text-[11px] text-red-600">{customerErrors.CM_Customer_Name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="CM_Email"
                  value={customerFormData.CM_Email || ""}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    customerErrors.CM_Email && customerTouched.CM_Email ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="example@mail.com"
                />
                {customerErrors.CM_Email && customerTouched.CM_Email && (
                  <p className="text-[11px] text-red-600">{customerErrors.CM_Email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="CM_Phone_Number"
                  value={customerFormData.CM_Phone_Number || ""}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    customerErrors.CM_Phone_Number && customerTouched.CM_Phone_Number ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="10 digit mobile number"
                />
                {customerErrors.CM_Phone_Number && customerTouched.CM_Phone_Number && (
                  <p className="text-[11px] text-red-600">{customerErrors.CM_Phone_Number}</p>
                )}
              </div>

              {/* Alternate Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Alternate Phone</label>
                <input
                  type="text"
                  name="CM_Alternate_Phone"
                  value={customerFormData.CM_Alternate_Phone || ""}
                  onChange={handleCustomerChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Secondary phone (optional)"
                />
              </div>

              {/* Billing Address */}
              <div className="col-span-full space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Billing Address <span className="text-red-500">*</span></label>
                <textarea
                  name="CM_Address"
                  value={customerFormData.CM_Address || ""}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  rows={2}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none ${
                    customerErrors.CM_Address && customerTouched.CM_Address ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="Street name, landmark, etc."
                />
                {customerErrors.CM_Address && customerTouched.CM_Address && (
                  <p className="text-[11px] text-red-600">{customerErrors.CM_Address}</p>
                )}
              </div>

              {/* Location / Town */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Town / Location <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="CM_Location"
                  value={customerFormData.CM_Location || ""}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    customerErrors.CM_Location && customerTouched.CM_Location ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="e.g. Gandhinagar"
                />
                {customerErrors.CM_Location && customerTouched.CM_Location && (
                  <p className="text-[11px] text-red-600">{customerErrors.CM_Location}</p>
                )}
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">District <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="CM_District"
                  value={customerFormData.CM_District || ""}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    customerErrors.CM_District && customerTouched.CM_District ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="District"
                />
                {customerErrors.CM_District && customerTouched.CM_District && (
                  <p className="text-[11px] text-red-600">{customerErrors.CM_District}</p>
                )}
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">State <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="CM_State"
                  value={customerFormData.CM_State || ""}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    customerErrors.CM_State && customerTouched.CM_State ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="State"
                />
                {customerErrors.CM_State && customerTouched.CM_State && (
                  <p className="text-[11px] text-red-600">{customerErrors.CM_State}</p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Country <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="CM_Country"
                  value="India"
                  readOnly
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              {/* Postal Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Postal Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="CM_Postal_Code"
                  value={customerFormData.CM_Postal_Code || ""}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    customerErrors.CM_Postal_Code && customerTouched.CM_Postal_Code ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="6-digit ZIP/PIN code"
                />
                {customerErrors.CM_Postal_Code && customerTouched.CM_Postal_Code && (
                  <p className="text-[11px] text-red-600">{customerErrors.CM_Postal_Code}</p>
                )}
              </div>

              {/* GST Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">GST Number</label>
                <input
                  type="text"
                  name="CM_GST_Number"
                  value={customerFormData.CM_GST_Number || ""}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    customerErrors.CM_GST_Number && customerTouched.CM_GST_Number ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="GSTIN (optional)"
                />
                {customerErrors.CM_GST_Number && customerTouched.CM_GST_Number && (
                  <p className="text-[11px] text-red-600">{customerErrors.CM_GST_Number}</p>
                )}
              </div>

              {/* PAN Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">PAN Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="CM_PAN_Number"
                  value={customerFormData.CM_PAN_Number || ""}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    customerErrors.CM_PAN_Number && customerTouched.CM_PAN_Number ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="10-character PAN card number"
                />
                {customerErrors.CM_PAN_Number && customerTouched.CM_PAN_Number && (
                  <p className="text-[11px] text-red-600">{customerErrors.CM_PAN_Number}</p>
                )}
              </div>

              {/* Payment Terms */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Payment Terms <span className="text-red-500">*</span></label>
                <select
                  name="CM_Payment_Terms"
                  value={customerFormData.CM_Payment_Terms || ""}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white ${
                    customerErrors.CM_Payment_Terms && customerTouched.CM_Payment_Terms ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Payment Terms</option>
                  {paymentTermsOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {customerErrors.CM_Payment_Terms && customerTouched.CM_Payment_Terms && (
                  <p className="text-[11px] text-red-600">{customerErrors.CM_Payment_Terms}</p>
                )}
              </div>

              {/* Credit Limit */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Credit Limit</label>
                <input
                  type="number"
                  name="CM_Create_Limit"
                  value={customerFormData.CM_Create_Limit || ""}
                  onChange={handleCustomerChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Credit limit amount"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions / Success/Error Message */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {customerMessage && (
                <span
                  className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    customerMessage.includes("✅")
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {customerMessage}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={customerLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {customerLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Saving...
                  </>
                ) : customerFormData.CM_Customer_ID ? (
                  "Update Customer"
                ) : (
                  "Save Customer"
                )}
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!savedCustomer && !customerFormData.CM_Customer_ID}
                className="px-5 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Project Details
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab Content 2: Existing Customers */}
      {activeCustomerTab === "list" && (
        <div className="space-y-4">
          {/* Filters & Refresh Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Filter customers by Name, Phone, Email or ID..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            {refreshCustomers && (
              <button
                type="button"
                onClick={refreshCustomers}
                className="px-3.5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <RefreshCw size={14} />
                Refresh Database
              </button>
            )}
          </div>

          {/* Customer Table Grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-12 select-none bg-gray-100/50">#</th>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Customer ID</th>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Customer Name</th>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Contact Details</th>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Location</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500 bg-white">
                        No customers found in database matching your filter query.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust, idx) => {
                      const isSelected = customerFormData.CM_Customer_ID === cust.CM_Customer_ID;
                      return (
                        <tr
                          key={cust.CM_Customer_ID}
                          onDoubleClick={() => handleSelectCustomer(cust)}
                          className={`hover:bg-blue-50/30 cursor-pointer transition ${
                            isSelected ? "bg-blue-50/50 font-medium text-blue-900" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          }`}
                        >
                          <td className="px-4 py-3 border-r border-gray-200 bg-gray-50 text-center font-bold text-gray-500 select-none">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-700 font-mono text-xs">
                            {cust.CM_Customer_ID}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-900 font-semibold">
                            {cust.CM_Customer_Name}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-600">
                            <div className="flex flex-col text-xs space-y-0.5">
                              <span>📞 {cust.CM_Phone_Number}</span>
                              <span className="text-gray-400">{cust.CM_Email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-600 text-xs">
                            {cust.CM_District || "—"}, {cust.CM_State || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSelectCustomer(cust)}
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
                                onClick={(e) => handleDeleteCustomer(cust.CM_Customer_ID, e)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors"
                                title="Delete Customer"
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

export default CustomerStep;
