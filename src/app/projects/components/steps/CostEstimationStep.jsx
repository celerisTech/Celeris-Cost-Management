import React, { useState, useEffect } from 'react';
import { useAuthStore } from "../../../store/useAuthScreenStore";

// Equipment Items List component
const EquipmentItemsList = ({ items, onEdit, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  // Function to handle editing an item
  const handleEditClick = (itemId) => {
    setEditingItemId(itemId);
  };

  // Function to save edited item
  const handleSaveEdit = (itemId) => {
    setEditingItemId(null);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border-b border-blue-100"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
          <span className="font-semibold text-gray-800 text-sm">
            View Equipment Items ({items.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-blue-600 font-medium">
            {items.reduce((total, item) => total + ((item.quantity || 0) * (item.unitCost || 0)), 0).toFixed(2)}
          </span>
          <svg
            className={`w-4 h-4 text-blue-600 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="bg-white">
          <div className="grid grid-cols-12 bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
            <div className="col-span-3 px-4 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Item Name</div>
            <div className="col-span-2 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Quantity</div>
            <div className="col-span-2 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Unit Cost</div>
            <div className="col-span-2 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Total Cost</div>
            <div className="col-span-2 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Notes</div>
            <div className="col-span-1 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Action</div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 border-b border-gray-100 last:border-b-0 hover:bg-blue-50/50 transition-colors duration-150">
                {editingItemId === item.id ? (
                  // Edit mode view
                  <>
                    <div className="col-span-3 px-4 py-2">
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => onEdit(item.id, 'name', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="col-span-2 px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity || 0}
                        onChange={(e) => onEdit(item.id, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2 px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost || 0}
                        onChange={(e) => onEdit(item.id, 'unitCost', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2 px-2 py-2 font-semibold text-blue-700 flex items-center text-sm">
                      {((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}
                    </div>
                    <div className="col-span-2 px-2 py-2">
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => onEdit(item.id, 'notes', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        placeholder="Add notes"
                      />
                    </div>
                    <div className="col-span-1 px-2 py-2 flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-200"
                        title="Save changes"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  // Normal view mode
                  <>
                    <div className="col-span-3 px-4 py-2 flex items-center font-medium text-gray-800 text-sm">{item.name || '-'}</div>
                    <div className="col-span-2 px-2 py-2 flex items-center text-gray-700 text-sm">{item.quantity || '0'}</div>
                    <div className="col-span-2 px-2 py-2 flex items-center text-gray-700 text-sm">{(item.unitCost || 0).toFixed(2)}</div>
                    <div className="col-span-2 px-2 py-2 font-semibold text-blue-700 flex items-center text-sm">
                      {((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}
                    </div>
                    <div className="col-span-2 px-2 py-2 flex items-center text-gray-600 text-xs">{item.notes || '-'}</div>
                    <div className="col-span-1 px-2 py-2 flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleEditClick(item.id)}
                        className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm transition-all duration-200"
                        title="Edit item"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm transition-all duration-200"
                        title="Remove item"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Labor Items List component
const LaborItemsList = ({ items, onEdit, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  // Function to handle editing an item
  const handleEditClick = (itemId) => {
    setEditingItemId(itemId);
  };

  // Function to save edited item
  const handleSaveEdit = (itemId) => {
    setEditingItemId(null);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border-b border-blue-100"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
          <span className="font-semibold text-gray-800 text-sm">
            View Labor Items ({items.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-blue-600 font-medium">
            {items.reduce((total, item) => total + ((item.hours || 0) * (item.rate || 0)), 0).toFixed(2)}
          </span>
          <svg
            className={`w-4 h-4 text-blue-600 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="bg-white">
          <div className="grid grid-cols-12 bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
            <div className="col-span-3 px-4 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Position</div>
            <div className="col-span-2 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Hours</div>
            <div className="col-span-2 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Rate</div>
            <div className="col-span-2 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Total Cost</div>
            <div className="col-span-2 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Notes</div>
            <div className="col-span-1 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Action</div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 border-b border-gray-100 last:border-b-0 hover:bg-blue-50/50 transition-colors duration-150">
                {editingItemId === item.id ? (
                  // Edit mode view
                  <>
                    <div className="col-span-3 px-4 py-2">
                      <input
                        type="text"
                        value={item.position || ''}
                        onChange={(e) => onEdit(item.id, 'position', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter position"
                      />
                    </div>
                    <div className="col-span-2 px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.hours || 0}
                        onChange={(e) => onEdit(item.id, 'hours', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2 px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate || 0}
                        onChange={(e) => onEdit(item.id, 'rate', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2 px-2 py-2 font-semibold text-blue-700 flex items-center text-sm">
                      {((item.hours || 0) * (item.rate || 0)).toFixed(2)}
                    </div>
                    <div className="col-span-2 px-2 py-2">
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => onEdit(item.id, 'notes', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        placeholder="Add notes"
                      />
                    </div>
                    <div className="col-span-1 px-2 py-2 flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-200"
                        title="Save changes"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  // Normal view mode
                  <>
                    <div className="col-span-3 px-4 py-2 flex items-center font-medium text-gray-800 text-sm">{item.position || '-'}</div>
                    <div className="col-span-2 px-2 py-2 flex items-center text-gray-700 text-sm">{item.hours || '0'}</div>
                    <div className="col-span-2 px-2 py-2 flex items-center text-gray-700 text-sm">{(item.rate || 0).toFixed(2)}</div>
                    <div className="col-span-2 px-2 py-2 font-semibold text-blue-700 flex items-center text-sm">
                      {((item.hours || 0) * (item.rate || 0)).toFixed(2)}
                    </div>
                    <div className="col-span-2 px-2 py-2 flex items-center text-gray-600 text-xs">{item.notes || '-'}</div>
                    <div className="col-span-1 px-2 py-2 flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleEditClick(item.id)}
                        className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm transition-all duration-200"
                        title="Edit item"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm transition-all duration-200"
                        title="Remove item"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Site Cost Items List component
const SiteCostItemsList = ({ items, onEdit, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  // Function to handle editing an item
  const handleEditClick = (itemId) => {
    setEditingItemId(itemId);
  };

  // Function to save edited item
  const handleSaveEdit = (itemId) => {
    setEditingItemId(null);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border-b border-blue-100"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
          <span className="font-semibold text-gray-800 text-sm">
            View Site Cost Items ({items.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-blue-600 font-medium">
            {items.reduce((total, item) => total + (item.cost || 0), 0).toFixed(2)}
          </span>
          <svg
            className={`w-4 h-4 text-blue-600 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="bg-white">
          <div className="grid grid-cols-12 bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
            <div className="col-span-4 px-4 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Item</div>
            <div className="col-span-3 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Cost</div>
            <div className="col-span-4 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Notes</div>
            <div className="col-span-1 px-2 py-2 text-xs font-semibold text-blue-800 uppercase tracking-wide">Action</div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 border-b border-gray-100 last:border-b-0 hover:bg-blue-50/50 transition-colors duration-150">
                {editingItemId === item.id ? (
                  // Edit mode view
                  <>
                    <div className="col-span-4 px-4 py-2">
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => onEdit(item.id, 'name', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="col-span-3 px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.cost || 0}
                        onChange={(e) => onEdit(item.id, 'cost', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-4 px-2 py-2">
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => onEdit(item.id, 'notes', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        placeholder="Add notes"
                      />
                    </div>
                    <div className="col-span-1 px-2 py-2 flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-200"
                        title="Save changes"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  // Normal view mode
                  <>
                    <div className="col-span-4 px-4 py-2 flex items-center font-medium text-gray-800 text-sm">{item.name || '-'}</div>
                    <div className="col-span-3 px-2 py-2 font-semibold text-blue-700 flex items-center text-sm">{(item.cost || 0).toFixed(2)}</div>
                    <div className="col-span-4 px-2 py-2 flex items-center text-gray-600 text-xs">{item.notes || '-'}</div>
                    <div className="col-span-1 px-2 py-2 flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleEditClick(item.id)}
                        className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm transition-all duration-200"
                        title="Edit item"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm transition-all duration-200"
                        title="Remove item"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CostEstimationStep = ({
  costEstimationData,
  setCostEstimationData,
  createdProjectId,
  form,
  setActiveStep
}) => {
  const authUser = useAuthStore((state) => state.user);

  // Initialize state with existing data if available
  const [projectDetails, setProjectDetails] = useState(costEstimationData.projectDetails || {
    projectName: form.CM_Project_Name || '',
    projectCode: form.CM_Project_Code || '',
    projectId: form.CM_Project_ID || createdProjectId || '',
    companyId: form.CM_Company_ID || authUser?.CM_Company_ID || '',
    location: form.CM_Project_Location || '',
    systemSize: form.CM_Project_Type || '',
    startDate: form.CM_Planned_Start_Date || '',
    endDate: form.CM_Planned_End_Date || form.CM_Plenned_End_Date || ''
  });

  // Equipment items
  const [equipmentItems, setEquipmentItems] = useState(costEstimationData.equipmentItems || [
    { id: 1, name: '', quantity: 0, unitCost: 0, notes: '' }
  ]);

  // Labor items
  const [laborItems, setLaborItems] = useState(costEstimationData.laborItems || [
    { id: 1, position: '', hours: 0, rate: 0, notes: '' }
  ]);

  // Other costs
  const [otherItems, setOtherItems] = useState(costEstimationData.otherItems || [
    { id: 1, name: '', cost: 0, notes: '' }
  ]);

  const [savingEstimate, setSavingEstimate] = useState(false);
  const [estimateMessage, setEstimateMessage] = useState('');

  // Calculate totals
  const calculateEquipmentTotal = () => {
    return equipmentItems.reduce((total, item) => total + ((item.quantity || 0) * (item.unitCost || 0)), 0);
  };

  const calculateLaborTotal = () => {
    return laborItems.reduce((total, item) => total + ((item.hours || 0) * (item.rate || 0)), 0);
  };

  const calculateOtherTotal = () => {
    return otherItems.reduce((total, item) => total + (item.cost || 0), 0);
  };

  const calculateTotal = () => {
    return calculateEquipmentTotal() + calculateLaborTotal() + calculateOtherTotal();
  };

  // Handlers for input changes
  const handleProjectDetailChange = (e) => {
    const { name, value } = e.target;
    setProjectDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle equipment item changes
  const handleEquipmentChange = (id, field, value) => {
    setEquipmentItems(equipmentItems.map(item =>
      item.id === id ? { ...item, [field]: field === 'unitCost' || field === 'quantity' ? parseFloat(value) || 0 : value } : item
    ));
  };

  // Add new equipment item
  const addEquipmentItem = () => {
    const newId = equipmentItems.length > 0 ? Math.max(...equipmentItems.map(item => item.id)) + 1 : 1;
    setEquipmentItems([...equipmentItems, { id: newId, name: '', quantity: 0, unitCost: 0, notes: '' }]);
  };

  // Remove equipment item
  const removeEquipmentItem = (id) => {
    if (equipmentItems.length > 1) {
      setEquipmentItems(equipmentItems.filter(item => item.id !== id));
    }
  };

  // Handle labor item changes
  const handleLaborChange = (id, field, value) => {
    setLaborItems(laborItems.map(item =>
      item.id === id ? { ...item, [field]: field === 'rate' || field === 'hours' ? parseFloat(value) || 0 : value } : item
    ));
  };

  // Add new labor item
  const addLaborItem = () => {
    const newId = laborItems.length > 0 ? Math.max(...laborItems.map(item => item.id)) + 1 : 1;
    setLaborItems([...laborItems, { id: newId, position: '', hours: 0, rate: 0, notes: '' }]);
  };

  // Remove labor item
  const removeLaborItem = (id) => {
    if (laborItems.length > 1) {
      setLaborItems(laborItems.filter(item => item.id !== id));
    }
  };

  // Handle other item changes
  const handleOtherChange = (id, field, value) => {
    setOtherItems(otherItems.map(item =>
      item.id === id ? { ...item, [field]: field === 'cost' ? parseFloat(value) || 0 : value } : item
    ));
  };

  // Add new other item
  const addOtherItem = () => {
    const newId = otherItems.length > 0 ? Math.max(...otherItems.map(item => item.id)) + 1 : 1;
    setOtherItems([...otherItems, { id: newId, name: '', cost: 0, notes: '' }]);
  };

  // Remove other item
  const removeOtherItem = (id) => {
    if (otherItems.length > 1) {
      setOtherItems(otherItems.filter(item => item.id !== id));
    }
  };

  // Save estimate to backend
  const saveEstimate = async () => {
    try {
      setSavingEstimate(true);

      // Debug all possible sources of IDs
      console.log("Debug all sources:", {
        "projectDetails": projectDetails,
        "form": form,
        "authUser": authUser,
        "createdProjectId": createdProjectId
      });

      // Try multiple strategies for getting company ID
      const companyId =
        (projectDetails.companyId && projectDetails.companyId.trim()) ||
        (form?.CM_Company_ID && form.CM_Company_ID.trim()) ||
        (authUser?.CM_Company_ID && authUser.CM_Company_ID.trim());

      const projectId =
        (projectDetails.projectId && projectDetails.projectId.trim()) ||
        (createdProjectId && createdProjectId.trim());

      console.log("Final values to use:", { projectId, companyId });

      // Extra validation
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      if (!companyId) {
        throw new Error("Company ID is required - no valid source found");
      }

      // Create the estimate object with direct access to ensure values
      const estimate = {
        projectDetails: {
          ...projectDetails,
          companyId: companyId  // Force set company ID
        },
        equipmentItems,
        laborItems,
        otherItems,
        totals: {
          equipmentTotal: calculateEquipmentTotal(),
          laborTotal: calculateLaborTotal(),
          otherTotal: calculateOtherTotal(),
          total: calculateTotal()
        },
        // Directly use the validated IDs
        CM_Project_ID: projectId,
        CM_Company_ID: companyId
      };

      console.log("Final estimate to send:", estimate);

      // Update parent component state
      setCostEstimationData(estimate);

      // Make API call
      const response = await fetch('/api/estimatedCost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(estimate),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || 'Failed to save estimate');
      }

      setEstimateMessage('✅ Cost estimate saved successfully!');
      setTimeout(() => setActiveStep(3), 500);
    } catch (error) {
      console.error('Error saving estimate:', error);
      setEstimateMessage(`❌ Error saving estimate: ${error.message}`);
    } finally {
      setSavingEstimate(false);
    }
  };
  const handleContinueWithoutSaving = () => {
    setActiveStep(3);
  };
  // Update project details whenever form data changes
  useEffect(() => {
    setProjectDetails(prev => ({
      projectName: form.CM_Project_Name || '',
      projectCode: form.CM_Project_Code || prev.projectCode || '',
      projectId: form.CM_Project_ID || createdProjectId || prev.projectId || '',
      companyId: form.CM_Company_ID || authUser?.CM_Company_ID || prev.companyId || '',
      location: form.CM_Project_Location || prev.location || '',
      systemSize: form.CM_Project_Type || prev.systemSize || '',
      startDate: form.CM_Planned_Start_Date || prev.startDate || '',
      endDate: form.CM_Planned_End_Date || form.CM_Plenned_End_Date || prev.endDate || '',
    }));
  }, [form, createdProjectId, authUser]);

  return (
    <div className="min-h-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Project Cost Estimation
        </h2>
      </div>

      {/* Project Overview */}
      <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 text-black">
        <div className="flex items-center mb-3">
          <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
          <h2 className="ml-2 text-base font-semibold text-gray-800">Project Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              name="projectName"
              value={projectDetails.projectName || ''}
              onChange={handleProjectDetailChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              placeholder="Enter project name"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Code</label>
            <input
              type="text"
              name="projectCode"
              value={projectDetails.projectCode || ''}
              onChange={handleProjectDetailChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              placeholder="Project code"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
            <input
              type="text"
              name="systemSize"
              value={projectDetails.systemSize || ''}
              onChange={handleProjectDetailChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              placeholder="e.g., Kilo Watts"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={projectDetails.location || ''}
              onChange={handleProjectDetailChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              placeholder="Project location"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={projectDetails.startDate || ''}
              onChange={handleProjectDetailChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={projectDetails.endDate || ''}
              onChange={handleProjectDetailChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              readOnly
            />
          </div>
        </div>
      </section>

      {/* Equipment Costs */}
      <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 text-black">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center">
            <div className="w-2 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md shadow-sm"></div>
            <div className="ml-3">
              <h2 className="text-lg font-bold text-gray-800">Equipment Costs</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={addEquipmentItem}
            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 text-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Equipment
          </button>
        </div>

        {/* Previously added items in view mode */}
        {equipmentItems.length > 1 && (
          <EquipmentItemsList
            items={equipmentItems.slice(0, -1)}
            onEdit={handleEquipmentChange}
            onRemove={removeEquipmentItem}
          />
        )}

        {/* Current item being added/edited */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 shadow-sm">
          <div className="grid grid-cols-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="col-span-3 px-3 py-2 text-sm font-semibold text-blue-800  tracking-wide">Item Name</div>
            <div className="col-span-2 px-2 py-2 text-sm font-semibold text-blue-800  tracking-wide">Quantity</div>
            <div className="col-span-2 px-2 py-2 text-sm font-semibold text-blue-800  tracking-wide">Unit Cost</div>
            <div className="col-span-2 px-2 py-2 text-sm font-semibold text-blue-800  tracking-wide">Total Cost</div>
            <div className="col-span-2 px-2 py-2 text-sm font-semibold text-blue-800  tracking-wide">Notes</div>
            <div className="col-span-1 px-2 py-2 text-sm font-semibold text-blue-800  tracking-wide">Action</div>
          </div>

          {/* Only show the most recently added item in the edit form */}
          {equipmentItems.length > 0 && (
            <div className="grid grid-cols-12 border-b last:border-b-0 bg-white hover:bg-blue-50/30 transition-colors duration-150">
              <div className="col-span-3 px-3 py-2">
                <input
                  type="text"
                  value={equipmentItems[equipmentItems.length - 1].name || ''}
                  onChange={(e) => handleEquipmentChange(equipmentItems[equipmentItems.length - 1].id, 'name', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter item name"
                />
              </div>
              <div className="col-span-2 px-2 py-2">
                <input
                  type="number"
                  min="0"
                  value={equipmentItems[equipmentItems.length - 1].quantity || 0}
                  onChange={(e) => handleEquipmentChange(equipmentItems[equipmentItems.length - 1].id, 'quantity', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div className="col-span-2 px-2 py-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={equipmentItems[equipmentItems.length - 1].unitCost || 0}
                  onChange={(e) => handleEquipmentChange(equipmentItems[equipmentItems.length - 1].id, 'unitCost', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div className="col-span-2 px-2 py-2 font-semibold text-blue-700 flex items-center text-sm">
                {((equipmentItems[equipmentItems.length - 1].quantity || 0) * (equipmentItems[equipmentItems.length - 1].unitCost || 0)).toFixed(2)}
              </div>
              <div className="col-span-2 px-2 py-2">
                <input
                  type="text"
                  value={equipmentItems[equipmentItems.length - 1].notes || ''}
                  onChange={(e) => handleEquipmentChange(equipmentItems[equipmentItems.length - 1].id, 'notes', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Add notes"
                />
              </div>
              <div className="col-span-1 px-2 py-2 flex items-center justify-center">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={addEquipmentItem}
                    className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 hover:shadow-sm transition-all duration-200"
                    title="Add another item"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEquipmentItem(equipmentItems[equipmentItems.length - 1].id)}
                    disabled={equipmentItems.length === 1}
                    className={`p-1.5 rounded-md transition-all duration-200 ${equipmentItems.length === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm'
                      }`}
                    title="Remove item"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Equipment total */}
        <div className="grid grid-cols-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg mt-4 py-2 shadow-sm">
          <div className="col-span-7 px-3 py-2 font-bold text-gray-700 text-right text-sm">Subtotal - Equipment:</div>
          <div className="col-span-2 px-2 py-2 font-bold text-green-700 text-base">{calculateEquipmentTotal().toFixed(2)}</div>
          <div className="col-span-3"></div>
        </div>
      </section>

      {/* Labor Costs */}
      <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 text-black">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center">
            <div className="w-2 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md shadow-sm"></div>
            <div className="ml-3">
              <h2 className="text-lg font-bold text-gray-800">Labor Costs</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={addLaborItem}
            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 text-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Position
          </button>
        </div>

        {/* Previously added items in view mode */}
        {laborItems.length > 1 && (
          <LaborItemsList
            items={laborItems.slice(0, -1)}
            onEdit={handleLaborChange}
            onRemove={removeLaborItem}
          />
        )}

        {/* Current item being added/edited */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 shadow-sm">
          <div className="grid grid-cols-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="col-span-3 px-3 py-2 text-sm font-semibold text-blue-800 tracking-wide">Position</div>
            <div className="col-span-2 px-2 py-2 text-sm font-semibold text-blue-800 tracking-wide">Days</div>
            <div className="col-span-2 px-2 py-2 text-sm font-semibold text-blue-800 tracking-wide">Rate Based on their Days</div>
            <div className="col-span-2 px-2 py-2 text-sm font-semibold text-blue-800 tracking-wide">Total Cost</div>
            <div className="col-span-2 px-2 py-2 text-sm font-semibold text-blue-800 tracking-wide">Notes</div>
            <div className="col-span-1 px-2 py-2 text-sm font-semibold text-blue-800 tracking-wide">Action</div>
          </div>

          {/* Only show the most recently added item in the edit form */}
          {laborItems.length > 0 && (
            <div className="grid grid-cols-12 border-b last:border-b-0 bg-white hover:bg-blue-50/30 transition-colors duration-150">
              <div className="col-span-3 px-3 py-2">
                <input
                  type="text"
                  value={laborItems[laborItems.length - 1].position || ''}
                  onChange={(e) => handleLaborChange(laborItems[laborItems.length - 1].id, 'position', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter position"
                />
              </div>
              <div className="col-span-2 px-2 py-2">
                <input
                  type="number"
                  min="0"
                  value={laborItems[laborItems.length - 1].hours || 0}
                  onChange={(e) => handleLaborChange(laborItems[laborItems.length - 1].id, 'hours', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div className="col-span-2 px-2 py-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={laborItems[laborItems.length - 1].rate || 0}
                  onChange={(e) => handleLaborChange(laborItems[laborItems.length - 1].id, 'rate', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div className="col-span-2 px-2 py-2 font-semibold text-blue-700 flex items-center text-sm">
                {((laborItems[laborItems.length - 1].hours || 0) * (laborItems[laborItems.length - 1].rate || 0)).toFixed(2)}
              </div>
              <div className="col-span-2 px-2 py-2">
                <input
                  type="text"
                  value={laborItems[laborItems.length - 1].notes || ''}
                  onChange={(e) => handleLaborChange(laborItems[laborItems.length - 1].id, 'notes', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Add notes"
                />
              </div>
              <div className="col-span-1 px-2 py-2 flex items-center justify-center">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={addLaborItem}
                    className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 hover:shadow-sm transition-all duration-200"
                    title="Add another position"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLaborItem(laborItems[laborItems.length - 1].id)}
                    disabled={laborItems.length === 1}
                    className={`p-1.5 rounded-md transition-all duration-200 ${laborItems.length === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm'
                      }`}
                    title="Remove position"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Labor total */}
        <div className="grid grid-cols-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg mt-4 py-2 shadow-sm">
          <div className="col-span-7 px-3 py-2 font-bold text-gray-700 text-right text-sm">Subtotal - Labor:</div>
          <div className="col-span-2 px-2 py-2 font-bold text-green-700 text-base">{calculateLaborTotal().toFixed(2)}</div>
          <div className="col-span-3"></div>
        </div>
      </section>

      {/* Site Costs */}
      <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 text-black">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center">
            <div className="w-2 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md shadow-sm"></div>
            <div className="ml-3">
              <h2 className="text-lg font-bold text-gray-800">Site Costs</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={addOtherItem}
            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 text-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Cost Item
          </button>
        </div>

        {/* Previously added items in view mode */}
        {otherItems.length > 1 && (
          <SiteCostItemsList
            items={otherItems.slice(0, -1)}
            onEdit={handleOtherChange}
            onRemove={removeOtherItem}
          />
        )}

        {/* Current item being added/edited */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 shadow-sm">
          <div className="grid grid-cols-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="col-span-4 px-3 py-2 text-sm font-semibold text-blue-800 tracking-wide">Item</div>
            <div className="col-span-3 px-2 py-2 text-sm font-semibold text-blue-800 tracking-wide">Cost</div>
            <div className="col-span-4 px-2 py-2 text-sm font-semibold text-blue-800 tracking-wide">Notes</div>
            <div className="col-span-1 px-2 py-2 text-sm font-semibold text-blue-800 tracking-wide">Action</div>
          </div>

          {/* Only show the most recently added item in the edit form */}
          {otherItems.length > 0 && (
            <div className="grid grid-cols-12 border-b last:border-b-0 bg-white hover:bg-blue-50/30 transition-colors duration-150">
              <div className="col-span-4 px-3 py-2">
                <input
                  type="text"
                  value={otherItems[otherItems.length - 1].name || ''}
                  onChange={(e) => handleOtherChange(otherItems[otherItems.length - 1].id, 'name', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter item name"
                />
              </div>
              <div className="col-span-3 px-2 py-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherItems[otherItems.length - 1].cost || 0}
                  onChange={(e) => handleOtherChange(otherItems[otherItems.length - 1].id, 'cost', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div className="col-span-4 px-2 py-2">
                <input
                  type="text"
                  value={otherItems[otherItems.length - 1].notes || ''}
                  onChange={(e) => handleOtherChange(otherItems[otherItems.length - 1].id, 'notes', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Add notes"
                />
              </div>
              <div className="col-span-1 px-2 py-2 flex items-center justify-center">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={addOtherItem}
                    className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 hover:shadow-sm transition-all duration-200"
                    title="Add another item"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeOtherItem(otherItems[otherItems.length - 1].id)}
                    disabled={otherItems.length === 1}
                    className={`p-1.5 rounded-md transition-all duration-200 ${otherItems.length === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm'
                      }`}
                    title="Remove item"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Site costs total */}
        <div className="grid grid-cols-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg mt-4 py-2 shadow-sm">
          <div className="col-span-7 px-3 py-2 font-bold text-gray-700 text-right text-sm">Subtotal - Site Costs:</div>
          <div className="col-span-3 px-2 py-2 font-bold text-green-700 text-base">{calculateOtherTotal().toFixed(2)}</div>
          <div className="col-span-5"></div>
        </div>
      </section>

      {/* Summary */}
      <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 text-black">
        <div className="flex items-center mb-3">
          <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
          <h2 className="ml-2 text-base font-semibold text-gray-800">Project Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                <td className="px-3 py-2 font-medium text-sm">Equipment Costs</td>
                <td className="px-3 py-2 font-semibold text-blue-600 text-sm">{calculateEquipmentTotal().toFixed(2)}</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                <td className="px-3 py-2 font-medium text-sm">Labor Costs</td>
                <td className="px-3 py-2 font-semibold text-blue-600 text-sm">{calculateLaborTotal().toFixed(2)}</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                <td className="px-3 py-2 font-medium text-sm">Site Costs</td>
                <td className="px-3 py-2 font-semibold text-blue-600 text-sm">{calculateOtherTotal().toFixed(2)}</td>
              </tr>
              <tr className="bg-blue-100">
                <td className="px-3 py-3 font-bold text-base">Total Project Cost</td>
                <td className="px-3 py-3 font-bold text-blue-700 text-base">{calculateTotal().toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      {estimateMessage && (
        <div className={`p-3 mb-4 rounded-lg text-sm ${estimateMessage.includes("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {estimateMessage}
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition text-sm font-medium"
          >
            Previous
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleContinueWithoutSaving}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition text-sm font-medium"
          >
            Skip Cost Estimation
          </button>
          <button
            type="button"
            onClick={saveEstimate}
            disabled={savingEstimate}
            className="px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 transition flex items-center disabled:opacity-70 text-sm font-medium"
          >
            {savingEstimate ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Saving...
              </>
            ) : "Save Estimate & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CostEstimationStep;
