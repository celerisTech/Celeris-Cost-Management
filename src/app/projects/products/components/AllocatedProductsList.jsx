'use client';

import { useState } from 'react';

export default function AllocatedProductsList({ 
  allocatedProducts, 
  onRemove, 
  loading, 
  projectId,
  summary 
}) {
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN'),
      time: date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // Calculate totals from the actual data
  const totalValue = allocatedProducts.reduce((sum, product) => {
    return sum + (parseFloat(product.CM_Total_Price?.toString() || '0'));
  }, 0);

  const totalQuantity = allocatedProducts.reduce((sum, product) => {
    return sum + (parseInt(product.CM_Quantity?.toString() || '0'));
  }, 0);

  const uniqueCategories = [...new Set(allocatedProducts.map(p => p.category_name).filter(Boolean))];
  const uniqueAllocationType = [...new Set(allocatedProducts.map(p => p.CM_Alloceted_To).filter(Boolean))];

  const getUnitPrice = (product) => {
    const quantity = parseInt(product.CM_Quantity?.toString() || '0');
    const totalPrice = parseFloat(product.CM_Total_Price?.toString() || '0');
    return quantity > 0 ? totalPrice / quantity : 0;
  };

  const getAllocationTypeColor = (type) => {
    switch (type) {
      case 'Godown': return 'bg-blue-100 text-blue-800';
      case 'Department': return 'bg-green-100 text-green-800';
      case 'Order': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRemove = async (productId) => {
    if (confirmDelete === productId) {
      await onRemove(productId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(productId);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  if (allocatedProducts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1v6m6-6v6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Allocated</h3>
        <p className="text-gray-500">This project doesn&apos;t have any allocated products yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-0">
  {/* Header - Enhanced with more subtle gradient */}
  <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-5 border-b border-slate-200">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 flex items-center">
          <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Currently Allocated Products
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          Products allocated to Project #{projectId}
        </p>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-slate-800">
          {allocatedProducts.length}
        </div>
        <div className="text-slate-500 text-sm">Products</div>
      </div>
    </div>

    {/* Summary Stats - Better grid alignment */}
    <div className="grid grid-cols-4 gap-3 mt-5">
      <div className="text-center bg-white rounded-md p-3 shadow-sm border border-slate-100">
        <div className="text-lg font-bold text-slate-800">{totalQuantity}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">Total Items</div>
      </div>
      <div className="text-center bg-white rounded-md p-3 shadow-sm border border-slate-100">
        <div className="text-lg font-bold text-slate-800">{formatCurrency(totalValue)}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">Total Value</div>
      </div>
      <div className="text-center bg-white rounded-md p-3 shadow-sm border border-slate-100">
        <div className="text-lg font-bold text-slate-800">{uniqueCategories.length}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">Categories</div>
      </div>
      <div className="text-center bg-white rounded-md p-3 shadow-sm border border-slate-100">
        <div className="text-lg font-bold text-slate-800">{uniqueAllocationType.length}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">Allocation Types</div>
      </div>
    </div>
  </div>


      {/* Products List */}
      <div className="p-6">
        <div className="space-y-4">
          {allocatedProducts.map((product, index) => {
            const dateTime = formatDateTime(product.CM_Created_At);
            const unitPrice = getUnitPrice(product);
            const isExpanded = expandedProduct === product.CM_Product_ID;
            const isConfirmingDelete = confirmDelete === product.CM_Product_ID;
            
            return (
             <div
  key={`allocated-${product.CM_Product_ID}-${index}`}
  className={`border rounded-lg transition-all duration-200 ${
    isExpanded ? 'bg-slate-50 border-slate-300 shadow-md' : 'bg-white border-slate-200 hover:shadow-sm'
  }`}
>
  <div className="p-4">
    <div className="flex items-start">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1v6m6-6v6" />
        </svg>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-slate-900 text-base truncate">
            {product.CM_Product_Name}
          </h3>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getAllocationTypeColor(product.CM_Alloceted_To)}`}>
            {product.CM_Alloceted_To}
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-sm text-slate-600 mb-2">
          <div className="flex items-center">
            <span className="truncate">
              {product.category_name || 'N/A'}
              {product.subcategory_name && ` > ${product.subcategory_name}`}
            </span>
          </div>
          
          <div className="flex items-center">
            <span>Qty: {product.CM_Quantity} {product.CM_Unit_Type}</span>
          </div>
          
          <div className="flex items-center">
            <span>{dateTime.date}</span>
          </div>

          <div className="flex items-center">
            <span>{product.CM_Created_By}</span>
          </div>
        </div>

        <div className="text-right mt-2">
          <div className="text-lg font-bold text-slate-900">
            {formatCurrency(parseFloat(product.CM_Total_Price?.toString() || '0'))}
          </div>
          <div className="text-xs text-slate-500">
            {formatCurrency(unitPrice)} per {product.CM_Unit_Type}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={() => setExpandedProduct(isExpanded ? null : product.CM_Product_ID)}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <button
          onClick={() => handleRemove(product.CM_Product_ID)}
          disabled={loading}
          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
            isConfirmingDelete 
              ? 'text-red-600 bg-red-50 hover:bg-red-100' 
              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
          }`}
        >
          {isConfirmingDelete ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  </div>

                
                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-6 pt-4 border-t border-blue-200">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-4">Product Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Basic Information */}
                        <div>
                          <h5 className="font-medium text-gray-700 mb-3">Basic Information</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">Product ID:</span>
                              <p className="text-gray-900">{product.CM_Product_ID}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Category ID:</span>
                              <p className="text-gray-900">{product.CM_Category_ID || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Subcategory ID:</span>
                              <p className="text-gray-900">{product.CM_Subcategory_ID || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Allocation Details */}
                        <div>
                          <h5 className="font-medium text-gray-700 mb-3">Allocation Details</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">Allocated To:</span>
                              <p className="text-gray-900">{product.CM_Alloceted_To}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Supplier ID:</span>
                              <p className="text-gray-900">{product.CM_Supplier_ID || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Company ID:</span>
                              <p className="text-gray-900">{product.CM_Company_ID || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Timestamp Information */}
                        <div>
                          <h5 className="font-medium text-gray-700 mb-3">Allocation History</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">Allocated Date:</span>
                              <p className="text-gray-900">{dateTime.date}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Allocated Time:</span>
                              <p className="text-gray-900">{dateTime.time}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Allocated By:</span>
                              <p className="text-gray-900">{product.CM_Created_By}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Confirmation Message */}
                {isConfirmingDelete && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-red-800 text-sm">
                        Click the delete button again to confirm removal. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
