'use client';

import { useState, useEffect } from 'react';

export default function CategoryFilter({
  onCategoryChange,
  selectedCategory,
  selectedSubcategory,
  onSearch
}) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory.CM_Category_ID);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/categories/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Network error while fetching categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const response = await fetch(`/api/subcategories/subcategories?categoryId=${categoryId}`);
      const data = await response.json();

      if (data.success) {
        setSubcategories(data.data || []);
      } else {
        console.error('Failed to fetch subcategories:', data.message);
        setSubcategories([]);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    }
  };

  const handleCategorySelect = (e) => {
    const categoryId = e.target.value;
    if (categoryId) {
      const category = categories.find(c => c.CM_Category_ID == categoryId);
      onCategoryChange(category, null);
    } else {
      onCategoryChange(null, null);
    }
  };

  const handleSubcategorySelect = (e) => {
    const subcategoryId = e.target.value;
    if (subcategoryId && selectedCategory) {
      const subcategory = subcategories.find(sc => sc.CM_Subcategory_ID == subcategoryId);
      onCategoryChange(selectedCategory, subcategory);
    } else {
      onCategoryChange(selectedCategory, null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  const handleClearAll = () => {
    setSearchTerm('');
    onSearch('');
    onCategoryChange(null, null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div className="flex items-center">
          <div className="bg-indigo-100 p-2.5 rounded-lg mr-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Filter Products</h3>
          </div>
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <span className="flex items-center">
              <svg className="w-4 h-4 text-slate-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Category
            </span>
          </label>
          <div className="relative">
            <select
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white"
              value={selectedCategory?.CM_Category_ID || ''}
              onChange={handleCategorySelect}
              disabled={loading}
            >
              <option value="">{loading ? 'Loading categories...' : 'All Categories'}</option>
              {categories.map(category => (
                <option key={category.CM_Category_ID} value={category.CM_Category_ID}>
                  {category.CM_Category_Name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Subcategory Dropdown */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <span className="flex items-center">
              <svg className="w-4 h-4 text-slate-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Subcategory
              {!selectedCategory && <span className="ml-2 text-xs text-slate-400">(Select category first)</span>}
            </span>
          </label>
          <div className="relative">
            <select
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
              value={selectedSubcategory?.CM_Subcategory_ID || ''}
              onChange={handleSubcategorySelect}
              disabled={!selectedCategory}
            >
              <option value="">
                {!selectedCategory
                  ? "Select category first"
                  : subcategories.length === 0
                    ? "No subcategories"
                    : "All Subcategories"
                }
              </option>
              {subcategories.map(subcategory => (
                <option key={subcategory.CM_Subcategory_ID} value={subcategory.CM_Subcategory_ID}>
                  {subcategory.CM_Subcategory_Name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedCategory || selectedSubcategory || searchTerm) && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm font-medium text-blue-800 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Active Filters
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Category: {selectedCategory.CM_Category_Name}
              </span>
            )}
            {selectedSubcategory && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Subcategory: {selectedSubcategory.CM_Subcategory_Name}
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search: "{searchTerm}"
              </span>
            )}
          </div>
          <button
            onClick={handleClearAll}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}