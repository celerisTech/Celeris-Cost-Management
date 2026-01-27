// src/app/projects/components/ProjectViewTab/CustomerDetails.jsx

import React, { useEffect } from 'react';

export default function CustomerDetails({
  selectedProject,
  editCustomer,
  isEditing,
  handleCustomerChange,
  handleSaveCustomer,
  toggleEdit
}) {

  // Debug: Log when selectedProject changes
  useEffect(() => {
    console.log('CustomerDetails - selectedProject updated:', selectedProject);
  }, [selectedProject]);

  // Debug: Log when isEditing changes
  useEffect(() => {
    console.log('CustomerDetails - isEditing:', isEditing);
  }, [isEditing]);

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Customer Information
        </h2>

        {/* Button Group */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={toggleEdit}
              className="px-4 py-2 rounded-lg text-white font-medium text-sm sm:text-base bg-gray-500 hover:bg-gray-600 w-full sm:w-auto"
            >
              Cancel
            </button>
          )}
          <button
            onClick={isEditing ? handleSaveCustomer : toggleEdit}
            className={`px-4 py-2 rounded-lg text-white font-medium text-sm sm:text-base w-full sm:w-auto
            ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isEditing ? 'Save Changes' : 'Edit Customer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 text-gray-900">
        {/* Contact Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="CM_Customer_Name"
                  value={editCustomer?.CM_Customer_Name || ''}
                  onChange={handleCustomerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Maria García"
                />
              ) : (
                <p className="text-gray-900">{selectedProject?.CM_Customer_Name || '—'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  name="CM_Email"
                  value={editCustomer?.CM_Email || ''}
                  onChange={handleCustomerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. maria@example.com"
                />
              ) : (
                <p className="text-gray-900 break-all">{selectedProject?.CM_Email || '—'}</p>
              )}
            </div>

            {/* Primary Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Primary Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="CM_Phone_Number"
                  value={editCustomer?.CM_Phone_Number || ''}
                  onChange={handleCustomerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. +1 234 567 8900"
                />
              ) : (
                <p className="text-gray-900">{selectedProject?.CM_Phone_Number || '—'}</p>
              )}
            </div>

            {/* Alternate Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Alternate Phone (Optional)</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="CM_Alternate_Phone"
                  value={editCustomer?.CM_Alternate_Phone || ''}
                  onChange={handleCustomerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. +44 20 7946 0958"
                />
              ) : (
                <p className="text-gray-900">{selectedProject?.CM_Alternate_Phone || '—'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address & Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Address & Business Details</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            {/* Full Address */}
            <label className="block text-sm font-medium text-gray-600 mb-1">Full Address</label>
            {isEditing ? (
              <textarea
                name="CM_Address"
                value={editCustomer?.CM_Address || ''}
                onChange={handleCustomerChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Street, Building, Apartment, etc."
              />
            ) : (
              <p className="text-gray-900 leading-relaxed">{selectedProject?.CM_Address || '—'}</p>
            )}

            {/* Geo Fields */}
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <input
                  type="text"
                  name="CM_District"
                  value={editCustomer?.CM_District || ''}
                  onChange={handleCustomerChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City / District"
                />
                <input
                  type="text"
                  name="CM_State"
                  value={editCustomer?.CM_State || ''}
                  onChange={handleCustomerChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="State / Province"
                />
                <input
                  type="text"
                  name="CM_Country"
                  value={editCustomer?.CM_Country || ''}
                  onChange={handleCustomerChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Country"
                />
                <input
                  type="text"
                  name="CM_Postal_Code"
                  value={editCustomer?.CM_Postal_Code || ''}
                  onChange={handleCustomerChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Postal / ZIP Code"
                />
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                {(selectedProject?.CM_District || selectedProject?.CM_State || selectedProject?.CM_Country) && (
                  <p className="text-gray-900">
                    {[selectedProject.CM_District, selectedProject.CM_State, selectedProject.CM_Country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
                {selectedProject?.CM_Postal_Code && (
                  <p className="text-gray-900">{selectedProject.CM_Postal_Code}</p>
                )}
              </div>
            )}
          </div>

          {/* Tax IDs */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">GST Number (or equivalent)</label>
              {isEditing ? (
                <input
                  type="text"
                  name="CM_GST_Number"
                  value={editCustomer?.CM_GST_Number || ''}
                  onChange={handleCustomerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                />
              ) : (
                <p className="text-gray-900 break-all">{selectedProject?.CM_GST_Number || '—'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">PAN / Tax ID</label>
              {isEditing ? (
                <input
                  type="text"
                  name="CM_PAN_Number"
                  value={editCustomer?.CM_PAN_Number || ''}
                  onChange={handleCustomerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. ABCDE1234F"
                />
              ) : (
                <p className="text-gray-900 break-all">{selectedProject?.CM_PAN_Number || '—'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}