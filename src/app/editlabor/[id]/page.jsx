"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  ArrowLeft,
  User,
  Briefcase,
  CreditCard,
  Phone,
  Home,
  FileText,
  Landmark,
  Upload,
  X,
  Camera,
  UserCircle,
  CheckCircle,
  Trash2,
  File,
  Image as FileImage
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import toast from "react-hot-toast";
import { useAuthStore } from '../../store/useAuthScreenStore';
import { formatTitleCase, formatSentenceCase } from "../../utils/textUtils";

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

  // Accepted file types for documents
  const ACCEPTED_DOCUMENT_TYPES = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.txt'];
  const ACCEPTED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

  // Helper function to validate file type
  const isValidFileType = (fileName, acceptedTypes) => {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return acceptedTypes.includes(extension);
  };

  // Helper function to get file icon based on type
  const getFileIcon = (fileName) => {
    if (!fileName) return <File className="w-10 h-10 text-gray-500" />;

    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (['.pdf'].includes(extension)) return <FileText className="w-10 h-10 text-red-500" />;
    if (['.doc', '.docx'].includes(extension)) return <FileText className="w-10 h-10 text-blue-500" />;
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(extension))
      return <FileImage className="w-10 h-10 text-green-500" />;
    return <File className="w-10 h-10 text-gray-500" />;
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file name from base64 or path
  const getFileNameFromData = (data) => {
    if (!data) return null;

    // If it's a base64 string with filename in it
    if (data.includes('filename=')) {
      const match = data.match(/filename=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }

    // If it's a path or simple string
    if (data.includes('/')) {
      return data.split('/').pop();
    }

    return 'document';
  };

  // Check if data is an image
  const isImageFile = (data) => {
    if (!data) return false;
    return data.startsWith('data:image/') ||
      (data.match && data.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i));
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

        // Fix: Proper date formatting without timezone issues
        const labor = data.labor || {};
        if (labor.CM_Date_Of_Birth) {
          const dateStr = labor.CM_Date_Of_Birth;
          if (dateStr.includes('T')) {
            labor.CM_Date_Of_Birth = dateStr.split('T')[0];
          } else {
            labor.CM_Date_Of_Birth = dateStr;
          }
        }

        // Format join date if exists
        if (labor.CM_Labor_Join_Date) {
          const joinDateStr = labor.CM_Labor_Join_Date;
          if (joinDateStr.includes('T')) {
            labor.CM_Labor_Join_Date = joinDateStr.split('T')[0];
          } else {
            labor.CM_Labor_Join_Date = joinDateStr;
          }
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

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
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

  // Handle profile image upload (images only)
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type (images only for profile)
    if (!isValidFileType(file.name, ACCEPTED_IMAGE_TYPES)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, BMP, WEBP)');
      return;
    }

    // Validate file size (max 5MB)
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

  // Handle document upload (multiple file types)
  const handleDocumentUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!isValidFileType(file.name, ACCEPTED_DOCUMENT_TYPES)) {
      toast.error(`Please select a valid file (JPG, PNG, PDF, DOC, DOCX, TXT)`);
      return;
    }

    // Validate file size (max 10MB)
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
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      // Inject Uploaded By
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
      <div className="flex flex-row h-screen bg-white">
        {/* Navbar */}
        <Navbar />
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full items-center justify-center">
          <div className="flex justify-center items-center h-64">
            <div className="relative w-20 h-20">

              {/* Core Server */}
              <div className="absolute inset-6 bg-blue-600 rounded-lg animate-pulse shadow-lg"></div>

              {/* Data Lines */}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-data-flow"></div>
              <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1 w-full bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-data-flow-reverse"></div>

              {/* Corner Nodes */}
              <span className="absolute top-0 left-0 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-150"></span>
              <span className="absolute bottom-0 left-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-300"></span>
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-500"></span>

            </div>
          </div>
        </div>
      </div>
    );

  const getInitials = () => {
    const firstName = formData.CM_First_Name || '';
    const lastName = formData.CM_Last_Name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-black">
      <Navbar />
      <div className="flex-1 mx-auto py-6 px-4 overflow-y-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-6  p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left — Title */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600 rounded-xl shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
                  Edit Employee Details
                </h1>
              </div>
            </div>

            {/* Right — Back Button */}
            <button
              onClick={() => router.push(`/labors/employee-details/${formData.CM_Labor_Type_ID}`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:scale-95 transition-all duration-200 shadow-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative">
          {/* Employee Profile Image in Top-Right Corner */}
          <div className="absolute top-6 right-6 z-10">
            <div className="relative group">
              {/* Circular Profile Image Container */}
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                {formData.CM_Labor_Image ? (
                  <img
                    src={formData.CM_Labor_Image}
                    alt={`${formData.CM_First_Name || ''} ${formData.CM_Last_Name || ''}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-blue-800">
                          <div class="text-center">
                            <div class="text-3xl md:text-4xl font-bold">${getInitials()}</div>
                          </div>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-bold text-blue-800">{getInitials()}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button Overlay */}
              <label className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3 rounded-full shadow-xl cursor-pointer transition-all hover:scale-110">
                <Camera size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                  disabled={uploading.labor}
                  ref={laborImageRef}
                />
              </label>

              {/* Remove Button */}
              {formData.CM_Labor_Image && (
                <button
                  type="button"
                  onClick={() => removeImage('labor')}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full shadow-xl transition-all hover:scale-110"
                >
                  <Trash2 size={16} />
                </button>
              )}

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-black/60 rounded-full p-2.5">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <svg viewBox="0 0 200 200" className="w-full h-full text-white">
                <path fill="currentColor" d="M44.6,-44.2C56.7,-33.5,65.1,-16.7,64.5,-0.5C63.9,15.7,54.3,31.4,42.2,41.5C30.1,51.7,15.1,56.3,-1.2,57.5C-17.4,58.7,-34.8,56.5,-46.8,46.3C-58.8,36.1,-65.4,17.9,-64.5,0.8C-63.6,-16.3,-55.2,-32.6,-43.2,-43.3C-31.2,-54,-15.6,-59,0.6,-59.6C16.8,-60.2,33.5,-56.4,44.6,-44.2Z" transform="translate(100 100)" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-white font-semibold text-lg">{formData.CM_First_Name || ''} {formData.CM_Last_Name || ''}</p>
                  <p className="text-blue-100 text-sm">{formData.CM_Labor_Roll || 'Employee'} • {formData.CM_Labor_Type || 'Type not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
            {/* Personal Information Section */}
            <Section title="Personal Information" icon={<User className="text-blue-600" size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField
                  label="First Name"
                  name="CM_First_Name"
                  value={formData.CM_First_Name || ""}
                  onChange={handleInputChange}
                  required
                  placeholder="First name"
                />
                <InputField
                  label="Last Name "
                  name="CM_Last_Name"
                  value={formData.CM_Last_Name || ""}
                  onChange={handleInputChange}
                  required
                  placeholder="Last name"
                />
                <InputField
                  label="Father's Name"
                  name="CM_Fathers_Name"
                  value={formData.CM_Fathers_Name || ""}
                  onChange={handleInputChange}
                  placeholder="Father's name"
                />
                <InputField
                  label="Date of Birth"
                  name="CM_Date_Of_Birth"
                  type="date"
                  value={formData.CM_Date_Of_Birth || ""}
                  onChange={handleInputChange}
                />
                <SelectField
                  label="Gender"
                  name="CM_Sex"
                  value={formData.CM_Sex || ""}
                  onChange={handleInputChange}
                  options={[
                    { value: "", label: "Select Gender" },
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" }
                  ]}
                />
                <SelectField
                  label="Marital Status"
                  name="CM_Marriage_Status"
                  value={formData.CM_Marriage_Status || ""}
                  onChange={handleInputChange}
                  options={[
                    { value: "", label: "Select Marital Status" },
                    { value: "Single", label: "Single" },
                    { value: "Married", label: "Married" },
                    { value: "Divorced", label: "Divorced" },
                    { value: "Widowed", label: "Widowed" }
                  ]}
                />
              </div>
            </Section>

            {/* Employment Details */}
            <Section title="Employment Details" icon={<Briefcase className="text-green-600" size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField
                  label="Employee Code"
                  name="CM_Labor_Code"
                  value={formData.CM_Labor_Code || ""}
                  onChange={handleInputChange}
                  placeholder="EMP001"
                />
                <SelectField
                  label="Employee Type"
                  name="CM_Labor_Type"
                  value={formData.CM_Labor_Type || ""}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: "", label: "Select Type" },
                    { value: "Labor", label: "Labor" },
                    { value: "Temporary", label: "Temporary" },
                    { value: "Permanent", label: "Permanent" },
                    { value: "Contract", label: "Contract" },
                    { value: "Office", label: "Office" }
                  ]}
                />
                <InputField
                  label="Role/Position"
                  name="CM_Labor_Roll"
                  value={formData.CM_Labor_Roll || ""}
                  onChange={handleInputChange}
                  required
                  placeholder="Job title"
                />
                <InputField
                  label="Joining Date"
                  name="CM_Labor_Join_Date"
                  type="date"
                  value={formData.CM_Labor_Join_Date || ""}
                  onChange={handleInputChange}
                />
                <InputField
                  label="Previous Experience"
                  name="CM_Previous_Experience"
                  value={formData.CM_Previous_Experience || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., 5 years"
                />
                <InputField
                  label="Highest Education"
                  name="CM_Higher_Education"
                  value={formData.CM_Higher_Education || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., Bachelor's Degree"
                />
                <SelectField
                  label="Status"
                  name="CM_Status"
                  value={formData.CM_Status || ""}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: "", label: "Select Status" },
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" }
                  ]}
                />
              </div>
            </Section>

            {/* Salary Details */}
            <Section title="Salary Details" icon={<CreditCard className="text-amber-600" size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Wage Type"
                  name="CM_Wage_Type"
                  value={formData.CM_Wage_Type || ""}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: "", label: "Select Wage Type" },
                    { value: "PerHour", label: "Per Hour" },
                    { value: "PerDay", label: "Per Day" },
                    { value: "PerMonth", label: "Per Month" }
                  ]}
                />
                <InputField
                  label="Wage Amount (₹)"
                  name="CM_Wage_Amount"
                  type="number"
                  value={formData.CM_Wage_Amount || ""}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
            </Section>

            {/* Contact Information */}
            <Section title="Contact Information" icon={<Phone className="text-purple-600" size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField
                  label="Email"
                  name="CM_Email"
                  type="email"
                  value={formData.CM_Email || ""}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                />
                <InputField
                  label="Phone Number"
                  name="CM_Phone_Number"
                  type="tel"
                  value={formData.CM_Phone_Number || ""}
                  onChange={handleInputChange}
                  required
                  placeholder="+91 XXXXXXXXXX"
                />
                <InputField
                  label="Alternate Phone"
                  name="CM_Alternate_Phone"
                  type="tel"
                  value={formData.CM_Alternate_Phone || ""}
                  onChange={handleInputChange}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
            </Section>

            {/* Address Information */}
            <Section title="Address Information" icon={<Home className="text-indigo-600" size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="CM_Address"
                    value={formData.CM_Address || ""}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-gray-400"
                    placeholder="Street address"
                  />
                </div>
                <InputField
                  label="City"
                  name="CM_City"
                  value={formData.CM_City || ""}
                  onChange={handleInputChange}
                  placeholder="City name"
                />
                <InputField
                  label="District"
                  name="CM_District"
                  value={formData.CM_District || ""}
                  onChange={handleInputChange}
                  placeholder="District name"
                />
                <InputField
                  label="State"
                  name="CM_State"
                  value={formData.CM_State || ""}
                  onChange={handleInputChange}
                  placeholder="State name"
                />
                <InputField
                  label="Country"
                  name="CM_Country"
                  value={formData.CM_Country || ""}
                  onChange={handleInputChange}
                  placeholder="Country name"
                />
                <InputField
                  label="Postal Code"
                  name="CM_Postal_Code"
                  type="number"
                  value={formData.CM_Postal_Code || ""}
                  onChange={handleInputChange}
                  placeholder="PIN code"
                />
              </div>
            </Section>

            {/* ID Documents */}
            <Section title="ID Documents" icon={<FileText className="text-red-600" size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Aadhar Number"
                  name="CM_Aadhar_Number"
                  value={formData.CM_Aadhar_Number || ""}
                  onChange={handleInputChange}
                  placeholder="XXXX XXXX XXXX"
                />
                <InputField
                  label="PAN Number"
                  name="CM_PAN_Number"
                  value={formData.CM_PAN_Number || ""}
                  onChange={handleInputChange}
                  placeholder="ABCDE1234F"
                />
              </div>

              {/* Document Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Aadhar Document */}
                <DocumentUploadField
                  label="Aadhar Document"
                  document={formData.CM_Aadhar_Image}
                  fileName={formData.CM_Aadhar_Image_Name || getFileNameFromData(formData.CM_Aadhar_Image)}
                  fileSize={formData.CM_Aadhar_Image_Size}
                  uploading={uploading.aadhar}
                  onRemove={() => removeImage('aadhar')}
                  onChange={(e) => handleDocumentUpload(e, 'aadhar')}
                  inputRef={aadharFileRef}
                  getFileIcon={getFileIcon}
                  isImageFile={isImageFile}
                  formatFileSize={formatFileSize}
                />

                {/* PAN Document */}
                <DocumentUploadField
                  label="PAN Document"
                  document={formData.CM_PAN_Image}
                  fileName={formData.CM_PAN_Image_Name || getFileNameFromData(formData.CM_PAN_Image)}
                  fileSize={formData.CM_PAN_Image_Size}
                  uploading={uploading.pan}
                  onRemove={() => removeImage('pan')}
                  onChange={(e) => handleDocumentUpload(e, 'pan')}
                  inputRef={panFileRef}
                  getFileIcon={getFileIcon}
                  isImageFile={isImageFile}
                  formatFileSize={formatFileSize}
                />
              </div>
            </Section>

            {/* Bank Details */}
            <Section title="Bank Details" icon={<Landmark className="text-emerald-600" size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField
                  label="Bank Name"
                  name="CM_Bank_Name"
                  value={formData.CM_Bank_Name || ""}
                  onChange={handleInputChange}
                  placeholder="Bank name"
                />
                <InputField
                  label="Branch Name"
                  name="CM_Bank_Branch"
                  value={formData.CM_Bank_Branch || ""}
                  onChange={handleInputChange}
                  placeholder="Branch name"
                />
                <InputField
                  label="IFSC Code"
                  name="CM_Bank_IFSC"
                  value={formData.CM_Bank_IFSC || ""}
                  onChange={handleInputChange}
                  placeholder="ABCD0123456"
                />
                <InputField
                  label="Account Number"
                  name="CM_Bank_Account_Number"
                  value={formData.CM_Bank_Account_Number || ""}
                  onChange={handleInputChange}
                  placeholder="Account number"
                />
                <InputField
                  label="Account Holder Name"
                  name="CM_Account_Holder_Name"
                  value={formData.CM_Account_Holder_Name || ""}
                  onChange={handleInputChange}
                  placeholder="Account holder name"
                />
                <InputField
                  label="UPI ID"
                  name="CM_UPI_ID"
                  value={formData.CM_UPI_ID || ""}
                  onChange={handleInputChange}
                  placeholder="name@bank"
                />
              </div>
            </Section>

            {/* Form Actions */}
            <div className="p-6 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                Fields marked with <span className="text-red-500">*</span> are required
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => router.push(`/labors/employee-details/${formData.CM_Labor_Type_ID}`)}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Update Employee
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* Reusable Components */

const Section = ({ title, icon, children }) => (
  <div className="p-6 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-gray-50 rounded-xl">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

const InputField = ({ label, name, value, onChange, type = "text", required = false, placeholder, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-gray-400"
      {...props}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-gray-400 bg-white"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const DocumentUploadField = ({
  label,
  document,
  fileName,
  fileSize,
  uploading,
  onRemove,
  onChange,
  inputRef,
  getFileIcon,
  isImageFile,
  formatFileSize
}) => {
  const isImage = isImageFile && isImageFile(document);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-gray-50/50">
        {document ? (
          <div className="space-y-3">
            {isImage ? (
              <img
                src={document}
                alt={label}
                className="max-h-48 mx-auto rounded-lg shadow-sm"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg">
                <div className="mb-3">
                  {getFileIcon && getFileIcon(fileName || 'document')}
                </div>
                <p className="text-sm font-medium text-gray-700 truncate max-w-full">
                  {fileName || 'Document'}
                </p>
                {fileSize && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize && formatFileSize(fileSize)}
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="mt-2 w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Remove Document
            </button>
          </div>
        ) : (
          <div className="py-8">
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-3">Click to upload or drag and drop</p>
            <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm inline-flex items-center gap-2">
              {uploading ? 'Uploading...' : 'Choose File'}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                onChange={onChange}
                className="hidden"
                disabled={uploading}
                ref={inputRef}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Supports: JPG, PNG, PDF, DOC, DOCX, TXT
            </p>
            <p className="text-xs text-gray-500">Max size: 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
};