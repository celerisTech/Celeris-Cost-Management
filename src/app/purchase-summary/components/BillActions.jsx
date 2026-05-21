'use client';

import { useState } from 'react';

export default function BillActions({ billData, onBillUpdated, onBillDeleted }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    view: false,
    download: false,
    delete: false
  });

  // Helper function to set loading state for specific actions
  const setLoading = (action, loading) => {
    setActionLoading(prev => ({ ...prev, [action]: loading }));
  };

  const handleView = async () => {
    setLoading('view', true);
    try {
      // Navigate to the dedicated bill view page
      const url = `/purchase-summary/bill/${billData.CM_Purchase_Summary_ID}/view`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening bill view:', error);
      alert('Error opening bill view');
    } finally {
      setLoading('view', false);
    }
  };

  const handleDownload = async (format = 'txt') => {
    setLoading('download', true);
    try {
      const response = await fetch(`/api/purchase-summary/bill/${billData.CM_Purchase_Summary_ID}/download?format=${format}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      // Get filename from response headers or create default
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
    } finally {
      setLoading('download', false);
    }
  };

  const handleDelete = async () => {
    setLoading('delete', true);
    try {
      const response = await fetch(`/api/purchase-summary/bill/${billData.CM_Purchase_Summary_ID}?_method=DELETE`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert('Bill deleted successfully!');
        onBillDeleted();
        setShowDeleteConfirm(false);
      } else {
        alert('Failed to delete bill: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Error deleting bill');
    } finally {
      setLoading('delete', false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getPaymentStatusInfo = () => {
    const status = billData.CM_Payment_Status;

    switch (status) {
      case 'Paid':
        return { text: 'Paid', color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'Partially Paid':
        return { text: 'Partially Paid', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      case 'Unpaid':
      default:
        return { text: 'Unpaid', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
  };

  const statusInfo = getPaymentStatusInfo();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        Bill Actions
      </h3>

      {/* Bill Summary Card */}
      <div className={`p-4 rounded-lg mb-4 ${statusInfo.bgColor}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-800">Current Status</span>
          <span className={`font-bold ${statusInfo.color}`}>{statusInfo.text}</span>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-semibold">{formatCurrency(billData.CM_Grand_Total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid Amount:</span>
            <span className="font-semibold text-green-600">{formatCurrency(billData.CM_Advance_Payment)}</span>
          </div>
          <div className="flex justify-between">
            <span>Balance Due:</span>
            <span className={`font-semibold ${parseFloat(billData.CM_Balance_Payment || 0) <= 0 ? 'text-green-600' : 'text-red-600'
              }`}>{formatCurrency(billData.CM_Balance_Payment)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* View Button */}
        <button
          onClick={handleView}
          disabled={actionLoading.view}
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionLoading.view ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Opening...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Bill Details
            </>
          )}
        </button>


        {/* Delete Button */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={actionLoading.delete}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Bill
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-red-800 text-sm font-medium">Confirm Deletion</p>
                  <p className="text-red-700 text-xs mt-1">This action cannot be undone. All data will be permanently deleted.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading.delete}
                className="px-3 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading.delete}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center"
              >
                {actionLoading.delete ? (
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
