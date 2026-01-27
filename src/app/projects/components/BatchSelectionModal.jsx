// src/app/projects/components/BatchSelectionModal.jsx
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function BatchSelectionModal({ isOpen, onClose, product, projectId, onAllocate }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalAllocated, setTotalAllocated] = useState(0);
  
  useEffect(() => {
    if (isOpen && product) {
      fetchAvailableBatches();
    }
  }, [isOpen, product]);
  
  const fetchAvailableBatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/batches?itemId=${product.CM_Product_ID}`);
      const data = await response.json();
      
      if (data.success) {
        setBatches(data.data?.batches || []);
        
        // Initialize with existing allocations if available
        const initialSelections = {};
        let total = 0;
        
        data.data?.batches.forEach(batch => {
          if (batch.project_quantity > 0) {
            initialSelections[batch.CM_Batch_ID] = batch.project_quantity;
            total += batch.project_quantity;
          }
        });
        
        setSelectedBatches(initialSelections);
        setTotalAllocated(total);
        
        // If no existing allocations, use FIFO to suggest allocations
        if (total === 0) {
          const neededQuantity = product.CM_Quantity;
          let remaining = neededQuantity;
          const suggested = {};
          let suggestedTotal = 0;
          
          // Sort batches by date (oldest first)
          const sortedBatches = [...data.data?.batches].sort(
            (a, b) => new Date(a.CM_Purchase_Date) - new Date(b.CM_Purchase_Date)
          );
          
          for (const batch of sortedBatches) {
            if (remaining <= 0) break;
            
            const available = batch.CM_Quantity_Remaining;
            const toUse = Math.min(available, remaining);
            
            if (toUse > 0) {
              suggested[batch.CM_Batch_ID] = toUse;
              suggestedTotal += toUse;
              remaining -= toUse;
            }
          }
          
          if (suggestedTotal > 0) {
            setSelectedBatches(suggested);
            setTotalAllocated(suggestedTotal);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBatchAllocation = (batchId, quantity) => {
    try {
      const numericQty = parseFloat(quantity) || 0;
      const newSelected = { ...selectedBatches };
      
      if (numericQty <= 0) {
        delete newSelected[batchId];
      } else {
        // Find the batch to get its available quantity
        const batch = batches.find(b => b.CM_Batch_ID === batchId);
        if (batch && numericQty > batch.CM_Quantity_Remaining) {
          toast.error(`Only ${batch.CM_Quantity_Remaining} available in this batch`);
          newSelected[batchId] = batch.CM_Quantity_Remaining;
        } else {
          newSelected[batchId] = numericQty;
        }
      }
      
      setSelectedBatches(newSelected);
      updateTotalAllocated(newSelected);
    } catch (err) {
      console.error('Error handling batch allocation:', err);
    }
  };
  
  const updateTotalAllocated = (selected) => {
    const total = Object.values(selected).reduce((sum, qty) => sum + parseFloat(qty || 0), 0);
    setTotalAllocated(total);
  };
  
  const handleSaveAllocation = async () => {
    try {
      if (totalAllocated <= 0) {
        toast.error('Please allocate at least some quantity');
        return;
      }
      
      // If allocation doesn't match product quantity, confirm with user
      if (Math.abs(totalAllocated - product.CM_Quantity) > 0.01) {
        if (!confirm(`The allocated quantity (${totalAllocated}) does not match the product quantity (${product.CM_Quantity}). Do you want to continue anyway?`)) {
          return;
        }
      }
      
      // Convert to array format for API
      const batchAllocations = Object.entries(selectedBatches).map(([batchId, quantity]) => ({
        batch_id: batchId,
        quantity: parseFloat(quantity)
      }));
      
      // Calculate total price based on batch allocations
      const totalPrice = batchAllocations.reduce((sum, allocation) => {
        const batch = batches.find(b => b.CM_Batch_ID === allocation.batch_id);
        if (!batch) return sum;
        return sum + (allocation.quantity * parseFloat(batch.CM_Unit_Price || 0));
      }, 0);
      
      // Create the updated product object
      const updatedProduct = {
        ...product,
        CM_Quantity: totalAllocated,
        CM_Total_Price: totalPrice,
        batches_for_allocation: batchAllocations
      };
      
      // Make API call to update the allocation
      const response = await fetch('/api/products/allocated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          products: [updatedProduct]
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Batch allocation updated successfully');
        onAllocate();
        onClose();
      } else {
        toast.error(data.error || 'Failed to update batch allocation');
      }
    } catch (error) {
      console.error('Error saving batch allocations:', error);
      toast.error('Error saving batch allocations');
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Batch Allocation for {product?.CM_Product_Name}
                </h3>
                
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <span className="font-medium">Total needed:</span> {product?.CM_Quantity} {product?.CM_Unit_Type}
                    </div>
                    <div>
                      <span className="font-medium">Allocated:</span> {totalAllocated.toFixed(2)} {product?.CM_Unit_Type}
                    </div>
                    <div className={`font-medium ${(product?.CM_Quantity - totalAllocated) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      <span>Remaining:</span> {(product?.CM_Quantity - totalAllocated).toFixed(2)} {product?.CM_Unit_Type}
                    </div>
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading batches...</p>
                  </div>
                ) : (
                  <>
                    {batches.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">No batches found for this product.</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Godown</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Date</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allocate</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {batches.map(batch => (
                              <tr key={batch.CM_Batch_ID} className={`hover:bg-gray-50 ${batch.CM_Quantity_Remaining <= 0 ? 'bg-gray-100 text-gray-400' : ''}`}>
                                <td className="px-3 py-3 font-mono text-xs">{batch.CM_Batch_ID}</td>
                                <td className="px-3 py-3">{batch.CM_Godown_Name || 'Unknown'}</td>
                                <td className="px-3 py-3">
                                  {batch.CM_Purchase_Date ? new Date(batch.CM_Purchase_Date).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-3 py-3">{batch.CM_Quantity_Remaining} {product?.CM_Unit_Type}</td>
                                <td className="px-3 py-3">{formatCurrency(batch.CM_Unit_Price)}</td>
                                <td className="px-3 py-3 text-blue-600 font-medium">
                                  {batch.project_quantity > 0 ? `${batch.project_quantity} ${product?.CM_Unit_Type}` : '-'}
                                </td>
                                <td className="px-3 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    max={batch.CM_Quantity_Remaining + (batch.project_quantity || 0)}
                                    step="0.01"
                                    value={selectedBatches[batch.CM_Batch_ID] || ''}
                                    onChange={(e) => handleBatchAllocation(batch.CM_Batch_ID, e.target.value)}
                                    className={`w-20 px-2 py-1 border rounded ${batch.CM_Quantity_Remaining <= 0 && !batch.project_quantity ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    disabled={batch.CM_Quantity_Remaining <= 0 && !batch.project_quantity}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSaveAllocation}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                Math.abs(totalAllocated - product?.CM_Quantity) < 0.01
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={totalAllocated <= 0}
            >
              {Math.abs(totalAllocated - product?.CM_Quantity) < 0.01
                ? 'Save Allocation'
                : `Save Partial Allocation (${totalAllocated.toFixed(2)}/${product?.CM_Quantity})`
              }
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
