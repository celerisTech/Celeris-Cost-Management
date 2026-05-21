'use client';

import { useState } from 'react';

export default function BillDetails({ billData, onBillUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const getPaymentStatus = () => {
    const status = billData.CM_Payment_Status || 'Unpaid';

    switch (status) {
      case 'Paid':
        return { text: 'Fully Paid', color: 'success', icon: 'check-circle' };
      case 'Partially Paid':
        return { text: 'Partially Paid', color: 'warning', icon: 'clock' };
      case 'Unpaid':
      default:
        return { text: 'Unpaid', color: 'danger', icon: 'x-circle' };
    }
  };

  const handleEdit = () => {
    setEditData({
      CM_Advance_Payment: billData.CM_Advance_Payment || 0,
      CM_Balance_Payment: billData.CM_Balance_Payment || 0,
      CM_Grand_Total: billData.CM_Grand_Total || 0,
      CM_Tax_Percentage: billData.CM_Tax_Percentage || 0,
      CM_Tax_Amount: billData.CM_Tax_Amount || 0,
      CM_Round_off: billData.CM_Round_off || 0,
      CM_Tax_Type: billData.CM_Tax_Type || 'GST',
      CM_Supplier_ID: billData.CM_Supplier_ID || '',
      CM_Company_ID: billData.CM_Company_ID || '',
      CM_Payment_Terms: billData.CM_Payment_Terms || '',
      CM_Delivery_Location: billData.CM_Delivery_Location || '',
      CM_Delivery_Date: billData.CM_Delivery_Date ? billData.CM_Delivery_Date.split('T')[0] : ''
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      // Validate data
      const grandTotal = parseFloat(editData.CM_Grand_Total);
      const advancePayment = parseFloat(editData.CM_Advance_Payment);
      const balancePayment = parseFloat(editData.CM_Balance_Payment);

      if (grandTotal <= 0) {
        alert('Grand total must be greater than 0');
        return;
      }

      if (advancePayment < 0) {
        alert('Advance payment cannot be negative');
        return;
      }

      if (balancePayment < 0) {
        alert('Balance payment cannot be negative');
        return;
      }

      if (Math.abs((advancePayment + balancePayment) - grandTotal) > 0.01) {
        alert('Advance payment + Balance payment should equal Grand total');
        return;
      }

      const response = await fetch(`/api/purchase-summary/bill/${billData.CM_Purchase_Summary_ID}?_method=PUT`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditing(false);
        onBillUpdated();
        alert('Bill updated successfully!');
      } else {
        alert('Failed to update bill: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating bill:', error);
      alert('Error updating bill');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const status = getPaymentStatus();
  const paymentPercentage = parseFloat(billData.CM_Grand_Total || 0) > 0
    ? ((parseFloat(billData.CM_Advance_Payment || 0) / parseFloat(billData.CM_Grand_Total || 0)) * 100)
    : 0;

  if (!billData) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Bill Details: {billData.CM_Bill_Number}
        </h2>

        <div className="flex items-center space-x-3">
          {/* Payment Status */}
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${status.color === 'success' ? 'bg-green-100 text-green-800 border-green-300' :
              status.color === 'warning' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                'bg-red-100 text-red-600 border-red-300'
            }`}>
            {status.icon === 'check-circle' && (
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {status.icon === 'x-circle' && (
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {status.icon === 'clock' && (
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            )}
            {status.text}
          </div>

          {/* Edit Button */}
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="text-gray-600 hover:text-gray-800 text-sm flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Bill Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Bill Amount */}
        <div className="border border-gray-200 p-4 rounded-lg hover:bg-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-full">
              <p className="text-gray-600 text-sm font-medium">Grand Total</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.CM_Grand_Total}
                  onChange={(e) => setEditData({ ...editData, CM_Grand_Total: e.target.value })}
                  className="w-full text-xl font-bold bg-white border-b-2 border-gray-300 focus:outline-none focus:border-gray-600 py-1"
                  step="0.01"
                  min="0"
                />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(billData.CM_Grand_Total)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Amount Paid */}
        <div className="border border-gray-200 p-4 rounded-lg hover:bg-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-full">
              <p className="text-gray-600 text-sm font-medium">Amount Paid</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.CM_Advance_Payment}
                  onChange={(e) => setEditData({ ...editData, CM_Advance_Payment: e.target.value })}
                  className="w-full text-xl font-bold bg-white border-b-2 border-gray-300 focus:outline-none focus:border-gray-600 py-1"
                  step="0.01"
                  min="0"
                />
              ) : (
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(billData.CM_Advance_Payment)}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Created: {new Date(billData.CM_Created_At).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Balance Amount */}
        <div className="border border-gray-200 p-4 rounded-lg hover:bg-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-full">
              <p className="text-gray-600 text-sm font-medium">Balance Amount</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.CM_Balance_Payment}
                  onChange={(e) => setEditData({ ...editData, CM_Balance_Payment: e.target.value })}
                  className="w-full text-xl font-bold bg-white border-b-2 border-gray-300 focus:outline-none focus:border-gray-600 py-1"
                  step="0.01"
                  min="0"
                />
              ) : (
                <p className={`text-2xl font-bold ${parseFloat(billData.CM_Balance_Payment || 0) <= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {formatCurrency(billData.CM_Balance_Payment)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="border border-gray-200 p-4 rounded-lg hover:bg-gray-100 ">
          <div className="w-full">
            <p className="text-gray-600 text-sm font-medium mb-2">Payment Progress</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, paymentPercentage))}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {Math.round(paymentPercentage)}% Complete
            </p>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {(billData.CM_Supplier_ID || billData.CM_Company_ID || billData.CM_Payment_Terms || billData.CM_Delivery_Location) && (
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier ID</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.CM_Supplier_ID}
                  onChange={(e) => setEditData({ ...editData, CM_Supplier_ID: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{billData.CM_Supplier_ID || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company ID</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.CM_Company_ID}
                  onChange={(e) => setEditData({ ...editData, CM_Company_ID: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{billData.CM_Company_ID || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.CM_Payment_Terms}
                  onChange={(e) => setEditData({ ...editData, CM_Payment_Terms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{billData.CM_Payment_Terms || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.CM_Delivery_Location}
                  onChange={(e) => setEditData({ ...editData, CM_Delivery_Location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{billData.CM_Delivery_Location || 'N/A'}</p>
              )}
            </div>

            {billData.CM_Delivery_Date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.CM_Delivery_Date}
                    onChange={(e) => setEditData({ ...editData, CM_Delivery_Date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">
                    {new Date(billData.CM_Delivery_Date).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tax & Other Details */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tax & Financial Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
            {isEditing ? (
              <select
                value={editData.CM_Tax_Type}
                onChange={(e) => setEditData({ ...editData, CM_Tax_Type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="GST">GST</option>
                <option value="CGST/SGST">CGST/SGST</option>
              </select>
            ) : (
              <p className="text-gray-900 font-medium">{billData.CM_Tax_Type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Percentage (%)</label>
            {isEditing ? (
              <input
                type="number"
                value={editData.CM_Tax_Percentage}
                onChange={(e) => setEditData({ ...editData, CM_Tax_Percentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                step="0.01"
                min="0"
                max="100"
              />
            ) : (
              <p className="text-gray-900 font-medium">{billData.CM_Tax_Percentage}%</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount</label>
            {isEditing ? (
              <input
                type="number"
                value={editData.CM_Tax_Amount}
                onChange={(e) => setEditData({ ...editData, CM_Tax_Amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                step="0.01"
                min="0"
              />
            ) : (
              <p className="text-gray-900 font-medium">{formatCurrency(billData.CM_Tax_Amount)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Round Off</label>
            {isEditing ? (
              <input
                type="number"
                value={editData.CM_Round_off}
                onChange={(e) => setEditData({ ...editData, CM_Round_off: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                step="0.01"
              />
            ) : (
              <p className="text-gray-900 font-medium">{formatCurrency(billData.CM_Round_off)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Action Buttons */}
      {isEditing && (
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleCancelEdit}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={saving}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors flex items-center disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Created: {new Date(billData.CM_Created_At).toLocaleString('en-IN')}</span>
            {billData.CM_Created_By && (
              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">by {billData.CM_Created_By}</span>
            )}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Updated: {new Date(billData.CM_Uploaded_At || billData.CM_Created_At).toLocaleString('en-IN')}</span>
            {billData.CM_Uploaded_By && (
              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">by {billData.CM_Uploaded_By}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
