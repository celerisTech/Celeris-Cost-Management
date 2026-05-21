'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/app/store/useAuthScreenStore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function AllocationApprovalManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');
  const { user } = useAuthStore();

  // States for tracking data and UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [notes, setNotes] = useState('');
  const [managerResponse, setManagerResponse] = useState('');
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  // Statistics for the request
  const [stats, setStats] = useState({
    totalItems: 0,
    requestedQuantity: 0,
    availableQuantity: 0,
    shortageQuantity: 0,
    approvedQuantity: 0,
    pendingQuantity: 0,
    totalValue: 0,
    alreadyApprovedQuantity: 0,
    remainingItems: 0
  });

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    } else {
      setError('No request ID provided');
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (approvals.length > 0) {
      calculateStats();
    } else {
      setStats(prev => ({
        ...prev,
        totalItems: 0,
        requestedQuantity: 0,
        availableQuantity: 0,
        shortageQuantity: 0,
        approvedQuantity: 0,
        pendingQuantity: 0,
        totalValue: 0,
        remainingItems: 0
      }));
    }
  }, [approvals]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/allocate/approve?requestId=${requestId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch request details');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch request details');
      }

      if (data.data.request.display_status) {
        data.data.request.CM_Status = data.data.request.display_status;
      }

      if (data.data.request.CM_Status === 'Pending' && data.data.request.CM_Has_Pending_Items === 1) {
        data.data.request.CM_Status = 'Partially Approved';
      }

      setRequestData(data.data);

      const isPartiallyApproved = data.data.request.CM_Status === 'Partially Approved';
      initializeApprovals(data.data.items, isPartiallyApproved);

      const finalStatus = data.data.request.CM_Status;
      if ((finalStatus === 'Approved' || finalStatus === 'Rejected') && data.data.request.CM_Notes) {
        setManagerResponse(data.data.request.CM_Notes);
      } else {
        setManagerResponse('');
      }

    } catch (error) {
      console.error('Error fetching request details:', error);
      setError(error.message || 'Failed to fetch request details');
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const initializeApprovals = (items, isPartiallyApproved) => {
    if (!items || !Array.isArray(items)) return;

    const filteredItems = isPartiallyApproved
      ? items.filter(item => {
        const pendingQty = parseInt(item.CM_Pending_Quantity) || 0;
        return pendingQty > 0;
      })
      : items;

    let alreadyApprovedQty = 0;

    if (isPartiallyApproved) {
      items.forEach(item => {
        if (parseInt(item.CM_Approved_Quantity) > 0 && parseInt(item.CM_Pending_Quantity) === 0) {
          alreadyApprovedQty += parseInt(item.CM_Approved_Quantity) || 0;
        }
      });
    }

    const initialApprovals = filteredItems.map(item => {
      const requestedQty = isPartiallyApproved
        ? parseInt(item.CM_Pending_Quantity) || 0
        : parseInt(item.CM_Requested_Quantity) || 0;

      const availableQty = parseInt(item.current_stock) || 0;
      const defaultApproved = Math.min(requestedQty, availableQty);
      const shortage = requestedQty > availableQty ? requestedQty - availableQty : 0;
      const pendingQty = requestedQty - defaultApproved;

      let itemStatus = item.display_status || item.CM_Status || 'Pending';

      if (pendingQty > 0 && defaultApproved > 0) {
        itemStatus = 'Partially Approved';
      } else if (defaultApproved === 0) {
        itemStatus = 'Rejected';
      } else if (defaultApproved >= requestedQty) {
        itemStatus = 'Approved';
      }

      const originalRequestedQty = isPartiallyApproved
        ? (parseInt(item.CM_Approved_Quantity) || 0) + requestedQty
        : requestedQty;

      return {
        itemId: item.CM_Item_ID,
        itemMasterId: item.CM_Item_Master_ID,
        productId: item.CM_Product_ID,
        itemName: item.CM_Item_Name || 'Unknown Item',
        itemCode: item.CM_Item_Code || '',
        requestedQuantity: requestedQty,
        originalRequestedQuantity: originalRequestedQty,
        alreadyApprovedQuantity: isPartiallyApproved ? (parseInt(item.CM_Approved_Quantity) || 0) : 0,
        availableQuantity: availableQty,
        shortageQuantity: shortage,
        approvedQuantity: defaultApproved,
        pendingQuantity: pendingQty,
        unitType: item.Unit_Type_Name || 'Units',
        unitPrice: parseFloat(item.CM_Unit_Price) || 0,
        status: itemStatus,
        notes: pendingQty > 0 ? `${defaultApproved} approved, ${pendingQty} pending` : '',
        originalData: item,
        isPartiallyApproved: isPartiallyApproved
      };
    });

    if (isPartiallyApproved) {
      setStats(prev => ({
        ...prev,
        alreadyApprovedQuantity: alreadyApprovedQty,
      }));
    }

    setApprovals(initialApprovals);
  };

  const calculateStats = () => {
    const newStats = {
      totalItems: approvals.length,
      requestedQuantity: 0,
      availableQuantity: 0,
      shortageQuantity: 0,
      approvedQuantity: 0,
      pendingQuantity: 0,
      totalValue: 0,
      alreadyApprovedQuantity: stats.alreadyApprovedQuantity || 0,
      remainingItems: 0
    };

    approvals.forEach(item => {
      newStats.requestedQuantity += parseInt(item.requestedQuantity) || 0;
      newStats.availableQuantity += parseInt(item.availableQuantity) || 0;
      newStats.shortageQuantity += parseInt(item.shortageQuantity) || 0;

      const approvedQty = parseInt(item.approvedQuantity) || 0;
      newStats.approvedQuantity += approvedQty;

      const pendingQty = parseInt(item.pendingQuantity) || 0;
      newStats.pendingQuantity += pendingQty;

      if (pendingQty > 0) {
        newStats.remainingItems++;
      }

      const unitPrice = parseFloat(item.unitPrice) || 0;
      newStats.totalValue += approvedQty * unitPrice;
    });

    setStats(newStats);
  };

  const handleQuantityChange = (itemId, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    const updatedApprovals = approvals.map(item => {
      if (item.itemId === itemId) {
        const requestedQty = parseInt(item.requestedQuantity);
        const availableQty = parseInt(item.availableQuantity);
        const validValue = Math.max(0, Math.min(numValue, availableQty));
        const pendingQty = requestedQty - validValue;

        let status = 'Approved';
        let notes = '';

        if (validValue === 0) {
          status = 'Rejected';
          notes = 'Quantity set to 0';
        } else if (pendingQty > 0) {
          status = 'Partially Approved';
          notes = `${validValue} approved, ${pendingQty} pending`;
        }

        return {
          ...item,
          approvedQuantity: validValue,
          pendingQuantity: pendingQty > 0 ? pendingQty : 0,
          status,
          notes
        };
      }
      return item;
    });

    setApprovals(updatedApprovals);
  };

  const handleStatusChange = (itemId, status) => {
    const updatedApprovals = approvals.map(item => {
      if (item.itemId === itemId) {
        let approvedQty = item.approvedQuantity;
        let pendingQty = item.pendingQuantity;
        let notes = item.notes;

        if (status === 'Rejected') {
          approvedQty = 0;
          pendingQty = parseInt(item.requestedQuantity);
          notes = 'Rejected by manager';
        } else if (status === 'Approved' && approvedQty < parseInt(item.requestedQuantity)) {
          status = 'Partially Approved';
          pendingQty = parseInt(item.requestedQuantity) - approvedQty;
          notes = `${approvedQty} approved, ${pendingQty} pending`;
        }

        return {
          ...item,
          approvedQuantity: approvedQty,
          pendingQuantity: pendingQty,
          status,
          notes
        };
      }
      return item;
    });

    setApprovals(updatedApprovals);
  };

  const handleItemNoteChange = (itemId, value) => {
    const updatedApprovals = approvals.map(item => {
      if (item.itemId === itemId) {
        return {
          ...item,
          notes: value
        };
      }
      return item;
    });

    setApprovals(updatedApprovals);
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);

      const approverId = user?.CM_User_ID || localStorage.getItem('userId') || 'MANAGER001';

      const hasPartialApprovals = approvals.some(item =>
        parseInt(item.pendingQuantity) > 0
      );

      const hasAnyApprovals = approvals.some(item =>
        parseInt(item.approvedQuantity) > 0
      );

      let requestStatus = 'Approved';
      if (hasPartialApprovals) {
        requestStatus = 'Partially Approved';
      } else if (!hasAnyApprovals) {
        requestStatus = 'Rejected';
      }

      const payload = {
        requestId,
        action: 'approve',
        approverId,
        notes: managerResponse || 'Approved by manager',
        requestStatus,
        hasPendingItems: hasPartialApprovals,
        itemApprovals: approvals.map(item => ({
          itemId: item.itemId,
          approvedQuantity: item.approvedQuantity,
          requestedQuantity: item.requestedQuantity,
          pendingQuantity: item.pendingQuantity,
          status: item.status,
          notes: item.notes
        }))
      };

      const response = await fetch('/api/products/allocate/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve request');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to approve request');
      }

      let successMessage = 'Request processed successfully';
      if (requestStatus === 'Approved') {
        successMessage = 'Request fully approved';
      } else if (requestStatus === 'Partially Approved') {
        successMessage = 'Request partially approved with pending items';
      } else {
        successMessage = 'Request rejected';
      }

      toast.success(successMessage);

      const urlStatus = requestStatus.replace(/ /g, '');
      router.push(`/manager/requests?status=${urlStatus}`);

    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);

      if (!managerResponse) {
        toast.error('Please provide a reason for rejection');
        setSubmitting(false);
        return;
      }

      const approverId = user?.CM_User_ID || localStorage.getItem('userId') || 'MANAGER001';

      const payload = {
        requestId,
        action: 'reject',
        approverId,
        notes: managerResponse,
        requestStatus: 'Rejected',
        hasPendingItems: false,
        itemApprovals: []
      };

      const response = await fetch('/api/products/allocate/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject request');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to reject request');
      }

      toast.success('Request rejected successfully');
      router.push('/manager/requests?status=Rejected');

    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);
  };

  // ✅ Export to Excel — Clean, with item-level details
  const exportToExcel = () => {
    if (!requestData || !approvals?.length) {
      toast('⚠️ No data to export');
      return;
    }

    const { request } = requestData;

    // Request Summary Sheet
    const summaryData = [
      ['Field', 'Value'],
      ['Project Name', request.CM_Project_Name || '—'],
      ['Project Code', request.CM_Project_Code || '—'],
      ['Request ID', requestId || '—'],
      ['Requested By', request.CM_Requested_By || '—'],
      ['Request Date', request.CM_Request_Date ? new Date(request.CM_Request_Date).toLocaleString() : '—'],
      ['Status', request.CM_Status || 'Pending'],
      ['Total Items', stats.totalItems],
      ['Requested Qty', stats.requestedQuantity],
      ['Approved Qty', stats.approvedQuantity],
      ['Pending Qty', stats.pendingQuantity],
      ['Available Qty', stats.availableQuantity],
      ['Total Value', formatCurrency(stats.totalValue)],
    ];

    // Items Sheet
    const itemsData = approvals.map(item => ({
      'Item Code': item.itemCode,
      'Item Name': item.itemName,
      'Requested Qty': item.requestedQuantity,
      'Available Qty': item.availableQuantity,
      'Approved Qty': item.approvedQuantity,
      'Pending Qty': item.pendingQuantity,
      'Unit': item.unitType,
      'Unit Price': formatCurrency(item.unitPrice),
      'Value': formatCurrency(item.approvedQuantity * item.unitPrice),
      'Status': item.status,
      'Notes': item.notes || '',
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Items sheet
    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, wsItems, 'Items');

    // Auto-fit
    const colWidths = itemsData.length > 0
      ? Object.keys(itemsData[0]).map(key => ({
        wch: Math.max(key.length + 2, ...itemsData.map(item => String(item[key]).length))
      }))
      : [];
    wsItems['!cols'] = colWidths;

    // Save
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `Approval_${request.CM_Project_Code || requestId}_${timestamp}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success('✅ Excel exported successfully');
  };

  // ✅ Export to PDF — Branded, matches your UI theme
  const exportToPDF = async () => {
    if (!requestData || !approvals?.length) {
      toast('⚠️ No data to export');
      return;
    }

    try {
      toast.loading('🎨 Generating branded PDF...', { id: 'pdf-export' });

      const { request } = requestData;
      const isPartiallyApproved = request.CM_Status === 'Partially Approved';

      // 🔹 Create printable content
      const printDiv = document.createElement('div');
      printDiv.id = 'print-content';
      printDiv.style.padding = '20mm 15mm';
      printDiv.style.width = '210mm';
      printDiv.style.fontFamily = '"Segoe UI", system-ui, sans-serif';
      printDiv.style.fontSize = '9px';
      printDiv.style.color = '#333';
      printDiv.style.lineHeight = '1.4';

      // 🔷 Header
      const header = document.createElement('div');
      header.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #4A90E2, #68D391); padding: 10px 20px; border-radius: 12px; color: white; font-weight: bold; font-size: 16px;">
          📋 Allocation Approval Report
        </div>
        <p style="font-size: 10px; color: #666; margin-top: 6px;">
          Project: <strong>${request.CM_Project_Name || '—'}</strong> • 
          ID: <strong>${requestId}</strong> • 
          Status: <strong>${request.CM_Status}</strong>
        </p>
      </div>
    `;
      printDiv.appendChild(header);

      // 🔷 Summary Stats Cards (simplified)
      const statsCard = document.createElement('div');
      statsCard.style.display = 'grid';
      statsCard.style.gridTemplateColumns = 'repeat(3, 1fr)';
      statsCard.style.gap = '8px';
      statsCard.style.marginBottom = '16px';
      statsCard.innerHTML = `
      <div style="background:#e3f2fd;padding:6px;border-radius:6px;text-align:center;">
        <div style="font-weight:bold;font-size:12px;color:#1976d2;">${stats.totalItems}</div>
        <div style="font-size:7px;color:#666;">Items</div>
      </div>
      <div style="background:#e8f5e9;padding:6px;border-radius:6px;text-align:center;">
        <div style="font-weight:bold;font-size:12px;color:#2e7d32;">${stats.approvedQuantity}</div>
        <div style="font-size:7px;color:#666;">Approved</div>
      </div>
      <div style="background:#fff8e1;padding:6px;border-radius:6px;text-align:center;">
        <div style="font-weight:bold;font-size:12px;color:#f57c00;">${stats.pendingQuantity}</div>
        <div style="font-size:7px;color:#666;">Pending</div>
      </div>
    `;
      printDiv.appendChild(statsCard);

      // 🔷 Table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '8px';

      // Table header
      const thead = document.createElement('thead');
      thead.innerHTML = `
      <tr style="background:#f5f5f5;border-bottom:1px solid #ddd;">
        <th style="padding:5px;text-align:left;font-weight:bold;">Item</th>
        <th style="padding:5px;text-align:right;font-weight:bold;">Req</th>
        <th style="padding:5px;text-align:right;font-weight:bold;">Avail</th>
        <th style="padding:5px;text-align:right;font-weight:bold;">Approve</th>
        <th style="padding:5px;text-align:right;font-weight:bold;">Pending</th>
        <th style="padding:5px;text-align:center;font-weight:bold;">Status</th>
      </tr>
    `;
      table.appendChild(thead);

      // Table body
      const tbody = document.createElement('tbody');
      approvals.forEach(item => {
        let statusBg = '#e0f7fa', statusColor = '#006064';
        if (item.status === 'Approved') {
          statusBg = '#e8f5e9'; statusColor = '#2e7d32';
        } else if (item.status === 'Partially Approved') {
          statusBg = '#fff8e1'; statusColor = '#f57c00';
        } else if (item.status === 'Rejected') {
          statusBg = '#ffebee'; statusColor = '#c62828';
        }

        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #eee';
        row.innerHTML = `
        <td style="padding:5px;vertical-align:top;">
          <div style="font-weight:bold;">${item.itemName}</div>
          <div style="font-size:7px;color:#666;">${item.itemCode}</div>
        </td>
        <td style="padding:5px;vertical-align:top;text-align:right;">${item.requestedQuantity}</td>
        <td style="padding:5px;vertical-align:top;text-align:right;">${item.availableQuantity}</td>
        <td style="padding:5px;vertical-align:top;text-align:right;font-weight:bold;color:#1976d2;">${item.approvedQuantity}</td>
        <td style="padding:5px;vertical-align:top;text-align:right;color:#f57c00;">${item.pendingQuantity}</td>
        <td style="padding:3px;vertical-align:top;text-align:center;">
          <span style="background:${statusBg};color:${statusColor};padding:1px 5px;border-radius:8px;font-size:7px;font-weight:bold;">
            ${item.status}
          </span>
        </td>
      `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      printDiv.appendChild(table);

      // 🔷 Footer
      const footer = document.createElement('div');
      footer.style.marginTop = '20px';
      footer.style.fontSize = '7px';
      footer.style.color = '#999';
      footer.style.textAlign = 'center';
      footer.style.borderTop = '1px dashed #ddd';
      footer.style.paddingTop = '8px';
      footer.innerHTML = `
      <p>Exported from Allocation Approval Manager • ${new Date().toLocaleString()}</p>
    `;
      printDiv.appendChild(footer);

      // Render
      document.body.appendChild(printDiv);
      const canvas = await html2canvas(printDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff',
        logging: false,
      });
      document.body.removeChild(printDiv);

      // PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas, 'JPEG', 0, 0, imgWidth, imgHeight);

      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `Approval_${request.CM_Project_Code || requestId}_${timestamp}.pdf`;
      pdf.save(fileName);

      toast.success('✅ PDF exported successfully!', { id: 'pdf-export' });

    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('❌ Failed to generate PDF.', { id: 'pdf-export' });
    }
  };
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full items-center justify-center">
        <div className="flex justify-center items-center h-64">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mt-20">
            {/* Sun */}
            <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
            {/* Orbit 1 */}
            <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            {/* Orbit 2 */}
            <div className="absolute inset-2 border-2 border-green-300/30 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] bg-[#F5F5F5] flex items-center justify-center p-4">
        <div className="bg-white border border-[#E0E0E0] rounded-lg p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-[#4A90E2] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#333333] mb-3">Something went wrong</h2>
          <p className="text-[#666666] mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push('/manager/requests')}
            className="px-6 py-3 bg-[#4A90E2] hover:bg-[#357ABD] text-white font-medium rounded transition-colors duration-200"
          >
            Return to Requests
          </button>
        </div>
      </div>
    );
  }

  if (!requestData || !requestData.request) {
    return (
      <div className="min-h-[60vh] bg-[#F5F5F5] flex items-center justify-center p-4">
        <div className="bg-white border border-[#E0E0E0] rounded-lg p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-[#4A90E2] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#333333] mb-3">No Request Found</h2>
          <p className="text-[#666666] mb-6 leading-relaxed">The requested allocation request could not be found.</p>
          <button
            onClick={() => router.push('/manager/requests')}
            className="px-6 py-3 bg-[#4A90E2] hover:bg-[#357ABD] text-white font-medium rounded transition-colors duration-200"
          >
            Return to Requests
          </button>
        </div>
      </div>
    );
  }

  const { request } = requestData;
  const isPartiallyApproved = request.CM_Status === 'Partially Approved';
  const isFinalized = request.CM_Status === 'Approved' || request.CM_Status === 'Rejected';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-2">
                {isPartiallyApproved ? 'Complete Approval Process' : 'Manager Approval Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/manager/requests')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded-lg  flex items-center gap-2 font-medium rounded transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Request Details - Row Layout */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] mb-8">
          <div className="px-6 py-4 border-b border-[#E0E0E0] flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#333333]">Request Details</h2>

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
                <div className="absolute top-full w-50 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 ring-opacity-5 z-20 overflow-hidden">
                  <button
                    onClick={() => { setShowMenu(false); exportToExcel(); }}
                    className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-all group border-b border-slate-100"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Download Excel</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowMenu(false); exportToPDF(); }}
                    className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200 transition-colors">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Download PDF</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#666666]">Project Name</label>
                <p className="text-[#333333] font-semibold">{request.CM_Project_Name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#666666]">Project Code</label>
                <p className="text-[#333333] font-semibold">{request.CM_Project_Code}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#666666]">Date Requested</label>
                <p className="text-[#333333] font-semibold">
                  {new Date(request.CM_Request_Date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#666666]">Current Status</label>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${request.CM_Status === 'Approved'
                  ? 'bg-green-100 text-green-800'
                  : request.CM_Status === 'Rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                  }`}>
                  {request.CM_Status}
                </div>
              </div>
            </div>
            {request.CM_Requested_By && !isFinalized && (
              <div>
              </div>
            )}
          </div>
        </div>

        {/* Completion Summary - Row Layout */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] mb-8">
          <div className="px-6 py-4 border-b border-[#E0E0E0]">
            <h2 className="text-lg font-semibold text-[#333333]">
              {isPartiallyApproved ? 'Completion Summary' : 'Approval Summary'}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 border border-[#E0E0E0] rounded">
                <div className="text-2xl font-bold text-[#333333]">{stats.totalItems}</div>
                <div className="text-sm text-[#666666] mt-1">Items Remaining</div>
              </div>

              {isPartiallyApproved && (
                <div className="text-center p-4 border border-[#E0E0E0] rounded">
                  <div className="text-2xl font-bold text-green-600">{stats.alreadyApprovedQuantity}</div>
                  <div className="text-sm text-[#666666] mt-1">Already Approved</div>
                </div>
              )}

              <div className="text-center p-4 border border-[#E0E0E0] rounded">
                <div className="text-2xl font-bold text-[#333333]">{stats.requestedQuantity}</div>
                <div className="text-sm text-[#666666] mt-1">
                  {isPartiallyApproved ? 'Pending Qty' : 'Requested Qty'}
                </div>
              </div>

              <div className="text-center p-4 border border-[#E0E0E0] rounded">
                <div className="text-2xl font-bold text-[#333333]">{stats.availableQuantity}</div>
                <div className="text-sm text-[#666666] mt-1">Available Qty</div>
              </div>

              <div className="text-center p-4 border border-[#E0E0E0] rounded">
                <div className="text-2xl font-bold text-green-600">{stats.approvedQuantity}</div>
                <div className="text-sm text-[#666666] mt-1">Current Approval</div>
              </div>

              <div className={`text-center p-4 border rounded ${stats.pendingQuantity > 0
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-[#E0E0E0]'
                }`}>
                <div className={`text-2xl font-bold ${stats.pendingQuantity > 0 ? 'text-yellow-600' : 'text-[#333333]'
                  }`}>
                  {stats.pendingQuantity}
                </div>
                <div className="text-sm text-[#666666] mt-1">Still Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] mb-8">
          <div className="px-6 py-4 border-b border-[#E0E0E0]">
            <h2 className="text-lg font-semibold text-[#333333]">
              {isPartiallyApproved ? 'Remaining Items for Approval' : 'Items for Approval'}
            </h2>
          </div>

          <div className="p-6">
            {approvals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Pending Items Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  There are no remaining items to approve. All items in this request have already been processed.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#E0E0E0]">
                    <thead className="bg-[#F8F9FA]">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                          Item Details
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                          {isPartiallyApproved ? 'Pending' : 'Requested'}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                          Available Stock
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                          Approve Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                          Still Pending
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm  font-medium text-gray-800  tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-800  tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#E0E0E0]">
                      {approvals.map((item, index) => {
                        const requestedQty = parseInt(item.requestedQuantity) || 0;
                        const availableQty = parseInt(item.availableQuantity) || 0;
                        const approvedQty = parseInt(item.approvedQuantity) || 0;
                        const pendingQty = parseInt(item.pendingQuantity) || 0;
                        const hasShortage = requestedQty > availableQty;

                        const statusClasses = item.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'Partially Approved'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800';

                        return (
                          <tr key={item.itemId} className="text-black hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-[#333333]">{item.itemName}</div>
                                <div className="text-sm text-[#666666]">{item.itemCode}</div>
                                {isPartiallyApproved && item.alreadyApprovedQuantity > 0 && (
                                  <div className="text-xs text-green-600 mt-1">
                                    {item.alreadyApprovedQuantity} already approved
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-[#333333] font-medium">
                                {requestedQty} {item.unitType}
                              </div>
                              {isPartiallyApproved && (
                                <div className="text-xs text-[#666666]">
                                  from {item.originalRequestedQuantity} total
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className={`text-sm font-medium ${hasShortage ? 'text-red-600' : 'text-[#333333]'}`}>
                                {availableQty} {item.unitType}
                                {hasShortage && (
                                  <div className="text-xs text-red-500 mt-1">
                                    Shortage: {requestedQty - availableQty}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={approvedQty}
                                  onChange={(e) => {
                                    if (!isFinalized) handleQuantityChange(item.itemId, e.target.value);
                                  }}
                                  min="0"
                                  max={availableQty}
                                  disabled={isFinalized}
                                  readOnly={isFinalized}
                                  className={`w-20 px-3 py-2 border border-[#E0E0E0] rounded focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] text-center ${isFinalized ? 'bg-gray-100 text-gray-500' : 'bg-white'
                                    }`}
                                />
                                <span className="text-sm text-[#666666]">{item.unitType}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${pendingQty > 0
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-600'
                                }`}>
                                {pendingQty > 0 ? `${pendingQty} ${item.unitType}` : 'None'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isFinalized ? (
                                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusClasses}`}>
                                  {item.status}
                                </div>
                              ) : (
                                <select
                                  value={item.status}
                                  onChange={(e) => handleStatusChange(item.itemId, e.target.value)}
                                  className="px-3 py-2 text-sm border border-[#E0E0E0] rounded focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] bg-white"
                                >
                                  <option value="Approved">Approve</option>
                                  <option value="Partially Approved">Partial</option>
                                  <option value="Rejected">Reject</option>
                                </select>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={item.notes || ''}
                                onChange={(e) => {
                                  if (!isFinalized) handleItemNoteChange(item.itemId, e.target.value);
                                }}
                                placeholder="Add notes..."
                                readOnly={isFinalized}
                                disabled={isFinalized}
                                className={`w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] ${isFinalized ? 'bg-gray-100 text-gray-500' : 'bg-white'
                                  }`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {approvals.map((item, index) => {
                    const requestedQty = parseInt(item.requestedQuantity) || 0;
                    const availableQty = parseInt(item.availableQuantity) || 0;
                    const approvedQty = parseInt(item.approvedQuantity) || 0;
                    const pendingQty = parseInt(item.pendingQuantity) || 0;
                    const hasShortage = requestedQty > availableQty;

                    return (
                      <div key={item.itemId} className="border border-[#E0E0E0] rounded-lg p-4 space-y-4">
                        {/* Item Header */}
                        <div>
                          <h3 className="text-base font-medium text-[#333333]">{item.itemName}</h3>
                          <p className="text-sm text-[#666666]">{item.itemCode}</p>
                          {isPartiallyApproved && item.alreadyApprovedQuantity > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              {item.alreadyApprovedQuantity} already approved
                            </p>
                          )}
                        </div>

                        {/* Quantities Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-800  tracking-wider">
                              {isPartiallyApproved ? 'Pending' : 'Requested'}
                            </label>
                            <p className="text-sm font-medium text-[#333333]">
                              {requestedQty} {item.unitType}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-800  tracking-wider">
                              Available
                            </label>
                            <p className={`text-sm font-medium ${hasShortage ? 'text-red-600' : 'text-[#333333]'}`}>
                              {availableQty} {item.unitType}
                            </p>
                          </div>
                        </div>

                        {/* Approve Quantity */}
                        <div>
                          <label className="text-sm font-medium text-gray-800  tracking-wider block mb-2">
                            Approve Quantity
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={approvedQty}
                              onChange={(e) => {
                                if (!isFinalized) handleQuantityChange(item.itemId, e.target.value);
                              }}
                              min="0"
                              max={availableQty}
                              disabled={isFinalized}
                              readOnly={isFinalized}
                              className={`flex-1 px-3 py-2 border text-gray-800 border-[#E0E0E0] rounded focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] text-center ${isFinalized ? 'bg-gray-100 text-gray-500' : 'bg-white'
                                }`}
                            />
                            <span className="text-sm text-gray-800">{item.unitType}</span>
                          </div>
                        </div>

                        {/* Status and Pending */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-800  tracking-wider block mb-2">
                              Status
                            </label>
                            {isFinalized ? (
                              <div className={`inline-flex items-center px-2 py-1 text-gray-800 rounded text-xs font-medium ${item.status === 'Approved'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'Partially Approved'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                                }`}>
                                {item.status}
                              </div>
                            ) : (
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item.itemId, e.target.value)}
                                className="w-full px-3 py-2 text-sm text-gray-800 border border-[#E0E0E0] rounded focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] bg-white"
                              >
                                <option value="Approved">Approve</option>
                                <option value="Partially Approved">Partial</option>
                                <option value="Rejected">Reject</option>
                              </select>
                            )}
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-800 tracking-wider block mb-2">
                              Still Pending
                            </label>
                            <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${pendingQty > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600'
                              }`}>
                              {pendingQty > 0 ? `${pendingQty} ${item.unitType}` : 'None'}
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="text-sm font-medium text-gray-800  tracking-wider block mb-2">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => {
                              if (!isFinalized) handleItemNoteChange(item.itemId, e.target.value);
                            }}
                            placeholder="Add notes..."
                            readOnly={isFinalized}
                            disabled={isFinalized}
                            className={`w-full px-3 py-2 text-gray-800 text-sm border border-[#E0E0E0] rounded focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] ${isFinalized ? 'bg-gray-100 text-gray-500' : 'bg-white'
                              }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Manager Response Section */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] mb-8">
          <div className="px-6 py-4 border-b border-[#E0E0E0]">
            <h2 className="text-lg font-semibold text-[#333333]">Manager Response</h2>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label htmlFor="managerResponse" className="block text-sm font-medium text-[#333333] mb-3">
                Response Notes {isFinalized ? '' : <span className="text-red-500">*</span>}
              </label>
              <textarea
                id="managerResponse"
                value={managerResponse}
                onChange={(e) => {
                  if (!isFinalized) setManagerResponse(e.target.value);
                }}
                rows={4}
                readOnly={isFinalized}
                disabled={isFinalized}
                className={`w-full px-4 py-3 text-gray-800 border border-[#E0E0E0] rounded focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] resize-none ${isFinalized ? 'bg-gray-100 text-gray-500' : 'bg-white'
                  }`}
                placeholder={isFinalized ? 'This request is finalized. Response is read-only.' : 'Enter your approval or rejection notes here...'}
              ></textarea>
            </div>

            {/* Partial Approval Warning */}
            {stats.pendingQuantity > 0 && !isFinalized && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 mb-1">Partial Approval Notice</h3>
                    <p className="text-sm text-yellow-700">
                      This request will be marked as <strong>Partially Approved</strong> because there are <strong>{stats.pendingQuantity}</strong> items pending approval due to insufficient stock.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isFinalized ? (
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={handleReject}
                  disabled={submitting || approvals.length === 0}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject {isPartiallyApproved ? 'Remaining Items' : 'Request'}
                    </>
                  )}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={submitting || stats.approvedQuantity === 0 || approvals.length === 0}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {isPartiallyApproved
                        ? (stats.pendingQuantity > 0 ? 'Partially Complete' : 'Complete Approval')
                        : (stats.pendingQuantity > 0 ? 'Partially Approve' : 'Approve Request')}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded text-sm font-medium ${request.CM_Status === 'Approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  This request has been {request.CM_Status.toLowerCase()} and cannot be edited.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}