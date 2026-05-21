"use client";
import React from "react";
import { FiEdit2, FiChevronDown, FiChevronUp, FiTrash2, FiCheckCircle, FiXCircle, FiChevronLeft, FiChevronRight, FiMoreVertical } from "react-icons/fi";
import { FaEnvelope, FaUser, FaPhoneAlt } from "react-icons/fa";

const SupplierTable = ({
  pagedSuppliers,
  selectedIds,
  toggleSelectAllVisible,
  toggleSelectOne,
  toggleStatus,
  handleEditClick,
  toggleExpandCard,
  expandedCard,
  startIdx,
  pageSize,
  total,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  toggleSort,
  sortBy,
  onDelete,
}) => {
  // Responsive columns configuration
  const columns = [
    { key: "CM_Company_Name", label: "Vendors", minWidth: "sm" },
    { key: "CM_Contact_Person", label: "Contact", minWidth: "lg" },
    { key: "CM_Phone_Number", label: "Phone", minWidth: "md" },
    { key: "CM_Email", label: "Email", minWidth: "lg" },
    { key: "CM_Is_Active", label: "Status", minWidth: "sm" },
    { key: "CM_Payment_Terms", label: "Payment Terms", minWidth: "xl" },
    { key: "CM_Created_At", label: "Created", minWidth: "xl" },
  ];

  // Mobile card view for each supplier
  const MobileCardView = ({ supplier }) => {
    const s = supplier;
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-00 mb-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.has(s.CM_Supplier_ID)}
              onChange={() => toggleSelectOne(s.CM_Supplier_ID)}
              className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
            />
            <div>
              <h3 className="font-semibold text-gray-900 text-base">{s.CM_Company_Name}</h3>
              {s.CM_Address && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{s.CM_Address}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEditClick(s)}
              className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 transition-all duration-200 shadow-sm"
              title="Edit"
            >
              <FiEdit2 size={16} />
            </button>
            <button
              onClick={() => toggleExpandCard(s.CM_Supplier_ID)}
              className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 hover:scale-105 transition-all duration-200 shadow-sm"
              title="Details"
            >
              {expandedCard === s.CM_Supplier_ID ? (
                <FiChevronUp size={16} />
              ) : (
                <FiChevronDown size={16} />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <FaUser size={10} />
              <span>Contact</span>
            </div>
            <div className="font-medium text-gray-900">{s.CM_Contact_Person || "-"}</div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-500 text-xs">Status</div>
            <div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm transition-colors ${s.CM_Is_Active === "Active"
                    ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                    : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                  }`}
              >
                {s.CM_Is_Active === "Active" ? (
                  <FiCheckCircle size={12} />
                ) : (
                  <FiXCircle size={12} />
                )}
                {s.CM_Is_Active || "Unknown"}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <FaPhoneAlt size={10} />
              <span>Phone</span>
            </div>
            <div className="font-medium text-gray-900">{s.CM_Phone_Number || "-"}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <FaEnvelope size={10} />
              <span>Email</span>
            </div>
            <div className="font-medium text-gray-900 truncate max-w-[150px]">{s.CM_Email || "-"}</div>
          </div>
        </div>

        {expandedCard === s.CM_Supplier_ID && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">District</span>
                <div className="font-medium">{s.CM_District || "-"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">State</span>
                <div className="font-medium">{s.CM_State || "-"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">Country</span>
                <div className="font-medium">{s.CM_Country || "-"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">Postal Code</span>
                <div className="font-medium">{s.CM_Postal_Code || "-"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">GST</span>
                <div className="font-medium font-mono text-sm">{s.CM_GST_Number || "-"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">PAN</span>
                <div className="font-medium font-mono text-sm">{s.CM_PAN_Number || "-"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">Payment Terms</span>
                <div className="font-medium">{s.CM_Payment_Terms || "-"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">Created</span>
                <div className="font-medium">
                  {s.CM_Created_At
                    ? new Date(s.CM_Created_At).toLocaleDateString()
                    : "-"}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              Last updated:{" "}
              {new Date(
                s.CM_Uploaded_At || s.CM_Created_At
              ).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100/80 backdrop-blur-sm sticky top-0 z-10">
            <tr>
              <th className="pl-6 pr-4 py-4">
                <input
                  type="checkbox"
                  onChange={toggleSelectAllVisible}
                  checked={
                    pagedSuppliers.length > 0 &&
                    pagedSuppliers.every((s) =>
                      selectedIds.has(s.CM_Supplier_ID)
                    )
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-4 text-left text-sm font-semibold text-gray-700 tracking-wide cursor-pointer transition-colors  hover:bg-gray-200/50 ${col.minWidth === 'xl' ? 'hidden xl:table-cell' : ''} ${col.minWidth === 'lg' ? 'hidden lg:table-cell' : ''} ${col.minWidth === 'md' ? 'hidden md:table-cell' : ''}`}
                  onClick={() => toggleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortBy.field === col.key && (
                      <span className="text-blue-600 transition-transform">
                        {sortBy.dir === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {pagedSuppliers.map((s) => (
              <React.Fragment key={s.CM_Supplier_ID}>
                <tr
                  className={`hover:bg-blue-50/30 transition-all duration-200 ease-in-out group ${expandedCard === s.CM_Supplier_ID ? 'bg-blue-50/50' : ''
                    }`}
                >
                  {/* Checkbox */}
                  <td className="pl-6 pr-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(s.CM_Supplier_ID)}
                      onChange={() => toggleSelectOne(s.CM_Supplier_ID)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition group-hover:border-blue-300"
                    />
                  </td>

                  {/* Supplier */}
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-500 transition-colors">
                      {s.CM_Company_Name}
                    </div>
                    {s.CM_Supplier_Code && (
                      <div className="text-sm text-gray-500 mt-1 truncate max-w-[220px] md:max-w-[280px]">
                        {s.CM_Supplier_Code}
                      </div>
                    )}
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-4 text-gray-700 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <FaUser className="text-gray-400" size={12} />
                      {s.CM_Contact_Person || "-"}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-4 text-gray-700 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <FaPhoneAlt className="text-gray-400" size={12} />
                      {s.CM_Phone_Number || "-"}
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-4 text-gray-700 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-gray-400" size={12} />
                      <span className="truncate max-w-[180px]">{s.CM_Email || "-"}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all hover:scale-105 ${s.CM_Is_Active === "Active"
                          ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                          : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        }`}
                    >
                      {s.CM_Is_Active === "Active" ? (
                        <FiCheckCircle size={14} />
                      ) : (
                        <FiXCircle size={14} />
                      )}
                      {s.CM_Is_Active || "Unknown"}
                    </span>
                  </td>

                  {/* Payment Terms */}
                  <td className="px-4 py-4 text-gray-700 hidden xl:table-cell">
                    {s.CM_Payment_Terms || "-"}
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-4 text-gray-700 hidden xl:table-cell">
                    <div className="text-sm">
                      {s.CM_Created_At
                        ? new Date(s.CM_Created_At).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                        : "-"}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(s)}
                        className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 hover:shadow-md transition-all duration-200 group/btn"
                        title="Edit"
                      >
                        <FiEdit2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => toggleExpandCard(s.CM_Supplier_ID)}
                        className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 hover:scale-105 hover:shadow-md transition-all duration-200 group/btn"
                        title="Details"
                      >
                        {expandedCard === s.CM_Supplier_ID ? (
                          <FiChevronUp size={16} className="group-hover/btn:scale-110 transition-transform" />
                        ) : (
                          <FiChevronDown size={16} className="group-hover/btn:scale-110 transition-transform" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedCard === s.CM_Supplier_ID && (
                  <tr className="bg-gradient-to-r from-blue-50/30 to-blue-50/10 animate-fadeIn">
                    <td colSpan={9} className="px-8 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700">
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-500 text-xs font-medium">Address</span>
                            <div className="font-semibold mt-1">{s.CM_Address || "-"}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs font-medium">District</span>
                            <div className="font-semibold mt-1">{s.CM_District || "-"}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs font-medium">State</span>
                            <div className="font-semibold mt-1">{s.CM_State || "-"}</div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-500 text-xs font-medium">Country</span>
                            <div className="font-semibold mt-1">{s.CM_Country || "-"}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs font-medium">Postal Code</span>
                            <div className="font-semibold mt-1">{s.CM_Postal_Code || "-"}</div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-500 text-xs font-medium">GST Number</span>
                            <div className="font-semibold font-mono text-sm mt-1">{s.CM_GST_Number || "-"}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs font-medium">PAN Number</span>
                            <div className="font-semibold font-mono text-sm mt-1">{s.CM_PAN_Number || "-"}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden px-4 py-4">
        {pagedSuppliers.map((supplier) => (
          <MobileCardView key={supplier.CM_Supplier_ID} supplier={supplier} />
        ))}
      </div>

      {/* Pagination - enhanced design */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t bg-gray-50/50 gap-3">
        <div className="text-sm text-gray-600 font-medium">
          Showing <span className="text-gray-900">{startIdx + 1}-{Math.min(startIdx + pageSize, total)}</span> of <span className="text-gray-900">{total}</span> suppliers
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={onPrevPage}
            className={`p-2.5 rounded-xl border border-gray-300 transition-all duration-200 ${currentPage <= 1
                ? "opacity-40 cursor-not-allowed bg-gray-100"
                : "hover:bg-white hover:border-gray-400 hover:shadow-md active:scale-95"
              }`}
          >
            <FiChevronLeft className="text-gray-600" />
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={onNextPage}
            className={`p-2.5 rounded-xl border border-gray-300 transition-all duration-200 ${currentPage >= totalPages
                ? "opacity-40 cursor-not-allowed bg-gray-100"
                : "hover:bg-white hover:border-gray-400 hover:shadow-md active:scale-95"
              }`}
          >
            <FiChevronRight className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierTable;