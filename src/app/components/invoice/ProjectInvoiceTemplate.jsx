"use client";

import React, { forwardRef } from "react";
import { numberToWordsINR } from "@/app/utils/numberToWords";

const ProjectInvoiceTemplate = forwardRef(({ invoiceData }, ref) => {
  if (!invoiceData) return null;

  const {
    // Proposal & Document Type
    documentType = "TAX INVOICE",
    proposalGiven = "Yes",
    proposalNo = 1,
    companyName = "Celeris Solutions",
    companyGstin = "33AAVFC1276D1ZI",
    companyEmail = "prabakar@celerissolutions.in",
    
    // Bill To
    salutation = "Mr.",
    clientName = "Srinivas",
    clientCompany = "Surya Hospital",
    clientPhone = "+91 70101 10485",
    clientAddress = "24J, SH 195, OLD KUYAVAR PALAYAM, MADURAI, TAMIL NADU 625009",
    clientGstin = "",

    // Invoice Metadata
    invoiceNo = "INV-56",
    invoiceDate = "07 SEP 2026",
    dueDate = "07 SEP 2026",
    placeOfSupply = "TAMIL NADU",

    // Items List
    items = [
      {
        id: 1,
        description: "Electronics Service Application",
        hsnSac: "9983",
        amount: 8474.57
      }
    ],

    // Rounding & Tax Controls
    enableRoundOff = true,
    manualRoundOff = null,
    taxType = "CGST_SGST",
    cgstRate = 9.00,
    sgstRate = 9.00,
    igstRate = 18.00,

    // Bank Account Details
    accountHolderName = "Celeris Solutions",
    bankPhone = "9597979111",
    bankName = "Indian Overseas Bank",
    accountNo = "182302000009977",
    ifscCode = "IOBA0001823",

    // Payment & Project Notes
    paymentStage = "Advance Payment",
    totalProjectCost = 40000,
    costBreakdownNote = "The application charge is ₹25,000. An additional charge of ₹5,000 per branch/company will be applicable. For 3 branches/companies, the additional charge will be ₹15,000, making the total application charge ₹40,000.",
    advancePayment = 10000,
    advanceDate = "07-SEP-2026",
    signatureUrl = null,
  } = invoiceData;

  // Compute Taxable Amount and Taxes
  const rawSubtotal = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let totalTax = 0;

  if (taxType === "CGST_SGST") {
    cgstAmount = Number(((rawSubtotal * cgstRate) / 100).toFixed(2));
    sgstAmount = Number(((rawSubtotal * sgstRate) / 100).toFixed(2));
    totalTax = Number((cgstAmount + sgstAmount).toFixed(2));
  } else if (taxType === "IGST") {
    igstAmount = Number(((rawSubtotal * igstRate) / 100).toFixed(2));
    totalTax = igstAmount;
  } else {
    // EXCLUDE GST / NON-GST (0%)
    cgstAmount = 0;
    sgstAmount = 0;
    igstAmount = 0;
    totalTax = 0;
  }

  const unroundedTotal = Number((rawSubtotal + totalTax).toFixed(2));
  let roundOff = 0;
  let finalTotal = unroundedTotal;

  if (manualRoundOff !== null && manualRoundOff !== undefined && !isNaN(Number(manualRoundOff)) && manualRoundOff !== "") {
    roundOff = Number(manualRoundOff);
    finalTotal = unroundedTotal + roundOff;
  } else if (enableRoundOff) {
    finalTotal = Math.round(unroundedTotal);
    roundOff = Number((finalTotal - unroundedTotal).toFixed(2));
  }

  const outstandingPayment = Math.max(0, totalProjectCost - finalTotal);
  const calculatedAdvancePayment = finalTotal;
  const amountInWords = numberToWordsINR(finalTotal);

  const formatCurrency = (val) => {
    return (Number(val) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div
      ref={ref}
      className="invoice-container bg-white text-gray-900 mx-auto font-sans shadow-sm print:shadow-none print:border-none text-xs sm:text-sm relative overflow-hidden aspect-[210/297]"
      style={{
        width: "100%",
        maxWidth: "800px",
        minHeight: "1131px",
        boxSizing: "border-box",
        backgroundColor: "#ffffff"
      }}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.07]">
        <img src="/logo.png" alt="Watermark" className="w-[560px] max-w-full h-auto object-contain" />
      </div>

      {/* Left Edge Gray Bar & Orange Ribbon Accent (Equal breadth 18px white margin & 18px bar width) */}
      <div className="absolute left-[18px] top-0 bottom-0 w-[18px] bg-[#c5c9d0] z-0"></div>
      <div 
        className="absolute left-[18px] top-[45%] w-[18px] h-72 bg-[#ea580c] z-10" 
        style={{ clipPath: 'polygon(0 14%, 100% 0%, 100% 86%, 0 100%)' }}
      ></div>

      {/* Right Edge Gray Bar & Orange Ribbon Accent (Equal breadth 18px white margin & 18px bar width) */}
      <div className="absolute right-[18px] top-0 bottom-0 w-[18px] bg-[#c5c9d0] z-0"></div>
      <div 
        className="absolute right-[18px] top-[12%] w-[18px] h-72 bg-[#ea580c] z-10" 
        style={{ clipPath: 'polygon(0 0%, 100% 14%, 100% 100%, 0 86%)' }}
      ></div>

      {/* Content Wrapper */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between pt-5 pb-6 px-12 box-border">
        <div>
          {/* Letterhead Header */}
          <div className="flex justify-between items-center mb-4 pb-1 w-full">
            {/* Header Left: 5 Faint Speed Lines + Logo + Corporate Wordmark */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <svg className="w-5 h-10 flex-shrink-0 overflow-visible" viewBox="0 0 20 40">
                <defs>
                  <linearGradient id="fadeLeftLines" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#64748b" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#64748b" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="4" x2="18" y2="4" stroke="url(#fadeLeftLines)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="0" y1="12" x2="18" y2="12" stroke="url(#fadeLeftLines)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="0" y1="20" x2="18" y2="20" stroke="url(#fadeLeftLines)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="0" y1="28" x2="18" y2="28" stroke="url(#fadeLeftLines)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="0" y1="36" x2="18" y2="36" stroke="url(#fadeLeftLines)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              <img src="/logo.png" alt="Celeris Solutions Logo" className="h-12 w-auto object-contain flex-shrink-0" />
              
              {/* SVG Corporate Wordmark: Condensed Solid Deep Maroon Fill with Crisp White Contour Border & Soft Downward Shadow */}
              <svg width="225" height="38" viewBox="0 0 225 38" className="overflow-visible flex-shrink-0 ml-0.5">
                <defs>
                  {/* Tight Downward Maroon Shadow */}
                  <filter id="corporateShadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="1.4" stdDeviation="0.7" floodColor="#3b0012" floodOpacity="0.5" />
                  </filter>
                </defs>

                {/* 1. Base White Outline Contour + Downward Shadow */}
                <text
                  x="0"
                  y="27"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  fontFamily='"Arial Narrow", "Helvetica Neue", "Arial", sans-serif'
                  fontSize="28"
                  fontWeight="900"
                  textLength="220"
                  lengthAdjust="spacingAndGlyphs"
                  filter="url(#corporateShadow)"
                >
                  {(companyName || "CELERIS SOLUTIONS").toUpperCase()}
                </text>

                {/* 2. Solid Deep Wine-Red Text Fill (Rendered on top for solid stems) */}
                <text
                  x="0"
                  y="27"
                  fill="#781436"
                  fontFamily='"Arial Narrow", "Helvetica Neue", "Arial", sans-serif'
                  fontSize="28"
                  fontWeight="900"
                  textLength="220"
                  lengthAdjust="spacingAndGlyphs"
                >
                  {(companyName || "CELERIS SOLUTIONS").toUpperCase()}
                </text>
              </svg>
            </div>
            
            {/* Header Right: Parallel Horizontal Grey Lines Fading Left to Right */}
            <svg className="flex-1 ml-4 h-10 overflow-visible min-w-[120px]" viewBox="0 0 240 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fadeRightBar" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#64748b" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#94a3b8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              {/* Parallel Horizontal Lines */}
              <line x1="0" y1="4" x2="240" y2="4" stroke="url(#fadeRightBar)" strokeWidth="1.5" />
              <line x1="0" y1="9" x2="240" y2="9" stroke="url(#fadeRightBar)" strokeWidth="1.5" />
              <line x1="0" y1="14" x2="240" y2="14" stroke="url(#fadeRightBar)" strokeWidth="1.5" />
              <line x1="0" y1="19" x2="240" y2="19" stroke="url(#fadeRightBar)" strokeWidth="1.5" />
              <line x1="0" y1="24" x2="240" y2="24" stroke="url(#fadeRightBar)" strokeWidth="1.5" />
              <line x1="0" y1="29" x2="240" y2="29" stroke="url(#fadeRightBar)" strokeWidth="1.5" />
              <line x1="0" y1="34" x2="240" y2="34" stroke="url(#fadeRightBar)" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Original Header Content (Document Type, GSTIN) */}
          <div className="flex justify-between items-start mb-3 border-b border-gray-200 pb-2">
            <div>
              <h2 className="text-lg font-bold tracking-wider text-gray-800 uppercase">
                {documentType || "TAX INVOICE"}
              </h2>
              {proposalGiven === "Yes" && (
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold tracking-wide">
                  INVOICE #{proposalNo} (GIVEN)
                </span>
              )}
            </div>
            <div className="text-right text-xs font-medium text-gray-700 space-y-0.5">
              <p>
                GSTIN <span className="font-semibold text-gray-900">{companyGstin}</span>
              </p>
              <p>
                Email: <span className="text-gray-900">{companyEmail}</span>
              </p>
            </div>
          </div>

          {/* Bill To & Invoice Info Details */}
          <div className="flex justify-between items-start mb-3 text-xs text-gray-800">
            {/* Left: Bill To */}
            <div className="w-7/12 pr-4 space-y-0.5">
              <p className="font-bold text-gray-900">Bill To:</p>
              {clientName && (
                <p className="font-semibold text-gray-900">
                  {salutation ? `${salutation} ${clientName}` : clientName}
                </p>
              )}
              {clientCompany && <p className="font-semibold">{clientCompany}</p>}
              {clientPhone && <p>Ph: {clientPhone}</p>}
              {clientAddress && (
                <p className="uppercase leading-snug font-normal text-gray-700 max-w-sm mt-0.5">
                  {clientAddress}
                </p>
              )}
              {clientGstin && <p className="font-medium mt-0.5">GSTIN: {clientGstin}</p>}
            </div>

            {/* Right: Invoice Meta */}
            <div className="w-5/12 text-right space-y-0.5">
              <div className="grid grid-cols-2 text-right gap-x-2">
                <span className="font-bold text-gray-800">Invoice #:</span>
                <span className="font-bold text-gray-900">{invoiceNo}</span>

                <span className="font-bold text-gray-800">Invoice Date:</span>
                <span>{invoiceDate}</span>

                <span className="font-bold text-gray-800">Due Date:</span>
                <span>{dueDate}</span>

                <span className="font-bold text-gray-800">Place of Supply:</span>
                <span className="uppercase">{placeOfSupply}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-3">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#2563eb] text-white text-xs font-semibold uppercase">
                  <th className="py-1.5 px-3 text-left w-12">#</th>
                  <th className="py-1.5 px-3 text-left">ITEM</th>
                  <th className="py-1.5 px-3 text-center w-28">HSN/SAC</th>
                  <th className="py-1.5 px-3 text-right w-36">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50/50">
                    <td className="py-2 px-3 font-semibold">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-gray-900">{item.description}</td>
                    <td className="py-2 px-3 text-center">{item.hsnSac || "9983"}</td>
                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Tax Summary Box (Only shown when GST is included) */}
            {taxType !== "EXCLUDE" && (
              <div className="mt-3 flex flex-col items-start pl-6">
                <div className="border border-gray-900 text-center w-72 text-xs">
                  <div className="border-b border-gray-900 py-0.5 font-bold tracking-wide uppercase bg-gray-50">
                    TAX SUMMARY
                  </div>
                  {taxType === "CGST_SGST" ? (
                    <>
                      <div className="grid grid-cols-2 border-b border-gray-900 font-semibold py-0.5 bg-gray-50/50 text-[11px]">
                        <div className="border-r border-gray-900">CGST ({(cgstRate || 9).toFixed(2)}%)</div>
                        <div>SGST ({(sgstRate || 9).toFixed(2)}%)</div>
                      </div>
                      <div className="grid grid-cols-2 border-b border-gray-900 py-0.5 font-semibold text-[11px]">
                        <div className="border-r border-gray-900">{(cgstRate || 9).toFixed(2)} %</div>
                        <div>{(sgstRate || 9).toFixed(2)} %</div>
                      </div>
                      <div className="grid grid-cols-2 py-0.5 font-medium text-[11px]">
                        <div className="border-r border-gray-900">{formatCurrency(cgstAmount)} INR</div>
                        <div>{formatCurrency(sgstAmount)} INR</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-b border-gray-900 font-semibold py-0.5 bg-gray-50/50 text-[11px]">
                        IGST ({(igstRate || 18).toFixed(2)}%)
                      </div>
                      <div className="border-b border-gray-900 py-0.5 font-semibold text-[11px]">
                        {(igstRate || 18).toFixed(2)} %
                      </div>
                      <div className="py-0.5 font-medium text-[11px]">
                        {formatCurrency(igstAmount)} INR
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Subtotal & Total Right Align Box */}
            <div className="flex flex-col items-end mt-1 space-y-0.5 text-xs pr-2">
              {taxType !== "EXCLUDE" ? (
                <>
                  <div className="w-72 flex justify-between py-0.5 border-t border-gray-200">
                    <span className="text-gray-600">Tax Total:</span>
                    <span className="font-semibold text-gray-800">₹{formatCurrency(totalTax)}</span>
                  </div>
                  {(Math.abs(roundOff) > 0.0001 || (manualRoundOff !== null && manualRoundOff !== "")) && (
                    <div className="w-72 flex justify-between py-0.5 text-gray-600">
                      <span>Round Off</span>
                      <span className="font-medium">{roundOff >= 0 ? `+${formatCurrency(roundOff)}` : formatCurrency(roundOff)}</span>
                    </div>
                  )}
                  <div className="w-72 flex justify-between py-0.5">
                    <span className="font-semibold text-gray-700">Taxable Amount</span>
                    <span className="font-semibold text-gray-900">₹{formatCurrency(finalTotal)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-72 flex justify-between py-0.5 border-t border-gray-200">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-800">₹{formatCurrency(rawSubtotal)}</span>
                  </div>
                  {(Math.abs(roundOff) > 0.0001 || (manualRoundOff !== null && manualRoundOff !== "")) && (
                    <div className="w-72 flex justify-between py-0.5 text-gray-600">
                      <span>Round Off</span>
                      <span className="font-medium">{roundOff >= 0 ? `+${formatCurrency(roundOff)}` : formatCurrency(roundOff)}</span>
                    </div>
                  )}
                </>
              )}
              
              <div className="w-72 border-t-2 border-gray-800 my-0.5"></div>
              <div className="w-72 flex justify-between items-center py-0.5">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">₹{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Summary Footer Line */}
          <div className="flex justify-between items-center border-t border-b border-blue-500 py-1 px-1 mb-3 text-[11px] font-medium text-gray-700">
            <div>Total Items / Qty: {items.length}</div>
            <div>
              Total amount (in words): <span className="font-semibold text-gray-900">{amountInWords}</span>
            </div>
          </div>

          {/* Account Details & Signature Block */}
          <div className="flex justify-between items-end mb-3 text-xs">
            {/* Left: Account Details */}
            <div className="space-y-0.5 text-gray-800">
              <p className="font-bold text-gray-900">Account Details:</p>
              <p>
                Name: <span className="font-bold text-red-700">{accountHolderName}</span>
              </p>
              <p>
                Phone: <span className="font-bold">{bankPhone}</span>
              </p>
              <p>
                Bank Name: <span className="font-semibold">{bankName}</span>
              </p>
              <p>
                Account No: <span className="font-semibold">{accountNo}</span>
              </p>
              <p>
                IFSC Code: <span className="font-semibold">{ifscCode}</span>
              </p>
            </div>

            {/* Right: Signature */}
            <div className="text-center pr-4">
              <p className="text-[11px] font-semibold text-gray-600 mb-1">
                For {companyName.toUpperCase()}
              </p>
              <img
                src="/Picture1.png"
                alt="Authorized Signatory"
                className="h-16 mx-auto object-contain mb-1"
              />
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider pt-0.5 border-t border-gray-300 w-36 mx-auto">
                AUTHORIZED SIGNATORY
              </p>
            </div>
          </div>

          {/* Bottom Notes & Payment Breakdown */}
          <div className="border-t border-gray-200 pt-2 text-xs text-gray-800 space-y-0.5">
            <p className="font-bold text-gray-900">Notes:</p>
            <p className="font-medium text-gray-800">Payment Information:</p>
            <p className="font-semibold text-gray-900">
              Total Project Development Cost: ₹{totalProjectCost.toLocaleString("en-IN")}/-
            </p>
            {costBreakdownNote && (
              <p className="text-[11px] text-gray-600 leading-relaxed max-w-xl">
                Note: {costBreakdownNote}
              </p>
            )}
            <p className="font-semibold text-gray-900">
              {paymentStage || "Advance Payment"}: ₹{calculatedAdvancePayment.toLocaleString("en-IN")}.00 (Paid) {advanceDate}
            </p>
            <p className="font-semibold text-gray-900">
              Outstanding Payment: ₹{outstandingPayment.toLocaleString("en-IN")}/-
            </p>
          </div>
        </div>

        {/* Letterhead Footer */}
        <div className="mt-4 pt-2 pb-1 flex justify-between items-end border-t border-transparent relative">
          {/* Bottom Left: Phone & Address */}
          <div className="space-y-2.5 text-gray-800 z-10">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-[#475569] fill-current" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span className="text-[20px] font-black text-gray-900 tracking-wider font-sans">99403 56707</span>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-[#475569] fill-current mt-0.5 shrink-0" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <div className="text-[14px] font-extrabold text-gray-800 leading-tight">
                #25, Sathasivam Street,<br />Gobichettipalayam - 638 452.
              </div>
            </div>
          </div>

          {/* Bottom Right: 5 Stepped Horizontal Lines extending across to Right Margin */}
          <div className="flex-1 ml-6 flex flex-col items-end gap-[3px] mb-1">
            <div className="h-[2px] bg-[#94a3b8] w-[45%]"></div>
            <div className="h-[2px] bg-[#94a3b8] w-[60%]"></div>
            <div className="h-[2px] bg-[#94a3b8] w-[75%]"></div>
            <div className="h-[2px] bg-[#94a3b8] w-[90%]"></div>
            <div className="h-[2px] bg-[#94a3b8] w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
});
ProjectInvoiceTemplate.displayName = "ProjectInvoiceTemplate";

export default ProjectInvoiceTemplate;
