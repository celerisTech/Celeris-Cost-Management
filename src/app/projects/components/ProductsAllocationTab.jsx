// src/app/projects/components/ProductsAllocationTab.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import BatchSelectionModal from './BatchSelectionModal';
import toast from 'react-hot-toast';

export default function ProductsAllocationTab({ projectId, projectName, status }) {
  const router = useRouter();
  const [allocatedProducts, setAllocatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchDetails, setBatchDetails] = useState({});
  const [expandedProducts, setExpandedProducts] = useState({});
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [project, setProject] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    totalQuantity: 0,
    categories: 0,
    totalBatches: 0
  });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchAllocatedProducts();
    }
  }, [projectId]);

  const fetchAllocatedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/allocated?projectId=${projectId}`);
      const data = await response.json();

      if (data.success) {
        const products = data.data?.products || data.data || [];
        setAllocatedProducts(products);
        calculateStats(products);

        // Fetch batch details for each product
        const batchDetailsMap = {};
        let totalBatchesCount = 0;

        await Promise.all(
          products.map(async (product) => {
            try {
              const batchResponse = await fetch(`/api/products/batches?itemId=${product.CM_Product_ID}&projectId=${projectId}`);
              const batchData = await batchResponse.json();

              if (batchData.success) {
                const batches = batchData.data?.batches || [];
                batchDetailsMap[product.CM_Product_ID] = batches;
                totalBatchesCount += batches.length;
              }
            } catch (err) {
              console.error(`Error fetching batch details for ${product.CM_Product_ID}:`, err);
            }
          })
        );

        setBatchDetails(batchDetailsMap);
        setStats(prev => ({
          ...prev,
          totalBatches: totalBatchesCount || products.length
        }));
      } else {
        setError(data.message || 'Failed to fetch allocated products');
      }
    } catch (error) {
      console.error('Error fetching allocated products:', error);
      setError('Failed to load allocated products');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (products) => {
    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, product) =>
      sum + parseInt(product.CM_Quantity || 1), 0);
    const totalValue = products.reduce((sum, product) =>
      sum + parseFloat(product.CM_Total_Price || 0), 0);
    const categories = [...new Set(products.map(p => p.category_name).filter(Boolean))].length;

    setStats({
      totalProducts,
      totalValue,
      totalQuantity,
      categories,
      totalBatches: 0 // Will be updated when batch data is loaded
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);
  };

  const handleStartAllocation = () => {
    const params = new URLSearchParams({
      projectId: projectId,
      projectName: projectName
    });
    router.push(`/projects/products?${params.toString()}`);
  };

  const handleAddMoreProducts = () => {
    const params = new URLSearchParams({
      projectId: projectId,
      projectName: projectName,
      mode: 'additional'
    });
    router.push(`/projects/products?${params.toString()}`);
  };


  const toggleProductExpand = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleManageBatches = (product) => {
    setSelectedProduct(product);
    setShowBatchModal(true);
  };

  const handleBatchAllocationComplete = async () => {
    // Refresh data after allocation
    await fetchAllocatedProducts();
  };

  const downloadExcel = () => {
    setExportLoading(true);
    setTimeout(() => {
      try {
        // Create a CSV string
        let csvContent = "data:text/csv;charset=utf-8,";

        // Headers
        csvContent += "Product Name,Category,Batch ID,Quantity,Unit Price,Total Value,Godown,Purchase Date\n";

        // Data rows
        allocatedProducts.forEach(product => {
          const batches = batchDetails[product.CM_Product_ID] || [];

          if (batches.length > 0) {
            // If we have batch details, add each batch as a row
            batches.forEach(batch => {
              const quantity = batch.project_quantity || 0;
              const unitPrice = parseFloat(batch.CM_Unit_Price) || 0;
              const totalValue = quantity * unitPrice;

              if (quantity > 0) { // Only include batches with actual project allocation
                csvContent += `"${product.CM_Product_Name}","${product.category_name || ''}","${batch.CM_Batch_ID}",${quantity},${unitPrice},${totalValue},"${batch.CM_Godown_Name || 'Unknown'}","${batch.CM_Purchase_Date ? new Date(batch.CM_Purchase_Date).toLocaleDateString() : 'Unknown'}"\n`;
              }
            });
          } else {
            // If no batch details, just add the product as a single row
            const quantity = parseInt(product.CM_Quantity) || 0;
            const totalPrice = parseFloat(product.CM_Total_Price) || 0;
            const avgUnitPrice = quantity > 0 ? totalPrice / quantity : 0;

            csvContent += `"${product.CM_Product_Name}","${product.category_name || ''}","Unknown",${quantity},${avgUnitPrice},${totalPrice},"Unknown","Unknown"\n`;
          }
        });

        // Create and trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Project_${projectId}_Allocation_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("CSV report downloaded successfully");
      } catch (error) {
        console.error("Error generating CSV:", error);
        toast.error("Failed to generate CSV report");
      } finally {
        setExportLoading(false);
      }
    }, 500);
  };

  const downloadPDF = async () => {
    try {
      setExportLoading(true);

      // Only run in browser
      if (typeof window === "undefined") return;

      // Dynamic import of both jsPDF and autotable
      const { jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable');

      // Create a PDF-specific currency formatter
      const formatPdfCurrency = (value) => {
        // Ensure value is a number
        const numValue = Number(value);

        // Handle NaN case
        if (isNaN(numValue)) return "0.00";

        // Format with 2 decimal places
        return numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };

      // Create PDF document
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(0, 51, 102);
      doc.text("Product Allocation Report", 20, 25);

      // Project Info
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Project: ${projectName} `, 20, 35);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42);

      // Summary Section
      doc.setFontSize(14);
      doc.setTextColor(0, 102, 204);
      doc.text("Summary Statistics", 20, 55);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Products: ${stats.totalProducts}`, 20, 65);
      doc.text(`Total Items: ${stats.totalQuantity}`, 80, 65);
      doc.text(`Total Value: INR ${formatPdfCurrency(stats.totalValue)}`, 140, 65);
      doc.text(`Categories: ${stats.categories}`, 20, 72);
      doc.text(`Total Batches: ${stats.totalBatches}`, 80, 72);

      // Prepare table data
      const tableHeaders = [
        "Product Name",
        "Category",
        "Batch ID",
        "Quantity",
        "Unit Price",
        "Total Value",
        "Godown"
      ];

      const tableData = [];

      allocatedProducts.forEach(product => {
        const batches = batchDetails[product.CM_Product_ID] || [];

        if (batches.length > 0 && batches.some(b => (b.project_quantity || 0) > 0)) {
          batches
            .filter(batch => (batch.project_quantity || 0) > 0)
            .forEach(batch => {
              const quantity = Number(batch.project_quantity) || 0;
              const unitPrice = Number(batch.CM_Unit_Price) || 0;
              const totalValue = quantity * unitPrice;

              tableData.push([
                product.CM_Product_Name,
                product.category_name || "-",
                batch.CM_Batch_ID || "N/A",
                `${quantity} ${product.Unit_Type_Name || ""}`,
                `INR ${formatPdfCurrency(unitPrice)}`,
                `INR ${formatPdfCurrency(totalValue)}`,
                batch.CM_Godown_Name || "Unknown"
              ]);
            });
        } else {
          // If no batch details, show product-level info
          const quantity = Number(product.CM_Quantity) || 0;
          const totalPrice = Number(product.CM_Total_Price) || 0;
          const avgUnitPrice = quantity > 0 ? totalPrice / quantity : 0;

          tableData.push([
            product.CM_Product_Name,
            product.category_name || "-",
            "N/A",
            `${quantity} ${product.Unit_Type_Name || ""}`,
            `$${formatPdfCurrency(avgUnitPrice)}`,
            `$${formatPdfCurrency(totalPrice)}`,
            product.godown_name || "Unknown"
          ]);
        }
      });

      // Add table to PDF using autoTable
      autoTable.default(doc, {
        startY: 80,
        head: [tableHeaders],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [0, 102, 204],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        margin: { top: 80 }
      });

      // Save the PDF
      doc.save(`Project_${projectName}_Allocation_Report.pdf`);
      toast.success("PDF report downloaded successfully");

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
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
    );

  // Error State
  if (error) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <div className="text-center py-6 sm:py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Error Loading Allocations</h3>
            <p className="text-red-600 text-sm sm:text-base mb-4">{error}</p>
            <button
              onClick={fetchAllocatedProducts}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show existing allocations if any exist
  if (allocatedProducts.length > 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-lg shadow-sm border border-gray-200 bg-white p-4">
          <div className="flex flex-col md:flex-row justify-between items-start mb-4">
            {/* Header */}
            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-1 flex items-center">
                <span className="inline-block mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </span>
                Product Allocation Summary
              </h2>
              <p className="text-gray-500 text-sm">"{projectName}"</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-3 md:mt-0">
              {status === "Active" && (
                <button
                  onClick={handleAddMoreProducts}
                  className="inline-flex items-center px-3 py-2.5 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Products
                </button>
              )}

              {/* Download Dropdown */}
              <div className="relative inline-block text-left">
                <div>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white  rounded-xl shadow-lg  ring-opacity-5 focus:outline-none z-20 animate-in fade-in-0 zoom-in-95">
                    <div className="p-2">
                      <button
                        onClick={() => { setShowMenu(false); downloadExcel(); }}
                        className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-150 group"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Download Excel</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { setShowMenu(false); downloadPDF(); }}
                        className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-150 group mt-1"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Download PDF</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {status !== "Active" && project !== null && (
            <div className="mb-4 text-xs px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                This project is currently inactive. Please contact an administrator to reactivate.
              </div>
            </div>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-2">
            {[
              { label: "Total Products", value: stats.totalProducts, color: "bg-sky-100 text-sky-800" },
              { label: "Categories", value: stats.categories, color: "bg-indigo-100 text-indigo-800" },
              { label: "Total Items", value: stats.totalQuantity, color: "bg-emerald-100 text-emerald-800" },
              { label: "Batches", value: stats.totalBatches, color: "bg-blue-100 text-blue-800" },
              { label: "Total Value", value: formatCurrency(stats.totalValue), color: "bg-purple-100 text-purple-800" },
            ].map((item, index) => (
              <div key={index} className={`p-3 rounded-md ${item.color} flex flex-col items-center justify-center`}>
                <span className="text-sm font-semibold">{item.value}</span>
                <span className="text-xs opacity-80">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Allocated Products List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Currently Allocated Products ({allocatedProducts.length})
            </h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {allocatedProducts.map((product, index) => (
                <div
                  key={`allocated-${product.CM_Product_ID}-${index}`}
                  className="p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {product.CM_Product_Name}
                          </h4>

                          {/* Mobile: Compact info */}
                          <div className="sm:hidden mt-1 space-y-1">
                            <div className="flex items-center text-xs text-gray-600">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span className="truncate">{product.category_name}{product.subcategory_name && ` > ${product.subcategory_name}`}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>{product.CM_Quantity} {product.Unit_Type_Name}</span>
                            </div>
                          </div>

                          {/* Desktop: Detailed info */}
                          <div className="hidden sm:flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span>{product.category_name}{product.subcategory_name && ` > ${product.subcategory_name}`}</span>
                            </div>

                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>{product.CM_Quantity} {product.Unit_Type_Name}</span>
                            </div>

                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span>{formatCurrency(product.CM_Unit_Price)}</span>
                            </div>

                            {product.godown_name && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>{product.godown_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Value and Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">
                          {formatCurrency(product.CM_Total_Price)}
                        </div>
                        <div className="text-xs text-gray-600 hidden sm:block">
                          Total Value
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleProductExpand(product.CM_Product_ID)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View batch details"
                        >
                          <svg className={`w-4 h-4 transition-transform ${expandedProducts[product.CM_Product_ID] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Batch details section - expanded view */}
                  {expandedProducts[product.CM_Product_ID] && (
                    <div className="mt-3 sm:mt-4 border-t pt-3">
                      <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Batch Details
                      </h5>

                      {batchDetails[product.CM_Product_ID]?.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                              <thead>
                                <tr className="text-left font-medium text-gray-500 tracking-wider">
                                  <th className="px-2 py-2 sm:px-3">Batch ID</th>
                                  <th className="px-2 py-2 sm:px-3">Godown</th>
                                  <th className="px-2 py-2 sm:px-3">Quantity</th>
                                  <th className="px-2 py-2 sm:px-3">Unit Price</th>
                                  <th className="px-2 py-2 sm:px-3">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {batchDetails[product.CM_Product_ID]
                                  .filter(batch => batch.project_quantity > 0)
                                  .map((batch, idx) => (
                                    <tr key={idx} className="hover:bg-gray-100 text-black">
                                      <td className="px-2 py-2 sm:px-3 font-mono text-xs">{batch.CM_Batch_ID}</td>
                                      <td className="px-2 py-2 sm:px-3">{batch.CM_Godown_Name || 'Unknown'}</td>
                                      <td className="px-2 py-2 sm:px-3">{batch.project_quantity || 0} {product.Unit_Type_Name}</td>
                                      <td className="px-2 py-2 sm:px-3">{formatCurrency(batch.CM_Unit_Price)}</td>
                                      <td className="px-2 py-2 sm:px-3 font-medium">
                                        {formatCurrency((batch.project_quantity || 0) * (batch.CM_Unit_Price || 0))}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic py-2 text-center bg-gray-50 rounded-lg">
                          No batch details available for this product.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Batch Selection Modal */}
        <BatchSelectionModal
          isOpen={showBatchModal}
          onClose={() => setShowBatchModal(false)}
          product={selectedProduct}
          projectId={projectId}
          onAllocate={handleBatchAllocationComplete}
        />
      </div>
    );
  }

  // Show initial allocation screen if no products are allocated
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
      <div className="text-center py-8 sm:py-12">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1v6m6-6v6" />
          </svg>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">
          Start Product Allocation
        </h2>

        <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto px-2">
          No products have been allocated to "{projectName}" yet. Start by selecting products from your available inventory to allocate to this project.
        </p>

        {status === 'Active' ? (
          <button
            onClick={handleStartAllocation}
            className="bg-blue-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center text-sm sm:text-lg shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Start Product Allocation
          </button>
        ) : project !== null ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 sm:px-6 sm:py-4 rounded-lg max-w-md mx-auto">
            <p className="font-medium text-sm sm:text-base">This project is currently inactive.</p>
            <p className="text-xs sm:text-sm mt-1">Contact admin to reactivate before allocating products.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}