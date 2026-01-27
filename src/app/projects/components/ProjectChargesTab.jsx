// src/app/projects/components/ProjectChargesTab.jsx
'use client';

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../store/useAuthScreenStore";

export default function ProjectChargesTab({ project, onBack }) {
  const projectId = project.CM_Project_ID;
  const [activeTab, setActiveTab] = useState("service");
  const [services, setServices] = useState([]);
  const [transport, setTransport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const authUser = useAuthStore((s) => s.user);

  // Format all money properly (₹10,000.00)
  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const [form, setForm] = useState({
    type: "",
    description: "",
    amount: "",
    taxAmount: "0",
    date: new Date().toISOString().split("T")[0],
    status: "Completed",
    milestoneId: ""
  });

  const serviceTypes = ["Service", "Maintenance", "AMC", "Repair", "Others"];
  const transportTypes = ["Lorry", "Van", "Auto", "Loading", "Unloading", "Diesel", "Others"];
  const serviceStatuses = ["Pending", "Completed", "Cancelled"];
  const transportStatuses = ["Pending", "Paid", "Cancelled"];

  const loadData = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const [serviceRes, transportRes] = await Promise.all([
        axios.get(`/api/projects/${projectId}/services`),
        axios.get(`/api/projects/${projectId}/transport`)
      ]);

      setServices(serviceRes.data.data || []);
      setTransport(transportRes.data.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleSubmit = async () => {
    if (!form.type || !form.amount || !form.date) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const payload = {
        type: form.type,
        description: form.description,
        date: form.date,
        amount: parseFloat(form.amount),
        taxAmount: parseFloat(form.taxAmount) || 0,
        status: form.status,
        attachment: form.attachment,
        createdBy: authUser?.CM_Full_Name ?? "Admin",
      };

      // Include milestoneId only for transport entries
      if (activeTab === "transport") {
        payload.milestoneId = form.milestoneId;
      }

      if (editingItem) {
        // Update existing item
        if (activeTab === "service") {
          payload.serviceId = editingItem.CM_Service_ID;
          await axios.post(`/api/projects/${projectId}/services?_method=PUT`, payload);
        } else {
          payload.transportId = editingItem.CM_Transport_ID;
          await axios.post(`/api/projects/${projectId}/transport?_method=PUT`, payload);
        }
      } else {
        // Create new item
        if (activeTab === "service") {
          await axios.post(`/api/projects/${projectId}/services`, payload);
        } else {
          await axios.post(`/api/projects/${projectId}/transport`, payload);
        }
      }

      resetForm();
      await loadData();
      setShowForm(false);
      setEditingItem(null);
      alert(`${activeTab === "service" ? "Service" : "Transport"} entry ${editingItem ? 'updated' : 'added'} successfully!`);
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Error saving entry. Please try again.");
    }
  };

  const loadMilestones = async () => {
    if (!projectId) return;

    try {
      const response = await axios.get(`/api/projects/${projectId}/milestones`);
      setMilestones(response.data.data || []);
    } catch (error) {
      console.error("Error loading milestones:", error);
    }
  };

  useEffect(() => {
    loadData();
    loadMilestones(); // Load milestones when projectId changes
  }, [projectId]);

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      type: item.CM_Service_Type || item.CM_Transport_Type,
      milestoneId: item.CM_Milestone_ID || "",
      description: item.CM_Description || "",
      amount: item.CM_Service_Amount || item.CM_Amount,
      taxAmount: item.CM_Tax_Amount || "0",
      date: (item.CM_Service_Date || item.CM_Transport_Date).split('T')[0],
      status: item.CM_Status,

    });
    setShowForm(true);
  };


  const calculateTotal = (amount, taxAmount) =>
    Number(amount || 0) + Number(taxAmount || 0);

  const getServiceTotal = (items) =>
    items.reduce(
      (sum, i) => sum + Number(i.CM_Service_Amount || 0) + Number(i.CM_Tax_Amount || 0),
      0
    );

  const getTransportTotal = (items) =>
    items.reduce(
      (sum, i) => sum + Number(i.CM_Amount || 0) + Number(i.CM_Tax_Amount || 0),
      0
    );

  const getCurrentTabTotal = () =>
    activeTab === "service"
      ? getServiceTotal(services)
      : getTransportTotal(transport);

  const totalServiceAmount = getServiceTotal(services);
  const totalTransportAmount = getTransportTotal(transport);
  const grandTotal = totalServiceAmount + totalTransportAmount;

  const getStatusColor = (status) => {
    if (status === "Completed" || status === "Paid")
      return "bg-green-100 text-green-800";
    if (status === "Pending")
      return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const resetForm = () => {
    setForm({
      type: "",
      description: "",
      amount: "",
      taxAmount: "0",
      date: new Date().toISOString().split("T")[0],
      status: activeTab === "service" ? "Completed" : "Pending",
      milestoneId: ""
    });
    setEditingItem(null);
  };

  const handleFormToggle = () => {
    if (!showForm) {
      resetForm();
    }
    setShowForm(!showForm);
  };

  const cancelEdit = () => {
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Project Charges Management
          </h2>
          <p className="text-gray-600 mt-1">
            Project: {project.CM_Project_Name} ({project.CM_Project_Code})
          </p>
        </div>

        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          Back to Projects
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">Total Services</h3>
          <p className="text-2xl font-bold text-blue-600">
            ₹{formatMoney(totalServiceAmount)}
          </p>
          <p className="text-xs text-blue-600 mt-1">{services.length} entries</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800">Total Transport</h3>
          <p className="text-2xl font-bold text-green-600">
            ₹{formatMoney(totalTransportAmount)}
          </p>
          <p className="text-xs text-green-600 mt-1">{transport.length} entries</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-800">Grand Total</h3>
          <p className="text-2xl font-bold text-purple-600">
            ₹{formatMoney(grandTotal)}
          </p>
          <p className="text-xs text-purple-600 mt-1">All charges</p>
        </div>
      </div>

      {/* TABS AND ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* TABS */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => {
              setActiveTab("service");
              resetForm();
            }}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === "service"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
              }`}
          >
            Services / Maintenance
          </button>

          <button
            onClick={() => {
              setActiveTab("transport");
              resetForm();
            }}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === "transport"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
              }`}
          >
            Transport Charges
          </button>
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={handleFormToggle}
          className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${showForm
            ? "bg-gray-500 text-white hover:bg-gray-600"
            : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? "Cancel" : `Add ${activeTab === "service" ? "Service" : "Transport"}`}
        </button>
      </div>

      {/* FORM - CONDITIONALLY RENDERED */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {editingItem ? 'Edit' : 'Add New'} {activeTab === "service" ? "Service" : "Transport"} Entry
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Milestone Dropdown - Only for Transport */}
            {activeTab === "transport" && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Milestone</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.milestoneId}
                  onChange={(e) => setForm({ ...form, milestoneId: e.target.value })}
                >
                  <option value="">Select Milestone</option>
                  {milestones.map((milestone) => (
                    <option key={milestone.CM_Milestone_ID} value={milestone.CM_Milestone_ID}>
                      {milestone.CM_Milestone_Name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Type *</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="">Select Type</option>
                {(activeTab === "service" ? serviceTypes : transportTypes).map(
                  (t) => (
                    <option key={t} value={t}>{t}</option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Date *</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {(activeTab === "service" ? serviceStatuses : transportStatuses).map(
                  (s) => (
                    <option key={s} value={s}>{s}</option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Tax Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.taxAmount}
                onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Total Amount (₹)</label>
              <input
                type="text"
                readOnly
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 font-semibold text-gray-800"
                value={`₹${formatMoney(
                  calculateTotal(form.amount, form.taxAmount)
                )}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Enter description..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!form.type || !form.amount || !form.date}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {editingItem ? 'Update Entry' : 'Save Entry'}
            </button>

            <button
              onClick={resetForm}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>

            {editingItem && (
              <button
                onClick={cancelEdit}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      )}

      {/* LIST SECTION */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {activeTab === "service" ? "Service Entries" : "Transport Entries"}
            <span className="text-sm text-gray-600 ml-2">
              ({activeTab === "service" ? services.length : transport.length} entries)
            </span>
          </h3>

          <div className="text-lg font-bold text-gray-800">
            ₹{formatMoney(getCurrentTabTotal())}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">Loading...</p>
          </div>
        ) : (activeTab === "service" ? services : transport).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-600 mb-2">No entries found</p>
            <p className="text-sm text-gray-500 mb-4">
              {showForm ? "Fill the form above to add your first entry" : "Click 'Add' button to create your first entry"}
            </p>
            {!showForm && (
              <button
                onClick={handleFormToggle}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Entry
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Type</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-700">Amount</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-700">Tax</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-700">Total</th>
                  <th className="p-4 text-center text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>

              <tbody>
                {(activeTab === "service" ? services : transport).map((item) => {
                  const amount =
                    activeTab === "service"
                      ? item.CM_Service_Amount
                      : item.CM_Amount;

                  const taxAmount = item.CM_Tax_Amount || 0;
                  const total = Number(amount) + Number(taxAmount);

                  return (
                    <tr
                      key={item.CM_Service_ID || item.CM_Transport_ID}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {item.CM_Service_Type || item.CM_Transport_Type}
                        </span>
                      </td>

                      <td className="p-4 text-gray-700">{item.CM_Description || "-"}</td>

                      <td className="p-4 text-gray-700">
                        {new Date(
                          item.CM_Service_Date || item.CM_Transport_Date
                        ).toLocaleDateString('en-IN')}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            item.CM_Status
                          )}`}
                        >
                          {item.CM_Status}
                        </span>
                      </td>

                      <td className="p-4 text-right text-gray-700">
                        ₹{formatMoney(amount)}
                      </td>

                      <td className="p-4 text-right text-gray-700">
                        ₹{formatMoney(taxAmount)}
                      </td>

                      <td className="p-4 text-right font-bold text-gray-800">
                        ₹{formatMoney(total)}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}