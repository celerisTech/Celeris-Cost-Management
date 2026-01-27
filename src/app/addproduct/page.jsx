'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Trash2, Check, X, Loader2, Search, Upload, FileText, AlertCircle, PlusCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthScreenStore';
import { formatTitleCase, formatSentenceCase } from '../utils/textUtils';

const AddPurchaseForm = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);


  // Purchase-level fields
  const [purchaseData, setPurchaseData] = useState({
    CM_Supplier_ID: '',
    CM_Purchase_Date: new Date().toISOString().split('T')[0],
    CM_Tax_Type: 'GST',
    CM_Tax_Percentage: '18',
    CM_Advance_Payment: '0',
    CM_Bill_Number: '',
    CM_Round_off: '0',
    CM_Payment_Terms: '',
    CM_Delivery_Location: '',
    CM_Delivery_Date: '',
    CM_Created_By: user?.CM_Full_Name || '',
    CM_Godown_ID: '',
    CM_Image_URL: '' // Field for file upload
  });

  // Product-level fields (array)
  const [products, setProducts] = useState([
    {
      CM_Item_ID: '',
      CM_Product_Name: '',
      CM_Category_ID: '',
      CM_Subcategory_ID: '',
      CM_Unit_Price: '',
      CM_Discount_Percentage: '0',
      CM_Discount_Amount: '0',
      CM_Unit_Type: '',
      CM_Quantity: '1',
      CM_HSN_ASC_Code: '',
      CM_Godown_ID: '',
    },
  ]);

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [unitTypes, setUnitTypes] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  // Initialize showSuggestions array
  useEffect(() => {
    setShowSuggestions(new Array(products.length).fill(false));
  }, [products.length]);

  // Fetch initial dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [suppliersRes, categoriesRes, godownsRes, itemsRes] = await Promise.all([
          axios.get('/api/supplier'),
          axios.get('/api/categories'),
          axios.get('/api/godowns'),
          axios.get('/api/additems'),
        ]);
        setSuppliers(suppliersRes.data);
        setCategories(categoriesRes.data);
        setGodowns(godownsRes.data);
        setItems(itemsRes.data);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setMessage({ type: 'error', text: 'Failed to load initial data.' });

      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch subcategories
  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const allSubs = await axios.get('/api/subcategories');
        setSubcategories(allSubs.data);
      } catch (error) {
        console.error('Failed to load subcategories:', error);
        setMessage({ type: 'error', text: 'Failed to load subcategories.' });

      }
    };
    fetchSubs();
  }, []);
  useEffect(() => {
    const fetchUnitTypes = async () => {
      try {
        const res = await axios.get('/api/unit-types'); // create endpoint to get all unit types
        setUnitTypes(res.data);
      } catch (error) {
        console.error('Failed to load unit types', error);
      }
    };
    fetchUnitTypes();
  }, []);

  const handlePurchaseChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "CM_Payment_Terms" || name === "CM_Delivery_Location") {
      formattedValue = formatTitleCase(value);
    } else if (name === "CM_Bill_Number") {
      formattedValue = value.toUpperCase();
    }

    setPurchaseData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  // Updated to properly handle decimal input
  const handleFormattedPurchaseChange = (e) => {
    const { name, value } = e.target;

    // Allow empty values, numbers, and proper decimal formats
    if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
      setPurchaseData((prev) => ({ ...prev, [name]: value }));
    }
  };
  const filteredSuppliers = suppliers.filter(s =>
    s.CM_Company_Name.toLowerCase().includes(query.toLowerCase())
  );
  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFileName(file.name);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    try {
      setUploading(true);
      setMessage({ type: '', text: '' });

      const formData = new FormData();
      formData.append('file', file);

      console.log('Starting file upload...');

      const response = await axios.post('/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      console.log('Upload response:', response);

      if (response.data.url) {
        setPurchaseData(prev => ({
          ...prev,
          CM_Image_URL: response.data.url
        }));
        setMessage({ type: 'success', text: 'File uploaded successfully!' });
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      let errorMessage = 'File upload failed';

      if (error.response) {
        errorMessage += `: ${error.response.data?.error || error.response.statusText}`;
      } else if (error.request) {
        errorMessage += ': No response from server. Request may have timed out.';
      } else {
        errorMessage += `: ${error.message}`;
      }

      setMessage({ type: 'error', text: errorMessage });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const removeUploadedFile = () => {
    setPurchaseData(prev => ({ ...prev, CM_Image_URL: '' }));
    setFilePreview(null);
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const searchProducts = (index, query) => {
    if (!query || query.length < 2) {
      const newShowSuggestions = [...showSuggestions];
      newShowSuggestions[index] = false;
      setShowSuggestions(newShowSuggestions);
      return;
    }

    const filtered = items.filter(item =>
      item.CM_Item_Name.toLowerCase().includes(query.toLowerCase()) ||
      item.CM_Item_Description?.toLowerCase().includes(query.toLowerCase()) ||
      item.CM_Item_Code?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    setSuggestions(filtered);

    const newShowSuggestions = [...showSuggestions];
    newShowSuggestions[index] = true;
    setShowSuggestions(newShowSuggestions);
  };

  const selectProduct = (index, item) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        CM_Item_ID: item.CM_Item_ID,
        CM_Product_Name: item.CM_Item_Name,
        CM_Category_ID: item.CM_Category_ID,
        CM_Subcategory_ID: item.CM_Subcategory_ID || '',
        CM_Unit_Type: item.CM_Unit_Type,
        CM_HSN_ASC_Code: item.CM_HSN_ASC_Code || '',
        CM_Unit_Price: updated[index].CM_Unit_Price || '0',
      };
      return updated;
    });

    const newShowSuggestions = [...showSuggestions];
    newShowSuggestions[index] = false;
    setShowSuggestions(newShowSuggestions);
  };

  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    setProducts((prev) => {
      const updated = [...prev];
      updated[index][name] = value;

      if (name === 'CM_Product_Name') {
        updated[index][name] = formatTitleCase(value);
        searchProducts(index, value);
      }

      if (name === 'CM_Discount_Percentage') {
        const unitPrice = parseFloat(updated[index].CM_Unit_Price) || 0;
        const quantity = parseFloat(updated[index].CM_Quantity) || 0;
        const discountPercentage = parseFloat(value) || 0;
        updated[index].CM_Discount_Amount = ((unitPrice * quantity) * discountPercentage / 100).toFixed(2);
      }

      if (name === 'CM_Discount_Amount') {
        const unitPrice = parseFloat(updated[index].CM_Unit_Price) || 0;
        const quantity = parseFloat(updated[index].CM_Quantity) || 0;
        const discountAmount = parseFloat(value) || 0;
        const totalPrice = unitPrice * quantity;
        updated[index].CM_Discount_Percentage = totalPrice > 0 ? ((discountAmount / totalPrice) * 100).toFixed(2) : '0';
      }

      return updated;
    });
  };

  // Updated to properly handle decimal input
  const handleFormattedProductChange = (index, e) => {
    const { name, value } = e.target;

    // Allow empty values, numbers, and proper decimal formats
    if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
      handleProductChange(index, {
        target: { name, value }
      });
    }
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const addProductRow = () => {
    setProducts((prev) => [
      {
        CM_Item_ID: '',
        CM_Product_Name: '',
        CM_Category_ID: '',
        CM_Subcategory_ID: '',
        CM_Unit_Price: '',
        CM_Discount_Percentage: '0',
        CM_Discount_Amount: '0',
        CM_Unit_Type: '',
        CM_Quantity: '1',
        CM_HSN_ASC_Code: '',
        CM_Godown_ID: godowns[0]?.CM_Godown_ID || '',
      },
      ...prev,
    ]);

    setShowSuggestions(prev => [false, ...prev]);
  };

  const removeProductRow = (index) => {
    if (products.length > 1) {
      setProducts((prev) => prev.filter((_, i) => i !== index));
      setShowSuggestions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const taxPercentage = parseFloat(purchaseData.CM_Tax_Percentage) || 0;
    const advancePayment = parseFloat(purchaseData.CM_Advance_Payment) || 0;
    const roundOff = parseFloat(purchaseData.CM_Round_off) || 0;

    let subtotal = 0;
    let totalDiscount = 0;

    products.forEach((p) => {
      const unitPrice = parseFloat(p.CM_Unit_Price) || 0;
      const quantity = parseFloat(p.CM_Quantity) || 0;
      const discountAmount = parseFloat(p.CM_Discount_Amount) || 0;

      const productTotal = unitPrice * quantity;
      subtotal += productTotal - discountAmount;
      totalDiscount += discountAmount;
    });

    const taxAmount = (subtotal * taxPercentage) / 100;
    let grandTotal = subtotal + taxAmount;

    grandTotal = Math.round((grandTotal + roundOff) * 100) / 100;
    const actualRoundOff = grandTotal - (subtotal + taxAmount);

    const balancePayment = grandTotal - advancePayment;

    return {
      subtotal,
      totalDiscount,
      taxAmount,
      grandTotal,
      balancePayment,
      actualRoundOff
    };
  };

  const { subtotal, totalDiscount, taxAmount, grandTotal, balancePayment, actualRoundOff } = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        CM_Supplier_ID: purchaseData.CM_Supplier_ID,
        CM_Purchase_Date: purchaseData.CM_Purchase_Date,
        CM_Tax_Type: purchaseData.CM_Tax_Type,
        CM_Tax_Percentage: purchaseData.CM_Tax_Percentage,
        CM_Advance_Payment: purchaseData.CM_Advance_Payment,
        CM_Bill_Number: purchaseData.CM_Bill_Number,
        CM_Round_off: purchaseData.CM_Round_off,
        CM_Payment_Terms: purchaseData.CM_Payment_Terms,
        CM_Delivery_Location: purchaseData.CM_Delivery_Location,
        CM_Delivery_Date: purchaseData.CM_Delivery_Date,
        CM_Created_By: purchaseData.CM_Created_By,
        CM_Image_URL: purchaseData.CM_Image_URL,
        user: {
          CM_Company_ID: user?.CM_Company_ID
        },
        products: products.map(product => ({
          CM_Item_ID: product.CM_Item_ID,
          CM_Product_Name: product.CM_Product_Name,
          CM_Category_ID: product.CM_Category_ID,
          CM_Subcategory_ID: product.CM_Subcategory_ID,
          CM_Unit_Price: product.CM_Unit_Price,
          CM_Discount_Percentage: product.CM_Discount_Percentage,
          CM_Discount_Amount: product.CM_Discount_Amount,
          CM_Unit_Type: product.CM_Unit_Type,
          CM_Quantity: product.CM_Quantity,
          CM_HSN_ASC_Code: product.CM_HSN_ASC_Code,
          CM_Godown_ID: purchaseData.CM_Godown_ID,
        }))
      };

      const res = await axios.post('/api/addpurchases', payload);

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Purchase added successfully!' });

        setPurchaseData({
          CM_Supplier_ID: '',
          CM_Purchase_Date: new Date().toISOString().split('T')[0],
          CM_Tax_Type: 'GST',
          CM_Tax_Percentage: '18',
          CM_Advance_Payment: '0',
          CM_Bill_Number: '',
          CM_Round_off: '0',
          CM_Payment_Terms: '',
          CM_Delivery_Location: '',
          CM_Delivery_Date: '',
          CM_Created_By: user?.CM_Full_Name || '',
          CM_Godown_ID: '',
          CM_Image_URL: ''
        });

        setProducts([
          {
            CM_Item_ID: '',
            CM_Product_Name: '',
            CM_Category_ID: '',
            CM_Subcategory_ID: '',
            CM_Unit_Price: '',
            CM_Discount_Percentage: '0',
            CM_Discount_Amount: '0',
            CM_Unit_Type: '',
            CM_Quantity: '1',
            CM_HSN_ASC_Code: '',
            CM_Godown_ID: godowns[0]?.CM_Godown_ID || '',
          },
        ]);

        setFilePreview(null);
        setUploadedFileName('');

        setTimeout(() => {
          router.push('/purchase-history');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to add purchase:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to add purchase. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = (type) => {
    router.push(`/add${type}`);
  };

  if (loading)
    return (
      <div className="flex flex-row h-screen bg-white">
        {/* Navbar */}
        <Navbar />
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full items-center justify-center">
          <div className="flex justify-center items-center h-64">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mt-70">
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
        </div>
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white">
      <Navbar />

      <div className="flex-1 overflow-y-auto w-full max-w-full ">
        <div className="mx-auto px-3 sm:px-4 md:px-6 py-4 max-w-7xl">
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => router.push("/purchase-history")}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-blue-600" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Add New Purchase
              </h2>
            </div>
          </div>

          {message.text && (
            <div
              className={`mb-4 p-3 rounded-lg border ${message.type === 'error'
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-green-50 border-green-300 text-green-700'
                } flex items-center gap-2 text-sm shadow-sm`}
              role={message.type === 'error' ? 'alert' : 'status'}
            >
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Check className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-2xl text-gray-700">Purchase Information</h2>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-b border-gray-200">
              <div className="space-y-1 relative">
                <label className="block text-xs font-medium text-gray-700">Vendor *</label>

                <div className="flex gap-1">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search vendor..."

                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                      }}
                      onFocus={() => setOpen(true)}
                      onBlur={() => setTimeout(() => setOpen(false), 150)} // small delay to allow click
                      className="w-full py-2 px-3 text-sm border border-gray-300 text-gray-800 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-500 outline-none"
                    />

                    {open && filteredSuppliers.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto text-sm">
                        {filteredSuppliers.map((s) => (
                          <li
                            key={s.CM_Supplier_ID}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                            onClick={() => {
                              handlePurchaseChange({
                                target: { name: "CM_Supplier_ID", value: s.CM_Supplier_ID }
                              });
                              setQuery(s.CM_Company_Name); // set input to selected name
                              setOpen(false);
                            }}
                          >
                            {s.CM_Company_Name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRedirect('supplier')}
                    className="py-2 px-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 transition-colors text-sm"
                    title="Add new vendor"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">Purchase Date *</label>
                <input
                  type="date"
                  name="CM_Purchase_Date"
                  value={purchaseData.CM_Purchase_Date}
                  onChange={handlePurchaseChange}
                  className="w-full py-2 px-3 text-sm border text-gray-800 border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">Bill Number *</label>
                <input
                  type="text"
                  name="CM_Bill_Number"
                  value={purchaseData.CM_Bill_Number}
                  onChange={handlePurchaseChange}
                  className="w-full py-2 px-3 text-sm border text-gray-800 border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">Tax Type *</label>
                <select
                  name="CM_Tax_Type"
                  value={purchaseData.CM_Tax_Type}
                  onChange={handlePurchaseChange}
                  className="w-full py-2 px-3 text-sm border text-gray-800 border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-500 outline-none"
                  required
                >
                  <option value="GST">GST</option>
                  <option value="CGST/SGST">CGST/SGST</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">Tax Percentage (%) *</label>
                <input
                  type="number"
                  name="CM_Tax_Percentage"
                  value={purchaseData.CM_Tax_Percentage}
                  onChange={handlePurchaseChange}
                  step="0.01"
                  min="0"
                  max="100"
                  inputMode="decimal"
                  className="w-full py-2 px-3 text-sm border text-gray-800 border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">Godown *</label>
                <select
                  name="CM_Godown_ID"
                  value={purchaseData.CM_Godown_ID}
                  onChange={handlePurchaseChange}
                  className="w-full py-2 px-3 text-sm border text-gray-800 border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-500 outline-none"
                  required
                >
                  <option value="">Select godown.</option>

                  {godowns.map((g) => (
                    <option key={g.CM_Godown_ID} value={g.CM_Godown_ID}>
                      {g.CM_Godown_Name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">Payment Terms</label>
                <input
                  type="text"
                  name="CM_Payment_Terms"
                  value={purchaseData.CM_Payment_Terms}
                  onChange={handlePurchaseChange}
                  className="w-full py-2 px-3 text-sm border text-gray-800 border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">Delivery Location</label>
                <input
                  type="text"
                  name="CM_Delivery_Location"
                  value={purchaseData.CM_Delivery_Location}
                  onChange={handlePurchaseChange}
                  className="w-full py-2 px-3 text-sm border text-gray-800 border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">Delivery Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="CM_Delivery_Date"
                    value={purchaseData.CM_Delivery_Date}
                    onChange={handlePurchaseChange}
                    className="w-full py-2 px-3 text-sm border text-gray-800 border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-gray-700">Attach Invoice/Document</label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />

                  <div className="flex-1 flex border border-gray-300 rounded-lg overflow-hidden">
                    <div className="flex-1 py-2 px-3 text-sm text-gray-500 truncate bg-gray-50">
                      {uploading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      ) : uploadedFileName ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="truncate">{uploadedFileName}</span>
                        </div>
                      ) : (
                        <span>No file selected.</span>

                      )}
                    </div>

                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="py-2 px-3 bg-gray-100 text-gray-700 hover:bg-gray-200 border-l border-gray-300 text-sm flex items-center gap-1 whitespace-nowrap"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline">Browse</span>
                    </button>

                    {uploadedFileName && (
                      <button
                        type="button"
                        onClick={removeUploadedFile}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border-l border-gray-300 text-sm"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {filePreview && (
                  <div className="mt-2 border rounded-lg p-2 inline-block bg-gray-50">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="h-20 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-gray-200">
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-medium text-gray-700">Product Details</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRedirect('items')}
                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
                  >
                    + Add Item
                  </button>
                  <button
                    type="button"
                    onClick={addProductRow}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                  >
                    + Add Row
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="min-w-[800px] w-full">
                  <div className="grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr_1fr_1fr_1fr_0.5fr] bg-gray-50 border-y border-gray-200 sticky top-0 z-10">
                    <div className="py-2 px-2 font-medium text-xs text-gray-700">Product Name *</div>
                    <div className="py-2 px-2 font-medium text-xs text-gray-700 text-center">HSN/ASC</div>
                    <div className="py-2 px-2 font-medium text-xs text-gray-700 text-right">Unit Price (₹) *</div>
                    <div className="py-2 px-2 font-medium text-xs text-gray-700 text-right">Disc %</div>
                    <div className="py-2 px-2 font-medium text-xs text-gray-700 text-right">Disc Amt (₹)</div>
                    <div className="py-2 px-2 font-medium text-xs text-gray-700 text-right">Quantity *</div>
                    <div className="py-2 px-2 font-medium text-xs text-gray-700 text-right">Total.</div>
                    <div className="py-2 px-2 font-medium text-xs text-gray-700 text-center">Action.</div>

                  </div>

                  {products.map((product, index) => {
                    const unitPrice = parseFloat(product.CM_Unit_Price) || 0;
                    const quantity = parseFloat(product.CM_Quantity) || 0;
                    const discountAmount = parseFloat(product.CM_Discount_Amount) || 0;
                    const rowTotal = (unitPrice * quantity) - discountAmount;

                    return (
                      <div
                        key={index}
                        className={`grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr_1fr_1fr_1fr_0.5fr] border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <div className="p-1 relative">
                          <input
                            type="text"
                            name="CM_Product_Name"
                            value={product.CM_Product_Name}
                            onChange={(e) => handleProductChange(index, e)}
                            className="w-full py-1.5 px-2 text-xs text-gray-800 border border-transparent focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none rounded"
                            required
                            placeholder="Search product..."
                            autoComplete="off"
                          />
                          {showSuggestions[index] && suggestions.length > 0 && (
                            <div
                              className="absolute z-50 left-0 right-0 mt-0.5 bg-white border border-gray-200 shadow-lg rounded-md"
                              style={{
                                width: 'max-content',
                                minWidth: '100%',
                                maxWidth: '300px',
                                maxHeight: '200px',
                                overflowY: 'auto'
                              }}
                            >
                              {suggestions.map((item) => (
                                <div
                                  key={item.CM_Item_ID}
                                  className="p-2 hover:bg-blue-50 text-gray-800 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 text-xs"
                                  onClick={() => selectProduct(index, item)}
                                >
                                  <div className="font-medium text-gray-900">{item.CM_Item_Name}</div>
                                  {item.CM_Item_Description && (
                                    <div className="text-xs text-gray-600 mt-0.5 truncate">{item.CM_Item_Description}</div>
                                  )}
                                  <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-0.5">
                                    <span>Code: {item.CM_Item_Code || 'N/A'}</span>
                                    {item.CM_Category_ID && (
                                      <span>{categories.find(c => c.CM_Category_ID === item.CM_Category_ID)?.CM_Category_Name}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="p-1">
                          <input
                            type="text"
                            name="CM_HSN_ASC_Code"
                            value={product.CM_HSN_ASC_Code}
                            onChange={(e) => handleProductChange(index, e)}
                            className="w-full py-1.5 px-2 text-xs text-gray-800 text-center border border-transparent focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none rounded"
                          />
                        </div>

                        <div className="p-1">
                          <input
                            type="text"
                            name="CM_Unit_Price"
                            value={product.CM_Unit_Price}
                            onChange={(e) => handleFormattedProductChange(index, e)}
                            className="w-full py-1.5 px-2 text-xs text-gray-800 text-right border border-transparent focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none rounded"
                            required
                          />
                        </div>

                        <div className="p-1">
                          <input
                            type="number"
                            name="CM_Discount_Percentage"
                            value={product.CM_Discount_Percentage}
                            onChange={(e) => handleProductChange(index, e)}
                            step="0.01"
                            min="0"
                            max="100"
                            className="w-full py-1.5 px-2 text-xs text-gray-800 text-right border border-transparent focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none rounded"
                          />
                        </div>

                        <div className="p-1">
                          <input
                            type="text"
                            name="CM_Discount_Amount"
                            value={product.CM_Discount_Amount}
                            onChange={(e) => handleFormattedProductChange(index, e)}
                            className="w-full py-1.5 px-2 text-xs text-gray-800 text-right border border-transparent focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none rounded"
                          />
                        </div>

                        <div className="p-1 flex space-x-1">
                          <input
                            type="number"
                            name="CM_Quantity"
                            value={product.CM_Quantity}
                            onChange={(e) => handleProductChange(index, e)}
                            min="1"
                            className="w-3/5 py-1.5 px-2 text-xs text-gray-800 text-right border border-transparent focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none rounded"
                            required
                          />
                          <select
                            name="CM_Unit_Type"
                            value={product.CM_Unit_Type}
                            onChange={(e) => handleProductChange(index, e)}
                            className="w-2/5 py-1.5 px-1 text-xs text-gray-800 border border-gray-300 rounded"
                          >
                            <option value="">Select Unit</option>
                            {unitTypes.map((unit) => (
                              <option key={unit.CM_Unit_ID} value={unit.CM_Unit_ID}>
                                {unit.CM_Unit_Name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="p-2 flex items-center justify-end">
                          <span className="text-xs text-gray-800 font-medium">
                            ₹{formatAmount(rowTotal)}
                          </span>
                        </div>

                        <div className="p-1 flex justify-center items-center">
                          <button
                            type="button"
                            onClick={() => removeProductRow(index)}
                            className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                            title="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addProductRow}
                    className="w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 border-t border-gray-200 flex items-center justify-center gap-1"
                  >
                    <PlusCircle className="h-3 w-3" /> Add Row
                  </button>
                </div>
              </div>

              <div className="p-2 text-xs text-gray-500 text-center">
                Showing {products.length} {products.length === 1 ? 'row' : 'rows'} • Swipe horizontally to view all columns
              </div>
            </div>

            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-700 mb-3">Payment Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-black">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">Advance Payment (₹)</label>
                  <input
                    type="text"
                    name="CM_Advance_Payment"
                    value={purchaseData.CM_Advance_Payment}
                    onChange={handleFormattedPurchaseChange}
                    className="w-full py-2 px-3 text-sm text-right border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">Round Off (₹)</label>
                  <input
                    type="text"
                    name="CM_Round_off"
                    value={purchaseData.CM_Round_off}
                    onChange={handleFormattedPurchaseChange}
                    className="w-full py-2 px-3 text-sm text-right border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-800">₹{formatAmount(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Total Discount:</span>
                      <span>-₹{formatAmount(totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Tax ({purchaseData.CM_Tax_Percentage}%):</span>
                      <span>₹{formatAmount(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Round Off:</span>
                      <span>₹{formatAmount(actualRoundOff)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 md:border-l md:border-blue-200 md:pl-4">
                    <div className="flex justify-between font-bold text-blue-700">
                      <span>Grand Total:</span>
                      <span>₹{formatAmount(grandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Advance Payment:</span>
                      <span>₹{formatAmount(parseFloat(purchaseData.CM_Advance_Payment) || 0)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-green-600 pt-2 border-t border-blue-200">
                      <span>Balance Payment:</span>
                      <span>₹{formatAmount(balancePayment)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/purchase-history')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg shadow-sm hover:shadow focus:outline-none transition-all text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  'Save Purchase'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPurchaseForm;
