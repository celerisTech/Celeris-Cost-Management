"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuthStore } from "../store/useAuthScreenStore";
import { FiSearch, FiUser, FiUsers, FiSmartphone, FiUserCheck, FiMail, FiUserX, FiCheckCircle, FiList, FiTarget, FiCheck, FiX, FiLock, FiGrid, FiBox, FiFilter, FiEye, FiEyeOff } from 'react-icons/fi';
import { BiSelectMultiple } from 'react-icons/bi';
import { MdOutlineFilterList, MdGridView, MdList } from 'react-icons/md';

const PrivilegeAssignment = () => {
  const [navigationLinks, setNavigationLinks] = useState([]);
  const [selectedPrivileges, setSelectedPrivileges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sections, setSections] = useState([]);
  const { user, setUser } = useAuthStore();

  // User search states
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [existingPrivileges, setExistingPrivileges] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Filter states
  const [activeSection, setActiveSection] = useState('all');
  const [searchNavbar, setSearchNavbar] = useState('');
  const [filteredLinks, setFilteredLinks] = useState([]);

  // View mode state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Fetch all navigation links and users on component mount
  useEffect(() => {
    fetchNavigationLinks();
    fetchAllUsers();
  }, []);

  // Fetch existing privileges when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchExistingPrivileges();
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

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults(users);
    } else {
      const filtered = users.filter(user =>
        user.CM_Full_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.CM_Phone_Number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.CM_Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.CM_Role_Description && user.CM_Role_Description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setSearchResults(filtered);
    }
  }, [searchTerm, users]);

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

  const fetchExistingPrivileges = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user-privileges?userId=${selectedUser.CM_User_ID}&roleId=${selectedUser.CM_Role_ID}`);
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

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm('');
    setMessage('');
    setActiveSection('all');
    setSearchNavbar('');
    setViewMode('grid');
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
      setMessage('Please select a user first');
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
      };

      const response = await axios.post('/api/assign-privileges', privilegeData);

      if (response.data.success) {
        setMessage(`✅ Successfully assigned ${selectedPrivileges.length} privileges to ${selectedUser.CM_Full_Name}`);
        fetchExistingPrivileges();

        // If assigning to self, force refresh sidebar
        if (selectedUser.CM_User_ID === user?.CM_User_ID) {
          const { refreshNavLinks } = useAuthStore.getState();
          if (refreshNavLinks) {
            refreshNavLinks(true); // Force refresh
          }
        }
      } else {
        setMessage(`❌ ${response.data.message || 'Failed to assign privileges'}`);
      }
    } catch (error) {
      console.error('Error assigning privileges:', error);
      setMessage(`❌ ${error.response?.data?.message || 'Error assigning privileges'}`);
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-16 lg:pt-20 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="max-w-8xl mx-auto">
          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-500 px-4 sm:px-6 md:px-8 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl shadow-inner backdrop-blur-xl">
                    <FiLock className="text-2xl sm:text-3xl text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      Privilege Assignment
                    </h1>
                    <p className="text-blue-100 text-sm mt-1">
                      Manage user navigation permissions
                    </p>
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
              <div className="p-4 sm:p-6 md:p-8">
                {/* Search Card */}
                <div className=" rounded-2xl border border-slate-200 shadow-lg p-4 sm:p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <FiUser className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Find User</h3>
                      <p className="text-gray-600 text-sm">Search by name, mobile, or email</p>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-3 pl-12 pr-4 bg-white border-2 border-gray-200 rounded-xl
                                 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                                 placeholder-gray-400"
                      />
                    </div>
                    <button
                      onClick={searchUsers}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl
                               hover:from-blue-600 hover:to-blue-700 shadow-md font-medium flex items-center justify-center gap-2"
                    >
                      <FiSearch />
                      Search
                    </button>
                  </div>

                  {/* Users Grid */}
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {searchResults.map((user) => (
                        <div
                          key={user.CM_User_ID}
                          onClick={() => handleUserSelect(user)}
                          className="bg-white border-2 border-gray-200 rounded-xl p-4 cursor-pointer
                                   hover:border-blue-400 hover:shadow-lg transition-all duration-200
                                   hover:scale-[1.02] active:scale-[0.98] group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                              <FiUser className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-800 truncate">{user.CM_Full_Name}</h4>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                  <FiSmartphone className="text-gray-400" />
                                  {user.CM_Phone_Number}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                  <FiUserCheck className="text-gray-400" />
                                  {user.CM_Role_Description}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-2 truncate">
                                  <FiMail className="text-gray-400" />
                                  {user.CM_Email}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiUsers className="mx-auto text-gray-300 text-4xl mb-3" />
                      <p className="text-gray-500">No users found</p>
                    </div>
                  )}
                </div>

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
              /* Privilege Assignment Section */
              <div className="p-4 sm:p-6 md:p-8">
                {/* Selected User Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-4 sm:p-6 mb-6 shadow-sm text-black">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FiUser className="text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-900">Assigning Privileges to</h3>
                          <p className="text-blue-700 font-medium">{selectedUser.CM_Full_Name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white/80 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Role</p>
                          <p className="font-semibold">{selectedUser.CM_Role_Description}</p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Mobile</p>
                          <p className="font-semibold">{selectedUser.CM_Phone_Number}</p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-semibold truncate">{selectedUser.CM_Email}</p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">User ID</p>
                          <p className="font-semibold truncate">{selectedUser.CM_User_ID}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={clearSelection}
                      className="px-5 py-3 bg-white text-gray-700 rounded-xl border-2 border-gray-300
                               hover:border-gray-400 hover:shadow-md flex items-center gap-2 font-medium"
                    >
                      <FiUserX />
                      Change User
                    </button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Existing</p>
                        <p className="text-3xl font-bold text-blue-800">{existingPrivileges.length}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <FiCheckCircle className="text-blue-600 text-2xl" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Selected</p>
                        <p className="text-3xl font-bold text-green-800">{selectedPrivileges.length}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-xl">
                        <FiList className="text-green-600 text-2xl" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Total</p>
                        <p className="text-3xl font-bold text-purple-800">{selectedPrivileges.length}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <FiTarget className="text-purple-600 text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters & Controls */}
                <div className="bg-white text-black rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row gap-4 mb-4">
                    {/* Search */}
                    <div className="relative flex-1">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search privileges..."
                        value={searchNavbar}
                        onChange={(e) => setSearchNavbar(e.target.value)}
                        className="w-full p-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none 
                                 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Section Filter */}
                    <div className="flex gap-3">
                      <div className="relative flex-1 sm:flex-none">
                        <select
                          value={activeSection}
                          onChange={(e) => setActiveSection(e.target.value)}
                          className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none 
                                   focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none"
                        >
                          <option value="all">All Sections ({getSectionCount('all')})</option>
                          {sections.map((section) => (
                            <option key={section} value={section}>
                              {section} ({getSectionCount(section)})
                            </option>
                          ))}
                        </select>
                        <MdOutlineFilterList className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      {/* View Toggle */}
                      <div className="flex bg-gray-100 rounded-xl p-1">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`px-3 py-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                        >
                          <MdGridView className={`text-lg ${viewMode === 'grid' ? 'text-blue-600' : 'text-gray-500'}`} />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`px-3 py-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                        >
                          <MdList className={`text-lg ${viewMode === 'list' ? 'text-blue-600' : 'text-gray-500'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleSelectAll()}
                      className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl
                               hover:from-green-600 hover:to-emerald-700 flex items-center gap-2 text-sm font-medium"
                    >
                      <FiEye />
                      Select All Visible
                    </button>
                    <button
                      onClick={() => handleDeselectAll()}
                      className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl
                               hover:from-red-600 hover:to-pink-700 flex items-center gap-2 text-sm font-medium"
                    >
                      <FiEyeOff />
                      Deselect All Visible
                    </button>
                    <div className="flex-1 text-right">
                      <span className="text-gray-600 text-sm">
                        Showing {filteredLinks.length} of {navigationLinks.length} items
                      </span>
                    </div>
                  </div>
                </div>

                {/* Privileges Grid/List */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FiLock className="text-blue-500" />
                        Navigation Privileges ({filteredLinks.length})
                      </h3>
                      <span className="text-sm text-gray-600">
                        {selectedPrivileges.length} selected
                      </span>
                    </div>
                  </div>

                  {filteredLinks.length === 0 ? (
                    <div className="p-10 text-center bg-gray-50">
                      <FiSearch className="mx-auto text-gray-300 text-4xl mb-3" />
                      <p className="text-gray-500">No navigation items found</p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 sm:p-6">
                      {filteredLinks.map((link) => {
                        const isExisting = existingPrivileges.some(
                          (priv) => priv.CM_Nav_Link_ID === link.CM_Nav_Link_ID
                        );
                        const isSelected = selectedPrivileges.includes(link.CM_Nav_Link_ID);

                        return (
                          <div
                            key={link.CM_Nav_Link_ID}
                            onClick={() => handlePrivilegeToggle(link.CM_Nav_Link_ID)}
                            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
                                     ${isSelected
                                ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                                : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'}
                                     ${isExisting ? 'ring-1 ring-green-300' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                <FiBox className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-800 mb-1 truncate">{link.CM_Name}</h4>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    {link.CM_Section}
                                  </span>
                                  {isExisting && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                      <FiCheck size={10} /> Existing
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded border flex items-center justify-center
                                             ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                {isSelected && <FiCheck className="text-white text-xs" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* List View */
                    <div className="divide-y divide-gray-100">
                      {filteredLinks.map((link) => {
                        const isExisting = existingPrivileges.some(
                          (priv) => priv.CM_Nav_Link_ID === link.CM_Nav_Link_ID
                        );
                        const isSelected = selectedPrivileges.includes(link.CM_Nav_Link_ID);

                        return (
                          <div
                            key={link.CM_Nav_Link_ID}
                            onClick={() => handlePrivilegeToggle(link.CM_Nav_Link_ID)}
                            className={`flex items-center gap-4 p-4 cursor-pointer transition-colors
                                     ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                          >
                            <div className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0
                                           ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                              {isSelected && <FiCheck className="text-white text-xs" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-800 mb-1">{link.CM_Name}</h4>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  {link.CM_Section}
                                </span>
                                {isExisting && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                    <FiCheck size={10} /> Already assigned
                                  </span>
                                )}
                              </div>
                            </div>
                            <FiBox className={`text-lg ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || selectedPrivileges.length === 0}
                    className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl
                             hover:from-blue-700 hover:to-purple-700 shadow-lg font-semibold text-lg
                             flex items-center gap-3 transition-all duration-200
                             ${loading || selectedPrivileges.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <FiLock />
                        Assign {selectedPrivileges.length} Privilege{selectedPrivileges.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>

                {/* Message */}
                {message && (
                  <div className={`mt-6 rounded-xl p-4 text-center ${message.includes("❌") ? "bg-red-50 text-red-700 border border-red-200" :
                      "bg-green-50 text-green-700 border border-green-200"
                    }`}>
                    {message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivilegeAssignment;