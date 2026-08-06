"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  ArrowLeft,
  Trash2
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import toast from "react-hot-toast";
import { useAuthStore } from '../../store/useAuthScreenStore';
import { formatTitleCase, formatSentenceCase } from "../../utils/textUtils";

const laborTypes = [
  { value: "Labor", label: "Labor" },
  { value: "Temporary", label: "Temporary" },
  { value: "Permanent", label: "Permanent" },
  { value: "Contract", label: "Contract" },
  { value: "Office", label: "Office" }
];

const wageTypes = [
  { value: "PerHour", label: "Per Hour" },
  { value: "PerDay", label: "Per Day" },
  { value: "PerMonth", label: "Per Month" }
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" }
];

const marriageStatusOptions = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" }
];

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" }
];

const deleteTypeOptions = [
  { value: "Resigned", label: "Resigned" },
  { value: "Terminated", label: "Terminated" },
  { value: "Absconded", label: "Absconded" },
  { value: "Retired", label: "Retired" },
  { value: "Transferred", label: "Transferred" },
  { value: "Duplicate Entry", label: "Duplicate Entry" },
  { value: "Temporary Completed", label: "Temporary Completed" },
  { value: "Other", label: "Other" }
];

const ACCEPTED_DOCUMENT_TYPES = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.txt'];
const ACCEPTED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

// Excel Row Component defined at top-level scope to prevent component re-creation and input focus loss on state updates
const ExcelRow = ({ label, children, required }) => (
  <div className="flex flex-col sm:flex-row border-b border-gray-300 last:border-b-0">
    <div className="sm:w-1/3 bg-gray-100 p-3 text-sm font-medium text-gray-700 border-b sm:border-b-0 sm:border-r border-gray-300 flex items-center">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </div>
    <div className="sm:w-2/3 bg-white relative flex items-center">
      {children}
    </div>
  </div>
);

