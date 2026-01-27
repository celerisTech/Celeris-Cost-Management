"use client";
import { useEffect, useState } from "react";
import { Edit, UserPlus, X, Bell, Upload, Search, Filter, Mail, Phone, Send, CheckSquare, Square, Key, Calendar, GraduationCap, Briefcase, VenusMars, CreditCard, MapPin, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuthScreenStore";
import Navbar from '../components/Navbar'
import toast from "react-hot-toast";

export default function TeamsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({});
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [file, setFile] = useState(null);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isSending, setIsSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const allowedRoles = ["ROL000001", "ROL000002"];
  const companyId = user?.CM_Company_ID;

  useEffect(() => {
    if (companyId) {
      fetchMembers();
      fetchRoles();
    }
  }, [companyId]);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/teams?companyId=${companyId}`);
      const data = await res.json();
      if (data.success) setMembers(data.members);
    } catch (error) {
      toast.error("Failed to fetch team members");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.success) setRoles(data.roles);
    } catch (error) {
      toast.error("Failed to fetch roles");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      ...user,
      CM_Date_Of_Birth: user.CM_Date_Of_Birth ? user.CM_Date_Of_Birth.split('T')[0] : '',
      CM_Postal_Code: user.CM_Postal_Code || ''
    });
    setImagePreview(user.CM_Photo_URL || null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("userId", form.CM_User_ID);

      const res = await fetch("/api/teams", { // Changed from "/api/upload" to "/api/teams"
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setForm({ ...form, CM_Photo_URL: data.imageUrl });
        setImagePreview(data.imageUrl);
        toast.success("Image uploaded successfully!");

        // Refresh members list to show updated image
        fetchMembers();
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Update the removeImage function
  const removeImage = async () => {
    try {
      const res = await fetch("/api/teams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: form.CM_User_ID }),
      });

      const data = await res.json();
      if (data.success) {
        setForm({ ...form, CM_Photo_URL: "" });
        setImagePreview("");
        toast.success("Image removed successfully!");

        // Refresh members list
        fetchMembers();
      } else {
        toast.error(data.error || "Failed to remove image");
      }
    } catch (error) {
      console.error("Remove image error:", error);
      toast.error("Error removing image");
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setEditingUser(null);
        fetchMembers();
        toast.success("User updated successfully!");
      } else {
        toast.error("Failed to update user: " + data.error);
      }
    } catch (error) {
      toast.error("Error updating user: " + error.message);
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === members.length) setSelectedUsers([]);
    else setSelectedUsers(members.map((m) => m.CM_User_ID));
  };

  const createNotification = async () => {
    if (!notificationMessage || selectedUsers.length === 0) {
      toast.error("Please select users and enter a message.");
      return;
    }

    if (!user?.CM_User_ID) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    setIsSending(true);

    const formData = new FormData();
    formData.append("users", selectedUsers.join(","));
    formData.append("message", notificationMessage);
    formData.append("senderId", user.CM_User_ID);
    if (file) formData.append("file", file);

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }

      if (data.success) {
        toast.success(`Notification sent to ${selectedUsers.length} user(s)!`);
        setNotificationMessage("");
        setSelectedUsers([]);
        setFile(null);
        setShowNotificationPanel(false);
      } else {
        toast.error(data.error || "Failed to send notification");
      }
    } catch (error) {
      console.error("Notification error:", error);
      toast.error("Error sending notification: " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.CM_Full_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.CM_Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.CM_Role_Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.CM_Phone_Number?.includes(searchTerm);

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && member.CM_Is_Active === "Active") ||
      (statusFilter === "inactive" && member.CM_Is_Active !== "Active");

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalUsers = members.length;
  const activeUsers = members.filter(m => m.CM_Is_Active === "Active").length;
  const inactiveUsers = totalUsers - activeUsers;

  return (
    <div className="flex h-screen bg-white">
      <Navbar />
      <div className="flex-1 overflow-y-auto p-4 h-screen bg-white p-4 md:p-6">
        <div className="mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Teams & Members</h1>
              <p className="text-gray-600 mt-1">Manage your team members and send notifications</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {allowedRoles.includes(user?.CM_Role_ID) && (
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push("/newuser")}
                    className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <UserPlus size={18} className="mr-2" />
                    Add User
                  </button>

                  <button
                    onClick={() => router.push("/newrole")}
                    className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Key size={18} className="mr-2" />
                    Add Role
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className={`flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-0.5 ${showNotificationPanel
                  ? "bg-gray-700 text-white"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                  }`}
              >
                <Bell size={18} className="mr-2" />
                {showNotificationPanel ? "Close Panel" : "Create Notification"}
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-600 font-medium">Total Users</h3>
                <div className="bg-blue-100 p-2 rounded-full">
                  <span className="text-blue-600 font-bold">{totalUsers}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-2">{totalUsers}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-600 font-medium">Active Users</h3>
                <div className="bg-green-100 p-2 rounded-full">
                  <span className="text-green-600 font-bold">{activeUsers}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-2">{activeUsers}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-500">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-600 font-medium">Inactive Users</h3>
                <div className="bg-red-100 p-2 rounded-full">
                  <span className="text-red-600 font-bold">{inactiveUsers}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-2">{inactiveUsers}</p>
            </div>
          </div>

          {/* Notification Panel */}
          {showNotificationPanel && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Bell className="mr-2 text-green-600" size={24} />
                  Create Notification
                </h2>
                <button
                  onClick={() => setShowNotificationPanel(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    placeholder="Enter your notification message..."
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 text-gray-700 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    rows="4"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{notificationMessage.length}/500 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachment</label>
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg transition-all duration-200 border border-gray-300 border-dashed w-full">
                        <Upload size={16} className="mr-2 text-gray-600" />
                        <span className="text-gray-700">Choose File</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => setFile(e.target.files[0])}
                        />
                      </label>
                    </div>
                    {file && (
                      <div className="mt-2 flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <span className="truncate flex-1">{file.name}</span>
                        <button
                          onClick={() => setFile(null)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Users</label>
                    <button
                      onClick={selectAllUsers}
                      className="flex items-center text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg transition-colors w-full"
                    >
                      {selectedUsers.length === members.length ? (
                        <CheckSquare size={16} className="mr-2 text-blue-500" />
                      ) : (
                        <Square size={16} className="mr-2" />
                      )}
                      {selectedUsers.length === members.length ? "Deselect All" : "Select All"}
                      <span className="ml-auto bg-gray-200 text-xs px-2 py-1 rounded-full">
                        {selectedUsers.length}/{members.length}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={createNotification}
                    disabled={isSending || !notificationMessage.trim() || selectedUsers.length === 0}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Send Notification
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-md p-5 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search members by name, email, phone or role..."
                  className="w-full pl-10 pr-4 py-3 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                <Filter size={18} className="text-gray-500" />
                <select
                  className="bg-transparent border-none focus:ring-0 text-gray-700"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Members Grid */}
          {filteredMembers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">No team members found</p>
              <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMembers.map((m) => (
                <div
                  key={m.CM_User_ID}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col items-center relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                  <div className="absolute top-4 left-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(m.CM_User_ID)}
                        onChange={() => toggleSelectUser(m.CM_User_ID)}
                        className="hidden"
                      />
                      {selectedUsers.includes(m.CM_User_ID) ? (
                        <CheckSquare size={20} className="text-blue-500" />
                      ) : (
                        <Square size={20} className="text-gray-300 group-hover:text-gray-400" />
                      )}
                    </label>
                  </div>

                  <div className="mb-4 relative mt-2">
                    <div className="relative group">
                      <img
                        src={m.CM_Photo_URL || "/default-avatar.png"}
                        alt={m.CM_Full_Name}
                        className="w-20 h-20 text-gray-700 rounded-full object-cover border-4 border-white shadow-lg group-hover:opacity-80 transition-opacity duration-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Camera className="text-white" size={24} />
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 rounded-full w-5 h-5 border-2 border-white ${m.CM_Is_Active === "Active" ? "bg-green-500" : "bg-red-500"
                          }`}
                      ></span>
                    </div>
                  </div>

                  <h2 className="font-semibold text-lg text-gray-800 text-center">{m.CM_Full_Name}</h2>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <Mail size={14} className="mr-1" />
                    <span className="truncate max-w-[160px]">{m.CM_Email}</span>
                  </div>
                  <p className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-2 font-medium">
                    {m.CM_Role_Description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${m.CM_Is_Active === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                        }`}
                    >
                      {m.CM_Is_Active}
                    </span>
                    {m.CM_Gender && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        {m.CM_Gender}
                      </span>
                    )}
                  </div>

                  {(user?.CM_Role_ID === "ROL000001" || user?.CM_Role_ID === "ROL000002") && (
                    <button
                      onClick={() => handleEdit(m)}
                      className="mt-4 text-blue-600 hover:text-blue-800 transition-colors flex items-center text-sm font-medium"
                    >
                      <Edit size={16} className="mr-1" />
                      Edit Details
                    </button>
                  )}

                </div>
              ))}
            </div>
          )}

          {/* Edit Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white text-black rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Edit User Profile</h2>
                    <p className="text-gray-600 text-sm mt-1">Update user information and permissions</p>
                  </div>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="text-gray-500 hover:text-gray-700 rounded-full p-2 hover:bg-gray-200 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Form Body */}
                <div className="overflow-y-auto p-6 bg-gray-50">
                  <div className="space-y-8">

                    {/* Profile Picture Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center">
                        <div className="w-2 h-6 bg-pink-500 rounded-full mr-3"></div>
                        Profile Picture
                      </h3>
                      <div className="flex flex-col items-center">
                        <div className="relative group mb-4">
                          <img
                            src={imagePreview || form.CM_Photo_URL || "/default-avatar.png"}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg group-hover:opacity-80 transition-opacity duration-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <Camera className="text-white" size={32} />
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 rounded-full w-6 h-6 border-2 border-white ${form.CM_Is_Active === "Active" ? "bg-green-500" : "bg-red-500"
                              }`}
                          ></span>
                        </div>

                        <div className="flex flex-col items-center gap-3 w-full max-w-md">
                          <label className="flex flex-col items-center cursor-pointer bg-gray-100 hover:bg-gray-200 px-6 py-4 rounded-xl transition-all duration-200 border border-gray-300 border-dashed w-full">
                            <div className="flex items-center">
                              <Upload size={20} className="mr-3 text-gray-600" />
                              <span className="text-gray-700 font-medium">Upload New Photo</span>
                            </div>
                            <span className="text-sm text-gray-500 mt-1">JPEG, PNG, GIF, WebP (Max 5MB)</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </label>

                          {uploadingImage && (
                            <div className="flex items-center text-blue-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              Uploading...
                            </div>
                          )}

                          {form.CM_Photo_URL && !uploadingImage && (
                            <button
                              type="button"
                              onClick={() => {
                                setForm({ ...form, CM_Photo_URL: '' });
                                setImagePreview(null);
                              }}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Personal Information Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center">
                        <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                          <input
                            type="text"
                            name="CM_First_Name"
                            value={form.CM_First_Name || ""}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                          <input
                            type="text"
                            name="CM_Last_Name"
                            value={form.CM_Last_Name || ""}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            name="CM_Full_Name"
                            value={form.CM_Full_Name || ""}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                          <input
                            type="text"
                            name="CM_Father_Name"
                            value={form.CM_Father_Name || ""}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="date"
                              name="CM_Date_Of_Birth"
                              value={form.CM_Date_Of_Birth || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl pl-10 p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                          <select
                            name="CM_Gender"
                            value={form.CM_Gender || ""}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center">
                        <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="email"
                              name="CM_Email"
                              value={form.CM_Email || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl pl-10 p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="text"
                              name="CM_Phone_Number"
                              value={form.CM_Phone_Number || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl pl-10 p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                              required
                              maxLength={10}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Alternative Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="text"
                              name="CM_Alternative_Phone"
                              value={form.CM_Alternative_Phone || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl pl-10 p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                              maxLength={10}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                          <select
                            name="CM_Role_ID"
                            value={form.CM_Role_ID || ""}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                            required
                          >
                            <option value="">Select Role</option>
                            {roles.map((role) => (
                              <option key={role.CM_Role_ID} value={role.CM_Role_ID}>
                                {role.CM_Role_Description}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Education & Experience */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center">
                        <div className="w-2 h-6 bg-amber-500 rounded-full mr-3"></div>
                        Education & Experience
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Higher Education</label>
                          <div className="relative">
                            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="text"
                              name="CM_Higher_Education"
                              value={form.CM_Higher_Education || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl pl-10 p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Previous Experiences</label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
                            <textarea
                              name="CM_Previous_Experiences"
                              value={form.CM_Previous_Experiences || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl pl-10 p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                              rows="3"
                              placeholder="Describe previous work experiences..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ID Documents */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center">
                        <div className="w-2 h-6 bg-purple-500 rounded-full mr-3"></div>
                        ID Documents
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="text"
                              name="CM_Aadhaar_Number"
                              value={form.CM_Aadhaar_Number || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl pl-10 p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                              maxLength={12}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="text"
                              name="CM_PAN_Number"
                              value={form.CM_PAN_Number || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl pl-10 p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white uppercase"
                              maxLength={10}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center">
                        <div className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></div>
                        Address Information
                      </h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                            <textarea
                              name="CM_Address"
                              value={form.CM_Address || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl pl-10 p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                              rows="2"
                              placeholder="Enter complete address..."
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                              type="text"
                              name="CM_City"
                              value={form.CM_City || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                            <input
                              type="text"
                              name="CM_District"
                              value={form.CM_District || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <input
                              type="text"
                              name="CM_State"
                              value={form.CM_State || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                            <input
                              type="text"
                              name="CM_Postal_Code"
                              value={form.CM_Postal_Code || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                              maxLength={6}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <input
                              type="text"
                              name="CM_Country"
                              value={form.CM_Country || ""}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Information */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center">
                        <div className="w-2 h-6 bg-gray-500 rounded-full mr-3"></div>
                        System Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            name="CM_Is_Active"
                            value={form.CM_Is_Active || "Active"}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-4 p-6 border-t border-gray-200 bg-white">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm hover:shadow"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium hover:from-blue-700 hover:to-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          .animate-scaleIn {
            animation: scaleIn 0.2s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}