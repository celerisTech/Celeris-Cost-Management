// src/app/projects/products/components/ProductList.jsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import React from 'react';
import toast from 'react-hot-toast';

export default function ProductList({
  category,
  subcategory,
  company,
  godown,
  searchTerm,
  onProductSelect,
  selectedProducts = [] }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [error, setError] = useState(null);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, price, stock, code
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  useEffect(() => {
    // Add subcategory to the condition
    if (category || subcategory || company || searchTerm) {
      fetchProducts();
    } else {
      setProducts([]);
      setQuantities({});
      setError(null);
    }
  }, [category, subcategory, company, godown, searchTerm]);

  // Validate product data when products change
  useEffect(() => {
    if (products.length > 0) {
      const missingItemId = products.filter(p => !p.CM_Item_ID && !p.item_id);
      if (missingItemId.length > 0) {
        console.warn('⚠️ Found products missing item_id:', missingItemId);
      }
    }
  }, [products]);

  // In ProductList.jsx
  // Make sure the filteredAndSortedProducts useMemo is properly defined 
  // BEFORE being referenced in your component

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Apply local search filter
    if (localSearchTerm.trim()) {
      const searchLower = localSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const itemName = (product.CM_Item_Name || product.item_name || '').toLowerCase();
        const itemCode = (product.CM_Item_Code || product.item_code || '').toLowerCase();
        const categoryName = (product.CM_Category_Name || '').toLowerCase();
        const subcategoryName = (product.CM_Subcategory_Name || '').toLowerCase();

        return itemName.includes(searchLower) ||
          itemCode.includes(searchLower) ||
          categoryName.includes(searchLower) ||
          subcategoryName.includes(searchLower);
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = (a.CM_Item_Name || a.item_name || '').toLowerCase();
          bValue = (b.CM_Item_Name || b.item_name || '').toLowerCase();
          break;
        case 'code':
          aValue = (a.CM_Item_Code || a.item_code || '').toLowerCase();
          bValue = (b.CM_Item_Code || b.item_code || '').toLowerCase();
          break;
        case 'price':
          aValue = parseFloat(a.CM_Unit_Price || 0);
          bValue = parseFloat(b.CM_Unit_Price || 0);
          break;
        case 'stock':
          aValue = parseInt(a.available_stock || 0);
          bValue = parseInt(b.available_stock || 0);
          break;
        default:
          aValue = (a.CM_Item_Name || a.item_name || '').toLowerCase();
          bValue = (b.CM_Item_Name || b.item_name || '').toLowerCase();
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [products, localSearchTerm, sortBy, sortOrder]);


  const productsWithStock = useMemo(() => {
    return filteredAndSortedProducts.map(product => {
      const productId = product.CM_Product_ID;
      const itemId = product.CM_Item_ID || product.item_id;
      const availableStock = product.available_quantity;

      const selectedProduct = selectedProducts.find(p =>
        (p.CM_Item_ID === itemId) || (p.item_id === itemId)
      );

      const currentlySelected = selectedProduct ? parseInt(selectedProduct.CM_Quantity || selectedProduct.quantity) || 0 : 0;

      return {
        ...product,
        item_id: itemId,
        CM_Item_ID: itemId,
        current_available_stock: availableStock,
        currently_selected: currentlySelected,
        available_for_selection: Math.max(0, availableStock - currentlySelected),
        is_out_of_stock: availableStock <= 0,
        is_low_stock: availableStock > 0 && availableStock <= 5
      };
    });
  }, [filteredAndSortedProducts, selectedProducts]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Add better logging to see what filters are being applied
      console.log('Current filters:', {
        category: category?.CM_Category_ID,
        subcategory: subcategory?.CM_Subcategory_ID,
        company: company?.CM_Company_ID,
        godown: godown?.CM_Godown_ID,
        searchTerm
      });

      if (category?.CM_Category_ID) {
        params.append('categoryId', category.CM_Category_ID);
      }
      if (subcategory?.CM_Subcategory_ID) {
        params.append('subcategoryId', subcategory.CM_Subcategory_ID);
      }
      if (company?.CM_Company_ID) {
        params.append('companyId', company.CM_Company_ID);
      }
      if (godown?.CM_Godown_ID) {
        params.append('godownId', godown.CM_Godown_ID);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const url = `/api/products/allocate?${params.toString()}`;
      console.log('Fetching products from:', url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Products API response:', data);

      if (data.success) {
        const rawProducts = data.data?.products || [];

        const processedProducts = rawProducts.map((product, index) => {
          const itemId = product.CM_Item_ID || product.item_id;

          if (!itemId) {
            console.warn(`⚠️ Product at index ${index} has no item_id or CM_Item_ID:`, product);
          }

          return {
            ...product,
            _uniqueId: `${itemId || index}-${index}`,
            available_quantity: parseInt(product.available_stock) || 0,
            original_purchase_quantity: parseInt(product.purchase_quantity) || 0,
            total_allocated: parseInt(product.total_allocated) || 0,
            item_total_stock: parseInt(product.item_total_stock) || 0,
            unit_price: parseFloat(product.CM_Unit_Price) || 0,
            item_id: itemId,
            CM_Item_ID: itemId,
            item_code: product.CM_Item_Code || product.item_code,
            CM_Item_Code: product.CM_Item_Code || product.item_code,
            item_name: product.CM_Item_Name || product.item_name,
            CM_Item_Name: product.CM_Item_Name || product.item_name,
            godown_name: product.CM_Godown_Name || product.godown_name,
            stock_status: product.stock_status,
            Item_Unit_Name: product.Item_Unit_Name || product.unit_type || 'Unit',
            unit_type: product.Item_Unit_Name || product.unit_type || 'Unit'
          };
        });

        setProducts(processedProducts);

        const initialQuantities = {};
        processedProducts.forEach(product => {
          if (product.item_id) {
            initialQuantities[product.item_id] = 1;
          }
        });
        setQuantities(initialQuantities);

      } else {
        setError(data.message || 'Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Network error while fetching products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setLocalSearchTerm(e.target.value);
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const clearSearch = () => {
    setLocalSearchTerm('');
  };

  const isProductSelected = useCallback((product) => {
    const itemId = product.CM_Item_ID || product.item_id;
    if (!itemId) return false;

    return selectedProducts.some(p =>
      (p.CM_Item_ID === itemId) || (p.item_id === itemId)
    );
  }, [selectedProducts]);

  const handleProductToggle = useCallback((product) => {
    const isSelected = isProductSelected(product);
    const itemId = product.CM_Item_ID || product.item_id;

    if (!itemId) {
      toast.error('❌ This product is missing a required identifier and cannot be selected.', {
        duration: 3000,
      });
      return;
    }

    const quantity = quantities[itemId] || 1;

    if (!isSelected && product.is_out_of_stock) {
      toast.error('❌ This product is out of stock and cannot be selected.', {
        duration: 3000,
      });
      return;
    }

    if (!isSelected && quantity > product.available_for_selection) {
      toast.error(`⚠️ Only ${product.available_for_selection} ${product.Item_Unit_Name} available for selection.`, {
        duration: 3000,
      });
      return;
    }

    const productForSelection = {
      ...product,
      quantity: quantity,
      CM_Quantity: quantity,
      selected_quantity: quantity,
    };

    if (!isSelected) {
      const exists = selectedProducts.some(p =>
        (p.item_id === itemId || p.CM_Item_ID === itemId)
      );

      if (exists) {
        toast.success(`Updated quantity for ${product.item_name}`, {
          duration: 1500,
          icon: '🔄',
        });
      } else {
        toast.success(`Added ${product.item_name} to selection`, {
          duration: 1500,
          icon: '✅',
        });
      }
    }

    onProductSelect(productForSelection, !isSelected);
  }, [isProductSelected, quantities, onProductSelect, selectedProducts]);

  const handleQuantityChange = useCallback((productId, newQuantity) => {
    const product = productsWithStock.find(p =>
      (p.CM_Item_ID === productId) || (p.item_id === productId)
    );

    if (!product) {
      console.error(`Product not found with ID: ${productId}`);
      return;
    }

    const parsedQty = parseInt(newQuantity, 10) || 1;
    const maxQuantity = product.current_available_stock;

    if (isNaN(parsedQty) || parsedQty < 1) {
      toast.error("❌ Quantity must be at least 1.", {
        duration: 2000,
      });
      return;
    }

    if (parsedQty > maxQuantity) {
      toast.error(`⚠️ Only ${maxQuantity} ${product.Item_Unit_Name} available.`, {
        duration: 2000,
      });
      return;
    }

    const validQuantity = Math.min(Math.max(1, parsedQty), maxQuantity);
    const itemId = product.CM_Item_ID || product.item_id;

    if (!itemId) {
      toast.error('❌ Product is missing a required identifier.', {
        duration: 2000,
      });
      return;
    }

    setQuantities(prev => ({
      ...prev,
      [itemId]: validQuantity
    }));

    if (isProductSelected(product)) {
      const updatedProduct = {
        ...product,
        CM_Quantity: validQuantity,
        selected_quantity: validQuantity,
        quantity: validQuantity
      };

      onProductSelect(updatedProduct, true);
    }
  }, [productsWithStock, isProductSelected, onProductSelect]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Products</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchProducts}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border-0">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-slate-800">
          Available Products for Allocation
        </h2>
        <div className="flex items-center space-x-2 text-sm">
          <span className="bg-slate-100 px-3 py-1 rounded-md text-slate-700 font-medium">
            {productsWithStock.length} available
          </span>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md font-medium">
            {selectedProducts.length} selected
          </span>
          <button
            onClick={fetchProducts}
            className="bg-white text-slate-600 border border-slate-200 px-3 py-1 rounded-md hover:bg-slate-50 transition-all flex items-center"
            title="Refresh stock"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>


      {/* Search and Sort Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search products by name, code, category..."
            value={localSearchTerm}
            onChange={handleSearchChange}
            className="block text-black w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
          {localSearchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
            Sort by:
          </span>
          {[
            { key: 'name', label: 'Name' },
            { key: 'code', label: 'Code' },
            { key: 'price', label: 'Price' },
            { key: 'stock', label: 'Stock' }
          ].map((sortOption) => (
            <button
              key={sortOption.key}
              onClick={() => handleSortChange(sortOption.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${sortBy === sortOption.key
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
            >
              {sortOption.label}
              {sortBy === sortOption.key && (
                <span className="ml-1">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Results Info */}
        {localSearchTerm && (
          <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <span>
              Showing {productsWithStock.length} of {products.length} products
              {localSearchTerm && ` for "${localSearchTerm}"`}
            </span>
            {productsWithStock.length === 0 && products.length > 0 && (
              <button
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-800 font-medium underline text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {productsWithStock.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1v6m6-6v6" />
          </svg>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {localSearchTerm ? 'No Products Found' : 'No Products Available'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {localSearchTerm
              ? `No products found matching "${localSearchTerm}". Try different search terms.`
              : category || company || searchTerm
                ? 'No available stock found with the current filters.'
                : 'Select filters to view available products for allocation.'
            }
          </p>
          {localSearchTerm && (
            <button
              onClick={clearSearch}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 -mr-2">
          {productsWithStock.map((product) => (
            <ProductItem
              key={product._uniqueId}
              product={product}
              isSelected={isProductSelected(product)}
              quantity={quantities[product.CM_Item_ID || product.item_id] || 1}
              onToggle={() => handleProductToggle(product)}
              onQuantityChange={(newQuantity) => handleQuantityChange(product.CM_Item_ID || product.item_id, newQuantity)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ProductItem component remains the same as in your original code
const ProductItem = React.memo(function ProductItem({
  product,
  isSelected,
  quantity,
  onToggle,
  onQuantityChange
}) {
  const [showBatches, setShowBatches] = useState(false);
  const availableStock = product.current_available_stock;
  const maxQuantity = availableStock;
  const isOutOfStock = product.is_out_of_stock;
  const isLowStock = product.is_low_stock;
  const hasMissingId = !product.item_id && !product.CM_Item_ID;
  const hasBatches = product.batches && product.batches.length > 0;

  const getStockStatusColor = () => {
    if (hasMissingId) return 'bg-red-100 text-red-800 border-red-200';
    if (isOutOfStock) return 'bg-red-100 text-red-800 border-red-200';
    if (isLowStock) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStockStatusText = () => {
    if (hasMissingId) return 'Missing ID';
    if (isOutOfStock) return 'Out of Stock';
    if (isLowStock) return 'Low Stock';
    return 'In Stock';
  };

  const handleSafeQuantityChange = (newQty) => {
    if (hasMissingId) {
      toast.error('❌ This product is missing a required identifier.', {
        style: { border: '1px solid #f87171', padding: '8px', borderRadius: '8px' },
        icon: '🚫',
      });
      return;
    }

    const parsedQty = parseInt(newQty, 10) || 1;

    if (isOutOfStock) {
      toast.error('❌ This product is out of stock and cannot be selected.', {
        style: { border: '1px solid #f87171', padding: '8px', borderRadius: '8px' },
        icon: '🚫',
      });
      return;
    }

    if (parsedQty > maxQuantity) {
      toast.error(
        `Only ${maxQuantity} ${product.Item_Unit_Name} available. You cannot select more than the available stock.`,
        {
          style: { border: '2px solid #d6b315ff', padding: '8px', borderRadius: '8px' },
          icon: '⚠️',
        }
      );
      onQuantityChange(maxQuantity);
      return;
    }

    if (parsedQty < 1) {
      toast.error('❌ Quantity must be at least 1.', {
        style: { border: '1px solid #f87171', padding: '8px', borderRadius: '8px' },
        icon: '❌',
      });
      onQuantityChange(1);
      return;
    }

    onQuantityChange(parsedQty);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Allow empty input temporarily for better UX
    if (value === '') {
      onQuantityChange('');
      return;
    }

    handleSafeQuantityChange(value);
  };

  const handleBlur = (e) => {
    if (e.target.value === '') {
      handleSafeQuantityChange(1);
    }
  };

  const toggleBatches = (e) => {
    e.stopPropagation();
    setShowBatches(prev => !prev);
  };

  // Calculate total price using FIFO batch allocation
  const calculateBatchAllocation = useMemo(() => {
    if (!hasBatches || !quantity) return { batches: [], totalPrice: 0 };

    let batchesForAllocation = [];
    let totalPriceForItem = 0;
    let remainingToAllocate = quantity;

    // Sort batches by purchase date (oldest first - FIFO)
    const sortedBatches = [...product.batches].sort((a, b) => {
      const dateA = new Date(a.CM_Purchase_Date || 0);
      const dateB = new Date(b.CM_Purchase_Date || 0);
      return dateA - dateB;
    });

    for (const batch of sortedBatches) {
      if (remainingToAllocate <= 0) break;

      const availableInBatch = Number(batch.CM_Quantity_Remaining || 0);
      const batchUnitPrice = Number(batch.CM_Unit_Price || 0);

      if (availableInBatch > 0) {
        const allocateFromBatch = Math.min(availableInBatch, remainingToAllocate);
        const batchValue = allocateFromBatch * batchUnitPrice;

        batchesForAllocation.push({
          batch_id: batch.CM_Batch_ID,
          godown_id: batch.CM_Godown_ID,
          godown_name: batch.CM_Godown_Name,
          quantity: allocateFromBatch,
          unit_price: batchUnitPrice,
          total_price: batchValue
        });

        totalPriceForItem += batchValue;
        remainingToAllocate -= allocateFromBatch;
      }
    }

    return {
      batches: batchesForAllocation,
      totalPrice: totalPriceForItem,
      formattedTotal: totalPriceForItem.toFixed(2)
    };
  }, [hasBatches, product.batches, quantity]);

  return (
    <div
      className={`p-4 border rounded-lg transition-all duration-200 ${hasMissingId
        ? 'border-red-300 bg-red-50 opacity-70 cursor-not-allowed'
        : isSelected
          ? 'border-indigo-300 bg-indigo-50 shadow-sm'
          : isOutOfStock
            ? 'border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed'
            : 'border-slate-200 hover:border-indigo-200 hover:shadow-sm bg-white cursor-pointer'
        }`}
      onClick={!isOutOfStock && !hasMissingId ? onToggle : undefined}
    >
      <div className="flex items-start justify-between">
        {/* Left side - Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-medium text-slate-900 text-base mb-1">
                {product.item_name}
                {hasMissingId && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Missing ID
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Code: {product.item_code}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStockStatusColor()}`}>
              {getStockStatusText()}
            </span>
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-slate-500 font-medium">Max Quantity</p>
              <p className={`text-sm font-semibold ${hasMissingId ? 'text-red-600' :
                isOutOfStock ? 'text-red-600' :
                  isLowStock ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                {maxQuantity} {product.Item_Unit_Name}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Available</p>
              <p className="text-sm font-semibold text-slate-800">
                {availableStock} {product.Item_Unit_Name}
              </p>
            </div>
          </div>


          {/* Batch View Button */}
          {hasBatches && (
            <button
              onClick={toggleBatches}
              className="text-xs inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mt-1"
            >
              {showBatches ? 'Hide Batches' : 'Show Batches'}
              <svg className={`w-4 h-4 ml-1 transition-transform ${showBatches ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {/* Batch Information */}
          {showBatches && hasBatches && (
            <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1 border-t border-gray-100 pt-2">
              <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500 mb-1 px-1">
                <div>Batch ID</div>
                <div>Godown</div>
                <div>Quantity</div>
                <div>Unit Price</div>
              </div>
              {product.batches.map((batch, index) => (
                <div
                  key={batch.CM_Batch_ID || index}
                  className="grid grid-cols-4 gap-2 text-xs bg-gray-50 p-1.5 rounded"
                >
                  <div className="font-mono text-gray-700">{batch.CM_Batch_ID}</div>
                  <div className="text-gray-700">{batch.CM_Godown_Name || 'Unknown'}</div>
                  <div className="text-gray-700">{batch.CM_Quantity_Remaining} {product.Item_Unit_Name}</div>
                  <div className="font-medium text-gray-800">₹{Number(batch.CM_Unit_Price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Debug information - ID values (helpful for troubleshooting) */}
          {hasMissingId && (
            <div className="mt-2 mb-2 p-1.5 bg-red-50 rounded border border-red-100 text-xs text-red-700">
              <p>⚠️ This product cannot be selected because it's missing a required identifier.</p>
            </div>
          )}
        </div>

        {/* Right side - Selection & Quantity */}
        <div className="ml-4 flex flex-col items-end space-y-2">
          {/* Checkbox */}
          <div className={`relative ${hasMissingId || isOutOfStock ? 'opacity-50' : ''}`}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => { e.stopPropagation(); onToggle && onToggle(); }}
              disabled={hasMissingId || isOutOfStock}
              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Quantity Controls - Only show if selected or hovered */}
          {(isSelected || (!isOutOfStock && !hasMissingId)) && (
            <div className="flex flex-col items-end space-y-1">
              <label className="text-xs text-gray-600 font-medium">Qty:</label>
              <div className="flex items-center border border-gray-300 rounded-md bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSafeQuantityChange((quantity || 1) - 1);
                  }}
                  disabled={quantity <= 1 || isOutOfStock || hasMissingId}
                  className="px-4 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:text-gray-400 disabled:bg-gray-50 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isOutOfStock || hasMissingId}
                  className="w-25 px-1 py-1 text-center text-black border-0 focus:outline-none text-sm font-medium border-x border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSafeQuantityChange((quantity || 1) + 1);
                  }}
                  disabled={quantity >= maxQuantity || isOutOfStock || hasMissingId}
                  className="px-2 py-1 text-black hover:text-gray-800 hover:bg-gray-100 disabled:text-gray-400 disabled:bg-gray-50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selection Status Badge */}
      {isSelected && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Selected • {quantity} {product.Item_Unit_Name} • ₹{calculateBatchAllocation.formattedTotal}
          </div>

          {/* Display batch allocation breakdown if we have batches */}
          {hasBatches && calculateBatchAllocation.batches.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500 font-medium">Batch allocation:</p>
              <div className="text-xs text-gray-600 space-y-1 max-h-20 overflow-y-auto pr-1">
                {calculateBatchAllocation.batches.map((batch, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 rounded px-2 py-1">
                    <span className="font-mono">{batch.batch_id.substring(0, 8)}...</span>
                    <span>
                      {batch.quantity} × ₹{batch.unit_price.toFixed(2)} = ₹{batch.total_price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
