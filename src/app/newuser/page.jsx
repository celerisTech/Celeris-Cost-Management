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
// Excel Row Component defined at top-level scope to prevent component re-creation and input focus loss on state updates
const ExcelRow = ({ label, children, required }) => (
    <div className="flex flex-col sm:flex-row border-b border-gray-300 last:border-b-0">
        <div className="sm:w-1/3 bg-gray-100 p-3 text-sm font-medium text-gray-700 border-b sm:border-b-0 sm:border-r border-gray-300 flex items-center">
            {label} {required && <span className="text-red-500 ml-1">*</span>}
        </div>
        <div className="sm:w-2/3 bg-white relative">
            {children}
        </div>
    </div>
);

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

    const inputClasses = "w-full h-full px-3 py-2.5 text-sm text-gray-800 bg-transparent focus:outline-none focus:bg-blue-50 focus:ring-inset focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50";

    return (
        <div className="flex h-screen bg-gray-50">
            <Navbar />
            <div className="flex-1 overflow-y-auto p-4 md:p-8 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Add New User</h1>
                            <p className="text-sm text-gray-500 mt-1">Enter user details in the grid below</p>
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
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all disabled:opacity-60 flex items-center"
                            >
                                {isLoading ? (
                                    <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...</>
                                ) : (
                                    <><UserPlus className="h-4 w-4 mr-2" /> Save User</>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-300 shadow-sm rounded-none overflow-hidden">
                        <form onSubmit={handleSubmit}>
                            
                            {/* SECTION: Employee Search */}
                            <div className="bg-gray-800 text-white px-4 py-2 text-sm font-semibold uppercase tracking-wider flex items-center justify-between">
                                <span>Search Employee</span>
                                {selectedLabor && (
                                    <button type="button" onClick={clearSelectedLabor} className="text-xs text-red-300 hover:text-red-100 flex items-center">
                                        <XCircle className="w-3 h-3 mr-1" /> Clear Selection
                                    </button>
                                )}
                            </div>
                            <div className="border-b border-gray-300 p-4 bg-gray-50">
                                <div className="relative max-w-xl">
                                    <div className="flex">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                            <input
                                                ref={inputRefs.searchInput}
                                                type="text"
                                                placeholder="Search by Labor Code, Name, or Phone..."
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-l-md text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            />
                                            {isSearching && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={searchLabors}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium border border-blue-600 rounded-r-md hover:bg-blue-700 transition-colors"
                                        >
                                            Search
                                        </button>
                                    </div>

                                    {/* Search Results */}
                                    {showSearchResults && laborResults.length > 0 && (
                                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            <ul className="py-1">
                                                {laborResults.map((labor) => (
                                                    <li
                                                        key={labor.CM_Labor_Type_ID}
                                                        onClick={() => handleLaborSelect(labor)}
                                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-sm border-b border-gray-100 last:border-none"
                                                    >
                                                        <div>
                                                            <span className="font-medium text-gray-800">
                                                                {labor.CM_Labor_Code} - {labor.CM_First_Name} {labor.CM_Last_Name}
                                                            </span>
                                                            <div className="text-xs text-gray-500">{labor.CM_Phone_Number}</div>
                                                        </div>
                                                        <span className={`px-2 py-0.5 text-[10px] rounded bg-gray-100 border border-gray-200`}>
                                                            {labor.CM_Labor_Type}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {showSearchResults && searchTerm && laborResults.length === 0 && (
                                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-3 text-center text-sm text-gray-600">
                                            No employees found
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECTION: Role & Status */}
                            <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                                Role & Status
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                                <div className="border-r border-gray-300">
                                    <ExcelRow label="User Role" required>
                                        <select
                                            value={userData.CM_Role_ID}
                                            onChange={(e) => handleInputChange("CM_Role_ID", e.target.value)}
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
                                            value={userData.CM_Is_Active}
                                            onChange={(e) => handleInputChange("CM_Is_Active", e.target.value)}
                                            className={inputClasses}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </ExcelRow>
                                </div>
                            </div>

                            {/* SECTION: Personal Information */}
                            <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider mt-4 lg:mt-0 lg:border-t-0">
                                Personal Information
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                                <div className="border-r border-gray-300 flex flex-col">
                                    <ExcelRow label="First Name" required>
                                        <input
                                            ref={inputRefs.firstName}
                                            type="text"
                                            value={userData.CM_First_Name}
                                            onChange={(e) => handleInputChange("CM_First_Name", e.target.value)}
                                            className={inputClasses}
                                            required
                                        />
                                    </ExcelRow>
                                    <ExcelRow label="Last Name" required>
                                        <input
                                            ref={inputRefs.lastName}
                                            type="text"
                                            value={userData.CM_Last_Name}
                                            onChange={(e) => handleInputChange("CM_Last_Name", e.target.value)}
                                            className={inputClasses}
                                            required
                                        />
                                    </ExcelRow>
                                    <ExcelRow label="Father's Name">
                                        <input
                                            ref={inputRefs.fatherName}
                                            type="text"
                                            value={userData.CM_Father_Name}
                                            onChange={(e) => handleInputChange("CM_Father_Name", e.target.value)}
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                </div>
                                <div className="flex flex-col">
                                    <ExcelRow label="Date of Birth">
                                        <input
                                            type="date"
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
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                    <ExcelRow label="Gender">
                                        <select
                                            value={userData.CM_Gender}
                                            onChange={(e) => handleInputChange("CM_Gender", e.target.value)}
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
                                            value={userData.CM_Marriage_Status || ""}
                                            onChange={(e) => handleInputChange("CM_Marriage_Status", e.target.value)}
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
                            <div className="border-b border-gray-300">
                                <ExcelRow label="Photo Upload">
                                    <div className="flex items-center px-3 py-1">
                                        <input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="text-sm file:mr-4 file:py-1 file:px-3 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        {photoPreview && (
                                            <img src={photoPreview} alt="Preview" className="h-8 w-8 object-cover border border-gray-300 ml-4" />
                                        )}
                                    </div>
                                </ExcelRow>
                            </div>

                            {/* SECTION: Employment Details */}
                            <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider mt-4 lg:mt-0 lg:border-t-0">
                                Employment Details
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                                <div className="border-r border-gray-300 flex flex-col">
                                    <ExcelRow label="Employee Type">
                                        <select
                                            value={userData.CM_Employee_Type}
                                            onChange={(e) => handleInputChange("CM_Employee_Type", e.target.value)}
                                            className={inputClasses}
                                        >
                                            <option value="">Select Type...</option>
                                            <option value="Permanent">Permanent</option>
                                            <option value="Temporary">Temporary</option>
                                            <option value="Contract">Contract</option>
                                        </select>
                                    </ExcelRow>
                                    <ExcelRow label="Company" required>
                                        {user?.CM_Company_ID ? (
                                            <div className="px-3 py-2.5 text-sm text-gray-700 bg-gray-50 border-none h-full w-full">
                                                {companies.find(c => c.CM_Company_ID === user.CM_Company_ID)?.CM_Company_Name || 'Your Company'}
                                            </div>
                                        ) : (
                                            <select
                                                value={userData.CM_Company_ID}
                                                onChange={(e) => handleInputChange("CM_Company_ID", e.target.value)}
                                                className={inputClasses}
                                                required
                                            >
                                                <option value="" disabled>Select Company...</option>
                                                {companies.map((c) => (
                                                    <option key={c.CM_Company_ID} value={c.CM_Company_ID}>
                                                        {c.CM_Company_Name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </ExcelRow>
                                </div>
                                <div className="flex flex-col">
                                    <ExcelRow label="Wage Type">
                                        <select
                                            value={userData.CM_Wage_Type}
                                            onChange={(e) => handleInputChange("CM_Wage_Type", e.target.value)}
                                            className={inputClasses}
                                        >
                                            <option value="">Select Wage Type...</option>
                                            <option value="PerHour">Per Hour</option>
                                            <option value="PerDay">Per Day</option>
                                            <option value="PerMonth">Per Month</option>
                                        </select>
                                    </ExcelRow>
                                    <ExcelRow label="Wage Amount">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={userData.CM_Wage_Amount}
                                            onChange={(e) => handleInputChange("CM_Wage_Amount", e.target.value)}
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                </div>
                            </div>

                            {/* SECTION: Education & Experience */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                                <div className="border-r border-gray-300">
                                    <ExcelRow label="Higher Education">
                                        <input
                                            type="text"
                                            value={userData.CM_Higher_Education}
                                            onChange={(e) => handleInputChange("CM_Higher_Education", e.target.value)}
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                </div>
                                <div>
                                    <ExcelRow label="Previous Experience">
                                        <input
                                            type="text"
                                            value={userData.CM_Previous_Experiences}
                                            onChange={(e) => handleInputChange("CM_Previous_Experiences", e.target.value)}
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                </div>
                            </div>

                            {/* SECTION: Contact Information */}
                            <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider mt-4 lg:mt-0 lg:border-t-0">
                                Contact Information
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                                <div className="border-r border-gray-300 flex flex-col">
                                    <ExcelRow label="Phone Number" required>
                                        <input
                                            ref={inputRefs.phone}
                                            type="tel"
                                            maxLength={10}
                                            value={userData.CM_Phone_Number}
                                            onChange={(e) => handleInputChange("CM_Phone_Number", e.target.value.replace(/\D/g, ""))}
                                            className={inputClasses}
                                            required
                                        />
                                    </ExcelRow>
                                    <ExcelRow label="Email Address">
                                        <input
                                            ref={inputRefs.email}
                                            type="email"
                                            value={userData.CM_Email}
                                            onChange={(e) => handleInputChange("CM_Email", e.target.value)}
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                </div>
                                <div className="flex flex-col">
                                    <ExcelRow label="Alt. Phone">
                                        <input
                                            type="tel"
                                            maxLength={10}
                                            value={userData.CM_Alternative_Phone}
                                            onChange={(e) => handleInputChange("CM_Alternative_Phone", e.target.value.replace(/\D/g, ""))}
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                    <ExcelRow label="Account Password">
                                        <input
                                            type="password"
                                            autoComplete="new-password"
                                            value={userData.CM_Password}
                                            onChange={(e) => handleInputChange("CM_Password", e.target.value)}
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                </div>
                            </div>

                            {/* SECTION: ID Documents */}
                            <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider mt-4 lg:mt-0 lg:border-t-0">
                                ID Documents
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                                <div className="border-r border-gray-300">
                                    <ExcelRow label="Aadhaar Number">
                                        <input
                                            type="text"
                                            maxLength={12}
                                            value={userData.CM_Aadhaar_Number}
                                            onChange={(e) => handleInputChange("CM_Aadhaar_Number", e.target.value.replace(/\D/g, ""))}
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                </div>
                                <div>
                                    <ExcelRow label="PAN Number">
                                        <input
                                            type="text"
                                            maxLength={10}
                                            value={userData.CM_PAN_Number}
                                            onChange={(e) => handleInputChange("CM_PAN_Number", e.target.value.toUpperCase())}
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                </div>
                            </div>

                            {/* SECTION: Address */}
                            <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider mt-4 lg:mt-0 lg:border-t-0">
                                Address Information
                            </div>
                            <div className="border-b border-gray-300">
                                <ExcelRow label="Complete Address">
                                    <textarea
                                        value={userData.CM_Address}
                                        onChange={(e) => handleInputChange("CM_Address", e.target.value)}
                                        className={`${inputClasses} resize-y min-h-[60px]`}
                                        rows="2"
                                    />
                                </ExcelRow>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-300">
                                <div className="border-r border-gray-300 flex flex-col">
                                    <ExcelRow label="City">
                                        <input
                                            type="text"
                                            value={userData.CM_City}
                                            onChange={(e) => handleInputChange("CM_City", e.target.value)}
                                            className={inputClasses}
                                            disabled={fieldsLocked}
                                        />
                                    </ExcelRow>
                                    <ExcelRow label="State">
                                        <input
                                            type="text"
                                            value={userData.CM_State}
                                            onChange={(e) => handleInputChange("CM_State", e.target.value)}
                                            className={inputClasses}
                                            disabled={fieldsLocked}
                                        />
                                    </ExcelRow>
                                    <ExcelRow label="Postal Code">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={userData.CM_Postal_Code}
                                            onChange={(e) => handleInputChange("CM_Postal_Code", e.target.value.replace(/\D/g, ""))}
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                </div>
                                <div className="flex flex-col">
                                    <ExcelRow label="District">
                                        <input
                                            type="text"
                                            value={userData.CM_District}
                                            onChange={(e) => handleInputChange("CM_District", e.target.value)}
                                            className={inputClasses}
                                        />
                                    </ExcelRow>
                                    <ExcelRow label="Country">
                                        <input
                                            type="text"
                                            value={userData.CM_Country}
                                            onChange={(e) => handleInputChange("CM_Country", e.target.value)}
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

export default AddUser;
