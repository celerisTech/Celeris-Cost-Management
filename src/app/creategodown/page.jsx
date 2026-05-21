'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/app/store/useAuthScreenStore';
import Navbar from '@/app/components/Navbar';

const CreateGodown = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form state
    const [formData, setFormData] = useState({
        CM_Godown_Code: '',
        CM_Godown_Name: '',
        CM_Location: '',
        CM_Address: '',
        CM_District: '',
        CM_State: '',
        CM_Country: '',
        CM_Postal_Code: '',
        CM_Contact_Person: '',
        CM_Phone_Number: '',
        CM_Alternate_Phone: '',
        CM_Email: '',
        CM_Is_Status: 'Active',
        CM_Company_ID: ''
    });

    useEffect(() => {
        if (user) {
            setUserLoading(false);
            setFormData(prev => ({
                ...prev,
                CM_Company_ID: user.CM_Company_ID || ''
            }));
        } else {
            setUserLoading(false);
        }
    }, [user]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNumberChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user?.CM_Company_ID) {
            showMessage('error', 'Company information not available. Please refresh the page.');
            return;
        }

        // Validation
        const requiredFields = [
            'CM_Godown_Code', 'CM_Godown_Name', 'CM_Location', 'CM_Address',
            'CM_District', 'CM_State', 'CM_Country', 'CM_Postal_Code',
            'CM_Contact_Person', 'CM_Phone_Number', 'CM_Email'
        ];

        const missingFields = requiredFields.filter(field => !formData[field].trim());
        if (missingFields.length > 0) {
            showMessage('error', `Please fill in all required fields`);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.CM_Email)) {
            showMessage('error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                ...formData,
                CM_Company_ID: user.CM_Company_ID
            };

            await axios.post('/api/creategodown', submitData);
            showMessage('success', 'Godown created successfully!');

            // Reset form
            setFormData({
                CM_Godown_Code: '',
                CM_Godown_Name: '',
                CM_Location: '',
                CM_Address: '',
                CM_District: '',
                CM_State: '',
                CM_Country: '',
                CM_Postal_Code: '',
                CM_Contact_Person: '',
                CM_Phone_Number: '',
                CM_Alternate_Phone: '',
                CM_Email: '',
                CM_Is_Status: 'Active',
                CM_Company_ID: user.CM_Company_ID || ''
            });
        } catch (error) {
            showMessage('error', 'Failed to create godown. Please try again.');
            console.error('Error creating godown:', error);
        } finally {
            setLoading(false);
        }
    };

    if (userLoading || loading) {
        return (
            <div className="flex h-screen bg-white">
                <Navbar />
                <div className="flex-1 min-h-screen bg-white">
                    <div className="flex justify-center items-center h-64">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mt-70">
                            {/* Sun */}
                            <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
                            {/* Orbit 1 */}
                            <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                            </div>
                            {/* Orbit 2 */}
                            <div className="absolute inset-2 border-2 border-green-300/30 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white text-black">
            <Navbar />
            <div className="flex-1 overflow-y-auto  mx-auto p-6">
                {/* Header Section */}
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-black bg-clip-text ">
                        Create New Godown
                    </h2>
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg border-l-4 ${message.type === 'success'
                        ? 'bg-green-50 border-green-400 text-green-700'
                        : 'bg-red-50 border-red-400 text-red-700'
                        } shadow-sm`}>
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 w-4 h-4 rounded-full mr-3 ${message.type === 'success' ? 'bg-green-400' : 'bg-red-400'
                                }`}></div>
                            <span className="font-medium">{message.text}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center mb-6">
                            <div className="w-2 h-8 bg-blue-500 rounded-full mr-3"></div>
                            <h3 className="text-xl font-semibold text-gray-800">Basic Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Godown Code
                                </label>
                                <input
                                    type="text"
                                    name="CM_Godown_Code"
                                    value={formData.CM_Godown_Code}
                                    onChange={handleInputChange}
                                    maxLength={50}
                                    placeholder="GWN-001"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 placeholder-gray-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Godown Name
                                </label>
                                <input
                                    type="text"
                                    name="CM_Godown_Name"
                                    value={formData.CM_Godown_Name}
                                    onChange={handleInputChange}
                                    maxLength={150}
                                    placeholder="Main Warehouse"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 placeholder-gray-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="CM_Location"
                                    value={formData.CM_Location}
                                    onChange={handleInputChange}
                                    maxLength={150}
                                    placeholder="Gobi"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 placeholder-gray-400"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                                Complete Address
                            </label>
                            <textarea
                                name="CM_Address"
                                value={formData.CM_Address}
                                onChange={handleInputChange}
                                maxLength={150}
                                placeholder="Enter the complete street address..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 resize-vertical placeholder-gray-400"
                                required
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Location Details Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center mb-6">
                            <div className="w-2 h-8 bg-green-500 rounded-full mr-3"></div>
                            <h3 className="text-xl font-semibold text-gray-800">Location Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                                    District
                                </label>
                                <input
                                    type="text"
                                    name="CM_District"
                                    value={formData.CM_District}
                                    onChange={handleInputChange}
                                    maxLength={50}
                                    placeholder="Central District"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 placeholder-gray-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                                    State
                                </label>
                                <input
                                    type="text"
                                    name="CM_State"
                                    value={formData.CM_State}
                                    onChange={handleInputChange}
                                    maxLength={50}
                                    placeholder="Tamil Nadu"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 placeholder-gray-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    name="CM_Country"
                                    value={formData.CM_Country}
                                    onChange={handleInputChange}
                                    maxLength={50}
                                    placeholder="India"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 placeholder-gray-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Postal Code
                                </label>
                                <input
                                    type="number"
                                    name="CM_Postal_Code"
                                    value={formData.CM_Postal_Code}
                                    onChange={handleInputChange}
                                    placeholder="600001"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    required
                                    min={0}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center mb-6">
                            <div className="w-2 h-8 bg-purple-500 rounded-full mr-3"></div>
                            <h3 className="text-xl font-semibold text-gray-800">Contact Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Contact Person
                                </label>
                                <input
                                    type="text"
                                    name="CM_Contact_Person"
                                    value={formData.CM_Contact_Person}
                                    onChange={handleInputChange}
                                    maxLength={100}
                                    placeholder=""
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 placeholder-gray-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    name="CM_Phone_Number"
                                    value={formData.CM_Phone_Number}
                                    onChange={handleInputChange}
                                    maxLength={20}
                                    placeholder="1234567899"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 placeholder-gray-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Alternate Phone
                                </label>
                                <input
                                    type="text"
                                    name="CM_Alternate_Phone"
                                    value={formData.CM_Alternate_Phone}
                                    onChange={handleInputChange}
                                    maxLength={20}
                                    placeholder="1234567899"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 placeholder-gray-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="CM_Email"
                                    value={formData.CM_Email}
                                    onChange={handleInputChange}
                                    maxLength={100}
                                    placeholder="contact@company.com"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200 placeholder-gray-400"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center mb-6">
                            <div className="w-2 h-8 bg-orange-500 rounded-full mr-3"></div>
                            <h3 className="text-xl font-semibold text-gray-800">Godown Status</h3>
                        </div>

                        <div className="max-w-xs">
                            <label className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500 mb-3">
                                Current Status
                            </label>
                            <select
                                name="CM_Is_Status"
                                value={formData.CM_Is_Status}
                                onChange={(e) => handleSelectChange('CM_Is_Status', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors duration-200"
                                required
                            >
                                <option value="Active" className="text-green-600">Active</option>
                                <option value="Inactive" className="text-red-600">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Submit Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <button
                            type="submit"
                            disabled={loading || !user?.CM_Company_ID}
                            className={`w-full py-4 px-6 text-white font-semibold rounded-xl transition-all duration-200 ${loading || !user?.CM_Company_ID
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Creating Godown...</span>
                                </div>
                            ) : (
                                'Create Godown'
                            )}
                        </button>

                        {!user?.CM_Company_ID && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm font-medium text-center">
                                    ⚠️ Company information is required to create a godown. Please refresh the page or contact support.
                                </p>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGodown;
