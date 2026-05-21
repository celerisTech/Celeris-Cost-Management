// src/app/purchase-history/page.jsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import Navbar from '../components/Navbar';
import dynamic from 'next/dynamic';
import toast from "react-hot-toast";

// Helper functions defined outside the component
const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// Plain currency value for Excel
const plainCurrency = (value) => {
    if (!value && value !== 0) return 0;
    return Number(value);
};

// Create a separate component for the bill popup
const BillDetailsPopup = ({ selectedBill, onClose }) => {
    if (!selectedBill) return null;


    const [showMenu, setShowMenu] = useState(false);

    // Download Bill as Excel
    const downloadBillExcel = () => {
        try {
            // Create workbook
            const wb = XLSX.utils.book_new();

            // Bill Summary Sheet
            const summaryData = [
                ['BILL DETAILS REPORT', '', '', '', '', ''],
                ['Bill Number:', selectedBill.summary.CM_Bill_Number],
                ['Purchase Date:', formatDate(selectedBill.summary.CM_Purchase_Date)],
                ['Supplier:', selectedBill.summary.CM_Company_Name],
                ['Supplier Code:', selectedBill.summary.CM_Supplier_Code || 'N/A'],
                ['GST Number:', selectedBill.summary.CM_GST_Number || 'N/A'],
                ['PAN Number:', selectedBill.summary.CM_PAN_Number || 'N/A'],
                ['Payment Terms:', selectedBill.summary.CM_Payment_Terms],
                [''],
                ['PRODUCT DETAILS'],
                ['Product Name', 'Item Code', 'Quantity', 'Unit Type', 'Unit Price', 'Discount %', 'Discount Amount', 'Total Price']
            ];

            // Add product data
            selectedBill.products.forEach(product => {
                summaryData.push([
                    product.CM_Product_Name,
                    product.CM_Item_Code || 'N/A',
                    product.CM_Quantity,
                    product.CM_Unit_Type,
                    plainCurrency(product.CM_Unit_Price),
                    product.CM_Discount_Percentage,
                    plainCurrency(product.CM_Discount_Amount),
                    plainCurrency(product.CM_Total_Price)
                ]);
            });

            // Add summary section
            const subtotal = selectedBill.products.reduce((sum, product) => sum + Number(product.CM_Total_Price || 0), 0);
            const taxPercent = Number(selectedBill.summary.CM_Tax_Percentage);
            const taxAmount = Number(selectedBill.summary.CM_Tax_Amount);
            const halfPercent = taxPercent / 2;
            const halfAmount = taxAmount / 2;

            summaryData.push(['']);
            summaryData.push(['BILL SUMMARY']);
            summaryData.push(['Subtotal:', '', '', '', '', '', '', plainCurrency(subtotal)]);
            // summaryData.push(['Total Tax:', `${taxPercent}%`, '', '', '', '', '', plainCurrency(taxAmount)]);
            summaryData.push(['CGST:', `${halfPercent}%`, '', '', '', '', '', plainCurrency(halfAmount)]);
            summaryData.push(['SGST:', `${halfPercent}%`, '', '', '', '', '', plainCurrency(halfAmount)]);
            summaryData.push(['Roundoff:', '', '', '', '', '', '', plainCurrency(selectedBill.summary.CM_Round_off || 0)]);
            summaryData.push(['Grand Total:', '', '', '', '', '', '', plainCurrency(selectedBill.summary.CM_Grand_Total)]);
            summaryData.push(['Advance Payment:', '', '', '', '', '', '', plainCurrency(selectedBill.summary.CM_Advance_Payment || 0)]);
            summaryData.push(['Balance:', '', '', '', '', '', '', plainCurrency(
                Number(selectedBill.summary.CM_Grand_Total) -
                Number(selectedBill.summary.CM_Advance_Payment || 0)
            )]);

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(summaryData);

            // Set column widths
            const colWidths = [
                { wch: 25 }, // Product Name
                { wch: 15 }, // Item Code
                { wch: 10 }, // Quantity
                { wch: 12 }, // Unit Type
                { wch: 12 }, // Unit Price
                { wch: 12 }, // Discount %
                { wch: 15 }, // Discount Amount
                { wch: 15 }  // Total Price
            ];
            ws['!cols'] = colWidths;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, `Bill_${selectedBill.summary.CM_Bill_Number}`);

            // Generate and download file
            const fileName = `Bill_${selectedBill.summary.CM_Bill_Number}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success(`Excel downloaded for Bill #${selectedBill.summary.CM_Bill_Number}`);
        } catch (error) {
            console.error('Excel download error:', error);
            toast.error('Failed to download Excel file');
        }
    };


    const downloadBillPDF = async () => {
        try {
            const { default: jsPDF } = await import("jspdf");
            const autoTable = (await import("jspdf-autotable")).default;

            const bill = selectedBill;
            if (!bill) {
                toast.error("No bill selected.");
                return;
            }

            const doc = new jsPDF("p", "pt", "a4");
            const marginX = 40;
            let y = 40;

            const clean = (v) => Number(v || 0).toFixed(2);

            // ---------------------------
            // TITLE
            // ---------------------------
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.text(`Bill #${bill.summary.CM_Bill_Number}`, marginX, y);
            y += 30;

            // ---------------------------
            // SUPPLIER DETAILS
            // ---------------------------
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Supplier Information", marginX, y);
            y += 20;

            doc.setFont("helvetica", "normal");
            doc.text(`Company Name: ${bill.summary.CM_Company_Name}`, marginX, y); y += 15;
            doc.text(`Supplier Code: ${bill.summary.CM_Supplier_Code || "N/A"}`, marginX, y); y += 15;
            doc.text(`Email: ${bill.summary.CM_Email || "N/A"}`, marginX, y); y += 15;
            doc.text(`Phone: ${bill.summary.CM_Phone_Number || "N/A"}`, marginX, y); y += 15;
            doc.text(`GST: ${bill.summary.CM_GST_Number || "N/A"}`, marginX, y); y += 15;
            doc.text(`PAN: ${bill.summary.CM_PAN_Number || "N/A"}`, marginX, y); y += 30;

            // ---------------------------
            // BILL DETAILS
            // ---------------------------
            doc.setFont("helvetica", "bold");
            doc.text("Bill Information", marginX, y);
            y += 20;

            doc.setFont("helvetica", "normal");
            doc.text(`Bill Number: ${bill.summary.CM_Bill_Number}`, marginX, y); y += 15;
            doc.text(`Purchase Date: ${formatDate(bill.summary.CM_Purchase_Date)}`, marginX, y); y += 15;
            doc.text(`Delivery Date: ${formatDate(bill.summary.CM_Delivery_Date)}`, marginX, y); y += 15;
            doc.text(`Payment Terms: ${bill.summary.CM_Payment_Terms}`, marginX, y); y += 15;
            doc.text(`Grand Total: INR ${clean(bill.summary.CM_Grand_Total)}`, marginX, y);
            y += 30;

            // ---------------------------
            // PRODUCTS TABLE
            // ---------------------------
            autoTable(doc, {
                startY: y,
                head: [[
                    "Product",
                    "Qty",
                    "Unit Price",
                    "Discount",
                    "Total"
                ]],
                body: bill.products.map((p) => [
                    `${p.CM_Product_Name}\nCode: ${p.CM_Item_Code || "-"}`,
                    `${p.CM_Quantity} ${p.CM_Unit_Type}`,
                    clean(p.CM_Unit_Price),
                    p.CM_Discount_Percentage > 0
                        ? `${p.CM_Discount_Percentage}% (${clean(p.CM_Discount_Amount)})`
                        : "—",
                    clean(p.CM_Total_Price)
                ]),
                styles: {
                    fontSize: 9,
                    cellPadding: 6,
                    font: "helvetica"
                },
                headStyles: {
                    fillColor: [37, 99, 235],
                    textColor: [255, 255, 255],
                    fontStyle: "bold"
                },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: marginX, right: marginX },
            });

            // Move y after table
            let finalY = doc.lastAutoTable.finalY + 30;

            // ---------------------------
            // BILL SUMMARY
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("Bill Summary", marginX, finalY);
            finalY += 20;

            const subtotal = bill.products.reduce(
                (s, p) => s + Number(p.CM_Total_Price || 0),
                0
            );

            const taxPercent = Number(bill.summary.CM_Tax_Percentage);
            const taxAmount = Number(bill.summary.CM_Tax_Amount);
            const halfPercent = taxPercent / 2;
            const halfAmount = taxAmount / 2;

            doc.setFont("helvetica", "normal");
            doc.text(`Subtotal: INR ${clean(subtotal)}`, marginX, finalY); finalY += 15;

            // doc.text(`${bill.summary.CM_Tax_Type} (${taxPercent}%): INR ${clean(taxAmount)}`, marginX, finalY);
            // finalY += 15;

            doc.text(`CGST (${halfPercent}%): INR ${clean(halfAmount)}`, marginX, finalY);
            finalY += 15;

            doc.text(`SGST (${halfPercent}%): INR ${clean(halfAmount)}`, marginX, finalY);
            finalY += 15;

            doc.text(`Round Off: INR ${clean(bill.summary.CM_Round_off)}`, marginX, finalY);
            finalY += 15;

            doc.text(`Grand Total: INR ${clean(bill.summary.CM_Grand_Total)}`, marginX, finalY);
            finalY += 15;

            doc.text(`Advance Payment: INR ${clean(bill.summary.CM_Advance_Payment)}`, marginX, finalY);
            finalY += 15;

            const balance = bill.summary.CM_Grand_Total - bill.summary.CM_Advance_Payment;

            doc.setFont("helvetica", "bold");
            doc.text(`Balance Amount: INR ${clean(balance)}`, marginX, finalY);

            // ---------------------------
            // FOOTER
            // ---------------------------
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text(
                    `Generated | Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 20,
                    { align: "center" }
                );
            }

            // ---------------------------
            // SAVE FILE
            // ---------------------------
            doc.save(`bill_${bill.summary.CM_Bill_Number}.pdf`);
            toast.success("Bill PDF downloaded successfully!");

        } catch (err) {
            console.error("PDF Error:", err);
            toast.error("Failed to download bill PDF.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-blue-900/20 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:w-[90%] md:w-[80%] lg:w-[70%] overflow-auto border border-blue-100 transform transition-all sm:rounded-xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-300 to-blue-300 px-4 sm:px-6 py-4 text-black flex items-center justify-between sticky top-0 z-20 shadow-md">

                    {/* Title */}
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>

                        <h2 className="text-lg sm:text-xl font-semibold tracking-wide">
                            Bill #{selectedBill.summary.CM_Bill_Number}
                        </h2>
                    </div>

                    {/* Right Section (Download + Close) */}
                    <div className="flex items-center gap-3">

                        {/* Download Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg shadow-sm hover:bg-white/30 transition-all backdrop-blur-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="font-medium">Download</span>
                                <svg
                                    className={`w-4 h-4 transform transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-30 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-2">

                                        {/* Excel */}
                                        <button
                                            onClick={() => { setShowMenu(false); downloadBillExcel(); }}
                                            className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all group"
                                        >
                                            <div className="flex items-center justify-center w-9 h-9 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                                                </svg>
                                            </div>
                                            <div className="font-medium">Download Excel</div>
                                        </button>

                                        {/* PDF */}
                                        <button
                                            onClick={() => { setShowMenu(false); downloadBillPDF(); }}
                                            className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all group mt-1"
                                        >
                                            <div className="flex items-center justify-center w-9 h-9 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200">
                                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="font-medium">Download PDF</div>
                                        </button>

                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all backdrop-blur-sm shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-3 sm:p-6">
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-8 max-w-4xl mx-auto">
                        <h1 className="text-xl sm:text-2xl font-bold text-center mb-6 text-blue-800 border-b-2 border-blue-200 pb-2">Bill Details</h1>

                        {/* From-To Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-8">
                            {/* Supplier Information */}
                            <div>
                                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-blue-700 border-b border-gray-200 pb-2">Supplier Information</h2>
                                <div className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700">
                                    <p><span className="font-medium">Company Name:</span> {selectedBill.summary.CM_Company_Name}</p>
                                    <p><span className="font-medium">Supplier Code:</span> {selectedBill.summary.CM_Supplier_Code || 'N/A'}</p>
                                    <p><span className="font-medium">Email:</span> {selectedBill.summary.CM_Email || 'N/A'}</p>
                                    <p><span className="font-medium">Phone:</span> {selectedBill.summary.CM_Phone_Number || 'N/A'}</p>
                                    <p><span className="font-medium">GST Number:</span> {selectedBill.summary.CM_GST_Number || 'N/A'}</p>
                                    <p><span className="font-medium">PAN Number:</span> {selectedBill.summary.CM_PAN_Number || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Bill Information */}
                            <div>
                                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-blue-700 border-b border-gray-200 pb-2">Bill Information</h2>
                                <div className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700">
                                    <p><span className="font-medium">Bill Number:</span> {selectedBill.summary.CM_Bill_Number}</p>
                                    <p><span className="font-medium">Purchase Date:</span> {formatDate(selectedBill.summary.CM_Purchase_Date)}</p>
                                    <p><span className="font-medium">Delivery Date:</span> {formatDate(selectedBill.summary.CM_Delivery_Date)}</p>
                                    <p>
                                        <span className="font-medium">Payment Status:</span>
                                        <span className={`ml-1 ${selectedBill.summary.CM_Payment_Terms === 'Paid'
                                            ? 'text-green-600'
                                            : selectedBill.summary.CM_Payment_Terms === 'Partially Paid'
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                            }`}>
                                            {selectedBill.summary.CM_Payment_Terms}
                                        </span>
                                    </p>
                                    <p><span className="font-medium">Grand Total:</span> {formatCurrency(selectedBill.summary.CM_Grand_Total)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Products Section */}
                        <div className="mb-6">
                            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-blue-700 border-b border-gray-200 pb-2">Products</h2>
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <table className="min-w-full border border-gray-200 text-sm sm:text-base">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-2 sm:py-3 px-2 sm:px-4 border-b text-left text-gray-700">Product</th>
                                            <th className="py-2 sm:py-3 px-2 sm:px-4 border-b text-left text-gray-700">Quantity</th>
                                            <th className="py-2 sm:py-3 px-2 sm:px-4 border-b text-left text-gray-700">Unit Price</th>
                                            <th className="py-2 sm:py-3 px-2 sm:px-4 border-b text-left text-gray-700">Discount</th>
                                            <th className="py-2 sm:py-3 px-2 sm:px-4 border-b text-right text-gray-700">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBill.products.map((product, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="py-2 px-2 sm:px-4 border-b text-gray-700">
                                                    {product.CM_Product_Name}
                                                    <div className="text-xs text-gray-500">
                                                        {product.CM_Item_Code && `Code: ${product.CM_Item_Code}`}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 sm:px-4 border-b text-gray-700">
                                                    {product.CM_Quantity} {product.CM_Unit_Type}
                                                </td>
                                                <td className="py-2 px-2 sm:px-4 border-b text-gray-700">
                                                    {formatCurrency(product.CM_Unit_Price)}
                                                </td>
                                                <td className="py-2 px-2 sm:px-4 border-b text-gray-700">
                                                    {product.CM_Discount_Percentage > 0
                                                        ? `${product.CM_Discount_Percentage}% (${formatCurrency(product.CM_Discount_Amount)})`
                                                        : '—'
                                                    }
                                                </td>
                                                <td className="py-2 px-2 sm:px-4 border-b text-right font-medium text-gray-700">
                                                    {formatCurrency(product.CM_Total_Price)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end mb-4">
                            <div className="w-full sm:w-64">
                                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-blue-700 border-b border-gray-200 pb-2">
                                    Bill Summary
                                </h2>

                                <div className="space-y-2 text-sm sm:text-base text-gray-700">

                                    {/* Subtotal */}
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>
                                            {formatCurrency(
                                                selectedBill.products.reduce(
                                                    (sum, p) => sum + Number(p.CM_Total_Price || 0),
                                                    0
                                                )
                                            )}
                                        </span>
                                    </div>

                                    {/* Split CGST + SGST */}
                                    <div className="flex justify-between">
                                        <span>CGST ({selectedBill.summary.CM_Tax_Percentage / 2}%):</span>
                                        <span>{formatCurrency(selectedBill.summary.CM_Tax_Amount / 2)}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>SGST ({selectedBill.summary.CM_Tax_Percentage / 2}%):</span>
                                        <span>{formatCurrency(selectedBill.summary.CM_Tax_Amount / 2)}</span>
                                    </div>

                                    {/* Roundoff */}
                                    <div className="flex justify-between">
                                        <span>Roundoff:</span>
                                        <span>{formatCurrency(selectedBill.summary.CM_Round_off || 0)}</span>
                                    </div>

                                    {/* Grand Total */}
                                    <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t border-gray-200">
                                        <span>Grand Total:</span>
                                        <span>{formatCurrency(selectedBill.summary.CM_Grand_Total)}</span>
                                    </div>

                                    {/* Advance Payment */}
                                    <div className="flex justify-between">
                                        <span>Advance Payment:</span>
                                        <span>{formatCurrency(selectedBill.summary.CM_Advance_Payment || 0)}</span>
                                    </div>

                                    {/* Balance */}
                                    <div className="flex justify-between font-bold text-green-700 border-t border-gray-200 pt-2">
                                        <span>Balance Amount:</span>
                                        <span>
                                            {formatCurrency(
                                                Number(selectedBill.summary.CM_Grand_Total) -
                                                Number(selectedBill.summary.CM_Advance_Payment || 0)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-5 border-t border-gray-200 bg-gray-50 flex justify-end sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-3 sm:px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Create a client-side only version of the component
const ClientSideBillDetailsPopup = dynamic(() => Promise.resolve(BillDetailsPopup), { ssr: false });

const PurchaseHistory = () => {
    const router = useRouter();
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        fromDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        toDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
    });
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showBillPopup, setShowBillPopup] = useState(false);

    // New state for search functionality
    const [searchTerm, setSearchTerm] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // New state for selected bills (for individual download)
    const [selectedBills, setSelectedBills] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    // Add these state variables at the top of your component
    const [fullScreenImage, setFullScreenImage] = useState(null);
    const [imageZoom, setImageZoom] = useState(1);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        fetchPurchaseHistory();
    }, [dateRange]);

    // Update the select all state when historyData changes
    useEffect(() => {
        if (selectAll && historyData.length !== selectedBills.length) {
            setSelectAll(false);
        }
    }, [historyData, selectedBills]);

    const fetchPurchaseHistory = async () => {
        setHistoryLoading(true);
        try {
            const url = `/api/purchase-history?fromDate=${dateRange.fromDate}&toDate=${dateRange.toDate}`;
            const response = await axios.get(url);
            setHistoryData(response.data);
            // Reset selections when data is refreshed
            setSelectedBills([]);
            setSelectAll(false);
        } catch (error) {
            console.error('Error fetching purchase history:', error);
            setHistoryData([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Search functionality
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.length > 1) {
            // Generate suggestions based on bill number, supplier name, and products
            const suggestions = new Set();

            historyData.forEach(purchase => {
                // Bill number matches
                if (purchase.summary.CM_Bill_Number.toLowerCase().includes(value.toLowerCase())) {
                    suggestions.add(`Bill #${purchase.summary.CM_Bill_Number}`);
                }

                // Supplier matches
                if (purchase.summary.CM_Company_Name.toLowerCase().includes(value.toLowerCase())) {
                    suggestions.add(`Supplier: ${purchase.summary.CM_Company_Name}`);
                }

                // Product matches
                purchase.products.forEach(product => {
                    if (product.CM_Product_Name.toLowerCase().includes(value.toLowerCase())) {
                        suggestions.add(`Product: ${product.CM_Product_Name}`);
                    }
                    if (product.CM_Item_Code && product.CM_Item_Code.toLowerCase().includes(value.toLowerCase())) {
                        suggestions.add(`Item Code: ${product.CM_Item_Code}`);
                    }
                });
            });

            setSearchSuggestions(Array.from(suggestions).slice(0, 5)); // Limit to 5 suggestions
            setShowSuggestions(true);
        } else {
            setSearchSuggestions([]);
            setShowSuggestions(false);
        }
    };

    useEffect(() => {
        if (fullScreenImage) {
            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open

            const imageElement = document.querySelector('.fullscreen-image');
            if (imageElement) {
                imageElement.style.transform = `scale(${imageZoom})`;
            }
        } else {
            document.body.style.overflow = ''; // Re-enable scrolling when modal is closed
            setImageZoom(1); // Reset zoom when modal closes
        }

        return () => {
            document.body.style.overflow = ''; // Clean up on unmount
        };
    }, [fullScreenImage, imageZoom]);

    const handleSelectSuggestion = (suggestion) => {
        // Extract the actual search term from the suggestion format
        let searchValue = suggestion;

        if (suggestion.startsWith('Bill #')) {
            searchValue = suggestion.replace('Bill #', '');
        } else if (suggestion.startsWith('Supplier: ')) {
            searchValue = suggestion.replace('Supplier: ', '');
        } else if (suggestion.startsWith('Product: ')) {
            searchValue = suggestion.replace('Product: ', '');
        } else if (suggestion.startsWith('Item Code: ')) {
            searchValue = suggestion.replace('Item Code: ', '');
        }

        setSearchTerm(searchValue);
        setShowSuggestions(false);
    };

    // Filtered data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return historyData;

        const searchLower = searchTerm.toLowerCase();

        return historyData.filter(purchase => {
            // Check bill number
            if (purchase.summary.CM_Bill_Number.toLowerCase().includes(searchLower)) {
                return true;
            }

            // Check supplier name
            if (purchase.summary.CM_Company_Name.toLowerCase().includes(searchLower)) {
                return true;
            }

            // Check products
            return purchase.products.some(product =>
                product.CM_Product_Name.toLowerCase().includes(searchLower) ||
                (product.CM_Item_Code && product.CM_Item_Code.toLowerCase().includes(searchLower))
            );
        });
    }, [historyData, searchTerm]);

    // Handle bill selection for individual download
    const toggleBillSelection = (billNumber) => {
        setSelectedBills(prev => {
            if (prev.includes(billNumber)) {
                return prev.filter(bn => bn !== billNumber);
            } else {
                return [...prev, billNumber];
            }
        });
    };

    // Handle select all functionality
    const handleSelectAllToggle = () => {
        if (selectAll) {
            setSelectedBills([]);
        } else {
            setSelectedBills(filteredData.map(purchase => purchase.summary.CM_Bill_Number));
        }
        setSelectAll(!selectAll);
    };

    const openBillPopup = (bill) => {
        setSelectedBill(bill);
        setShowBillPopup(true);
    };

    const closeBillPopup = () => {
        setShowBillPopup(false);
        setSelectedBill(null);
    };

    const downloadExcel = async (selectedOnly = false) => {
        const dataToExport = selectedOnly
            ? filteredData.filter(purchase => selectedBills.includes(purchase.summary.CM_Bill_Number))
            : filteredData;

        if (dataToExport.length === 0) {
            alert('No data to export to Excel');
            return;
        }

        setIsGeneratingExcel(true);
        try {
            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();

            // Create enhanced summary worksheet with all details
            const summaryData = [
                ['Purchase History Report'],
                [`Period: ${formatDate(dateRange.fromDate)} to ${formatDate(dateRange.toDate)}`],
                [`Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`],
                [`Export Type: ${selectedOnly ? `Selected Bills (${selectedBills.length})` : 'All Bills'}`],
                [],
                // Main header
                ['Bill #', 'Purchase Date', 'Supplier', 'Status', 'Subtotal', 'Tax Amount', 'Grand Total', 'Products']
            ];

            // Add summary data with products information
            dataToExport.forEach(purchase => {
                // Combine product names for the products column
                const productsList = purchase.products
                    .map(p => `${p.CM_Product_Name} (${p.CM_Quantity} ${p.CM_Unit_Type})`)
                    .join('; ');

                summaryData.push([
                    purchase.summary.CM_Bill_Number,
                    formatDate(purchase.summary.CM_Purchase_Date),
                    purchase.summary.CM_Company_Name,
                    purchase.summary.CM_Payment_Status,
                    plainCurrency(purchase.summary.CM_Subtotal !== null && purchase.summary.CM_Subtotal !== undefined
                        ? purchase.summary.CM_Subtotal
                        : (purchase.summary.CM_Grand_Total - purchase.summary.CM_Tax_Amount)),
                    plainCurrency(purchase.summary.CM_Tax_Amount),
                    plainCurrency(purchase.summary.CM_Grand_Total),
                    productsList
                ]);
            });

            const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);

            // Add column widths for better readability
            const summaryColWidths = [
                { wch: 12 }, // Bill #
                { wch: 15 }, // Purchase Date
                { wch: 25 }, // Supplier
                { wch: 12 }, // Status
                { wch: 12 }, // Subtotal
                { wch: 12 }, // Tax Amount
                { wch: 12 }, // Grand Total
                { wch: 40 }, // Products (wider for product list)
            ];
            summaryWs['!cols'] = summaryColWidths;

            // Add summary worksheet to workbook
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Purchase History');

            // Generate Excel file and trigger download
            let fileName;

            if (selectedOnly) {
                const billCount = selectedBills.length;
                fileName = `Selected-Bills-${billCount}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
            } else {
                fileName = `Purchase-History-All-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
            }

            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error('Error generating Excel:', error);
            alert('Error generating Excel file. Please try again.');
        } finally {
            setIsGeneratingExcel(false);
        }
    };

    const downloadPDF = async (selectedOnly = false) => {
        try {
            const { default: jsPDF } = await import("jspdf");
            const autoTable = (await import("jspdf-autotable")).default;

            const dataToExport = selectedOnly
                ? filteredData.filter(purchase =>
                    selectedBills.includes(purchase.summary.CM_Bill_Number)
                )
                : filteredData;

            if (dataToExport.length === 0) {
                alert("No data to export to PDF");
                return;
            }

            const doc = new jsPDF("p", "pt", "a4");
            const currentDate = new Date().toLocaleDateString();
            const currentTime = new Date().toLocaleTimeString();

            // Helper to ensure values show properly
            const cleanNumber = (value) => Number(value || 0).toFixed(2);

            const totalAmount = dataToExport.reduce(
                (sum, p) => sum + (parseFloat(p.summary.CM_Grand_Total) || 0),
                0
            );

            // ---------------------------
            // TITLE (LEFT)
            // ---------------------------
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("PURCHASE HISTORY REPORT", 40, 40);

            // ---------------------------
            // REPORT DETAILS (LEFT SIDE)
            // ---------------------------
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Report Details:", 40, 70);

            doc.setFont("helvetica", "normal");
            doc.text(`Generated: ${currentDate} at ${currentTime}`, 40, 90);
            doc.text(`Total Bills: ${dataToExport.length}`, 40, 105);
            doc.text(`Type: ${selectedOnly ? "Selected Bills" : "All Bills"}`, 40, 120);
            doc.text(
                `Period: ${formatDate(dateRange.fromDate)} to ${formatDate(dateRange.toDate)}`,
                40,
                135
            );

            // ---------------------------
            // SUMMARY (LEFT)
            // ---------------------------
            doc.setFont("helvetica", "bold");
            doc.text("Summary:", 40, 165);

            doc.setFont("helvetica", "normal");
            doc.text(`Total Amount: INR ${cleanNumber(totalAmount)}`, 40, 185);

            // ---------------------------
            // MAIN TABLE
            // ---------------------------
            autoTable(doc, {
                startY: 210,
                head: [[
                    "Bill No.",
                    "Date",
                    "Supplier",
                    "Payment Terms",
                    "Subtotal",
                    "Tax Amount",
                    "Grand Total"
                ]],
                body: dataToExport.map((p) => {
                    const subtotal =
                        p.summary.CM_Subtotal ??
                        (p.summary.CM_Grand_Total - p.summary.CM_Tax_Amount);

                    const formattedDate = new Date(p.summary.CM_Purchase_Date)
                        .toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        });

                    return [
                        p.summary.CM_Bill_Number,
                        formattedDate,
                        p.summary.CM_Company_Name,
                        p.summary.CM_Payment_Terms,
                        cleanNumber(subtotal),
                        cleanNumber(p.summary.CM_Tax_Amount),
                        cleanNumber(p.summary.CM_Grand_Total)
                    ];
                }),
                styles: { fontSize: 9, cellPadding: 6, font: "helvetica" },
                headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    0: { cellWidth: 60 },
                    4: { halign: "right", cellWidth: 70 },
                    5: { halign: "right", cellWidth: 70 },
                    6: { halign: "right", cellWidth: 80 }
                },
                margin: { left: 40, right: 40 }
            });

            // ---------------------------
            // FOOTER
            // ---------------------------
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text(
                    `Generated by Purchase Management System | Page ${i} of ${pageCount} | ${currentDate}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 20,
                    { align: "center" }
                );
            }

            // SAVE PDF
            doc.save(`purchase_report_${new Date().toISOString().slice(0, 10)}.pdf`);
            toast.success(`PDF downloaded successfully! ${dataToExport.length} bills included.`);

        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF. Please try again.");
        }
    };

    // Helper functions (make sure these are available in your component)
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
        const num = parseFloat(amount);
        return '₹' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };


    const clearSearch = () => {
        setSearchTerm('');
        setSearchSuggestions([]);
        setShowSuggestions(false);
    };

    const handleAddProduct = () => router.push('/addproduct');
    const handleAddItem = () => router.push('/additems');

    return (
        <div className="flex flex-col md:flex-row h-screen bg-white">
            {/* Sidebar */}
            <Navbar />
            <div className="flex-1 overflow-y-auto bg-blue-50/50">
                <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
                    {/* Header with back button */}
                    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        {/* Left Section — Title */}
                        <div className="flex items-center">
                            <h1 className="text-xl sm:text-3xl font-bold text-gray-800 flex items-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Purchase History
                            </h1>
                        </div>

                        {/* Right Section — Buttons */}
                        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">

                            {/* Add New Products */}
                            <button
                                onClick={handleAddItem}
                                className="group relative w-full sm:w-auto flex items-center justify-center gap-3
                                bg-green-100 hover:bg-green-200 text-gray-800 border border-green-200 
                                rounded-xl py-3 px-5 shadow-sm hover:shadow-md transition-all duration-300
                                active:scale-95"
                            >
                                <div className="p-1.5 rounded-lg bg-emerald-100 group-hover:bg-emerald-500 transition-all duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-emerald-600 group-hover:text-white transition-colors duration-300"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium">Add New Products</span>

                                {/* ripple / gradient effect */}
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-200 to-transparent opacity-0 group-hover:opacity-50 transition-all duration-300 rounded-xl"></span>
                            </button>

                            {/* Add Purchase */}
                            <button
                                onClick={handleAddProduct}
                                className="group relative w-full sm:w-auto flex items-center justify-center gap-3
                                bg-purple-100 hover:bg-purple-200 text-gray-800 border border-purple-200 
                                rounded-xl py-3 px-5 shadow-sm hover:shadow-md transition-all duration-300
                                active:scale-95"
                            >
                                <div className="p-1.5 rounded-lg bg-purple-100 group-hover:bg-purple-600 transition-all duration-300">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-purple-600 group-hover:text-white transition-colors duration-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>

                                <span className="text-sm font-medium">Add Purchase</span>

                                {/* subtle animated overlay */}
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-200 to-transparent opacity-0 group-hover:opacity-50 transition-all duration-300 rounded-xl"></span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="mb-6 sm:mb-8 p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl shadow-md border border-blue-100">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Filter Purchase History</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div className="col-span-1">
                                <div className="flex flex-wrap gap-3 sm:gap-4 items-end">
                                    <div className="w-full sm:w-auto">
                                        <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                        <input
                                            type="date"
                                            id="fromDate"
                                            name="fromDate"
                                            value={dateRange.fromDate}
                                            onChange={handleDateChange}
                                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                                        />
                                    </div>

                                    <div className="w-full sm:w-auto">
                                        <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                        <input
                                            type="date"
                                            id="toDate"
                                            name="toDate"
                                            value={dateRange.toDate}
                                            onChange={handleDateChange}
                                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2">

                                {/* 🌟 Top Bar — Search Left / Download Right */}
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">

                                    {/* ---------------- SEARCH INPUT ---------------- */}
                                    <div className="flex-1 min-w-0">
                                        <label
                                            htmlFor="searchTerm"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Search by Bill No, Supplier, Product or Item Code
                                        </label>

                                        <div className="relative">
                                            {/* Icon */}
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-gray-400"
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>

                                            <input
                                                type="text"
                                                id="searchTerm"
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                                placeholder="Type to search..."
                                                className="block w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 text-sm"
                                            />

                                            {/* Clear Button */}
                                            {searchTerm && (
                                                <button
                                                    onClick={clearSearch}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                                        stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                            d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}

                                            {/* Suggestions Box */}
                                            {showSuggestions && searchSuggestions.length > 0 && (
                                                <div className="absolute z-20 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                                                    <ul className="max-h-60 overflow-auto py-1 text-sm">
                                                        {searchSuggestions.map((s, index) => (
                                                            <li
                                                                key={index}
                                                                onClick={() => handleSelectSuggestion(s)}
                                                                className="cursor-pointer px-4 py-2 hover:bg-blue-50 flex items-center text-gray-700"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-4 w-4 mr-2 text-blue-500"
                                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                </svg>
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ---------------- DOWNLOAD DROPDOWN ---------------- */}
                                    <div className="relative shrink-0 sm:self-end">
                                        <button
                                            onClick={() => setShowMenu(!showMenu)}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>

                                            Download

                                            <svg
                                                className={`w-4 h-4 transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`}
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showMenu && (
                                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-20 animate-in fade-in zoom-in">
                                                <div className="p-2">

                                                    {/* Excel */}
                                                    <button
                                                        onClick={() => { setShowMenu(false); downloadExcel(selectedBills.length > 0); }}
                                                        className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all group mb-1"
                                                    >
                                                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200">
                                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor"
                                                                viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                    d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h12a3 3 0 003-3v-2a3 3 0 00-3-3h-1a3 3 0 01-3-3m0-8v2m0 0V5a2 2 0 112 2h-2z" />
                                                            </svg>
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Download Excel</div>
                                                            <div className="text-xs text-gray-500">
                                                                {selectedBills.length > 0
                                                                    ? `${selectedBills.length} selected`
                                                                    : `${filteredData.length} all`}
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* PDF */}
                                                    <button
                                                        onClick={() => { setShowMenu(false); downloadPDF(selectedBills.length > 0); }}
                                                        className="flex items-center w-full px-3 py-3 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all group"
                                                    >
                                                        <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3 group-hover:bg-red-200">
                                                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor"
                                                                viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Download PDF</div>
                                                            <div className="text-xs text-gray-500">
                                                                {selectedBills.length > 0
                                                                    ? `${selectedBills.length} selected`
                                                                    : `${filteredData.length} all`}
                                                            </div>
                                                        </div>
                                                    </button>

                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Purchase History Table */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden border border-blue-100">
                        <div className="p-3 sm:p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                                    Purchase History
                                    {filteredData.length > 0 &&
                                        <span className="ml-2 text-xs sm:text-sm font-normal text-gray-500">
                                            ({filteredData.length} records found)
                                        </span>
                                    }
                                </h2>
                            </div>

                            {historyLoading ? (
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
                            ) : filteredData.length > 0 ? (
                                <div className="overflow-x-auto -mx-3 sm:mx-0">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                                                    <div className="flex justify-center">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            checked={selectAll}
                                                            onChange={handleSelectAllToggle}
                                                        />
                                                    </div>
                                                </th>
                                                <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-sm font-medium text-gray-900  tracking-wider">Purchase Date</th>
                                                <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-sm font-medium text-gray-900  tracking-wider">Bill No</th>
                                                <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-sm font-medium text-gray-900  tracking-wider">Supplier</th>
                                                <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-sm font-medium text-gray-900  tracking-wider">Bill Amount</th>
                                                <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-center text-sm font-medium text-gray-900  tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredData.map((purchase) => (
                                                <tr key={purchase.summary.CM_Bill_Number} className="hover:bg-gray-50">
                                                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                                                        <div className="flex justify-center">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                checked={selectedBills.includes(purchase.summary.CM_Bill_Number)}
                                                                onChange={() => toggleBillSelection(purchase.summary.CM_Bill_Number)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                                        {formatDate(purchase.summary.CM_Purchase_Date)}
                                                    </td>
                                                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                                        {purchase.summary.CM_Bill_Number}
                                                    </td>
                                                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                                        <span className="truncate block max-w-[120px] sm:max-w-[200px]">
                                                            {purchase.summary.CM_Company_Name}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                                        {formatCurrency(purchase.summary.CM_Grand_Total)}
                                                    </td>
                                                    <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-center">
                                                        <button
                                                            onClick={() => openBillPopup(purchase)}
                                                            className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 sm:px-3 py-1 rounded-md transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center p-4 sm:p-8">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-lg sm:text-xl font-medium text-gray-600 mb-1">No purchase history found</p>
                                    <p className="text-sm sm:text-base text-gray-500">
                                        {searchTerm ? 'No records match your search criteria.' : 'No records found for the selected date range.'}
                                    </p>
                                    {searchTerm && (
                                        <button
                                            onClick={clearSearch}
                                            className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                                        >
                                            Clear Search
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bill Detail Popup - Using the client-side only component */}
                {showBillPopup && selectedBill && (
                    <ClientSideBillDetailsPopup
                        selectedBill={selectedBill}
                        onClose={closeBillPopup}
                    />
                )}

                {/* Full-screen Image Modal */}
                {fullScreenImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-2 sm:p-4">
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                            {/* Close Button */}
                            <button
                                onClick={() => setFullScreenImage(null)}
                                className="absolute top-2 sm:top-4 right-2 sm:right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-1 sm:p-2 transition-all z-10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Image Title */}
                            <div className="absolute top-2 sm:top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white py-1 sm:py-2 px-2 sm:px-4 rounded-lg z-10 text-sm sm:text-base">
                                {fullScreenImage.name}
                            </div>

                            {/* Image Container */}
                            <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                <img
                                    src={fullScreenImage.url}
                                    alt={fullScreenImage.name}
                                    className="fullscreen-image max-w-full max-h-full object-contain transition-all"
                                />
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-4 bg-black bg-opacity-50 rounded-lg p-1 sm:p-2">
                                <button
                                    onClick={() => setImageZoom(prevZoom => Math.max(prevZoom - 0.1, 0.5))}
                                    className="text-white hover:text-blue-400 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setImageZoom(1)} // Reset zoom
                                    className="text-white hover:text-blue-400 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setImageZoom(prevZoom => Math.min(prevZoom + 0.1, 2))}
                                    className="text-white hover:text-blue-400 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseHistory;