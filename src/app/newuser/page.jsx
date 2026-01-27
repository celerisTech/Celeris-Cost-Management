"use client";

import {
    Loader2,
    User,
    Phone,
    Mail,
    CreditCard,
    MapPin,
    Key,
    UserPlus,
    Lock,
    Building,
    Calendar,
    GraduationCap,
    Briefcase,
    DollarSign,
    BadgePercent,
    Search,
    XCircle,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthScreenStore";
import Navbar from "../components/Navbar";
import { formatTitleCase, formatSentenceCase } from "../utils/textUtils";

function AddUser() {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [roles, setRoles] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [laborResults, setLaborResults] = useState([]);
    const [selectedLabor, setSelectedLabor] = useState(null);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [fieldsLocked, setFieldsLocked] = useState(false);

    // Add timeout ref for debouncing search
    const searchTimeout = useRef(null);

    // Refs to maintain focus state
    const inputRefs = {
        firstName: useRef(null),
        lastName: useRef(null),
        fatherName: useRef(null),
        phone: useRef(null),
        searchInput: useRef(null),
    };

    const [userData, setUserData] = useState({
        CM_Company_ID: user?.CM_Company_ID || "",
        CM_Role_ID: "",
        CM_First_Name: "",
        CM_Last_Name: "",
        CM_Full_Name: "",
        CM_Father_Name: "",
        CM_Employee_Type: "",
        CM_Wage_Type: "",
        CM_Wage_Amount: "",
        CM_Marriage_Status: "",
        CM_Phone_Number: "",
        CM_Alternative_Phone: "",
        CM_Email: "",
        CM_Address: "",
        CM_City: "",
        CM_District: "",
        CM_State: "",
        CM_Country: "",
        CM_Postal_Code: "",
        CM_Aadhaar_Number: "",
        CM_PAN_Number: "",
        CM_Password: "",
        CM_Photo_URL: null,
        CM_Is_Active: "Active",
        CM_Gender: "",
        CM_Higher_Education: "",
        CM_Previous_Experiences: "",
        CM_Date_Of_Birth: "",
        CM_Created_By: user?.CM_Full_Name || "",
        CM_Labor_ID: "", // Added to store the selected labor's ID
    });

    useEffect(() => {
        fetchRoles();
        fetchCompanies();

        if (user?.CM_Company_ID) {
            setUserData((prev) => ({
                ...prev,
                CM_Company_ID: user.CM_Company_ID,
            }));
        }
    }, [user]);

    // Separate effect for full name to avoid unnecessary input focus issues
    useEffect(() => {
        const fullName = `${userData.CM_First_Name} ${userData.CM_Last_Name}`.trim();

        // Only update if the full name is actually different
        if (fullName !== userData.CM_Full_Name) {
            setUserData(prev => ({
                ...prev,
                CM_Full_Name: fullName
            }));
        }
    }, [userData.CM_First_Name, userData.CM_Last_Name]);

    // Separate effect for ensuring company information is available
    useEffect(() => {
        // If we have companies data but haven't found user's company in the list,
        // we might need to fetch company details specifically for the user
        if (user?.CM_Company_ID && companies.length > 0 &&
            !companies.some(c => c.CM_Company_ID === user.CM_Company_ID)) {
            // You could add an API call here to fetch specific company info
            // if it's not in the general list
        }
    }, [user?.CM_Company_ID, companies]);

    const fetchRoles = async () => {
        try {
            const res = await fetch("/api/get-role");
            if (!res.ok) throw new Error("Failed to fetch roles");
            const data = await res.json();
            setRoles(data.roles || []);
        } catch (error) {
            console.error("Error fetching roles:", error);
            toast.error("Could not load roles");
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await fetch("/api/get-companies");
            if (!res.ok) throw new Error("Failed to fetch companies");
            const data = await res.json();
            setCompanies(data.companies || []);
        } catch (error) {
            console.error("Error fetching companies:", error);
            toast.error("Could not load companies");
        }
    };

    const searchLabors = async () => {
        if (!searchTerm) {
            setLaborResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);

        try {
            // Clear any existing timeout to implement debouncing
            if (searchTimeout.current) clearTimeout(searchTimeout.current);

            searchTimeout.current = setTimeout(async () => {
                // Updated to include a partial search parameter
                const res = await fetch(`/api/search-labors?term=${encodeURIComponent(searchTerm)}&partial=true`);
                if (!res.ok) throw new Error("Failed to search labors");
                const data = await res.json();
                setLaborResults(data.results || []);
                setShowSearchResults(true);
                setIsSearching(false);
            }, 300); // 300ms debounce
        } catch (error) {
            console.error("Error searching labors:", error);
            toast.error("Search failed");
            setLaborResults([]);
            setIsSearching(false);
        }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.length >= 1) {
            searchLabors(); // This now has debouncing built-in
        } else {
            setShowSearchResults(false);
            setLaborResults([]);
        }
    };

    const handleLaborSelect = async (labor) => {
        setSelectedLabor(labor);
        setShowSearchResults(false);
        setSearchTerm(labor.CM_Labor_Code || "");
        setFieldsLocked(true); // Lock fields after selecting labor

        // Preserve existing user data while updating with labor info
        setUserData(prevData => ({
            ...prevData, // Preserve existing data
            // Update only these fields from labor data
            CM_First_Name: labor.CM_First_Name || prevData.CM_First_Name,
            CM_Last_Name: labor.CM_Last_Name || prevData.CM_Last_Name,
            CM_Full_Name: `${labor.CM_First_Name || ""} ${labor.CM_Last_Name || ""}`.trim() || prevData.CM_Full_Name,
            CM_Father_Name: labor.CM_Fathers_Name || prevData.CM_Father_Name,
            CM_Phone_Number: labor.CM_Phone_Number || prevData.CM_Phone_Number,
            CM_Alternative_Phone: labor.CM_Alternate_Phone || prevData.CM_Alternative_Phone,
            CM_Email: labor.CM_Email || prevData.CM_Email,
            CM_Address: labor.CM_Address || prevData.CM_Address,
            CM_City: labor.CM_City || prevData.CM_City,
            CM_District: labor.CM_District || prevData.CM_District,
            CM_State: labor.CM_State || prevData.CM_State,
            CM_Country: labor.CM_Country || prevData.CM_Country,
            CM_Postal_Code: labor.CM_Postal_Code || prevData.CM_Postal_Code,
            CM_Aadhaar_Number: labor.CM_Aadhar_Number || prevData.CM_Aadhaar_Number,
            CM_PAN_Number: labor.CM_PAN_Number || prevData.CM_PAN_Number,
            CM_Gender: labor.CM_Sex || prevData.CM_Gender,
            CM_Marriage_Status: labor.CM_Marriage_Status || prevData.CM_Marriage_Status,
            CM_Higher_Education: labor.CM_Higher_Education || prevData.CM_Higher_Education,
            CM_Date_Of_Birth: labor.CM_Date_Of_Birth ? new Date(labor.CM_Date_Of_Birth).toISOString().split('T')[0] : prevData.CM_Date_Of_Birth,
            CM_Previous_Experiences: labor.CM_Previous_Experience || prevData.CM_Previous_Experiences,
            CM_Employee_Type: labor.CM_Labor_Type || prevData.CM_Employee_Type,
            CM_Wage_Type: labor.CM_Wage_Type || prevData.CM_Wage_Type,
            CM_Wage_Amount: labor.CM_Wage_Amount || prevData.CM_Wage_Amount,
            CM_Labor_Type_ID: labor.CM_Labor_Type_ID || prevData.CM_Labor_ID,
            // Don't change company if it's already set
            CM_Company_ID: prevData.CM_Company_ID || labor.CM_Company_ID || user?.CM_Company_ID || "",
        }));

        // Show success notification
        toast.success("Employee details loaded successfully");
    };

    const clearSelectedLabor = () => {
        setSelectedLabor(null);
        setSearchTerm("");
        setFieldsLocked(false); // Unlock fields
        toast.success("Employee selection cleared");
    };



    // Optimized handleInputChange to prevent focus loss
    const handleInputChange = (field, value) => {
        let formattedValue = value;

        // Apply Title Case to names and locations
        if (
            [
                "CM_First_Name",
                "CM_Last_Name",
                "CM_Father_Name",
                "CM_City",
                "CM_District",
                "CM_State",
                "CM_Country",
                "CM_Full_Name"
            ].includes(field)
        ) {
            formattedValue = formatTitleCase(value);
        }

        // Apply Sentence Case to descriptions and addresses
        if (
            [
                "CM_Address",
                "CM_Previous_Experiences",
                "CM_Higher_Education"
            ].includes(field)
        ) {
            formattedValue = formatSentenceCase(value);
        }

        setUserData(prev => {
            // Only update if the value actually changed
            if (prev[field] === formattedValue) return prev;

            // Create a new object with updated field
            return {
                ...prev,
                [field]: formattedValue
            };
        });
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUserData((prev) => ({ ...prev, CM_Photo_URL: file }));

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Validation
        const requiredFields = [
            { key: "CM_First_Name", message: "First Name is required", ref: inputRefs.firstName },
            { key: "CM_Last_Name", message: "Last Name is required", ref: inputRefs.lastName },
            { key: "CM_Phone_Number", message: "Phone Number is required", ref: inputRefs.phone },
            { key: "CM_Company_ID", message: "Company is required" },
            { key: "CM_Role_ID", message: "Role is required" },
        ];

        for (const field of requiredFields) {
            if (!userData[field.key]?.toString().trim()) {
                toast.error(field.message);
                setIsLoading(false);
                // Focus the input if a ref exists
                if (field.ref && field.ref.current) {
                    field.ref.current.focus();
                }
                return;
            }
        }

        if (!validateEmail(userData.CM_Email)) {
            toast.error("Please enter a valid email address");
            setIsLoading(false);
            if (inputRefs.email.current) {
                inputRefs.email.current.focus();
            }
            return;
        }

        const data = new FormData();
        Object.entries(userData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) data.append(key, value);
        });

        try {
            const res = await fetch("/api/create-proprietor", {
                method: "POST",
                body: data,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create user");
            }

            const result = await res.json();
            toast.success(`✅ User added successfully!`);

            // Reset form
            setUserData({
                CM_Company_ID: user?.CM_Company_ID || "",
                CM_Role_ID: "",
                CM_First_Name: "",
                CM_Last_Name: "",
                CM_Full_Name: "",
                CM_Father_Name: "",
                CM_Employee_Type: "",
                CM_Wage_Type: "",
                CM_Wage_Amount: "",
                CM_Marriage_Status: "",
                CM_Phone_Number: "",
                CM_Alternative_Phone: "",
                CM_Email: "",
                CM_Address: "",
                CM_City: "",
                CM_District: "",
                CM_State: "",
                CM_Country: "",
                CM_Postal_Code: "",
                CM_Aadhaar_Number: "",
                CM_PAN_Number: "",
                CM_Password: "",
                CM_Photo_URL: null,
                CM_Is_Active: "Active",
                CM_Gender: "",
                CM_Higher_Education: "",
                CM_Previous_Experiences: "",
                CM_Date_Of_Birth: "",
                CM_Created_By: user?.CM_Full_Name || "",
                CM_Labor_ID: "",
            });
            setPhotoPreview(null);
            setSelectedLabor(null);
            setSearchTerm("");
            setFieldsLocked(false);
        } catch (error) {
            toast.error(`❌ ${error.message}`);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <div className="flex h-screen bg-white">
            <Navbar />
            <div className="flex-1 overflow-y-auto p-6 min-h-screen flex items-start justify-center relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 w-full mt-6">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <UserPlus className="h-10 w-10 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Add New User</h1>
                            </div>
                        </div>
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 bg-white hover:bg-gray-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200"
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
                            <span className="text-sm font-medium">Back</span>
                        </button>
                    </div>

                    {/* Main Form Container */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
                        <form onSubmit={handleSubmit} className="space-y-8 p-8">
                            {/* New: Top Save Button */}
                            <div className="flex items-center justify-between border-b border-gray-200 pb-5">
                                <h2 className="text-xl font-semibold text-gray-800">Create New User Account</h2>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-800 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center group shadow-md hover:shadow-lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                                            <span>Save User</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Labor Search Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <Search className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Search Employee</h2>
                                </div>

                                <div className="relative">
                                    <div className="flex">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                            <input
                                                ref={inputRefs.searchInput}
                                                type="text"
                                                placeholder="Search by Labor Code, Name, or Phone"
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                                className="w-full pl-12 pr-4 py-3 bg-white/80 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200"
                                            />
                                            {isSearching && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={searchLabors}
                                            className="ml-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                        >
                                            Search
                                        </button>
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {showSearchResults && laborResults.length > 0 && (
                                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            <ul className="py-1">
                                                {laborResults.map((labor) => (
                                                    <li
                                                        key={labor.CM_Labor_Type_ID}
                                                        onClick={() => handleLaborSelect(labor)}
                                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-100 last:border-none"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-800">
                                                                {labor.CM_Labor_Code} - {labor.CM_First_Name} {labor.CM_Last_Name}
                                                            </span>
                                                            <span className="text-sm text-gray-500">
                                                                {labor.CM_Phone_Number}
                                                            </span>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${labor.CM_Labor_Type === 'Permanent' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                            {labor.CM_Labor_Type}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {showSearchResults && searchTerm && laborResults.length === 0 && (
                                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
                                            <p className="text-gray-600">No employees found matching "{searchTerm}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Employee Information */}
                                {selectedLabor && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center">
                                                <div className="p-1.5 bg-blue-100 rounded-md mr-3">
                                                    <User className="h-4 w-4 text-blue-700" />
                                                </div>
                                                <h3 className="font-semibold text-blue-800">Selected Employee</h3>

                                            </div>

                                        </div>
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div>
                                                <span className="text-sm text-gray-800">Labor Code:</span>
                                                <p className="font-medium text-gray-800">{selectedLabor.CM_Labor_Code}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-800">Name:</span>
                                                <p className="font-medium text-gray-800">{selectedLabor.CM_First_Name} {selectedLabor.CM_Last_Name}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-800">Current Type:</span>
                                                <p className="font-medium text-gray-800">{selectedLabor.CM_Labor_Type}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section: Role & Status */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                                    <div className="p-2 bg-red-50 rounded-lg">
                                        <Key className="h-5 w-5 text-red-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Role & Status</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <select
                                            id="role"
                                            value={userData.CM_Role_ID}
                                            onChange={(e) => handleInputChange("CM_Role_ID", e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200 appearance-none"
                                            required
                                        >
                                            <option value="" disabled>Select User Role</option>
                                            {roles.map((r) => (
                                                <option key={r.CM_Role_ID} value={r.CM_Role_ID}>
                                                    {r.CM_Role_Description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none">
                                            {userData.CM_Is_Active === "Active" ? (
                                                <div className="text-green-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="text-red-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <select
                                            id="status"
                                            value={userData.CM_Is_Active}
                                            onChange={(e) => handleInputChange("CM_Is_Active", e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200 appearance-none"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Personal Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>

                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* First Name */}
                                    <div className="lg:col-span-1">
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                            <input
                                                ref={inputRefs.firstName}
                                                id="first-name"
                                                type="text"
                                                placeholder="First Name"
                                                value={userData.CM_First_Name}
                                                onChange={(e) => handleInputChange("CM_First_Name", e.target.value)}
                                                // disabled={fieldsLocked}
                                                required
                                                className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                            />
                                        </div>
                                    </div>

                                    {/* Last Name */}
                                    <div className="lg:col-span-1">
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                            <input
                                                ref={inputRefs.lastName}
                                                id="last-name"
                                                type="text"
                                                placeholder="Last Name"
                                                value={userData.CM_Last_Name}
                                                onChange={(e) => handleInputChange("CM_Last_Name", e.target.value)}
                                                // disabled={fieldsLocked}
                                                required
                                                className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                            />
                                        </div>
                                    </div>

                                    {/* Father's Name */}
                                    <div className="lg:col-span-1">
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                            <input
                                                ref={inputRefs.fatherName}
                                                id="father-name"
                                                type="text"
                                                placeholder="Father's Name"
                                                value={userData.CM_Father_Name}
                                                onChange={(e) => handleInputChange("CM_Father_Name", e.target.value)}
                                                // disabled={fieldsLocked}
                                                className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                            />
                                        </div>
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="lg:col-span-1">
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                            <input
                                                id="dob"
                                                type="date"
                                                placeholder="Date of Birth"
                                                value={
                                                    userData.CM_Date_Of_Birth
                                                        ? new Date(
                                                            new Date(userData.CM_Date_Of_Birth).getTime() -
                                                            new Date(userData.CM_Date_Of_Birth).getTimezoneOffset() * 60000
                                                        )
                                                            .toISOString()
                                                            .split("T")[0]
                                                        : ""
                                                }
                                                onChange={(e) => handleInputChange("CM_Date_Of_Birth", e.target.value)}
                                                // disabled={fieldsLocked}
                                                className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                            />
                                        </div>
                                    </div>

                                    {/* Gender */}
                                    <div className="lg:col-span-1">
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                            <select
                                                id="gender"
                                                value={userData.CM_Gender}
                                                onChange={(e) => handleInputChange("CM_Gender", e.target.value)}
                                                // disabled={fieldsLocked}
                                                className={`w-full pl-12 pr-4 py-3.5 ${fieldsLocked ? 'bg-white' : 'bg-white'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200 appearance-none`}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Marriage Status */}
                                    <div className="lg:col-span-1">
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                            <select
                                                id="CM_Marriage_Status"
                                                value={userData.CM_Marriage_Status || ""}
                                                onChange={(e) => handleInputChange("CM_Marriage_Status", e.target.value)}
                                                // disabled={fieldsLocked}
                                                className={`w-full pl-12 pr-4 py-3.5 ${fieldsLocked ? 'bg-white' : 'bg-white'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200 appearance-none`}
                                            >
                                                <option value="">Select Marriage Status</option>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                                <option value="Divorced">Divorced</option>
                                                <option value="Widowed">Widowed</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Photo Upload Box */}
                                    <div className="lg:col-span-1">
                                        <label
                                            htmlFor="photo-upload"
                                            className="flex items-center justify-between border border-gray-300 rounded-lg bg-gray-50 px-4 py-3 cursor-pointer hover:border-blue-400 transition-all h-full"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-700 font-medium text-sm">
                                                        {photoPreview ? "Change Photo" : "Upload Photo"}
                                                    </span>
                                                    <span className="text-gray-400 text-xs">
                                                        {photoPreview ? "Selected" : "JPG, PNG"}
                                                    </span>
                                                </div>
                                            </div>

                                            {photoPreview && (
                                                <img
                                                    src={photoPreview}
                                                    alt="Preview"
                                                    className="w-10 h-10 object-cover rounded-lg border-2 border-green-200"
                                                />
                                            )}

                                            <input
                                                id="photo-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Employment Details */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <Briefcase className="h-5 w-5 text-green-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Employment Details</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Employee Type */}
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <select
                                            id="employee-type"
                                            value={userData.CM_Employee_Type}
                                            onChange={(e) => handleInputChange("CM_Employee_Type", e.target.value)}
                                            // disabled={fieldsLocked}
                                            className={`w-full pl-12 pr-4 py-3.5 ${fieldsLocked ? 'bg-white' : 'bg-white'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200 appearance-none`}
                                        >
                                            <option value="">Select Employee Type</option>
                                            <option value="Permanent">Permanent</option>
                                            <option value="Temporary">Temporary</option>
                                            <option value="Contract">Contract</option>
                                        </select>
                                    </div>

                                    {/* Wage Type */}
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <select
                                            id="wage-type"
                                            value={userData.CM_Wage_Type}
                                            onChange={(e) => handleInputChange("CM_Wage_Type", e.target.value)}
                                            // disabled={fieldsLocked}
                                            className={`w-full pl-12 pr-4 py-3.5 ${fieldsLocked ? 'bg-white' : 'bg-white'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200 appearance-none`}
                                        >
                                            <option value="">Select Wage Type</option>
                                            <option value="PerHour">Per Hour</option>
                                            <option value="PerDay">Per Day</option>
                                            <option value="PerMonth">Per Month</option>
                                        </select>
                                    </div>

                                    {/* Wage Amount */}
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <input
                                            id="wage-amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="Wage Amount"
                                            value={userData.CM_Wage_Amount}
                                            onChange={(e) => handleInputChange("CM_Wage_Amount", e.target.value)}
                                            // disabled={fieldsLocked}
                                            className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Education & Experience */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                                    <div className="p-2 bg-amber-50 rounded-lg">
                                        <GraduationCap className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Education & Experience</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Higher Education */}
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <input
                                            id="education"
                                            type="text"
                                            placeholder="Higher Education"
                                            value={userData.CM_Higher_Education}
                                            onChange={(e) => handleInputChange("CM_Higher_Education", e.target.value)}
                                            // disabled={fieldsLocked}
                                            className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                        />
                                    </div>

                                    {/* Company Association */}
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        {user?.CM_Company_ID ? (
                                            // Display the user's company if they're already associated with one
                                            <div className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 flex items-center">
                                                <span className="text-gray-700">
                                                    {companies.find(c => c.CM_Company_ID === user.CM_Company_ID)?.CM_Company_Name || 'Your Company'}
                                                </span>
                                            </div>
                                        ) : (
                                            // Allow selection if user doesn't have a company
                                            <select
                                                id="company"
                                                value={userData.CM_Company_ID}
                                                onChange={(e) => handleInputChange("CM_Company_ID", e.target.value)}
                                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200 appearance-none"
                                                required
                                            >
                                                <option value="" disabled>Select Company</option>
                                                {companies.map((c) => (
                                                    <option key={c.CM_Company_ID} value={c.CM_Company_ID}>
                                                        {c.CM_Company_Name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                {/* Previous Experiences */}
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-4 h-5 w-5 text-gray-500 pointer-events-none" />
                                    <textarea
                                        id="experiences"
                                        placeholder="Previous Experiences"
                                        value={userData.CM_Previous_Experiences}
                                        onChange={(e) => handleInputChange("CM_Previous_Experiences", e.target.value)}
                                        // disabled={fieldsLocked}
                                        className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200 resize-none`}
                                        rows="3"
                                    />
                                    {fieldsLocked && (
                                        <div className="absolute right-3 top-4">
                                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section: Contact Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <Phone className="h-5 w-5 text-green-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Contact Information</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <input
                                            ref={inputRefs.phone}
                                            id="phone"
                                            type="tel"
                                            placeholder="Phone Number"
                                            value={userData.CM_Phone_Number}
                                            onChange={(e) =>
                                                handleInputChange("CM_Phone_Number", e.target.value.replace(/\D/g, ""))
                                            }
                                            // disabled={fieldsLocked}
                                            required
                                            maxLength={10}
                                            className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <input
                                            id="alt-phone"
                                            type="tel"
                                            placeholder="Alternative Phone (Optional)"
                                            value={userData.CM_Alternative_Phone}
                                            onChange={(e) =>
                                                handleInputChange("CM_Alternative_Phone", e.target.value.replace(/\D/g, ""))
                                            }
                                            // disabled={fieldsLocked}
                                            maxLength={10}
                                            className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                        />
                                        {fieldsLocked && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <input
                                            ref={inputRefs.email}
                                            id="email"
                                            type="email"
                                            placeholder="Email Address"
                                            value={userData.CM_Email}
                                            onChange={(e) => handleInputChange("CM_Email", e.target.value)}
                                            // disabled={fieldsLocked}
                                            required
                                            className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <input
                                            id="password"
                                            type="password"
                                            placeholder="Password (Optional)"
                                            value={userData.CM_Password}
                                            onChange={(e) => handleInputChange("CM_Password", e.target.value)}
                                            autoComplete="new-password"
                                            className="w-full pl-12 pr-4 py-3 bg-white/80 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200"
                                        />
                                    </div>
                                </div>
                            </div>


                            {/* Section: ID Documents */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <CreditCard className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">ID Documents</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <input
                                            id="aadhaar"
                                            type="text"
                                            placeholder="Aadhaar Number"
                                            value={userData.CM_Aadhaar_Number}
                                            onChange={(e) =>
                                                handleInputChange("CM_Aadhaar_Number", e.target.value.replace(/\D/g, ""))
                                            }
                                            // disabled={fieldsLocked}
                                            maxLength={12}
                                            className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                        />
                                        {fieldsLocked && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <input
                                            id="pan"
                                            type="text"
                                            placeholder="PAN Number"
                                            value={userData.CM_PAN_Number}
                                            onChange={(e) => handleInputChange("CM_PAN_Number", e.target.value.toUpperCase())}
                                            // disabled={fieldsLocked}
                                            maxLength={10}
                                            className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white/80'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Address */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                                    <div className="p-2 bg-orange-50 rounded-lg">
                                        <MapPin className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Address Information</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-4 h-5 w-5 text-gray-500 pointer-events-none" />
                                        <textarea
                                            id="address"
                                            placeholder="Complete Address"
                                            value={userData.CM_Address}
                                            onChange={(e) => handleInputChange("CM_Address", e.target.value)}
                                            // disabled={fieldsLocked}
                                            className={`w-full pl-12 pr-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200 resize-none`}
                                            rows="3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="City"
                                                value={userData.CM_City}
                                                onChange={(e) => handleInputChange("CM_City", e.target.value)}
                                                disabled={fieldsLocked}
                                                className={`w-full px-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="District"
                                                value={userData.CM_District}
                                                onChange={(e) => handleInputChange("CM_District", e.target.value)}
                                                // disabled={fieldsLocked}
                                                className={`w-full px-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="State"
                                                value={userData.CM_State}
                                                onChange={(e) => handleInputChange("CM_State", e.target.value)}
                                                disabled={fieldsLocked}
                                                className={`w-full px-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Country"
                                                value={userData.CM_Country}
                                                onChange={(e) => handleInputChange("CM_Country", e.target.value)}
                                                // disabled={fieldsLocked}
                                                className={`w-full px-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Postal Code"
                                                value={userData.CM_Postal_Code}
                                                onChange={(e) =>
                                                    handleInputChange("CM_Postal_Code", e.target.value.replace(/\D/g, ""))
                                                }
                                                // disabled={fieldsLocked}
                                                className={`w-full px-4 py-3 ${fieldsLocked ? 'bg-white' : 'bg-white'} border ${fieldsLocked ? 'border-blue-200' : 'border-gray-300'} rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition-all duration-200`}
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddUser;