export default function EditLaborPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState({ aadhar: false, pan: false, labor: false });
  const laborImageRef = useRef(null);
  const aadharFileRef = useRef(null);
  const panFileRef = useRef(null);
  const { user } = useAuthStore();

  const isValidFileType = (fileName, acceptedTypes) => {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return acceptedTypes.includes(extension);
  };

  const getFileNameFromData = (data) => {
    if (!data) return null;
    if (data.includes('filename=')) {
      const match = data.match(/filename=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    if (data.includes('/')) {
      return data.split('/').pop();
    }
    return 'document';
  };

  useEffect(() => {
    const fetchLaborDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/labor-details/${id}`);

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        const labor = data.labor || {};

        if (labor.CM_Date_Of_Birth) {
          const dateStr = labor.CM_Date_Of_Birth;
          labor.CM_Date_Of_Birth = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        }

        if (labor.CM_Labor_Join_Date) {
          const joinDateStr = labor.CM_Labor_Join_Date;
          labor.CM_Labor_Join_Date = joinDateStr.includes('T') ? joinDateStr.split('T')[0] : joinDateStr;
        }

        setFormData(labor);
      } catch (error) {
        console.error("Failed to fetch labor details:", error);
        setError("Failed to load employee details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLaborDetails();
    }
  }, [id]);

  const handleInputChange = (name, value, type = "text") => {
    let formattedValue = value;

    if (
      [
        "CM_First_Name",
        "CM_Last_Name",
        "CM_Fathers_Name",
        "CM_City",
        "CM_District",
        "CM_State",
        "CM_Country",
        "CM_Bank_Name",
        "CM_Bank_Branch"
      ].includes(name)
    ) {
      formattedValue = formatTitleCase(value);
    } else if (
      [
        "CM_Address",
        "CM_Previous_Experience",
        "CM_Higher_Education",
        "CM_Labor_Roll"
      ].includes(name)
    ) {
      formattedValue = formatSentenceCase(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? (formattedValue === "" ? "" : Number(formattedValue)) : formattedValue
    }));
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidFileType(file.name, ACCEPTED_IMAGE_TYPES)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, BMP, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(prev => ({ ...prev, labor: true }));

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({
          ...prev,
          CM_Labor_Image: base64String,
          CM_Labor_Image_Name: file.name,
          CM_Labor_Image_Type: file.type,
          CM_Labor_Image_Size: file.size
        }));
        setUploading(prev => ({ ...prev, labor: false }));
        toast.success('Profile image updated successfully!');
      };
      reader.onerror = () => {
        toast.error('Error reading file');
        setUploading(prev => ({ ...prev, labor: false }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload profile image');
      setUploading(prev => ({ ...prev, labor: false }));
    }
  };

  const handleDocumentUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidFileType(file.name, ACCEPTED_DOCUMENT_TYPES)) {
      toast.error(`Please select a valid file (JPG, PNG, PDF, DOC, DOCX, TXT)`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }

    try {
      setUploading(prev => ({ ...prev, [documentType]: true }));

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        const fieldName = documentType === 'aadhar' ? 'CM_Aadhar_Image' : 'CM_PAN_Image';
        const fieldNameName = documentType === 'aadhar' ? 'CM_Aadhar_Image_Name' : 'CM_PAN_Image_Name';
        const fieldNameType = documentType === 'aadhar' ? 'CM_Aadhar_Image_Type' : 'CM_PAN_Image_Type';
        const fieldNameSize = documentType === 'aadhar' ? 'CM_Aadhar_Image_Size' : 'CM_PAN_Image_Size';

        setFormData(prev => ({
          ...prev,
          [fieldName]: base64String,
          [fieldNameName]: file.name,
          [fieldNameType]: file.type,
          [fieldNameSize]: file.size
        }));
        setUploading(prev => ({ ...prev, [documentType]: false }));
        toast.success(`${documentType === 'aadhar' ? 'Aadhar' : 'PAN'} document uploaded successfully!`);
      };
      reader.onerror = () => {
        toast.error('Error reading file');
        setUploading(prev => ({ ...prev, [documentType]: false }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Failed to upload ${documentType === 'aadhar' ? 'Aadhar' : 'PAN'} document`);
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const removeImage = (imageType) => {
    if (imageType === 'labor') {
      setFormData(prev => ({
        ...prev,
        CM_Labor_Image: '',
        CM_Labor_Image_Name: '',
        CM_Labor_Image_Type: '',
        CM_Labor_Image_Size: ''
      }));
      toast.success('Profile image removed');
    } else {
      const fieldName = imageType === 'aadhar' ? 'CM_Aadhar_Image' : 'CM_PAN_Image';
      const fieldNameName = imageType === 'aadhar' ? 'CM_Aadhar_Image_Name' : 'CM_PAN_Image_Name';
      const fieldNameType = imageType === 'aadhar' ? 'CM_Aadhar_Image_Type' : 'CM_PAN_Image_Type';
      const fieldNameSize = imageType === 'aadhar' ? 'CM_Aadhar_Image_Size' : 'CM_PAN_Image_Size';

      setFormData(prev => ({
        ...prev,
        [fieldName]: '',
        [fieldNameName]: '',
        [fieldNameType]: '',
        [fieldNameSize]: ''
      }));
      toast.success(`${imageType === 'aadhar' ? 'Aadhar' : 'PAN'} document removed`);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const updatedPayload = {
        ...formData,
        CM_Uploaded_By: user?.CM_Full_Name || "Unknown User",
      };

      const response = await fetch(`/api/labor-details/${id}?_method=PUT`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update employee");
      }

      toast.success("Employee updated successfully!");

      setTimeout(() => {
        router.push("/labors");
      }, 1500);

    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error(error.message || "Failed to update employee details");
      setError(error.message || "Failed to update employee details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-row h-screen bg-gray-50">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center justify-center p-8 bg-white border border-gray-300 rounded shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-700">Loading Employee Details...</p>
          </div>
        </div>
      </div>
    );

  const inputClasses = "w-full h-full px-3 py-2.5 text-sm text-gray-800 bg-transparent focus:outline-none focus:bg-blue-50 focus:ring-inset focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50";

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Navbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto">

          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Edit Employee Details</h1>
              <p className="text-sm text-gray-500 mt-1">Enter employee details in the grid below</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push(`/labors`)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md shadow-sm transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all disabled:opacity-60 flex items-center"
              >
                {saving ? (
                  <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Update Employee</>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="bg-white border border-gray-300 shadow-sm rounded-none overflow-hidden">
            <form onSubmit={handleSubmit}>

              {/* SECTION: Personal Information */}
              <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                Personal Information
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                <div className="border-r border-gray-300 flex flex-col">
                  <ExcelRow label="First Name" required>
                    <input
                      type="text"
                      value={formData.CM_First_Name || ""}
                      onChange={(e) => handleInputChange("CM_First_Name", e.target.value)}
                      className={inputClasses}
                      required
                    />
                  </ExcelRow>
                  <ExcelRow label="Last Name" required>
                    <input
                      type="text"
                      value={formData.CM_Last_Name || ""}
                      onChange={(e) => handleInputChange("CM_Last_Name", e.target.value)}
                      className={inputClasses}
                      required
                    />
                  </ExcelRow>
                  <ExcelRow label="Father's Name">
                    <input
                      type="text"
                      value={formData.CM_Fathers_Name || ""}
                      onChange={(e) => handleInputChange("CM_Fathers_Name", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
                <div className="flex flex-col">
                  <ExcelRow label="Date of Birth">
                    <input
                      type="date"
                      value={formData.CM_Date_Of_Birth || ""}
                      onChange={(e) => handleInputChange("CM_Date_Of_Birth", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Gender">
                    <select
                      value={formData.CM_Sex || ""}
                      onChange={(e) => handleInputChange("CM_Sex", e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">Select Gender...</option>
                      {genderOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </ExcelRow>
                  <ExcelRow label="Marriage Status">
                    <select
                      value={formData.CM_Marriage_Status || ""}
                      onChange={(e) => handleInputChange("CM_Marriage_Status", e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">Select Status...</option>
                      {marriageStatusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </ExcelRow>
                </div>
              </div>

              {/* Photo Upload Row */}
              <div className="border-b border-gray-300">
                <ExcelRow label="Photo Upload">
                  <div className="p-3 flex items-center gap-4 w-full">
                    <label className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-medium cursor-pointer hover:bg-blue-100 transition-colors">
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        className="hidden"
                        disabled={uploading.labor}
                        ref={laborImageRef}
                      />
                    </label>
                    <span className="text-xs text-gray-500 truncate max-w-xs">
                      {formData.CM_Labor_Image_Name || (formData.CM_Labor_Image ? "Photo uploaded" : "No file chosen")}
                    </span>
                    {formData.CM_Labor_Image && (
                      <button
                        type="button"
                        onClick={() => removeImage('labor')}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </ExcelRow>
              </div>

              {/* SECTION: Employment Details */}
              <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                Employment Details
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                <div className="border-r border-gray-300 flex flex-col">
                  <ExcelRow label="Employee Code">
                    <input
                      type="text"
                      placeholder="e.g. EMP001"
                      value={formData.CM_Labor_Code || ""}
                      onChange={(e) => handleInputChange("CM_Labor_Code", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Role / Position" required>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={formData.CM_Labor_Roll || ""}
                      onChange={(e) => handleInputChange("CM_Labor_Roll", e.target.value)}
                      className={inputClasses}
                      required
                    />
                  </ExcelRow>
                  <ExcelRow label="Employment Type" required>
                    <select
                      value={formData.CM_Labor_Type || ""}
                      onChange={(e) => handleInputChange("CM_Labor_Type", e.target.value)}
                      className={inputClasses}
                      required
                    >
                      <option value="">Select Type...</option>
                      {laborTypes.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </ExcelRow>
                  <ExcelRow label="Education">
                    <input
                      type="text"
                      placeholder="e.g., Bachelor's Degree"
                      value={formData.CM_Higher_Education || ""}
                      onChange={(e) => handleInputChange("CM_Higher_Education", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Status" required>
                    <select
                      value={formData.CM_Status || ""}
                      onChange={(e) => handleInputChange("CM_Status", e.target.value)}
                      className={inputClasses}
                      required
                    >
                      <option value="">Select Status...</option>
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </ExcelRow>
                </div>
                <div className="flex flex-col">
                  <ExcelRow label="Wage Type" required>
                    <select
                      value={formData.CM_Wage_Type || ""}
                      onChange={(e) => handleInputChange("CM_Wage_Type", e.target.value)}
                      className={inputClasses}
                      required
                    >
                      <option value="">Select Wage Type...</option>
                      {wageTypes.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </ExcelRow>
                  <ExcelRow label="Salary Amount (₹)" required>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.CM_Wage_Amount || ""}
                      onChange={(e) => handleInputChange("CM_Wage_Amount", e.target.value, "number")}
                      className={inputClasses}
                      required
                    />
                  </ExcelRow>
                  <ExcelRow label="Previous Experience">
                    <input
                      type="text"
                      placeholder="e.g., 5 years"
                      value={formData.CM_Previous_Experience || ""}
                      onChange={(e) => handleInputChange("CM_Previous_Experience", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Joining Date">
                    <input
                      type="date"
                      value={formData.CM_Labor_Join_Date || ""}
                      onChange={(e) => handleInputChange("CM_Labor_Join_Date", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Leaving Type">
                    <select
                      value={formData.CM_Delete_Type || ""}
                      onChange={(e) => handleInputChange("CM_Delete_Type", e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">Select Type...</option>
                      {deleteTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </ExcelRow>
                </div>
              </div>

              {/* Leaving Reason Row */}
              <div className="border-b border-gray-300">
                <ExcelRow label="Leaving Reason">
                  <input
                    type="text"
                    placeholder="Reason for leaving..."
                    value={formData.CM_Delete_Reason || ""}
                    onChange={(e) => handleInputChange("CM_Delete_Reason", e.target.value)}
                    className={inputClasses}
                  />
                </ExcelRow>
              </div>

              {/* SECTION: Contact Information */}
              <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                Contact Information
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                <div className="border-r border-gray-300 flex flex-col">
                  <ExcelRow label="Primary Phone" required>
                    <input
                      type="tel"
                      placeholder="+91 XXXXXXXXXX"
                      value={formData.CM_Phone_Number || ""}
                      onChange={(e) => handleInputChange("CM_Phone_Number", e.target.value)}
                      className={inputClasses}
                      required
                    />
                  </ExcelRow>
                  <ExcelRow label="Secondary Phone">
                    <input
                      type="tel"
                      placeholder="+91 XXXXXXXXXX"
                      value={formData.CM_Alternate_Phone || ""}
                      onChange={(e) => handleInputChange("CM_Alternate_Phone", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
                <div className="flex flex-col">
                  <ExcelRow label="Email Address">
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.CM_Email || ""}
                      onChange={(e) => handleInputChange("CM_Email", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
              </div>

              {/* SECTION: Address Details */}
              <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                Address Details
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                <div className="border-r border-gray-300 flex flex-col">
                  <ExcelRow label="Street Address">
                    <input
                      type="text"
                      placeholder="Street address"
                      value={formData.CM_Address || ""}
                      onChange={(e) => handleInputChange("CM_Address", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="City">
                    <input
                      type="text"
                      placeholder="City name"
                      value={formData.CM_City || ""}
                      onChange={(e) => handleInputChange("CM_City", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="District">
                    <input
                      type="text"
                      placeholder="District name"
                      value={formData.CM_District || ""}
                      onChange={(e) => handleInputChange("CM_District", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
                <div className="flex flex-col">
                  <ExcelRow label="State / Province">
                    <input
                      type="text"
                      placeholder="State name"
                      value={formData.CM_State || ""}
                      onChange={(e) => handleInputChange("CM_State", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Country">
                    <input
                      type="text"
                      placeholder="Country name"
                      value={formData.CM_Country || ""}
                      onChange={(e) => handleInputChange("CM_Country", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Postal / ZIP Code">
                    <input
                      type="text"
                      placeholder="PIN code"
                      value={formData.CM_Postal_Code || ""}
                      onChange={(e) => handleInputChange("CM_Postal_Code", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
              </div>

              {/* SECTION: Identification Documents */}
              <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                Identification Documents
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                <div className="border-r border-gray-300 flex flex-col">
                  <ExcelRow label="Aadhar Number">
                    <input
                      type="text"
                      placeholder="XXXX XXXX XXXX"
                      value={formData.CM_Aadhar_Number || ""}
                      onChange={(e) => handleInputChange("CM_Aadhar_Number", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Aadhar Document">
                    <div className="p-3 flex items-center gap-4 w-full">
                      <label className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-medium cursor-pointer hover:bg-blue-100 transition-colors">
                        Choose File
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                          onChange={(e) => handleDocumentUpload(e, 'aadhar')}
                          className="hidden"
                          disabled={uploading.aadhar}
                          ref={aadharFileRef}
                        />
                      </label>
                      <span className="text-xs text-gray-500 truncate max-w-xs">
                        {formData.CM_Aadhar_Image_Name || (formData.CM_Aadhar_Image ? "Document uploaded" : (getFileNameFromData(formData.CM_Aadhar_Image) || "No file chosen"))}
                      </span>
                      {formData.CM_Aadhar_Image && (
                        <button
                          type="button"
                          onClick={() => removeImage('aadhar')}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </ExcelRow>
                </div>
                <div className="flex flex-col">
                  <ExcelRow label="PAN Number">
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={formData.CM_PAN_Number || ""}
                      onChange={(e) => handleInputChange("CM_PAN_Number", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="PAN Document">
                    <div className="p-3 flex items-center gap-4 w-full">
                      <label className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-medium cursor-pointer hover:bg-blue-100 transition-colors">
                        Choose File
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                          onChange={(e) => handleDocumentUpload(e, 'pan')}
                          className="hidden"
                          disabled={uploading.pan}
                          ref={panFileRef}
                        />
                      </label>
                      <span className="text-xs text-gray-500 truncate max-w-xs">
                        {formData.CM_PAN_Image_Name || (formData.CM_PAN_Image ? "Document uploaded" : (getFileNameFromData(formData.CM_PAN_Image) || "No file chosen"))}
                      </span>
                      {formData.CM_PAN_Image && (
                        <button
                          type="button"
                          onClick={() => removeImage('pan')}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </ExcelRow>
                </div>
              </div>

              {/* SECTION: Banking Details */}
              <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                Banking Information
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="border-r border-gray-300 flex flex-col">
                  <ExcelRow label="Bank Name">
                    <input
                      type="text"
                      placeholder="Bank name"
                      value={formData.CM_Bank_Name || ""}
                      onChange={(e) => handleInputChange("CM_Bank_Name", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Bank Branch">
                    <input
                      type="text"
                      placeholder="Branch name"
                      value={formData.CM_Bank_Branch || ""}
                      onChange={(e) => handleInputChange("CM_Bank_Branch", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="IFSC Code">
                    <input
                      type="text"
                      placeholder="ABCD0123456"
                      value={formData.CM_Bank_IFSC || ""}
                      onChange={(e) => handleInputChange("CM_Bank_IFSC", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
                <div className="flex flex-col">
                  <ExcelRow label="Account Number">
                    <input
                      type="text"
                      placeholder="Account number"
                      value={formData.CM_Bank_Account_Number || ""}
                      onChange={(e) => handleInputChange("CM_Bank_Account_Number", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Account Holder Name">
                    <input
                      type="text"
                      placeholder="Account holder name"
                      value={formData.CM_Account_Holder_Name || ""}
                      onChange={(e) => handleInputChange("CM_Account_Holder_Name", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="UPI ID">
                    <input
                      type="text"
                      placeholder="name@bank"
                      value={formData.CM_UPI_ID || ""}
                      onChange={(e) => handleInputChange("CM_UPI_ID", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}