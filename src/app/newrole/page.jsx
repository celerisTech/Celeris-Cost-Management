"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    Loader2, Key, Check, Plus, Users, Edit, Save, X,
    Search, Filter, RefreshCw, Shield, AlertCircle, ArrowLeft
} from "lucide-react";
import { useAuthStore } from "../store/useAuthScreenStore";
import Navbar from '../components/Navbar'
import { formatTitleCase, formatSentenceCase } from "../utils/textUtils";

function RolesManagement() {
    const { user } = useAuthStore();
    const [roles, setRoles] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [editingRole, setEditingRole] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [roleData, setRoleData] = useState({
        CM_Role_Description: "",
        CM_Company_ID: user?.CM_Company_ID || "",
        CM_Is_Status: "Active",
        CM_Created_By: user?.CM_Full_Name || "",
    });

    // Update form data when user changes
    useEffect(() => {
        if (user) {
            setRoleData(prev => ({
                ...prev,
                CM_Company_ID: user.CM_Company_ID || "",
                CM_Created_By: user.CM_Full_Name || ""
            }));
        }
    }, [user]);

    // Fetch roles on component mount
    useEffect(() => {
        fetchRoles();
    }, []);

    // Filter roles based on search query and status filter
    const filteredRoles = roles.filter(role => {
        const matchesSearch = role.CM_Role_Description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === "all" ||
            role.CM_Is_Status.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const fetchRoles = async () => {
        try {
            setIsLoadingRoles(true);
            const res = await fetch("/api/get-role");

            if (!res.ok) {
                throw new Error("Failed to fetch roles");
            }

            const result = await res.json();
            if (result.success) {
                setRoles(result.roles || []);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
            toast.error("Failed to load roles");
        } finally {
            setIsLoadingRoles(false);
        }
    };

    const handleInputChange = (field, value) => {
        let formattedValue = value;
        if (field === "CM_Role_Description") {
            formattedValue = formatTitleCase(value);
        }
        setRoleData(prev => ({ ...prev, [field]: formattedValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!roleData.CM_Role_Description?.trim()) {
            toast.error("Role description is required");
            setIsLoading(false);
            return;
        }

        if (!user || !roleData.CM_Company_ID || !roleData.CM_Created_By) {
            toast.error("User information is missing. Please log in again.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/get-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(roleData),
            });

            if (!res.ok) {
                const err = await res.json();
                if (err.error === "Role already exists for this company") {
                    toast.error("⚠️ A role with this name already exists.");
                } else {
                    toast.error(`❌ ${err.error || "Failed to create role"}`);
                }
                setIsLoading(false);
                return;
            }


            const result = await res.json();
            toast.success("✅ Role added successfully");

            setRoleData({
                CM_Role_Description: "",
                CM_Company_ID: user?.CM_Company_ID || "",
                CM_Is_Status: "Active",
                CM_Created_By: user?.CM_Full_Name || "",
            });

            setShowAddForm(false);
            fetchRoles();
        } catch (error) {
            toast.error(`❌ ${error.message}`);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (role) => {
        setEditingRole({
            ...role,
            isEditing: true
        });
    };

    const handleCancelEdit = () => {
        setEditingRole(null);
    };

    const handleEditInputChange = (field, value) => {
        let formattedValue = value;
        if (field === "CM_Role_Description") {
            formattedValue = formatTitleCase(value);
        }
        setEditingRole(prev => ({
            ...prev,
            [field]: formattedValue
        }));
    };

    const handleUpdateRole = async () => {
        if (!editingRole?.CM_Role_Description?.trim()) {
            toast.error("Role description is required");
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch("/api/get-role?_method=PUT", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    CM_Role_ID: editingRole.CM_Role_ID,
                    CM_Role_Description: editingRole.CM_Role_Description,
                    CM_Is_Status: editingRole.CM_Is_Status,
                    CM_Updated_By: user?.CM_Full_Name || "",
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update role");
            }

            toast.success("✅ Role updated successfully");
            setEditingRole(null);
            fetchRoles();
        } catch (error) {
            toast.error(`❌ ${error.message}`);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <Navbar />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto min-h-screen">
                {!showAddForm ? (
                    // Roles List View
                    <div className="p-6">
                        <div className="max-w-7xl mx-auto">
                            {/* Header */}
                            <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    {/* Left Section (Title + Icon) */}
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-3 rounded-xl">
                                            <Shield className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>
                                            <p className="text-gray-500">
                                                Create and manage user roles for your organization
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Section (Buttons) */}
                                    <div className="flex items-center gap-3 ml-auto">
                                        <button
                                            onClick={() => setShowAddForm(true)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow hover:shadow-lg flex items-center gap-2"
                                        >
                                            <Plus className="h-5 w-5" />
                                            Add Role
                                        </button>
                                        <button
                                            onClick={() => window.history.back()}
                                            className="flex items-center gap-2 px-3 py-2 text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                                            aria-label="Go back"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            Back
                                        </button>

                                    </div>
                                </div>
                            </div>
                            {/* Search and Filter Controls */}
                            <div className="bg-white rounded-2xl shadow-md p-5 mb-8 border border-gray-100">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search roles..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Filter className="h-5 w-5 text-gray-500" />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="active">Active Only</option>
                                            <option value="inactive">Inactive Only</option>
                                        </select>

                                        <button
                                            onClick={fetchRoles}
                                            className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            title="Refresh roles"
                                        >
                                            <RefreshCw className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Roles Grid */}
                            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-blue-500" />
                                        {statusFilter === "all" ? "All Roles" : statusFilter === "active" ? "Active Roles" : "Inactive Roles"}
                                        <span className="ml-2 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                            {filteredRoles.length}
                                        </span>
                                    </h2>
                                </div>

                                {isLoadingRoles ? (
                                    <div className="flex justify-center items-center py-12">
                                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                        <span className="ml-3 text-gray-600">Loading roles...</span>
                                    </div>
                                ) : filteredRoles.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />

                                        {searchQuery || statusFilter !== "all" ? (
                                            <>
                                                <p className="text-gray-500 text-lg font-medium">No matching roles found</p>
                                                <p className="text-gray-400 mt-2">Try adjusting your search or filter criteria</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-gray-500 text-lg font-medium">No roles found</p>
                                                <p className="text-gray-400 mt-2">Create your first role to get started</p>
                                            </>
                                        )}

                                        <button
                                            onClick={() => {
                                                setSearchQuery("");
                                                setStatusFilter("all");
                                            }}
                                            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {filteredRoles.map((role) => (
                                            <div
                                                key={role.CM_Role_ID}
                                                className={`p-5 rounded-xl border transition-all ${editingRole && editingRole.CM_Role_ID === role.CM_Role_ID
                                                    ? 'border-blue-300 bg-blue-50 shadow-md'
                                                    : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm'
                                                    }`}
                                            >
                                                {editingRole && editingRole.CM_Role_ID === role.CM_Role_ID ? (
                                                    // Edit form
                                                    <div className="space-y-4">
                                                        <h3 className="font-medium text-blue-600">Edit Role</h3>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Role Description
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={editingRole.CM_Role_Description}
                                                                onChange={(e) => handleEditInputChange("CM_Role_Description", e.target.value)}
                                                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                required
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Status
                                                            </label>
                                                            <select
                                                                value={editingRole.CM_Is_Status}
                                                                onChange={(e) => handleEditInputChange("CM_Is_Status", e.target.value)}
                                                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            >
                                                                <option value="Active">Active</option>
                                                                <option value="Inactive">Inactive</option>
                                                            </select>
                                                        </div>

                                                        <div className="flex gap-3 pt-2">
                                                            <button
                                                                onClick={handleUpdateRole}
                                                                disabled={isLoading}
                                                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                                            >
                                                                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                                                                {isLoading ? "Saving..." : "Save Changes"}
                                                            </button>

                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Display role in card layout
                                                    <div className="flex flex-col h-full">
                                                        {/* Header with status and actions */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-3 h-3 rounded-full ${role.CM_Is_Status === "Active" ? "bg-green-500" : "bg-gray-400"}`} />
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${role.CM_Is_Status === "Active"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                                    }`}>
                                                                    {role.CM_Is_Status}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleEditClick(role)}
                                                                className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                                                title="Edit role"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        {/* Role content */}
                                                        <div className="flex-grow">
                                                            <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
                                                                {role.CM_Role_Description}
                                                            </h3>
                                                        </div>

                                                        {/* Footer with additional info */}
                                                        <div className="pt-3 border-t border-gray-100">
                                                            <div className="text-xs text-gray-500">
                                                                <div>Created by: {role.CM_Created_By || "System"}</div>
                                                                {role.CM_Updated_By && (
                                                                    <div className="mt-1">Updated by: {role.CM_Updated_By}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Add Role Form View (Centered)
                    <div className="flex justify-center items-center min-h-screen p-6">
                        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-2xl font-bold text-gray-800">Create New Role</h2>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="p-2 hover:bg-gray-100 text-gray-500 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Role Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role Description <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Enter role description"
                                            value={roleData.CM_Role_Description}
                                            onChange={(e) =>
                                                handleInputChange("CM_Role_Description", e.target.value)
                                            }
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={roleData.CM_Is_Status}
                                        onChange={(e) => handleInputChange("CM_Is_Status", e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                        ) : (
                                            <Check className="h-5 w-5 mr-2" />
                                        )}
                                        {isLoading ? "Creating..." : "Create Role"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 flex items-center justify-center transition-all shadow"
                                    >
                                        <ArrowLeft className="h-5 w-5 mr-2" />
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RolesManagement;