"use client";
import React from "react";
import { useState } from "react";
import { FiPlus, FiSearch, FiTrash2, FiDownload } from "react-icons/fi";


const HeaderBar = ({
  searchTerm,
  setSearchTerm,
  exportToExcel,
  exportToPDF,
  handleAddSupplier,
  selectedIds,
  suppliers,          // <-- correct name
  allCount = 0,
  selectedCount = 0,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 md:mb-6 gap-3">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Vendors Management</h1>
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search Vendors..."
            className="pl-10 pr-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
          />
        </div>
        {/* Download Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center justify-between w-33 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm font-semibold shadow-blue-500/25"
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Download Dropdown */}
          {showMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 ring-opacity-5 z-20 min-w-[200px] overflow-hidden">
              {/* All Vendors */}
              <button
                onClick={() => { setShowMenu(false); exportToExcel('all'); }}
                className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-all group border-b border-slate-100"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">All Vendors (Excel)</div>
                  <div className="text-xs text-slate-500">{suppliers.length} items</div>
                </div>
              </button>

              <button
                onClick={() => { setShowMenu(false); exportToPDF('all'); }}
                className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all group border-b border-slate-100"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">All Vendors (PDF)</div>
                  <div className="text-xs text-slate-500">{suppliers.length} items</div>
                </div>
              </button>

              {/* Divider */}
              {selectedIds.size > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-medium text-slate-500 bg-slate-50 border-y border-slate-200">
                    Selected ({selectedIds.size})
                  </div>

                  <button
                    onClick={() => { setShowMenu(false); exportToExcel('selected'); }}
                    className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-all group border-b border-slate-100"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-green-200 rounded-lg mr-3 group-hover:bg-green-300">
                      <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Selected Vendors (Excel)</div>
                      <div className="text-xs text-slate-500">{selectedIds.size} items</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowMenu(false); exportToPDF('selected'); }}
                    className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-red-200 rounded-lg mr-3 group-hover:bg-red-300">
                      <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Selected Vendors (PDF)</div>
                      <div className="text-xs text-slate-500">{selectedIds.size} items</div>
                    </div>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleAddSupplier}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md whitespace-nowrap flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
        >
          <FiPlus size={18} /> <span>Add Vendors</span>
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;
