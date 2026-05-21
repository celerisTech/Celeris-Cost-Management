'use client';

import { useState, useEffect } from 'react';

export default function BillSearch({ billNumber, onBillSearch, allBills, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchType, setSearchType] = useState('all'); // 'all', 'bill', 'supplier'

  useEffect(() => {
    setSearchTerm(billNumber);
  }, [billNumber]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allBills.filter(bill => {
        const billNumber = bill.CM_Bill_Number?.toLowerCase() || '';
        const supplierID = bill.CM_Supplier_ID?.toLowerCase() || '';
        const companyID = bill.CM_Company_ID?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();

        switch (searchType) {
          case 'bill':
            return billNumber.includes(searchLower);
          case 'supplier':
            return supplierID.includes(searchLower) || companyID.includes(searchLower);
          case 'all':
          default:
            return billNumber.includes(searchLower) || 
                   supplierID.includes(searchLower) || 
                   companyID.includes(searchLower);
        }
      });
      setFilteredBills(filtered);
    } else {
      setFilteredBills([]);
    }
  }, [searchTerm, allBills, searchType]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (bill) => {
    setSearchTerm(bill.CM_Bill_Number);
    setShowSuggestions(false);
    onBillSearch(bill.CM_Bill_Number);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    
    // If search term matches exactly a bill number, use it directly
    const exactMatch = allBills.find(bill => 
      bill.CM_Bill_Number.toLowerCase() === searchTerm.toLowerCase()
    );
    
    if (exactMatch) {
      onBillSearch(exactMatch.CM_Bill_Number);
    } else if (filteredBills.length === 1) {
      // If only one result, select it automatically
      onBillSearch(filteredBills[0].CM_Bill_Number);
    } else if (filteredBills.length > 1) {
      // Multiple results - show the first one or let user select
      onBillSearch(filteredBills[0].CM_Bill_Number);
    } else {
      // Try to search with the term as is
      onBillSearch(searchTerm);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    setSearchType('all');
  };

  const getPaymentStatus = (bill) => {
    const status = bill.CM_Payment_Status || 'Unpaid';
    
    switch (status) {
      case 'Paid':
        return { text: 'Paid', color: 'green' };
      case 'Partially Paid':
        return { text: 'Partial', color: 'yellow' };
      case 'Unpaid':
      default:
        return { text: 'Unpaid', color: 'red' };
    }
  };

  const getMatchType = (bill, searchLower) => {
    const billNumber = bill.CM_Bill_Number?.toLowerCase() || '';
    const supplierID = bill.CM_Supplier_ID?.toLowerCase() || '';
    const companyID = bill.CM_Company_ID?.toLowerCase() || '';

    if (billNumber.includes(searchLower)) return 'Bill Number';
    if (supplierID.includes(searchLower)) return 'Supplier ID';
    if (companyID.includes(searchLower)) return 'Company ID';
    return 'Match';
  };

  // Enhanced statistics calculations
  const getStatistics = () => {
    if (allBills.length === 0) return null;

    const paidBills = allBills.filter(bill => bill.CM_Payment_Status === 'Paid');
    const partialPaidBills = allBills.filter(bill => bill.CM_Payment_Status === 'Partially Paid');
    const unpaidBills = allBills.filter(bill => bill.CM_Payment_Status === 'Unpaid');

    // Calculate totals
    const totalAmount = allBills.reduce((sum, bill) => sum + parseFloat(bill.CM_Grand_Total || 0), 0);
    const totalPaid = allBills.reduce((sum, bill) => sum + parseFloat(bill.CM_Advance_Payment || 0), 0);
    const totalPending = allBills.reduce((sum, bill) => sum + parseFloat(bill.CM_Balance_Payment || 0), 0);
    const totalTax = allBills.reduce((sum, bill) => sum + parseFloat(bill.CM_Tax_Amount || 0), 0);

    // Calculate percentages
    const paidPercentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

    // Get recent bills (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentBills = allBills.filter(bill => 
      new Date(bill.CM_Created_At) >= sevenDaysAgo
    );

    return {
      paidBills: paidBills.length,
      partialPaidBills: partialPaidBills.length,
      unpaidBills: unpaidBills.length,
      totalAmount,
      totalPaid,
      totalPending,
      totalTax,
      paidPercentage,
      recentBills: recentBills.length,
      averageBillAmount: totalAmount / allBills.length
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = getStatistics();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search Bills
        </h2>
        <div className="text-lg font-bold text-blue-800">
          {allBills.length} bills available
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Input Section */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by Bill Number, Supplier ID, or Company ID
          </label>
          
          {/* Search Type Filter */}
          <div className="flex space-x-2 mb-3">
            <button
              type="button"
              onClick={() => setSearchType('all')}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                searchType === 'all' 
                  ? 'bg-blue-100 text-blue-800 border-blue-300' 
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
            >
              All Fields
            </button>
            <button
              type="button"
              onClick={() => setSearchType('bill')}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                searchType === 'bill' 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
            >
              Bill Number
            </button>
            <button
              type="button"
              onClick={() => setSearchType('supplier')}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                searchType === 'supplier' 
                  ? 'bg-purple-100 text-purple-800 border-purple-300' 
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
            >
              Supplier/Company
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(true)}
              placeholder={
                searchType === 'bill' ? "Enter bill number..." :
                searchType === 'supplier' ? "Enter supplier ID or company ID..." :
                "Enter bill number, supplier ID, or company ID..."
              }
              className="w-full px-4 py-3 pr-12 border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
            
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-gray-600 mr-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* Search Results Count */}
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-500">
              {filteredBills.length} {filteredBills.length === 1 ? 'result' : 'results'} found
              {filteredBills.length > 10 && ' (showing first 10)'}
            </div>
          )}

          {/* Enhanced Suggestions Dropdown */}
          {showSuggestions && filteredBills.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-auto">
              {filteredBills.slice(0, 10).map((bill) => {
                const status = getPaymentStatus(bill);
                const matchType = getMatchType(bill, searchTerm.toLowerCase());
                
                return (
                  <div
                    key={bill.CM_Purchase_Summary_ID}
                    onClick={() => handleSuggestionClick(bill)}
                    className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="font-medium text-gray-900">
                            {bill.CM_Bill_Number}
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {matchType}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="text-gray-500">Amount:</span> ₹{parseFloat(bill.CM_Grand_Total || 0).toLocaleString('en-IN')}
                          </div>
                          <div>
                            <span className="text-gray-500">Date:</span> {new Date(bill.CM_Created_At).toLocaleDateString('en-IN')}
                          </div>
                          {bill.CM_Supplier_ID && (
                            <div>
                              <span className="text-gray-500">Supplier:</span> {bill.CM_Supplier_ID}
                            </div>
                          )}
                          {bill.CM_Company_ID && (
                            <div>
                              <span className="text-gray-500">Company:</span> {bill.CM_Company_ID}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 text-xs rounded-full border ${
                          status.color === 'green' ? 'bg-green-100 text-green-800 border-green-300' :
                          status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                          'bg-red-100 text-red-600 border-red-300'
                        }`}>
                          {status.text}
                        </span>
                        
                        {/* Payment Progress Bar */}
                        <div className="w-16 bg-gray-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full ${
                              status.color === 'green' ? 'bg-green-500' :
                              status.color === 'yellow' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, Math.max(0, 
                                ((parseFloat(bill.CM_Advance_Payment || 0) / parseFloat(bill.CM_Grand_Total || 1)) * 100)
                              ))}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredBills.length > 10 && (
                <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                  {filteredBills.length - 10} more results available. Continue typing to narrow down.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search {filteredBills.length > 0 && `(${filteredBills.length})`}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Enhanced Quick Overview */}
      {stats && (
        <div className="mt-8 space-y-6">
          {/* Payment Status Overview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Payment Status Overview</h3>
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {allBills.length} Total Bills
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-white p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="text-xl font-bold text-green-600">{stats.paidBills}</div>
                <div className="text-xs text-gray-600 mb-1">Paid Bills</div>
                <div className="text-xs text-gray-500">
                  {((stats.paidBills / allBills.length) * 100).toFixed(0)}%
                </div>
              </div>
              
              <div className="text-center bg-white p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="text-xl font-bold text-yellow-600">{stats.partialPaidBills}</div>
                <div className="text-xs text-gray-600 mb-1">Partial Paid</div>
                <div className="text-xs text-gray-500">
                  {((stats.partialPaidBills / allBills.length) * 100).toFixed(0)}%
                </div>
              </div>
              
              <div className="text-center bg-white p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="text-xl font-bold text-red-600">{stats.unpaidBills}</div>
                <div className="text-xs text-gray-600 mb-1">Unpaid Bills</div>
                <div className="text-xs text-gray-500">
                  {((stats.unpaidBills / allBills.length) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Financial Overview</h3>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-md border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="text-sm font-bold text-gray-800">
                  {formatCurrency(stats.totalAmount)}
                </div>
                <div className="text-xs text-gray-600">Total Amount</div>
              </div>
              
              <div className="bg-white p-3 rounded-md border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="text-sm font-bold text-green-600">
                  {formatCurrency(stats.totalPaid)}
                </div>
                <div className="text-xs text-gray-600">Amount Paid</div>
              </div>
              
              <div className="bg-white p-3 rounded-md border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="text-sm font-bold text-red-600">
                  {formatCurrency(stats.totalPending)}
                </div>
                <div className="text-xs text-gray-600">Pending Amount</div>
              </div>
              
              <div className="bg-white p-3 rounded-md border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="text-sm font-bold text-blue-600">
                  {formatCurrency(stats.totalTax)}
                </div>
                <div className="text-xs text-gray-600">Total Tax</div>
              </div>
            </div>

            {/* Payment Progress Bar */}
            <div className="mt-4 bg-white p-3 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700">Overall Payment Progress</span>
                <span className="text-xs font-bold text-gray-800">{stats.paidPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.paidPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Paid: {formatCurrency(stats.totalPaid)}</span>
                <span>Pending: {formatCurrency(stats.totalPending)}</span>
              </div>
            </div>
          </div>

          {/* Additional Insights */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Insights</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-md border border-gray-200 flex items-center hover:shadow-sm transition-shadow">
                <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-sm font-bold text-gray-800">{stats.recentBills}</div>
                  <div className="text-xs text-gray-600">Bills (Last 7 days)</div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-md border border-gray-200 flex items-center hover:shadow-sm transition-shadow">
                <svg className="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="text-sm font-bold text-gray-800">
                    {formatCurrency(stats.averageBillAmount)}
                  </div>
                  <div className="text-xs text-gray-600">Average Bill Amount</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
