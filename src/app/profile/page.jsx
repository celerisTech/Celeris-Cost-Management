"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthScreenStore";
import {
  Edit3,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import Navbar from "../components/Navbar";

// Excel Row Component defined at top-level scope to prevent focus loss during typing
const ExcelRow = ({ label, children, required }) => (
  <div className="flex flex-col sm:flex-row border-b border-gray-300 last:border-b-0">
    <div className="sm:w-1/3 bg-gray-100 p-3 text-sm font-medium text-gray-700 border-b sm:border-b-0 sm:border-r border-gray-300 flex items-center">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </div>
    <div className="sm:w-2/3 bg-white relative flex items-center min-h-[42px]">
      {children}
    </div>
  </div>
);

const inputClasses = "w-full h-full px-3 py-2.5 text-sm text-gray-800 bg-transparent focus:outline-none focus:bg-blue-50 focus:ring-inset focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isEditing, setIsEditing] = useState(false);

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
    if (e) e.preventDefault();
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
          CM_City: form.CM_City,
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
  };

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-xl border border-gray-300 p-8 flex items-center space-x-4 shadow-sm">
            <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">User Profile</h1>
              <p className="text-sm text-gray-500 mt-1">View and manage your profile details</p>
            </div>
            <div className="flex gap-3">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all flex items-center"
                >
                  <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md shadow-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all disabled:opacity-60 flex items-center"
                  >
                    {loading ? (
                      <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Feedback Message Banner */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-md flex items-center ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Excel Grid Main Container */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-none overflow-hidden mb-8">
            <form onSubmit={handleSubmit}>
              {/* SECTION: Personal Information */}
              <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold uppercase tracking-wider">
                Personal Information
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                <div className="border-r border-gray-300 flex flex-col">
                  <ExcelRow label="Full Name" required>
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_Full_Name"
                        value={form.CM_Full_Name || ""}
                        onChange={handleChange}
                        className={inputClasses}
                        required
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm font-medium text-gray-900">
                        {form.CM_Full_Name || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="Email Address" required>
                    {isEditing ? (
                      <input
                        type="email"
                        name="CM_Email"
                        value={form.CM_Email || ""}
                        onChange={handleChange}
                        className={inputClasses}
                        required
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.CM_Email || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="Phone Number" required>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="CM_Phone_Number"
                        value={form.CM_Phone_Number || ""}
                        onChange={handleChange}
                        className={inputClasses}
                        required
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.CM_Phone_Number || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="Alt. Phone Number">
                    {isEditing ? (
                      <input
                        type="tel"
                        name="CM_Alternative_Phone"
                        value={form.CM_Alternative_Phone || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.CM_Alternative_Phone || "—"}
                      </div>
                    )}
                  </ExcelRow>
                </div>

                <div className="flex flex-col">
                  <ExcelRow label="City">
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_City"
                        value={form.CM_City || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.CM_City || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="District">
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_District"
                        value={form.CM_District || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.CM_District || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="State">
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_State"
                        value={form.CM_State || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.CM_State || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="Postal Code">
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_Postal_Code"
                        value={form.CM_Postal_Code || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.CM_Postal_Code || "—"}
                      </div>
                    )}
                  </ExcelRow>
                </div>
              </div>

              {/* Complete Address Row */}
              <div className="border-b border-gray-300">
                <ExcelRow label="Complete Address">
                  {isEditing ? (
                    <textarea
                      name="CM_Address"
                      value={form.CM_Address || ""}
                      onChange={handleChange}
                      rows="2"
                      className={`${inputClasses} resize-y min-h-[60px]`}
                    />
                  ) : (
                    <div className="px-3 py-2.5 text-sm text-gray-800">
                      {form.CM_Address || "—"}
                    </div>
                  )}
                </ExcelRow>
              </div>

              {/* SECTION: Company Information */}
              <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold uppercase tracking-wider">
                Company Information
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                <div className="border-r border-gray-300 flex flex-col">
                  <ExcelRow label="Company Name">
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_Company_Name"
                        value={form.company?.CM_Company_Name || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm font-medium text-gray-900">
                        {form.company?.CM_Company_Name || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="Company Code">
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_Company_Code"
                        value={form.company?.CM_Company_Code || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.company?.CM_Company_Code || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="Company Type">
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_Company_Type"
                        value={form.company?.CM_Company_Type || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.company?.CM_Company_Type || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="Company Owner">
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_Company_Owner"
                        value={form.company?.CM_Company_Owner || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.company?.CM_Company_Owner || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="Company Email">
                    {isEditing ? (
                      <input
                        type="email"
                        name="CM_Company_Email"
                        value={form.company?.CM_Company_Email || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.company?.CM_Company_Email || "—"}
                      </div>
                    )}
                  </ExcelRow>
                </div>

                <div className="flex flex-col">
                  <ExcelRow label="Company Phone">
                    {isEditing ? (
                      <input
                        type="tel"
                        name="CM_Company_Phone"
                        value={form.company?.CM_Company_Phone || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.company?.CM_Company_Phone || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="Owner Phone">
                    {isEditing ? (
                      <input
                        type="tel"
                        name="CM_Owner_Phone"
                        value={form.company?.CM_Owner_Phone || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.company?.CM_Owner_Phone || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="GST Number">
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_GST_Number"
                        value={form.company?.CM_GST_Number || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.company?.CM_GST_Number || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="PAN Number">
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_PAN_Number"
                        value={form.company?.CM_PAN_Number || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.company?.CM_PAN_Number || "—"}
                      </div>
                    )}
                  </ExcelRow>

                  <ExcelRow label="Company Postal Code">
                    {isEditing ? (
                      <input
                        type="text"
                        name="CM_Company_Postal_Code"
                        value={form.company?.CM_Company_Postal_Code || ""}
                        onChange={handleChange}
                        className={inputClasses}
                      />
                    ) : (
                      <div className="px-3 py-2.5 text-sm text-gray-800">
                        {form.company?.CM_Company_Postal_Code || "—"}
                      </div>
                    )}
                  </ExcelRow>
                </div>
              </div>

              {/* Company Address Row */}
              <div>
                <ExcelRow label="Company Address">
                  {isEditing ? (
                    <textarea
                      name="CM_Company_Address"
                      value={form.company?.CM_Company_Address || ""}
                      onChange={handleChange}
                      rows="2"
                      className={`${inputClasses} resize-y min-h-[60px]`}
                    />
                  ) : (
                    <div className="px-3 py-2.5 text-sm text-gray-800">
                      {form.company?.CM_Company_Address || "—"}
                    </div>
                  )}
                </ExcelRow>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}