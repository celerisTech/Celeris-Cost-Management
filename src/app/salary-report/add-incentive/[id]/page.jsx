"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { useAuthStore } from '../../../store/useAuthScreenStore';
import toast from "react-hot-toast";

const AddIncentivePage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const incentiveId = searchParams.get("incentiveId");

  const { user } = useAuthStore();

  const laborId = params.id;
  const laborName = searchParams.get("name");

  // ADD DEBUG LOGS
  console.log("=== Page Load Debug ===");
  console.log("Labor ID:", laborId);
  console.log("Labor Name:", laborName);
  console.log("Incentive ID from URL:", incentiveId);
  console.log("All search params:", Object.fromEntries(searchParams.entries()));

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: '',
    description: ''
  });

  const incentiveTypes = [
    { value: 'Performance', label: 'Performance Bonus' },
    { value: 'Attendance', label: 'Attendance Bonus' },
    { value: 'Festival', label: 'Festival Bonus' },
    { value: 'Overtime', label: 'Overtime Pay' },
    { value: 'Special', label: 'Special Incentive' },
    { value: 'Other', label: 'Other' }
  ];

  // Save logged-in user info to localStorage once
  useEffect(() => {
    if (user?.CM_Company_ID && user?.CM_Full_Name) {
      localStorage.setItem("company_id", user.CM_Company_ID);
      localStorage.setItem("username", user.CM_Full_Name);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    if (!formData.date) {
      toast.error('Please select a date');
      return false;
    }
    if (!formData.type) {
      toast.error('Please select an incentive type');
      return false;
    }
    return true;
  };

  // FIXED: Fetch incentive data when incentiveId exists
  useEffect(() => {
    console.log("useEffect triggered - incentiveId:", incentiveId);

    if (!incentiveId) {
      console.log("No incentiveId - creating new incentive");
      // Reset form for new incentive
      setFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: '',
        description: ''
      });
      return;
    }

    const fetchIncentive = async () => {
      try {
        console.log("Fetching incentive with ID:", incentiveId);

        const companyId = localStorage.getItem("company_id");
        const headers = {
          'x-company-id': companyId
        };

        const res = await fetch(`/api/add-incentive?incentiveId=${incentiveId}`, {
          headers: headers
        });

        const data = await res.json();

        console.log("API Response:", data);

        if (res.ok && data.incentive) {
          console.log("Successfully loaded incentive:", data.incentive);
          setFormData({
            amount: data.incentive.CM_Incentive_Amount || '',
            date: data.incentive.CM_Incentive_Date || new Date().toISOString().split('T')[0],
            type: data.incentive.CM_Incentive_Type || '',
            description: data.incentive.CM_Description || ""
          });
        } else {
          console.error("Failed to load incentive:", data.error);
          toast.error("Failed to load incentive data");
        }
      } catch (err) {
        console.error("Load failed", err);
        toast.error("Error loading incentive data");
      }
    };

    fetchIncentive();
  }, [incentiveId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const companyId = localStorage.getItem("company_id");
    const username = localStorage.getItem("username");

    console.log("Submitting form:", {
      incentiveId,
      laborId,
      formData,
      companyId,
      username
    });

    setLoading(true);

    try {
      const url = incentiveId ? '/api/add-incentive?_method=PUT' : '/api/add-incentive';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-id': companyId,
          'x-username': username
        },
        body: JSON.stringify({
          incentiveId,
          laborId,
          amount: parseFloat(formData.amount),
          date: formData.date,
          type: formData.type,
          description: formData.description
        })
      });

      const data = await response.json();
      console.log("Submit response:", data);

      if (response.ok && data.success) {
        toast.success(
          incentiveId
            ? "Incentive updated successfully!"
            : "Incentive added successfully!"
        );
        router.back(); // Go back after success
      } else {
        throw new Error(data.error || 'Failed to save incentive');
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.message || 'Failed to save incentive');
    } finally {
      setLoading(false);
    }
  };

  // DELETE FUNCTION
  const handleDelete = async () => {
    if (!incentiveId) {
      toast.error("No incentive to delete");
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this incentive?\nThis action cannot be undone."
    );

    if (!confirmed) return;

    setDeleteLoading(true);

    try {
      const companyId = localStorage.getItem("company_id");

      const response = await fetch(`/api/add-incentive?incentiveId=${incentiveId}&_method=DELETE`, {
        method: 'POST',
        headers: {
          'x-company-id': companyId
        }
      });

      const data = await response.json();
      console.log("Delete response:", data);

      if (response.ok && data.success) {
        toast.success("Incentive deleted successfully!");
        router.back(); // Go back after deletion
      } else {
        throw new Error(data.error || 'Failed to delete incentive');
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || 'Failed to delete incentive');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <Navbar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {incentiveId ? 'Edit Incentive' : 'Add Incentive'}
            </h1>
            <p className="mt-2 text-gray-600">
              {incentiveId ? 'Edit' : 'Add'} incentive for Employee:
              <span className="font-medium text-indigo-600 ml-1">{laborName}</span>
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg shadow-sm transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-2xl mx-auto">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Incentive Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">Incentive Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select Type</option>
                {incentiveTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-gray-400">(Optional)</span></label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Enter any additional notes..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 inline-flex items-center justify-center px-4 py-2.5 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  } text-white font-medium rounded-lg shadow-sm transition-all`}
              >
                {loading
                  ? 'Saving...'
                  : incentiveId
                    ? 'Update Incentive'
                    : 'Add Incentive'
                }
              </button>

              {/* Delete Button - Only show when editing */}
              {incentiveId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className={`px-6 py-2.5 ${deleteLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                    } text-white font-medium rounded-lg transition-all flex items-center`}
                >
                  {deleteLoading ? (
                    'Deleting...'
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading || deleteLoading}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddIncentivePage;