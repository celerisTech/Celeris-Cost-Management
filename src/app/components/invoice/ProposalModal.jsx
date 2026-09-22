"use client";
import React, { useState, useRef, useEffect } from "react";
import { X, Printer, Download, FileText, ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import ProposalTemplate from "./ProposalTemplate";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

/* ─── Default feature lists from the Hosur Proposal docx ─── */
const DEFAULT_ADMIN = [
  "Dashboard with sales, orders, billing, stock and revenue summary",
  "Product, category and pricing management",
  "Online order management",
  "Customer management",
  "Discounts and offers",
  "Staff roles and permissions",
  "Website and billing settings",
].map((label) => ({ label, checked: true }));

const DEFAULT_ECOMMERCE = [
  "Product browsing, search and category-wise filtering",
  "Shopping cart and checkout",
  "Cash and credit billing",
  "Automatic invoice/bill generation",
  "Discount and GST calculation",
  "Bill editing, cancellation and reprint",
  "Online order status and delivery tracking",
  "Customer order and billing history",
].map((label) => ({ label, checked: true }));

const DEFAULT_INVENTORY = [
  "Product and stock management",
  "Purchase and stock entry",
  "Stock-in / stock-out tracking",
  "Automatic stock reduction on billing and online orders",
  "Low-stock alerts",
  "Stock adjustment and return management",
].map((label) => ({ label, checked: true }));

const DEFAULT_REPORTS = [
  "Custom invoice and bill format",
  "Professional print and duplicate reprint",
  "Daily, date-wise and monthly sales reports",
  "Product-wise and customer-wise reports",
  "Billing and payment reports",
  "Stock and inventory reports",
  "Online order and revenue reports",
].map((label) => ({ label, checked: true }));

const DEFAULT_USER = [
  "Email/mobile-based sign-up with OTP verification",
  "Secure login with password reset options",
  "Add/update shipping address",
  "Save profile preferences",
  "High-quality product images and details",
  "Filter by weight, type, and price",
  "Add items to Wishlist or compare",
  "Add/remove products easily",
  "Apply available discount codes",
  "Checkout using Razorpay, UPI, Card, Net Banking",
  "View past and current orders",
  "Real-time tracking with delivery status",
  "Option to reorder or return items",
  "WhatsApp/email alerts for order confirmations and offers",
  "Post reviews after delivery",
  "View reviews from other buyers",
].map((label) => ({ label, checked: true }));

const DEFAULT_DEV_SCOPE = [
  "Custom-developed, mobile-responsive E-Commerce and Billing platform.",
  "User-friendly UI/UX with fast and efficient application performance.",
  "Secure admin panel with role-based access control.",
  "Product, inventory, billing, customer and order management.",
  "Integration with payment gateway and shipping partners (as required).",
  "Professional invoice/bill generation and printing.",
  "Deployment on live server with SSL setup.",
  "Basic staff training for using the application.",
  "3 months of post-deployment support for bug fixes and small improvements.",
].map((label) => ({ label, checked: true }));

const DEFAULT_OUT_OF_SCOPE = [
  "Product photography or image editing services.",
  "Content writing for product descriptions or blog.",
  "Third-party fees such as domain, hosting, payment gateway and shipping charges.",
  "Hardware devices such as computers, printers or barcode scanners.",
  "Inventory and order entry from offline sources (manual data entry).",
  "Data migration of old/manual records unless specifically included.",
  "Mobile App (can be quoted separately if required).",
  "Continuous maintenance after the included support period (can be quoted separately).",
].map((label) => ({ label, checked: true }));

const DEFAULT_TOC = [
  { label: "1. Introduction", page: "3", indent: 0 },
  { label: "2. Project Quotation", page: "3", indent: 0 },
  { label: "3. Application Modules", page: "4", indent: 0 },
  { label: "🔒 Admin Module", page: "4", indent: 1 },
  { label: "👥 User Module", page: "5", indent: 1 },
  { label: "4. Development Scope (What We Provide)", page: "6", indent: 0 },
  { label: "5. Out of Scope (What We Do Not Provide)", page: "6", indent: 0 },
  { label: "6. Conclusion", page: "7", indent: 0 }
];

const DEFAULT_INTRO = `Celeris Solutions is pleased to present this proposal for a comprehensive E-Commerce & Billing Web Application, designed to integrate online sales, billing, product management, inventory management, customer management, payment tracking, and reporting into a single centralized application. The proposed system combines a modern E-Commerce Platform with an integrated Billing and Inventory Management System, allowing the business to manage both online and offline sales operations from one application. The application will provide a seamless shopping experience for customers while giving administrators complete control over products, categories, pricing, stock, orders, billing, payments, customers, and business reports. The system will support online product browsing, shopping cart and checkout, order processing, invoice generation, cash/UPI/card payments, credit billing, outstanding tracking, inventory movement, and centralized reporting.`;

const DEFAULT_CONCLUSION = `Celeris Solutions is committed to delivering a secure, reliable, scalable, and efficient E-Commerce & Billing Web Application that brings the client's online and offline sales operations together in one centralized system. The proposed solution will enable the business to manage products, inventory, customers, online orders, billing, payments, invoices, outstanding amounts, and business reports through a single application. We at Celeris Solutions look forward to partnering with you and supporting your business with a powerful and practical E-Commerce & Billing Solution.`;

/* ─── Collapsible Section Wrapper ─── */
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg mb-3 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-slate-700">{title}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open && <div className="px-4 py-3 space-y-2">{children}</div>}
    </div>
  );
}

