import React, { useState, useRef, useEffect } from "react";
import { X, Printer, Download, Plus, Trash2, Edit3, Eye, EyeOff, FileText, Save, Check, ArrowUp, ArrowDown } from "lucide-react";
import ProjectInvoiceTemplate from "./ProjectInvoiceTemplate";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export default function ProjectInvoiceModal({ isOpen, onClose, onSave, initialData = {} }) {
  const invoiceRef = useRef(null);
  const [activeTab, setActiveTab] = useState("edit"); // "edit" or "preview"
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Invoice State initialized with default or passed initialData
  const [invoiceData, setInvoiceData] = useState(() => ({
    documentType: initialData.documentType || "TAX INVOICE",
    proposalGiven: initialData.proposalGiven || "Yes",
    proposalNo: 1,
    proposalHistory: [],

    companyName: initialData.companyName || "Celeris Solutions",
    companyGstin: initialData.companyGstin || "33AAVFC1276D1ZI",
    companyEmail: initialData.companyEmail || "prabakar@celerissolutions.in",

    salutation: initialData.salutation || "Mr.",
    clientName: (initialData.client_name || initialData.clientName || "Srinivas").replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Er\.|M\/s\.|Prof\.)\s*/i, ""),
    clientCompany: initialData.client_company || initialData.clientCompany || initialData.project_name || "Surya Hospital",
    clientPhone: initialData.client_phone || initialData.clientPhone || "+91 70101 10485",
    clientAddress: initialData.client_address || initialData.clientAddress || "24J, SH 195, OLD KUYAVAR PALAYAM, MADURAI, TAMIL NADU 625009",
    clientGstin: initialData.clientGstin || "",

    invoiceNo: initialData.invoiceNo || "INV-56",
    invoiceDate: initialData.invoiceDate || initialData.advanceDate || initialData.advance_date || initialData.dueDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
    dueDate: initialData.invoiceDate || initialData.advanceDate || initialData.advance_date || initialData.dueDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
    advanceDate: initialData.invoiceDate || initialData.advanceDate || initialData.advance_date || initialData.dueDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
    placeOfSupply: initialData.placeOfSupply || "TAMIL NADU",

    items: initialData.items || [
      {
        id: 1,
        description: initialData.project_name ? `${initialData.project_name} Application` : "Electronics Service Application",
        hsnSac: "9983",
        amount: initialData.estimated_cost ? Number((Number(initialData.estimated_cost) / 1.18).toFixed(2)) : 33898.31,
      },
    ],

    enableRoundOff: true,
    roundOffSign: "+",
    roundOffValue: "",
    manualRoundOff: null,
    companyName: initialData.companyName || "Celeris Solutions",
    companyGstin: initialData.companyGstin || "33AAVFC1276D1ZI",
    companyEmail: initialData.companyEmail || "prabakar@celerissolutions.in",

    taxType: initialData.taxType || "CGST_SGST",
    cgstRate: initialData.cgstRate !== undefined ? Number(initialData.cgstRate) : 9.0,
    sgstRate: initialData.sgstRate !== undefined ? Number(initialData.sgstRate) : 9.0,
    igstRate: initialData.igstRate !== undefined ? Number(initialData.igstRate) : 18.0,

    accountHolderName: initialData.accountHolderName || "Celeris Solutions",
    bankPhone: initialData.bankPhone || "9597979111",
    bankName: initialData.bankName || "Indian Overseas Bank",
    accountNo: initialData.accountNo || "182302000009977",
    ifscCode: initialData.ifscCode || "IOBA0001823",

    totalProjectCost: initialData.estimated_cost ? Number(initialData.estimated_cost) : 40000,
    costBreakdownNote:
      initialData.costBreakdownNote !== undefined ? initialData.costBreakdownNote : "The application charge is ₹25,000. An additional charge of ₹5,000 per branch/company will be applicable. For 3 branches/companies, the additional charge will be ₹15,000, making the total application charge ₹40,000.",
    advancePayment: initialData.paidAmount ? Number(initialData.paidAmount) : 10000,
    advanceDate: initialData.advanceDate || initialData.advance_date || initialData.invoiceDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
    paymentStage: initialData.paymentStage !== undefined ? initialData.paymentStage : "",
  }));

  // Re-sync modal form data whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      const history = initialData.proposalHistory || [];
      const activeProposalNo = initialData.proposalNo || 1;
      const activeHist = history.find((h) => h.proposalNo === activeProposalNo);

      const resolvedCostBreakdownNote = activeHist?.costBreakdownNote !== undefined
        ? activeHist.costBreakdownNote
        : (initialData.costBreakdownNote !== undefined ? initialData.costBreakdownNote : "The application charge is ₹25,000. An additional charge of ₹5,000 per branch/company will be applicable. For 3 branches/companies, the additional charge will be ₹15,000, making the total application charge ₹40,000.");

      const resolvedPaymentStage = activeHist?.paymentStage !== undefined
        ? activeHist.paymentStage
        : (initialData.paymentStage !== undefined ? initialData.paymentStage : "");

      const resolvedItems = activeHist?.items && activeHist.items.length > 0
        ? activeHist.items
        : (initialData.items || [
            {
              id: 1,
              description: initialData.clientCompany ? `${initialData.clientCompany} Application` : "Electronics Service Application",
              hsnSac: "9983",
              amount: initialData.totalProjectCost ? Number((Number(initialData.totalProjectCost) / 1.18).toFixed(2)) : initialData.estimated_cost ? Number((Number(initialData.estimated_cost) / 1.18).toFixed(2)) : 33898.31,
            },
          ]);

      const resolvedDate = activeHist?.invoiceDate || activeHist?.date || initialData.invoiceDate || initialData.advanceDate || initialData.advance_date || initialData.dueDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
      const resolvedInvoiceNo = activeHist?.invoiceNo || initialData.invoiceNo || "INV-56";

      const resolvedCompanyName = activeHist?.companyName || initialData.companyName || "Celeris Solutions";
      const resolvedCompanyGstin = activeHist?.companyGstin || initialData.companyGstin || "33AAVFC1276D1ZI";
      const resolvedCompanyEmail = activeHist?.companyEmail || initialData.companyEmail || "prabakar@celerissolutions.in";

      const resolvedAccountHolderName = activeHist?.accountHolderName || initialData.accountHolderName || "Celeris Solutions";
      const resolvedBankPhone = activeHist?.bankPhone || initialData.bankPhone || "9597979111";
      const resolvedBankName = activeHist?.bankName || initialData.bankName || "Indian Overseas Bank";
      const resolvedAccountNo = activeHist?.accountNo || initialData.accountNo || "182302000009977";
      const resolvedIfscCode = activeHist?.ifscCode || initialData.ifscCode || "IOBA0001823";

      const resolvedTaxType = activeHist?.taxType || initialData.taxType || "CGST_SGST";
      const resolvedCgstRate = activeHist?.cgstRate !== undefined ? Number(activeHist.cgstRate) : (initialData.cgstRate !== undefined ? Number(initialData.cgstRate) : 9.0);
      const resolvedSgstRate = activeHist?.sgstRate !== undefined ? Number(activeHist.sgstRate) : (initialData.sgstRate !== undefined ? Number(initialData.sgstRate) : 9.0);
      const resolvedIgstRate = activeHist?.igstRate !== undefined ? Number(activeHist.igstRate) : (initialData.igstRate !== undefined ? Number(initialData.igstRate) : 18.0);

      setInvoiceData({
        documentType: initialData.documentType || "TAX INVOICE",
        paymentStage: resolvedPaymentStage,
        proposalGiven: initialData.proposalGiven || "Yes",
        proposalNo: activeProposalNo,
        proposalHistory: history,

        companyName: resolvedCompanyName,
        companyGstin: resolvedCompanyGstin,
        companyEmail: resolvedCompanyEmail,

        salutation: initialData.salutation || "Mr.",
        clientName: initialData.clientName || (initialData.client_name ? initialData.client_name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Er\.|M\/s\.|Prof\.)\s*/i, "") : ""),
        clientCompany: initialData.clientCompany || initialData.client_company || initialData.project_name || "",
        clientPhone: initialData.clientPhone || initialData.client_phone || "",
        clientAddress: initialData.clientAddress || initialData.client_address || "24J, SH 195, OLD KUYAVAR PALAYAM, MADURAI, TAMIL NADU 625009",
        clientGstin: initialData.clientGstin || "",

        invoiceNo: resolvedInvoiceNo,
        invoiceDate: resolvedDate,
        dueDate: resolvedDate,
        advanceDate: resolvedDate,
        placeOfSupply: initialData.placeOfSupply || "TAMIL NADU",

        items: resolvedItems,

        enableRoundOff: initialData.enableRoundOff !== undefined ? initialData.enableRoundOff : true,
        roundOffSign: initialData.roundOffSign || "+",
        roundOffValue: initialData.roundOffValue !== undefined ? initialData.roundOffValue : "",
        manualRoundOff: initialData.manualRoundOff !== undefined ? initialData.manualRoundOff : null,
        taxType: resolvedTaxType,
        cgstRate: resolvedCgstRate,
        sgstRate: resolvedSgstRate,
        igstRate: resolvedIgstRate,

        accountHolderName: resolvedAccountHolderName,
        bankPhone: resolvedBankPhone,
        bankName: resolvedBankName,
        accountNo: resolvedAccountNo,
        ifscCode: resolvedIfscCode,

        totalProjectCost: initialData.totalProjectCost ? Number(initialData.totalProjectCost) : initialData.estimated_cost ? Number(initialData.estimated_cost) : 40000,
        costBreakdownNote: resolvedCostBreakdownNote,
        advancePayment: initialData.paidAmount ? Number(initialData.paidAmount) : 10000,
      });
    }
  }, [isOpen, initialData]);

  const [isExporting, setIsExporting] = useState(false);

  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  if (!isOpen) return null;

  // Cumulative Proposal Billed Calculations
  const currentSubtotal = (invoiceData.items || []).reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const cgstAmt = Number(((currentSubtotal * (invoiceData.cgstRate ?? 9)) / 100).toFixed(2));
  const sgstAmt = Number(((currentSubtotal * (invoiceData.sgstRate ?? 9)) / 100).toFixed(2));
  const igstAmt = Number(((currentSubtotal * (invoiceData.igstRate ?? 18)) / 100).toFixed(2));
  
  let currentTax = 0;
  if (invoiceData.taxType === "CGST_SGST") {
    currentTax = cgstAmt + sgstAmt;
  } else if (invoiceData.taxType === "IGST") {
    currentTax = igstAmt;
  } else {
    currentTax = 0; // Exclude GST / Non-GST
  }
  const unroundedTotal = Number((currentSubtotal + currentTax).toFixed(2));
  let currentInvoiceTotal = unroundedTotal;
  if (invoiceData.manualRoundOff !== null && invoiceData.manualRoundOff !== undefined && !isNaN(Number(invoiceData.manualRoundOff)) && invoiceData.manualRoundOff !== "") {
    currentInvoiceTotal = Math.round(unroundedTotal + Number(invoiceData.manualRoundOff));
  } else if (invoiceData.enableRoundOff) {
    currentInvoiceTotal = Math.round(unroundedTotal);
  }

  const priorBilledTotal = (invoiceData.proposalHistory || [])
    .filter((p) => p.proposalNo !== invoiceData.proposalNo)
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const cumulativeBilledTotal = priorBilledTotal + currentInvoiceTotal;
  const totalProjectCostNum = Number(invoiceData.totalProjectCost) || 0;
  const remainingProjectCost = Math.max(0, totalProjectCostNum - cumulativeBilledTotal);

  // Auto-detect Payment Stage based on Total Project Cost & Billed History
  // Invoice #1 → Initial Payment
  // Invoice #2 → Mid Payment (1), Invoice #3 → Mid Payment (2), etc.
  // Last Invoice → Final Payment
  let autoPaymentStage = "Initial Payment";
  if (totalProjectCostNum > 0 && cumulativeBilledTotal >= totalProjectCostNum) {
    autoPaymentStage = "Final Payment";
  } else if (invoiceData.proposalHistory && invoiceData.proposalHistory.length > 0) {
    autoPaymentStage = `Mid Payment (${invoiceData.proposalHistory.length})`;
  }

  const handleCreateNextProposal = () => {
    const totalProjectCost = Number(invoiceData.totalProjectCost) || 0;
    if (cumulativeBilledTotal > totalProjectCost) {
      alert(`Cannot create next invoice! Total billed amount (₹${cumulativeBilledTotal.toLocaleString("en-IN")}) exceeds Total Project Cost (₹${totalProjectCost.toLocaleString("en-IN")}). Please adjust invoice items or project cost.`);
      return;
    }

    const nextNo = invoiceData.proposalNo + 1;
    const effectivePaymentStage = (invoiceData.paymentStage && invoiceData.paymentStage.trim() !== "") ? invoiceData.paymentStage : autoPaymentStage;

    const currentHistoryEntry = {
      proposalNo: invoiceData.proposalNo,
      invoiceNo: invoiceData.invoiceNo,
      amount: currentInvoiceTotal,
      date: invoiceData.invoiceDate,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      advanceDate: invoiceData.advanceDate,
      paymentStage: effectivePaymentStage,
      costBreakdownNote: invoiceData.costBreakdownNote,
      items: invoiceData.items,
      companyName: invoiceData.companyName,
      companyGstin: invoiceData.companyGstin,
      companyEmail: invoiceData.companyEmail,
      accountHolderName: invoiceData.accountHolderName,
      bankPhone: invoiceData.bankPhone,
      bankName: invoiceData.bankName,
      accountNo: invoiceData.accountNo,
      ifscCode: invoiceData.ifscCode,
      taxType: invoiceData.taxType,
      cgstRate: invoiceData.cgstRate,
      sgstRate: invoiceData.sgstRate,
      igstRate: invoiceData.igstRate,
    };

    const history = invoiceData.proposalHistory || [];
    const existingIdx = history.findIndex((h) => h.proposalNo === invoiceData.proposalNo);
    let newHistory = [...history];

    if (existingIdx >= 0) {
      newHistory[existingIdx] = {
        ...newHistory[existingIdx],
        ...currentHistoryEntry,
      };
    } else {
      newHistory.push(currentHistoryEntry);
    }

    const updatedData = {
      ...invoiceData,
      proposalNo: nextNo,
      invoiceNo: `INV-${56 + newHistory.length}`,
      paymentStage: "",
      costBreakdownNote: "",
      proposalHistory: newHistory,
      advancePayment: currentInvoiceTotal,
    };

    setInvoiceData(updatedData);
    if (onSave) onSave(updatedData);
  };

  const handleConfirmDeleteSubmit = () => {
    if (deletePasswordInput.trim() !== "prabakar") {
      setDeletePasswordError(true);
      return;
    }

    if (deleteConfirmState.onConfirm) {
      deleteConfirmState.onConfirm();
    }
    setDeleteConfirmState({ isOpen: false, onConfirm: null, title: "", message: "" });
    setDeletePasswordInput("");
    setDeletePasswordError(false);
    setShowDeletePassword(false);
  };

  const handleDeleteProposalFromHistory = (proposalNoToDelete) => {
    setDeleteConfirmState({
      isOpen: true,
      title: `Delete Invoice #${proposalNoToDelete}`,
      message: `Are you sure you want to delete Invoice #${proposalNoToDelete}? This action cannot be undone.`,
      onConfirm: () => {
        const updatedHistory = (invoiceData.proposalHistory || []).filter((p) => p.proposalNo !== proposalNoToDelete);
        let updatedProposalNo = invoiceData.proposalNo;
        if (invoiceData.proposalNo === proposalNoToDelete) {
          updatedProposalNo = Math.max(1, invoiceData.proposalNo - 1);
        }
        const updatedData = {
          ...invoiceData,
          proposalNo: updatedProposalNo,
          proposalHistory: updatedHistory,
        };
        setInvoiceData(updatedData);
        if (onSave) onSave(updatedData);
      },
    });
  };

  const handleInputChange = (field, value) => {
    setInvoiceData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (newDate) => {
    setInvoiceData((prev) => ({
      ...prev,
      invoiceDate: newDate,
      dueDate: newDate,
      advanceDate: newDate,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setInvoiceData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === "amount" ? parseFloat(value) || 0 : value,
      };
      return { ...prev, items: updatedItems };
    });
  };

  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          description: "New Service / Item",
          hsnSac: "9983",
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (invoiceData.items.length <= 1) return;
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const moveItem = (index, direction) => {
    setInvoiceData((prev) => {
      const updated = [...prev.items];
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx >= 0 && targetIdx < updated.length) {
        [updated[index], updated[targetIdx]] = [updated[targetIdx], updated[index]];
      }
      return {
        ...prev,
        items: updated,
      };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      setIsExporting(true);
      const element = invoiceRef.current;

      // Clone the invoice into a full-height off-screen container so html2canvas
      // captures ALL content (not just the visible/scrollable portion of the modal).
      const clone = element.cloneNode(true);
      const offscreen = document.createElement("div");
      offscreen.style.cssText = [
        "position:fixed",
        "top:-99999px",
        "left:-99999px",
        "width:" + element.scrollWidth + "px",
        "height:auto",
        "overflow:visible",
        "z-index:-1",
        "background:#ffffff",
      ].join(";");
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // html2canvas-pro natively supports oklch() colors (Tailwind v4)
      const canvas = await html2canvas(offscreen, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: element.scrollWidth,
        height: offscreen.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: offscreen.scrollHeight,
      });

      document.body.removeChild(offscreen);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();

      // Render 100% Full-Bleed A4 PDF (no side margins, exact edge-to-edge fit)
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfPageHeight);

      pdf.save(`Tax_Invoice_${invoiceData.invoiceNo}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to export PDF. Please use the Print option to Save as PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:w-full print:rounded-none">

        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center print:hidden border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Tax Invoice Generator</h2>
              <p className="text-xs text-slate-400">Generate & export project tax invoice</p>
            </div>
          </div>

          {/* Actions & Tab Switcher */}
          <div className="flex items-center space-x-3">
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "edit"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                  }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Fields</span>
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "preview"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                  }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            <button
              onClick={() => {
                const totalProjectCost = Number(invoiceData.totalProjectCost) || 0;
                if (cumulativeBilledTotal > totalProjectCost) {
                  alert(`Cannot save invoice! Total billed amount (₹${cumulativeBilledTotal.toLocaleString("en-IN")}) exceeds Total Project Cost (₹${totalProjectCost.toLocaleString("en-IN")}). Please adjust your invoice items or project cost.`);
                  return;
                }

                const history = invoiceData.proposalHistory || [];
                const existingIdx = history.findIndex((h) => h.proposalNo === invoiceData.proposalNo);
                let newHistory = [...history];
                const effectivePaymentStage = (invoiceData.paymentStage && invoiceData.paymentStage.trim() !== "") ? invoiceData.paymentStage : autoPaymentStage;

                const currentHistoryEntry = {
                  proposalNo: invoiceData.proposalNo,
                  invoiceNo: invoiceData.invoiceNo,
                  amount: currentInvoiceTotal,
                  date: invoiceData.invoiceDate,
                  invoiceDate: invoiceData.invoiceDate,
                  dueDate: invoiceData.dueDate,
                  advanceDate: invoiceData.advanceDate,
                  paymentStage: effectivePaymentStage,
                  costBreakdownNote: invoiceData.costBreakdownNote,
                  items: invoiceData.items,
                  companyName: invoiceData.companyName,
                  companyGstin: invoiceData.companyGstin,
                  companyEmail: invoiceData.companyEmail,
                  accountHolderName: invoiceData.accountHolderName,
                  bankPhone: invoiceData.bankPhone,
                  bankName: invoiceData.bankName,
                  accountNo: invoiceData.accountNo,
                  ifscCode: invoiceData.ifscCode,
                  taxType: invoiceData.taxType,
                  cgstRate: invoiceData.cgstRate,
                  sgstRate: invoiceData.sgstRate,
                  igstRate: invoiceData.igstRate,
                };

                if (existingIdx >= 0) {
                  // Update existing invoice entry in history with edited details
                  newHistory[existingIdx] = {
                    ...newHistory[existingIdx],
                    ...currentHistoryEntry,
                  };
                } else if (currentInvoiceTotal > 0) {
                  // Add new invoice entry to history
                  newHistory.push(currentHistoryEntry);
                }

                const updatedData = {
                  ...invoiceData,
                  paymentStage: effectivePaymentStage,
                  proposalHistory: newHistory,
                };
                setInvoiceData(updatedData);

                if (onSave) onSave(updatedData);
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 2500);
              }}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              {savedSuccess ? <Check className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
              <span>{savedSuccess ? "Saved!" : "Save Invoice"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition"
            >
              <Printer className="h-4 w-4 text-blue-400" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? "Exporting..." : "Download PDF"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 print:p-0 print:overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Form Inputs Editor Column */}
            <div
              className={`lg:col-span-5 bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-6 print:hidden ${activeTab === "preview" ? "hidden lg:block" : "block"
                }`}
            >
              <h3 className="font-bold text-slate-900 border-b pb-2 text-sm flex items-center justify-between">
                <span>Invoice Settings & Data</span>
                <span className="text-xs font-normal text-blue-600">Auto-calculated</span>
              </h3>

              {/* Proposal Status & Document Type */}
              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 space-y-2 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-700">Current Active: Invoice #{invoiceData.proposalNo}</span>
                    <span className={`font-bold ${cumulativeBilledTotal > (Number(invoiceData.totalProjectCost) || 0) ? "text-red-600 animate-pulse" : "text-blue-700"}`}>
                      Total Billed: ₹{cumulativeBilledTotal.toLocaleString("en-IN")} / ₹{Number(invoiceData.totalProjectCost).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {cumulativeBilledTotal > (Number(invoiceData.totalProjectCost) || 0) && (
                    <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-[11px] font-bold">
                      ⚠️ Total Billed amount (₹{cumulativeBilledTotal.toLocaleString("en-IN")}) exceeds Total Project Cost (₹{Number(invoiceData.totalProjectCost).toLocaleString("en-IN")}). Please lower item amounts.
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${cumulativeBilledTotal > (Number(invoiceData.totalProjectCost) || 0) ? "bg-red-600" : "bg-blue-600"}`}
                      style={{
                        width: `${Math.min(100, Math.round((cumulativeBilledTotal / (Number(invoiceData.totalProjectCost) || 1)) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[11px] text-slate-600">
                      Remaining Balance: <strong className="text-slate-900">₹{remainingProjectCost.toLocaleString("en-IN")}</strong>
                    </span>
                  </div>

                  {/* List of Created Invoices for this Project */}
                  {(() => {
                    const history = invoiceData.proposalHistory || [];
                    const allInvoices = [...history];
                    const alreadyInHistory = history.some((h) => h.proposalNo === invoiceData.proposalNo);
                    if (!alreadyInHistory && currentInvoiceTotal > 0) {
                      allInvoices.push({
                        proposalNo: invoiceData.proposalNo,
                        invoiceNo: invoiceData.invoiceNo,
                        amount: currentInvoiceTotal,
                        date: invoiceData.invoiceDate,
                      });
                    }

                    if (allInvoices.length === 0) return null;

                    return (
                      <div className="mt-3 pt-2 border-t border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Generated Invoices Log ({allInvoices.length})
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {allInvoices.map((hist, hIdx) => (
                            <div
                              key={hIdx}
                              className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-100 text-[11px] hover:border-blue-300 transition"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">
                                  Invoice #{hist.proposalNo} ({hist.invoiceNo})
                                </span>
                                <span className="text-[10px] text-slate-400">{hist.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-blue-600 mr-0.5">₹{Number(hist.amount).toLocaleString("en-IN")}</span>
                                <button
                                  onClick={() => {
                                    setInvoiceData((prev) => ({
                                      ...prev,
                                      proposalNo: hist.proposalNo,
                                      invoiceNo: hist.invoiceNo,
                                      items: hist.items || prev.items,
                                      paymentStage: hist.paymentStage !== undefined ? hist.paymentStage : "",
                                      costBreakdownNote: hist.costBreakdownNote !== undefined ? hist.costBreakdownNote : "",
                                      advanceDate: hist.advanceDate || hist.date || prev.advanceDate,
                                      invoiceDate: hist.invoiceDate || hist.date || prev.invoiceDate,
                                      dueDate: hist.dueDate || hist.date || prev.dueDate,
                                      companyName: hist.companyName || prev.companyName,
                                      companyGstin: hist.companyGstin || prev.companyGstin,
                                      companyEmail: hist.companyEmail || prev.companyEmail,
                                      accountHolderName: hist.accountHolderName || prev.accountHolderName,
                                      bankPhone: hist.bankPhone || prev.bankPhone,
                                      bankName: hist.bankName || prev.bankName,
                                      accountNo: hist.accountNo || prev.accountNo,
                                      ifscCode: hist.ifscCode || prev.ifscCode,
                                      taxType: hist.taxType || prev.taxType,
                                      cgstRate: hist.cgstRate !== undefined ? hist.cgstRate : prev.cgstRate,
                                      sgstRate: hist.sgstRate !== undefined ? hist.sgstRate : prev.sgstRate,
                                      igstRate: hist.igstRate !== undefined ? hist.igstRate : prev.igstRate,
                                    }));
                                    setActiveTab("preview");
                                  }}
                                  title="View Live Invoice Preview"
                                  className="p-1 text-slate-400 hover:text-emerald-600 transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setInvoiceData((prev) => ({
                                      ...prev,
                                      proposalNo: hist.proposalNo,
                                      invoiceNo: hist.invoiceNo,
                                      items: hist.items || prev.items,
                                      paymentStage: hist.paymentStage !== undefined ? hist.paymentStage : "",
                                      costBreakdownNote: hist.costBreakdownNote !== undefined ? hist.costBreakdownNote : "",
                                      advanceDate: hist.advanceDate || hist.date || prev.advanceDate,
                                      invoiceDate: hist.invoiceDate || hist.date || prev.invoiceDate,
                                      dueDate: hist.dueDate || hist.date || prev.dueDate,
                                      companyName: hist.companyName || prev.companyName,
                                      companyGstin: hist.companyGstin || prev.companyGstin,
                                      companyEmail: hist.companyEmail || prev.companyEmail,
                                      accountHolderName: hist.accountHolderName || prev.accountHolderName,
                                      bankPhone: hist.bankPhone || prev.bankPhone,
                                      bankName: hist.bankName || prev.bankName,
                                      accountNo: hist.accountNo || prev.accountNo,
                                      ifscCode: hist.ifscCode || prev.ifscCode,
                                      taxType: hist.taxType || prev.taxType,
                                      cgstRate: hist.cgstRate !== undefined ? hist.cgstRate : prev.cgstRate,
                                      sgstRate: hist.sgstRate !== undefined ? hist.sgstRate : prev.sgstRate,
                                      igstRate: hist.igstRate !== undefined ? hist.igstRate : prev.igstRate,
                                    }));
                                    setActiveTab("edit");
                                  }}
                                  title="Edit Invoice"
                                  className="p-1 text-slate-400 hover:text-blue-600 transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProposalFromHistory(hist.proposalNo)}
                                  title="Delete Invoice"
                                  className="p-1 text-slate-400 hover:text-red-600 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Consolidated Company (Seller) & Bank Account Details */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Company & Bank Account Details</h4>
                </div>
                <div className="text-xs space-y-2">
                  {/* Name (Synced Company & Bank Account Name) */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Company / Account Holder Name</label>
                    <input
                      type="text"
                      value={invoiceData.companyName || invoiceData.accountHolderName || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInvoiceData((prev) => ({
                          ...prev,
                          companyName: val,
                          accountHolderName: val,
                        }));
                      }}
                      placeholder="e.g. Celeris Solutions"
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-900"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Company Email</label>
                      <input
                        type="email"
                        value={invoiceData.companyEmail || ""}
                        onChange={(e) => handleInputChange("companyEmail", e.target.value)}
                        placeholder="e.g. prabakar@celerissolutions.in"
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={invoiceData.bankPhone || ""}
                        onChange={(e) => handleInputChange("bankPhone", e.target.value)}
                        placeholder="e.g. 9597979111"
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* GSTIN & Bank Name */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">GSTIN</label>
                      <input
                        type="text"
                        value={invoiceData.companyGstin || ""}
                        onChange={(e) => handleInputChange("companyGstin", e.target.value)}
                        placeholder="e.g. 33AAVFC1276D1ZI"
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase bg-white font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={invoiceData.bankName || ""}
                        onChange={(e) => handleInputChange("bankName", e.target.value)}
                        placeholder="e.g. Indian Overseas Bank"
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Account Number & IFSC Code */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Account Number</label>
                      <input
                        type="text"
                        value={invoiceData.accountNo || ""}
                        onChange={(e) => handleInputChange("accountNo", e.target.value)}
                        placeholder="e.g. 182302000009977"
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={invoiceData.ifscCode || ""}
                        onChange={(e) => handleInputChange("ifscCode", e.target.value)}
                        placeholder="e.g. IOBA0001823"
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase bg-white font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Client (Bill To) Information</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Salutation</label>
                    <select
                      value={invoiceData.salutation}
                      onChange={(e) => handleInputChange("salutation", e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-900"
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Miss">Miss</option>
                      <option value="M/s.">M/s. (Messrs / Firm)</option>
                      <option value="Dr.">Dr. (Doctor)</option>
                      <option value="Er.">Er. (Engineer)</option>
                      <option value="Prof.">Prof. (Professor)</option>
                      <option value="Adv.">Adv. (Advocate)</option>
                      <option value="CA.">CA. (Chartered Accountant)</option>
                      <option value="Ar.">Ar. (Architect)</option>
                      <option value="Shri">Shri</option>
                      <option value="Smt.">Smt.</option>
                      <option value="Kumari">Kumari</option>
                      <option value="Thiru">Thiru</option>
                      <option value="Thirumathi">Thirumathi</option>
                      <option value="Selvi">Selvi</option>
                      <option value="Hon.">Hon. (Honorable)</option>
                      <option value="Rev.">Rev. (Reverend)</option>
                      <option value="Swami">Swami</option>
                      <option value="Capt.">Capt. (Captain)</option>
                      <option value="Col.">Col. (Colonel)</option>
                      <option value="Maj.">Maj. (Major)</option>
                      <option value="Gen.">Gen. (General)</option>
                      <option value="Sir">Sir</option>
                      <option value="Madam">Madam</option>
                      <option value="Lord">Lord</option>
                      <option value="">(None / Blank)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Client Name</label>
                    <input
                      type="text"
                      value={invoiceData.clientName}
                      onChange={(e) => handleInputChange("clientName", e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-700 font-bold mb-1">Company / Org Name</label>
                  <input
                    type="text"
                    value={invoiceData.clientCompany}
                    onChange={(e) => handleInputChange("clientCompany", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={invoiceData.clientPhone}
                      onChange={(e) => handleInputChange("clientPhone", e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Client GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={invoiceData.clientGstin}
                      onChange={(e) => handleInputChange("clientGstin", e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-700 font-bold mb-1">Full Billing Address</label>
                  <textarea
                    rows={2}
                    value={invoiceData.clientAddress}
                    onChange={(e) => handleInputChange("clientAddress", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase bg-white font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoice Metadata</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="mb-1">
                      <label className="block text-slate-700 font-extrabold">Invoice Number</label>
                    </div>
                    <input
                      type="text"
                      value={invoiceData.invoiceNo}
                      onChange={(e) => handleInputChange("invoiceNo", e.target.value)}
                      placeholder="e.g. INV-01, CEL-2026-01"
                      className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none bg-blue-50/30 font-extrabold text-blue-900 shadow-2xs"
                    />
                  </div>
                  <div>
                    <div className="mb-1">
                      <label className="block text-slate-700 font-extrabold">Invoice & Payment Date</label>
                    </div>
                    <input
                      type="text"
                      value={invoiceData.invoiceDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      placeholder="e.g. 18 SEPT 2026"
                      className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none bg-blue-50/30 font-extrabold text-blue-900 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-700 font-bold mb-1">Place of Supply</label>
                  <input
                    type="text"
                    value={invoiceData.placeOfSupply}
                    onChange={(e) => handleInputChange("placeOfSupply", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase bg-white font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* 4) Invoice Line Items */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoice Line Items</h4>
                  <button
                    onClick={addItem}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {invoiceData.items.map((item, index) => (
                  <div key={item.id || index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-600">Item #{index + 1}</span>
                      <div className="flex items-center space-x-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveItem(index, "up")}
                            title="Move Item Up"
                            className="p-1 text-slate-400 hover:text-blue-600 transition hover:bg-slate-200 rounded"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {index < invoiceData.items.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveItem(index, "down")}
                            title="Move Item Down"
                            className="p-1 text-slate-400 hover:text-blue-600 transition hover:bg-slate-200 rounded"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {invoiceData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            title="Remove Item"
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Item Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        className="w-full border border-slate-300 rounded-md p-1.5 bg-white font-semibold text-slate-900 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          placeholder="HSN/SAC (e.g. 9983)"
                          value={item.hsnSac}
                          onChange={(e) => handleItemChange(index, "hsnSac", e.target.value)}
                          className="w-full border border-slate-300 rounded-md p-1.5 bg-white font-semibold text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Amount (₹)"
                          value={item.amount}
                          onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                          className="w-full border border-slate-300 rounded-md p-1.5 bg-white font-bold text-slate-900 text-right outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 5) GST & Tax Mode */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">GST & Tax Mode</h4>
                </div>

                {/* Tax Mode Toggle */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => handleInputChange("taxType", "CGST_SGST")}
                    className={`py-1.5 px-2 rounded-md font-bold transition text-center ${
                      invoiceData.taxType === "CGST_SGST"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    CGST + SGST
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange("taxType", "IGST")}
                    className={`py-1.5 px-2 rounded-md font-bold transition text-center ${
                      invoiceData.taxType === "IGST"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    IGST
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange("taxType", "EXCLUDE")}
                    className={`py-1.5 px-2 rounded-md font-bold transition text-center ${
                      invoiceData.taxType === "EXCLUDE"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Exclude GST
                  </button>
                </div>

                {/* Tax Rate % Inputs & Presets */}
                {invoiceData.taxType !== "EXCLUDE" ? (
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-800">GST Rate Presets</label>
                      <span className="text-[10px] text-slate-500 font-medium">Click to apply rate</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[18, 12, 5, 28, 0].map((rate) => {
                        const isSelected = invoiceData.taxType === "CGST_SGST"
                          ? (Number(invoiceData.cgstRate) + Number(invoiceData.sgstRate)) === rate
                          : Number(invoiceData.igstRate) === rate;
                        return (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => {
                              if (invoiceData.taxType === "CGST_SGST") {
                                setInvoiceData((prev) => ({
                                  ...prev,
                                  cgstRate: rate / 2,
                                  sgstRate: rate / 2,
                                }));
                              } else {
                                setInvoiceData((prev) => ({
                                  ...prev,
                                  igstRate: rate,
                                }));
                              }
                            }}
                            className={`px-2.5 py-1 rounded-md text-xs font-extrabold transition border ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            {rate}% GST
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom % Rate Inputs */}
                    {invoiceData.taxType === "CGST_SGST" ? (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">CGST Rate (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={invoiceData.cgstRate ?? 9}
                            onChange={(e) => handleInputChange("cgstRate", parseFloat(e.target.value) || 0)}
                            className="w-full border border-slate-300 rounded-lg p-1.5 bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">SGST Rate (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={invoiceData.sgstRate ?? 9}
                            onChange={(e) => handleInputChange("sgstRate", parseFloat(e.target.value) || 0)}
                            className="w-full border border-slate-300 rounded-lg p-1.5 bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">IGST Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={invoiceData.igstRate ?? 18}
                          onChange={(e) => handleInputChange("igstRate", parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded-lg p-1.5 bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
                    <span>✅ GST Excluded / Non-GST Invoice</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-extrabold">0% Tax Rate</span>
                  </div>
                )}
              </div>

              {/* 6) Auto Round Off Total */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Round Off Total</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableRoundOff"
                      checked={invoiceData.enableRoundOff && (invoiceData.roundOffValue === "" || invoiceData.roundOffValue === null)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setInvoiceData((prev) => ({
                            ...prev,
                            enableRoundOff: true,
                            roundOffValue: "",
                            manualRoundOff: null,
                          }));
                        } else {
                          setInvoiceData((prev) => ({
                            ...prev,
                            enableRoundOff: false,
                            roundOffValue: "",
                            manualRoundOff: null,
                          }));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="enableRoundOff" className="font-semibold text-slate-700 select-none cursor-pointer">
                      Auto Round Off Total (Nearest ₹ 0.00)
                    </label>
                  </div>

                  {/* Manual Round Off Controls */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Manual Round Off</span>
                      {invoiceData.roundOffValue !== "" && (
                        <button
                          onClick={() =>
                            setInvoiceData((prev) => ({
                              ...prev,
                              roundOffValue: "",
                              manualRoundOff: null,
                              enableRoundOff: true,
                            }))
                          }
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          Reset to Auto
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <label className="block text-[11px] text-slate-500 mb-1">Operation (+ / -)</label>
                        <select
                          value={invoiceData.roundOffSign}
                          onChange={(e) => {
                            const newSign = e.target.value;
                            setInvoiceData((prev) => {
                              const amt = parseFloat(prev.roundOffValue) || 0;
                              const manualVal = prev.roundOffValue !== "" ? (newSign === "-" ? -Math.abs(amt) : Math.abs(amt)) : null;
                              return {
                                ...prev,
                                roundOffSign: newSign,
                                manualRoundOff: manualVal,
                              };
                            });
                          }}
                          className="w-full border border-slate-300 rounded-lg p-1.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="+">+ Add (Plus)</option>
                          <option value="-">- Subtract (Minus)</option>
                        </select>
                      </div>

                      <div className="col-span-7">
                        <label className="block text-[11px] text-slate-500 mb-1">Value Amount (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 0.05 or 0.15"
                          value={invoiceData.roundOffValue}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            setInvoiceData((prev) => {
                              const amt = parseFloat(valStr);
                              const manualVal = valStr !== "" && !isNaN(amt)
                                ? (prev.roundOffSign === "-" ? -Math.abs(amt) : Math.abs(amt))
                                : null;
                              return {
                                ...prev,
                                roundOffValue: valStr,
                                manualRoundOff: manualVal,
                              };
                            });
                          }}
                          className="w-full border border-slate-300 rounded-lg p-1.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7) Project Cost & Notes */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Project Cost & Notes</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Total Project Cost (₹)</label>
                    <input
                      type="number"
                      value={invoiceData.totalProjectCost}
                      onChange={(e) => handleInputChange("totalProjectCost", parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <div className="mb-1">
                      <label className="block text-slate-700 font-extrabold">Payment Stage Label</label>
                    </div>
                    <input
                      type="text"
                      value={invoiceData.paymentStage !== undefined ? invoiceData.paymentStage : ""}
                      onChange={(e) => handleInputChange("paymentStage", e.target.value)}
                      placeholder={`Auto: ${autoPaymentStage}`}
                      className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none bg-blue-50/40 font-extrabold text-blue-900 shadow-2xs text-xs"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {["Initial Payment", "Advance Payment", "Mid Payment", "Final Payment"].map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => handleInputChange("paymentStage", stage)}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition font-bold ${
                            (invoiceData.paymentStage || autoPaymentStage) === stage
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {stage}
                        </button>
                      ))}
                      {invoiceData.paymentStage !== "" && invoiceData.paymentStage !== undefined && (
                        <button
                          type="button"
                          onClick={() => handleInputChange("paymentStage", "")}
                          className="text-[9px] px-1.5 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold"
                          title="Reset to Auto-detected stage"
                        >
                          Auto ({autoPaymentStage})
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-700 font-bold mb-1">
                    Current Invoice Amount (Auto-Calculated ₹)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${currentInvoiceTotal.toLocaleString("en-IN")}`}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-extrabold text-slate-800 outline-none cursor-not-allowed"
                  />
                </div>

                <div className="text-xs">
                  <label className="block text-slate-700 font-bold mb-1">Payment Breakdown Notes</label>
                  <textarea
                    rows={3}
                    value={invoiceData.costBreakdownNote}
                    onChange={(e) => handleInputChange("costBreakdownNote", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-900"
                  />
                </div>
              </div>

            </div>

            {/* Live Invoice Preview Column */}
            <div
              className={`lg:col-span-7 flex justify-center print:w-full print:col-span-12 ${activeTab === "edit" ? "hidden lg:flex" : "flex"
                }`}
            >
              <div className="w-full shadow-lg rounded-xl overflow-hidden print:shadow-none">
                <ProjectInvoiceTemplate
                  ref={invoiceRef}
                  invoiceData={{
                    ...invoiceData,
                    paymentStage: (invoiceData.paymentStage !== undefined && invoiceData.paymentStage !== "") ? invoiceData.paymentStage : autoPaymentStage,
                  }}
                />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Custom Password-Protected Delete Confirmation Modal inside Invoice Editor */}
      {deleteConfirmState.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 text-center p-6 space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {deleteConfirmState.title || "Authorization Required"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {deleteConfirmState.message || "This action cannot be undone. Enter password to authorize deletion."}
              </p>
            </div>

            <div className="text-left space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">Security Password *</label>
              <div className="relative flex items-center">
                <input
                  type={showDeletePassword ? "text" : "password"}
                  name="security_delete_password_field_modal"
                  autoComplete="new-password"
                  autoFocus
                  value={deletePasswordInput}
                  onChange={(e) => {
                    setDeletePasswordInput(e.target.value);
                    setDeletePasswordError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmDeleteSubmit();
                  }}
                  placeholder="Enter password (e.g. prabakar)"
                  className="w-full border border-slate-300 rounded-xl p-2.5 pr-10 outline-none focus:ring-2 focus:ring-red-500 font-semibold text-slate-900 bg-slate-50 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition focus:outline-none"
                  title={showDeletePassword ? "Hide password" : "Show password"}
                >
                  {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {deletePasswordError && (
                <p className="text-[11px] font-bold text-red-600 pt-0.5">
                  ❌ Incorrect password! Authorization failed.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmState({ isOpen: false, onConfirm: null, title: "", message: "" });
                  setDeletePasswordInput("");
                  setDeletePasswordError(false);
                  setShowDeletePassword(false);
                }}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSubmit}
                className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-200 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
