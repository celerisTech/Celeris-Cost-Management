"use client";
import { useEffect, useState } from "react";
import { Edit, UserPlus, X, Bell, Upload, Search, Filter, Mail, Phone, Send, CheckSquare, Square, Key, Calendar, GraduationCap, Briefcase, VenusMars, CreditCard, MapPin, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuthScreenStore";
import Navbar from '../components/Navbar'
import toast from "react-hot-toast";

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
// User Avatar Component with Image & Name First Letter Fallback
const UserAvatar = ({ src, name, size = "md", className = "" }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const firstLetter = (name?.trim()?.[0] || "U").toUpperCase();

  const sizeClasses = {
    sm: "w-8 h-8 text-xs font-bold",
    md: "w-10 h-10 text-sm font-bold",
    lg: "w-16 h-16 text-xl font-black rounded-2xl",
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name || "User"}
        onError={() => setImageError(true)}
        className={`${size === 'lg' ? 'rounded-2xl' : 'rounded-full'} object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${currentSizeClass} ${size === 'lg' ? 'rounded-2xl' : 'rounded-full'} bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm shrink-0 uppercase select-none ${className}`}
    >
      {firstLetter}
    </div>
  );
};

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
  const [notificationSearch, setNotificationSearch] = useState("");
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
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "CM_First_Name" || name === "CM_Last_Name") {
        updated.CM_Full_Name = `${updated.CM_First_Name || ""} ${updated.CM_Last_Name || ""}`.trim();
      }
      return updated;
    });
  };

  const handleImageUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("userId", form.CM_User_ID);

      const res = await fetch("/api/teams", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setForm({ ...form, CM_Photo_URL: data.imageUrl });
        setImagePreview(data.imageUrl);
        toast.success("Image uploaded successfully!");
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
      const res = await fetch("/api/teams?_method=PUT", {
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
    const recipients = members.filter(m => m.CM_User_ID !== user?.CM_User_ID);
    if (selectedUsers.length === recipients.length) setSelectedUsers([]);
    else setSelectedUsers(recipients.map((m) => m.CM_User_ID));
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

  // Role Ordering: Owner -> Manager -> Engineer -> Others
  const getRoleOrder = (member) => {
    const roleDesc = (member.CM_Role_Description || "").toLowerCase();
    const laborRoll = (member.CM_Labor_Roll || "").toLowerCase();
    const roleId = member.CM_Role_ID || "";

    if (roleDesc.includes("owner") || roleDesc.includes("proprietor") || roleId === "ROL000001") {
      return 1;
    }
    if (roleDesc.includes("manager") || roleId === "ROL000002") {
      return 2;
    }
    if (roleDesc.includes("engineer") || laborRoll.includes("engineer") || roleId === "ROL000003") {
      return 3;
    }
    return 4;
  };

  const getRoleBadgeStyle = (roleDesc, roleId) => {
    const desc = (roleDesc || "").toLowerCase();
    
    if (desc.includes("owner") || desc.includes("proprietor") || roleId === "ROL000001") {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    if (desc.includes("manager") || roleId === "ROL000002") {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (desc.includes("engineer") || roleId === "ROL000003") {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (desc.includes("sales") || desc.includes("executive")) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    if (desc.includes("admin")) {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    return "bg-indigo-100 text-indigo-800 border-indigo-200";
  };

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const orderA = getRoleOrder(a);
    const orderB = getRoleOrder(b);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return (a.CM_Full_Name || "").localeCompare(b.CM_Full_Name || "");
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
              <h1 className="text-2xl md:text-2xl font-bold text-gray-800">Teams & Members</h1>
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
                    className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Key size={18} className="mr-2" />
                    Add Role
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-0.5 ${showNotificationPanel
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <div className="bg-white rounded-xl shadow-md p-2 border-l-4 border-blue-500">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-600 font-medium">Total Users</h3>
                <div className="bg-blue-100 p-2 rounded-full">
                  <span className="text-blue-600 font-bold">{totalUsers}</span>
                </div>
              </div>
              <p className="text-xl font-bold text-gray-800">{totalUsers}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-2 border-l-4 border-green-500">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-600 font-medium">Active Users</h3>
                <div className="bg-green-100 p-2 rounded-full">
                  <span className="text-green-600 font-bold">{activeUsers}</span>
                </div>
              </div>
              <p className="text-xl font-bold text-gray-800">{activeUsers}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-2 border-l-4 border-red-500">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-600 font-medium">Inactive Users</h3>
                <div className="bg-red-100 p-2 rounded-full">
                  <span className="text-red-600 font-bold">{inactiveUsers}</span>
                </div>
              </div>
              <p className="text-xl font-bold text-gray-800 mt-2">{inactiveUsers}</p>
            </div>
          </div>

          {/* Notification Modal Overlay */}
          {showNotificationPanel && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
                onClick={() => setShowNotificationPanel(false)}
              />

              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10 animate-scaleIn flex flex-col border border-white/20">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                      <Bell className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                        Create Broadcast
                      </h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Send a notification to your team
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNotificationPanel(false)}
                    className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all rounded-xl"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Broadcast Message</label>
                          <textarea
                            placeholder="What would you like to announce?"
                            className="w-full border-2 border-slate-100 rounded-2xl p-5 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-slate-700 font-medium transition-all resize-none shadow-sm bg-slate-50/30 min-h-[180px]"
                            value={notificationMessage}
                            onChange={(e) => setNotificationMessage(e.target.value)}
                            maxLength={500}
                          />
                          <div className="flex justify-between mt-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                              Max 500 characters
                            </p>
                            <p className={`text-[10px] font-black uppercase tracking-tight ${notificationMessage.length > 450 ? 'text-red-500' : 'text-blue-600'}`}>
                              {notificationMessage.length}/500
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Supporting File</label>
                          <div className="flex items-center">
                            <label className="flex items-center justify-center cursor-pointer bg-white hover:bg-slate-50 px-6 py-5 rounded-2xl transition-all duration-200 border-2 border-slate-100 border-dashed w-full group hover:border-blue-400">
                              <Upload size={20} className="mr-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                              <div className="text-left">
                                <span className="block text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-blue-600">
                                  {file ? "Change File" : "Upload Document"}
                                </span>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                                  Images, PDFs, or Docs
                                </span>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => setFile(e.target.files[0])}
                              />
                            </label>
                          </div>
                          {file && (
                            <div className="mt-4 flex items-center gap-3 text-xs font-black text-blue-700 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm animate-slideIn">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Upload size={14} />
                              </div>
                              <span className="truncate flex-1">{file.name}</span>
                              <button
                                onClick={() => setFile(null)}
                                className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all rounded-lg"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Recipients</label>
                          <button
                            onClick={selectAllUsers}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 active:scale-95 transition-all"
                          >
                            {selectedUsers.length === members.filter(m => m.CM_User_ID !== user?.CM_User_ID).length ? "Clear All" : "Select All"}
                          </button>
                        </div>

                        <div className="relative mb-4 group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                          <input
                            type="text"
                            placeholder="Search team members..."
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-100 focus:bg-white transition-all shadow-inner"
                            value={notificationSearch}
                            onChange={(e) => setNotificationSearch(e.target.value)}
                          />
                        </div>

                        <div className="flex-1 overflow-y-auto border-2 border-slate-50 rounded-2xl bg-slate-50/30 p-3 space-y-2 custom-scrollbar shadow-inner">
                          {members
                            .filter(m => m.CM_User_ID !== user?.CM_User_ID)
                            .filter(m =>
                              m.CM_Full_Name?.toLowerCase().includes(notificationSearch.toLowerCase()) ||
                              m.CM_Role_Description?.toLowerCase().includes(notificationSearch.toLowerCase())
                            )
                            .map(m => (
                              <div
                                key={m.CM_User_ID}
                                onClick={() => toggleSelectUser(m.CM_User_ID)}
                                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${selectedUsers.includes(m.CM_User_ID)
                                    ? "bg-white border-2 border-blue-500 shadow-lg shadow-blue-100"
                                    : "hover:bg-white border-2 border-transparent hover:border-slate-100"
                                  }`}
                              >
                                <div className="h-10 w-10 rounded-xl bg-slate-200 flex-shrink-0 overflow-hidden shadow-sm">
                                  <img src={m.CM_Photo_URL || "/default-avatar.png"} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-slate-800 truncate leading-tight">{m.CM_Full_Name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{m.CM_Role_Description}</p>
                                </div>
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${selectedUsers.includes(m.CM_User_ID) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-300'
                                  }`}>
                                  {selectedUsers.includes(m.CM_User_ID) ? <CheckSquare size={16} /> : <Square size={16} />}
                                </div>
                              </div>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {selectedUsers.length} Team members selected
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
                  <button
                    onClick={() => setShowNotificationPanel(false)}
                    className="px-6 py-3.5 rounded-xl text-sm font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNotification}
                    disabled={isSending || !notificationMessage.trim() || selectedUsers.length === 0}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-3.5 rounded-xl shadow-xl shadow-blue-200 transition-all duration-300 flex items-center font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-95"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} className="mr-3" />
                        Send Broadcast
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="p-3">
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

          {/* Members Display */}
          {sortedMembers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-20 text-center border border-slate-100">
              <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Search size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">No members found</h3>
              <p className="text-slate-400 mt-2 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white shadow-sm border border-gray-300 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 border border-gray-300 text-sm font-semibold text-gray-700 bg-gray-100">Member</th>
                      <th className="px-3 py-2 border border-gray-300 text-sm font-semibold text-gray-700 bg-gray-100">Contact</th>
                      <th className="px-3 py-2 border border-gray-300 text-sm font-semibold text-gray-700 bg-gray-100">Designation</th>
                      <th className="px-3 py-2 border border-gray-300 text-sm font-semibold text-gray-700 bg-gray-100 text-center">Status</th>
                      <th className="px-3 py-2 border border-gray-300 text-sm font-semibold text-gray-700 bg-gray-100 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMembers.map((m, idx) => (
                      <tr key={m.CM_User_ID} className={idx % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-gray-50 hover:bg-blue-50"}>
                        <td className="px-3 py-2 border border-gray-300">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <UserAvatar
                                src={m.CM_Photo_URL}
                                name={m.CM_Full_Name}
                                size="sm"
                                className="w-8 h-8 border border-gray-300"
                              />
                              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${m.CM_Is_Active === "Active" ? "bg-emerald-500" : "bg-red-500"}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{m.CM_Full_Name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 border border-gray-300">
                          <div className="text-sm text-gray-700">
                            <div>{m.CM_Email}</div>
                            <div className="text-gray-500">{m.CM_Phone_Number}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 border border-gray-300 text-sm text-gray-700">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-md border ${getRoleBadgeStyle(m.CM_Role_Description, m.CM_Role_ID)}`}>
                              {m.CM_Role_Description || "-"}
                            </span>
                            {m.CM_Labor_Roll && m.CM_Labor_Roll !== m.CM_Role_Description && (
                              <span className="text-xs text-gray-500 font-medium pl-0.5">{m.CM_Labor_Roll}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 border border-gray-300 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${m.CM_Is_Active === "Active" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
                            {m.CM_Is_Active}
                          </span>
                        </td>
                        <td className="px-3 py-2 border border-gray-300 text-center">
                          {(user?.CM_Role_ID === "ROL000001" || user?.CM_Role_ID === "ROL000002") && (
                            <button
                              onClick={() => handleEdit(m)}
                              className="p-1 text-gray-600 hover:text-blue-600 transition-colors bg-white border border-gray-300 rounded hover:bg-gray-50"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Grid View */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedMembers.map((m) => (
                  <div key={m.CM_User_ID} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm active:scale-95 transition-transform relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <button
                        onClick={() => toggleSelectUser(m.CM_User_ID)}
                        className={`p-2 rounded-lg transition-all ${selectedUsers.includes(m.CM_User_ID)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-400"
                          }`}
                      >
                        {selectedUsers.includes(m.CM_User_ID) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <UserAvatar
                        src={m.CM_Photo_URL}
                        name={m.CM_Full_Name}
                        size="lg"
                        className="w-16 h-16 border-2 border-white shadow-lg"
                      />
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 truncate">{m.CM_Full_Name}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-md border inline-block ${getRoleBadgeStyle(m.CM_Role_Description, m.CM_Role_ID)}`}>
                          {m.CM_Role_Description}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-slate-50">
                      <div className="flex items-center text-xs font-bold text-slate-600">
                        <Briefcase size={14} className="mr-3 text-slate-400" />
                        <span>Role: {m.CM_Role_Description}{m.CM_Labor_Roll && m.CM_Labor_Roll !== m.CM_Role_Description ? ` (${m.CM_Labor_Roll})` : ''}</span>
                      </div>
                      <div className="flex items-center text-xs font-bold text-slate-600">
                        <Mail size={14} className="mr-3 text-slate-400" />
                        {m.CM_Email}
                      </div>
                      <div className="flex items-center text-xs font-bold text-slate-600">
                        <Phone size={14} className="mr-3 text-slate-400" />
                        {m.CM_Phone_Number}
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${m.CM_Is_Active === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                        {m.CM_Is_Active}
                      </span>
                      {(user?.CM_Role_ID === "ROL000001" || user?.CM_Role_ID === "ROL000002") && (
                        <button
                          onClick={() => handleEdit(m)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Modal (New User Page Grid Style Design) */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white text-black border border-gray-300 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-300 bg-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Edit User Details</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Update user information in grid layout</p>
                  </div>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="text-gray-500 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form Body */}
                <div className="overflow-y-auto p-4 bg-gray-50 flex-1">
                  <div className="bg-white border border-gray-300 shadow-sm rounded-none overflow-hidden">
                    
                    {/* SECTION: Role & Status */}
                    <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                      Role & Status
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                      <div className="border-r border-gray-300">
                        <ExcelRow label="User Role" required>
                          <select
                            name="CM_Role_ID"
                            value={form.CM_Role_ID || ""}
                            onChange={handleChange}
                            className={inputClasses}
                            required
                          >
                            <option value="" disabled>Select Role...</option>
                            {roles.map((r) => (
                              <option key={r.CM_Role_ID} value={r.CM_Role_ID}>
                                {r.CM_Role_Description}
                              </option>
                            ))}
                          </select>
                        </ExcelRow>
                      </div>
                      <div>
                        <ExcelRow label="Account Status">
                          <select
                            name="CM_Is_Active"
                            value={form.CM_Is_Active || "Active"}
                            onChange={handleChange}
                            className={inputClasses}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </ExcelRow>
                      </div>
                    </div>

                    {/* SECTION: Personal Information */}
                    <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                      Personal Information
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                      <div className="border-r border-gray-300 flex flex-col">
                        <ExcelRow label="First Name" required>
                          <input
                            type="text"
                            name="CM_First_Name"
                            value={form.CM_First_Name || ""}
                            onChange={handleChange}
                            className={inputClasses}
                            required
                          />
                        </ExcelRow>
                        <ExcelRow label="Last Name" required>
                          <input
                            type="text"
                            name="CM_Last_Name"
                            value={form.CM_Last_Name || ""}
                            onChange={handleChange}
                            className={inputClasses}
                            required
                          />
                        </ExcelRow>
                        <ExcelRow label="Full Name">
                          <input
                            type="text"
                            name="CM_Full_Name"
                            value={form.CM_Full_Name || ""}
                            onChange={handleChange}
                            className={inputClasses}
                          />
                        </ExcelRow>
                        <ExcelRow label="Father's Name">
                          <input
                            type="text"
                            name="CM_Father_Name"
                            value={form.CM_Father_Name || ""}
                            onChange={handleChange}
                            className={inputClasses}
                          />
                        </ExcelRow>
                      </div>
                      <div className="flex flex-col">
                        <ExcelRow label="Date of Birth">
                          <input
                            type="date"
                            name="CM_Date_Of_Birth"
                            value={form.CM_Date_Of_Birth || ""}
                            onChange={handleChange}
                            className={inputClasses}
                          />
                        </ExcelRow>
                        <ExcelRow label="Gender">
                          <select
                            name="CM_Gender"
                            value={form.CM_Gender || ""}
                            onChange={handleChange}
                            className={inputClasses}
                          >
                            <option value="">Select Gender...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </ExcelRow>
                        <ExcelRow label="Marriage Status">
                          <select
                            name="CM_Marriage_Status"
                            value={form.CM_Marriage_Status || ""}
                            onChange={handleChange}
                            className={inputClasses}
                          >
                            <option value="">Select Status...</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </ExcelRow>
                      </div>
                    </div>

                    {/* SECTION: Photo Upload */}
                    <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                      Photo Upload
                    </div>
                    <div className="border-b border-gray-300 bg-white p-4">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                          <img
                            src={imagePreview || form.CM_Photo_URL || "/default-avatar.png"}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border border-gray-300 shadow-sm"
                          />
                          <span
                            className={`absolute bottom-0 right-0 rounded-full w-3.5 h-3.5 border-2 border-white ${
                              form.CM_Is_Active === "Active" ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="flex items-center cursor-pointer bg-white hover:bg-gray-50 px-4 py-2 rounded border border-gray-300 text-sm font-medium text-gray-700 shadow-sm transition-all w-fit">
                            <Upload size={16} className="mr-2 text-gray-500" />
                            <span>Upload New Photo</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </label>

                          {uploadingImage && (
                            <div className="flex items-center text-xs text-blue-600">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                              Uploading...
                            </div>
                          )}

                          {form.CM_Photo_URL && !uploadingImage && (
                            <button
                              type="button"
                              onClick={removeImage}
                              className="text-xs text-red-600 hover:text-red-800 font-medium text-left"
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION: Contact Information */}
                    <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                      Contact Information
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                      <div className="border-r border-gray-300 flex flex-col">
                        <ExcelRow label="Phone Number" required>
                          <input
                            type="tel"
                            name="CM_Phone_Number"
                            maxLength={10}
                            value={form.CM_Phone_Number || ""}
                            onChange={(e) => handleChange({ target: { name: "CM_Phone_Number", value: e.target.value.replace(/\D/g, "") } })}
                            className={inputClasses}
                            required
                          />
                        </ExcelRow>
                        <ExcelRow label="Email Address" required>
                          <input
                            type="email"
                            name="CM_Email"
                            value={form.CM_Email || ""}
                            onChange={handleChange}
                            className={inputClasses}
                            required
                          />
                        </ExcelRow>
                      </div>
                      <div className="flex flex-col">
                        <ExcelRow label="Alt. Phone">
                          <input
                            type="tel"
                            name="CM_Alternative_Phone"
                            maxLength={10}
                            value={form.CM_Alternative_Phone || ""}
                            onChange={(e) => handleChange({ target: { name: "CM_Alternative_Phone", value: e.target.value.replace(/\D/g, "") } })}
                            className={inputClasses}
                          />
                        </ExcelRow>
                      </div>
                    </div>

                    {/* SECTION: Education & Experience */}
                    <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                      Education & Experience
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                      <div className="border-r border-gray-300">
                        <ExcelRow label="Higher Education">
                          <input
                            type="text"
                            name="CM_Higher_Education"
                            value={form.CM_Higher_Education || ""}
                            onChange={handleChange}
                            className={inputClasses}
                          />
                        </ExcelRow>
                      </div>
                      <div>
                        <ExcelRow label="Previous Experience">
                          <input
                            type="text"
                            name="CM_Previous_Experiences"
                            value={form.CM_Previous_Experiences || ""}
                            onChange={handleChange}
                            className={inputClasses}
                          />
                        </ExcelRow>
                      </div>
                    </div>

                    {/* SECTION: ID Documents */}
                    <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                      ID Documents
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                      <div className="border-r border-gray-300">
                        <ExcelRow label="Aadhaar Number">
                          <input
                            type="text"
                            name="CM_Aadhaar_Number"
                            maxLength={12}
                            value={form.CM_Aadhaar_Number || ""}
                            onChange={(e) => handleChange({ target: { name: "CM_Aadhaar_Number", value: e.target.value.replace(/\D/g, "") } })}
                            className={inputClasses}
                          />
                        </ExcelRow>
                      </div>
                      <div>
                        <ExcelRow label="PAN Number">
                          <input
                            type="text"
                            name="CM_PAN_Number"
                            maxLength={10}
                            value={form.CM_PAN_Number || ""}
                            onChange={(e) => handleChange({ target: { name: "CM_PAN_Number", value: e.target.value.toUpperCase() } })}
                            className={inputClasses}
                          />
                        </ExcelRow>
                      </div>
                    </div>

                    {/* SECTION: Address Information */}
                    <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                      Address Information
                    </div>
                    <div className="border-b border-gray-300">
                      <ExcelRow label="Complete Address">
                        <textarea
                          name="CM_Address"
                          value={form.CM_Address || ""}
                          onChange={handleChange}
                          className={`${inputClasses} resize-y min-h-[60px]`}
                          rows="2"
                        />
                      </ExcelRow>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      <div className="border-r border-gray-300 flex flex-col">
                        <ExcelRow label="City">
                          <input
                            type="text"
                            name="CM_City"
                            value={form.CM_City || ""}
                            onChange={handleChange}
                            className={inputClasses}
                          />
                        </ExcelRow>
                        <ExcelRow label="State">
                          <input
                            type="text"
                            name="CM_State"
                            value={form.CM_State || ""}
                            onChange={handleChange}
                            className={inputClasses}
                          />
                        </ExcelRow>
                        <ExcelRow label="Postal Code">
                          <input
                            type="text"
                            name="CM_Postal_Code"
                            maxLength={6}
                            value={form.CM_Postal_Code || ""}
                            onChange={(e) => handleChange({ target: { name: "CM_Postal_Code", value: e.target.value.replace(/\D/g, "") } })}
                            className={inputClasses}
                          />
                        </ExcelRow>
                      </div>
                      <div className="flex flex-col">
                        <ExcelRow label="District">
                          <input
                            type="text"
                            name="CM_District"
                            value={form.CM_District || ""}
                            onChange={handleChange}
                            className={inputClasses}
                          />
                        </ExcelRow>
                        <ExcelRow label="Country">
                          <input
                            type="text"
                            name="CM_Country"
                            value={form.CM_Country || ""}
                            onChange={handleChange}
                            className={inputClasses}
                          />
                        </ExcelRow>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 px-6 py-3 border-t border-gray-300 bg-gray-100">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors shadow-sm"
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