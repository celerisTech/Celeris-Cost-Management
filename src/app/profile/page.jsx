"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthScreenStore";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Edit3,
  Save,
  X,
  Camera,
  Shield,
  Globe,
  UserCheck,
  Building2,
  Crown,
  PhoneCall,
  Hash,
  Users,
  ChevronDown,
  Upload,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Fetch user + company data once
  useEffect(() => {
    if (user?.CM_User_ID) {
      async function fetchProfile() {
        try {
          const res = await fetch(`/api/update-profile?userId=${user.CM_User_ID}`);
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
            setForm({ ...data.user, company: data.user.company || {} });
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
      fetchProfile();
    }
  }, [user?.CM_User_ID, setUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Check if field belongs to company
    const companyFields = [
      'CM_Company_Code', 'CM_Company_Name', 'CM_Company_Type',
      'CM_Company_Logo', 'CM_Company_Phone', 'CM_Company_Owner',
      'CM_Company_Email', 'CM_Company_Address', 'CM_Company_District',
      'CM_Company_State', 'CM_Company_Country', 'CM_Company_Postal_Code',
      'CM_GST_Number', 'CM_PAN_Number', 'CM_Owner_Phone',
      'CM_Alternate_Phone'
    ];

    if (companyFields.includes(name)) {
      setForm((prev) => ({
        ...prev,
        company: { ...prev.company, [name]: value }
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.CM_User_ID) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CM_User_ID: user.CM_User_ID,
          CM_Company_ID: form.company?.CM_Company_ID,
          // User fields
          CM_Full_Name: form.CM_Full_Name,
          CM_Email: form.CM_Email,
          CM_Phone_Number: form.CM_Phone_Number,
          CM_Alternative_Phone: form.CM_Alternative_Phone,
          CM_Address: form.CM_Address,
          CM_District: form.CM_District,
          CM_State: form.CM_State,
          CM_Country: form.CM_Country,
          CM_Postal_Code: form.CM_Postal_Code,
          CM_Photo_URL: form.CM_Photo_URL,
          CM_Is_Active: form.CM_Is_Active,
          // Company fields
          company: {
            CM_Company_Code: form.company?.CM_Company_Code,
            CM_Company_Name: form.company?.CM_Company_Name,
            CM_Company_Type: form.company?.CM_Company_Type,
            CM_Company_Logo: form.company?.CM_Company_Logo,
            CM_Company_Phone: form.company?.CM_Company_Phone,
            CM_Company_Owner: form.company?.CM_Company_Owner,
            CM_Company_Email: form.company?.CM_Company_Email,
            CM_Company_Address: form.company?.CM_Company_Address,
            CM_Company_District: form.company?.CM_Company_District,
            CM_Company_State: form.company?.CM_Company_State,
            CM_Company_Country: form.company?.CM_Company_Country,
            CM_Company_Postal_Code: form.company?.CM_Company_Postal_Code,
            CM_GST_Number: form.company?.CM_GST_Number,
            CM_PAN_Number: form.company?.CM_PAN_Number,
            CM_Owner_Phone: form.company?.CM_Owner_Phone,
            CM_Alternate_Phone: form.company?.CM_Alternate_Phone,
          }
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setIsEditing(false);

        // Update the store with new data
        const updatedUser = {
          ...user,
          ...form,
          company: form.company
        };
        setUser(updatedUser);

        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setMessage({ type: "", text: "" });
        }, 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Error updating profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ ...user, company: user.company || {} });
    setIsEditing(false);
    setMessage({ type: "", text: "" });
    setImageError(false);
    setLogoError(false);
  };

  const getInitials = (name) => {
    return name ? name.split(" ").map((n) => n[0]).join("").toUpperCase() : "UN";
  };

  if (!user) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium text-gray-700">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Navbar />
      <div className="h-screen overflow-y-auto py-4 sm:py-8 flex-1 p-2 sm:p-4">
        <div className="mx-auto px-2 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-8">
            <div className="h-32 sm:h-40 bg-gradient-to-r from-blue-150 to-indigo-100 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

              {/* Company Logo + Name */}
              {form.company?.CM_Company_Logo && (
                <div className="absolute top-3 right-3 sm:top-6 sm:right-6 bg-white/90 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-lg flex items-center space-x-2 sm:space-x-3 max-w-[60%] sm:max-w-[40%]">
                  {!logoError ? (
                    <img
                      src={form.company?.CM_Company_Logo}
                      alt="Company Logo"
                      className="h-7 w-7 sm:h-10 sm:w-10 object-contain rounded-lg flex-shrink-0"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="h-7 w-7 sm:h-10 sm:w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                  )}
                  {form.company?.CM_Company_Name && (
                    <span className="text-gray-800 font-semibold text-xs sm:text-sm md:text-base truncate">
                      {form.company?.CM_Company_Name}
                    </span>
                  )}
                </div>
              )}

              {/* Profile Section */}
              <div className="absolute -bottom-14 sm:-bottom-16 left-4 sm:left-8 flex items-end space-x-4 sm:space-x-6">
                <div className="relative group">
                  {form.CM_Photo_URL && !imageError ? (
                    <img
                      src={form.CM_Photo_URL}
                      alt="Profile"
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-xl object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                      {getInitials(form.CM_Full_Name)}
                    </div>
                  )}

                  {isEditing && (
                    <button className="absolute bottom-2 right-2 bg-blue-600 text-white p-1.5 sm:p-2 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-110 group-hover:opacity-100 opacity-90">
                      <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-16 sm:pt-20 pb-4 text-gray-900 sm:pb-6 px-4 sm:px-8 flex flex-col md:flex-row items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1 w-full">
                {isEditing ? (
                  <input
                    type="text"
                    name="CM_Full_Name"
                    value={form.CM_Full_Name || ""}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 break-words">
                    {form.CM_Full_Name || "User Name"}
                  </h1>
                )}

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-600 mb-3 sm:mb-4">
                  {form.company?.CM_Company_Name && (
                    <span className="flex items-center bg-gray-100 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                      <Building className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {form.company?.CM_Company_Name}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <div
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex items-center ${form.CM_Is_Active === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                      }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2 ${form.CM_Is_Active === "Active" ? "bg-green-500" : "bg-red-500"
                        }`}
                    ></div>
                    {form.CM_Is_Active || "Inactive"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto mt-3 md:mt-0">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2 sm:gap-3 w-full">
                    <button
                      onClick={handleCancel}
                      className="flex-1 md:flex-none bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                      <span>{loading ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-center ${message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
                }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              )}
              <span className="text-sm sm:text-base">{message.text}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-8">
            <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("personal")}
                className={`min-w-max px-4 sm:px-6 py-3 sm:py-4 text-center text-sm font-medium transition-all duration-200 flex items-center ${activeTab === "personal"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                Personal
              </button>
              <button
                onClick={() => setActiveTab("company")}
                className={`min-w-max px-4 sm:px-6 py-3 sm:py-4 text-center text-sm font-medium transition-all duration-200 flex items-center ${activeTab === "company"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                Company
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {activeTab === "personal" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-gray-900">
                  {!isEditing ? (
                    /* Display Mode */
                    <>
                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-800">Full Name</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.CM_Full_Name || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Email Address</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base overflow-hidden">
                          <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{form.CM_Email || "Not provided"}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Phone Number</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.CM_Phone_Number || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Alternative Phone</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.CM_Alternative_Phone || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Postal Code</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Hash className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.CM_Postal_Code || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Address</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.CM_Address || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">District</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.CM_District || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">State</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.CM_State || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Country</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Globe className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.CM_Country || "Not provided"}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Edit Mode */
                    <>
                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Full Name</label>
                        <input
                          type="text"
                          name="CM_Full_Name"
                          value={form.CM_Full_Name || ""}
                          onChange={handleChange}
                          placeholder="Full Name"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="email"
                            name="CM_Email"
                            value={form.CM_Email || ""}
                            onChange={handleChange}
                            placeholder="Email Address"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="tel"
                            name="CM_Phone_Number"
                            value={form.CM_Phone_Number || ""}
                            onChange={handleChange}
                            placeholder="Phone Number"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Alternative Phone</label>
                        <div className="relative">
                          <PhoneCall className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="tel"
                            name="CM_Alternative_Phone"
                            value={form.CM_Alternative_Phone || ""}
                            onChange={handleChange}
                            placeholder="Alternative Phone"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Postal Code</label>
                        <input
                          type="text"
                          name="CM_Postal_Code"
                          value={form.CM_Postal_Code || ""}
                          onChange={handleChange}
                          placeholder="Postal Code"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 sm:top-3 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="text"
                            name="CM_Address"
                            value={form.CM_Address || ""}
                            onChange={handleChange}
                            placeholder="Address"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">District</label>
                        <input
                          type="text"
                          name="CM_District"
                          value={form.CM_District || ""}
                          onChange={handleChange}
                          placeholder="District"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">State</label>
                        <input
                          type="text"
                          name="CM_State"
                          value={form.CM_State || ""}
                          onChange={handleChange}
                          placeholder="State"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Country</label>
                        <input
                          type="text"
                          name="CM_Country"
                          value={form.CM_Country || ""}
                          onChange={handleChange}
                          placeholder="Country"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "company" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {!isEditing ? (
                    /* Display Mode */
                    <>
                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Company Name</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Company_Name || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Company Code</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Hash className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Company_Code || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Company Type</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Company_Type || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Company Owner</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Crown className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Company_Owner || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Company Email</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base overflow-hidden">
                          <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{form.company?.CM_Company_Email || "Not provided"}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Company Phone</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Company_Phone || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Owner Phone</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Owner_Phone || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Alternate Phone</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Alternate_Phone || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">GST Number</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Hash className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_GST_Number || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">PAN Number</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Hash className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_PAN_Number || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Company Address</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Company_Address || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">District</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Company_District || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">State</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Company_State || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Country</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Globe className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Company_Country || "Not provided"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Postal Code</div>
                        <div className="flex items-center text-gray-900 p-2 rounded-lg bg-gray-50 text-sm sm:text-base">
                          <Hash className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                          {form.company?.CM_Company_Postal_Code || "Not provided"}
                        </div>
                      </div>

                    </>
                  ) : (
                    /* Edit Mode */
                    <>
                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Company Name</label>
                        <input
                          type="text"
                          name="CM_Company_Name"
                          value={form.company?.CM_Company_Name || ""}
                          onChange={handleChange}
                          placeholder="Company Name"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Company Code</label>
                        <input
                          type="text"
                          name="CM_Company_Code"
                          value={form.company?.CM_Company_Code || ""}
                          onChange={handleChange}
                          placeholder="Company Code"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Company Type</label>
                        <input
                          type="text"
                          name="CM_Company_Type"
                          value={form.company?.CM_Company_Type || ""}
                          onChange={handleChange}
                          placeholder="Company Type"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Company Owner</label>
                        <input
                          type="text"
                          name="CM_Company_Owner"
                          value={form.company?.CM_Company_Owner || ""}
                          onChange={handleChange}
                          placeholder="Company Owner"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Company Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="email"
                            name="CM_Company_Email"
                            value={form.company?.CM_Company_Email || ""}
                            onChange={handleChange}
                            placeholder="Company Email"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Company Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="tel"
                            name="CM_Company_Phone"
                            value={form.company?.CM_Company_Phone || ""}
                            onChange={handleChange}
                            placeholder="Company Phone"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Owner Phone</label>
                        <div className="relative">
                          <PhoneCall className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="tel"
                            name="CM_Owner_Phone"
                            value={form.company?.CM_Owner_Phone || ""}
                            onChange={handleChange}
                            placeholder="Owner Phone"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Alternate Phone</label>
                        <div className="relative">
                          <PhoneCall className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="tel"
                            name="CM_Alternate_Phone"
                            value={form.company?.CM_Alternate_Phone || ""}
                            onChange={handleChange}
                            placeholder="Alternate Phone"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">GST Number</label>
                        <input
                          type="text"
                          name="CM_GST_Number"
                          value={form.company?.CM_GST_Number || ""}
                          onChange={handleChange}
                          placeholder="GST Number"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">PAN Number</label>
                        <input
                          type="text"
                          name="CM_PAN_Number"
                          value={form.company?.CM_PAN_Number || ""}
                          onChange={handleChange}
                          placeholder="PAN Number"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Company Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 sm:top-3 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="text"
                            name="CM_Company_Address"
                            value={form.company?.CM_Company_Address || ""}
                            onChange={handleChange}
                            placeholder="Company Address"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">District</label>
                        <input
                          type="text"
                          name="CM_Company_District"
                          value={form.company?.CM_Company_District || ""}
                          onChange={handleChange}
                          placeholder="District"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">State</label>
                        <input
                          type="text"
                          name="CM_Company_State"
                          value={form.company?.CM_Company_State || ""}
                          onChange={handleChange}
                          placeholder="State"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1 text-gray-900">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Country</label>
                        <input
                          type="text"
                          name="CM_Company_Country"
                          value={form.company?.CM_Company_Country || ""}
                          onChange={handleChange}
                          placeholder="Country"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-1 text-gray-900-+">
                        <label className="text-xs sm:text-sm font-medium text-gray-700">Postal Code</label>
                        <input
                          type="text"
                          name="CM_Company_Postal_Code"
                          value={form.company?.CM_Company_Postal_Code || ""}
                          onChange={handleChange}
                          placeholder="Postal Code"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}