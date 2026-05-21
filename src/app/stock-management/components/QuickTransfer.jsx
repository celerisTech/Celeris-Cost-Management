'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from "@/app/store/useAuthScreenStore";

const QuickTransfer = () => {
  // State for form data and UI
  const [items, setItems] = useState([]);
  const [allGodowns, setAllGodowns] = useState([]);
  const [sourceGodowns, setSourceGodowns] = useState([]);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { user } = useAuthStore();

  // Refs for click outside detection
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter items based on search term
  const filteredItems = items.filter(
    (item) =>
      item.CM_Item_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.CM_Item_Code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    itemId: '',
    sourceGodownId: '',
    destinationGodownId: '',
    quantity: '',
    notes: ''
  });

  // Load initial data - all items and godowns
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch items
        const itemsRes = await fetch('/api/stock-management/items');
        if (!itemsRes.ok) throw new Error('Failed to fetch items');
        const itemsData = await itemsRes.json();
        setItems(itemsData.success ? itemsData.items : []);

        // Fetch godowns
        const godownsRes = await fetch('/api/stock-management/godowns');
        if (!godownsRes.ok) throw new Error('Failed to fetch godowns');
        const godownsData = await godownsRes.json();
        setAllGodowns(godownsData.success ? godownsData.godowns : []);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load initial data: ' + error.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // When item changes, fetch available source godowns
  useEffect(() => {
    if (!formData.itemId) {
      setSourceGodowns([]);
      return;
    }

    const fetchSourceGodowns = async () => {
      try {
        // In a real app, you'd make an API call here
        // For now, let's assume all godowns have this item (for testing)
        setSourceGodowns(allGodowns);
      } catch (error) {
        console.error('Error fetching source godowns:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load source godowns: ' + error.message
        });
      }
    };

    fetchSourceGodowns();
  }, [formData.itemId, allGodowns]);

  // When source godown changes, fetch available quantity
  useEffect(() => {
    if (!formData.itemId || !formData.sourceGodownId) {
      setAvailableQuantity(0);
      return;
    }

    const fetchQuantity = async () => {
      try {
        // For testing, set a default quantity
        setAvailableQuantity(100);
      } catch (error) {
        console.error('Error fetching quantity:', error);
        setAvailableQuantity(0);
      }
    };

    fetchQuantity();
  }, [formData.itemId, formData.sourceGodownId]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);

    // Clear selection if search term is cleared
    if (!value) {
      setSelectedItem(null);
      setFormData(prev => ({
        ...prev,
        itemId: ''
      }));
    }
  };

  // Handle item selection from dropdown
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setSearchTerm(`${item.CM_Item_Name} (${item.CM_Item_Code || 'No Code'})`);
    setShowDropdown(false);

    // Update form data
    setFormData(prev => ({
      ...prev,
      itemId: item.CM_Item_ID,
      sourceGodownId: '',
      destinationGodownId: '',
      quantity: ''
    }));

    // Clear message when user makes changes
    setMessage({ type: '', text: '' });
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear message when user makes changes
    setMessage({ type: '', text: '' });

    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset dependent fields when parent field changes
    if (name === 'itemId') {
      setFormData(prev => ({
        ...prev,
        sourceGodownId: '',
        destinationGodownId: '',
        quantity: ''
      }));
    } else if (name === 'sourceGodownId') {
      setFormData(prev => ({
        ...prev,
        destinationGodownId: '',
        quantity: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate form
    if (!formData.itemId || !formData.sourceGodownId || !formData.destinationGodownId || !formData.quantity) {
      setMessage({
        type: 'error',
        text: 'Please fill all required fields'
      });
      return;
    }

    if (formData.sourceGodownId === formData.destinationGodownId) {
      setMessage({
        type: 'error',
        text: 'Source and destination godowns cannot be the same'
      });
      return;
    }

    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setMessage({
        type: 'error',
        text: 'Quantity must be greater than zero'
      });
      return;
    }

    if (qty > availableQuantity) {
      setMessage({
        type: 'error',
        text: `Cannot transfer more than available quantity (${availableQuantity})`
      });
      return;
    }

    // Submit form
    setLoading(true);
    try {
      // Get current timestamp in MySQL datetime format (YYYY-MM-DD HH:MM:SS)
      const now = new Date();
      const transferDate = now.toISOString().slice(0, 19).replace('T', ' ');

      const response = await fetch('/api/stock-management/transfer-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemId: formData.itemId,
          sourceGodownId: formData.sourceGodownId,
          destinationGodownId: formData.destinationGodownId,
          quantity: formData.quantity,
          notes: formData.notes,
          createdBy: user?.CM_Full_Name || "",
          transferDate: transferDate // Explicitly send the current timestamp
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to transfer stock');
      }

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Stock transferred successfully!'
        });

        // Reset form
        setFormData({
          itemId: '',
          sourceGodownId: '',
          destinationGodownId: '',
          quantity: '',
          notes: ''
        });
        setSearchTerm('');
        setSelectedItem(null);
        setAvailableQuantity(0);
      } else {
        throw new Error(result.message || 'Failed to transfer stock');
      }
    } catch (error) {
      console.error('Error transferring stock:', error);
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred while transferring stock'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden text-black">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <h2 className="text-2xl font-bold">Quick Stock Transfer</h2>
        <p className="text-blue-100 mt-1">Move inventory between locations efficiently</p>
      </div>

      <div className="p-6">
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg flex items-start ${message.type === 'error'
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-green-50 text-green-800 border border-green-200'
            }`}>
            <div className={`mr-3 mt-0.5 flex-shrink-0 ${message.type === 'error' ? 'text-red-500' : 'text-green-500'
              }`}>
              {message.type === 'error' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              {message.text}
              {message.type === 'error' && (
                <button
                  onClick={() => setMessage({ type: '', text: '' })}
                  className="ml-2 text-red-700 hover:text-red-900 font-medium"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {loading && !message.text ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
              {/* Sun */}
              <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
              {/* Orbit 1 */}
              <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              {/* Orbit 2 */}
              <div className="absolute inset-2 border-2 border-green-300/30 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Item Selection */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-700">
                  Select Item <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  {/* Search Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search item by name or code..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  {/* Search Icon */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>

                  {/* Dropdown List */}
                  {showDropdown && filteredItems.length > 0 && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      <ul>
                        {filteredItems.map((item) => (
                          <li
                            key={item.CM_Item_ID}
                            onClick={() => handleItemSelect(item)}
                            className="p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900">
                              {item.CM_Item_Name}
                            </div>
                            {item.CM_Item_Code && (
                              <div className="text-sm text-gray-500 mt-1">
                                Code: {item.CM_Item_Code}
                              </div>
                            )}
                            {item.CM_Item_Description && (
                              <div className="text-sm text-gray-600 mt-1 truncate">
                                {item.CM_Item_Description}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* No results message */}
                  {showDropdown && searchTerm && filteredItems.length === 0 && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
                    >
                      <div className="text-gray-500 text-center">
                        No items found matching "{searchTerm}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected item details */}
                {selectedItem && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800">
                      <strong>Selected:</strong> {selectedItem.CM_Item_Name}
                      {selectedItem.CM_Item_Code && ` (${selectedItem.CM_Item_Code})`}
                    </div>
                  </div>
                )}
              </div>

              {/* Rest of your form fields remain the same */}
              {/* Source Godown */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  From Godown <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="sourceGodownId"
                    value={formData.sourceGodownId}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={!formData.itemId}
                  >
                    <option value="">-- Select Source Godown --</option>
                    {sourceGodowns.map(godown => (
                      <option key={godown.CM_Godown_ID} value={godown.CM_Godown_ID}>
                        {godown.CM_Godown_Name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Destination Godown */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  To Godown <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="destinationGodownId"
                    value={formData.destinationGodownId}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={!formData.sourceGodownId}
                  >
                    <option value="">-- Select Destination Godown --</option>
                    {allGodowns
                      .filter(g => g.CM_Godown_ID !== formData.sourceGodownId)
                      .map(godown => (
                        <option key={godown.CM_Godown_ID} value={godown.CM_Godown_ID}>
                          {godown.CM_Godown_Name}
                        </option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Transfer Quantity <span className="text-red-500">*</span>
                  {formData.sourceGodownId && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Available: {availableQuantity})
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    min="0.01"
                    max={availableQuantity}
                    step="0.01"
                    required
                    disabled={!formData.destinationGodownId}
                    placeholder="Enter quantity"
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Remarks (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Add any notes about this transfer..."
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors flex items-center justify-center ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Transfer...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                    </svg>
                    Transfer Stock
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuickTransfer;