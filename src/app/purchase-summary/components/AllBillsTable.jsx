'use client';

import { useState, useEffect } from 'react';
// ADD: Import PDF libraries
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function AllBillsTable({ allBills, onBillSelect, refreshTrigger }) {
  const [sortConfig, setSortConfig] = useState({ key: 'CM_Created_At', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  // ADD: State for dropdown visibility
  const [showDropdown, setShowDropdown] = useState({});
  const itemsPerPage = 10;

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  const getPaymentStatus = (bill) => {
    const status = bill.CM_Payment_Status || 'Unpaid';
    
    switch (status) {
      case 'Paid':
        return { text: 'Paid', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      case 'Partially Paid':
        return { text: 'Partial', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
      case 'Unpaid':
      default:
        return { text: 'Unpaid', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleView = async (bill) => {
    setActionLoading(prev => ({ ...prev, [`view_${bill.CM_Purchase_Summary_ID}`]: true }));
    try {
      const url = `/purchase-summary/bill/${bill.CM_Purchase_Summary_ID}/view`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening bill view:', error);
      alert('Error opening bill view');
    } finally {
      setActionLoading(prev => ({ ...prev, [`view_${bill.CM_Purchase_Summary_ID}`]: false }));
    }
  };

  // MODIFIED: Enhanced download function with format support
  const handleDownload = async (bill, format = 'txt') => {
    const loadingKey = `download_${bill.CM_Purchase_Summary_ID}_${format}`;
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }));
    setShowDropdown(prev => ({ ...prev, [bill.CM_Purchase_Summary_ID]: false }));
    
    try {
      console.log(`Starting ${format.toUpperCase()} download for bill:`, bill.CM_Bill_Number);
      
      if (format === 'pdf') {
        await handlePDFDownload(bill);
      } else {
        const response = await fetch(`/api/purchase-summary/bill/${bill.CM_Purchase_Summary_ID}/download?format=${format}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `bill_${bill.CM_Bill_Number}.${format}`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log(`${format.toUpperCase()} download completed:`, filename);
      }
    } catch (error) {
      console.error(`Error downloading bill as ${format}:`, error);
      alert(`Error downloading bill as ${format.toUpperCase()}: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // ADD: PDF generation function
  const handlePDFDownload = async (bill) => {
    try {
      console.log('Starting PDF generation for:', bill.CM_Bill_Number);
      
      const response = await fetch(`/api/purchase-summary/bill/${bill.CM_Purchase_Summary_ID}/download?format=pdf`);
      
      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }
      
      const htmlContent = await response.text();
      console.log('HTML content received, length:', htmlContent.length);
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.background = 'white';
      tempDiv.style.padding = '20px';
      document.body.appendChild(tempDiv);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Converting to canvas...');
      
      const canvas = await html2canvas(tempDiv, {
        width: 840,
        height: tempDiv.scrollHeight + 40,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      document.body.removeChild(tempDiv);
      console.log('Canvas created, generating PDF...');
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      const margin = 10;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(`Bill: ${bill.CM_Bill_Number}`, margin, margin + 10);
      
      pdf.addImage(
        canvas.toDataURL('image/png', 0.95), 
        'PNG', 
        margin, 
        margin + 15, 
        imgWidth - (margin * 2), 
        Math.min(imgHeight, pageHeight - margin - 20)
      );
      
      heightLeft -= (pageHeight - margin - 20);
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png', 0.95), 
          'PNG', 
          margin, 
          position + margin, 
          imgWidth - (margin * 2), 
          Math.min(heightLeft, pageHeight - (margin * 2))
        );
        heightLeft -= (pageHeight - margin * 2);
      }
      
      const filename = `bill_${bill.CM_Bill_Number}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      console.log('PDF saved successfully:', filename);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(`Error generating PDF: ${error.message}`);
    }
  };

  // ADD: Toggle dropdown function
  const toggleDropdown = (billId, e) => {
    e.stopPropagation();
    setShowDropdown(prev => ({
      ...prev,
      [billId]: !prev[billId]
    }));
  };

  // ADD: Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown({});
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // MODIFIED: Check if any download is in progress for a specific bill
  const isDownloadLoading = (billId) => {
    return actionLoading[`download_${billId}_pdf`] || 
           actionLoading[`download_${billId}_txt`] || 
           actionLoading[`download_${billId}_csv`];
  };

  // Filter and sort bills
  const filteredAndSortedBills = allBills
    .filter(bill => {
      const matchesSearch = bill.CM_Bill_Number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (bill.CM_Supplier_ID && bill.CM_Supplier_ID.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
      
      if (filterStatus === 'all') return true;
      
      const status = getPaymentStatus(bill);
      return status.color === filterStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Handle numeric values
      if (['CM_Grand_Total', 'CM_Advance_Payment', 'CM_Balance_Payment'].includes(sortConfig.key)) {
        aVal = parseFloat(aVal || 0);
        bVal = parseFloat(bVal || 0);
      }
      
      // Handle dates
      if (['CM_Created_At', 'CM_Uploaded_At', 'CM_Delivery_Date'].includes(sortConfig.key)) {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBills = filteredAndSortedBills.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  if (!allBills || allBills.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bills Found</h3>
          <p className="text-gray-500">No bills are available in the system yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              All Bills ({filteredAndSortedBills.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">Manage and view all your purchase bills</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="green">Paid</option>
              <option value="yellow">Partial</option>
              <option value="red">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('CM_Bill_Number')}
              >
                <div className="flex items-center space-x-1">
                  <span>Bill Number</span>
                  {getSortIcon('CM_Bill_Number')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('CM_Grand_Total')}
              >
                <div className="flex items-center space-x-1">
                  <span>Total Amount</span>
                  {getSortIcon('CM_Grand_Total')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('CM_Advance_Payment')}
              >
                <div className="flex items-center space-x-1">
                  <span>Paid Amount</span>
                  {getSortIcon('CM_Advance_Payment')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('CM_Balance_Payment')}
              >
                <div className="flex items-center space-x-1">
                  <span>Balance Due</span>
                  {getSortIcon('CM_Balance_Payment')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('CM_Created_At')}
              >
                <div className="flex items-center space-x-1">
                  <span>Created Date</span>
                  {getSortIcon('CM_Created_At')}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedBills.map((bill) => {
              const status = getPaymentStatus(bill);
              const paymentPercentage = parseFloat(bill.CM_Grand_Total || 0) > 0 
                ? ((parseFloat(bill.CM_Advance_Payment || 0) / parseFloat(bill.CM_Grand_Total || 0)) * 100)
                : 0;
              
              return (
                <tr 
                  key={bill.CM_Purchase_Summary_ID}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onBillSelect(bill.CM_Bill_Number)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {bill.CM_Bill_Number}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {bill.CM_Purchase_Summary_ID}
                        </div>
                        {bill.CM_Supplier_ID && (
                          <div className="text-xs text-gray-500">
                            Supplier: {bill.CM_Supplier_ID}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(bill.CM_Grand_Total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Tax: {formatCurrency(bill.CM_Tax_Amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {bill.CM_Tax_Type} ({parseFloat(bill.CM_Tax_Percentage || 0).toFixed(1)}%)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(bill.CM_Advance_Payment)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(paymentPercentage)}% of total
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${
                      parseFloat(bill.CM_Balance_Payment || 0) <= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(bill.CM_Balance_Payment)}
                    </div>
                    {parseFloat(bill.CM_Balance_Payment || 0) > 0 && (
                      <div className="text-xs text-gray-500">
                        {Math.round(100 - paymentPercentage)}% remaining
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                        {status.text}
                      </span>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-500 ${
                            status.color === 'green' ? 'bg-green-500' :
                            status.color === 'yellow' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, paymentPercentage))}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {new Date(bill.CM_Created_At).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    {bill.CM_Delivery_Date && (
                      <div className="text-xs text-gray-400">
                        Delivery: {new Date(bill.CM_Delivery_Date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </div>
                    )}
                  </td>
                  {/* FIXED: Updated Actions Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end space-x-1">
                      {/* View Button */}
                      <button
                        onClick={() => handleView(bill)}
                        disabled={actionLoading[`view_${bill.CM_Purchase_Summary_ID}`]}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        title="View Bill"
                      >
                        {actionLoading[`view_${bill.CM_Purchase_Summary_ID}`] ? (
                          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                        <span className="ml-1">View</span>
                      </button>
                      
                      {/* FIXED: Download Dropdown - Now Always Enabled */}
                      <div className="relative">
                        <button
                          onClick={(e) => toggleDropdown(bill.CM_Purchase_Summary_ID, e)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                          title="Download Options"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="ml-1">Download</span>
                          <svg className="w-2 h-2 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showDropdown[bill.CM_Purchase_Summary_ID] && (
                          <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(bill, 'pdf');
                              }}
                              disabled={actionLoading[`download_${bill.CM_Purchase_Summary_ID}_pdf`]}
                              className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-t-md transition-colors disabled:opacity-50 disabled:bg-gray-100"
                            >
                              {actionLoading[`download_${bill.CM_Purchase_Summary_ID}_pdf`] ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                  PDF...
                                </span>
                              ) : (
                                '📄 PDF'
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(bill, 'txt');
                              }}
                              disabled={actionLoading[`download_${bill.CM_Purchase_Summary_ID}_txt`]}
                              className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:bg-gray-100"
                            >
                              {actionLoading[`download_${bill.CM_Purchase_Summary_ID}_txt`] ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                  TXT...
                                </span>
                              ) : (
                                '📝 TXT'
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(bill, 'csv');
                              }}
                              disabled={actionLoading[`download_${bill.CM_Purchase_Summary_ID}_csv`]}
                              className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-b-md transition-colors disabled:opacity-50 disabled:bg-gray-100"
                            >
                              {actionLoading[`download_${bill.CM_Purchase_Summary_ID}_csv`] ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                  CSV...
                                </span>
                              ) : (
                                '📊 CSV'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedBills.length)} of {filteredAndSortedBills.length} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm border rounded text-gray-600 ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
