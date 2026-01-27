"use client";
import React from "react";

const SummaryCards = ({
  totalSuppliers,
  activeSuppliers,
  inactiveSuppliers,
  statusFilter,
  handleStatusFilter,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
      <div
        className={`bg-white rounded-lg shadow-sm p-3 md:p-4 cursor-pointer transition-all hover:shadow-md border ${
          statusFilter === "all" ? "border-blue-500" : "border-gray-200"
        }`}
        onClick={() => handleStatusFilter("all")}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-600">Total Vendors</h3>
        </div>
        <p className="text-xl md:text-2xl font-bold text-gray-800 mt-2">{totalSuppliers}</p>
      </div>

      <div
        className={`bg-white rounded-lg shadow-sm p-3 md:p-4 cursor-pointer transition-all hover:shadow-md border ${
          statusFilter === "active" ? "border-green-500" : "border-gray-200"
        }`}
        onClick={() => handleStatusFilter("active")}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-600">Active Vendors</h3>
        </div>
        <p className="text-xl md:text-2xl font-bold text-green-600 mt-2">{activeSuppliers}</p>
      </div>

      <div
        className={`bg-white rounded-lg shadow-sm p-3 md:p-4 cursor-pointer transition-all hover:shadow-md border ${
          statusFilter === "inactive" ? "border-red-500" : "border-gray-200"
        }`}
        onClick={() => handleStatusFilter("inactive")}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-600">Inactive Vendors</h3>
        </div>
        <p className="text-xl md:text-2xl font-bold text-red-600 mt-2">{inactiveSuppliers}</p>
      </div>
    </div>
  );
};

export default SummaryCards;
