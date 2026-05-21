'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

export default function SelectedProducts({
  selectedProducts,
  onRemove,
  onAllocate,
  loading,
  hasExistingAllocations = false
}) {
  // ✅ Validation for missing item_id
  const validateProducts = useMemo(() => {
    if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
      return { valid: false, message: 'No products selected', missingIds: [] };
    }

    const missingIds = selectedProducts.filter(p => !p.item_id && !p.CM_Item_ID);

    if (missingIds.length > 0) {
      return {
        valid: false,
        message: `${missingIds.length} product(s) missing required identifier`,
        missingIds
      };
    }

    return { valid: true, message: '', missingIds: [] };
  }, [selectedProducts]);

  // ✅ Ensure products have unique _selectedKey
  const displayProducts = useMemo(() => {
    if (!Array.isArray(selectedProducts)) return [];

    return selectedProducts.map((product) => {
      const processed = {
        ...product,
        selected_quantity: product.CM_Quantity || 1,
        selection_timestamp: product.selection_timestamp || Date.now(),
        _selectedKey:
          product._selectedKey ||
          `selected-${product.CM_Product_ID || product.item_id || Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 5)}`,
      };

      if (!processed.item_id && !processed.CM_Item_ID) {
        console.warn('⚠️ Product missing item_id:', product);
      }

      // ✅ Ensure category and subcategory names exist
      processed.CM_Category_Name = product.CM_Category_Name || product.category_name || 'N/A';
      processed.CM_Subcategory_Name = product.CM_Subcategory_Name || product.subcategory_name || 'N/A';

      return processed;
    });
  }, [selectedProducts]);

  // ✅ Summary calculation
  const summary = useMemo(() => {
    const totalQuantity = displayProducts.reduce(
      (sum, p) => sum + parseInt(p.CM_Quantity || p.selected_quantity || 1),
      0
    );

    const totalValue = displayProducts.reduce((sum, p) => {
      const price = parseFloat(p.CM_Unit_Price || 0);
      const qty = parseInt(p.CM_Quantity || p.selected_quantity || 1);
      return sum + price * qty;
    }, 0);

    return {
      totalQuantity,
      totalValue,
      totalItems: displayProducts.length,
      uniqueItems: new Set(displayProducts.map(p => p.CM_Product_ID || p.item_id)).size,
    };
  }, [displayProducts]);

  const headerTitle = hasExistingAllocations
    ? `Additional Products Request (${summary.totalItems})`
    : `Selected Products (${summary.totalItems})`;

  const buttonText = hasExistingAllocations
    ? `Add ${summary.totalItems} Additional Product${summary.totalItems !== 1 ? 's' : ''}`
    : `Request ${summary.totalItems} Product${summary.totalItems !== 1 ? 's' : ''}`;

  const emptyMessage = hasExistingAllocations
    ? 'No additional products selected'
    : 'No products selected';

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);

  // ✅ Handle allocation with validation
  const handleAllocateClick = () => {
    if (!validateProducts.valid) {
      toast.error(validateProducts.message, {
        duration: 4000,
        style: {
          border: '1px solid #f87171',
          padding: '12px',
          borderRadius: '8px',
          background: '#fee2e2',
        },
        icon: '⚠️',
      });
      console.error('Products missing item_id:', validateProducts.missingIds);
      return;
    }

    const validated = displayProducts.filter(p => p.item_id || p.CM_Item_ID);
    onAllocate(validated);
  };

  // ✅ Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return displayProducts;

    const query = searchTerm.toLowerCase();
    return displayProducts.filter(p => {
      const name = (p.CM_Item_Name || p.CM_Product_Name || '').toLowerCase();
      const code = (p.CM_Item_Code || '').toLowerCase();
      const category = (p.CM_Category_Name || '').toLowerCase();
      return name.includes(query) || code.includes(query) || category.includes(query);
    });
  }, [displayProducts, searchTerm]);

  // ✅ Handle remove safely (prevent all deletion)
  const handleRemoveOne = (productToRemove) => {
    onRemove(productToRemove);
    toast.success(`Removed ${productToRemove.CM_Item_Name || 'product'} from selection`, {
      icon: '🗑️',
    });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-slate-100 transition-all duration-300">
      <h2 className={`text-lg sm:text-xl font-semibold mb-4 flex items-center ${hasExistingAllocations ? 'text-emerald-800' : 'text-slate-800'}`}>
        <svg className={`w-5 h-5 mr-2 ${hasExistingAllocations ? 'text-emerald-600' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {hasExistingAllocations ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
          )}
        </svg>
        {headerTitle}
      </h2>

      {summary.totalItems === 0 ? (
        <div className="text-center py-10 text-gray-600">
          <p className="text-lg font-medium">{emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* ✅ Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <div className="text-2xl font-bold text-indigo-800">{summary.uniqueItems}</div>
              <div className="text-xs font-medium text-indigo-600 uppercase">Unique Items</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-violet-50 border border-violet-100">
              <div className="text-2xl font-bold text-violet-800">{summary.totalQuantity}</div>
              <div className="text-xs font-medium text-violet-600 uppercase">Total Quantity</div>
            </div>
          </div>

          {/* ✅ Search */}
          {summary.totalItems > 3 && (
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="Search selected products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              )}
            </div>
          )}

          {/* ✅ Product List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-slate-50">
            {filteredProducts.map((product, index) => (
              <SelectedProductItem
                key={product._selectedKey}
                product={product}
                onRemove={handleRemoveOne}
                isAdditional={hasExistingAllocations}
                index={index}
              />
            ))}
          </div>

          {/* ✅ Action Buttons */}
          <div className="mt-5 border-t pt-4">
            <button
              onClick={handleAllocateClick}
              disabled={loading || summary.totalItems === 0 || !validateProducts.valid}
              className={`w-full py-3 rounded-lg font-medium text-white shadow-md transition-all duration-300
                ${hasExistingAllocations
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600'}
                disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed`}
            >
              {loading ? 'Processing...' : buttonText}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SelectedProductItem({ product, onRemove, isAdditional = false, index }) {
  const quantity = parseInt(product.CM_Quantity || product.selected_quantity || 1);
  const unitPrice = parseFloat(product.CM_Unit_Price || 0);
  const totalPrice = unitPrice * quantity;
  const itemName = product.CM_Item_Name || product.CM_Product_Name || 'Unknown Item';
  const itemCode = product.CM_Item_Code || 'N/A';
  const categoryName = product.CM_Category_Name || 'N/A';
  const subcategoryName = product.CM_Subcategory_Name || 'N/A';
  const hasValidId = product.item_id || product.CM_Item_ID;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

  return (
    <div className={`flex flex-col sm:flex-row justify-between p-3 rounded-lg border transition-all duration-200 
      ${!hasValidId
        ? 'bg-red-50 border-red-300'
        : isAdditional
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-1">
          <span className={`text-xs px-2 py-0.5 rounded mr-2 font-semibold ${!hasValidId ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
            #{index + 1}
          </span>
          <h4 className="font-medium text-gray-800 truncate">{itemName}</h4>
          {!hasValidId && <span className="ml-2 text-xs text-red-600 animate-pulse">Missing ID</span>}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <span>🏷️ {categoryName}</span>
          {subcategoryName && subcategoryName !== 'N/A' && <span>📦 {subcategoryName}</span>}
          <span>🔢 Code: {itemCode}</span>
          <span>📦 Qty: {quantity}</span>
          {unitPrice > 0 && <span>💰 {formatCurrency(totalPrice)}</span>}
        </div>
      </div>

      <button
        onClick={() => onRemove(product)}
        className="mt-2 sm:mt-0 ml-auto text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-full transition-all duration-200"
        title="Remove Product"
      >
        ✕
      </button>
    </div>
  );
}
