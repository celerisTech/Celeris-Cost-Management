// src/app/warehouse/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const WarehouseDashboard = () => {
    const router = useRouter()
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalCategories: 0,
        totalValue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('/api/warehousestats');
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    return (
        <div className="container mx-auto px-4 py-8 animate-fadeIn">
            {/* Enhanced Header Section */}
            <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative">
                    <div className="absolute -inset-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg opacity-50 blur-md animate-pulse-slow"></div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 relative flex items-center">
                        <span className="inline-block mr-3 text-3xl animate-float-slow">📦</span> 
                        Warehouse Dashboard
                    </h1>
                </div>
            </div>

            {/* Enhanced Stats Grid with staggered animations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Total Products Card */}
                <div className="animate-fadeInUp delay-100 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-500 cursor-pointer transform hover:-translate-y-2 group border border-blue-100 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-200 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-blue-300 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h3 className="text-blue-600 text-m font-semibold  tracking-wider mb-2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Total Products
                            </h3>
                            {loading ? (
                                <div className="space-y-2.5 animate-pulse">
                                    <div className="h-4 bg-blue-100 rounded w-3/4"></div>
                                    <div className="h-9 bg-blue-100 rounded w-full"></div>
                                </div>
                            ) : (
                                <p className="text-4xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors duration-500">
                                    {stats.totalProducts.toLocaleString()}
                                </p>
                            )}
                        </div>
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-500 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-5 h-2 bg-blue-100 rounded-full overflow-hidden relative">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-progress-slow group-hover:animate-progress-fast absolute inset-0"></div>
                    </div>
                </div>

                {/* Total Categories Card */}
                <div className="animate-fadeInUp delay-200 bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-500 cursor-pointer transform hover:-translate-y-2 group border border-purple-100 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-200 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-purple-300 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h3 className="text-purple-600 text-m font-semibold  tracking-wider mb-2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Total Categories
                            </h3>
                            {loading ? (
                                <div className="space-y-2.5 animate-pulse">
                                    <div className="h-4 bg-purple-100 rounded w-3/4"></div>
                                    <div className="h-9 bg-purple-100 rounded w-full"></div>
                                </div>
                            ) : (
                                <p className="text-4xl font-bold text-gray-800 group-hover:text-purple-700 transition-colors duration-500">
                                    {stats.totalCategories.toLocaleString()}
                                </p>
                            )}
                        </div>
                        <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-500 shadow-md group-hover:shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 group-hover:animate-bounce-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-5 h-2 bg-purple-100 rounded-full overflow-hidden relative">
                        <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-progress-slow group-hover:animate-progress-fast absolute inset-0"></div>
                    </div>
                </div>

                {/* Total Value Card */}
                <div className="animate-fadeInUp delay-300 bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-500 cursor-pointer transform hover:-translate-y-2 group border border-green-100 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-200 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-green-300 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h3 className="text-green-600 text-m font-semibold  tracking-wider mb-2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Total Value
                            </h3>
                            {loading ? (
                                <div className="space-y-2.5 animate-pulse">
                                    <div className="h-4 bg-green-100 rounded w-3/4"></div>
                                    <div className="h-9 bg-green-100 rounded w-full"></div>
                                </div>
                            ) : (
                                <p className="text-4xl font-bold text-gray-800 group-hover:text-green-700 transition-colors duration-500">
                                    {formatCurrency(stats.totalValue)}
                                </p>
                            )}
                        </div>
                        <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl group-hover:from-green-200 group-hover:to-green-300 transition-all duration-500 shadow-md group-hover:shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 relative z-10 group-hover:rotate-12 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-5 h-2 bg-green-100 rounded-full overflow-hidden relative">
                        <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-progress-slow group-hover:animate-progress-fast absolute inset-0"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarehouseDashboard;
