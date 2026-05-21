'use client';

import { useMemo } from 'react';

export default function AllocationSummary({ 
  selectedProducts = [], 
  allocatedProducts = [], 
  summary = [],
  projectId,
  onRemoveProduct 
}) {
  
  // Calculate comprehensive summary based on updated database structure
  const calculatedSummary = useMemo(() => {
    // Process selected products (what user is about to allocate)
    const uniqueSelected = new Map();
    selectedProducts.forEach(product => {
      if (product?.CM_Product_ID && !uniqueSelected.has(product.CM_Product_ID)) {
        uniqueSelected.set(product.CM_Product_ID, product);
      }
    });
    
    const selectedArray = Array.from(uniqueSelected.values());
    
    const selectedSummary = {
      count: selectedArray.length,
      totalQuantity: selectedArray.reduce((sum, p) => sum + (parseInt(p.CM_Quantity) || 1), 0),
      totalValue: selectedArray.reduce((sum, p) => {
        const price = parseFloat(p.CM_Unit_Price) || 0;
        const qty = parseInt(p.CM_Quantity) || 1;
        return sum + (price * qty);
      }, 0),
      products: selectedArray
    };
    
    // Process allocated products (from ccms_project_products)
    const allocatedSummary = {
      count: allocatedProducts.length,
      totalValue: allocatedProducts.reduce((sum, p) => sum + parseFloat(p.CM_Total_Price || 0), 0),
      totalQuantity: allocatedProducts.reduce((sum, p) => sum + parseInt(p.CM_Quantity || 1), 0),
      products: allocatedProducts
    };
    
    // Process summary from API (allocation types breakdown)
    const summaryBreakdown = {
      byType: {},
      totalProducts: 0,
      totalValue: 0,
      totalQuantity: 0
    };
    
    if (Array.isArray(summary)) {
      summary.forEach(item => {
        summaryBreakdown.byType[item.CM_Alloceted_To] = {
          count: parseInt(item.count_by_type) || 0,
          value: parseFloat(item.total_value) || 0
        };
        summaryBreakdown.totalProducts += parseInt(item.count_by_type) || 0;
        summaryBreakdown.totalValue += parseFloat(item.total_value) || 0;
        summaryBreakdown.totalQuantity += parseInt(item.total_quantity) || 0;
      });
    }
    
    // Calculate grand totals for this project (current + selected)
    const grandTotal = {
      count: allocatedSummary.count + selectedSummary.count,
      totalQuantity: allocatedSummary.totalQuantity + selectedSummary.totalQuantity,
      totalValue: allocatedSummary.totalValue + selectedSummary.totalValue
    };
    
    return {
      selected: selectedSummary,
      allocated: allocatedSummary,
      summary: summaryBreakdown,
      grandTotal
    };
  }, [selectedProducts, allocatedProducts, summary]);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);
  };
  
  return (
    <div className="space-y-6">   
      {/* Already Allocated Products */}
      {calculatedSummary.allocated.count > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Allocated Products ({calculatedSummary.allocated.count})
            </h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center bg-white p-3 rounded-lg border border-blue-100 shadow-xs">
              <div className="text-xl font-bold text-blue-800 mb-1">{calculatedSummary.allocated.count}</div>
              <div className="text-xs text-blue-600 font-medium">Products</div>
            </div>
            <div className="text-center bg-white p-3 rounded-lg border border-blue-100 shadow-xs">
              <div className="text-xl font-bold text-blue-800 mb-1">{calculatedSummary.allocated.totalQuantity}</div>
              <div className="text-xs text-blue-600 font-medium">Quantity</div>
            </div>
            <div className="text-center bg-white p-3 rounded-lg border border-blue-100 shadow-xs">
              <div className="text-lg font-bold text-blue-800 mb-1">
                {formatCurrency(calculatedSummary.allocated.totalValue)}
              </div>
              <div className="text-xs text-blue-600 font-medium">Value</div>
            </div>
          </div>
          
          {/* Allocated Products Preview */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
            {calculatedSummary.allocated.products.slice(0, 5).map((product, index) => (
              <div key={`allocated-${product.CM_Product_ID}-${index}`} 
                   className="flex justify-between items-center text-sm bg-white p-3 rounded-lg border border-blue-50 shadow-xs hover:shadow-sm transition-all duration-200">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-blue-900 truncate mb-1">
                    {product.CM_Product_Name}
                  </div>
                  <div className="text-blue-600 text-xs flex flex-wrap gap-2">
                    <span className="bg-blue-50 px-2 py-1 rounded-full">{product.category_name}</span>
                    <span className="bg-blue-50 px-2 py-1 rounded-full">Qty: {product.CM_Quantity} {product.Unit_Type_Name}</span>
                  </div>
                  <div className="text-blue-500 text-xs mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(product.CM_Created_At).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <div className="text-right">
                    <div className="font-semibold text-blue-800 text-sm">
                      {formatCurrency(product.CM_Total_Price)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {calculatedSummary.allocated.products.length > 5 && (
              <div className="text-xs text-green-600 text-center py-2 bg-green-50 rounded-lg border border-green-100">
                +{calculatedSummary.allocated.products.length - 5} more allocated products...
              </div>
            )}
          </div>
        </div>
      )}
    
      {/* Empty State */}
      {calculatedSummary.selected.count === 0 && calculatedSummary.allocated.count === 0 && (
        <div className="bg-white p-8 rounded-xl border border-gray-100 text-center shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-4 6v4m-4-6v4m8-6v4" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">No Allocations Yet</h4>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
            Start by selecting a category and choosing products to allocate to Project 
          </p>
          <div className="w-12 h-1 bg-indigo-200 rounded-full mx-auto"></div>
        </div>
      )}
    </div>
  );
}