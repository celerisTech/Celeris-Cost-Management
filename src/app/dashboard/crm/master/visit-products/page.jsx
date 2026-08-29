"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";

const COLORS = [
  { name: "Blue", value: "blue" },
  { name: "Emerald", value: "emerald" },
  { name: "Red", value: "red" },
  { name: "Amber", value: "amber" },
  { name: "Indigo", value: "indigo" },
  { name: "Purple", value: "purple" },
  { name: "Pink", value: "pink" },
  { name: "Teal", value: "teal" },
  { name: "Cyan", value: "cyan" },
  { name: "Fuchsia", value: "fuchsia" },
  { name: "Slate", value: "slate" },
];

export default function VisitProductsMasterPage({ onClose }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    Product_ID: null,
    Product_Name: "",
    Color_Code: "blue",
    Is_Active: 1,
    cascadeUpdate: false
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master/visit-products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      } else {
        toast.error("Failed to load products");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Product_Name.trim()) {
      toast.error("Product Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = !!formData.Product_ID;
      const res = await fetch("/api/master/visit-products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Product ${isEdit ? "updated" : "created"} successfully`);
        setIsModalOpen(false);
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to save product");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the product "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/master/visit-products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setFormData({
        Product_ID: product.Product_ID,
        Product_Name: product.Product_Name,
        Color_Code: product.Color_Code || "blue",
        Is_Active: product.Is_Active,
        cascadeUpdate: false
      });
    } else {
      setFormData({
        Product_ID: null,
        Product_Name: "",
        Color_Code: "blue",
        Is_Active: 1,
        cascadeUpdate: false
      });
    }
    setIsModalOpen(true);
  };

  const getBadgeClass = (color) => {
    return `bg-${color}-100 text-${color}-700 border-${color}-200 border px-3 py-1 rounded-full text-xs font-bold`;
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4 text-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Plus size={22} className="text-indigo-600" />
            Visit Products Master
          </h1>
          <p className="text-xs text-gray-500">Manage the dropdown options for Visit Products</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-2 text-gray-500 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-sm hover:bg-blue-700 transition-colors shadow-sm font-bold text-xs"
          >
            <Plus size={16} /> Add Product
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm font-bold text-xs"
            >
              Close & Return
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#eef2ff] text-blue-700 border-b border-gray-200">
                <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider w-20 border border-slate-200 text-blue-700 text-center">ID</th>
                <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-slate-200 text-blue-700">Product Name</th>
                <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-slate-200 text-blue-700 w-44">Badge Preview</th>
                <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-slate-200 text-blue-700 w-32 text-center">State</th>
                <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-slate-200 text-blue-700 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 border border-slate-200">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 border border-slate-200">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    No products found. Click "Add Product" to create one.
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => (
                  <tr key={product.Product_ID} className={`hover:bg-blue-50/20 transition-colors border border-slate-200 ${idx % 2 === 0 ? 'bg-[#f4f7ff]/50' : 'bg-white'}`}>
                    <td className="px-4 py-2 text-xs font-semibold text-gray-500 text-center border border-slate-200">#{product.Product_ID}</td>
                    <td className="px-4 py-2 text-sm font-bold text-gray-800 border border-slate-200 truncate">{product.Product_Name}</td>
                    <td className="px-4 py-2 border border-slate-200">
                      <span className={getBadgeClass(product.Color_Code)}>{product.Product_Name}</span>
                    </td>
                    <td className="px-4 py-2 border border-slate-200 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold border ${product.Is_Active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {product.Is_Active ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        {product.Is_Active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-2 border border-slate-200 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => openModal(product)}
                          className="w-7 h-7 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all hover:scale-105 shadow-sm"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.Product_ID, product.Product_Name)}
                          className="w-7 h-7 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-all hover:scale-105 shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-800 text-white">
              <h2 className="text-sm font-bold flex items-center gap-2">
                {formData.Product_ID ? "Edit Visit Product" : "Create Visit Product"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1.5 rounded-sm transition-colors">
                <X size={16} className="text-white" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.Product_Name}
                  onChange={(e) => setFormData({ ...formData, Product_Name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="e.g. ERP System"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Badge Color</label>
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, Color_Code: color.value })}
                      title={color.name}
                      className={`h-7 rounded-sm border flex items-center justify-center transition-all ${
                        formData.Color_Code === color.value 
                          ? `bg-${color.value}-100 border-${color.value}-400 ring-2 ring-${color.value}-500/20` 
                          : `bg-${color.value}-50 border-${color.value}-200 hover:bg-${color.value}-100`
                      }`}
                    >
                      {formData.Color_Code === color.value && <CheckCircle2 size={12} className={`text-${color.value}-600`} />}
                    </button>
                  ))}
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <span className="text-xs text-gray-500">Preview:</span>
                  <span className={getBadgeClass(formData.Color_Code)}>{formData.Product_Name || "Product Preview"}</span>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="flex items-center gap-3 cursor-pointer p-2.5 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.Is_Active === 1}
                      onChange={(e) => setFormData({ ...formData, Is_Active: e.target.checked ? 1 : 0 })}
                    />
                    <div className={`block w-9 h-5 rounded-full transition-colors ${formData.Is_Active ? "bg-emerald-500" : "bg-gray-300"}`}></div>
                    <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${formData.Is_Active ? "transform translate-x-4" : ""}`}></div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-700">Active Product</div>
                    <div className="text-[11px] text-gray-500">Available to select in dropdowns</div>
                  </div>
                </label>
              </div>

              {formData.Product_ID && (
                <div className="space-y-1">
                  <label className="flex items-center gap-3 cursor-pointer p-2.5 border border-amber-200 bg-amber-50/30 rounded-sm hover:bg-amber-50/50 transition-colors">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 text-amber-600 rounded-sm border-amber-300 focus:ring-amber-500"
                      checked={formData.cascadeUpdate}
                      onChange={(e) => setFormData({ ...formData, cascadeUpdate: e.target.checked })}
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-800">Update Existing Records</div>
                      <div className="text-[11px] text-amber-600">Update past visits that used this product name</div>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-sm hover:bg-gray-50 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] flex justify-center items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold rounded-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 text-xs"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