function Label({ children }) {
  return <label className="block text-[10px] font-medium text-slate-500 mb-0.5">{children}</label>;
}

function Input({ value, onChange, type = "text", placeholder = "", className = "" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white ${className}`}
    />
  );
}

function Textarea({ value, onChange, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none leading-relaxed"
    />
  );
}

/* ─── TOC Editor ─── */
function TocEditor({ items, onChange, onAutoSync }) {
  const update = (i, key, val) => {
    const updated = items.map((item, idx) => (idx === i ? { ...item, [key]: val } : item));
    onChange(updated);
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { label: "New Section", page: "1", indent: 0 }]);
  const move = (i, dir) => {
    const updated = [...items];
    const targetIdx = dir === "up" ? i - 1 : i + 1;
    if (targetIdx >= 0 && targetIdx < updated.length) {
      [updated[i], updated[targetIdx]] = [updated[targetIdx], updated[i]];
      onChange(updated);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-1.5 px-1 mb-1">
        <span className="w-10 text-[9px] font-bold text-slate-400">Indent</span>
        <span className="flex-1 text-[9px] font-bold text-slate-400">Title</span>
        <span className="w-10 text-[9px] font-bold text-slate-400 text-center">Page</span>
        <span className="w-12"></span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            type="number"
            value={item.indent}
            onChange={(e) => update(i, "indent", Number(e.target.value))}
            className="w-10 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-300"
            min="0"
          />
          <input
            type="text"
            value={item.label}
            onChange={(e) => update(i, "label", e.target.value)}
            className="flex-1 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          <input
            type="text"
            value={item.page}
            onChange={(e) => update(i, "page", e.target.value)}
            className="w-10 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {i > 0 && (
              <button
                type="button"
                onClick={() => move(i, "up")}
                title="Move Up"
                className="p-0.5 text-slate-400 hover:text-blue-600 transition hover:bg-slate-100 rounded"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
            )}
            {i < items.length - 1 && (
              <button
                type="button"
                onClick={() => move(i, "down")}
                title="Move Down"
                className="p-0.5 text-slate-400 hover:text-blue-600 transition hover:bg-slate-100 rounded"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              title="Delete"
              className="p-0.5 text-red-400 hover:text-red-600 transition hover:bg-red-50 rounded"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium"
        >
          <Plus className="h-3 w-3" /> Add item
        </button>
        {onAutoSync && (
          <button
            type="button"
            onClick={onAutoSync}
            className="flex items-center gap-1 text-[10px] text-purple-700 hover:text-purple-900 font-semibold bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded border border-purple-200 transition"
          >
            🔄 Auto-Sync TOC
          </button>
        )}
      </div>
    </div>
  );
}
/* ─── Feature Checklist Editor ─── */
function FeatureEditor({ features, onChange }) {
  const toggle = (i) => {
    const updated = features.map((f, idx) => (idx === i ? { ...f, checked: !f.checked } : f));
    onChange(updated);
  };
  const updateLabel = (i, val) => {
    const updated = features.map((f, idx) => (idx === i ? { ...f, label: val } : f));
    onChange(updated);
  };
  const remove = (i) => onChange(features.filter((_, idx) => idx !== i));
  const add = () => onChange([...features, { label: "New Feature", checked: true }]);
  const move = (i, dir) => {
    const updated = [...features];
    const targetIdx = dir === "up" ? i - 1 : i + 1;
    if (targetIdx >= 0 && targetIdx < updated.length) {
      [updated[i], updated[targetIdx]] = [updated[targetIdx], updated[i]];
      onChange(updated);
    }
  };

  return (
    <div className="space-y-1">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={f.checked}
            onChange={() => toggle(i)}
            className="w-3.5 h-3.5 accent-blue-600 flex-shrink-0 cursor-pointer"
          />
          <input
            type="text"
            value={f.label}
            onChange={(e) => updateLabel(i, e.target.value)}
            className={`flex-1 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-300 ${!f.checked ? "line-through text-slate-400" : "text-slate-700"}`}
          />
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {i > 0 && (
              <button
                type="button"
                onClick={() => move(i, "up")}
                title="Move Up"
                className="p-1 text-slate-400 hover:text-blue-600 transition hover:bg-slate-100 rounded"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
            )}
            {i < features.length - 1 && (
              <button
                type="button"
                onClick={() => move(i, "down")}
                title="Move Down"
                className="p-1 text-slate-400 hover:text-blue-600 transition hover:bg-slate-100 rounded"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              title="Delete"
              className="p-1 text-red-400 hover:text-red-600 transition hover:bg-red-50 rounded"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 mt-1 font-medium"
      >
        <Plus className="h-3 w-3" /> Add item
      </button>
    </div>
  );
}

/* ─── Main Modal ─── */
export default function ProposalModal({ isOpen, onClose, initialData = {}, onSave }) {
  const proposalRef = useRef(null);
  const quillRefs = useRef({});
  const [activeTab, setActiveTab] = useState("edit");
  const [isExporting, setIsExporting] = useState(false);

  const [data, setData] = useState(() => ({
    // Client
    clientName: initialData.clientName || "",
    clientCompany: initialData.clientCompany || initialData.companyName || "",
    clientAddress: initialData.clientAddress || "",
    proposalDate: initialData.proposalDate || new Date().toISOString().split("T")[0],
    // Company (fixed)
    companyName: initialData.companyName || "Celeris Solutions",
    companyCity: initialData.companyCity || "Hosur",
    companyGstin: initialData.companyGstin || "33AAVFC1276D1ZI",
    companyEmail: initialData.companyEmail || "prabakar@celerissolutions.in",
    companyPhone: initialData.companyPhone || "9597979111",
    // Proposal header
    proposalTitle: initialData.proposalTitle || "Proposal for e-Commerce Web Application",
    introduction: initialData.introduction || DEFAULT_INTRO,
    // Pricing
    devCost: initialData.devCost !== undefined ? initialData.devCost : 50000,
    serverChargePerYear: initialData.serverChargePerYear !== undefined ? initialData.serverChargePerYear : 3000,
    amcAmount: initialData.amcAmount !== undefined ? initialData.amcAmount : 5084.75,
    // Milestones
    milestones: initialData.milestones || [
      { label: "Project Kick-Off", percent: 30 },
      { label: "On Pilot Release", percent: 35 },
      { label: "On Go-Live", percent: 35 },
    ],
    // Modules
    moduleGroups: initialData.moduleGroups || [
      { id: "mg1", title: "Admin Module", features: initialData.adminModuleFeatures || DEFAULT_ADMIN },
      { id: "mg2", title: "E-Commerce & Billing", features: initialData.ecommerceFeatures || DEFAULT_ECOMMERCE },
      { id: "mg3", title: "Inventory & Stock", features: initialData.inventoryFeatures || DEFAULT_INVENTORY },
      { id: "mg4", title: "Invoice & Reports", features: initialData.reportsFeatures || DEFAULT_REPORTS },
    ],
    userModuleFeatures: initialData.userModuleFeatures || DEFAULT_USER,
    // Scope
    devScope: initialData.devScope || DEFAULT_DEV_SCOPE,
    outOfScope: initialData.outOfScope || DEFAULT_OUT_OF_SCOPE,
    // Conclusion & auth
    conclusion: initialData.conclusion || DEFAULT_CONCLUSION,
    clientAuthName: initialData.clientAuthName || initialData.clientName || "",
    clientAuthDesignation: initialData.clientAuthDesignation || "",
    clientAuthCompany: initialData.clientAuthCompany || initialData.clientCompany || initialData.companyName || "",
    tableOfContents: initialData.tableOfContents !== undefined ? initialData.tableOfContents : DEFAULT_TOC,
    customSections: initialData.customSections || [],
    showTemplate: initialData.showTemplate !== undefined ? initialData.showTemplate : true,
    sectionOrder: initialData.sectionOrder || [
      "introduction",
      "pricing",
      "adminModuleFeatures",
      "userModuleFeatures",
      "devScope",
      "outOfScope",
      ...(initialData.customSections || []).map((s) => s.id),
      "conclusion",
    ],
  }));

  useEffect(() => {
    if (isOpen) {
      setData({
        clientName: initialData.clientName || "",
        clientCompany: initialData.clientCompany || initialData.companyName || "",
        clientAddress: initialData.clientAddress || "",
        proposalDate: initialData.proposalDate || new Date().toISOString().split("T")[0],
        companyName: initialData.companyName || "Celeris Solutions",
        companyCity: initialData.companyCity || "Hosur",
        companyGstin: initialData.companyGstin || "33AAVFC1276D1ZI",
        companyEmail: initialData.companyEmail || "prabakar@celerissolutions.in",
        companyPhone: initialData.companyPhone || "9597979111",
        proposalTitle: initialData.proposalTitle || "Proposal for e-Commerce Web Application",
        introduction: initialData.introduction || DEFAULT_INTRO,
        devCost: initialData.devCost !== undefined ? initialData.devCost : 50000,
        serverChargePerYear: initialData.serverChargePerYear !== undefined ? initialData.serverChargePerYear : 3000,
        amcAmount: initialData.amcAmount !== undefined ? initialData.amcAmount : 5084.75,
        milestones: initialData.milestones || [
          { label: "Project Kick-Off", percent: 30 },
          { label: "On Pilot Release", percent: 35 },
          { label: "On Go-Live", percent: 35 },
        ],
        moduleGroups: initialData.moduleGroups || [
          { id: "mg1", title: "Admin Module", features: initialData.adminModuleFeatures || DEFAULT_ADMIN },
          { id: "mg2", title: "E-Commerce & Billing", features: initialData.ecommerceFeatures || DEFAULT_ECOMMERCE },
          { id: "mg3", title: "Inventory & Stock", features: initialData.inventoryFeatures || DEFAULT_INVENTORY },
          { id: "mg4", title: "Invoice & Reports", features: initialData.reportsFeatures || DEFAULT_REPORTS },
        ],
        userModuleFeatures: initialData.userModuleFeatures || DEFAULT_USER,
        devScope: initialData.devScope || DEFAULT_DEV_SCOPE,
        outOfScope: initialData.outOfScope || DEFAULT_OUT_OF_SCOPE,
        conclusion: initialData.conclusion || DEFAULT_CONCLUSION,
        clientAuthName: initialData.clientAuthName || initialData.clientName || "",
        clientAuthDesignation: initialData.clientAuthDesignation || "",
        clientAuthCompany: initialData.clientAuthCompany || initialData.clientCompany || initialData.companyName || "",
        tableOfContents: initialData.tableOfContents !== undefined ? initialData.tableOfContents : DEFAULT_TOC,
        customSections: initialData.customSections || [],
        showTemplate: initialData.showTemplate !== undefined ? initialData.showTemplate : true,
        sectionOrder: initialData.sectionOrder || [
          "introduction",
          "pricing",
          "adminModuleFeatures",
          "userModuleFeatures",
          "devScope",
          "outOfScope",
          ...(initialData.customSections || []).map((s) => s.id),
          "conclusion",
        ],
      });
    }
  }, [isOpen, initialData]);

  const set = (key, val) => setData((prev) => ({ ...prev, [key]: val }));

  const generateAutoToc = (orderList = data.sectionOrder, customSecs = data.customSections, modGroups = data.moduleGroups) => {
    let currentPage = 3;
    let sectionNum = 1;
    const newToc = [];

    (orderList || []).forEach((key) => {
      if (key === "introduction") {
        newToc.push({ label: `${sectionNum}. Introduction`, page: String(currentPage), indent: 0 });
        sectionNum++;
      } else if (key === "pricing") {
        newToc.push({ label: `${sectionNum}. Project Quotation`, page: String(currentPage), indent: 0 });
        sectionNum++;
        currentPage++;
      } else if (key === "adminModuleFeatures") {
        const mainNum = sectionNum;
        newToc.push({ label: `${mainNum}. Application Modules`, page: String(currentPage), indent: 0 });
        (modGroups || []).forEach((group, gi) => {
          newToc.push({ label: `${mainNum}.${gi + 1} ${group.title}`, page: String(currentPage), indent: 1 });
        });
        sectionNum++;
        currentPage++;
      } else if (key === "userModuleFeatures") {
        newToc.push({ label: `${sectionNum}. User / Customer Module Features`, page: String(currentPage), indent: 0 });
        sectionNum++;
        currentPage++;
      } else if (key === "devScope") {
        newToc.push({ label: `${sectionNum}. Development Scope (What We Provide)`, page: String(currentPage), indent: 0 });
        sectionNum++;
      } else if (key === "outOfScope") {
        newToc.push({ label: `${sectionNum}. Out of Scope (What We Do Not Provide)`, page: String(currentPage), indent: 0 });
        sectionNum++;
      } else if (key === "conclusion") {
        newToc.push({ label: `${sectionNum}. Conclusion`, page: String(currentPage), indent: 0 });
        sectionNum++;
      } else {
        const cust = (customSecs || []).find((s) => s.id === key);
        if (cust) {
          newToc.push({ label: `${sectionNum}. ${cust.title}`, page: String(currentPage), indent: 0 });
          if (cust.groups && cust.groups.length > 0) {
            cust.groups.forEach((g, gi) => {
              if (g.title) {
                newToc.push({ label: `${sectionNum}.${gi + 1} ${g.title}`, page: String(currentPage), indent: 1 });
              }
            });
          }
          sectionNum++;
          currentPage++;
        }
      }
    });

    return newToc;
  };

  const moveSection = (idx, direction) => {
    const newOrder = [...data.sectionOrder];
    if (direction === "up" && idx > 0) {
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    } else if (direction === "down" && idx < newOrder.length - 1) {
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    }
    const updatedToc = generateAutoToc(newOrder);
    setData((prev) => ({
      ...prev,
      sectionOrder: newOrder,
      tableOfContents: updatedToc,
    }));
  };

  const handleTableAction = (secId, action) => {
    const quillObj = quillRefs.current[secId]?.getEditor();
    if (!quillObj) return;
    const table = quillObj.getModule("table");
    if (!table) return;

    switch (action) {
      case "insertTable":
        table.insertTable(2, 2);
        break;
      case "insertRowAbove":
        table.insertRowAbove();
        break;
      case "insertRowBelow":
        table.insertRowBelow();
        break;
      case "insertColumnLeft":
        table.insertColumnLeft();
        break;
      case "insertColumnRight":
        table.insertColumnRight();
        break;
      case "deleteRow":
        table.deleteRow();
        break;
      case "deleteColumn":
        table.deleteColumn();
        break;
      case "deleteTable":
        table.deleteTable();
        break;
      default:
        break;
    }
  };

  const handleFormat = (secId, format, value) => {
    const quillObj = quillRefs.current[secId]?.getEditor();
    if (quillObj) {
      quillObj.format(format, value);
    }
  };

  const removeSection = (idx, sectionKey) => {
    const newOrder = [...data.sectionOrder];
    newOrder.splice(idx, 1);
    set("sectionOrder", newOrder);
    
    if (data.customSections.find(s => s.id === sectionKey)) {
        set("customSections", data.customSections.filter(s => s.id !== sectionKey));
    }
  };

  const renderMoveButtons = (idx, sectionKey) => (
    <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
      <button onClick={() => removeSection(idx, sectionKey)} className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1">
        <Trash2 className="h-3 w-3" /> Remove Section
      </button>
      <div className="flex items-center gap-4">
        {idx > 0 && (
          <button onClick={() => moveSection(idx, "up")} className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1">
            <ArrowUp className="h-3 w-3" /> Move Up
          </button>
        )}
        {idx < data.sectionOrder.length - 1 && (
          <button onClick={() => moveSection(idx, "down")} className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1">
            <ArrowDown className="h-3 w-3" /> Move Down
          </button>
        )}
      </div>
    </div>
  );

  /* ─── PDF Download ─── */
  const handleDownloadPDF = async () => {
    if (!proposalRef.current) return;
    try {
      setIsExporting(true);
      const element = proposalRef.current;

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
      const imgAspect = canvas.height / canvas.width;
      
      const finalWidth = pdfWidth;
      const finalHeight = pdfWidth * imgAspect;

      // Slice the canvas into multiple A4 pages if taller than one page
      let yPos = 0;
      let remainingHeight = finalHeight;

      while (remainingHeight > 0) {
        if (yPos > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "PNG", 0, -yPos, finalWidth, finalHeight);
        remainingHeight -= pdfPageHeight;
        yPos += pdfPageHeight;
      }

      pdf.save(`Proposal_${data.clientCompany || "Client"}_${data.proposalDate}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Use the Print option instead.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => window.print();

  if (!isOpen) return null;

  /* ─── Milestone helpers ─── */
  const updateMilestone = (i, key, val) => {
    const updated = data.milestones.map((m, idx) => (idx === i ? { ...m, [key]: val } : m));
    set("milestones", updated);
  };
  const addMilestone = () => set("milestones", [...data.milestones, { label: "New Milestone", percent: 0 }]);
  const removeMilestone = (i) => set("milestones", data.milestones.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:w-full print:rounded-none">

        {/* ── Header ── */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center print:hidden border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg"><FileText className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-bold">Dynamic Proposal Generator</h2>
              <p className="text-xs text-slate-400">Edit, preview & download professional project proposals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => set("showTemplate", !data.showTemplate)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                data.showTemplate !== false
                  ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-500 shadow-sm"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600"
              }`}
            >
              {data.showTemplate !== false ? "📄 With Template" : "📝 Without Template"}
            </button>
            {onSave && (
              <button onClick={() => onSave(data)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 transition-colors">
                Save Proposal
              </button>
            )}
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 transition-colors">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              {isExporting ? "Exporting…" : "Download PDF"}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Mobile Tab Toggle ── */}
        <div className="flex lg:hidden border-b border-slate-200 print:hidden flex-shrink-0">
          {["edit", "preview"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" : "text-slate-500"}`}
            >
              {tab === "edit" ? "✏️ Edit Fields" : "👁 Live Preview"}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 print:block">

          {/* ── LEFT: Edit Form ── */}
          <div className={`lg:col-span-5 min-h-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-4 print:hidden ${activeTab === "preview" ? "hidden lg:block" : "block"}`}>

            {/* Client Info & Header */}
            <Section title="📋 Client & Header">
              <div className="flex items-center justify-between bg-slate-100 p-2 rounded-lg mb-2 border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Proposal Mode</span>
                <button
                  type="button"
                  onClick={() => set("showTemplate", !data.showTemplate)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    data.showTemplate !== false
                      ? "bg-purple-600 text-white"
                      : "bg-slate-300 text-slate-800"
                  }`}
                >
                  {data.showTemplate !== false ? "With Template" : "Without Template"}
                </button>
              </div>
              <div><Label>Proposal Date</Label><Input type="date" value={data.proposalDate} onChange={(e) => set("proposalDate", e.target.value)} /></div>
              
              <div className="mt-2 pt-2 border-t border-slate-200">
                <div><Label>Proposal Title</Label><Input value={data.proposalTitle} onChange={(e) => set("proposalTitle", e.target.value)} /></div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 mb-1">Submitted By (Our Company)</p>
                <div className="space-y-2">
                  <div><Label>Company Name</Label><Input value={data.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="e.g. Celeris Solutions" /></div>
                  <div><Label>City</Label><Input value={data.companyCity} onChange={(e) => set("companyCity", e.target.value)} placeholder="e.g. Hosur" /></div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 mb-1">To (Client Details)</p>
                <div className="space-y-2">
                  <div><Label>Company / Org Name</Label><Input value={data.clientCompany} onChange={(e) => set("clientCompany", e.target.value)} placeholder="e.g. Hosur Traders" /></div>
                  <div><Label>Client Name</Label><Input value={data.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="e.g. Srinivas" /></div>
                </div>
              </div>
            </Section>

            {/* Table of Contents */}
            <Section title="📑 Table of Contents" defaultOpen={false}>
              <TocEditor items={data.tableOfContents} onChange={(v) => set("tableOfContents", v)} onAutoSync={() => set("tableOfContents", generateAutoToc())} />
            </Section>

            {/* 🔀 Section & Page Organizer */}
            <Section title="🔀 Section & Page Organizer" defaultOpen={true}>
              <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                Shuffle sections and pages in your proposal. Click ⬆️ or ⬇️ next to any section to move it up or down.
              </p>
              <div className="space-y-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                {data.sectionOrder.map((sectionKey, idx) => {
                  let label = "";
                  if (sectionKey === "introduction") label = "Introduction";
                  else if (sectionKey === "pricing") label = "Project Quotation & Pricing";
                  else if (sectionKey === "adminModuleFeatures") label = "Application Modules";
                  else if (sectionKey === "userModuleFeatures") label = "User / Customer Module";
                  else if (sectionKey === "devScope") label = "Development Scope";
                  else if (sectionKey === "outOfScope") label = "Out of Scope";
                  else if (sectionKey === "conclusion") label = "Conclusion";
                  else {
                    const cust = data.customSections.find((s) => s.id === sectionKey);
                    label = cust ? `Custom: ${cust.title}` : sectionKey;
                  }

                  return (
                    <div key={sectionKey} className="flex items-center justify-between px-2.5 py-1.5 bg-white hover:bg-slate-100 rounded-md border border-slate-200 text-xs transition">
                      <span className="font-semibold text-slate-700 text-[11px] truncate flex-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{idx + 1}</span>
                        {label}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, "up")}
                          className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-slate-200 transition"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === data.sectionOrder.length - 1}
                          onClick={() => moveSection(idx, "down")}
                          className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-slate-200 transition"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Dynamic Reorderable Sections */}
            {data.sectionOrder.map((sectionKey, secIdx) => {
              const numStr = `${secIdx + 1}. `;
              if (sectionKey === "introduction") {
                return (
                  <Section key="intro" title={`${numStr}📝 Introduction`} defaultOpen={false}>
                    {renderMoveButtons(secIdx, sectionKey)}
                    <div className="mt-2">
                      <Textarea value={data.introduction} onChange={(e) => set("introduction", e.target.value)} rows={6} />
                    </div>
                  </Section>
                );
              }

              if (sectionKey === "pricing") {
                return (
                  <Section key="pricing" title={`${numStr}💰 Project Quotation & Pricing`}>
                    {renderMoveButtons(secIdx, sectionKey)}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div><Label>Development Cost (₹)</Label><Input type="number" value={data.devCost} onChange={(e) => set("devCost", e.target.value)} /></div>
                      <div><Label>Server Charge / Year (₹)</Label><Input type="number" value={data.serverChargePerYear} onChange={(e) => set("serverChargePerYear", e.target.value)} /></div>
                      <div><Label>AMC Amount / Year (₹)</Label><Input type="number" value={data.amcAmount} onChange={(e) => set("amcAmount", e.target.value)} /></div>
                    </div>

                    {/* Milestones */}
                    <div className="mt-3">
                      <Label>Payment Milestones</Label>
                      <div className="space-y-1.5 mt-1">
                        {data.milestones.map((m, i) => (
                          <div key={i} className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={m.label}
                              onChange={(e) => updateMilestone(i, "label", e.target.value)}
                              className="flex-1 border border-slate-200 rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-300"
                              placeholder="Milestone label"
                            />
                            <input
                              type="number"
                              value={m.percent}
                              onChange={(e) => updateMilestone(i, "percent", Number(e.target.value))}
                              className="w-16 border border-slate-200 rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-300 text-center"
                              placeholder="%"
                            />
                            <span className="text-[10px] text-slate-400">%</span>
                            <button onClick={() => removeMilestone(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        ))}
                        <button onClick={addMilestone} className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                          <Plus className="h-3 w-3" /> Add milestone
                        </button>
                      </div>
                    </div>
                  </Section>
                );
              }

              if (sectionKey === "adminModuleFeatures") {
                return (
                  <Section key="adminMod" title={`${numStr}🔒 Application Modules`} defaultOpen={false}>
                    {renderMoveButtons(secIdx, sectionKey)}
                    <div className="mt-3 space-y-4">
                      {data.moduleGroups.map((group, gIdx) => (
                        <div key={group.id || gIdx} className="bg-white border border-slate-200 rounded p-2 relative">
                          <div className="flex gap-2 mb-2 items-center">
                            <Input 
                              value={group.title} 
                              onChange={(e) => {
                                const newGroups = [...data.moduleGroups];
                                newGroups[gIdx].title = e.target.value;
                                set("moduleGroups", newGroups);
                              }}
                              className="font-semibold text-[10px] h-7 flex-1"
                            />
                            <button onClick={() => {
                              const newGroups = data.moduleGroups.filter((_, i) => i !== gIdx);
                              set("moduleGroups", newGroups);
                            }} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <FeatureEditor 
                            features={group.features} 
                            onChange={(v) => {
                              const newGroups = [...data.moduleGroups];
                              newGroups[gIdx].features = v;
                              set("moduleGroups", newGroups);
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3">
                      <button onClick={() => {
                        set("moduleGroups", [
                          ...data.moduleGroups,
                          { id: Date.now().toString(), title: "New Sub-Heading", features: [] }
                        ]);
                      }} className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                        <Plus className="h-3 w-3" /> Add Sub-Heading
                      </button>
                    </div>
                  </Section>
                );
              }

              if (sectionKey === "userModuleFeatures") {
                return (
                  <Section key="userMod" title={`${numStr}👥 User Module Features`} defaultOpen={false}>
                    {renderMoveButtons(secIdx, sectionKey)}
                    <div className="mt-2">
                      <FeatureEditor features={data.userModuleFeatures} onChange={(v) => set("userModuleFeatures", v)} />
                    </div>
                  </Section>
                );
              }

              if (sectionKey === "devScope") {
                return (
                  <Section key="devScope" title={`${numStr}✅ Development Scope`} defaultOpen={false}>
                    {renderMoveButtons(secIdx, sectionKey)}
                    <div className="mt-2">
                      <FeatureEditor features={data.devScope} onChange={(v) => set("devScope", v)} />
                    </div>
                  </Section>
                );
              }

              if (sectionKey === "outOfScope") {
                return (
                  <Section key="outOfScope" title={`${numStr}🚫 Out of Scope`} defaultOpen={false}>
                    {renderMoveButtons(secIdx, sectionKey)}
                    <div className="mt-2">
                      <FeatureEditor features={data.outOfScope} onChange={(v) => set("outOfScope", v)} />
                    </div>
                  </Section>
                );
              }

              if (sectionKey === "conclusion") {
                return (
                  <Section key="conclusion" title={`${numStr}📌 Conclusion`} defaultOpen={false}>
                    {renderMoveButtons(secIdx, sectionKey)}
                    <div className="mt-2">
                      <Textarea value={data.conclusion} onChange={(e) => set("conclusion", e.target.value)} rows={5} />
                    </div>
                  </Section>
                );
              }

              // Custom Sections (fallback if not matched above)
              const sec = data.customSections.find(s => s.id === sectionKey);
              if (sec) {
                return (
                  <Section key={sec.id} title={`${numStr}🔧 ${sec.title}`} defaultOpen={true}>
                    <div className="mb-2">
                      <Label>Section Title</Label>
                      <Input value={sec.title} onChange={(e) => {
                        const updated = data.customSections.map(s => s.id === sec.id ? { ...s, title: e.target.value } : s);
                        set("customSections", updated);
                      }} />
                    </div>
                    {sec.type === "checklist" ? (
                      <div className="mt-3">
                        <div className="space-y-4">
                          {(sec.groups || []).map((group, gIdx) => (
                            <div key={group.id || gIdx} className="bg-white border border-slate-200 rounded p-2 relative">
                              <div className="flex gap-2 mb-2 items-center">
                                <Input 
                                  value={group.title} 
                                  onChange={(e) => {
                                    const updated = data.customSections.map(s => {
                                      if (s.id === sec.id) {
                                        const newGroups = [...s.groups];
                                        newGroups[gIdx].title = e.target.value;
                                        return { ...s, groups: newGroups };
                                      }
                                      return s;
                                    });
                                    set("customSections", updated);
                                  }}
                                  className="font-semibold text-[10px] h-7 flex-1"
                                />
                                <button onClick={() => {
                                  const updated = data.customSections.map(s => {
                                    if (s.id === sec.id) {
                                      const newGroups = s.groups.filter((_, i) => i !== gIdx);
                                      return { ...s, groups: newGroups };
                                    }
                                    return s;
                                  });
                                  set("customSections", updated);
                                }} className="text-red-400 hover:text-red-600 p-1">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <FeatureEditor 
                                features={group.features} 
                                onChange={(v) => {
                                  const updated = data.customSections.map(s => {
                                    if (s.id === sec.id) {
                                      const newGroups = [...s.groups];
                                      newGroups[gIdx].features = v;
                                      return { ...s, groups: newGroups };
                                    }
                                    return s;
                                  });
                                  set("customSections", updated);
                                }} 
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-3">
                          <button onClick={() => {
                            const updated = data.customSections.map(s => {
                              if (s.id === sec.id) {
                                return { ...s, groups: [...(s.groups || []), { id: Date.now().toString(), title: "New Sub-Heading", features: [] }] };
                              }
                              return s;
                            });
                            set("customSections", updated);
                          }} className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                            <Plus className="h-3 w-3" /> Add Sub-Heading
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <div className="space-y-4">
                          {(sec.groups || [{ id: sec.id + "_legacy", title: "", content: sec.content || "" }]).map((group, gIdx) => (
                            <div key={group.id || gIdx} className="bg-white border border-slate-200 rounded p-2 relative">
                              <div className="flex gap-2 mb-2 items-center">
                                <Input 
                                  value={group.title || ""} 
                                  placeholder="Sub-Heading (Optional)"
                                  onChange={(e) => {
                                    const currentGroups = sec.groups || [{ id: sec.id + "_legacy", title: "", content: sec.content || "" }];
                                    const updated = data.customSections.map(s => {
                                      if (s.id === sec.id) {
                                        const newGroups = [...currentGroups];
                                        newGroups[gIdx].title = e.target.value;
                                        return { ...s, groups: newGroups, content: "" };
                                      }
                                      return s;
                                    });
                                    set("customSections", updated);
                                  }}
                                  className="font-semibold text-[10px] h-7 flex-1"
                                />
                                {(sec.groups || []).length > 1 && (
                                  <button onClick={() => {
                                    const updated = data.customSections.map(s => {
                                      if (s.id === sec.id) {
                                        const newGroups = s.groups.filter((_, i) => i !== gIdx);
                                        return { ...s, groups: newGroups };
                                      }
                                      return s;
                                    });
                                    set("customSections", updated);
                                  }} className="text-red-400 hover:text-red-600 p-1">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                               <div className="flex items-center justify-between mb-1">
                                <Label>Content (Rich Text)</Label>
                                <div className="flex gap-2 items-center flex-wrap">
                                  <div className="flex gap-1 border-r border-slate-200 pr-2">
                                    <button onClick={() => handleFormat(group.id || sec.id, 'header', 1)} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] hover:bg-slate-200 text-slate-700 font-bold" title="Main Heading">H1</button>
                                    <button onClick={() => handleFormat(group.id || sec.id, 'header', 2)} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] hover:bg-slate-200 text-slate-700 font-bold" title="Sub Heading">H2</button>
                                    <button onClick={() => handleFormat(group.id || sec.id, 'header', false)} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] hover:bg-slate-200 text-slate-700" title="Normal Text">T</button>
                                  </div>
                                  <div className="flex gap-1 border-r border-slate-200 pr-2">
                                    <button onClick={() => handleFormat(group.id || sec.id, 'align', false)} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] hover:bg-slate-200 text-slate-700 font-bold" title="Align Left">Left</button>
                                    <button onClick={() => handleFormat(group.id || sec.id, 'align', 'center')} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-300 rounded text-[9px] hover:bg-blue-200 font-bold shadow-xs" title="Align Center">Center ↔</button>
                                    <button onClick={() => handleFormat(group.id || sec.id, 'align', 'right')} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] hover:bg-slate-200 text-slate-700 font-bold" title="Align Right">Right</button>
                                    <button onClick={() => handleFormat(group.id || sec.id, 'align', 'justify')} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] hover:bg-slate-200 text-slate-700" title="Justify">Justify</button>
                                  </div>
                                  <div className="flex gap-1">
                                    <button onClick={() => handleTableAction(group.id || sec.id, 'insertTable')} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] hover:bg-slate-200 text-slate-700" title="Insert 2x2 Table">Insert Table</button>
                                    <button onClick={() => handleTableAction(group.id || sec.id, 'insertRowBelow')} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] hover:bg-slate-200 text-slate-700" title="Add Row">Row +</button>
                                    <button onClick={() => handleTableAction(group.id || sec.id, 'insertColumnRight')} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] hover:bg-slate-200 text-slate-700" title="Add Column">Col +</button>
                                    <button onClick={() => handleTableAction(group.id || sec.id, 'deleteRow')} className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[9px] hover:bg-red-100" title="Delete Row">Del Row</button>
                                    <button onClick={() => handleTableAction(group.id || sec.id, 'deleteColumn')} className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-[9px] hover:bg-red-100" title="Delete Column">Del Col</button>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded overflow-hidden border border-slate-200 text-black">
                                <ReactQuill 
                                  ref={(el) => (quillRefs.current[(group.id || sec.id)] = el)}
                                  theme="snow" 
                                  value={group.content} 
                                  onChange={(val) => {
                                    const currentGroups = sec.groups || [{ id: sec.id + "_legacy", title: "", content: sec.content || "" }];
                                    const updated = data.customSections.map(s => {
                                      if (s.id === sec.id) {
                                        const newGroups = [...currentGroups];
                                        newGroups[gIdx].content = val;
                                        return { ...s, groups: newGroups, content: "" };
                                      }
                                      return s;
                                    });
                                    set("customSections", updated);
                                  }}
                                  modules={{
                                    toolbar: [
                                      [{ 'header': [1, 2, 3, false] }],
                                      [{ 'align': [] }],
                                      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                      [{'list': 'ordered'}, {'list': 'bullet'}],
                                      ['link', 'image'],
                                      ['clean']
                                    ],
                                    table: true
                                  }}
                                  className="text-xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3">
                          <button onClick={() => {
                            const currentGroups = sec.groups || [{ id: sec.id + "_legacy", title: "", content: sec.content || "" }];
                            const updated = data.customSections.map(s => {
                              if (s.id === sec.id) {
                                return { ...s, groups: [...currentGroups, { id: Date.now().toString(), title: "New Sub-Heading", content: "" }], content: "" };
                              }
                              return s;
                            });
                            set("customSections", updated);
                          }} className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                            <Plus className="h-3 w-3" /> Add Sub-Heading
                          </button>
                        </div>
                      </div>
                    )}
                    {renderMoveButtons(secIdx, sectionKey)}
                  </Section>
                );
              }

              return null;
            })}

            <div className="mt-4 pb-8 flex items-center justify-center gap-4">
              <button onClick={() => {
                const newId = Date.now().toString();
                const newSection = {
                  id: newId,
                  type: "text",
                  title: "New Custom Section",
                  content: "",
                  groups: [{ id: newId + "_g1", title: "", content: "" }]
                };
                const currentCustom = data.customSections || [];
                const currentOrder = data.sectionOrder || [];
                set("customSections", [...currentCustom, newSection]);
                set("sectionOrder", [...currentOrder, newId]);
              }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors">
                <Plus className="h-4 w-4" /> Add Text Section
              </button>
              <button onClick={() => {
                const newId = Date.now().toString();
                const newSection = {
                  id: newId,
                  type: "checklist",
                  title: "New Checklist Section",
                  groups: [{ id: newId + "_g1", title: "Sub-Heading", features: [{ label: "New Feature Item", checked: true }] }]
                };
                const currentCustom = data.customSections || [];
                const currentOrder = data.sectionOrder || [];
                set("customSections", [...currentCustom, newSection]);
                set("sectionOrder", [...currentOrder, newId]);
              }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors">
                <Plus className="h-4 w-4" /> Add Checklist Section
              </button>
            </div>

            {/* Client Auth */}
            <Section title="✍️ Client Authentication">
              <div><Label>Client Name</Label><Input value={data.clientAuthName} onChange={(e) => set("clientAuthName", e.target.value)} placeholder="Client's name" /></div>
              <div><Label>Designation</Label><Input value={data.clientAuthDesignation} onChange={(e) => set("clientAuthDesignation", e.target.value)} placeholder="e.g. Director" /></div>
              <div><Label>Company Name</Label><Input value={data.clientAuthCompany} onChange={(e) => set("clientAuthCompany", e.target.value)} placeholder="Client company" /></div>
            </Section>
          </div>

          {/* ── RIGHT: Live Preview ── */}
          <div className={`lg:col-span-7 min-h-0 overflow-y-auto bg-gray-100 p-4 print:w-full print:p-0 print:bg-white ${activeTab === "edit" ? "hidden lg:block" : "block"}`}>
            <div className="w-full mx-auto shadow-lg rounded-xl overflow-hidden print:shadow-none" style={{ maxWidth: "800px" }}>
              <ProposalTemplate ref={proposalRef} proposalData={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
