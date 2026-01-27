'use client';

import { useState, useEffect } from 'react';
import BillSearch from './components/BillSearch';
import BillDetails from './components/BillDetails';
import PaymentHistory from './components/PaymentHistory';
import BillActions from './components/BillActions';
import AllBillsTable from './components/AllBillsTable';

export default function PurchaseSummaryPage() {
  const [billNumber, setBillNumber] = useState('');
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allBills, setAllBills] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch all bills for dropdown/suggestions
  useEffect(() => {
    fetchAllBills();
  }, [refreshTrigger]);

  const fetchAllBills = async () => {
    try {
      const response = await fetch('/api/purchase-summary/bills');
      const data = await response.json();
      if (data.success) {
        setAllBills(data.data);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchBillData = async (billNumOrId) => {
    if (!billNumOrId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/purchase-summary/bill/${encodeURIComponent(billNumOrId)}`);
      const data = await response.json();
      
      if (data.success) {
        setBillData(data.data);
      } else {
        setError(data.message || 'Bill not found');
        setBillData(null);
      }
    } catch (error) {
      console.error('Error fetching bill data:', error);
      setError('Error fetching bill data');
      setBillData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBillSearch = (selectedBillNumber) => {
    setBillNumber(selectedBillNumber);
    fetchBillData(selectedBillNumber);
    
    // Scroll to bill details if it exists
    setTimeout(() => {
      const billDetailsElement = document.getElementById('bill-details-section');
      if (billDetailsElement) {
        billDetailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleBillUpdated = () => {
    // Refresh bill data after update
    if (billNumber) {
      fetchBillData(billNumber);
    }
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBillDeleted = () => {
    // Clear data after deletion
    setBillData(null);
    setBillNumber('');
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Summary</h1>
              <p className="text-gray-600">
                Track bill payments and outstanding balances
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Bill Search Section */}
          <BillSearch
            billNumber={billNumber}
            onBillSearch={handleBillSearch}
            allBills={allBills}
            loading={loading}
          />

          {/* All Bills Table Section */}
          <AllBillsTable 
            allBills={allBills}
            onBillSelect={handleBillSearch}
            refreshTrigger={refreshTrigger}
          />

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bill Details Section */}
          {billData && (
            <div id="bill-details-section" className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="xl:col-span-2">
                <BillDetails
                  billData={billData}
                  onBillUpdated={handleBillUpdated}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Bill Actions */}
                <BillActions
                  billData={billData}
                  onBillUpdated={handleBillUpdated}
                  onBillDeleted={handleBillDeleted}
                />

                {/* Payment History */}
                <PaymentHistory
                  billData={billData}
                  onBillUpdated={handleBillUpdated}
                />
              </div>
            </div>
          )}

          {/* No Bill Selected State */}
          {!billData && !loading && !error && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Bill</h3>
              <p className="text-gray-500 mb-4">
                Search for a bill or select one from the table above to view its details and payment history.
              </p>
              <div className="flex justify-center space-x-4">
                <div className="text-sm text-gray-400">
                  • View bill details and payment status
                </div>
                <div className="text-sm text-gray-400">
                  • Add new payments
                </div>
                <div className="text-sm text-gray-400">
                  • Download bill documents
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading bill information...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-500">
              <p>Purchase Summary Management System</p>
              <p className="mt-1">Track and manage all your bill payments efficiently</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-6 text-sm">
                <div className="text-gray-400">
                  Total Bills: <span className="font-medium text-gray-600">{allBills.length}</span>
                </div>
                <div className="text-gray-400">
                  Last Updated: <span className="font-medium text-gray-600">
                    {allBills.length > 0 ? new Date().toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

