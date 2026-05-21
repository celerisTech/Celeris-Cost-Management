"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatTitleCase, formatSentenceCase } from "../utils/textUtils";
import Navbar from "../components/Navbar";
import {
  FaUserAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaIdCard,
  FaSyncAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaBriefcase,
  FaCalendarAlt,
  FaUsers,
  FaCity,
  FaUniversity,
  FaCreditCard,
  FaFileUpload,
  FaTrash,
  FaCamera,
  FaRegIdCard,
  FaGlobe,
  FaBuilding,
  FaFilePdf,
  FaFileImage,
  FaFile
} from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
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

// Accepted file types
const ACCEPTED_FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
  documents: ['.pdf', '.doc', '.docx', '.txt'],
  all: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.pdf', '.doc', '.docx', '.txt']
};

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

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  // Helper function to validate file type
  const isValidFileType = (fileName, acceptedTypes = ACCEPTED_FILE_TYPES.all) => {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return acceptedTypes.includes(extension);
  };

  // Helper function to get file icon based on type
  const getFileIcon = (fileName) => {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (['.pdf'].includes(extension)) return <FaFilePdf className="w-8 h-8 text-red-500" />;
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(extension))
      return <FaFileImage className="w-8 h-8 text-blue-500" />;
    return <FaFile className="w-8 h-8 text-gray-500" />;
  };

  const handleLaborUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidFileType(file.name, ACCEPTED_FILE_TYPES.images)) {
      toast.error("Please upload a valid image file (JPG, PNG, GIF, BMP, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
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

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File size should be less than 10MB");
      return;
    }

    setPanFile(file);
  };

  const removeAadharFile = () => {
    setAadharFile(null);
  };

  const removePanFile = () => {
    setPanFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    e.preventDefault();
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

  if (loading)
    return (
      <div className="flex flex-row h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full items-center justify-center">
          <div className="flex justify-center items-center h-64">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mt-70">
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping"></div>
              <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full"></div>
              </div>
              <div className="absolute inset-2 border-2 border-indigo-300/30 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      <main className="flex-1 overflow-y-auto py-6 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto ">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Add New Employee
              </h1>
              <p className="text-gray-600">
                Fill in the employee details below to add them to the system
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/labors"
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
              >
                <FaUsers className="w-4 h-4" />
                View Employees
              </Link>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden text-black">
          {/* Profile Image Section - Top Right Corner */}
          <div className="relative">
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
              <div className="relative group">
                {/* Circular Profile Image Container */}
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                  {laborFile ? (
                    laborFile.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(laborFile)}
                        alt="Employee Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                        {getFileIcon(laborFile.name)}
                        <span className="text-xs mt-2 text-center break-all">
                          {laborFile.name.substring(0, 15)}...
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <FaCamera className="w-8 h-8 md:w-12 md:h-12 mb-2" />
                      <span className="text-xs">No File</span>
                    </div>
                  )}
                </div>

                {/* Upload Button Overlay */}
                <label className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg cursor-pointer transition-all hover:scale-105">
                  <FaCamera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLaborUpload}
                    className="hidden"
                  />
                </label>

                {/* Remove Button */}
                {laborFile && (
                  <button
                    type="button"
                    onClick={removeLaborFile}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-all hover:scale-105"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Card Header */}
            <div className="bg-blue-500 p-6">
              <h2 className="text-xl font-semibold text-white">
                Employee Registration Form
              </h2>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <Section title="Personal Information">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <InputField
                    label="First Name"
                    placeholder="Enter first name"
                    name="CM_First_Name"
                    value={formData.CM_First_Name}
                    onChange={handleChange}
                    required
                    icon={<FaUserAlt className="w-4 h-4" />}
                  />
                  <InputField
                    label="Last Name"
                    placeholder="Enter last name"
                    name="CM_Last_Name"
                    value={formData.CM_Last_Name}
                    onChange={handleChange}
                    icon={<FaUserAlt className="w-4 h-4" />}
                  />
                  <InputField
                    label="Father's Name"
                    placeholder="Enter father's name"
                    name="CM_Fathers_Name"
                    value={formData.CM_Fathers_Name}
                    onChange={handleChange}
                    icon={<FaUserAlt className="w-4 h-4" />}
                  />
                  <InputField
                    label="Date of Birth"
                    type="date"
                    name="CM_Date_Of_Birth"
                    value={formData.CM_Date_Of_Birth}
                    onChange={handleChange}
                    icon={<FaCalendarAlt className="w-4 h-4" />}
                  />
                  <SelectField
                    label="Gender"
                    name="CM_Sex"
                    value={formData.CM_Sex}
                    onChange={handleChange}
                    options={genderOptions}
                    required
                    icon={<FaUserAlt className="w-4 h-4" />}
                  />
                  <SelectField
                    label="Marital Status"
                    name="CM_Marriage_Status"
                    value={formData.CM_Marriage_Status}
                    onChange={handleChange}
                    options={marriageStatusOptions}
                    icon={<FaUsers className="w-4 h-4" />}
                  />
                </div>
              </Section>

              {/* Employment Details */}
              <Section title="Employment Details">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <InputField
                    label="Employee ID"
                    placeholder="EMP-001"
                    name="CM_Labor_Code"
                    value={formData.CM_Labor_Code}
                    onChange={handleChange}
                    icon={<FaIdCard className="w-4 h-4" />}
                  />
                  <InputField
                    label="Job Title"
                    placeholder="e.g., Software Engineer"
                    name="CM_Labor_Roll"
                    value={formData.CM_Labor_Roll}
                    onChange={handleChange}
                    icon={<FaBriefcase className="w-4 h-4" />}
                  />
                  <SelectField
                    label="Employment Type"
                    name="CM_Labor_Type"
                    value={formData.CM_Labor_Type}
                    onChange={handleChange}
                    options={laborTypes}
                    required
                    icon={<FaBriefcase className="w-4 h-4" />}
                  />
                  <SelectField
                    label="Wage Type"
                    name="CM_Wage_Type"
                    value={formData.CM_Wage_Type}
                    onChange={handleChange}
                    options={wageTypes}
                    required
                    icon={<FaBriefcase className="w-4 h-4" />}
                  />
                  <InputField
                    label="Salary Amount"
                    placeholder="0.00"
                    name="CM_Wage_Amount"
                    type="number"
                    step="0.01"
                    value={formData.CM_Wage_Amount}
                    onChange={handleChange}
                    required
                    icon={<FaBriefcase className="w-4 h-4" />}
                  />
                  <InputField
                    label="Previous Experience"
                    placeholder="e.g., 2 years at XYZ Corp"
                    name="CM_Previous_Experience"
                    value={formData.CM_Previous_Experience}
                    onChange={handleChange}
                    icon={<FaBriefcase className="w-4 h-4" />}
                  />
                  <InputField
                    label="Joining Date"
                    type="date"
                    name="CM_Labor_Join_Date"
                    value={formData.CM_Labor_Join_Date}
                    onChange={handleChange}
                    icon={<FaCalendarAlt className="w-4 h-4" />}
                  />
                  <InputField
                    label="Education"
                    placeholder="Highest education"
                    name="CM_Higher_Education"
                    value={formData.CM_Higher_Education}
                    onChange={handleChange}
                    icon={<FaUniversity className="w-4 h-4" />}
                  />
                </div>
              </Section>

              {/* Contact Information */}
              <Section title="Contact Information">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <InputField
                    label="Email Address"
                    placeholder="employee@company.com"
                    name="CM_Email"
                    type="email"
                    value={formData.CM_Email}
                    onChange={handleChange}
                    icon={<FaEnvelope className="w-4 h-4" />}
                  />
                  <InputField
                    label="Primary Phone"
                    placeholder="+91 9876543210"
                    name="CM_Phone_Number"
                    type="tel"
                    value={formData.CM_Phone_Number}
                    onChange={handleChange}
                    required
                    icon={<FaPhone className="w-4 h-4" />}
                  />
                  <InputField
                    label="Secondary Phone"
                    placeholder="+91 9876543210"
                    name="CM_Alternate_Phone"
                    type="tel"
                    value={formData.CM_Alternate_Phone}
                    onChange={handleChange}
                    icon={<FaPhone className="w-4 h-4" />}
                  />
                </div>
              </Section>

              {/* Address Information */}
              <Section title="Address Information">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <InputField
                    label="Street Address"
                    placeholder="123 Main Street"
                    name="CM_Address"
                    value={formData.CM_Address}
                    onChange={handleChange}
                    colSpan="lg:col-span-2"
                    icon={<FaMapMarkerAlt className="w-4 h-4" />}
                  />
                  <InputField
                    label="City"
                    placeholder="Gobi"
                    name="CM_City"
                    value={formData.CM_City}
                    onChange={handleChange}
                    icon={<FaCity className="w-4 h-4" />}
                  />
                  <InputField
                    label="District"
                    placeholder="Erode"
                    name="CM_District"
                    value={formData.CM_District}
                    onChange={handleChange}
                    icon={<FaMapMarkerAlt className="w-4 h-4" />}
                  />
                  <InputField
                    label="State / Province"
                    placeholder="Tamil Nadu"
                    name="CM_State"
                    value={formData.CM_State}
                    onChange={handleChange}
                    icon={<FaMapMarkerAlt className="w-4 h-4" />}
                  />
                  <InputField
                    label="Country"
                    name="CM_Country"
                    value="India"
                    onChange={handleChange}
                    disabled
                    icon={<FaGlobe className="w-4 h-4" />}
                  />
                  <InputField
                    label="Postal / ZIP Code"
                    placeholder="600001"
                    name="CM_Postal_Code"
                    value={formData.CM_Postal_Code}
                    onChange={handleChange}
                    icon={<FaMapMarkerAlt className="w-4 h-4" />}
                  />
                </div>
              </Section>

              {/* Identification Documents */}
              <Section title="Identification Documents">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aadhar Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaRegIdCard className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-gray-900">Aadhar Card</h4>
                      </div>
                      {aadharFile && (
                        <button
                          type="button"
                          onClick={removeAadharFile}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <FaTrash className="w-3 h-3" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        label="Aadhar Number"
                        placeholder="1234 5678 9012"
                        name="CM_Aadhar_Number"
                        value={formData.CM_Aadhar_Number}
                        onChange={handleChange}
                        icon={<FaIdCard className="w-4 h-4" />}
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Aadhar Document
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex-1">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors cursor-pointer">
                              <div className="flex flex-col items-center justify-center text-center">
                                {aadharFile ? (
                                  <div className="w-full">
                                    {aadharFile.type.startsWith('image/') ? (
                                      <img
                                        src={URL.createObjectURL(aadharFile)}
                                        alt="Aadhar Preview"
                                        className="h-32 object-contain rounded border mx-auto"
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center p-2">
                                        {getFileIcon(aadharFile.name)}
                                        <p className="text-sm font-medium text-gray-700 mt-2">
                                          {aadharFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {formatFileSize(aadharFile.size)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <FaFileUpload className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">Upload Aadhar Document</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Supports: JPG, PNG, PDF, DOC, DOCX, TXT
                                    </p>
                                    <p className="text-xs text-gray-500">Max size: 10MB</p>
                                  </>
                                )}
                              </div>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                                onChange={handleAadharUpload}
                                className="hidden"
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PAN Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaRegIdCard className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium text-gray-900">PAN Card</h4>
                      </div>
                      {panFile && (
                        <button
                          type="button"
                          onClick={removePanFile}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <FaTrash className="w-3 h-3" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        label="PAN Number"
                        placeholder="ABCDE1234F"
                        name="CM_PAN_Number"
                        value={formData.CM_PAN_Number}
                        onChange={handleChange}
                        icon={<FaIdCard className="w-4 h-4" />}
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          PAN Document
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex-1">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-400 transition-colors cursor-pointer">
                              <div className="flex flex-col items-center justify-center text-center">
                                {panFile ? (
                                  <div className="w-full">
                                    {panFile.type.startsWith('image/') ? (
                                      <img
                                        src={URL.createObjectURL(panFile)}
                                        alt="PAN Preview"
                                        className="h-32 object-contain rounded border mx-auto"
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center p-2">
                                        {getFileIcon(panFile.name)}
                                        <p className="text-sm font-medium text-gray-700 mt-2">
                                          {panFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {formatFileSize(panFile.size)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <FaFileUpload className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">Upload PAN Document</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Supports: JPG, PNG, PDF, DOC, DOCX, TXT
                                    </p>
                                    <p className="text-xs text-gray-500">Max size: 10MB</p>
                                  </>
                                )}
                              </div>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                                onChange={handlePanUpload}
                                className="hidden"
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Banking Information */}
              <Section title="Banking Information">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <InputField
                    label="Bank Name"
                    placeholder="State Bank of India"
                    name="CM_Bank_Name"
                    value={formData.CM_Bank_Name}
                    onChange={handleChange}
                    icon={<FaBuilding className="w-4 h-4" />}
                  />
                  <InputField
                    label="Bank Branch"
                    placeholder="Branch Location"
                    name="CM_Bank_Branch"
                    value={formData.CM_Bank_Branch}
                    onChange={handleChange}
                    icon={<FaUniversity className="w-4 h-4" />}
                  />
                  <InputField
                    label="IFSC Code"
                    placeholder="SBIN0001234"
                    name="CM_Bank_IFSC"
                    value={formData.CM_Bank_IFSC}
                    onChange={handleChange}
                    icon={<FaUniversity className="w-4 h-4" />}
                  />
                  <InputField
                    label="Account Number"
                    placeholder="Bank Account Number"
                    name="CM_Bank_Account_Number"
                    value={formData.CM_Bank_Account_Number}
                    onChange={handleChange}
                    icon={<FaCreditCard className="w-4 h-4" />}
                  />
                  <InputField
                    label="Account Holder Name"
                    placeholder="Name as per bank records"
                    name="CM_Account_Holder_Name"
                    value={formData.CM_Account_Holder_Name}
                    onChange={handleChange}
                    icon={<FaUserAlt className="w-4 h-4" />}
                  />
                  <InputField
                    label="UPI ID"
                    placeholder="name@upi"
                    name="CM_UPI_ID"
                    value={formData.CM_UPI_ID}
                    onChange={handleChange}
                    icon={<FaCreditCard className="w-4 h-4" />}
                  />
                </div>
              </Section>

              {/* Form Actions */}
              <div className="pt-8 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-500">
                    All fields marked with <span className="text-red-500">*</span> are required
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                    >
                      Reset Form
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <AiOutlineLoading3Quarters className="animate-spin w-4 h-4" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaSyncAlt className="w-4 h-4" />
                          Add Employee
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Section Component */
const Section = ({ title, children }) => (
  <section className="space-y-5">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </section>
);

/* Reusable Input Field Component */
const InputField = ({
  label,
  placeholder,
  name,
  value,
  onChange,
  type = "text",
  colSpan = "",
  required = false,
  disabled = false,
  icon = null
}) => (
  <div className={colSpan}>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500 ${icon ? 'pl-10' : ''
          } ${disabled ? 'cursor-not-allowed' : ''}`}
      />
    </div>
  </div>
);

/* Reusable Select Field Component */
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  icon = null
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </div>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white appearance-none ${icon ? 'pl-10 pr-10' : 'pr-10'
          }`}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);