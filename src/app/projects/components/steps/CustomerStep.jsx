import React, { useEffect } from "react";
import { formatTitleCase, formatSentenceCase } from "../../../utils/textUtils";

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
  loadingCustomers = false
}) => {
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
    CM_Create_Limit: "Credit Limit",
    CM_Created_By: "Created By",
    CM_Uploaded_By: "Uploaded By",
  };

  // Payment terms options
  const paymentTermsOptions = [
    { value: "UPI", label: "UPI" },
    { value: "10_Days", label: "10 Days" },
    { value: "15_Days", label: "15 Days" },
    { value: "20_Days", label: "20 Days" },
    { value: "30_Days", label: "30 Days" }
  ];

  // Load customer suggestions from provided customer list
  useEffect(() => {
    if (customerSearchQuery && customerSearchQuery.length >= 3) {
      const query = customerSearchQuery.toLowerCase();
      const matches = customers.filter(customer =>
        customer.CM_Customer_Name.toLowerCase().includes(query) ||
        customer.CM_Phone_Number.includes(query) ||
        (customer.CM_Email && customer.CM_Email.toLowerCase().includes(query)) ||
        (customer.CM_Customer_ID && customer.CM_Customer_ID.toString().includes(query))
      ).slice(0, 10); // Limit to 10 results

      setCustomerSuggestions(matches);
    } else {
      setCustomerSuggestions([]);
    }
  }, [customerSearchQuery, customers]);
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
        else if (val.length < 2) error = "Customer name must be at least 2 characters";
        break;

      case "CM_Email":
        if (!val) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) error = "Please enter a valid email address";
        break;

      case "CM_Phone_Number":
        if (!val) error = "Phone number is required";
        else if (!/^[0-9]{10}$/.test(val)) error = "Please enter a valid 10-digit phone number";
        break;

      case "CM_PAN_Number":
        if (!val) error = "PAN number is required";
        else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val)) error = "Please enter a valid PAN number";
        break;

      case "CM_GST_Number":
        if (val && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val))
          error = "Please enter a valid GST number";
        break;

      case "CM_Postal_Code":
        if (!val) error = "Postal code is required";
        else if (!/^[1-9][0-9]{5}$/.test(val)) error = "Please enter a valid postal code";
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
        // For any other required fields
        if (!val && name.startsWith("CM_") &&
          name !== "CM_Alternate_Phone" &&
          name !== "CM_GST_Number" &&
          name !== "CM_Create_Limit")
          error = `${customerFieldLabels[name] || name} is required`;
    }

    return error;
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (
      ["CM_Customer_Name", "CM_District", "CM_State", "CM_Country", "CM_Location", "CM_Payment_Terms"].includes(name)
    ) {
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
      "CM_PAN_Number", "CM_Payment_Terms", "CM_Is_Active"
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

    // Mark all fields as touched for validation
    const allTouched = {};
    Object.keys(customerFormData).forEach((k) => (allTouched[k] = true));
    setCustomerTouched(allTouched);

    if (!validateCustomerForm()) {
      setCustomerMessage("❌ Please fix the errors in the form.");
      console.log("Validation errors:", customerErrors);
      return;
    }

    setCustomerLoading(true);
    setCustomerMessage("");

    try {
      // Determine if this is an update (existing customer ID) or insert
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
        const msg = data?.message || data?.error || `Failed to ${isUpdate ? 'update' : 'add'} customer`;
        setCustomerMessage("❌ " + msg);
        setCustomerLoading(false);
        return;
      }

      // Get the customer ID either from existing data or the response
      const customerId = isUpdate ?
        customerFormData.CM_Customer_ID :
        (data?.CM_Customer_ID ?? data?.insertedId ?? data?.insertId);

      if (!customerId) {
        setCustomerMessage(`❌ Customer ${isUpdate ? 'updated' : 'added'} but no ID returned.`);
        setCustomerLoading(false);
        return;
      }

      // Update with complete customer data including ID
      const saved = {
        ...customerFormData,
        CM_Customer_ID: customerId
      };

      // Update states and form data
      setCustomerFormData(saved);
      setSavedCustomer(saved);

      // Always update the customer ID in the form data for linking in the project
      handleChange({ target: { name: "CM_Customer_ID", value: customerId } });

      // Only when creating a new customer, also set these fields for project form
      if (!isUpdate) {
        handleChange({ target: { name: "CM_Project_Customer", value: customerFormData.CM_Customer_Name } });
        handleChange({ target: { name: "CM_Project_Customer_Phone", value: customerFormData.CM_Phone_Number } });
        handleChange({ target: { name: "CM_Customer_Address", value: customerFormData.CM_Address } });
      }

      setCustomerMessage(`✅ Customer ${isUpdate ? 'updated' : 'added'} successfully!`);
      setCustomerLoading(false);
      setTimeout(() => setActiveStep(1), 300);
    } catch (err) {
      console.error("Error handling customer operation:", err);
      setCustomerMessage("❌ Something went wrong during customer operation.");
      setCustomerLoading(false);
    }
  };

  const handleCustomerSearch = async () => {
    if (!customerSearchQuery) return;

    setCustomerSearchError('');
    setCustomerLoading(true);

    try {
      const res = await fetch(`/api/customers/add?customerId=${encodeURIComponent(customerSearchQuery)}`);

      if (!res.ok) {
        if (res.status === 404) {
          setCustomerSearchError('Customer not found');
        } else {
          setCustomerSearchError('Error fetching customer data');
        }
        setCustomerLoading(false);
        return;
      }

      const data = await res.json();

      // Populate the customer form with the found customer data
      setCustomerFormData(data);

      setCustomerSearchError('');
      setCustomerMessage('✅ Customer details loaded successfully! You can proceed to create a new project for this customer.');

      // Clear the search query after successful search
      setCustomerSearchQuery('');
      setCustomerSuggestions([]);
    } catch (err) {
      console.error('Error searching for customer:', err);
      setCustomerSearchError('Failed to fetch customer data');
    } finally {
      setCustomerLoading(false);
    }
  };

  // New function to handle customer selection from suggestions
  const handleCustomerSelection = async (customerId) => {
    if (!customerId) return;

    setCustomerSearchError('');
    setCustomerLoading(true);
    setCustomerSuggestions([]); // Clear suggestions after selection

    try {
      const res = await fetch(`/api/customers/add?customerId=${encodeURIComponent(customerId)}`);

      if (!res.ok) {
        if (res.status === 404) {
          setCustomerSearchError('Customer not found');
        } else {
          setCustomerSearchError('Error fetching customer data');
        }
        setCustomerLoading(false);
        return;
      }

      const data = await res.json();

      // Populate the customer form with the found customer data
      setCustomerFormData(data);

      setCustomerSearchError('');
      setCustomerMessage('✅ Customer details loaded successfully! You can proceed to create a new project for this customer.');

      // Clear the search query after successful search
      setCustomerSearchQuery('');
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setCustomerSearchError('Failed to fetch customer data');
    } finally {
      setCustomerLoading(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    const defaultFormData = {
      CM_Customer_ID: customerFormData.CM_Customer_ID || "", // Preserve ID if exists
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
      CM_Uploaded_By: authUser?.CM_Full_Name ?? "Admin",
    };

    setCustomerFormData(defaultFormData);
    setCustomerTouched({});
    setCustomerErrors({});
    setCustomerMessage("");
  };

  return (
    <div className="min-h-full text-black">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {savedCustomer?.CM_Customer_ID ? "Edit Customer" : "Customer Management"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {savedCustomer?.CM_Customer_ID
                ? "Update existing customer details"
                : "Add new customer or search existing ones"}
            </p>
          </div>
          {savedCustomer?.CM_Customer_ID && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Editing Mode
            </span>
          )}
        </div>
      </div>

      {/* Unified Header with Search and Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8 ">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Customer Search</h2>
            <p className="text-gray-500 text-sm">Find existing customers by ID, name, email, or phone number</p>
          </div>
          {!savedCustomer?.CM_Customer_ID && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 text-sm font-medium flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Clear Form
            </button>
          )}
        </div>

        {/* Enhanced Search Bar */}
        <div className="relative mb-4">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by Customer Name, Email, or Phone Number..."
              className="w-full pl-12 pr-4 py-3.5 text-gray-900 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300 bg-white shadow-sm"
              value={customerSearchQuery || ''}
              onChange={e => setCustomerSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
            />
            <button
              type="button"
              onClick={handleCustomerSearch}
              disabled={!customerSearchQuery || customerLoading}
              className="absolute right-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-sm"
            >
              {customerLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  Search Customer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {customerSearchError && (
            <div className="mt-3 p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-red-700">{customerSearchError}</div>
            </div>
          )}
        </div>

        {/* Customer Suggestions */}
        {customerSuggestions.length > 0 && (
          <div className="bg-white border-2 border-gray-500 rounded-xl shadow-sm overflow-hidden mt-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Select Customer</h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {customerSuggestions.map(customer => (
                <div
                  key={customer.CM_Customer_ID}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-all duration-150 border-b border-gray-100 last:border-b-0"
                  onClick={() => handleCustomerSelection(customer.CM_Customer_ID)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{customer.CM_Customer_Name}</div>
                      <div className="text-sm text-gray-500 mt-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {customer.CM_Email}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {customer.CM_Phone_Number}
                          </span>
                        </div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingCustomers && !customerSuggestions.length && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span className="text-gray-600 font-medium">Loading customer database...</span>
            </div>
          </div>
        )}
      </div>

      {/* Customer Form */}
      {(!customerSuggestions.length || savedCustomer?.CM_Customer_ID) && (
        <form onSubmit={handleCustomerSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Basic & Admin Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information Card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                      <p className="text-sm text-gray-500 mt-1">Primary contact details</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {["CM_Customer_Name", "CM_Email", "CM_Phone_Number", "CM_Alternate_Phone"].map((key) => (
                      <div key={key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {customerFieldLabels[key] || key}
                          {key !== "CM_Alternate_Phone" && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                          type={key.includes("Email") ? "email" : "text"}
                          name={key}
                          value={customerFormData[key] || ""}
                          onChange={handleCustomerChange}
                          onBlur={handleCustomerBlur}
                          className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${customerErrors[key] ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                          placeholder={`Enter ${customerFieldLabels[key]}`}
                        />
                        {customerErrors[key] && customerTouched[key] && (
                          <p className="text-xs text-red-600 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            {customerErrors[key]}
                          </p>
                        )}
                        {key === "CM_Alternate_Phone" && !customerErrors[key] && (
                          <p className="text-xs text-gray-500">Optional secondary contact number</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Address Details Card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Address Details</h3>
                      <p className="text-sm text-gray-500 mt-1">Shipping and billing information</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {customerFieldLabels["CM_Address"]}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <textarea
                        name="CM_Address"
                        value={customerFormData["CM_Address"] || ""}
                        onChange={handleCustomerChange}
                        onBlur={handleCustomerBlur}
                        rows={3}
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${customerErrors["CM_Address"] ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                          }`}
                        placeholder="Enter complete address"
                      />
                      {customerErrors["CM_Address"] && customerTouched["CM_Address"] && (
                        <p className="text-xs text-red-600 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          {customerErrors["CM_Address"]}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {["CM_Location", "CM_District", "CM_State", "CM_Country", "CM_Postal_Code"].map((key) => (
                        <div key={key} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {customerFieldLabels[key]}
                            {key !== "CM_Country" && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {key === "CM_Country" ? (
                            <input
                              type="text"
                              name={key}
                              value="India"
                              readOnly
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                            />
                          ) : (
                            <input
                              type="text"
                              name={key}
                              value={customerFormData[key] || ""}
                              onChange={handleCustomerChange}
                              onBlur={handleCustomerBlur}
                              className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${customerErrors[key] ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                                }`}
                              placeholder={`Enter ${customerFieldLabels[key]}`}
                            />
                          )}
                          {customerErrors[key] && customerTouched[key] && (
                            <p className="text-xs text-red-600 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              {customerErrors[key]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Tax, Financial & Admin Info */}
            <div className="space-y-8">
              {/* Tax & Financial Information Card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Tax & Financial</h3>
                      <p className="text-sm text-gray-500 mt-1">Business registration details</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {["CM_GST_Number", "CM_PAN_Number", "CM_Payment_Terms", "CM_Create_Limit"].map((key) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {customerFieldLabels[key]}
                        {/* Mandatory ONLY if needed (currently none are mandatory) */}
                      </label>

                      {/* Always render input */}
                      <input
                        type="text"
                        name={key}
                        value={customerFormData[key] || ""}
                        onChange={handleCustomerChange}
                        onBlur={handleCustomerBlur}
                        className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${customerErrors[key]
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                        placeholder={`Enter ${customerFieldLabels[key]}`}
                      />

                      {customerErrors[key] && customerTouched[key] && (
                        <p className="text-xs text-red-600 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {customerErrors[key]}
                        </p>
                      )}

                      {/* Optional message */}
                      {!customerErrors[key] && (
                        <p className="text-xs text-gray-500">Optional field</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Administrative Details Card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <button
                      type="submit"
                      disabled={customerLoading}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow"
                    >
                      {customerLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : customerFormData.CM_Customer_ID ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Update Customer
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add New Customer
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleContinue}
                      disabled={!savedCustomer && !customerFormData.CM_Customer_ID}
                      className="w-full px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue Without Saving
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Message */}
          {customerMessage && (
            <div className={`p-4 rounded-xl border ${customerMessage.includes("✅")
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
              }`}>
              <div className="flex items-start gap-3">
                {customerMessage.includes("✅") ? (
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="text-sm">{customerMessage}</div>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default CustomerStep;
