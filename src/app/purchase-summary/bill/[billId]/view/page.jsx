'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function BillViewPage() {
  const params = useParams();
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params.billId) {
      fetchBillData();
    }
  }, [params.billId]);

  const fetchBillData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/purchase-summary/bill/${params.billId}`);
      const data = await response.json();
      
      if (data.success) {
        setBillData(data.data);
      } else {
        setError(data.message || 'Bill not found');
      }
    } catch (error) {
      console.error('Error fetching bill:', error);
      setError('Error fetching bill data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(parseFloat(amount || 0));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownload = async (format = 'txt') => {
    try {
      const response = await fetch(`/api/purchase-summary/bill/${params.billId}/download?format=${format}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `bill_${billData.CM_Bill_Number}.${format}`;
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
    } catch (error) {
      console.error('Error downloading bill:', error);
      alert('Error downloading bill');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading bill details...</p>
        </div>
      </div>
    );
  }

  if (error || !billData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm border text-center max-w-md">
          <div className="text-red-500 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Bill Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const paymentPercentage = Math.round(
    (parseFloat(billData.CM_Advance_Payment || 0) / parseFloat(billData.CM_Grand_Total || 1)) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Bill #{billData.CM_Bill_Number}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span>ID: {billData.CM_Purchase_Summary_ID}</span>
                {billData.CM_Supplier_ID && <span>Supplier: {billData.CM_Supplier_ID}</span>}
              </div>
            </div>
            
            <div className="mt-4 md:mt-0">
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
                billData.CM_Payment_Status === 'Paid' ? 'bg-green-100 text-green-800' :
                billData.CM_Payment_Status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {billData.CM_Payment_Status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Bill Information */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-5 py-3 border-b">
                <h2 className="font-semibold text-gray-900">Bill Information</h2>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Bill Number</label>
                      <p className="text-gray-900 font-medium">
                        {billData.CM_Bill_Number}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Purchase Summary ID</label>
                      <p className="text-gray-900">
                        {billData.CM_Purchase_Summary_ID}
                      </p>
                    </div>
                    
                    {billData.CM_Supplier_ID && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Supplier ID</label>
                        <p className="text-gray-900">
                          {billData.CM_Supplier_ID}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Payment Status</label>
                      <p className="text-gray-900 font-medium">
                        {billData.CM_Payment_Status}
                      </p>
                    </div>
                    
                    {billData.CM_Payment_Terms && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Payment Terms</label>
                        <p className="text-gray-900">
                          {billData.CM_Payment_Terms}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Created Date</label>
                      <p className="text-gray-900">
                        {formatDate(billData.CM_Created_At)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-5 py-3 border-b">
                <h2 className="font-semibold text-gray-900">Financial Details</h2>
              </div>
              
              <div className="p-5">
                {/* Amount Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded border border-blue-100">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-700 mb-1">
                        {formatCurrency(billData.CM_Grand_Total)}
                      </div>
                      <div className="text-blue-600 text-sm">Grand Total</div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded border border-green-100">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-700 mb-1">
                        {formatCurrency(billData.CM_Advance_Payment)}
                      </div>
                      <div className="text-green-600 text-sm">Amount Paid</div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded border border-red-100">
                    <div className="text-center">
                      <div className={`text-xl font-bold mb-1 ${
                        parseFloat(billData.CM_Balance_Payment || 0) <= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(billData.CM_Balance_Payment)}
                      </div>
                      <div className="text-red-600 text-sm">Balance Due</div>
                    </div>
                  </div>
                </div>

                {/* Payment Progress */}
                <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Payment Progress</span>
                    <span className="text-sm font-bold text-gray-900">{paymentPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${
                        paymentPercentage === 100 ? 'bg-green-500' :
                        paymentPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${paymentPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Tax Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tax Type</label>
                    <p className="text-gray-900 text-sm font-medium">
                      {billData.CM_Tax_Type}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tax %</label>
                    <p className="text-gray-900 text-sm font-medium">
                      {parseFloat(billData.CM_Tax_Percentage || 0).toFixed(2)}%
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tax Amount</label>
                    <p className="text-gray-900 text-sm font-medium">
                      {formatCurrency(billData.CM_Tax_Amount)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Round Off</label>
                    <p className="text-gray-900 text-sm font-medium">
                      {formatCurrency(billData.CM_Round_off)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            {(billData.CM_Delivery_Location || billData.CM_Delivery_Date) && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-5 py-3 border-b">
                  <h2 className="font-semibold text-gray-900">Delivery Information</h2>
                </div>
                
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {billData.CM_Delivery_Location && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Delivery Location</label>
                        <p className="text-gray-900">
                          {billData.CM_Delivery_Location}
                        </p>
                      </div>
                    )}
                    
                    {billData.CM_Delivery_Date && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Delivery Date</label>
                        <p className="text-gray-900">
                          {formatDate(billData.CM_Delivery_Date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-5 py-3 border-b">
                <h3 className="font-semibold text-gray-900">Actions</h3>
              </div>
              
              <div className="p-4 space-y-3">
                <button
                  onClick={() => window.location.href = `/purchase-summary`}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Back to Bills
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-5 py-3 border-b">
                <h3 className="font-semibold text-gray-900">Summary</h3>
              </div>
              
              <div className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-gray-900">{billData.CM_Payment_Status}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(billData.CM_Grand_Total)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-green-600">{formatCurrency(billData.CM_Advance_Payment)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance:</span>
                    <span className={`font-medium ${
                      parseFloat(billData.CM_Balance_Payment || 0) <= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>{formatCurrency(billData.CM_Balance_Payment)}</span>
                  </div>
                  
                  <hr className="my-2 border-gray-200" />
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax Amount:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(billData.CM_Tax_Amount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium text-blue-600">{paymentPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-5 py-3 border-b">
                <h3 className="font-semibold text-gray-900">Timestamps</h3>
              </div>
              
              <div className="p-4">
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-500 mb-1">Created</label>
                    <p className="text-gray-900">
                      {formatDate(billData.CM_Created_At)}
                    </p>
                    {billData.CM_Created_By && (
                      <p className="text-gray-500 mt-1">by {billData.CM_Created_By}</p>
                    )}
                  </div>
                  
                  {billData.CM_Uploaded_At && (
                    <div>
                      <label className="block text-gray-500 mb-1">Last Updated</label>
                      <p className="text-gray-900">
                        {formatDate(billData.CM_Uploaded_At)}
                      </p>
                      {billData.CM_Uploaded_By && (
                        <p className="text-gray-500 mt-1">by {billData.CM_Uploaded_By}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { 
            background: white !important;
          }
          .container {
            margin: 0 !important;
            padding: 0 !important;
          }
          button {
            display: none !important;
          }
          .shadow-sm {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}