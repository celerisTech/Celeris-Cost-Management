'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/useAuthScreenStore';
import toast from "react-hot-toast";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function ProjectPayments({ project, onBack }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const formRef = useRef(null);
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  const [formData, setFormData] = useState({
    CM_Project_ID: project?.CM_Project_ID || '',
    CM_Payment_Date: format(new Date(), 'yyyy-MM-dd'),
    CM_Paid_Amount: '',
    CM_Payment_Method: 'Bank Transfer',
    CM_Notes: '',
    CM_Created_By: user?.CM_Full_Name || '',
  });

  useEffect(() => {
    if (project) {
      setFormData(prev => ({
        ...prev,
        CM_Project_ID: project.CM_Project_ID,
        CM_Created_By: user?.CM_Full_Name || '',
        CM_Upload_By: user?.CM_Full_Name || ''
      }));
    }
  }, [project, user]);

  useEffect(() => {
    if (!project?.CM_Project_ID) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (project) {
          const projectData = {
            ...project,
            Total_Estimated_Cost: parseFloat(project.CM_Estimated_Cost || project.Total_Estimated_Cost || 0)
          };
          setProjectDetails(projectData);
        }

        const paymentsResponse = await fetch(`/api/payments?projectId=${project.CM_Project_ID}`);
        if (!paymentsResponse.ok) throw new Error('Failed to fetch payments');
        const paymentsData = await paymentsResponse.json();
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);

        const totalPaidAmount = Array.isArray(paymentsData)
          ? paymentsData.reduce((sum, payment) => sum + parseFloat(payment.CM_Paid_Amount || 0), 0)
          : 0;
        setTotalPaid(totalPaidAmount);

        const estimatedCost = parseFloat(project?.CM_Estimated_Cost || project?.Total_Estimated_Cost || 0);
        const calculatedRemainingAmount = Math.max(0, estimatedCost - totalPaidAmount);
        setRemainingAmount(calculatedRemainingAmount);

      } catch (err) {
        console.error('Error fetching payment data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [project]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.CM_Paid_Amount || parseFloat(formData.CM_Paid_Amount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    try {
      const paymentData = {
        ...formData,
        CM_Project_ID: project?.CM_Project_ID,
        CM_Company_ID: project?.CM_Company_ID || "",
        CM_Created_By: user?.CM_Full_Name || "",
        CM_Upload_By: user?.CM_Full_Name || "",
        CM_Created_At: new Date().toISOString(),
        CM_Upload_At: new Date().toISOString(),
      };

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add payment");
      }

      const refreshResponse = await fetch(`/api/payments?projectId=${project.CM_Project_ID}`);
      const refreshData = await refreshResponse.json();
      setPayments(Array.isArray(refreshData) ? refreshData : []);
      const newTotalPaid = Array.isArray(refreshData)
        ? refreshData.reduce((sum, p) => sum + parseFloat(p.CM_Paid_Amount || 0), 0)
        : 0;
      setTotalPaid(newTotalPaid);
      const estimatedCost = parseFloat(project?.CM_Estimated_Cost || 0);
      setRemainingAmount(Math.max(0, estimatedCost - newTotalPaid));

      setFormData({
        CM_Project_ID: project?.CM_Project_ID || "",
        CM_Payment_Date: format(new Date(), "yyyy-MM-dd"),
        CM_Paid_Amount: "",
        CM_Payment_Method: "Bank Transfer",
        CM_Notes: "",
        CM_Created_By: user?.CM_Full_Name || "",
        CM_Upload_By: user?.CM_Full_Name || "",
      });
      setShowAddForm(false);

      toast.success("Payment recorded successfully!");
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error(error.message || "Failed to add payment. Please try again.");
    }
  };

  // Enhanced Excel download function
  const downloadExcel = () => {
    try {
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();

      // Format data for export
      const paymentData = payments.map(payment => ({
        'Project Name': payment.CM_Project_Name || project?.CM_Project_Name || 'N/A',
        'Payment Date': formatDate(payment.CM_Payment_Date),
        'Amount': parseFloat(payment.CM_Paid_Amount || 0).toFixed(2),
        'Method': payment.CM_Payment_Method || 'N/A',
        'Notes': payment.CM_Notes || '',
        'Created By': payment.CM_Created_By || 'System',
        'Created Date': formatDate(payment.CM_Created_At)
      }));

      // Add payment data
      const worksheet = XLSX.utils.json_to_sheet(paymentData);

      // Style columns (set column widths)
      const colWidths = [
        { wch: 25 }, // Project Name
        { wch: 15 }, // Payment Date
        { wch: 15 }, // Amount
        { wch: 15 }, // Method
        { wch: 30 }, // Notes
        { wch: 20 }, // Created By
        { wch: 15 }  // Created Date
      ];
      worksheet['!cols'] = colWidths;

      // Add summary data with a row gap
      const summaryData = [
        [],
        ['Payment Summary'],
        ['Estimated Cost', parseFloat(project?.CM_Estimated_Cost || 0).toFixed(2)],
        ['Total Paid', totalPaid.toFixed(2)],
        ['Remaining Balance', remainingAmount.toFixed(2)],
        ['Progress', `${paymentProgressPercentage}%`]
      ];

      // Determine the start row for the summary
      const startRow = paymentData.length + 2;

      // Add the summary data to the worksheet
      summaryData.forEach((row, idx) => {
        XLSX.utils.sheet_add_aoa(worksheet, [row], { origin: { r: startRow + idx, c: 0 } });
      });

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

      // Generate file name with timestamp
      const fileName = `${project?.CM_Project_Code || 'project'}_payments_${format(new Date(), 'yyyyMMdd')}.xlsx`;

      // Write and download the file
      XLSX.writeFile(workbook, fileName);

      toast.success('Excel file downloaded successfully', {
        icon: '📊',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Failed to download Excel file');
    }
  };

  const downloadPDF = () => {
    try {
      import('jspdf').then(({ default: jsPDF }) => {
        const doc = new jsPDF();

        // Helper function to format currency without special characters
        const formatCurrency = (value) => {
          return Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        };

        // Helper function to format date
        const formatDate = (dateStr) => {
          if (!dateStr) return 'N/A';
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        };

        // -------------------------
        // TITLE & PROJECT DETAILS
        // -------------------------
        doc.setFontSize(18);
        doc.setTextColor(33, 33, 33);
        doc.text('Payment Report', 20, 20);

        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text(`Project: ${project?.CM_Project_Name || 'N/A'}`, 20, 30);
        doc.text(`Project Code: ${project?.CM_Project_Code || 'N/A'}`, 20, 37);

        // Get current date in required format
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) + ', ' +
          currentDate.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          });

        doc.text(`Generated: ${formattedDate}`, 20, 44);

        doc.setDrawColor(200, 200, 200);
        doc.line(20, 48, 190, 48);

        // -------------------------
        // SUMMARY
        // -------------------------
        doc.setFontSize(14);
        doc.setTextColor(33, 33, 33);
        doc.text('Payment Summary', 20, 60);

        // Calculate values for summary
        const estimatedCost = project?.CM_Estimated_Cost || 0;
        const totalPaid = payments.reduce((sum, payment) => sum + (payment.CM_Paid_Amount || 0), 0);
        const remainingAmount = estimatedCost - totalPaid;
        const paymentProgressPercentage = estimatedCost > 0
          ? Math.round((totalPaid / estimatedCost) * 100)
          : 0;

        doc.setFontSize(10);

        // Format amounts and display
        const estCostText = `Estimated Cost: INR ${formatCurrency(estimatedCost)}`;
        const totalPaidText = `Total Paid: INR ${formatCurrency(totalPaid)}`;
        const remainingText = `Remaining Balance: INR ${formatCurrency(remainingAmount)}`;

        doc.text(estCostText, 25, 70);
        doc.text(totalPaidText, 25, 77);
        doc.text(remainingText, 25, 84);
        doc.text(`Payments: ${payments.length}`, 25, 91);
        doc.text(`Progress: ${paymentProgressPercentage}%`, 25, 98);

        // PROGRESS BAR
        doc.setDrawColor(220, 220, 220);
        doc.setFillColor(220, 220, 220);
        doc.rect(25, 105, 100, 6, 'F');

        let progressColor;
        if (paymentProgressPercentage >= 100) {
          progressColor = [16, 185, 129];
        } else if (paymentProgressPercentage >= 75) {
          progressColor = [59, 130, 246];
        } else if (paymentProgressPercentage >= 50) {
          progressColor = [245, 158, 11];
        } else {
          progressColor = [249, 115, 22];
        }

        doc.setFillColor(...progressColor);
        doc.rect(
          25,
          105,
          Math.min(paymentProgressPercentage, 100) * 100 / 100,
          6,
          'F'
        );

        // -------------------------
        // TABLE HEADER
        // -------------------------
        doc.setFontSize(14);
        doc.setTextColor(33, 33, 33);
        doc.text('Payment History', 20, 125);

        // Table columns
        const colDate = 23;
        const colAmountEnd = 90; // right aligned
        const colMethod = 95;
        const colNotes = 120;
        const colCreatedBy = 155;

        // Header Row Background
        doc.setFillColor(59, 130, 246);
        doc.rect(20, 130, 170, 8, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);

        doc.text('Date', colDate, 135);
        doc.text('Amount', colAmountEnd - 20, 135); // header centered
        doc.text('Method', colMethod, 135);
        doc.text('Notes', colNotes, 135);
        doc.text('Created By', colCreatedBy, 135);

        // -------------------------
        // TABLE ROWS
        // -------------------------
        doc.setTextColor(33, 33, 33);
        doc.setFontSize(9);

        let y = 145;
        const rowHeight = 10;

        payments.forEach((payment, index) => {
          // Alternating rows
          if (index % 2 === 0) {
            doc.setFillColor(247, 248, 250);
            doc.rect(20, y - 5, 170, rowHeight, 'F');
          }

          // Date
          doc.text(formatDate(payment.CM_Payment_Date), colDate, y);

          // ----------- FIXED AMOUNT (RIGHT-ALIGNED) -----------
          const formattedAmount = 'INR' + formatCurrency(payment.CM_Paid_Amount);
          const amountWidth = doc.getTextWidth(formattedAmount);
          doc.text(formattedAmount, colAmountEnd - amountWidth, y);
          // -----------------------------------------------------

          // Method
          doc.text(payment.CM_Payment_Method || 'N/A', colMethod, y);

          // Notes (trim)
          const notes = (payment.CM_Notes || 'None');
          doc.text(notes.substring(0, 22) + (notes.length > 22 ? '…' : ''), colNotes, y);

          // Created By
          doc.text(payment.CM_Created_By || 'System', colCreatedBy, y);

          y += rowHeight;

          // New page if needed
          if (y > 280) {
            doc.addPage();
            y = 20;

            doc.setFillColor(59, 130, 246);
            doc.rect(20, y, 170, 8, 'F');

            doc.setTextColor(255, 255, 255);
            doc.text('Date', colDate, y + 5);
            doc.text('Amount', colAmountEnd - 20, y + 5);
            doc.text('Method', colMethod, y + 5);
            doc.text('Notes', colNotes, y + 5);
            doc.text('Created By', colCreatedBy, y + 5);

            doc.setTextColor(33, 33, 33);
            y += 15;
          }
        });

        // -------------------------
        // FOOTER
        // -------------------------
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);

        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.text(
            `Generated by ${user?.CM_Full_Name || 'System'} | Page ${i} of ${pageCount}`,
            105,
            290,
            { align: 'center' }
          );
        }

        // SAVE
        const filename = `${project?.CM_Project_Code || 'project'}_payments_${currentDate.toISOString().slice(0, 10).replace(/-/g, '')
          }.pdf`;

        doc.save(filename);

        toast.success('PDF file downloaded successfully', {
          icon: '📄',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download PDF');
    }
  };


  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return '₹0';

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(parsedAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const paymentProgressPercentage = (() => {
    const estimatedCost = parseFloat(project?.CM_Estimated_Cost || 0);
    if (!estimatedCost || estimatedCost <= 0) return 0;
    return Math.min(100, Math.round((totalPaid / estimatedCost) * 100));
  })();

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackClick}
                className="inline-flex items-center p-2 border border-gray-300 rounded-lg bg-blue-200 hover:bg-blue-300 transition-colors duration-200 shadow-sm"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 rounded-xl text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {project?.CM_Project_Name} • {project?.CM_Project_Code}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Download Dropdown */}
              <div className="relative inline-block text-left">
                <div>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white  rounded-xl shadow-lg  ring-opacity-5 focus:outline-none z-20 animate-in fade-in-0 zoom-in-95">
                    <div className="p-2">
                      <button
                        onClick={() => { setShowMenu(false); downloadExcel(); }}
                        className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-150 group"
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
                        onClick={() => { setShowMenu(false); downloadPDF(); }}
                        className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-150 group mt-1"
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
                  </div>
                )}
              </div>

              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-3 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Payment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estimated Cost</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {project ? formatCurrency(project.CM_Estimated_Cost) : '₹0'}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8l3 5m0 0l3-5m-3 5v8m-8-8h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Amount Paid</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(totalPaid)}
                  </p>
                  {payments.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {payments.length} payment{payments.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Remaining Balance</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {formatCurrency(remainingAmount)}
                  </p>
                  {project?.CM_Estimated_Cost > 0 && remainingAmount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((remainingAmount / project.CM_Estimated_Cost) * 100)}% remaining
                    </p>
                  )}
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Payment Progress</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{paymentProgressPercentage}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${paymentProgressPercentage >= 100
                          ? 'bg-emerald-500'
                          : paymentProgressPercentage >= 75
                            ? 'bg-blue-500'
                            : paymentProgressPercentage >= 50
                              ? 'bg-amber-500'
                              : 'bg-orange-500'
                          }`}
                        style={{ width: `${paymentProgressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Payment Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Record New Payment</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="CM_Payment_Date" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    name="CM_Payment_Date"
                    id="CM_Payment_Date"
                    required
                    value={formData.CM_Payment_Date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="CM_Paid_Amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    name="CM_Paid_Amount"
                    id="CM_Paid_Amount"
                    step="0.01"
                    min="0"
                    required
                    value={formData.CM_Paid_Amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="CM_Payment_Method" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    name="CM_Payment_Method"
                    id="CM_Payment_Method"
                    value={formData.CM_Payment_Method}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="CM_Notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="CM_Notes"
                    id="CM_Notes"
                    rows="3"
                    value={formData.CM_Notes}
                    onChange={handleInputChange}
                    placeholder="Add payment details or reference numbers..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
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
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading payments</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payments Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
            </div>

            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.CM_Payment_ID} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.CM_Payment_Date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                          {formatCurrency(payment.CM_Paid_Amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {payment.CM_Payment_Method}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {payment.CM_Notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.CM_Created_By}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No payments recorded</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  Get started by recording the first payment for this project to track financial progress.
                </p>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add First Payment
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
