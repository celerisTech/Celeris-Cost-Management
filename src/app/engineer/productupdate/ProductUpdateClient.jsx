'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { useAuthStore } from '@/app/store/useAuthScreenStore';

export default function ProjectProductsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const projectName = searchParams.get('projectName');
  const router = useRouter();

  const { user } = useAuthStore();
  const engineerId = user?.CM_User_ID;
  const engineerName = user?.CM_Full_Name;

  const [products, setProducts] = useState([]);
  const [aggregatedProducts, setAggregatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState({});
  const [used, setUsed] = useState({});
  const [reports, setReports] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [historyModal, setHistoryModal] = useState({ open: false, data: [], productName: '' });
  const [batchModal, setBatchModal] = useState({ open: false, product: null, batches: [] });
  const [isMobile, setIsMobile] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySortOrder, setHistorySortOrder] = useState('newest');
  const [projectSummary, setProjectSummary] = useState({
    totalProducts: 0,
    totalAllocated: 0,
    totalUsed: 0,
    totalRemaining: 0
  });

  // Show alert message
  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 4000);
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      if (!projectId) return;
      try {
        const res = await fetch(`/api/engineer-update-products?projectId=${projectId}`);
        const data = await res.json();
        setProducts(data);

        // Aggregate products by CM_Product_ID
        const aggregated = aggregateProducts(data);
        setAggregatedProducts(aggregated);

        const initialRemaining = {};
        const initialUsed = {};
        const initialReports = {};

        // Calculate project summary
        let totalAllocatedQty = 0;
        let totalUsedQty = 0;
        let totalRemainingQty = 0;

        aggregated.forEach((prod) => {
          const uniqueId = prod.CM_Product_ID;
          const total = prod.totalQuantity || 0;
          const remainingQty = prod.totalRemaining != null ? prod.totalRemaining : total;
          const usedQty = total - remainingQty;

          initialRemaining[uniqueId] = remainingQty;
          initialUsed[uniqueId] = usedQty;
          initialReports[uniqueId] = '';

          totalAllocatedQty += total;
          totalUsedQty += usedQty;
          totalRemainingQty += remainingQty;
        });

        setRemaining(initialRemaining);
        setUsed(initialUsed);
        setReports(initialReports);
        setProjectSummary({
          totalProducts: aggregated.length,
          totalAllocated: totalAllocatedQty,
          totalUsed: totalUsedQty,
          totalRemaining: totalRemainingQty
        });
      } catch (err) {
        console.error('Error fetching products:', err);
        showAlert('Failed to load products. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [projectId]);
  useEffect(() => {
    if (!aggregatedProducts.length) return;

    let totalAllocatedQty = 0;
    let totalUsedQty = 0;
    let totalRemainingQty = 0;

    aggregatedProducts.forEach(prod => {
      const id = prod.CM_Product_ID;
      const total = prod.totalQuantity || 0;
      const usedQty = used[id] != null ? used[id] : total - (remaining[id] || total);
      const remainingQty = remaining[id] != null ? remaining[id] : total - usedQty;

      totalAllocatedQty += total;
      totalUsedQty += usedQty;
      totalRemainingQty += remainingQty;
    });

    setProjectSummary({
      totalProducts: aggregatedProducts.length,
      totalAllocated: totalAllocatedQty,
      totalUsed: totalUsedQty,
      totalRemaining: totalRemainingQty
    });
  }, [aggregatedProducts, remaining, used]);

  // Aggregate products by Product ID
  const aggregateProducts = (productList) => {
    const aggregated = {};

    productList.forEach(prod => {
      const productId = prod.CM_Product_ID;

      if (!aggregated[productId]) {
        aggregated[productId] = {
          ...prod,
          totalQuantity: 0,
          totalRemaining: 0,
          batches: []
        };
      }

      aggregated[productId].totalQuantity += prod.CM_Quantity || 0;
      aggregated[productId].totalRemaining += prod.CM_Remaining_Quantity != null ? prod.CM_Remaining_Quantity : (prod.CM_Quantity || 0);
      aggregated[productId].batches.push({
        CM_Project_Product_ID: prod.CM_Project_Product_ID,
        CM_Batch_ID: prod.CM_Batch_ID,
        CM_Quantity: prod.CM_Quantity || 0,
        CM_Remaining_Quantity: prod.CM_Remaining_Quantity != null ? prod.CM_Remaining_Quantity : (prod.CM_Quantity || 0),
        CM_Unit_Price: prod.CM_Unit_Price,
        Unit_Type_Name: prod.Unit_Type_Name
      });
    });

    return Object.values(aggregated);
  };

  // Handle changes for aggregated view
  const handleUsedChange = (productId, value) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    const product = aggregatedProducts.find(p => p.CM_Product_ID === productId);
    if (!product) return;
    const max = product.totalQuantity || 0;
    const clampedValue = Math.min(numValue, max);

    setUsed(prev => ({ ...prev, [productId]: clampedValue }));
    setRemaining(prev => ({ ...prev, [productId]: max - clampedValue }));
  };

  const handleRemainingChange = (productId, value) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    const product = aggregatedProducts.find(p => p.CM_Product_ID === productId);
    if (!product) return;
    const max = product.totalQuantity || 0;
    const clampedValue = Math.min(numValue, max);

    setRemaining(prev => ({ ...prev, [productId]: clampedValue }));
    setUsed(prev => ({ ...prev, [productId]: max - clampedValue }));
  };

  const handleReportChange = (productId, value) => {
    setReports(prev => ({ ...prev, [productId]: value }));
  };

  // Show batch modal with FIFO sorting
  const showBatchModal = (product) => {
    // Sort batches: non-zero stock first, then zero stock (FIFO display)
    const sortedBatches = [...(product.batches || [])].sort((a, b) => {
      const remainingA = Number(a.CM_Remaining_Quantity ?? a.CM_Quantity);
      const remainingB = Number(b.CM_Remaining_Quantity ?? b.CM_Quantity);

      // Put batches with stock first (descending order of remaining quantity)
      if (remainingA > 0 && remainingB <= 0) return -1;
      if (remainingA <= 0 && remainingB > 0) return 1;

      // If both have stock, sort by remaining quantity (highest first)
      if (remainingA > 0 && remainingB > 0) {
        return remainingB - remainingA;
      }

      // If both are zero stock, maintain original order
      return 0;
    });

    setBatchModal({
      open: true,
      product: product,
      batches: sortedBatches // Use sorted batches
    });
  };

  // Update batch quantities
  const updateBatchQuantity = async (batchId, usedQty, remainingQty, reportText, workingDate, milestoneId, milestoneName) => {
    try {
      setUpdatingId(batchId);

      const batch = batchModal.batches.find(b => b.CM_Project_Product_ID === batchId);
      if (!batch) return;

      const res = await fetch('/api/engineer-update-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          milestoneId: milestoneId, // Use the passed milestoneId instead of currentMilestoneId
          productId: batchModal.product.CM_Product_ID,
          batchId: batch.CM_Project_Product_ID,
          remainingQty,
          usedQty,
          report: reportText,
          workingDate,
          updatedBy: engineerName || 'Engineer',
        }),
      });

      if (res.ok) {
        showAlert('Batch updated successfully!', 'success');

        // Refresh the products data
        const refreshRes = await fetch(`/api/engineer-update-products?projectId=${projectId}`);
        const refreshedData = await refreshRes.json();
        setProducts(refreshedData);

        // Re-aggregate products
        const aggregated = aggregateProducts(refreshedData);
        setAggregatedProducts(aggregated);

        // Update remaining and used quantities
        const updatedRemaining = { ...remaining };
        const updatedUsed = { ...used };

        aggregated.forEach((prod) => {
          const uniqueId = prod.CM_Product_ID;
          const total = prod.totalQuantity || 0;
          const remainingQty = prod.totalRemaining != null ? prod.totalRemaining : total;
          const usedQty = total - remainingQty;

          updatedRemaining[uniqueId] = remainingQty;
          updatedUsed[uniqueId] = usedQty;
        });

        setRemaining(updatedRemaining);
        setUsed(updatedUsed);

        // Close batch modal
        setBatchModal({ open: false, product: null, batches: [] });
      } else {
        throw new Error('Failed to update batch');
      }
    } catch (err) {
      console.error('Error updating batch:', err);
      showAlert('An error occurred while updating.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Fetch product usage history
  const fetchHistory = async (productId, productName) => {
    try {
      const res = await fetch(`/api/product-usage-history?projectId=${projectId}&productId=${productId}`);
      const data = await res.json();
      setHistoryModal({ open: true, data, productName });
    } catch (err) {
      console.error('Error fetching history:', err);
      showAlert('Failed to fetch usage history.', 'error');
    }
  };

  const filteredProducts = aggregatedProducts.filter(product =>
    product.CM_Product_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.CM_Product_ID?.toString().includes(searchTerm) ||
    product.Category_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.Subcategory_Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter history data based on selection
  const getFilteredHistoryData = () => {
    if (!historyModal.data || historyModal.data.length === 0) return [];

    let filtered = [...historyModal.data];

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (historyFilter === 'today') {
      filtered = filtered.filter(item => new Date(item.CM_Updated_At) >= today);
    } else if (historyFilter === 'week') {
      filtered = filtered.filter(item => new Date(item.CM_Updated_At) >= thisWeekStart);
    } else if (historyFilter === 'month') {
      filtered = filtered.filter(item => new Date(item.CM_Updated_At) >= thisMonthStart);
    }

    // Apply sort
    if (historySortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.CM_Updated_At) - new Date(a.CM_Updated_At));
    } else if (historySortOrder === 'oldest') {
      filtered.sort((a, b) => new Date(a.CM_Updated_At) - new Date(b.CM_Updated_At));
    } else if (historySortOrder === 'quantity') {
      filtered.sort((a, b) => b.CM_Used_Quantity - a.CM_Used_Quantity);
    }

    return filtered;
  };

  if (loading) {
    return (
      <div className="h-screen bg-white">
        <Navbar />
        <div className="flex-1 md:ml-64 pt-16 overflow-y-auto">
          <div className=" mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
              <div className="animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 animate-pulse">
                      <div className="col-span-2 h-4 bg-slate-200 rounded"></div>
                      <div className="col-span-3 h-4 bg-slate-200 rounded"></div>
                      <div className="col-span-2 h-4 bg-slate-200 rounded"></div>
                      <div className="col-span-2 h-4 bg-slate-200 rounded"></div>
                      <div className="col-span-2 h-4 bg-slate-200 rounded"></div>
                      <div className="col-span-1 h-4 bg-slate-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row h-screen bg-white">
      <Navbar />
      <div className="flex-1 p-3 sm:p-4 md:p-8 overflow-y-auto">
        <div className=" mx-auto">

          {/* Alert Messages */}
          {alert.show && (
            <div
              className={`
      fixed z-50 
      top-4 left-1/2 transform -translate-x-1/2 
      w-[90%] sm:w-auto sm:left-auto sm:right-4 sm:translate-x-0
      ${alert.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : alert.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }
      border-2 rounded-xl p-4 shadow-lg 
      transition-all duration-300 ease-in-out 
      animate-slideIn
    `}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`
          flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-base
          ${alert.type === 'success'
                      ? 'bg-green-100 text-green-600'
                      : alert.type === 'error'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }
        `}
                >
                  {alert.type === 'success' ? '✓' : alert.type === 'error' ? '✕' : 'ℹ'}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium break-words leading-snug">{alert.message}</p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setAlert({ show: false, message: '', type: '' })}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
                  aria-label="Close alert"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-3xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tracking-tight">
                Project Products
              </h1>
              <p className="text-xl sm:text-xl md:text-2xl text-gray-600 mt-1 sm:mt-2">
                <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {projectName || 'Unknown Project'}
                </span>
              </p>
            </div>

            <button
              onClick={() => router.back()}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-300 text-gray-800 rounded-lg text-sm hover:bg-gray-300 transition self-start sm:self-auto"
            >
              ← Back
            </button>
          </div>

          {/* Project Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
            {/* Total Products Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-indigo-100 p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{projectSummary.totalProducts}</h3>
                </div>
                <div className="bg-indigo-100 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Allocated Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-blue-100 p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Allocated</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{projectSummary.totalAllocated}</h3>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            {/* Used Products Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-green-100 p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Used</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{projectSummary.totalUsed}</h3>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-green-600 h-1.5 rounded-full"
                    style={{ width: `${projectSummary.totalAllocated ? (projectSummary.totalUsed / projectSummary.totalAllocated) * 100 : 0}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {projectSummary.totalAllocated ? ((projectSummary.totalUsed / projectSummary.totalAllocated) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            </div>

            {/* Remaining Stock Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-amber-100 p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Remaining Stock</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{projectSummary.totalRemaining}</h3>
                </div>
                <div className="bg-amber-100 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${projectSummary.totalAllocated ? (projectSummary.totalRemaining / projectSummary.totalAllocated) * 100 : 0}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {projectSummary.totalAllocated ? ((projectSummary.totalRemaining / projectSummary.totalAllocated) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="w-80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-3 sm:p-6 mb-6 sm:mb-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="relative">
              <svg
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by product name, ID, category, or subcategory..."
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-5 py-2.5 sm:py-4 bg-white text-gray-800 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all text-xs sm:text-sm shadow-sm placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Products Table */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-12 text-center border border-gray-200">
              <svg className="mx-auto h-12 sm:h-16 w-12 sm:w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.447-.884-6-2.347m8 0a8.97 8.97 0 01-8 0" />
              </svg>
              <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-sm text-gray-500">Try adjusting your search or check back later.</p>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] transition-all duration-500">
              {isMobile ? (
                <div className="p-4 divide-y divide-gray-100">
                  {filteredProducts.map((prod) => {
                    const productId = prod.CM_Product_ID;
                    const category = prod.Category_Name;
                    const subcategory = prod.Subcategory_Name;
                    const totalQty = prod.totalQuantity || 0;
                    const remainingQty = prod.totalRemaining;
                    const isZeroRemaining = remainingQty === 0;
                    const batchCount = prod.batches?.length || 0;

                    return (
                      <div key={productId} className="py-4 space-y-3">
                        {/* Product Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <h3 className="font-medium text-blue-700">{prod.CM_Product_Name || "N/A"}</h3>
                              <p className="text-xs text-gray-500">{prod.CM_Product_Code || ""}</p>
                            </div>
                          </div>
                        </div>

                        {/* Category & Subcategory */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <div className="font-medium text-gray-900 truncate">{category || "N/A"}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Subcategory:</span>
                            <div className="font-medium text-gray-900 truncate">{subcategory || "N/A"}</div>
                          </div>
                        </div>

                        {/* Details as grid */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 text-xs">Total:</span>
                            <div className="font-semibold text-gray-900">{totalQty}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Remaining:</span>
                            <div className={`font-semibold ${isZeroRemaining ? 'text-red-600' : 'text-gray-900'}`}>
                              <input
                                type="number"
                                min="0"
                                max={totalQty}
                                value={remainingQty}
                                onChange={(e) => handleRemainingChange(productId, e.target.value)}
                                className={`w-16 text-center rounded border px-1 py-0.5 ${isZeroRemaining ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center mt-2 gap-2">
                          <button
                            onClick={() => showBatchModal(prod)}
                            className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                          >
                            Batches ({batchCount})
                          </button>
                          <button
                            onClick={() => fetchHistory(productId, prod.CM_Product_Name)}
                            className="flex-1 px-3 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium hover:bg-gray-300 transition-colors text-center"
                          >
                            History
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    {/* Table Header */}
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Product</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sub Category</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Remaining</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Batches</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((prod) => {
                        const productId = prod.CM_Product_ID;
                        const category = prod.Category_Name;
                        const subcategory = prod.Subcategory_Name;
                        const totalQty = prod.totalQuantity || 0;
                        const remainingQty = prod.totalRemaining;
                        const isZeroRemaining = remainingQty === 0;
                        const batchCount = prod.batches?.length || 0;

                        return (
                          <tr key={productId} className="hover:bg-gray-50 transition-colors">
                            {/* Product Name */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="text-m font-medium text-gray-900">
                                    {prod.CM_Product_Name || "N/A"}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5 italic">
                                    {prod.CM_Product_Code || ""}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-block px-3 py-1 text-sm font-medium text-gray-700">
                                {category || "N/A"}
                              </span>
                            </td>

                            {/* Subcategory */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-block px-3 py-1 text-sm font-medium text-gray-700">
                                {subcategory || "N/A"}
                              </span>
                            </td>

                            {/* Total */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-block px-3 py-1 text-sm font-medium bg-green-50 text-green-700 rounded-full border border-green-100">
                                {totalQty}
                              </span>
                            </td>

                            {/* Remaining */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={totalQty}
                                  value={remainingQty}
                                  onChange={(e) => handleRemainingChange(productId, e.target.value)}
                                  className={`w-20 text-center text-sm font-medium rounded border-2 px-2 py-1 
                                    ${isZeroRemaining ? "border-red-300 bg-red-50 text-red-700" : "border-gray-300 text-gray-800 focus:border-indigo-400"}`}
                                />
                                {isZeroRemaining && (
                                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                    Out
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Batches */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => showBatchModal(prod)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                View ({batchCount})
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => fetchHistory(productId, prod.CM_Product_Name)}
                                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                                >
                                  History
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Subtle Bottom Glow */}
              <div className="h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
            </div>
          )}

          {/* Batch Update Modal */}
          {batchModal.open && (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
              <div className="bg-white border-2 sm:border-3 border-blue-500 rounded-xl sm:rounded-2xl p-3 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative transform transition-all duration-300 scale-100">
                <button
                  onClick={() => setBatchModal({ open: false, product: null, batches: [] })}
                  className="absolute top-2 sm:top-5 right-2 sm:right-5 text-gray-500 hover:text-gray-600 text-xl sm:text-2xl font-light transition hover:rotate-90 duration-300"
                >
                  ×
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                  Update Batches: <span className="text-indigo-600">{batchModal.product?.CM_Product_Name}</span>
                </h2>


                <div className="overflow-y-auto max-h-[50vh] sm:max-h-[60vh] pr-1 sm:pr-2">
                  <div className="space-y-4">
                    {batchModal.batches.map((batch, index) => (
                      <BatchUpdateRow
                        key={batch.CM_Project_Product_ID}
                        projectId={projectId}
                        batch={batch}
                        index={index}
                        onUpdate={updateBatchQuantity}
                        engineerName={engineerName}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setBatchModal({ open: false, product: null, batches: [] })}
                    className="px-3 sm:px-5 py-1 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs sm:text-sm font-medium transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* History Modal */}
          {historyModal.open && (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
              <div className="bg-white border-2 sm:border-3 border-blue-500 rounded-xl sm:rounded-2xl p-3 sm:p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl relative transform transition-all duration-300 scale-100">
                <button
                  onClick={() => setHistoryModal({ ...historyModal, open: false })}
                  className="absolute top-2 sm:top-5 right-2 sm:right-5 text-gray-500 hover:text-gray-600 text-xl sm:text-2xl font-light transition hover:rotate-90 duration-300"
                >
                  ×
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                  Usage History: <span className="text-indigo-600">{historyModal.productName}</span>
                </h2>

                {/* History Dropdown Filter */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 text-black">
                    <select
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                    >
                      <option value="all">All Updates</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                    <select
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                      value={historySortOrder}
                      onChange={(e) => setHistorySortOrder(e.target.value)}
                    >
                      <option value="newest">Sort by Date (Newest First)</option>
                      <option value="oldest">Sort by Date (Oldest First)</option>
                      <option value="quantity">Sort by Quantity Used</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[50vh] sm:max-h-[60vh] pr-1 sm:pr-2">
                  {historyModal.data.length === 0 ? (
                    <div className="text-center py-8 sm:py-10">
                      <svg className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.447-.884-6-2.347m8 0a8.97 8.97 0 01-8 0" />
                      </svg>
                      <p className="mt-3 sm:mt-4 text-gray-500 text-xs sm:text-sm">No usage history recorded yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated By</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getFilteredHistoryData().map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">{row.CM_Original_Quantity}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{row.CM_Used_Quantity}</td>
                              <td className={`px-4 py-3 text-sm font-medium ${row.CM_Remaining_Quantity === 0 ? 'text-red-600' :
                                row.CM_Remaining_Quantity < (row.CM_Original_Quantity * 0.2) ? 'text-orange-600' :
                                  'text-green-600'
                                }`}>
                                {row.CM_Remaining_Quantity}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                                <div className="truncate" title={row.CM_Report}>
                                  {row.CM_Report || '—'}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">{row.CM_Updated_By || 'System'}</td>
                              <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                {new Date(row.CM_Updated_At).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Showing {getFilteredHistoryData().length} of {historyModal.data.length} records
                  </div>
                  <button
                    onClick={() => setHistoryModal({ ...historyModal, open: false })}
                    className="px-3 sm:px-5 py-1 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs sm:text-sm font-medium transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function BatchUpdateRow({
  batch,
  index,
  onUpdate,
  engineerName,
  projectId, // ✅ Add this prop
  showZeroStockLast = true,
}) {
  const initialRemaining = Number(batch.CM_Remaining_Quantity ?? batch.CM_Quantity);
  const [usedQty, setUsedQty] = useState(0);
  const [remainingQty, setRemainingQty] = useState(initialRemaining);
  const [report, setReport] = useState("");
  const [workingDate, setWorkingDate] = useState(new Date().toISOString().split("T")[0]);
  const [milestones, setMilestones] = useState([]); // ✅ Store fetched milestones
  const [selectedMilestone, setSelectedMilestone] = useState("");

  const hasZeroStock = initialRemaining <= 0;

  // ✅ Fetch milestones for this project
  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const res = await fetch(`/api/milestones/engineer?projectId=${projectId}`);
        if (!res.ok) throw new Error("Failed to fetch milestones");
        const data = await res.json();
        setMilestones(data);

        // Auto-select if only one milestone
        if (data.length === 1) {
          setSelectedMilestone(data[0].CM_Milestone_ID);
        }
      } catch (err) {
        console.error("Error fetching milestones:", err);
      }
    };

    if (projectId) fetchMilestones();
  }, [projectId]);

  // Handle Used Qty Change
  const handleUsedChange = (value) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    const max = initialRemaining;
    const clampedValue = Math.min(numValue, max);

    setUsedQty(clampedValue);
    setRemainingQty(initialRemaining - clampedValue);
  };

  // Handle Remaining Qty Change
  const handleRemainingChange = (value) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    const max = initialRemaining;
    const clampedValue = Math.min(numValue, max);

    setRemainingQty(clampedValue);
    setUsedQty(initialRemaining - clampedValue);
  };

  const handleUpdate = () => {
    if (!workingDate) {
      alert("Please select a working date");
      return;
    }
    if (!selectedMilestone) {
      alert("Please select a milestone");
      return;
    }

    const reportText =
      report || `Batch updated by ${engineerName || "Engineer"} on ${new Date().toLocaleString()}`;

    const milestoneName =
      milestones.find((m) => m.CM_Milestone_ID === selectedMilestone)?.CM_Milestone_Name || "";

    // Pass all required parameters including milestoneId and milestoneName
    onUpdate(
      batch.CM_Project_Product_ID,
      usedQty,
      remainingQty,
      reportText,
      workingDate,
      selectedMilestone, // milestoneId
      milestoneName      // milestoneName
    );
  };

  // ✅ Out of stock rendering remains same...
  if (showZeroStockLast && hasZeroStock) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 opacity-75">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-500">Batch {index + 1} (Out of Stock)</h3>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
              Total: {batch.CM_Quantity} {batch.Unit_Type_Name}
            </span>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Stock: 0</span>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Working Date</label>
            <input
              type="date"
              value={workingDate}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-100 text-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-800 mb-1">Used Quantity</label>
              <input
                type="number"
                value="0"
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-100 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Remaining</label>
              <input
                type="number"
                value="0"
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-100 text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-1">Report Note</label>
            <input
              type="text"
              value="Out of Stock"
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-100 text-gray-600"
            />
          </div>

          <button
            disabled
            className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded text-sm font-medium cursor-not-allowed"
          >
            Out of Stock
          </button>
        </div>
      </div>
    );
  }

  // ✅ Regular (active) batch UI
  return (
    <div
      className={`bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow transition-shadow ${initialRemaining > 0 ? "border-l-4 border-l-green-500" : ""
        }`}
    >
      <div className="space-y-3">
        {/* Batch Header */}
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">
            Batch {index + 1}
            {initialRemaining > 0 && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Available
              </span>
            )}
          </h3>
          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
            Total: {batch.CM_Quantity} {batch.Unit_Type_Name}
          </span>
          {initialRemaining > 0 && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              Available: {initialRemaining}
            </span>
          )}
        </div>

        {/* ✅ Milestone Selector */}
        <div>
          <label className="block text-xs text-gray-800 mb-1">Milestone *</label>
          <select
            value={selectedMilestone}
            onChange={(e) => setSelectedMilestone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-black focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          >
            <option value="">Select milestone</option>
            {milestones.map((m) => (
              <option key={m.CM_Milestone_ID} value={m.CM_Milestone_ID}>
                {m.CM_Milestone_Name}
              </option>
            ))}
          </select>
        </div>

        {/* Working Date */}
        <div>
          <label className="block text-xs text-gray-800 mb-1">Working Date *</label>
          <input
            type="date"
            value={workingDate}
            onChange={(e) => setWorkingDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-black text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Select the date when this work was performed (past or future)
          </p>
        </div>

        {/* Quantities */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-800 mb-1">Used Quantity</label>
            <input
              type="number"
              min="0"
              max={initialRemaining}
              value={usedQty}
              onChange={(e) => handleUsedChange(e.target.value)}
              className="w-full px-3 py-2 text-black border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-800 mb-1">Remaining</label>
            <input
              type="number"
              min="0"
              max={initialRemaining}
              value={remainingQty}
              onChange={(e) => handleRemainingChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-black text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Report */}
        <div>
          <label className="block text-xs text-gray-800 mb-1">Report Note</label>
          <input
            type="text"
            placeholder="Add report note (optional)..."
            value={report}
            onChange={(e) => setReport(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 text-black rounded text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          />
        </div>

        {/* Update Button */}
        <button
          onClick={handleUpdate}
          disabled={
            (!usedQty && remainingQty === initialRemaining) ||
            !workingDate ||
            !selectedMilestone
          }
          className="w-full px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
        >
          Update Batch
        </button>
      </div>
    </div>
  );
}


