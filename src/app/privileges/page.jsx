"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuthStore } from "../store/useAuthScreenStore";
import { FiSearch, FiUser, FiUsers, FiSmartphone, FiUserCheck, FiMail, FiUserX, FiCheckCircle, FiList, FiTarget, FiCheck, FiX, FiLock, FiGrid, FiBox, FiFilter, FiEye, FiEyeOff, FiChevronRight, FiBriefcase, FiAlertCircle, FiXCircle } from 'react-icons/fi';
import { BiSelectMultiple } from 'react-icons/bi';
import { MdOutlineFilterList, MdGridView, MdList } from 'react-icons/md';

const ExcelRow = ({ label, children, required }) => (
  <div className="flex flex-col sm:flex-row border-b border-gray-300 last:border-b-0">
    <div className="sm:w-1/3 bg-gray-100 p-3 text-sm font-medium text-gray-700 border-b sm:border-b-0 sm:border-r border-gray-300 flex items-center">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </div>
    <div className="sm:w-2/3 bg-white relative flex items-center min-h-[42px] px-3 py-2">
      {children}
    </div>
  </div>
);

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

const PrivilegeAssignment = () => {
  const [navigationLinks, setNavigationLinks] = useState([]);
  const [selectedPrivileges, setSelectedPrivileges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sections, setSections] = useState([]);
  const { user, setUser } = useAuthStore();
  const [assignmentMode, setAssignmentMode] = useState('user'); // 'user' or 'role'

  // Custom Alert Modal State
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    type: 'success', // 'success' | 'error' | 'warning'
    title: '',
    message: ''
  });

  const showAlert = (type, title, message) => {
    setAlertConfig({ show: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, show: false }));
  };

  // User search states
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [existingPrivileges, setExistingPrivileges] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Filter states
  const [selectedRole, setSelectedRole] = useState('all');
  const [roles, setRoles] = useState([]);
  const [activeSection, setActiveSection] = useState('all');
  const [searchNavbar, setSearchNavbar] = useState('');
  const [filteredLinks, setFilteredLinks] = useState([]);

  // View mode state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Role ordering: Owner -> Manager -> Engineer -> Others
  const getRoleOrder = (userItem) => {
    const roleDesc = (userItem.CM_Role_Description || "").toLowerCase();
    const roleId = userItem.CM_Role_ID || "";

    if (roleDesc.includes("owner") || roleDesc.includes("proprietor") || roleId === "ROL000001") {
      return 1;
    }
    if (roleDesc.includes("manager") || roleId === "ROL000002") {
      return 2;
    }
    if (roleDesc.includes("engineer") || roleId === "ROL000003") {
      return 3;
    }
    return 4;
  };

  const sortedSearchResults = [...searchResults].sort((a, b) => {
    const orderA = getRoleOrder(a);
    const orderB = getRoleOrder(b);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return (a.CM_Full_Name || "").localeCompare(b.CM_Full_Name || "");
  });

  // Fetch all navigation links and users on component mount
  useEffect(() => {
    fetchNavigationLinks();
    fetchAllUsers();
  }, []);

  // Fetch existing privileges when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchExistingPrivileges(selectedUser, assignmentMode);
    }
  }, [selectedUser]);

  // Filter navigation links based on search and active section
  useEffect(() => {
    let filtered = [...navigationLinks];

    if (activeSection !== 'all') {
      filtered = filtered.filter(link => link.CM_Section === activeSection);
    }

    if (searchNavbar) {
      filtered = filtered.filter(link =>
        link.CM_Name.toLowerCase().includes(searchNavbar.toLowerCase()) ||
        link.CM_Section.toLowerCase().includes(searchNavbar.toLowerCase())
      );
    }

    setFilteredLinks(filtered);
  }, [navigationLinks, activeSection, searchNavbar]);

  // Filter users based on search term and role
  useEffect(() => {
    let filtered = [...users];

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.CM_Role_Description === selectedRole);
    }

    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.CM_Full_Name?.toLowerCase().includes(lowerSearch) ||
        user.CM_Phone_Number?.toLowerCase().includes(lowerSearch) ||
        user.CM_Email?.toLowerCase().includes(lowerSearch) ||
        user.CM_User_ID?.toString().includes(lowerSearch)
      );
    }
    setSearchResults(filtered);
  }, [searchTerm, selectedRole, users]);

  const fetchNavigationLinks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/navigation-links');
      if (response.data.success) {
        setNavigationLinks(response.data.data);
        const uniqueSections = [...new Set(response.data.data.map(item => item.CM_Section))];
        setSections(uniqueSections);
        setFilteredLinks(response.data.data);
      } else {
        setMessage('Error loading navigation links');
      }
    } catch (error) {
      console.error('Error fetching navigation links:', error);
      setMessage('Error loading navigation links');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users-search?search=');
      if (response.data.success) {
        setUsers(response.data.data);
        setSearchResults(response.data.data);
        // Extract unique roles
        const uniqueRoles = [...new Set(response.data.data.map(u => u.CM_Role_Description))].filter(Boolean);
        setRoles(uniqueRoles);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;

    setSearchLoading(true);
    try {
      const response = await axios.get(`/api/users-search?search=${encodeURIComponent(searchTerm)}`);
      if (response.data.success) {
        setSearchResults(response.data.data);
      } else {
        setSearchResults([]);
        setMessage('No users found');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setMessage('Error searching users');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchExistingPrivileges = async (targetUser = selectedUser, modeToFetch = assignmentMode) => {
    if (!targetUser) return;
    try {
      setLoading(true);
      const response = await axios.get(`/api/user-privileges?userId=${targetUser.CM_User_ID}&roleId=${targetUser.CM_Role_ID}&mode=${modeToFetch}&_t=${Date.now()}`);
      if (response.data.success) {
        setExistingPrivileges(response.data.data);
        setSelectedPrivileges(response.data.data.map(priv => priv.CM_Nav_Link_ID));
      }
    } catch (error) {
      console.error('Error fetching existing privileges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentModeChange = (newMode) => {
    if (newMode === assignmentMode) return;
    setAssignmentMode(newMode);
    if (selectedUser) {
      fetchExistingPrivileges(selectedUser, newMode);
    }
  };

  const handleUserSelect = (userItem) => {
    setSelectedUser(userItem);
    setSearchTerm('');
    setMessage('');
    setActiveSection('all');
    setSearchNavbar('');
    setViewMode('grid');
    setAssignmentMode('user');
    fetchExistingPrivileges(userItem, 'user');
  };

  const handlePrivilegeToggle = (navLinkId) => {
    setSelectedPrivileges(prev => {
      if (prev.includes(navLinkId)) {
        return prev.filter(id => id !== navLinkId);
      } else {
        return [...prev, navLinkId];
      }
    });
  };

  const handleSelectAll = (section = null) => {
    if (section) {
      const sectionLinks = navigationLinks
        .filter(link => link.CM_Section === section)
        .map(link => link.CM_Nav_Link_ID);

      setSelectedPrivileges(prev => {
        const newSelection = [...prev];
        sectionLinks.forEach(linkId => {
          if (!newSelection.includes(linkId)) {
            newSelection.push(linkId);
          }
        });
        return newSelection;
      });
    } else {
      const allFilteredLinkIds = filteredLinks.map(link => link.CM_Nav_Link_ID);
      setSelectedPrivileges(prev => {
        const newSelection = [...prev];
        allFilteredLinkIds.forEach(linkId => {
          if (!newSelection.includes(linkId)) {
            newSelection.push(linkId);
          }
        });
        return newSelection;
      });
    }
  };

  const handleDeselectAll = (section = null) => {
    if (section) {
      const sectionLinks = navigationLinks
        .filter(link => link.CM_Section === section)
        .map(link => link.CM_Nav_Link_ID);

      setSelectedPrivileges(prev =>
        prev.filter(linkId => !sectionLinks.includes(linkId))
      );
    } else {
      const allFilteredLinkIds = filteredLinks.map(link => link.CM_Nav_Link_ID);
      setSelectedPrivileges(prev =>
        prev.filter(linkId => !allFilteredLinkIds.includes(linkId))
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      const msg = 'Please select a user first before assigning privileges.';
      setMessage(msg);
      showAlert('warning', 'User Selection Required', msg);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const privilegeData = {
        userId: selectedUser.CM_User_ID,
        roleId: selectedUser.CM_Role_ID,
        companyId: selectedUser.CM_Company_ID,
        navLinkIds: selectedPrivileges,
        createdBy: user?.CM_Full_Name || "",
        assignmentMode: assignmentMode,
      };

      const response = await axios.post('/api/assign-privileges', privilegeData);

      if (response.data.success) {
        const successMsg = `Successfully assigned ${selectedPrivileges.length} privilege(s) in ${assignmentMode === 'user' ? 'User-Specific' : 'Role-Default'} mode for ${selectedUser.CM_Full_Name}.`;
        setMessage(`✅ ${successMsg}`);
        showAlert('success', 'Privileges Updated Successfully', successMsg);
        fetchExistingPrivileges();

        // If assigning to self, force refresh sidebar
        if (selectedUser.CM_User_ID === user?.CM_User_ID) {
          const { refreshNavLinks } = useAuthStore.getState();
          if (refreshNavLinks) {
            refreshNavLinks(true); // Force refresh
          }
        }
      } else {
        const errorMsg = response.data.message || 'Failed to assign privileges';
        setMessage(`❌ ${errorMsg}`);
        showAlert('error', 'Assignment Failed', errorMsg);
      }
    } catch (error) {
      console.error('Error assigning privileges:', error);
      const errorMsg = error.response?.data?.message || 'Error occurred while assigning privileges';
      setMessage(`❌ ${errorMsg}`);
      showAlert('error', 'Error Occurred', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setSelectedPrivileges([]);
    setExistingPrivileges([]);
    setMessage('');
    setActiveSection('all');
    setSearchNavbar('');
    setViewMode('grid');
    setAssignmentMode('user');
  };

  const getPrivilegeCountBySection = (section) => {
    if (section === 'all') {
      return selectedPrivileges.length;
    }

    const sectionLinks = navigationLinks
      .filter(link => link.CM_Section === section)
      .map(link => link.CM_Nav_Link_ID);

    return selectedPrivileges.filter(id => sectionLinks.includes(id)).length;
  };

  const getSectionCount = (section) => {
    if (section === 'all') return navigationLinks.length;
    return navigationLinks.filter(link => link.CM_Section === section).length;
  };

  return (
    <div className="flex h-screen bg-white">
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="max-w-8xl mx-auto">
          {/* Main Card */}
          <div className=" overflow-hidden">
            {/* Header */}
            <div className="px-2 py-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="rounded-lg sm:rounded-xl">
                    <FiLock className="text-xl sm:text-xl text-gray-800" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-2xl font-bold text-gray-800">
                      Privilege Assignment
                    </h1>
                  </div>
                </div>

                {selectedUser && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <p className="text-white text-sm font-medium">Selected: {selectedUser.CM_Full_Name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* User Search Section */}
            {!selectedUser ? (
              <div className="p-2 sm:p-2 md:p-2">
                {/* Search & Filter Bar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-3">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                      type="text"
                      placeholder="Search by name, ID, mobile or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full py-3 pl-12 pr-4 bg-white border border-slate-400 rounded-xl
                                 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50
                                 placeholder-gray-400 text-sm font-medium transition-all"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="relative min-w-[200px]">
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full py-3 pl-10 pr-10 bg-white border border-slate-400 rounded-xl
                                   focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50
                                   appearance-none text-sm font-bold text-slate-700 cursor-pointer transition-all"
                      >
                        <option value="all">All Roles</option>
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <FiUserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <MdOutlineFilterList className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <button
                      onClick={fetchAllUsers}
                      className="px-6 py-3 bg-white border border-slate-400 text-slate-600 rounded-xl
                                 hover:bg-slate-50 hover:text-blue-600 font-bold text-sm transition-all shadow-sm"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Search Results Display */}
                {sortedSearchResults.length > 0 ? (
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
                          {sortedSearchResults.map((u, idx) => (
                            <tr
                              key={u.CM_User_ID}
                              onClick={() => handleUserSelect(u)}
                              className={idx % 2 === 0 ? "bg-white hover:bg-blue-50 cursor-pointer" : "bg-gray-50 hover:bg-blue-50 cursor-pointer"}
                            >
                              <td className="px-3 py-2 border border-gray-300">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <UserAvatar
                                      src={u.CM_Photo_URL}
                                      name={u.CM_Full_Name}
                                      size="sm"
                                      className="w-8 h-8 border border-gray-300"
                                    />
                                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${u.CM_Is_Active === "Active" ? "bg-emerald-500" : "bg-red-500"}`} />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm text-gray-900">{u.CM_Full_Name}</p>
                                    <p className="text-xs text-gray-500">{u.CM_Role_Description}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 border border-gray-300">
                                <div className="text-sm text-gray-700">
                                  <div>{u.CM_Email}</div>
                                  <div className="text-gray-500">{u.CM_Phone_Number}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2 border border-gray-300 text-sm text-gray-700">
                                {u.CM_Role_Description || "-"}
                              </td>
                              <td className="px-3 py-2 border border-gray-300 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.CM_Is_Active === "Active" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
                                  {u.CM_Is_Active || "Active"}
                                </span>
                              </td>
                              <td className="px-3 py-2 border border-gray-300 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUserSelect(u);
                                  }}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
                                >
                                  Assign Privileges
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Grid View */}
                    <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {sortedSearchResults.map((u) => (
                        <div
                          key={u.CM_User_ID}
                          onClick={() => handleUserSelect(u)}
                          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm active:scale-95 transition-transform relative overflow-hidden cursor-pointer"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <UserAvatar
                              src={u.CM_Photo_URL}
                              name={u.CM_Full_Name}
                              size="lg"
                              className="w-16 h-16 border-2 border-white shadow-lg"
                            />
                            <div className="min-w-0">
                              <h4 className="font-black text-slate-900 truncate">{u.CM_Full_Name}</h4>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                {u.CM_Role_Description}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2 pt-4 border-t border-slate-50">
                            <div className="flex items-center text-xs font-bold text-slate-600">
                              <FiBriefcase size={14} className="mr-3 text-slate-400" />
                              {u.CM_Role_Description || "-"}
                            </div>
                            <div className="flex items-center text-xs font-bold text-slate-600">
                              <FiMail size={14} className="mr-3 text-slate-400" />
                              {u.CM_Email}
                            </div>
                            <div className="flex items-center text-xs font-bold text-slate-600">
                              <FiSmartphone size={14} className="mr-3 text-slate-400" />
                              {u.CM_Phone_Number}
                            </div>
                          </div>
                          <div className="mt-6 flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.CM_Is_Active === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {u.CM_Is_Active || "Active"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUserSelect(u);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
                            >
                              Assign
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : searchLoading || loading ? (
                  <div className="flex flex-col justify-center items-center h-64 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-b-blue-600"></div>
                    <p className="mt-4 font-bold text-slate-500">Searching Users...</p>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <FiUserX className="text-slate-300 text-3xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No matching users</h3>
                    <p className="text-slate-500 mt-1">Try adjusting your filters or search term</p>
                  </div>

                )}

                {/* Message */}
                {message && (
                  <div className={`rounded-xl p-4 mb-4 ${message.includes("❌") ? "bg-red-50 text-red-700 border border-red-200" :
                    "bg-green-50 text-green-700 border border-green-200"
                    }`}>
                    <div className="flex items-center gap-2">
                      {message.includes("❌") ? "❌" : "✅"} {message}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Privilege Assignment Section (Excel Grid Style Design) */
              <div className="p-2">
                <div className="bg-white border border-gray-300 shadow-sm rounded-none overflow-hidden text-black mb-6">
                  
                  {/* SECTION: Selected User Details */}
                  <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider flex justify-between items-center">
                    <span>Target User & Assignment Mode</span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded shadow-sm flex items-center gap-1 font-medium transition-colors"
                    >
                      <FiUserX className="text-gray-500" /> Change User
                    </button>
                  </div>

                  <div className="border-b border-gray-300">
                    <ExcelRow label="Selected Member">
                      <div className="flex items-center gap-3 py-1">
                        <img
                          src={selectedUser.CM_Photo_URL || "/default-avatar.png"}
                          className="w-8 h-8 rounded-full object-cover border border-gray-300 shadow-sm"
                          alt={selectedUser.CM_Full_Name}
                        />
                        <div>
                          <p className="font-bold text-sm text-gray-900">{selectedUser.CM_Full_Name}</p>
                          <p className="text-xs text-gray-500">{selectedUser.CM_Role_Description} • {selectedUser.CM_Email || selectedUser.CM_Phone_Number}</p>
                        </div>
                      </div>
                    </ExcelRow>

                    <ExcelRow label="Assignment Type" required>
                      <div className="flex flex-col sm:flex-row gap-4 py-1.5 w-full">
                        <div
                          onClick={() => handleAssignmentModeChange('user')}
                          className={`flex-1 flex items-start gap-2.5 p-2.5 border rounded cursor-pointer transition-all ${
                            assignmentMode === 'user'
                              ? 'border-blue-500 bg-blue-50/60 font-semibold text-blue-900'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="assignmentMode"
                            value="user"
                            checked={assignmentMode === 'user'}
                            onChange={() => handleAssignmentModeChange('user')}
                            className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold block">User-Specific Privilege</span>
                            <span className="text-[11px] font-normal text-gray-500 block">Customize access for {selectedUser.CM_First_Name || selectedUser.CM_Full_Name} only</span>
                          </div>
                        </div>

                        <div
                          onClick={() => handleAssignmentModeChange('role')}
                          className={`flex-1 flex items-start gap-2.5 p-2.5 border rounded cursor-pointer transition-all ${
                            assignmentMode === 'role'
                              ? 'border-blue-500 bg-blue-50/60 font-semibold text-blue-900'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="assignmentMode"
                            value="role"
                            checked={assignmentMode === 'role'}
                            onChange={() => handleAssignmentModeChange('role')}
                            className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold block">Role-Default Privilege</span>
                            <span className="text-[11px] font-normal text-gray-500 block">Update default access for all {selectedUser.CM_Role_Description} users</span>
                          </div>
                        </div>
                      </div>
                    </ExcelRow>

                    <ExcelRow label="Privileges Overview">
                      <div className="flex flex-wrap gap-4 text-xs font-medium py-1">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded">
                          Existing: <strong className="ml-1">{existingPrivileges.length}</strong>
                        </span>
                        <span className="px-2.5 py-1 bg-green-50 text-green-800 border border-green-200 rounded">
                          Selected: <strong className="ml-1">{selectedPrivileges.length}</strong>
                        </span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded">
                          Total Available: <strong className="ml-1">{navigationLinks.length}</strong>
                        </span>
                      </div>
                    </ExcelRow>
                  </div>

                  {/* SECTION: Navigation Privileges Grid */}
                  <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <span>Navigation Privileges</span>
                    <span className="text-xs text-gray-600 font-normal">
                      Showing {filteredLinks.length} of {navigationLinks.length} privileges
                    </span>
                  </div>

                  {/* Filter & Action Toolbar */}
                  <div className="p-3 bg-gray-50 border-b border-gray-300 flex flex-col md:flex-row justify-between items-center gap-3">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
                      {/* Search */}
                      <div className="relative flex-1 min-w-[200px]">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search navigation privileges..."
                          value={searchNavbar}
                          onChange={(e) => setSearchNavbar(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Section Dropdown */}
                      <div className="relative min-w-[160px]">
                        <select
                          value={activeSection}
                          onChange={(e) => setActiveSection(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Sections ({getSectionCount('all')})</option>
                          {sections.map((section) => (
                            <option key={section} value={section}>
                              {section} ({getSectionCount(section)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Bulk Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleSelectAll()}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded shadow-sm transition-colors flex items-center gap-1"
                      >
                        <FiEye size={14} /> Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeselectAll()}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded shadow-sm transition-colors flex items-center gap-1"
                      >
                        <FiEyeOff size={14} /> Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Excel Table View for Navigation Privileges */}
                  <div className="overflow-x-auto bg-white">
                    {filteredLinks.length === 0 ? (
                      <div className="p-10 text-center text-gray-500 text-sm">
                        <FiSearch className="mx-auto text-gray-300 text-3xl mb-2" />
                        No navigation privileges matched your criteria.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-300 text-xs font-semibold text-gray-700">
                            <th className="w-12 px-3 py-2.5 border-r border-gray-300 text-center">
                              <input
                                type="checkbox"
                                checked={filteredLinks.length > 0 && filteredLinks.every(l => selectedPrivileges.includes(l.CM_Nav_Link_ID))}
                                onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                              />
                            </th>
                            <th className="px-4 py-2.5 border-r border-gray-300">Privilege Name</th>
                            <th className="px-4 py-2.5 border-r border-gray-300">Section</th>
                            <th className="px-4 py-2.5 border-r border-gray-300 text-center">Assignment Status</th>
                            <th className="px-4 py-2.5 text-center">Access Granted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLinks.map((link, idx) => {
                            const isExisting = existingPrivileges.some(
                              (priv) => priv.CM_Nav_Link_ID === link.CM_Nav_Link_ID
                            );
                            const isSelected = selectedPrivileges.includes(link.CM_Nav_Link_ID);

                            return (
                              <tr
                                key={link.CM_Nav_Link_ID}
                                onClick={() => handlePrivilegeToggle(link.CM_Nav_Link_ID)}
                                className={`border-b border-gray-300 text-sm cursor-pointer transition-colors ${
                                  isSelected ? "bg-blue-50/80 hover:bg-blue-100/80" : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-gray-100/50"
                                }`}
                              >
                                <td className="px-3 py-2.5 border-r border-gray-300 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handlePrivilegeToggle(link.CM_Nav_Link_ID)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-2.5 border-r border-gray-300 font-medium text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <FiBox className={isSelected ? "text-blue-600" : "text-gray-400"} size={16} />
                                    <span>{link.CM_Name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 border-r border-gray-300 text-gray-600 text-xs">
                                  <span className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded font-medium text-gray-700">
                                    {link.CM_Section}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 border-r border-gray-300 text-center text-xs">
                                  {isExisting ? (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 border border-green-200 rounded font-semibold inline-flex items-center gap-1">
                                      <FiCheck size={12} /> Assigned
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 rounded font-medium">
                                      Not Assigned
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-center text-xs">
                                  <span className={`px-2.5 py-1 rounded font-bold uppercase ${
                                    isSelected ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                                  }`}>
                                    {isSelected ? "Allowed" : "Blocked"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* SECTION: Action Footer Bar */}
                  <div className="bg-gray-100 border-t border-gray-300 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-xs text-gray-700">
                      <strong>{selectedPrivileges.length}</strong> privilege(s) selected for <strong>{selectedUser.CM_Full_Name}</strong> ({assignmentMode === 'user' ? 'User-Specific' : 'Role-Default'} mode).
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || selectedPrivileges.length === 0}
                      className={`px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Assigning Privileges...
                        </>
                      ) : (
                        <>
                          <FiLock size={16} />
                          Save & Assign {selectedPrivileges.length} Privilege{selectedPrivileges.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Inline Alert Banner */}
                {message && (
                  <div className={`mt-4 rounded-xl p-4 border flex items-center justify-between shadow-sm transition-all animate-fade-in ${
                    message.includes("❌")
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}>
                    <div className="flex items-center gap-3">
                      {message.includes("❌") ? (
                        <FiXCircle className="text-rose-500 text-xl flex-shrink-0" />
                      ) : (
                        <FiCheckCircle className="text-emerald-500 text-xl flex-shrink-0" />
                      )}
                      <span className="text-sm font-semibold">{message}</span>
                    </div>
                    <button
                      onClick={() => setMessage('')}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styled Custom Alert Modal */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl border overflow-hidden transform transition-all scale-100 ${
            alertConfig.type === 'success' ? 'border-emerald-200' :
            alertConfig.type === 'error' ? 'border-rose-200' : 'border-amber-200'
          }`}>
            {/* Top Indicator Bar */}
            <div className={`h-2 w-full ${
              alertConfig.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
              alertConfig.type === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-amber-400 to-orange-500'
            }`} />

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                  alertConfig.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                  alertConfig.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {alertConfig.type === 'success' ? (
                    <FiCheckCircle size={26} />
                  ) : alertConfig.type === 'error' ? (
                    <FiXCircle size={26} />
                  ) : (
                    <FiAlertCircle size={26} />
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {alertConfig.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {alertConfig.message}
                  </p>
                </div>

                <button
                  onClick={closeAlert}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Action Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeAlert}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 ${
                    alertConfig.type === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                      : alertConfig.type === 'error'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                  }`}
                >
                  Okay, Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivilegeAssignment;