// src/app/projects/products/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import CategoryFilter from './components/CategoryFilter';
import ProductList from './components/ProductList';
import SelectedProducts from './components/SelectedProducts';
import AllocationSummary from './components/AllocationSummary';
import Navbar from '@/app/components/Navbar';
import { useAuthStore } from '@/app/store/useAuthScreenStore';

export default function ProductsAllocationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  const projectName = searchParams.get('projectName') || `Project #${projectId}`;
  const [projectDetails, setProjectDetails] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [allocatedProducts, setAllocatedProducts] = useState([]);
  const [allocationSummary, setAllocationSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Check if project already has allocations
  const hasExistingAllocations = allocatedProducts.length > 0;

  useEffect(() => {
    if (!projectId) {
      router.push('/projects');
      return;
    }

    fetchAllocatedProducts();
    fetchProjectDetails();
  }, [projectId, router]);

  const fetchProjectDetails = useCallback(async () => {
    try {
      setError('');
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch project details: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setProjectDetails(data.data);
      } else {
        setError(data.message || 'Failed to fetch project details');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      setError('Network error while fetching project details');
    }
  }, [projectId]);

  const fetchAllocatedProducts = useCallback(async () => {
    try {
      setError('');
      const response = await fetch(`/api/products/allocated?projectId=${projectId}`);
      const data = await response.json();

      if (data.success) {
        const products = data.data?.products || data.data || [];
        const summary = data.data?.summary || [];

        setAllocatedProducts(products);
        setAllocationSummary(summary);

        console.log('[Main] Fetched allocated products:', products.length);
      } else {
        setError(data.message || 'Failed to fetch allocated products');
      }
    } catch (error) {
      console.error('Error fetching allocated products:', error);
      setError('Network error while fetching allocated products');
    }
  }, [projectId]);

  const handleCategoryChange = useCallback((category, subcategory) => {
    console.log('[Main] Category change:', category?.CM_Categoy_Name, subcategory?.CM_Subcategory_Name);
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setError('');
  }, []);

  const handleProductSelect = useCallback((product, isSelected) => {
    console.log('[Main] Product select:', product.CM_Product_ID, isSelected, 'Quantity:', product.CM_Quantity);

    // Validate product has item_id
    if (isSelected && !product.item_id && !product.CM_Item_ID) {
      console.error('[Main] Product missing item_id:', product);
      toast.error('Cannot select product missing required identifier');
      return;
    }

    setSelectedProducts(prevSelected => {
      if (isSelected) {
        // Find by item_id (more reliable) or product_id
        const itemId = product.item_id || product.CM_Item_ID;
        const existingIndex = prevSelected.findIndex(p =>
          (p.item_id === itemId || p.CM_Item_ID === itemId)
        );

        if (existingIndex >= 0) {
          // If product already exists, update it with the new quantity
          return prevSelected.map((p, index) => {
            if (index === existingIndex) {
              // Check if we're receiving a full product update with a new total quantity
              if (product.CM_Quantity) {
                const newQuantity = parseInt(product.CM_Quantity);

                // Update the total price based on new quantity
                const unitPrice = parseFloat(p.CM_Unit_Price || 0);
                const newTotalPrice = unitPrice * newQuantity;

                return {
                  ...p,
                  CM_Quantity: newQuantity,
                  selected_quantity: newQuantity,
                  quantity: newQuantity,
                  CM_Total_Price: newTotalPrice.toFixed(2),
                  total_price: newTotalPrice.toFixed(2),
                  selection_timestamp: Date.now()
                };
              }
              // Otherwise, add the incoming quantity to the existing one
              else {
                const currentQuantity = parseInt(p.CM_Quantity || p.selected_quantity || 1);
                const additionalQuantity = parseInt(product.CM_Quantity || 1);
                const newQuantity = currentQuantity + additionalQuantity;

                // Update the total price based on new quantity
                const unitPrice = parseFloat(p.CM_Unit_Price || 0);
                const newTotalPrice = unitPrice * newQuantity;

                return {
                  ...p,
                  CM_Quantity: newQuantity,
                  selected_quantity: newQuantity,
                  quantity: newQuantity,
                  CM_Total_Price: newTotalPrice.toFixed(2),
                  total_price: newTotalPrice.toFixed(2),
                  selection_timestamp: Date.now()
                };
              }
            }
            return p;
          });
        } else {
          // If product doesn't exist yet, add it normally
          return [...prevSelected, {
            ...product,
            selected_quantity: parseInt(product.CM_Quantity || 1),
            CM_Quantity: parseInt(product.CM_Quantity || 1),
            quantity: parseInt(product.CM_Quantity || 1),
            selection_timestamp: Date.now()
          }];
        }
      } else {
        // Remove by item_id (more reliable) or product_id
        const itemId = product.item_id || product.CM_Item_ID;
        return prevSelected.filter(p =>
          (p.item_id !== itemId && p.CM_Item_ID !== itemId)
        );
      }
    });
  }, []);
  const handleSearch = useCallback((term) => {
    console.log('[Main] Search term:', term);
    setSearchTerm(term);
    setError('');
  }, []);
  const handleRemoveSelected = useCallback((product) => {
    console.log('[Main] Remove product:', product.CM_Product_ID);

    setSelectedProducts(prev => {
      if (!Array.isArray(prev)) return [];

      return prev.filter(p =>
        p._selectedKey !== product._selectedKey &&
        p.selection_timestamp !== product.selection_timestamp
      );
    });
  }, []);


  // Modified to create a request instead of direct allocation
  const handleAllocateProducts = async (validatedProducts = null) => {
    // Use validated products if provided by SelectedProducts component
    // or validate here if not
    const productsToRequest = validatedProducts || selectedProducts;

    if (productsToRequest.length === 0) {
      setError('Please select at least one product to request.');
      return;
    }

    // Validate all products have item_id
    const missingIds = productsToRequest.filter(p => !p.item_id && !p.CM_Item_ID);
    if (missingIds.length > 0) {
      setError(`${missingIds.length} product(s) are missing required identifiers and cannot be requested.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const productsForRequest = productsToRequest.map(product => {
        // Ensure item_id is included
        const itemId = product.item_id || product.CM_Item_ID;

        if (!itemId) {
          console.error('[Main] Product missing item_id in request preparation:', product);
          throw new Error('Product missing required identifier');
        }

        return {
          // Essential fields
          item_id: itemId,
          CM_Item_ID: itemId,
          CM_Product_ID: product.CM_Product_ID,

          // Name and quantity fields
          CM_Product_Name: product.CM_Product_Name || product.CM_Item_Name || product.item_name,
          quantity: product.CM_Quantity || product.selected_quantity || product.quantity || 1,

          // Type and price fields
          Item_Unit_Name: product.Item_Unit_Name || product.unit_type,
          notes: product.notes || `Requested from product selection screen`
        };
      });

      console.log('[Main] Sending product request with products:', productsForRequest);

      // Use POST with override to create request
      const response = await fetch('/api/products/allocate?_method=PATCH', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          items: productsForRequest,
          user_id: user?.CM_User_ID, // Replace with actual user ID from auth
          user_name: 'Current User', // Replace with actual user name from auth
          priority: 'Normal',
          notes: hasExistingAllocations
            ? `Additional product request for ${projectName}`
            : `Initial product request for ${projectName}`
        }),
      });

      const data = await response.json();

      if (data.success) {
        let message = '';
        if (hasExistingAllocations) {
          message = `Successfully requested ${productsForRequest.length} additional products for ${projectName}!`;
        } else {
          message = `Successfully requested ${productsForRequest.length} products for ${projectName}!`;
        }

        message += '\nThe request has been sent for approval.';

        toast.success(message);

        setSelectedProducts([]);

        // Optionally navigate to a request tracking page
        // router.push(`/projects/requests?requestId=${data.data.request_id}`);
      } else {
        const errorMessage = data.details || data.message || 'Failed to create product request';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error requesting products:', error);
      const errorMessage = error.message || 'Network error while creating product request';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAllocatedProduct = async (productId) => {
    if (!confirm('Are you sure you want to remove this product from the project allocation? This will return the quantity to available stock.')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/allocated?productId=${productId}&projectId=${projectId}&_method=DELETE`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product removed from allocation successfully! Stock has been restored.');
        await fetchAllocatedProducts();

        // Refresh ProductList to show updated stock
        if (selectedCategory) {
          const currentCategory = selectedCategory;
          const currentSubcategory = selectedSubcategory;
          setSelectedCategory(null);
          setTimeout(() => {
            setSelectedCategory(currentCategory);
            setSelectedSubcategory(currentSubcategory);
          }, 100);
        }
      } else {
        const errorMessage = data.message || 'Failed to remove product';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error removing product:', error);
      const errorMessage = error.message || 'Network error while removing product';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="container mx-auto max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-sm">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-red-800 mb-2">Project ID Missing</h2>
            <p className="text-red-700 mb-4">Please select a project to allocate products.</p>
            <button
              onClick={() => router.push('/projects')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Fixed for proper mobile behavior */}
      <div>
        <div className="flex h-screen bg-white">
          <Navbar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">

        <div className="flex-1 overflow-auto">
          <div className="mx-auto px-4 py-6 lg:py-8">
            {/* Enhanced Header */}
            <div className="mb-6 lg:mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 lg:mb-2">
                    <div className="hidden lg:flex flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                        {hasExistingAllocations ? 'Request Additional Products' : 'Product Request'}
                      </h1>
                    </div>
                  </div>

                  <div className="lg:ml-13 flex flex-wrap items-center gap-3 lg:gap-6">
                    {/* Project Name */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-600 text-sm lg:text-base">Project Name:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 text-sm lg:text-base font-medium truncate">
                          {projectDetails?.CM_Project_Name || projectName}
                        </span>
                        {hasExistingAllocations && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full whitespace-nowrap">
                            {allocatedProducts.length} allocated
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Project Code */}
                    {projectDetails?.CM_Project_Code && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-500 text-sm lg:text-base">Project Code:</span>
                        <span className="bg-gray-100 px-2 py-1 text-black rounded text-xs lg:text-sm font-mono truncate max-w-[200px]">
                          {projectDetails.CM_Project_Code}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end space-x-3 lg:ml-6">
                  <div className="hidden lg:block">
                    <button
                      onClick={() => router.back()}
                      className="flex items-center gap-2 sm:gap-3  text-gray-900 px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-200 
                      hover:bg-blue-300 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md
                      text-sm sm:text-base font-medium"
                    >
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      <span>Back</span>
                    </button>

                  </div>
                </div>
              </div>

              {/* Enhanced Error Display */}
              {error && (
                <div className="mt-4 lg:mt-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => setError('')}
                        className="bg-red-50 rounded-md inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column - Category Filter & Product List */}
              <div className="xl:col-span-2 space-y-6">
                <CategoryFilter
                  onCategoryChange={handleCategoryChange}
                  selectedCategory={selectedCategory}
                  selectedSubcategory={selectedSubcategory}
                  onSearch={handleSearch}
                />

                {selectedCategory && (
                  <ProductList
                    category={selectedCategory}
                    subcategory={selectedSubcategory}
                    searchTerm={searchTerm}
                    onProductSelect={handleProductSelect}
                    selectedProducts={selectedProducts}
                    projectId={projectId}
                  />
                )}
              </div>

              {/* Right Column - Selected Products & Allocation Summary */}
              <div className="space-y-6">
                {/* Sticky container for mobile */}
                <div className="sticky top-4 space-y-6">
                  <SelectedProducts
                    selectedProducts={selectedProducts}
                    onRemove={handleRemoveSelected}
                    onAllocate={handleAllocateProducts}
                    loading={loading}
                    hasExistingAllocations={hasExistingAllocations}
                    isRequestMode={true}
                  />

                  <AllocationSummary
                    selectedProducts={selectedProducts}
                    allocatedProducts={allocatedProducts}
                    summary={allocationSummary}
                    projectId={projectId}
                    onRemoveProduct={handleRemoveAllocatedProduct}
                  />
                </div>
              </div>
            </div>

            {/* Mobile Bottom Action Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] p-4 z-40 rounded-t-2xl">
              <div className="flex items-center justify-between space-x-4">
                {/* Product Summary */}
                <div className="flex flex-col">
                  <span className="text-sm text-gray-800 font-semibold">
                    {selectedProducts.length} Products selected
                  </span>
                  <span className="text-xs text-gray-500">
                    Total: ${selectedProducts
                      .reduce((sum, product) => sum + (parseFloat(product.CM_Total_Price) || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>

                {/* Request Button */}
                <button
                  onClick={() => handleAllocateProducts()}
                  disabled={loading || selectedProducts.length === 0}
                  className={`flex items-center px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-md ${loading || selectedProducts.length === 0
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Requesting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Request Products
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Add padding to bottom for mobile action bar */}
            <div className="lg:hidden h-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}