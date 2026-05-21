'use client';
import React, { useState, useEffect, useRef } from 'react';
import { formatTitleCase, formatSentenceCase } from '../utils/textUtils';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/useAuthScreenStore';
import { ArrowLeft } from 'lucide-react';

const SupplierForm = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const isEditMode = !!id;
  const { user } = useAuthStore();


  const [supplier, setSupplier] = useState({
    CM_Company_Name: '',
    CM_Supplier_Code: '',
    CM_Contact_Person: '',
    CM_Email: '',
    CM_Phone_Number: '',
    CM_Alternate_Phone: '',
    CM_Address: '',
    CM_District: '',
    CM_State: '',
    CM_Country: 'India',
    CM_Postal_Code: '',
    CM_GST_Number: '',
    CM_PAN_Number: '',
    CM_Payment_Terms: '30 days',
    CM_Is_Active: 'Active'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [nameChecking, setNameChecking] = useState(false);
  const [nameAvailable, setNameAvailable] = useState(null);
  const nameCheckTimer = useRef(null);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState(null);
  const phoneCheckTimer = useRef(null);
  const [gstChecking, setGstChecking] = useState(false);
  const [gstAvailable, setGstAvailable] = useState(null);
  const gstCheckTimer = useRef(null);
  const [panChecking, setPanChecking] = useState(false);
  const [panAvailable, setPanAvailable] = useState(null);
  const panCheckTimer = useRef(null);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/supplier/${id}`);
        if (!res.ok) throw new Error('Failed to fetch supplier');
        const data = await res.json();
        setSupplier(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'CM_GST_Number' || name === 'CM_PAN_Number') v = value.toUpperCase();
    if (name === 'CM_Postal_Code') v = value.replace(/[^0-9]/g, '').slice(0, 6);
    if (name === 'CM_Phone_Number' || name === 'CM_Alternate_Phone') v = value.replace(/[^0-9+\-\s]/g, '').slice(0, 20);

    if (['CM_Company_Name', 'CM_Contact_Person', 'CM_District', 'CM_State', 'CM_Country'].includes(name)) {
      v = formatTitleCase(v);
    }
    if (name === 'CM_Address') {
      v = formatSentenceCase(v);
    }
    setSupplier(prev => ({ ...prev, [name]: v }));
    setFieldErrors(prev => ({ ...prev, [name]: undefined }));

    // Debounced uniqueness check when typing company name
    if (name === 'CM_Company_Name') {
      setNameAvailable(null);
      if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
      const trimmed = v.trim();
      if (!trimmed) {
        setNameChecking(false);
        return;
      }
      setNameChecking(true);
      nameCheckTimer.current = setTimeout(() => {
        void checkCompanyNameUnique(trimmed);
      }, 500);
    }

    // Debounced uniqueness check for phone
    if (name === 'CM_Phone_Number') {
      setPhoneAvailable(null);
      if (phoneCheckTimer.current) clearTimeout(phoneCheckTimer.current);
      const trimmed = v.trim();
      if (!trimmed) {
        setPhoneChecking(false);
      } else {
        setPhoneChecking(true);
        phoneCheckTimer.current = setTimeout(() => {
          void checkPhoneUnique(trimmed);
        }, 500);
      }
    }

    // Debounced uniqueness check for GST
    if (name === 'CM_GST_Number') {
      setGstAvailable(null);
      if (gstCheckTimer.current) clearTimeout(gstCheckTimer.current);
      const trimmed = v.trim().toUpperCase();
      if (!trimmed) {
        setGstChecking(false);
      } else {
        setGstChecking(true);
        gstCheckTimer.current = setTimeout(() => {
          void checkGSTUnique(trimmed);
        }, 500);
      }
    }

    // Debounced uniqueness check for PAN
    if (name === 'CM_PAN_Number') {
      setPanAvailable(null);
      if (panCheckTimer.current) clearTimeout(panCheckTimer.current);
      const trimmed = v.trim().toUpperCase();
      if (!trimmed) {
        setPanChecking(false);
      } else {
        setPanChecking(true);
        panCheckTimer.current = setTimeout(() => {
          void checkPANUnique(trimmed);
        }, 500);
      }
    }
  };

  const checkCompanyNameUnique = async (name) => {
    try {
      const res = await fetch('/api/supplier', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to check name');
      const list = await res.json();
      const lower = name.toLowerCase();
      const clash = list?.find?.(s => s?.CM_Company_Name?.toLowerCase() === lower && (!isEditMode || s?.CM_Supplier_ID !== id));
      if (clash) {
        setFieldErrors(prev => ({ ...prev, CM_Company_Name: 'Company name already exists' }));
        setNameAvailable(false);
      } else {
        setFieldErrors(prev => ({ ...prev, CM_Company_Name: undefined }));
        setNameAvailable(true);
      }
    } catch (_) {
      // Fail-open: don't block, just clear indicator
      setNameAvailable(null);
    } finally {
      setNameChecking(false);
    }
  };

  const checkPhoneUnique = async (number) => {
    try {
      const res = await fetch('/api/supplier', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to check phone');
      const list = await res.json();
      const clash = list?.find?.(s => String(s?.CM_Phone_Number || '').trim() === number && (!isEditMode || s?.CM_Supplier_ID !== id));
      if (clash) {
        setFieldErrors(prev => ({ ...prev, CM_Phone_Number: 'Phone number already exists' }));
        setPhoneAvailable(false);
      } else {
        setFieldErrors(prev => ({ ...prev, CM_Phone_Number: undefined }));
        setPhoneAvailable(true);
      }
    } catch (_) {
      setPhoneAvailable(null);
    } finally {
      setPhoneChecking(false);
    }
  };

  const checkGSTUnique = async (gst) => {
    try {
      const res = await fetch('/api/supplier', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to check GST');
      const list = await res.json();
      const clash = list?.find?.(s => (s?.CM_GST_Number || '').toUpperCase() === gst && (!isEditMode || s?.CM_Supplier_ID !== id));
      if (clash) {
        setFieldErrors(prev => ({ ...prev, CM_GST_Number: 'GST number already exists' }));
        setGstAvailable(false);
      } else {
        setFieldErrors(prev => ({ ...prev, CM_GST_Number: undefined }));
        setGstAvailable(true);
      }
    } catch (_) {
      setGstAvailable(null);
    } finally {
      setGstChecking(false);
    }
  };

  const checkPANUnique = async (pan) => {
    try {
      const res = await fetch('/api/supplier', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to check PAN');
      const list = await res.json();
      const clash = list?.find?.(s => (s?.CM_PAN_Number || '').toUpperCase() === pan && (!isEditMode || s?.CM_Supplier_ID !== id));
      if (clash) {
        setFieldErrors(prev => ({ ...prev, CM_PAN_Number: 'PAN number already exists' }));
        setPanAvailable(false);
      } else {
        setFieldErrors(prev => ({ ...prev, CM_PAN_Number: undefined }));
        setPanAvailable(true);
      }
    } catch (_) {
      setPanAvailable(null);
    } finally {
      setPanChecking(false);
    }
  };

  const validate = async () => {
    const errs = {};
    const name = supplier.CM_Company_Name?.trim();
    if (!name) errs.CM_Company_Name = 'Company name is required';
    if (!supplier.CM_Phone_Number?.trim()) errs.CM_Phone_Number = 'Phone is required';
    if (supplier.CM_Email?.trim() && !/^\S+@\S+\.\S+$/.test(supplier.CM_Email)) errs.CM_Email = 'Invalid email';
    if (supplier.CM_GST_Number?.trim() && !/^[0-9A-Z]{15}$/.test(supplier.CM_GST_Number)) errs.CM_GST_Number = 'GST must be 15 chars';
    if (supplier.CM_PAN_Number?.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(supplier.CM_PAN_Number)) errs.CM_PAN_Number = 'Invalid PAN format';
    if (supplier.CM_Postal_Code && String(supplier.CM_Postal_Code).length !== 6) errs.CM_Postal_Code = 'Postal code must be 6 digits';

    // Uniqueness checks (single fetch) for name/phone/gst/pan
    const phone = supplier.CM_Phone_Number?.trim();
    const gst = supplier.CM_GST_Number?.trim().toUpperCase();
    const pan = supplier.CM_PAN_Number?.trim().toUpperCase();
    const needName = !errs.CM_Company_Name && !!name;
    const needPhone = !errs.CM_Phone_Number && !!phone;
    const needGst = !errs.CM_GST_Number && !!gst;
    const needPan = !errs.CM_PAN_Number && !!pan;
    if (needName || needPhone || needGst || needPan) {
      try {
        const res = await fetch('/api/supplier', { cache: 'no-store' });
        if (res.ok) {
          const list = await res.json();
          if (needName) {
            const lower = name.toLowerCase();
            const clash = list?.find?.(s => s?.CM_Company_Name?.toLowerCase() === lower && (!isEditMode || s?.CM_Supplier_ID !== id));
            if (clash) {
              errs.CM_Company_Name = 'Company name already exists';
              setNameAvailable(false);
            } else {
              setNameAvailable(true);
            }
          }
          if (needPhone) {
            const clash = list?.find?.(s => String(s?.CM_Phone_Number || '').trim() === phone && (!isEditMode || s?.CM_Supplier_ID !== id));
            if (clash) {
              errs.CM_Phone_Number = 'Phone number already exists';
              setPhoneAvailable(false);
            } else {
              setPhoneAvailable(true);
            }
          }
          if (needGst) {
            const clash = list?.find?.(s => (s?.CM_GST_Number || '').toUpperCase() === gst && (!isEditMode || s?.CM_Supplier_ID !== id));
            if (clash) {
              errs.CM_GST_Number = 'GST number already exists';
              setGstAvailable(false);
            } else {
              setGstAvailable(true);
            }
          }
          if (needPan) {
            const clash = list?.find?.(s => (s?.CM_PAN_Number || '').toUpperCase() === pan && (!isEditMode || s?.CM_Supplier_ID !== id));
            if (clash) {
              errs.CM_PAN_Number = 'PAN number already exists';
              setPanAvailable(false);
            } else {
              setPanAvailable(true);
            }
          }
        }
      } catch (_) {
        // Fail-open on network error
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const ok = await validate();
      if (!ok) throw new Error('Please fix the highlighted errors');

      const url = isEditMode ? `/api/supplier/${id}?_method=PUT` : '/api/supplier';
      const method = 'POST';

      const createdBy = user?.CM_User_ID ?? user?.id ?? user?.user_id ?? null;
      const payload = { ...supplier, ...(isEditMode ? { CM_Uploaded_By: createdBy } : { CM_Created_By: createdBy }) };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save supplier');
      }

      router.push('/supplier');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-row h-screen bg-white">
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

  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

  return (
    <div className="flex h-screen bg-white text-black">
      <Navbar />
      <div className="flex-1 overflow-y-auto mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8  mx-auto border border-gray-200 transition-all duration-300 hover:shadow-xl">
          {/* Header */}
          <div className="mb-8">
            {/* Title + Back Button Row */}
            <div className="flex items-center justify-between">

              <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                {isEditMode ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Vendors
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8a5 5 0 10-10 0 5 5 0 0010 0z" />
                    </svg>
                    Add New Vendors
                  </>
                )}
              </h1>

              <button
                type="button"
                onClick={() => router.push("/supplier")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-200 text-gray-800 font-medium rounded-lg hover:bg-blue-400 transition"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>


            </div>

            {/* Subtitle */}
            <p className="text-gray-600 mt-2 text-lg">
              {isEditMode
                ? 'Update Vendors information and contact details'
                : 'Enter Vendors details to create a new entry'}
            </p>
          </div>


          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supplier Name */}
              <div className="space-y-2">
                <label htmlFor="CM_Company_Name" className="block text-sm font-semibold text-gray-700 flex items-center">
                  Company Name <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="CM_Company_Name"
                    name="CM_Company_Name"
                    value={supplier.CM_Company_Name}
                    onChange={handleChange}
                    onBlur={() => {
                      const n = supplier.CM_Company_Name?.trim();
                      if (n) {
                        setNameChecking(true);
                        void checkCompanyNameUnique(n);
                      }
                    }}
                    required
                    className={`block w-full pl-4 pr-12 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 ${fieldErrors.CM_Company_Name
                      ? 'border-red-300 ring-red-200'
                      : nameAvailable === true
                        ? 'border-green-300 ring-green-200'
                        : nameAvailable === false
                          ? 'border-red-300 ring-red-200'
                          : 'border-gray-300'
                      }`}
                    placeholder="Enter Vendors name"
                  />
                  {/* Status Icon */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {nameChecking ? (
                      <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : nameAvailable === true ? (
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : nameAvailable === false ? (
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-9a1 1 0 00-1 1v6a1 1 0 102 0V5a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : null}
                  </div>
                </div>
                {fieldErrors.CM_Company_Name && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.CM_Company_Name}</p>
                )}
              </div>

              {/* Vendors Code */}
              <div className="space-y-2">
                <label htmlFor="CM_Supplier_Code" className="block text-sm font-semibold text-gray-700">
                  Vendors Code
                </label>
                <input
                  type="text"
                  id="CM_Supplier_Code"
                  name="CM_Supplier_Code"
                  value={supplier.CM_Supplier_Code}
                  onChange={handleChange}
                  className="block w-full pl-4 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200"
                  placeholder="Auto-generated if empty"
                />
              </div>

              {/* Contact Person */}
              <div className="space-y-2">
                <label htmlFor="CM_Contact_Person" className="block text-sm font-semibold text-gray-700">
                  Contact Person
                </label>
                <input
                  type="text"
                  id="CM_Contact_Person"
                  name="CM_Contact_Person"
                  value={supplier.CM_Contact_Person}
                  onChange={handleChange}
                  className="block w-full pl-4 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200"
                  placeholder="Primary contact name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="CM_Email" className="block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="CM_Email"
                    name="CM_Email"
                    value={supplier.CM_Email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200"
                    placeholder="Vendors@example.com"
                  />
                </div>
                {fieldErrors.CM_Email && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.CM_Email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="CM_Phone_Number" className="block text-sm font-semibold text-gray-700 flex items-center">
                  Phone <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    id="CM_Phone_Number"
                    name="CM_Phone_Number"
                    value={supplier.CM_Phone_Number}
                    onChange={handleChange}
                    onBlur={() => {
                      const n = supplier.CM_Phone_Number?.trim();
                      if (n) {
                        setPhoneChecking(true);
                        void checkPhoneUnique(n);
                      }
                    }}
                    required
                    maxLength={10}
                    className={`block w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 ${fieldErrors.CM_Phone_Number
                      ? 'border-red-300'
                      : phoneAvailable === true
                        ? 'border-green-300'
                        : phoneAvailable === false
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    placeholder="9876543210"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {phoneChecking ? (
                      <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : phoneAvailable === true ? (
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : phoneAvailable === false ? (
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-9a1 1 0 00-1 1v6a1 1 0 102 0V5a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : null}
                  </div>
                </div>
                {fieldErrors.CM_Phone_Number && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.CM_Phone_Number}</p>
                )}
              </div>

              {/* Alternate Phone */}
              <div className="space-y-2">
                <label htmlFor="CM_Alternate_Phone" className="block text-sm font-semibold text-gray-700">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  id="CM_Alternate_Phone"
                  name="CM_Alternate_Phone"
                  value={supplier.CM_Alternate_Phone}
                  onChange={handleChange}
                  className="block w-full pl-4 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200"
                  placeholder="Secondary number"
                />
              </div>

              {/* GST Number */}
              <div className="space-y-2">
                <label htmlFor="CM_GST_Number" className="block text-sm font-semibold text-gray-700">
                  GST Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="CM_GST_Number"
                    name="CM_GST_Number"
                    value={supplier.CM_GST_Number}
                    onChange={handleChange}
                    onBlur={() => {
                      const n = supplier.CM_GST_Number?.trim().toUpperCase();
                      if (n) {
                        setGstChecking(true);
                        void checkGSTUnique(n);
                      }
                    }}
                    className={`block w-full pl-4 pr-12 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 uppercase ${fieldErrors.CM_GST_Number
                      ? 'border-red-300'
                      : gstAvailable === true
                        ? 'border-green-300'
                        : gstAvailable === false
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    placeholder="33AAAAA0000A1Z5"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {gstChecking ? (
                      <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : gstAvailable === true ? (
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : gstAvailable === false ? (
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-9a1 1 0 00-1 1v6a1 1 0 102 0V5a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : null}
                  </div>
                </div>
                {fieldErrors.CM_GST_Number && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.CM_GST_Number}</p>
                )}
              </div>

              {/* PAN Number */}
              <div className="space-y-2">
                <label htmlFor="CM_PAN_Number" className="block text-sm font-semibold text-gray-700">
                  PAN Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="CM_PAN_Number"
                    name="CM_PAN_Number"
                    value={supplier.CM_PAN_Number}
                    onChange={handleChange}
                    onBlur={() => {
                      const n = supplier.CM_PAN_Number?.trim().toUpperCase();
                      if (n) {
                        setPanChecking(true);
                        void checkPANUnique(n);
                      }
                    }}
                    className={`block w-full pl-4 pr-12 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 uppercase ${fieldErrors.CM_PAN_Number
                      ? 'border-red-300'
                      : panAvailable === true
                        ? 'border-green-300'
                        : panAvailable === false
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                    placeholder="AAAAA9999A"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {panChecking ? (
                      <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : panAvailable === true ? (
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : panAvailable === false ? (
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-9a1 1 0 00-1 1v6a1 1 0 102 0V5a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : null}
                  </div>
                </div>
                {fieldErrors.CM_PAN_Number && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.CM_PAN_Number}</p>
                )}
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <label htmlFor="CM_Payment_Terms" className="block text-sm font-semibold text-gray-700">
                  Payment Terms
                </label>
                <div className="relative">
                  <select
                    id="CM_Payment_Terms"
                    name="CM_Payment_Terms"
                    value={supplier.CM_Payment_Terms}
                    onChange={handleChange}
                    className="block w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="15 days">15 days</option>
                    <option value="30 days">30 days</option>
                    <option value="45 days">45 days</option>
                    <option value="60 days">60 days</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label htmlFor="CM_Is_Active" className="block text-sm font-semibold text-gray-700">
                  Status
                </label>
                <div className="relative">
                  <select
                    id="CM_Is_Active"
                    name="CM_Is_Active"
                    value={supplier.CM_Is_Active}
                    onChange={handleChange}
                    className="block w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="CM_Address" className="block text-sm font-semibold text-gray-700">
                  Address
                </label>
                <textarea
                  id="CM_Address"
                  name="CM_Address"
                  value={supplier.CM_Address}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full pl-4 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200"
                  placeholder="Full address with landmark"
                />
              </div>

              {/* District, State, Country, Postal Code */}
              {["District", "State", "Country", "Postal_Code"].map((field) => (
                <div key={field} className="space-y-2">
                  <label htmlFor={`CM_${field}`} className="block text-sm font-semibold text-gray-700">
                    {field.replace("_", " ")}
                  </label>
                  <input
                    type="text"
                    id={`CM_${field}`}
                    name={`CM_${field}`}
                    value={supplier[`CM_${field}`]}
                    onChange={handleChange}
                    className={`block w-full pl-4 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200`}
                    placeholder={field === "Postal_Code" ? "6-digit code" : `Enter ${field.replace("_", " ")}`}
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push('/supplier')}
                className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-70 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {isEditMode ? 'Update Supplier' : 'Create Supplier'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupplierForm;