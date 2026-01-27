// src/app/projects/components/ProjectViewTab/EstimatedCost.jsx

import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function EstimatedCost({
  selectedProject,
  solarEstimate,
  estimateLoading,
  formatCurrency,
  onEstimateUpdate
}) {
  const [localEstimate, setLocalEstimate] = useState(solarEstimate);
  const [loading, setLoading] = useState(estimateLoading);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    equipmentItems: [],
    laborItems: [],
    otherItems: [],
    equipmentTotal: 0,
    laborTotal: 0,
    otherTotal: 0,
    total: 0
  });

  // Update local state when prop changes
  useEffect(() => {
    setLocalEstimate(solarEstimate);
    if (solarEstimate) {
      // Ensure all items have the required properties with safe defaults
      const safeEquipmentItems = (solarEstimate.CM_Equipment_Items || []).map(item => ({
        name: item.name || '',
        quantity: item.quantity ?? 1,
        unitCost: item.unitCost ?? item.price ?? 0,
        notes: item.notes || '',
        price: item.price ?? item.unitCost ?? 0
      }));

      const safeLaborItems = (solarEstimate.CM_Labor_Items || []).map(item => ({
        name: item.name || item.position || '',
        hours: item.hours ?? item.quantity ?? 1,
        rate: item.rate ?? item.price ?? 0,
        notes: item.notes || '',
        price: item.price ?? item.rate ?? 0,
        quantity: item.quantity ?? item.hours ?? 1
      }));

      const safeOtherItems = (solarEstimate.CM_Other_Items || []).map(item => ({
        name: item.name || '',
        cost: item.cost ?? item.price ?? 0,
        notes: item.notes || '',
        price: item.price ?? item.cost ?? 0
      }));

      setFormData({
        equipmentItems: safeEquipmentItems,
        laborItems: safeLaborItems,
        otherItems: safeOtherItems,
        equipmentTotal: solarEstimate.CM_Equipment_Total || 0,
        laborTotal: solarEstimate.CM_Labor_Total || 0,
        otherTotal: solarEstimate.CM_Other_Total || 0,
        total: solarEstimate.CM_Total || 0
      });
    } else {
      // Reset to empty state if no estimate
      setFormData({
        equipmentItems: [],
        laborItems: [],
        otherItems: [],
        equipmentTotal: 0,
        laborTotal: 0,
        otherTotal: 0,
        total: 0
      });
    }
  }, [solarEstimate]);

  useEffect(() => {
    setLoading(estimateLoading);
  }, [estimateLoading]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data
      if (localEstimate) {
        const safeEquipmentItems = (localEstimate.CM_Equipment_Items || []).map(item => ({
          name: item.name || '',
          quantity: item.quantity ?? 1,
          unitCost: item.unitCost ?? item.price ?? 0,
          notes: item.notes || '',
          price: item.price ?? item.unitCost ?? 0
        }));

        const safeLaborItems = (localEstimate.CM_Labor_Items || []).map(item => ({
          name: item.name || item.position || '',
          hours: item.hours ?? item.quantity ?? 1,
          rate: item.rate ?? item.price ?? 0,
          notes: item.notes || '',
          price: item.price ?? item.rate ?? 0,
          quantity: item.quantity ?? item.hours ?? 1
        }));

        const safeOtherItems = (localEstimate.CM_Other_Items || []).map(item => ({
          name: item.name || '',
          cost: item.cost ?? item.price ?? 0,
          notes: item.notes || '',
          price: item.price ?? item.cost ?? 0
        }));

        setFormData({
          equipmentItems: safeEquipmentItems,
          laborItems: safeLaborItems,
          otherItems: safeOtherItems,
          equipmentTotal: localEstimate.CM_Equipment_Total || 0,
          laborTotal: localEstimate.CM_Labor_Total || 0,
          otherTotal: localEstimate.CM_Other_Total || 0,
          total: localEstimate.CM_Total || 0
        });
      }
      setIsEditing(false);
      setIsCreating(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleCreateToggle = () => {
    if (isCreating) {
      // Cancel creation
      setFormData({
        equipmentItems: [],
        laborItems: [],
        otherItems: [],
        equipmentTotal: 0,
        laborTotal: 0,
        otherTotal: 0,
        total: 0
      });
      setIsCreating(false);
    } else {
      setIsCreating(true);
      setIsEditing(false);
    }
  };

  const handleItemChange = (section, index, field, value) => {
    const updatedItems = [...formData[section]];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'hours' || field === 'unitCost' || field === 'rate' || field === 'cost' || field === 'price'
        ? parseFloat(value) || 0
        : value
    };

    setFormData(prev => ({
      ...prev,
      [section]: updatedItems
    }));

    // Recalculate totals
    calculateTotals({ ...formData, [section]: updatedItems });
  };

  const addNewItem = (section) => {
    const newItem = section === 'equipmentItems'
      ? { name: '', quantity: 1, unitCost: 0, notes: '', price: 0 }
      : section === 'laborItems'
        ? { name: '', hours: 1, rate: 0, notes: '', price: 0, quantity: 1 }
        : { name: '', cost: 0, notes: '', price: 0 };

    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }));
  };

  const removeItem = (section, index) => {
    const updatedItems = formData[section].filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      [section]: updatedItems
    }));
    calculateTotals({ ...formData, [section]: updatedItems });
  };

  const calculateTotals = (data) => {
    const equipmentTotal = data.equipmentItems.reduce((sum, item) =>
      sum + ((item.quantity || 1) * (item.unitCost || item.price || 0)), 0);

    const laborTotal = data.laborItems.reduce((sum, item) =>
      sum + ((item.hours || item.quantity || 1) * (item.rate || item.price || 0)), 0);

    const otherTotal = data.otherItems.reduce((sum, item) =>
      sum + (item.cost || item.price || 0), 0);

    const total = equipmentTotal + laborTotal + otherTotal;

    setFormData(prev => ({
      ...prev,
      equipmentTotal,
      laborTotal,
      otherTotal,
      total
    }));
  };

  const handleSaveEstimate = async () => {
    setLoading(true);
    try {
      const payload = {
        projectDetails: {
          projectName: selectedProject.CM_Project_Name,
          projectCode: selectedProject.CM_Project_Code,
          projectId: selectedProject.CM_Project_ID,
          companyId: selectedProject.CM_Company_ID,
          location: selectedProject.CM_Project_Location,
          systemSize: selectedProject.CM_System_Size || '',
          startDate: selectedProject.CM_Planned_Start_Date,
          endDate: selectedProject.CM_Planned_End_Date
        },
        equipmentItems: formData.equipmentItems,
        laborItems: formData.laborItems,
        otherItems: formData.otherItems,
        totals: {
          equipmentTotal: formData.equipmentTotal,
          laborTotal: formData.laborTotal,
          otherTotal: formData.otherTotal,
          subtotal: formData.equipmentTotal + formData.laborTotal + formData.otherTotal,
          total: formData.total
        },
        CM_Project_ID: selectedProject.CM_Project_ID,
        CM_Company_ID: selectedProject.CM_Company_ID
      };

      const response = await fetch('/api/estimatedCost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setLocalEstimate(result.estimate);
        if (onEstimateUpdate) {
          onEstimateUpdate(result.estimate);
        }
        setIsEditing(false);
        setIsCreating(false);
        toast.success('Estimate saved successfully!', {
          duration: 4000,
          position: 'top-center', // ✅ Center top position
        });
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error || 'Failed to save estimate'}`, {
          duration: 5000,
          position: 'top-center', // ✅ Center top position
        });
      }
    } catch (error) {
      console.error('Error saving estimate:', error);
      toast.error('Error saving estimate. Please try again.', {
        duration: 5000,
        position: 'top-center', // ✅ Center top position
      });
    } finally {
      setLoading(false);
    }
  };

  const renderItemRow = (item, index, section, type) => {
    const isEquipment = type === 'equipment';
    const isLabor = type === 'labor';
    const isOther = type === 'other';

    // Ensure we have safe default values
    const safeItem = {
      name: item.name || '',
      quantity: item.quantity ?? 1,
      unitCost: item.unitCost ?? item.price ?? 0,
      hours: item.hours ?? item.quantity ?? 1,
      rate: item.rate ?? item.price ?? 0,
      cost: item.cost ?? item.price ?? 0,
      price: item.price ?? 0
    };

    return (
      <tr key={index} className="border-b border-gray-200">
        <td className="px-4 py-2">
          <input
            type="text"
            value={safeItem.name}
            onChange={(e) => handleItemChange(section, index, 'name', e.target.value)}
            className="w-full p-1 border rounded text-sm"
            placeholder={isEquipment ? "Item name" : isLabor ? "Service name" : "Cost description"}
          />
        </td>
        {isEquipment && (
          <>
            <td className="px-4 py-2">
              <input
                type="number"
                value={safeItem.quantity}
                onChange={(e) => handleItemChange(section, index, 'quantity', e.target.value)}
                className="w-20 p-1 border rounded text-sm text-right"
                min="1"
              />
            </td>
            <td className="px-4 py-2">
              <input
                type="number"
                value={safeItem.unitCost}
                onChange={(e) => handleItemChange(section, index, 'unitCost', e.target.value)}
                className="w-24 p-1 border rounded text-sm text-right"
                step="0.01"
                min="0"
              />
            </td>
          </>
        )}
        {isLabor && (
          <>
            <td className="px-4 py-2">
              <input
                type="number"
                value={safeItem.hours}
                onChange={(e) => handleItemChange(section, index, 'hours', e.target.value)}
                className="w-20 p-1 border rounded text-sm text-right"
                min="1"
              />
            </td>
            <td className="px-4 py-2">
              <input
                type="number"
                value={safeItem.rate}
                onChange={(e) => handleItemChange(section, index, 'rate', e.target.value)}
                className="w-24 p-1 border rounded text-sm text-right"
                step="0.01"
                min="0"
              />
            </td>
          </>
        )}
        {isOther && (
          <td className="px-4 py-2">
            <input
              type="number"
              value={safeItem.cost}
              onChange={(e) => handleItemChange(section, index, 'cost', e.target.value)}
              className="w-24 p-1 border rounded text-sm text-right"
              step="0.01"
              min="0"
            />
          </td>
        )}
        <td className="px-4 py-2 text-right font-medium">
          {isEquipment && formatCurrency(safeItem.quantity * safeItem.unitCost)}
          {isLabor && formatCurrency(safeItem.hours * safeItem.rate)}
          {isOther && formatCurrency(safeItem.cost)}
        </td>
        <td className="px-4 py-2">
          <button
            onClick={() => removeItem(section, index)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        </td>
      </tr>
    );
  };

  const renderEditSection = (title, section, type) => (
    <div className="mb-6 text-black">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <button
          onClick={() => addNewItem(section)}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          Add Item
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {type === 'equipment' ? 'Item' : type === 'labor' ? 'Service' : 'Description'}
              </th>
              {type === 'equipment' && (
                <>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                </>
              )}
              {type === 'labor' && (
                <>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                </>
              )}
              {type === 'other' && (
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              )}
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {formData[section].map((item, index) => renderItemRow(item, index, section, type))}
            {formData[section].length === 0 && (
              <tr>
                <td colSpan={type === 'other' ? 4 : 6} className="px-4 py-4 text-center text-gray-500">
                  No items added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Project Estimate</h2>
        </div>
        <div className="flex justify-center items-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-500 text-sm sm:text-base">Loading estimate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm">
      <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Project Estimate</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {!localEstimate && !isCreating && (
            <button
              onClick={handleCreateToggle}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
            >
              Create Estimate
            </button>
          )}
          {localEstimate && !isEditing && (
            <button
              onClick={handleEditToggle}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
            >
              Edit Estimate
            </button>
          )}
          {(isEditing || isCreating) && (
            <>
              <button
                onClick={handleSaveEstimate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Estimate'}
              </button>
              <button
                onClick={isEditing ? handleEditToggle : handleCreateToggle}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {(isEditing || isCreating) ? (
        <div className="p-4 sm:p-6">
          {/* Edit Mode */}
          <div className="space-y-6">
            {renderEditSection('Equipment Items', 'equipmentItems', 'equipment')}
            {renderEditSection('Labor Items', 'laborItems', 'labor')}
            {renderEditSection('Other Costs', 'otherItems', 'other')}

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Equipment Total</div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(formData.equipmentTotal)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Labor Total</div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(formData.laborTotal)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Other Costs</div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(formData.otherTotal)}</div>
                </div>
                <div className="text-center bg-green-50 rounded">
                  <div className="text-sm text-green-800">Total Estimate</div>
                  <div className="text-xl font-bold text-green-900">{formatCurrency(formData.total)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : localEstimate ? (
        <div className="p-4 sm:p-6">
          {/* View Mode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Equipment Total</div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(localEstimate.CM_Equipment_Total || 0)}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Labor Total</div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(localEstimate.CM_Labor_Total || 0)}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Other Costs</div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(localEstimate.CM_Other_Total || 0)}</div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
            <div className="text-sm font-medium text-green-800 mb-1">Total Project Estimate</div>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(localEstimate.CM_Total || 0)}</div>
          </div>

          {/* Display items in view mode */}
          <div className="space-y-6 text-black">
            {localEstimate.CM_Equipment_Items && localEstimate.CM_Equipment_Items.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Equipment Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {localEstimate.CM_Equipment_Items.map((item, index) => {
                        const quantity = item.quantity ?? 1;
                        const unitCost = item.unitCost ?? item.price ?? 0;
                        return (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{item.name || ''}</td>
                            <td className="px-4 py-2 text-sm text-right">{quantity}</td>
                            <td className="px-4 py-2 text-sm text-right">{formatCurrency(unitCost)}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium">
                              {formatCurrency(quantity * unitCost)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Similar view mode tables for labor and other items */}
            {localEstimate.CM_Labor_Items && localEstimate.CM_Labor_Items.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Labor Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {localEstimate.CM_Labor_Items.map((item, index) => {
                        const hours = item.hours ?? item.quantity ?? 1;
                        const rate = item.rate ?? item.price ?? 0;
                        return (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{item.position || item.name || ''}</td>
                            <td className="px-4 py-2 text-sm text-right">{hours}</td>
                            <td className="px-4 py-2 text-sm text-right">{formatCurrency(rate)}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium">
                              {formatCurrency(hours * rate)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {localEstimate.CM_Other_Items && localEstimate.CM_Other_Items.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Other Costs</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {localEstimate.CM_Other_Items.map((item, index) => {
                        const cost = item.cost ?? item.price ?? 0;
                        return (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{item.name || ''}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(cost)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <svg
            className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No estimate found</h3>
          <p className="mt-1 text-sm text-gray-500 px-4">No cost estimate has been created for this project yet.</p>
          <div className="mt-4">
            <button
              onClick={handleCreateToggle}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create New Estimate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}