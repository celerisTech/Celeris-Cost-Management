// src/app/projects/components/ProjectViewTab/ProjectDetails.jsx

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import MapPicker with no SSR
const MapPicker = dynamic(() => import("../steps/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});

export default function ProjectDetails({
  selectedProject,
  isEditing,
  editProject,
  handleProjectChange,
  handleSaveProject,
  toggleEdit,
  formatDate,
  formatCurrency,
  toDateInputValue,
  engineers
}) {

  // Handler for map coordinate selection
  const handleMapSelect = (latitude, longitude) => {
    console.log('📍 Map coordinates selected:', { latitude, longitude });

    // Update latitude
    const latEvent = {
      target: {
        name: 'CM_Latitude',
        value: latitude.toString()
      }
    };
    handleProjectChange(latEvent);

    // Update longitude
    const lngEvent = {
      target: {
        name: 'CM_Longitude',
        value: longitude.toString()
      }
    };
    handleProjectChange(lngEvent);
  };

  // Handle radius change from map (optional - if you want to control radius from map)
  const handleRadiusChange = (radius) => {
    const radiusEvent = {
      target: {
        name: 'CM_Radius_Meters',
        value: radius.toString()
      }
    };
    handleProjectChange(radiusEvent);
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8 text-black">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Project Information
        </h2>

        {/* Button Group */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={toggleEdit}
              className="px-4 py-2 rounded-lg text-white font-medium text-sm sm:text-base bg-gray-500 hover:bg-gray-600 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
          <button
            onClick={isEditing ? handleSaveProject : toggleEdit}
            className={`px-4 py-2 rounded-lg text-white font-medium text-sm sm:text-base w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-offset-2
            ${isEditing
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`}
          >
            {isEditing ? 'Save Changes' : 'Edit Project'}
          </button>
        </div>
      </div>

      {/* Map Section – Edit Mode Only */}
      {isEditing && (
        <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-2">📍 Project Location on Map</h3>
          <p className="text-gray-600 mb-4">
            Click or drag the marker to set the project location. Coordinates will update automatically.
          </p>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <MapPicker
              lat={editProject.CM_Latitude || null}
              lng={editProject.CM_Longitude || null}
              radius={editProject.CM_Radius_Meters || 150}
              onSelect={handleMapSelect}
            />

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-1">Latitude</p>
                <p className="text-lg font-mono font-bold text-blue-900">
                  {editProject.CM_Latitude
                    ? parseFloat(editProject.CM_Latitude).toFixed(6)
                    : '—'}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-1">Longitude</p>
                <p className="text-lg font-mono font-bold text-blue-900">
                  {editProject.CM_Longitude
                    ? parseFloat(editProject.CM_Longitude).toFixed(6)
                    : '—'}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-1">Radius</p>
                <p className="text-lg font-mono font-bold text-blue-900">
                  {editProject.CM_Radius_Meters || 150} m
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                <span className="font-medium">✓ Synced:</span> Map interactions auto-update coordinates below.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Basic Details */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Details</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="CM_Project_Name" className="block text-sm font-medium text-gray-600 mb-1">
                Project Name
              </label>
              {isEditing ? (
                <input
                  id="CM_Project_Name"
                  type="text"
                  name="CM_Project_Name"
                  value={editProject.CM_Project_Name || ''}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Riverfront Development"
                />
              ) : (
                <p className="text-gray-900">{selectedProject.CM_Project_Name || '—'}</p>
              )}
            </div>

            <div>
              <label htmlFor="CM_Project_Code" className="block text-sm font-medium text-gray-600 mb-1">
                Project Code
              </label>
              {isEditing ? (
                <input
                  id="CM_Project_Code"
                  type="text"
                  name="CM_Project_Code"
                  value={editProject.CM_Project_Code || ''}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. PROJ-2025-01"
                />
              ) : (
                <p className="text-gray-900">{selectedProject.CM_Project_Code || '—'}</p>
              )}
            </div>

            <div>
              <label htmlFor="CM_Project_Leader_ID" className="block text-sm font-medium text-gray-600 mb-1">
                Project Leader
              </label>
              {isEditing ? (
                <select
                  id="CM_Project_Leader_ID"
                  name="CM_Project_Leader_ID"
                  value={editProject.CM_Project_Leader_ID || ''}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select team member</option>
                  {engineers.map((engineer) => (
                    <option key={engineer.CM_User_ID} value={engineer.CM_User_ID}>
                      {engineer.CM_Full_Name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">{selectedProject.Project_Leader_Name || '—'}</p>
              )}
            </div>

            <div>
              <label htmlFor="CM_Project_Location" className="block text-sm font-medium text-gray-600 mb-1">
                Location Name
              </label>
              {isEditing ? (
                <input
                  id="CM_Project_Location"
                  type="text"
                  name="CM_Project_Location"
                  value={editProject.CM_Project_Location || ''}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Berlin, Germany"
                />
              ) : (
                <p className="text-gray-900">{selectedProject.CM_Project_Location || '—'}</p>
              )}
            </div>

            <div>
              <label htmlFor="CM_Status" className="block text-sm font-medium text-gray-600 mb-1">
                Status
              </label>
              {isEditing ? (
                <select
                  id="CM_Status"
                  name="CM_Status"
                  value={editProject.CM_Status || ''}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              ) : (
                <p className="text-gray-900">
                  {selectedProject.CM_Project_Status || selectedProject.CM_Status || '—'}
                </p>
              )}
            </div>
            {/* NEW: Project Type field - add this here */}
            <div>
              <label htmlFor="CM_Project_Type" className="block text-sm font-medium text-gray-600 mb-1">
                Project Type
              </label>
              {isEditing ? (
                <select
                  id="CM_Project_Type"
                  name="CM_Project_Type"
                  value={editProject.CM_Project_Type || ''}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select project type</option>
                  <option value="Others">Others</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Application">Mobile Application</option>
                  <option value="Web Application">Web Application</option>
                </select>
              ) : (
                <p className="text-gray-900">{selectedProject.CM_Project_Type || '—'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Schedule, Financials, Location, Description */}
        <div className="space-y-6 lg:col-span-2">
          {/* Schedule */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="CM_Planned_Start_Date" className="block text-sm font-medium text-gray-600 mb-1">
                  Planned Start
                </label>
                {isEditing ? (
                  <input
                    id="CM_Planned_Start_Date"
                    type="date"
                    name="CM_Planned_Start_Date"
                    value={toDateInputValue(editProject.CM_Planned_Start_Date) || ''}
                    onChange={handleProjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formatDate(selectedProject.CM_Planned_Start_Date) || '—'}</p>
                )}
              </div>
              <div>
                <label htmlFor="CM_Planned_End_Date" className="block text-sm font-medium text-gray-600 mb-1">
                  Planned End
                </label>
                {isEditing ? (
                  <input
                    id="CM_Planned_End_Date"
                    type="date"
                    name="CM_Planned_End_Date"
                    value={toDateInputValue(editProject.CM_Planned_End_Date) || ''}
                    onChange={handleProjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formatDate(selectedProject.CM_Planned_End_Date) || '—'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Financials */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="CM_Estimated_Cost" className="block text-sm font-medium text-gray-600 mb-1">
                  Estimated Budget
                </label>
                {isEditing ? (
                  <input
                    id="CM_Estimated_Cost"
                    type="number"
                    name="CM_Estimated_Cost"
                    value={editProject.CM_Estimated_Cost || ''}
                    onChange={handleProjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                ) : (
                  <p className="text-gray-900">{formatCurrency(selectedProject.CM_Estimated_Cost) || '—'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Details (Manual Entry) */}
          <div className="bg-gray-50 p-4 sm:p-5 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Coordinates</h3>

            <div className="space-y-4">
              {/* Latitude */}
              <div>
                <label htmlFor="CM_Latitude" className="block text-sm font-medium text-gray-600 mb-1">
                  Latitude (±90)
                </label>
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="CM_Latitude"
                      type="number"
                      step="0.000001"
                      name="CM_Latitude"
                      value={editProject.CM_Latitude || ''}
                      onChange={handleProjectChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 52.5200"
                      min="-90"
                      max="90"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => handleProjectChange({
                              target: { name: 'CM_Latitude', value: pos.coords.latitude.toString() }
                            }),
                            () => alert('Location access denied or unavailable')
                          );
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      title="Use current location"
                    >
                      Use My Location
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-900">{selectedProject.CM_Latitude || '—'}</p>
                )}
              </div>

              {/* Longitude */}
              <div>
                <label htmlFor="CM_Longitude" className="block text-sm font-medium text-gray-600 mb-1">
                  Longitude (±180)
                </label>
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="CM_Longitude"
                      type="number"
                      step="0.000001"
                      name="CM_Longitude"
                      value={editProject.CM_Longitude || ''}
                      onChange={handleProjectChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 13.4050"
                      min="-180"
                      max="180"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => handleProjectChange({
                              target: { name: 'CM_Longitude', value: pos.coords.longitude.toString() }
                            }),
                            () => alert('Location access denied or unavailable')
                          );
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      title="Use current location"
                    >
                      Use My Location
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-900">{selectedProject.CM_Longitude || '—'}</p>
                )}
              </div>

              {/* Radius */}
              <div>
                <label htmlFor="CM_Radius_Meters" className="block text-sm font-medium text-gray-600 mb-1">
                  Service Radius
                </label>
                {isEditing ? (
                  <input
                    id="CM_Radius_Meters"
                    type="number"
                    name="CM_Radius_Meters"
                    value={editProject.CM_Radius_Meters || ''}
                    onChange={handleProjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 200"
                    min="0"
                  />
                ) : (
                  <p className="text-gray-900">
                    {selectedProject.CM_Radius_Meters ? `${selectedProject.CM_Radius_Meters} m` : '—'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {isEditing ? (
                <textarea
                  name="CM_Description"
                  value={editProject.CM_Description || ''}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe the project scope, goals, or notes..."
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedProject.CM_Description || '—'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}