"use client";

import {
  Loader2,
  TabletSmartphone,
  Mail,
  Briefcase,
  MapPin,
  User,
  Building,
  Key,
  Check,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";


const AUTH_SCREENS = ["login", "addProprietor", "forgot"];

function CreateCompany() {
  const [currentScreen, setCurrentScreen] = useState("login");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyId: "",
    companyCode: "",
    companyName: "",
    companyType: "",
    companyPhone: "",
    email: "",
    address: "",
    district: "",
    state: "",
    country: "",
    postalCode: "",
    gstNumber: "",
    panNumber: "",
    isStatus: "Active",
    companyOwner: "",
    ownerPhone: "",
    alternatePhone: "",
    logo: null,
  });

  const [proprietorData, setProprietorData] = useState({
    CM_Full_Name: "",
    CM_Phone_Number: "",
    CM_Alternative_Phone: "",
    CM_Email: "",
    CM_Address: "",
    CM_District: "",
    CM_State: "",
    CM_Country: "",
    CM_Postal_Code: "",
    CM_Company_ID: "",
    CM_Role_ID: "",
    CM_Photo_URL: null,
    CM_Password: "",
    CM_Is_Active: "Active",
  });

  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetchCompanies();
    fetchRoles();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/get-companies");
      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Could not load companies");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/get-role");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Could not load roles");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }));
    }
  };

  const handleInputChangeProprietor = (field, value) => {
    setProprietorData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!formData.companyName?.trim()) return toast.error("Company Name is required");
    if (!formData.companyType) return toast.error("Company Type is required");
    if (!formData.companyPhone?.trim()) return toast.error("Company Phone is required");
    if (!formData.email?.trim()) return toast.error("Email is required");
    if (!formData.address?.trim()) return toast.error("Address is required");
    if (!formData.state || !formData.country || !formData.postalCode)
      return toast.error("State, Country, and Postal Code are required");

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) data.append(key, value);
    });

    try {
      const res = await fetch("/api/create-company", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Failed to create company");

      toast.success("✅ Company added successfully!");
      setFormData({
        companyId: "",
        companyCode: "",
        companyName: "",
        companyType: "",
        companyPhone: "",
        email: "",
        address: "",
        district: "",
        state: "",
        country: "",
        postalCode: "",
        gstNumber: "",
        panNumber: "",
        isStatus: "Active",
        companyOwner: "",
        ownerPhone: "",
        alternatePhone: "",
        logo: null,
      });
      setCurrentScreen("addProprietor");
      await fetchCompanies();
    } catch (error) {
      toast.error("❌ Failed to add company");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProprietor = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!proprietorData.CM_Full_Name?.trim()) return toast.error("Full Name is required");
    if (!proprietorData.CM_Phone_Number?.trim()) return toast.error("Phone is required");
    if (!proprietorData.CM_Email?.trim()) return toast.error("Email is required");
    if (!proprietorData.CM_Company_ID) return toast.error("Company is required");
    if (!proprietorData.CM_Role_ID) return toast.error("Role is required");

    const data = new FormData();
    Object.entries(proprietorData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) data.append(key, value);
    });

    try {
      const res = await fetch("/api/create-proprietor", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to add proprietor");

      toast.success("✅ Proprietor added successfully!");
      setProprietorData({
        CM_Full_Name: "",
        CM_Phone_Number: "",
        CM_Alternative_Phone: "",
        CM_Email: "",
        CM_Address: "",
        CM_District: "",
        CM_State: "",
        CM_Country: "",
        CM_Postal_Code: "",
        CM_Company_ID: "",
        CM_Role_ID: "",
        CM_Photo_URL: null,
        CM_Password: "",
        CM_Is_Active: "Active",
      });
    } catch (error) {
      toast.error("❌ Failed to add proprietor");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Animation logic
  const getScreenTransform = (screen) => {
    if (screen === currentScreen) return "translateX(0) opacity-100";
    const currentIndex = AUTH_SCREENS.indexOf(currentScreen);
    const screenIndex = AUTH_SCREENS.indexOf(screen);
    const direction = screenIndex < currentIndex ? "-translate-x-full" : "translate-x-full";
    return `${direction} opacity-0`;
  };

  // Render Functions

  const renderLoginScreen = () => (
    <div
      className="transform transition-all duration-500 ease-in-out"
      style={{ opacity: currentScreen === "login" ? 1 : 0 }}
    >
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Welcome to Cost Management
        </h2>
        <p className="text-gray-200 text-lg">Add New Company</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Code */}
        <div className="relative">
          <input
            type="text"
            placeholder="Company Code "
            value={formData.companyCode}
            onChange={(e) => handleInputChange("companyCode", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            readOnly
          />
        </div>

        {/* Company Name */}
        <div className="relative">
          <input
            type="text"
            placeholder="Company Name"
            value={formData.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          />
        </div>

        {/* Company Type */}
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <select
            value={formData.companyType}
            onChange={(e) => handleInputChange("companyType", e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          >
            <option value="" disabled className="text-black">
              Select Company Type
            </option>
            {["Proprietorship", "Partnership", "Private Limited", "Public Limited", "LLP", "Other"].map((type) => (
              <option key={type} value={type} className="text-black">
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Phone */}
        <div className="relative">
          <TabletSmartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="tel"
            placeholder="Company Phone"
            value={formData.companyPhone}
            onChange={(e) => handleInputChange("companyPhone", e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          />
        </div>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          />
        </div>

        {/* Address */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Company Address"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          />
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="District (optional)"
            value={formData.district}
            onChange={(e) => handleInputChange("district", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
          />
          <input
            type="text"
            placeholder="State"
            value={formData.state}
            onChange={(e) => handleInputChange("state", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Country"
            value={formData.country}
            onChange={(e) => handleInputChange("country", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          />
          <input
            type="text"
            placeholder="Postal Code"
            value={formData.postalCode}
            onChange={(e) => handleInputChange("postalCode", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          />
        </div>

        {/* Tax IDs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="GST Number (optional)"
            value={formData.gstNumber}
            onChange={(e) => handleInputChange("gstNumber", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
          />
          <input
            type="text"
            placeholder="PAN Number (optional)"
            value={formData.panNumber}
            onChange={(e) => handleInputChange("panNumber", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
          />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={formData.isStatus}
            onChange={(e) => handleInputChange("isStatus", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
          >
            <option value="Active" className="text-black">Active</option>
            <option value="Inactive" className="text-black">Inactive</option>
          </select>
        </div>

        {/* Owner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Company Owner (optional)"
              value={formData.companyOwner}
              onChange={(e) => handleInputChange("companyOwner", e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            />
          </div>
          <div className="relative">
            <TabletSmartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="tel"
              placeholder="Owner Phone (optional)"
              value={formData.ownerPhone}
              onChange={(e) => handleInputChange("ownerPhone", e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            />
          </div>
        </div>

        {/* Alternate Phone */}
        <div className="relative">
          <TabletSmartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="tel"
            placeholder="Alternate Phone (optional)"
            value={formData.alternatePhone}
            onChange={(e) => handleInputChange("alternatePhone", e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">Company Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-300 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-purple-600 file:font-semibold hover:file:bg-gray-50 cursor-pointer"
          />
          {formData.logo && (
            <div className="mt-2 flex items-center space-x-2 text-green-300 text-xs">
              <Check className="h-4 w-4" />
              <span>Uploaded: {formData.logo.name}</span>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gradient-to-r hover:from-white hover:to-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center group"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
              Add Company
            </>
          )}
        </button>
      </form>

      <button
        onClick={() => setCurrentScreen("addProprietor")}
        className="mt-6 w-full py-2 text-white font-medium hover:underline transition-all duration-200 text-center text-sm"
      >
        ➜ Go to Add Proprietor
      </button>
    </div>
  );

  const addProprietor = () => (
    <div
      className="transform transition-all duration-500 ease-in-out"
      style={{ opacity: currentScreen === "addProprietor" ? 1 : 0 }}
    >
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Add Proprietor
        </h2>
        <p className="text-gray-200 text-lg">Assign to a Company</p>
      </div>

      <form onSubmit={handleSubmitProprietor} className="space-y-4">
        {/* Name */}
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Full Name"
            value={proprietorData.CM_Full_Name}
            onChange={(e) => handleInputChangeProprietor("CM_Full_Name", e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          />
        </div>

        {/* Mobile */}
        <div className="relative">
          <TabletSmartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="tel"
            placeholder="Mobile Number"
            value={proprietorData.CM_Phone_Number}
            maxLength={10}
            onChange={(e) => handleInputChangeProprietor("CM_Phone_Number", e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          />
        </div>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="email"
            placeholder="Email"
            value={proprietorData.CM_Email}
            onChange={(e) => handleInputChangeProprietor("CM_Email", e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          />
        </div>

        {/* Address */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <textarea
            placeholder="Address"
            value={proprietorData.CM_Address}
            onChange={(e) => handleInputChangeProprietor("CM_Address", e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            rows="2"
          />
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="District"
            value={proprietorData.CM_District}
            onChange={(e) => handleInputChangeProprietor("CM_District", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
          />
          <input
            type="text"
            placeholder="State"
            value={proprietorData.CM_State}
            onChange={(e) => handleInputChangeProprietor("CM_State", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Country"
            value={proprietorData.CM_Country}
            onChange={(e) => handleInputChangeProprietor("CM_Country", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
          />
          <input
            type="text"
            placeholder="Postal Code"
            value={proprietorData.CM_Postal_Code}
            maxLength={6}
            onChange={(e) => handleInputChangeProprietor("CM_Postal_Code", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
          />
        </div>

        {/* Company */}
        <div className="relative">
          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <select
            value={proprietorData.CM_Company_ID}
            onChange={(e) => handleInputChangeProprietor("CM_Company_ID", e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          >
            <option value="" disabled className="text-black">
              Select Company
            </option>
            {companies.map((c) => (
              <option key={c.CM_Company_ID} value={c.CM_Company_ID} className="text-black">
                {c.CM_Company_Name}
              </option>
            ))}
          </select>
        </div>

        {/* Role */}
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <select
            value={proprietorData.CM_Role_ID}
            onChange={(e) => handleInputChangeProprietor("CM_Role_ID", e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
            required
          >
            <option value="" disabled className="text-black">
              Select Role
            </option>
            {roles.map((r) => (
              <option key={r.CM_Role_ID} value={r.CM_Role_ID} className="text-black">
                {r.CM_Role_Description}
              </option>
            ))}
          </select>
        </div>

        {/* Photo Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleInputChangeProprietor("CM_Photo_URL", file);
            }}
            className="w-full text-sm text-gray-300 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-purple-600 hover:file:bg-gray-50 cursor-pointer"
          />
          {proprietorData.CM_Photo_URL && (
            <div className="mt-2 text-green-300 text-xs flex items-center">
              <Check className="h-4 w-4 mr-1" />
              Photo selected
            </div>
          )}
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={proprietorData.CM_Is_Active}
            onChange={(e) => handleInputChangeProprietor("CM_Is_Active", e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent focus:shadow-lg transition-all duration-200"
          >
            <option value="Active" className="text-black">Active</option>
            <option value="Inactive" className="text-black">Inactive</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gradient-to-r hover:from-white hover:to-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Adding...
            </>
          ) : (
            "Add Proprietor"
          )}
        </button>
      </form>

      <button
        onClick={() => setCurrentScreen("login")}
        className="mt-6 w-full py-2 text-white font-medium hover:underline transition-all duration-200 text-center text-sm"
      >
        ← Back to Company
      </button>
    </div>
  );

  return (
  <div className="h-screen bg-[#25252b] flex items-center justify-center p-4 relative overflow-hidden">
    {/* Animated Background */}
    <div className="absolute inset-0 overflow-y-auto">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>

    {/* Main Card */}
    <div className="relative z-10 w-full max-w-md">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        <div className="relative h-auto overflow-hidden">
          {/* Login Screen */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              currentScreen === "login" 
                ? "translate-x-0 opacity-100" 
                : "-translate-x-full opacity-0 absolute inset-0"
            }`}
          >
            {renderLoginScreen()}
          </div>

          {/* Proprietor Screen */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              currentScreen === "addProprietor" 
                ? "translate-x-0 opacity-100" 
                : "translate-x-full opacity-0 absolute inset-0"
            }`}
          >
            {addProprietor()}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

export default CreateCompany;