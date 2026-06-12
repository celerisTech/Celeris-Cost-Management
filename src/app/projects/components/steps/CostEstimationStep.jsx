import React, { useState, useEffect } from 'react';
import { useAuthStore } from "../../../store/useAuthScreenStore";

// Equipment Items List component
const EquipmentItemsList = ({ items, onEdit, onRemove }) => {
  const [editingItemId, setEditingItemId] = useState(null);

  return (
    <div className="mb-2">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto border-t border-l border-gray-300 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-1/12 bg-gray-200">No.</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-4/12 bg-gray-200">Item Name</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-1/12 bg-gray-200">Qty</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-2/12 bg-gray-200">Unit Cost</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-2/12 bg-gray-200">Total</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-1/12 bg-gray-200">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="bg-white hover:bg-green-50/20">
                <td className="px-2 py-1 border-r border-b border-gray-300 text-center text-gray-500 bg-gray-100 select-none">{index + 1}</td>
                <td className="border-r border-b border-gray-300 p-0 relative">
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => onEdit(item.id, 'name', e.target.value)}
                    className="w-full bg-transparent focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:relative focus:z-10 px-2 py-1 min-h-[32px]"
                  />
                </td>
                <td className="border-r border-b border-gray-300 p-0 relative">
                  <input
                    type="number"
                    value={item.quantity || 0}
                    onChange={(e) => onEdit(item.id, 'quantity', e.target.value)}
                    className="w-full bg-transparent focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:relative focus:z-10 px-2 py-1 text-right min-h-[32px]"
                  />
                </td>
                <td className="border-r border-b border-gray-300 p-0 relative">
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitCost || 0}
                    onChange={(e) => onEdit(item.id, 'unitCost', e.target.value)}
                    className="w-full bg-transparent focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:relative focus:z-10 px-2 py-1 text-right font-mono min-h-[32px]"
                  />
                </td>
                <td className="px-2 py-1 border-r border-b border-gray-300 text-right font-mono font-medium text-gray-800 bg-gray-50/50">
                  {((item.quantity || 0) * (item.unitCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-2 py-1 border-r border-b border-gray-300 text-center bg-gray-50/50">
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="text-red-500 hover:text-red-700 p-0.5 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="hidden md:table-footer-group">
            <tr className="bg-gray-100">
              <td colSpan="4" className="px-2 py-1.5 font-bold text-gray-700 text-right text-sm border-r border-b border-gray-300">Subtotal - Equipment:</td>
              <td className="px-2 py-1.5 font-bold text-gray-800 text-right text-sm font-mono border-r border-b border-gray-300 bg-gray-200">
                {items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitCost || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="border-r border-b border-gray-300 bg-gray-100"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm relative">
            <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item #{index + 1}</span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-red-500 p-1.5 rounded-full bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Item Name</label>
                <input
                  type="text"
                  value={item.name || ''}
                  onChange={(e) => onEdit(item.id, 'name', e.target.value)}
                  placeholder="Enter equipment name"
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    value={item.quantity || 0}
                    onChange={(e) => onEdit(item.id, 'quantity', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitCost || 0}
                    onChange={(e) => onEdit(item.id, 'unitCost', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-right font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded">
                <span className="text-xs font-bold text-blue-800 uppercase">Item Total</span>
                <span className="text-sm font-black text-blue-700">
                  ₹ {((item.quantity || 0) * (item.unitCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Labor Items List component
const LaborItemsList = ({ items, onEdit, onRemove }) => {
  return (
    <div className="mb-4">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto border-t border-l border-gray-300 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-1/12 bg-gray-200">No.</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-4/12 bg-gray-200">Position</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-1/12 bg-gray-200">Days</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-2/12 bg-gray-200">Rate/Day</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-2/12 bg-gray-200">Total</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-1/12 bg-gray-200">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="bg-white hover:bg-green-50/20">
                <td className="px-2 py-1 border-r border-b border-gray-300 text-center text-gray-500 bg-gray-100 select-none">{index + 1}</td>
                <td className="border-r border-b border-gray-300 p-0 relative">
                  <input
                    type="text"
                    value={item.position || ''}
                    onChange={(e) => onEdit(item.id, 'position', e.target.value)}
                    className="w-full bg-transparent focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:relative focus:z-10 px-2 py-1 min-h-[32px]"
                  />
                </td>
                <td className="border-r border-b border-gray-300 p-0 relative">
                  <input
                    type="number"
                    value={item.hours || 0}
                    onChange={(e) => onEdit(item.id, 'hours', e.target.value)}
                    className="w-full bg-transparent focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:relative focus:z-10 px-2 py-1 text-right min-h-[32px]"
                  />
                </td>
                <td className="border-r border-b border-gray-300 p-0 relative">
                  <input
                    type="number"
                    step="0.01"
                    value={item.rate || 0}
                    onChange={(e) => onEdit(item.id, 'rate', e.target.value)}
                    className="w-full bg-transparent focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:relative focus:z-10 px-2 py-1 text-right font-mono min-h-[32px]"
                  />
                </td>
                <td className="px-2 py-1 border-r border-b border-gray-300 text-right font-mono font-medium text-gray-800 bg-gray-50/50">
                  {((item.hours || 0) * (item.rate || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-2 py-1 border-r border-b border-gray-300 text-center bg-gray-50/50">
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="text-red-500 hover:text-red-700 p-0.5 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="hidden md:table-footer-group">
            <tr className="bg-gray-100">
              <td colSpan="4" className="px-2 py-1.5 font-bold text-gray-700 text-right text-sm border-r border-b border-gray-300">Subtotal - Labor:</td>
              <td className="px-2 py-1.5 font-bold text-gray-800 text-right text-sm font-mono border-r border-b border-gray-300 bg-gray-200">
                {items.reduce((sum, item) => sum + ((item.hours || 0) * (item.rate || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="border-r border-b border-gray-300 bg-gray-100"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm relative">
            <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Labor #{index + 1}</span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-red-500 p-1.5 rounded-full bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Position / Role</label>
                <input
                  type="text"
                  value={item.position || ''}
                  onChange={(e) => onEdit(item.id, 'position', e.target.value)}
                  placeholder="e.g. Site Engineer"
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Days</label>
                  <input
                    type="number"
                    value={item.hours || 0}
                    onChange={(e) => onEdit(item.id, 'hours', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rate / Day (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.rate || 0}
                    onChange={(e) => onEdit(item.id, 'rate', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-right font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded">
                <span className="text-xs font-bold text-indigo-800 uppercase">Labor Total</span>
                <span className="text-sm font-black text-indigo-700">
                  ₹ {((item.hours || 0) * (item.rate || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Site Cost Items List component
const SiteCostItemsList = ({ items, onEdit, onRemove }) => {
  return (
    <div className="mb-4">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto border-t border-l border-gray-300 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-1/12 bg-gray-200">No.</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-7/12 bg-gray-200">Item</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-3/12 bg-gray-200">Cost</th>
              <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-1/12 bg-gray-200">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="bg-white hover:bg-green-50/20">
                <td className="px-2 py-1 border-r border-b border-gray-300 text-center text-gray-500 bg-gray-100 select-none">{index + 1}</td>
                <td className="border-r border-b border-gray-300 p-0 relative">
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => onEdit(item.id, 'name', e.target.value)}
                    className="w-full bg-transparent focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:relative focus:z-10 px-2 py-1 min-h-[32px]"
                  />
                </td>
                <td className="border-r border-b border-gray-300 p-0 relative">
                  <input
                    type="number"
                    step="0.01"
                    value={item.cost || 0}
                    onChange={(e) => onEdit(item.id, 'cost', e.target.value)}
                    className="w-full bg-transparent focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:relative focus:z-10 px-2 py-1 text-right font-mono min-h-[32px]"
                  />
                </td>
                <td className="px-2 py-1 border-r border-b border-gray-300 text-center bg-gray-50/50">
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="text-red-500 hover:text-red-700 p-0.5 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="hidden md:table-footer-group">
            <tr className="bg-gray-100">
              <td colSpan="2" className="px-2 py-1.5 font-bold text-gray-700 text-right text-sm border-r border-b border-gray-300">Subtotal - Site Costs:</td>
              <td className="px-2 py-1.5 font-bold text-gray-800 text-right text-sm font-mono border-r border-b border-gray-300 bg-gray-200">
                {items.reduce((sum, item) => sum + (item.cost || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="border-r border-b border-gray-300 bg-gray-100"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm relative">
            <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Site Cost #{index + 1}</span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-red-500 p-1.5 rounded-full bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cost Description</label>
                <input
                  type="text"
                  value={item.name || ''}
                  onChange={(e) => onEdit(item.id, 'name', e.target.value)}
                  placeholder="e.g. Transportation"
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.cost || 0}
                  onChange={(e) => onEdit(item.id, 'cost', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-right font-bold text-blue-700"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CostEstimationStep = ({
  costEstimationData,
  setCostEstimationData,
  createdProjectId,
  form,
  setActiveStep,
  refreshProjects
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

  const [gstPercentage, setGstPercentage] = useState(costEstimationData.totals?.gstPercentage || 0);
  const [gstAmount, setGstAmount] = useState(costEstimationData.totals?.gstAmount || 0);

  const [savingEstimate, setSavingEstimate] = useState(false);
  const [estimateMessage, setEstimateMessage] = useState('');

  // Update gstAmount whenever items change (total changes)
  useEffect(() => {
    const total = calculateEquipmentTotal() + calculateLaborTotal() + calculateOtherTotal();
    const calculatedAmount = (total * (gstPercentage || 0)) / 100;
    setGstAmount(calculatedAmount);
  }, [equipmentItems, laborItems, otherItems]);

  const handleGstPercentageChange = (value) => {
    const percent = parseFloat(value) || 0;
    setGstPercentage(percent);
    const total = calculateTotal();
    const amount = (total * percent) / 100;
    setGstAmount(amount);
  };

  const handleGstAmountChange = (value) => {
    const amount = parseFloat(value) || 0;
    setGstAmount(amount);
    const total = calculateTotal();
    if (total > 0) {
      setGstPercentage((amount / total) * 100);
    } else {
      setGstPercentage(0);
    }
  };

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

  const calculateGstAmount = () => {
    return gstAmount;
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateGstAmount();
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
          total: calculateTotal(),
          gstPercentage: gstPercentage,
          gstAmount: calculateGstAmount(),
          grandTotal: calculateGrandTotal()
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
      // Refresh the projects list to show the new estimated cost
      if (refreshProjects) refreshProjects();
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
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-900">
          Project Cost Estimation
        </h2>
      </div>

      {/* Project Overview */}
      <section className="bg-white p-2 mb-2 text-black">
        <div className="flex items-center mb-3">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
          <h2 className="ml-2 text-base font-semibold text-gray-800 uppercase tracking-wider">Project Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Project Name</label>
            <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-700 font-medium truncate">
              {projectDetails.projectName || 'N/A'}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Project Code</label>
            <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-700 font-medium">
              {projectDetails.projectCode || 'N/A'}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Project Type</label>
            <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-700 font-medium">
              {projectDetails.systemSize || 'N/A'}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Location</label>
            <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-700 font-medium truncate">
              {projectDetails.location || 'N/A'}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start Date</label>
            <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-700 font-medium">
              {projectDetails.startDate ? new Date(projectDetails.startDate).toLocaleDateString('en-IN') : 'N/A'}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">End Date</label>
            <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-700 font-medium">
              {projectDetails.endDate ? new Date(projectDetails.endDate).toLocaleDateString('en-IN') : 'N/A'}
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Costs */}
      <section className="bg-white p-2 text-black">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center">
            <div className="w-2 h-8 bg-blue-500 rounded-md shadow-sm"></div>
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
            Add
          </button>
        </div>

        {/* Equipment items list with Excel design */}
        <EquipmentItemsList
          items={equipmentItems}
          onEdit={handleEquipmentChange}
          onRemove={removeEquipmentItem}
        />


        {/* Equipment total (Mobile only) */}
        <div className="grid grid-cols-4 bg-gray-100 md:hidden mt-2 rounded border border-gray-200">
          <div className="col-span-2 px-3 py-2 font-bold text-gray-700 text-right text-sm">Subtotal - Equipment:</div>
          <div className="col-span-2 px-2 py-2 font-bold text-gray-800 text-base text-end">{calculateEquipmentTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </section>

      {/* Labor Costs */}
      <section className="bg-white p-2 mb-4 text-black">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center">
            <div className="w-2 h-8 bg-blue-500 rounded-md shadow-sm"></div>
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
            Add
          </button>
        </div>

        {/* Labor positions list with Excel design */}
        <LaborItemsList
          items={laborItems}
          onEdit={handleLaborChange}
          onRemove={removeLaborItem}
        />


        {/* Labor total (Mobile only) */}
        <div className="grid grid-cols-4 bg-gray-100 md:hidden mt-2 rounded border border-gray-200">
          <div className="col-span-2 px-3 py-2 font-bold text-gray-700 text-right text-sm">Subtotal - Labor:</div>
          <div className="col-span-2 px-2 py-2 font-bold text-gray-800 text-base text-end">{calculateLaborTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </section>

      {/* Site Costs */}
      <section className="bg-white p-2 text-black">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center">
            <div className="w-2 h-8 bg-blue-500 rounded-md shadow-sm"></div>
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
            Add
          </button>
        </div>

        {/* Site cost items list with Excel design */}
        <SiteCostItemsList
          items={otherItems}
          onEdit={handleOtherChange}
          onRemove={removeOtherItem}
        />


        {/* Site costs total (Mobile only) */}
        <div className="grid grid-cols-4 bg-gray-100 md:hidden mt-2 rounded border border-gray-200">
          <div className="col-span-2 px-3 py-2 font-bold text-gray-700 text-right text-sm">Subtotal - Site Costs:</div>
          <div className="col-span-2 px-2 py-2 font-bold text-gray-800 text-base text-end">{calculateOtherTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </section>

      {/* Summary */}
      <section className="bg-white p-4 mb-6 text-black border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center mb-4">
          <div className="w-1.5 h-7 bg-blue-600 rounded-full shadow-sm"></div>
          <h2 className="ml-3 text-lg font-bold text-gray-800 uppercase tracking-wider">Project Cost Summary</h2>
        </div>

        <div className="">
          {/* Desktop Summary Table */}
          <div className="hidden md:block overflow-x-auto border-t border-l border-gray-300 shadow-sm mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left font-semibold text-gray-600 border-r border-b border-gray-300 bg-gray-200">Category</th>
                  <th className="px-2 py-1 text-center font-semibold text-gray-600 border-r border-b border-gray-300 w-32 bg-gray-200">Rate (%)</th>
                  <th className="px-2 py-1 text-right font-semibold text-gray-600 border-r border-b border-gray-300 bg-gray-200">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white hover:bg-green-50/20">
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-gray-700 font-medium">Equipment Costs</td>
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-center text-gray-400">-</td>
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-right font-mono font-medium text-gray-800">{calculateEquipmentTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-white hover:bg-green-50/20">
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-gray-700 font-medium">Labor Costs</td>
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-center text-gray-400">-</td>
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-right font-mono font-medium text-gray-800">{calculateLaborTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-white hover:bg-green-50/20">
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-gray-700 font-medium">Site Costs</td>
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-center text-gray-400">-</td>
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-right font-mono font-medium text-gray-800">{calculateOtherTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 font-bold text-gray-700 text-right">Subtotal</td>
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-center text-gray-400">-</td>
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-right font-mono font-bold text-gray-800 bg-gray-200">{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-white hover:bg-green-50/20">
                  <td className="px-2 py-1.5 border-r border-b border-gray-300 text-gray-700 font-medium text-right">GST (CGST + SGST)</td>
                  <td className="border-r border-b border-gray-300 p-0 relative">
                    <input
                      type="number"
                      value={gstPercentage || ''}
                      onChange={(e) => handleGstPercentageChange(e.target.value)}
                      className="w-full bg-transparent focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:relative focus:z-10 px-2 py-1.5 text-center min-h-[32px]"
                      placeholder="GST %"
                    />
                  </td>
                  <td className="border-r border-b border-gray-300 p-0 relative">
                    <input
                      type="number"
                      step="0.01"
                      value={gstAmount || ''}
                      onChange={(e) => handleGstAmountChange(e.target.value)}
                      className="w-full bg-transparent focus:bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:relative focus:z-10 px-2 py-1.5 text-right font-mono min-h-[32px]"
                      placeholder="GST Amount"
                    />
                  </td>
                </tr>
                <tr className="bg-blue-600 text-white">
                  <td className="px-2 py-2 border-r border-b border-blue-500 font-bold text-right uppercase tracking-wider">Grand Total</td>
                  <td className="px-2 py-2 border-r border-b border-blue-500 text-center text-blue-300">-</td>
                  <td className="px-2 py-2 border-b border-blue-500 text-right font-mono font-bold text-lg bg-blue-700">₹ {calculateGrandTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Summary Cards */}
          <div className="md:hidden divide-y divide-gray-100 overflow-hidden border border-gray-200 rounded-lg">
            <div className="p-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">Equipment</span>
              <span className="font-bold text-gray-900">{calculateEquipmentTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">Labor</span>
              <span className="font-bold text-gray-900">{calculateLaborTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">Site Costs</span>
              <span className="font-bold text-gray-900">{calculateOtherTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-3 flex justify-between items-center bg-blue-50/30">
              <span className="text-sm font-bold text-blue-800">Subtotal</span>
              <span className="text-base font-black text-blue-700">{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">GST (%)</span>
                <input
                  type="number"
                  value={gstPercentage.toFixed(2)}
                  onChange={(e) => handleGstPercentageChange(e.target.value)}
                  className="w-16 px-2 py-1 text-xs border border-gray-200 rounded text-center font-bold text-blue-700"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">GST (₹)</span>
                <input
                  type="number"
                  step="0.01"
                  value={gstAmount.toFixed(2)}
                  onChange={(e) => handleGstAmountChange(e.target.value)}
                  className="w-32 px-2 py-1 text-xs border border-gray-200 rounded text-right font-bold text-blue-700"
                />
              </div>
            </div>
            <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
              <span className="font-bold uppercase text-xs">Grand Total</span>
              <span className="text-xl font-black">₹ {calculateGrandTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
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
