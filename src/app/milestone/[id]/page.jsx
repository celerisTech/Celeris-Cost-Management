'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Helper function to safely format currency
const formatCurrency = (value) => {
  if (value == null || value === '') return '₹0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `₹${num.toFixed(2)}`;
};

export default function MilestoneSummaryPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchMilestone = async () => {
      try {
        const res = await fetch(`/api/milestones/${id}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (e) {
        console.error('Error fetching milestone:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMilestone();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80 text-gray-600">
        <Loader2 className="animate-spin mr-2" /> Loading milestone data...
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">No data found for this milestone.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Milestone: {data.CM_Milestone_Name} ({data.CM_Milestone_ID})
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Dates and Progress */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Dates & Progress</h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>Planned:</strong> {data.CM_Planned_Start_Date} → {data.CM_Planned_End_Date}</p>
            <p><strong>Actual:</strong> {data.CM_Actual_Start_Date || '-'} → {data.CM_Actual_End_Date || '-'}</p>
            <p><strong>Status:</strong> 
              <span className={`ml-2 px-3 py-1 rounded-full text-sm ${
                data.milestone_progress_status === 'Completed' ? 'bg-green-100 text-green-700' :
                data.milestone_progress_status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {data.milestone_progress_status}
              </span>
            </p>
            <p><strong>Tasks:</strong> {data.completed_tasks} / {data.total_tasks}</p>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Cost Summary</h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>Total Labour:</strong> {formatCurrency(data.labor_cost)}</p>
            <p><strong>Total Material:</strong> {formatCurrency(data.total_material_cost)}</p>
            <p><strong>Total Cost:</strong> {formatCurrency(data.total_project_cost)}</p>
          </div>
        </div>
      </div>

      {/* Labour Summary */}
      <div className="mt-8 bg-white rounded-xl shadow p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Labour Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-700">
          <div><strong>Labour Count:</strong> {data.total_labor_count || 0}</div>
          <div><strong>Working Days:</strong> {data.total_working_days || 0}</div>
          <div><strong>Working Hours:</strong> {data.total_working_hours || 0}</div>
          <div><strong>Used Quantity:</strong> {data.used_quantity || 0}</div>
        </div>
      </div>
    </div>
  );
}