'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../components/Navbar'

export default function EditItemPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    if (id) {
      fetchItem(id);
      fetchCategories();
    }
  }, [id]);

  const fetchItem = async (itemId) => {
    try {
      const response = await axios.get(`/api/purchases/${itemId}`);
      setItem(response.data);
    } catch (error) {
      console.error('Failed to fetch item:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
      setLoadingCategories(false);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setLoadingCategories(false);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      if (!categoryId) {
        setSubcategories([]);
        return;
      }
      const response = await axios.get(`/api/subcategories?categoryId=${categoryId}`);
      setSubcategories(response.data);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
    }
  };

  useEffect(() => {
    if (item && item.CM_Category_ID) {
      fetchSubcategories(item.CM_Category_ID);
    }
  }, [item?.CM_Category_ID]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItem({ ...item, [name]: value });

    // If category changes, fetch subcategories for that category
    if (name === 'CM_Category_ID') {
      fetchSubcategories(value);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post(`/api/purchases/${id}?_method=PUT`, item);
      alert('Item updated successfully!');
      router.push('/warehouse');
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Error updating item');
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!item) return <p className="p-6 text-red-500">Item not found</p>;

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Navbar />

      <div className="max-w-2xl mx-auto p-6 shadow-lg rounded-xl mt-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Item</h1>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
              <input
                type="text"
                name="CM_Item_Code"
                value={item.CM_Item_Code || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter item code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                name="CM_Item_Name"
                value={item.CM_Item_Name || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter item name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              {loadingCategories ? (
                <div className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100 animate-pulse">
                  Loading categories...
                </div>
              ) : (
                <select
                  name="CM_Category_ID"
                  value={item.CM_Category_ID || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.CM_Category_ID} value={category.CM_Category_ID}>
                      {category.CM_Category_Name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
              <select
                name="CM_Subcategory_ID"
                value={item.CM_Subcategory_ID || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={!item.CM_Category_ID}
              >
                <option value="">Select Subcategory</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.CM_Subcategory_ID} value={subcategory.CM_Subcategory_ID}>
                    {subcategory.CM_Subcategory_Name}
                  </option>
                ))}
              </select>
              {!item.CM_Category_ID && (
                <p className="text-xs text-gray-500 mt-1">Please select a category first</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
              <select
                name="CM_Unit_Type"
                value={item.CM_Unit_Type || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select Unit Type</option>
                <option value="Nos">Nos</option>
                <option value="KG">KG</option>
                <option value="Meter">Meter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level</label>
              <input
                type="number"
                name="CM_Stock_Level"
                value={item.CM_Stock_Level || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                min="0"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HSN/ASC Code</label>
              <input
                type="text"
                name="CM_HSN_ASC_Code"
                value={item.CM_HSN_ASC_Code || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter HSN/ASC code"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="CM_Is_Status"
              value={item.CM_Is_Status || 'Active'}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => router.push('/warehouse')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}