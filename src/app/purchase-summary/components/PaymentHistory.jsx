'use client';

import { useState, useEffect } from 'react';

export default function PaymentHistory({ billData, onBillUpdated }) {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    if (billData?.CM_Purchase_Summary_ID) {
      fetchPaymentHistory();
    }
  }, [billData]);

  const fetchPaymentHistory = async () => {
    if (!billData?.CM_Purchase_Summary_ID) return;
    
    setLoading(true);
    try {
      const url = `/api/purchase-summary/bill/${billData.CM_Purchase_Summary_ID}/payments`;
      console.log('Fetching payments from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Response is not JSON');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentHistory(data.data || []);
      } else {
        console.error('API returned error:', data.message);
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setPaymentHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    if (!billData?.CM_Purchase_Summary_ID) return;
    
    const paymentAmount = parseFloat(newPayment.amount);
    const balanceAmount = parseFloat(billData.CM_Balance_Payment || 0);
    
    if (paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    
    if (paymentAmount > balanceAmount) {
      alert(`Payment amount cannot exceed balance amount of ${formatCurrency(balanceAmount)}`);
      return;
    }
    
    setAddingPayment(true);
    
    try {
      const response = await fetch(`/api/purchase-summary/bill/${billData.CM_Purchase_Summary_ID}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentAmount,
          payment_date: newPayment.payment_date,
          payment_method: newPayment.payment_method,
          notes: newPayment.notes
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setShowAddPayment(false);
        setNewPayment({
          amount: '',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'cash',
          notes: ''
        });
        
        // Refresh payment history and bill data
        fetchPaymentHistory();
        if (onBillUpdated) {
          onBillUpdated();
        }
        
        alert('Payment added successfully!');
      } else {
        alert('Failed to add payment: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment. Please try again.');
    } finally {
      setAddingPayment(false);
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'bank':
      case 'bank transfer':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'cheque':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'upi':
        return (
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'advance payment':
      case 'initial':
        return (
          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
    }
  };

  const formatPaymentMethod = (method) => {
    switch (method?.toLowerCase()) {
      case 'advance payment':
      case 'initial':
        return 'Advance Payment';
      case 'bank':
        return 'Bank Transfer';
      case 'upi':
        return 'UPI';
      case 'card':
        return 'Credit/Debit Card';
      default:
        return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown';
    }
  };

  if (!billData) {
    return null;
  }

  const balanceAmount = parseFloat(billData.CM_Balance_Payment || 0);
  const hasBalance = balanceAmount > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          Payment History
        </h3>
        
        {hasBalance && (
          <button
            onClick={() => setShowAddPayment(!showAddPayment)}
            disabled={addingPayment}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAddPayment ? "M6 18L18 6M6 6l12 12" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
            </svg>
            {showAddPayment ? 'Cancel' : 'Add Payment'}
          </button>
        )}
      </div>

      {/* Add Payment Form */}
      {showAddPayment && hasBalance && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Payment</h4>
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  max={balanceAmount}
                  min="0.01"
                  step="0.01"
                  required
                  disabled={addingPayment}
                  className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder={`Max: ${formatCurrency(balanceAmount)}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available balance: {formatCurrency(balanceAmount)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={newPayment.payment_date}
                  onChange={(e) => setNewPayment({...newPayment, payment_date: e.target.value})}
                  required
                  disabled={addingPayment}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method *</label>
              <select
                value={newPayment.payment_method}
                onChange={(e) => setNewPayment({...newPayment, payment_method: e.target.value})}
                disabled={addingPayment}
                className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
                <option value="card">Credit/Debit Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                value={newPayment.notes}
                onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                rows={2}
                disabled={addingPayment}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Add any additional notes about this payment..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddPayment(false)}
                disabled={addingPayment}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingPayment}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {addingPayment ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading payment history...</p>
          </div>
        ) : paymentHistory.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">No payment history available</p>
            <p className="text-xs text-gray-400 mt-1">Payments will appear here once made</p>
          </div>
        ) : (
          paymentHistory.payments?.map((payment, index) => (
            <div key={payment.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-full">
                  {getPaymentMethodIcon(payment.paymentMethod)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">
                  {formatPaymentMethod(payment.paymentMethod)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {payment.status}
                </div>
              </div>
            </div>
          )) || 
          // Show initial payment if no additional payments
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white rounded-full">
                {getPaymentMethodIcon('advance payment')}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(billData.CM_Advance_Payment)}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(billData.CM_Created_At).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">
                Advance Payment
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Completed
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Total Paid</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(billData.CM_Advance_Payment)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Remaining</div>
            <div className={`text-lg font-bold ${
              balanceAmount <= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(balanceAmount)}
            </div>
          </div>
        </div>
        
        {/* Payment Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Payment Progress</span>
            <span>
              {Math.round(((parseFloat(billData.CM_Advance_Payment || 0) / parseFloat(billData.CM_Grand_Total || 1)) * 100))}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${Math.min(100, Math.max(0, 
                  ((parseFloat(billData.CM_Advance_Payment || 0) / parseFloat(billData.CM_Grand_Total || 1)) * 100)
                ))}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Payment Status Message */}
        <div className="mt-3 text-center">
          {balanceAmount <= 0 ? (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Bill Fully Paid
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {billData.CM_Payment_Status || 'Payment Pending'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
   


