"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatTitleCase, formatSentenceCase } from "../utils/textUtils";
import Navbar from "../components/Navbar";
import {
  Loader2,
  UserPlus,
  Trash2,
  Upload,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { useAuthStore } from '../store/useAuthScreenStore';
import toast from "react-hot-toast";

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

const ACCEPTED_FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
  documents: ['.pdf', '.doc', '.docx', '.txt'],
  all: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.pdf', '.doc', '.docx', '.txt']
};

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

export default function AddLaborPage() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    CM_Labor_Code: "",
    CM_Company_ID: user?.CM_Company_ID || "",
    CM_First_Name: "",
    CM_Last_Name: "",
    CM_Fathers_Name: "",
    CM_Date_Of_Birth: "",
    CM_Labor_Join_Date: "",
    CM_Sex: "",
    CM_Marriage_Status: "",
    CM_Previous_Experience: "",
    CM_Labor_Type: "",
    CM_Wage_Type: "",
    CM_Wage_Amount: "",
    CM_Labor_Roll: "",
    CM_Higher_Education: "",
    CM_Email: "",
    CM_Phone_Number: "",
    CM_Alternate_Phone: "",
    CM_Status: "",
    CM_Address: "",
    CM_City: "",
    CM_District: "",
    CM_State: "",
    CM_Country: "India",
    CM_Postal_Code: "",
    CM_Aadhar_Number: "",
    CM_PAN_Number: "",
    CM_Bank_Name: "",
    CM_Bank_Branch: "",
    CM_Bank_IFSC: "",
    CM_Bank_Account_Number: "",
    CM_Account_Holder_Name: "",
    CM_UPI_ID: "",
    CM_Created_By: user?.CM_Full_Name || '',
    CM_Uploaded_By: user?.CM_Full_Name || ''
  });

  const [aadharFile, setAadharFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [laborFile, setLaborFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        CM_Company_ID: user.CM_Company_ID,
        CM_Created_By: user.CM_Full_Name,
        CM_Uploaded_By: user.CM_Full_Name
      }));
    }
  }, [user]);

  const handleChange = (name, value) => {
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
        "CM_Bank_Branch",
        "CM_Account_Holder_Name"
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

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  // Helper file validations
  const isValidFileType = (fileName, acceptedTypes = ACCEPTED_FILE_TYPES.all) => {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return acceptedTypes.includes(extension);
  };

  const handleLaborUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidFileType(file.name, ACCEPTED_FILE_TYPES.images)) {
      toast.error("Please upload a valid image file (JPG, PNG, GIF, BMP, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setLaborFile(file);
  };

  const removeLaborFile = () => {
    setLaborFile(null);
  };

  const handleAadharUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidFileType(file.name)) {
      toast.error("Please upload a valid file (JPG, PNG, PDF, DOC, DOCX, TXT)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }

    setAadharFile(file);
  };

  const handlePanUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidFileType(file.name)) {
      toast.error("Please upload a valid file (JPG, PNG, PDF, DOC, DOCX, TXT)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }

    setPanFile(file);
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const aadharRegex = /^[0-9]{12}$/;
    const wageAmountRegex = /^\d+(\.\d{1,2})?$/;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!formData.CM_First_Name.trim()) return "First Name is required.";
    if (!formData.CM_Sex) return "Gender is required.";
    if (!formData.CM_Labor_Type) return "Employment Type is required.";
    if (!formData.CM_Wage_Type) return "Wage Type is required.";
    if (!formData.CM_Wage_Amount) return "Salary Amount is required.";
    if (!formData.CM_Phone_Number) return "Primary Phone is required.";
    if (!formData.CM_Company_ID) return "Organization is required.";
    if (!phoneRegex.test(formData.CM_Phone_Number))
      return "Primary Phone is invalid.";
    if (formData.CM_Email && !emailRegex.test(formData.CM_Email))
      return "Email is invalid.";
    if (formData.CM_PAN_Number && !panRegex.test(formData.CM_PAN_Number))
      return "PAN Number is invalid.";
    if (formData.CM_Aadhar_Number && !aadharRegex.test(formData.CM_Aadhar_Number))
      return "Aadhar Number is invalid.";
    if (formData.CM_Wage_Amount && !wageAmountRegex.test(formData.CM_Wage_Amount))
      return "Wage Amount is invalid.";
    if (formData.CM_Wage_Type && !formData.CM_Wage_Amount)
      return "Wage Amount is required when Wage Type is selected.";
    if (formData.CM_Wage_Amount && !formData.CM_Wage_Type)
      return "Wage Type is required when Wage Amount is entered.";
    if (formData.CM_Bank_IFSC && !ifscRegex.test(formData.CM_Bank_IFSC))
      return "IFSC code is invalid.";
    if (formData.CM_Bank_Account_Number && !formData.CM_Bank_Name)
      return "Bank name is required when account number is entered.";

    return null;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      const formDataWithFiles = new FormData();
      Object.keys(formData).forEach(key => {
        formDataWithFiles.append(key, formData[key]);
      });

      if (laborFile) formDataWithFiles.append("CM_Labor_Image", laborFile);
      if (aadharFile) formDataWithFiles.append("CM_Aadhar_Image", aadharFile);
      if (panFile) formDataWithFiles.append("CM_PAN_Image", panFile);

      const res = await fetch("/api/addlabors", {
        method: "POST",
        body: formDataWithFiles,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add employee");

      toast.success("Employee added successfully!");
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      CM_Labor_Code: "",
      CM_Company_ID: user?.CM_Company_ID || "",
      CM_First_Name: "",
      CM_Last_Name: "",
      CM_Fathers_Name: "",
      CM_Date_Of_Birth: "",
      CM_Labor_Join_Date: "",
      CM_Sex: "",
      CM_Marriage_Status: "",
      CM_Previous_Experience: "",
      CM_Labor_Type: "",
      CM_Wage_Type: "",
      CM_Wage_Amount: "",
      CM_Labor_Roll: "",
      CM_Higher_Education: "",
      CM_Email: "",
      CM_Phone_Number: "",
      CM_Alternate_Phone: "",
      CM_Address: "",
      CM_City: "",
      CM_District: "",
      CM_State: "",
      CM_Country: "India",
      CM_Postal_Code: "",
      CM_Aadhar_Number: "",
      CM_PAN_Number: "",
      CM_Bank_Name: "",
      CM_Bank_Branch: "",
      CM_Bank_IFSC: "",
      CM_Bank_Account_Number: "",
      CM_Account_Holder_Name: "",
      CM_UPI_ID: "",
      CM_Created_By: user?.CM_Full_Name || '',
      CM_Uploaded_By: user?.CM_Full_Name || ''
    });

    setLaborFile(null);
    setAadharFile(null);
    setPanFile(null);
  };

  const inputClasses = "w-full h-full px-3 py-2.5 text-sm text-gray-800 bg-transparent focus:outline-none focus:bg-blue-50 focus:ring-inset focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50";

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Navbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto">

          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Add New Employee</h1>
              <p className="text-sm text-gray-500 mt-1">Enter employee details in the grid below</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md shadow-sm transition-all"
              >
                Back
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
                  <><UserPlus className="h-4 w-4 mr-2" /> Save Employee</>
                )}
              </button>
            </div>
          </div>

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
                      value={formData.CM_First_Name}
                      onChange={(e) => handleChange("CM_First_Name", e.target.value)}
                      className={inputClasses}
                      required
                    />
                  </ExcelRow>
                  <ExcelRow label="Last Name">
                    <input
                      type="text"
                      value={formData.CM_Last_Name}
                      onChange={(e) => handleChange("CM_Last_Name", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Father's Name">
                    <input
                      type="text"
                      value={formData.CM_Fathers_Name}
                      onChange={(e) => handleChange("CM_Fathers_Name", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
                <div className="flex flex-col">
                  <ExcelRow label="Date of Birth">
                    <input
                      type="date"
                      value={formData.CM_Date_Of_Birth}
                      onChange={(e) => handleChange("CM_Date_Of_Birth", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Gender" required>
                    <select
                      value={formData.CM_Sex}
                      onChange={(e) => handleChange("CM_Sex", e.target.value)}
                      className={inputClasses}
                      required
                    >
                      <option value="">Select Gender...</option>
                      {genderOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </ExcelRow>
                  <ExcelRow label="Marriage Status">
                    <select
                      value={formData.CM_Marriage_Status}
                      onChange={(e) => handleChange("CM_Marriage_Status", e.target.value)}
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
                        onChange={handleLaborUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-gray-500 truncate max-w-xs">
                      {laborFile ? laborFile.name : "No file chosen"}
                    </span>
                    {laborFile && (
                      <button
                        type="button"
                        onClick={removeLaborFile}
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
                  <ExcelRow label="Employee ID">
                    <input
                      type="text"
                      placeholder="e.g. EMP-001"
                      value={formData.CM_Labor_Code}
                      onChange={(e) => handleChange("CM_Labor_Code", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Job Title / Role">
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={formData.CM_Labor_Roll}
                      onChange={(e) => handleChange("CM_Labor_Roll", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Employment Type" required>
                    <select
                      value={formData.CM_Labor_Type}
                      onChange={(e) => handleChange("CM_Labor_Type", e.target.value)}
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
                      placeholder="Highest education degree"
                      value={formData.CM_Higher_Education}
                      onChange={(e) => handleChange("CM_Higher_Education", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
                <div className="flex flex-col">
                  <ExcelRow label="Wage Type" required>
                    <select
                      value={formData.CM_Wage_Type}
                      onChange={(e) => handleChange("CM_Wage_Type", e.target.value)}
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
                      value={formData.CM_Wage_Amount}
                      onChange={(e) => handleChange("CM_Wage_Amount", e.target.value)}
                      className={inputClasses}
                      required
                    />
                  </ExcelRow>
                  <ExcelRow label="Previous Experience">
                    <input
                      type="text"
                      placeholder="e.g., 2 years at XYZ Corp"
                      value={formData.CM_Previous_Experience}
                      onChange={(e) => handleChange("CM_Previous_Experience", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Joining Date">
                    <input
                      type="date"
                      value={formData.CM_Labor_Join_Date}
                      onChange={(e) => handleChange("CM_Labor_Join_Date", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
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
                      placeholder="+91 9876543210"
                      value={formData.CM_Phone_Number}
                      onChange={(e) => handleChange("CM_Phone_Number", e.target.value)}
                      className={inputClasses}
                      required
                    />
                  </ExcelRow>
                  <ExcelRow label="Secondary Phone">
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={formData.CM_Alternate_Phone}
                      onChange={(e) => handleChange("CM_Alternate_Phone", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
                <div className="flex flex-col">
                  <ExcelRow label="Email Address">
                    <input
                      type="email"
                      placeholder="employee@company.com"
                      value={formData.CM_Email}
                      onChange={(e) => handleChange("CM_Email", e.target.value)}
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
                      placeholder="123 Main Street"
                      value={formData.CM_Address}
                      onChange={(e) => handleChange("CM_Address", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="City">
                    <input
                      type="text"
                      placeholder="City Name"
                      value={formData.CM_City}
                      onChange={(e) => handleChange("CM_City", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="District">
                    <input
                      type="text"
                      placeholder="District"
                      value={formData.CM_District}
                      onChange={(e) => handleChange("CM_District", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
                <div className="flex flex-col">
                  <ExcelRow label="State / Province">
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.CM_State}
                      onChange={(e) => handleChange("CM_State", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Country">
                    <input
                      type="text"
                      value="India"
                      disabled
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Postal / ZIP Code">
                    <input
                      type="text"
                      placeholder="600001"
                      value={formData.CM_Postal_Code}
                      onChange={(e) => handleChange("CM_Postal_Code", e.target.value)}
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
                      placeholder="1234 5678 9012"
                      value={formData.CM_Aadhar_Number}
                      onChange={(e) => handleChange("CM_Aadhar_Number", e.target.value)}
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
                          onChange={handleAadharUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-gray-500 truncate max-w-xs">
                        {aadharFile ? aadharFile.name : "No file chosen"}
                      </span>
                      {aadharFile && (
                        <button
                          type="button"
                          onClick={() => setAadharFile(null)}
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
                      value={formData.CM_PAN_Number}
                      onChange={(e) => handleChange("CM_PAN_Number", e.target.value)}
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
                          onChange={handlePanUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-gray-500 truncate max-w-xs">
                        {panFile ? panFile.name : "No file chosen"}
                      </span>
                      {panFile && (
                        <button
                          type="button"
                          onClick={() => setPanFile(null)}
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
                      placeholder="State Bank of India"
                      value={formData.CM_Bank_Name}
                      onChange={(e) => handleChange("CM_Bank_Name", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Bank Branch">
                    <input
                      type="text"
                      placeholder="Branch Location"
                      value={formData.CM_Bank_Branch}
                      onChange={(e) => handleChange("CM_Bank_Branch", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="IFSC Code">
                    <input
                      type="text"
                      placeholder="SBIN0001234"
                      value={formData.CM_Bank_IFSC}
                      onChange={(e) => handleChange("CM_Bank_IFSC", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                </div>
                <div className="flex flex-col">
                  <ExcelRow label="Account Number">
                    <input
                      type="text"
                      placeholder="Bank Account Number"
                      value={formData.CM_Bank_Account_Number}
                      onChange={(e) => handleChange("CM_Bank_Account_Number", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="Account Holder Name">
                    <input
                      type="text"
                      placeholder="Name as per bank records"
                      value={formData.CM_Account_Holder_Name}
                      onChange={(e) => handleChange("CM_Account_Holder_Name", e.target.value)}
                      className={inputClasses}
                    />
                  </ExcelRow>
                  <ExcelRow label="UPI ID">
                    <input
                      type="text"
                      placeholder="name@upi"
                      value={formData.CM_UPI_ID}
                      onChange={(e) => handleChange("CM_UPI_ID", e.target.value)}
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