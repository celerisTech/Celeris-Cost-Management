"use client";

import React, { useEffect, useMemo, useState } from "react";

export default function UsagePage() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    CM_project_id: "",
    CM_product_id: "",
    CM_quantity: 0,
    CM_unit_price: 0,
    CM_total_amount: "", // optional, auto = qty * price
    CM_usage_date: "",
    CM_created_by: "",
  });

  const required = useMemo(
    () => ["CM_project_id", "CM_product_id", "CM_quantity", "CM_unit_price", "CM_usage_date", "CM_created_by"],
    []
  );

  const validate = () => {
    const errs = [];
    required.forEach((k) => {
      if (form[k] === "" || form[k] === null || form[k] === undefined) errs.push(`${k} is required`);
    });
    if (Number(form.CM_quantity) < 0) errs.push("CM_quantity must be >= 0");
    if (Number(form.CM_unit_price) < 0) errs.push("CM_unit_price must be >= 0");
    return errs;
  };

  async function load() {
    try {
      setLoading(true);
      const [usageRes, prodRes] = await Promise.all([
        fetch("/api/usage", { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }),
      ]);
      const usageData = await usageRes.json();
      const prodData = await prodRes.json();
      setItems(Array.isArray(usageData.items) ? usageData.items : []);
      setProducts(Array.isArray(prodData.items) ? prodData.items : []);
      setError("");
    } catch (e) {
      setError("Failed to load usage or products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (errs.length) {
      setError(errs.join("; "));
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const qty = Number(form.CM_quantity);
      const price = Number(form.CM_unit_price);
      const res = await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CM_project_id: Number(form.CM_project_id),
          CM_product_id: Number(form.CM_product_id),
          CM_quantity: qty,
          CM_unit_price: price,
          CM_total_amount: form.CM_total_amount !== "" ? Number(form.CM_total_amount) : undefined,
          CM_usage_date: form.CM_usage_date,
          CM_created_by: Number(form.CM_created_by),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.errors?.join?.(", ") || "Failed to create usage entry");
      setForm({ CM_project_id: "", CM_product_id: "", CM_quantity: 0, CM_unit_price: 0, CM_total_amount: "", CM_usage_date: "", CM_created_by: "" });
      await load();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedProduct = products.find((p) => String(p.CM_product_id) === String(form.CM_product_id));
  const computedTotal = Number(form.CM_quantity || 0) * Number(form.CM_unit_price || 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Product Usage</h1>
        <p className="text-sm text-gray-600">Record daily material usage</p>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {/* Create form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-100 bg-white/80 backdrop-blur-sm p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Project ID*</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 text-sm" value={form.CM_project_id} onChange={(e) => setForm({ ...form, CM_project_id: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Product*</label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.CM_product_id} onChange={(e) => setForm({ ...form, CM_product_id: e.target.value, CM_unit_price: selectedProduct ? selectedProduct.CM_price : form.CM_unit_price })}>
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.CM_product_id} value={p.CM_product_id}>
                  {p.CM_name} (₹{Number(p.CM_price).toLocaleString("en-IN", { maximumFractionDigits: 2 })})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Quantity*</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 text-sm" value={form.CM_quantity} onChange={(e) => setForm({ ...form, CM_quantity: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Unit Price*</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 text-sm" value={form.CM_unit_price} onChange={(e) => setForm({ ...form, CM_unit_price: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Total Amount (auto)</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 text-sm" value={form.CM_total_amount !== "" ? form.CM_total_amount : computedTotal} onChange={(e) => setForm({ ...form, CM_total_amount: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Usage Date*</label>
            <input type="date" className="w-full rounded-md border px-3 py-2 text-sm" value={form.CM_usage_date} onChange={(e) => setForm({ ...form, CM_usage_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Created By (User ID)*</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 text-sm" value={form.CM_created_by} onChange={(e) => setForm({ ...form, CM_created_by: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={submitting} className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? "Saving..." : "Save Usage"}
          </button>
          <button type="button" onClick={() => setForm({ CM_project_id: "", CM_product_id: "", CM_quantity: 0, CM_unit_price: 0, CM_total_amount: "", CM_usage_date: "", CM_created_by: "" })} className="text-sm text-gray-600 hover:underline">
            Reset
          </button>
        </div>
      </form>

      {/* List */}
      <div className="rounded-xl border border-gray-100 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold tracking-tight">Daily Usage</h3>
          <span className="text-xs text-gray-500">{items.length} entries</span>
        </div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Project</th>
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2 pr-4">Unit Price</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it) => (
                  <tr key={it.CM_usage_id} className="hover:bg-gray-50/50">
                    <td className="py-2 pr-4">{it.CM_usage_date}</td>
                    <td className="py-2 pr-4">{it.CM_project_id}</td>
                    <td className="py-2 pr-4">{it.CM_product_id}</td>
                    <td className="py-2 pr-4">{it.CM_quantity}</td>
                    <td className="py-2 pr-4">₹{Number(it.CM_unit_price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                    <td className="py-2 pr-4">₹{Number(it.CM_total_amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                    <td className="py-2 pr-4">{it.CM_created_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
