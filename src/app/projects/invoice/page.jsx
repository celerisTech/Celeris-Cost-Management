"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/app/components/Navbar";
import ProjectInvoiceModal from "@/app/components/invoice/ProjectInvoiceModal";
import ProposalModal from "@/app/components/invoice/ProposalModal";
import { useRouter } from "next/navigation";

// Financial Year Helper: April 1 of Year Y to March 31 of Year Y+1 (e.g. 2026-04-01 => "2026-2027", 2027-02-15 => "2026-2027", 2027-04-01 => "2027-2028")
function getFinancialYearKey(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return getFinancialYearKey(new Date());

  const month = d.getMonth(); // 0 = Jan, 1 = Feb, 2 = Mar, 3 = Apr, ...
  const year = d.getFullYear();

  // If Jan, Feb, or Mar (months 0, 1, 2), Financial Year started April 1 of previous calendar year
  if (month < 3) {
    return `${year - 1}-${year}`;
  } else {
    return `${year}-${year + 1}`;
  }
}

// Generate Next Sequential Invoice Number for target Financial Year (e.g. INV-01, INV-02...)
// Resets back to INV-01 every April 1st for the new Financial Year.
function generateNextInvoiceNo(allProjects = [], targetDateStr = null) {
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  const targetFY = getFinancialYearKey(targetDate);

  const usedNumbersInFY = new Set();

  (allProjects || []).forEach((prj) => {
    // Check main invoice date and invoiceNo
    const mainDate = prj.date || prj.fullData?.invoiceDate;
    const mainFY = mainDate ? getFinancialYearKey(mainDate) : null;
    const mainInvNo = prj.fullData?.invoiceNo || prj.invoiceNo;

    if (mainFY === targetFY && mainInvNo && typeof mainInvNo === "string") {
      const match = mainInvNo.match(/INV-(\d+)/i);
      if (match) {
        usedNumbersInFY.add(parseInt(match[1], 10));
      }
    }

    // Check all invoice entries in proposalHistory for this project
    const history = prj.fullData?.proposalHistory || [];
    history.forEach((hist) => {
      const histDate = hist.date;
      const histFY = histDate ? getFinancialYearKey(histDate) : null;
      const histInvNo = hist.invoiceNo;

      if (histFY === targetFY && histInvNo && typeof histInvNo === "string") {
        const match = histInvNo.match(/INV-(\d+)/i);
        if (match) {
          usedNumbersInFY.add(parseInt(match[1], 10));
        }
      }
    });
  });

  // Find lowest available sequence number starting from 1
  let nextSeq = 1;
  while (usedNumbersInFY.has(nextSeq)) {
    nextSeq++;
  }

  return `INV-${String(nextSeq).padStart(2, "0")}`;
}

export default function StandaloneInvoicePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceProjects, setInvoiceProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalProject, setProposalProject] = useState(null);

  const [dbProjects, setDbProjects] = useState([]);
  const [customSavedProjectNames, setCustomSavedProjectNames] = useState([]);

  const [newProjectNameField, setNewProjectNameField] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSavedSuccess, setNameSavedSuccess] = useState(false);

  // Fetch standalone invoices from API
  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/standalone-invoices");
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setInvoiceProjects(data);
        return data;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch standalone invoices:", err);
      return [];
    }
  };

  // Load saved invoices from API and fetch DB projects on mount
  React.useEffect(() => {
    const initData = async () => {
      let currentInvoices = await fetchInvoices();

      // MIGRATION SCRIPT: Check if we need to migrate local storage to DB
      try {
        const stored = localStorage.getItem("celeris_project_invoices");
        if (stored && currentInvoices.length === 0) {
          const parsed = JSON.parse(stored);
          console.log("Migrating", parsed.length, "invoices from localStorage to DB...");
          
          for (const item of parsed) {
            await fetch("/api/standalone-invoices", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: item.id,
                clientName: item.clientName,
                salutation: item.salutation,
                companyName: item.companyName,
                phone: item.phone,
                totalCost: item.totalCost,
                proposalGiven: item.proposalGiven,
                status: item.status,
                date: item.date,
                fullData: item.fullData
              })
            });
          }
          // Refresh list from DB
          await fetchInvoices();
          // Clear localStorage so we don't migrate again (optional, we can just leave it)
          localStorage.removeItem("celeris_project_invoices");
        }
      } catch (e) {
        console.error("Failed to migrate invoice projects:", e);
      }
    };
    initData();

    try {
      const storedCustom = localStorage.getItem("celeris_custom_project_names");
      if (storedCustom) {
        setCustomSavedProjectNames(JSON.parse(storedCustom));
      }
    } catch (e) {
      console.error("Failed to parse custom names", e);
    }

    // Fetch dynamic project names from DB API
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setDbProjects(data);
        }
      })
      .catch((err) => console.log("DB project fetch fallback:", err));

    // Fetch custom project names from dedicated table ccms_project_names
    fetch("/api/project-names")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCustomSavedProjectNames((prev) => Array.from(new Set([...prev, ...data])));
        }
      })
      .catch((err) => console.log("Dedicated project names fetch fallback:", err));
  }, []);

  // Consolidate dynamic project names from API + localStorage + presets
  const defaultPresets = [
    "Electronics Service Application",
    "Hospital Management System",
    "Lab Management Application",
    "Billing & Inventory Software",
    "Clinic Management System",
    "Custom Web Application",
    "Mobile Application (Android & iOS)",
    "E-Commerce Platform",
    "ERP & CRM Portal"
  ];

  // Dropdown values come EXCLUSIVELY from dedicated database table ccms_project_names
  const allDynamicProjectNames = Array.from(
    new Set(
      customSavedProjectNames.length > 0 ? customSavedProjectNames : defaultPresets
    )
  );
  const handleSaveInvoiceData = async (savedData) => {
    const targetId = selectedProject?.id || savedData.invoiceNo;
    const updatedPrj = {
      id: targetId || `INV-PRJ-${String(invoiceProjects.length + 1).padStart(2, "0")}`,
      clientName: savedData.clientName || "Client",
      salutation: savedData.salutation || "Mr.",
      companyName: savedData.clientCompany || "Company",
      phone: savedData.clientPhone || "Phone",
      totalCost: Number(savedData.totalProjectCost) || 0,
      proposalGiven: savedData.proposalGiven || "No",
      status: `Proposal #${savedData.proposalNo || 1} Billed`,
      date: savedData.invoiceDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
      fullData: savedData,
    };

    try {
      await fetch("/api/standalone-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPrj)
      });
      
      setInvoiceProjects((prev) => {
        const existingIdx = prev.findIndex((p) => p.id === updatedPrj.id);
        if (existingIdx >= 0) {
          const newList = [...prev];
          newList[existingIdx] = updatedPrj;
          return newList;
        } else {
          return [updatedPrj, ...prev];
        }
      });

      showToast("Invoice Saved", "Client invoice details saved successfully!", "success");
    } catch (e) {
      console.error("Failed to save to database:", e);
      showToast("Error", "Failed to save invoice to database.", "error");
    }
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectInput, setNewProjectInput] = useState({
    salutation: "Mr.",
    clientName: "",
    companyName: "",
    phone: "",
    totalCost: "",
    proposalGiven: "No",
    projectNames: [""]
  });

  const handleCreateNewProjectSubmit = (e) => {
    e.preventDefault();
    if (!newProjectInput.clientName || !newProjectInput.phone || !newProjectInput.totalCost) {
      showToast("Missing Required Fields", "Please fill in Client Name, Phone Number and Project Cost.", "warning");
      return;
    }

    let nextPrjNum = invoiceProjects.length + 1;
    let prjId = `PRJ-${String(nextPrjNum).padStart(2, "0")}`;
    while (invoiceProjects.some((p) => p.id === prjId)) {
      nextPrjNum += 1;
      prjId = `PRJ-${String(nextPrjNum).padStart(2, "0")}`;
    }
    const currentDateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
    const initialInvoiceNo = generateNextInvoiceNo(invoiceProjects, currentDateStr);

    const validProjectNames = (newProjectInput.projectNames || []).filter((n) => n.trim() !== "");
    const primaryProjectName = validProjectNames.length > 0 ? validProjectNames.join(", ") : (newProjectInput.companyName || newProjectInput.clientName || "Project");

    const totalCost = Number(newProjectInput.totalCost);
    const count = validProjectNames.length > 0 ? validProjectNames.length : 1;
    const basePerItem = Number(((totalCost / 1.18) / count).toFixed(2));

    const generatedItems = validProjectNames.length > 0
      ? validProjectNames.map((name, idx) => ({
        id: idx + 1,
        description: name,
        hsnSac: "9983",
        amount: basePerItem,
      }))
      : [
        {
          id: 1,
          description: `${newProjectInput.companyName || newProjectInput.clientName} Application`,
          hsnSac: "9983",
          amount: Number((totalCost / 1.18).toFixed(2)),
        }
      ];

    const createdData = {
      salutation: newProjectInput.salutation,
      clientName: newProjectInput.clientName,
      clientCompany: newProjectInput.companyName,
      clientPhone: newProjectInput.phone,
      project_name: primaryProjectName,
      projectNames: validProjectNames,
      totalProjectCost: totalCost,
      proposalGiven: "No",
      documentType: "TAX INVOICE",
      invoiceNo: initialInvoiceNo,
      invoiceDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
      dueDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
      items: generatedItems,
    };

    // Reset selectedProject so handleSaveInvoiceData adds a new project entry instead of updating an existing one
    setSelectedProject(null);

    const newPrjEntry = {
      id: prjId,
      clientName: createdData.clientName,
      salutation: createdData.salutation,
      companyName: createdData.clientCompany,
      phone: createdData.clientPhone,
      projectName: primaryProjectName,
      projectNames: validProjectNames,
      totalCost: createdData.totalProjectCost,
      proposalGiven: "No",
      status: "No Proposal Billed",
      date: createdData.invoiceDate,
      fullData: createdData,
    };

    setInvoiceProjects((prev) => {
      const newList = [newPrjEntry, ...prev];
      try {
        localStorage.setItem("celeris_project_invoices", JSON.stringify(newList));
      } catch (err) {
        console.error("Failed to save new project to localStorage:", err);
      }
      return newList;
    });

    showToast("Project Created", `New project ${prjId} has been created successfully!`, "success");

    if (validProjectNames.length > 0) {
      setCustomSavedProjectNames((prev) => {
        const updated = Array.from(new Set([...prev, ...validProjectNames]));
        try {
          localStorage.setItem("celeris_custom_project_names", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save custom project names:", e);
        }
        return updated;
      });

      // Persist new project name(s) directly to Database via /api/projects
      validProjectNames.forEach((prjName) => {
        const trimmed = prjName.trim();
        if (!trimmed) return;

        const payload = {
          CM_Project_Name: trimmed,
          CM_Company_ID: "1",
          CM_Project_Leader_ID: "1",
          CM_Project_Customer: createdData.clientName,
          CM_Project_Customer_Phone: createdData.clientPhone,
          CM_Customer_Address: "",
          CM_Estimated_Cost: totalCost / (validProjectNames.length || 1),
          CM_Status: "Active",
          CM_Project_Status: "Planning"
        };

        // Save to dedicated ccms_project_names database table
        fetch("/api/project-names", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        }).catch((e) => { });

        fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              // Re-fetch project list from DB so new custom project is available globally
              fetch("/api/projects")
                .then((r) => (r.ok ? r.json() : []))
                .then((dbData) => {
                  if (Array.isArray(dbData)) setDbProjects(dbData);
                })
                .catch((e) => { });
            }
          })
          .catch((err) => console.log("DB project insert notice:", err));
      });
    }

    setIsCreateModalOpen(false);
    setNewProjectInput({
      salutation: "Mr.",
      clientName: "",
      companyName: "",
      phone: "",
      totalCost: "",
      proposalGiven: "No",
      projectNames: [""]
    });
  };

  const handleCreateNewInvoiceForProject = (prj) => {
    if (getProposalGivenState(prj) === "No") {
      showToast("Proposal Not Issued", "Cannot create invoice because '1. Proposal Issued?' is set to 'No (Not Given)'. Please change to 'Yes' on the project card first.", "warning");
      return;
    }

    if (getProjectStatusState(prj) === "Rejected") {
      showToast("Project Marked Rejected", "Cannot create invoice because this project proposal was marked as 'Rejected' by the client. Change project status to 'Active' or 'Accepted' to generate invoices.", "warning");
      return;
    }

    const history = prj.fullData?.proposalHistory || [];
    const priorBilled = history.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const totalCost = Number(prj.totalCost) || 0;

    if (totalCost > 0 && priorBilled >= totalCost) {
      showToast("Project Fully Billed", `Cannot create new invoice! Total project cost (₹${totalCost.toLocaleString("en-IN")}) has already been fully billed.`, "warning");
      return;
    }

    const remaining = Math.max(0, totalCost - priorBilled);
    const nextProposalNo = history.length + 1;
    const currentDateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
    const nextInvoiceNo = generateNextInvoiceNo(invoiceProjects, currentDateStr);

    // Carry over items from the previous invoice, scaling amounts from the remaining balance
    const prevItems = prj.fullData?.items || [];
    let generatedItems;
    if (prevItems.length > 0) {
      // Calculate previous total (excl. tax) to derive each item's weight
      const prevTotal = prevItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
      const remainingExTax = Number((remaining / 1.18).toFixed(2));
      generatedItems = prevItems.map((item, idx) => {
        // Distribute remaining amount proportionally based on each item's share in the previous invoice
        const weight = prevTotal > 0 ? (Number(item.amount) || 0) / prevTotal : 1 / prevItems.length;
        return {
          id: idx + 1,
          description: item.description,
          hsnSac: item.hsnSac || "9983",
          amount: Number((remainingExTax * weight).toFixed(2)),
        };
      });
    } else {
      // Fallback: single item with project name
      const defaultItemDesc = prj.projectName || prj.companyName || prj.clientName || "Project Application";
      generatedItems = [
        {
          id: 1,
          description: `${defaultItemDesc} (Phase ${nextProposalNo})`,
          hsnSac: "9983",
          amount: Number((remaining / 1.18).toFixed(2)),
        },
      ];
    }

    const newInvoiceDraft = {
      ...(prj.fullData || {}),
      proposalGiven: "Yes",
      salutation: prj.salutation,
      clientName: prj.clientName,
      clientCompany: prj.companyName,
      clientPhone: prj.phone,
      totalProjectCost: totalCost,
      proposalNo: nextProposalNo,
      invoiceNo: nextInvoiceNo,
      invoiceDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
      dueDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
      advanceDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
      paymentStage: "",
      costBreakdownNote: "",
      proposalHistory: history,
      items: generatedItems,
    };

    setSelectedProject({
      ...prj,
      fullData: newInvoiceDraft,
    });
    setIsModalOpen(true);
  };

  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

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

  const handleDeleteInvoiceProject = (id, e) => {
    e.stopPropagation();
    const prj = invoiceProjects.find((p) => p.id === id);
    const prjTitle = prj ? `${prj.salutation || ''} ${prj.clientName || 'Project'}`.trim() : 'this project';

    setDeleteConfirmState({
      isOpen: true,
      title: "Delete Project",
      message: `Are you sure you want to delete "${prjTitle}"? All associated invoices and billing history for this project will be permanently removed.`,
      onConfirm: async () => {
        try {
          await fetch(`/api/standalone-invoices?id=${id}`, { method: 'DELETE' });
          setInvoiceProjects((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
          console.error("Failed to delete from database:", err);
          showToast("Error", "Failed to delete project.", "error");
        }
      },
    });
  };

  const handleOpenModal = (project = null) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const [toast, setToast] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });

  const showToast = (title, message = "", type = "success") => {
    setToast({ show: true, title, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");

  const getPendingBalance = (p) => {
    const history = p.fullData?.proposalHistory || [];
    const totalBilled = history.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const totalCost = Number(p.totalCost) || 0;
    return Math.max(0, totalCost - totalBilled);
  };

  const getProposalGivenState = (p) => {
    if (p.proposalGiven === "No" || p.proposalGiven === "No_Rejected") {
      return "No";
    }
    if (p.proposalGiven === "Yes" || p.proposalGiven === "Accepted" || p.proposalGiven === "Rejected") {
      return "Yes";
    }
    if (Boolean(p.fullData?.savedProposal)) {
      return "Yes";
    }
    return "No";
  };

  const getProjectStatusState = (p) => {
    if (p.projectStatus) return p.projectStatus;
    if (p.proposalGiven === "Accepted") return "Accepted";
    if (p.proposalGiven === "Rejected" || p.proposalGiven === "No_Rejected") return "Rejected";
    return "Active";
  };

  const handleProposalGivenChange = async (projectId, newVal) => {
    let updatedProject = null;
    setInvoiceProjects((prev) => {
      return prev.map((p) => {
        if (p.id === projectId) {
          const currentStatus = getProjectStatusState(p);
          let legacyProp = newVal;
          if (newVal === "Yes") {
            if (currentStatus === "Accepted") legacyProp = "Accepted";
            else if (currentStatus === "Rejected") legacyProp = "Rejected";
            else legacyProp = "Yes";
          } else {
            if (currentStatus === "Rejected") legacyProp = "No_Rejected";
            else legacyProp = "No";
          }
          const updatedFull = { ...(p.fullData || {}), proposalGiven: legacyProp, projectStatus: currentStatus };
          updatedProject = { ...p, proposalGiven: legacyProp, projectStatus: currentStatus, fullData: updatedFull };
          return updatedProject;
        }
        return p;
      });
    });
    
    if (updatedProject) {
      try {
        await fetch("/api/standalone-invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProject)
        });
      } catch (err) {
        console.error("Failed to update proposalGiven in DB:", err);
      }
    }
    showToast("Proposal Status Updated", `Proposal delivery set to ${newVal === "Yes" ? "Issued (Given)" : "Not Issued"}.`, "info");
  };

  const handleProjectStatusChange = async (projectId, newStatus) => {
    let updatedProject = null;
    setInvoiceProjects((prev) => {
      return prev.map((p) => {
        if (p.id === projectId) {
          const isPropGiven = getProposalGivenState(p) === "Yes";
          let legacyProp = "No";
          if (newStatus === "Accepted") {
            legacyProp = "Accepted";
          } else if (newStatus === "Rejected") {
            legacyProp = isPropGiven ? "Rejected" : "No_Rejected";
          } else {
            legacyProp = isPropGiven ? "Yes" : "No";
          }
          const updatedFull = { ...(p.fullData || {}), proposalGiven: legacyProp, projectStatus: newStatus };
          updatedProject = { ...p, proposalGiven: legacyProp, projectStatus: newStatus, fullData: updatedFull };
          return updatedProject;
        }
        return p;
      });
    });

    if (updatedProject) {
      try {
        await fetch("/api/standalone-invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProject)
        });
      } catch (err) {
        console.error("Failed to update projectStatus in DB:", err);
      }
    }
    showToast(
      "Project Status Updated",
      `Project status updated to ${newStatus}.`,
      newStatus === "Accepted" ? "success" : newStatus === "Rejected" ? "error" : "info"
    );
  };

  const counts = {
    all: invoiceProjects.length,
    project_created: invoiceProjects.filter((p) => getProposalGivenState(p) === "No").length,
    proposal_created: invoiceProjects.filter((p) => getProposalGivenState(p) === "Yes").length,
    active: invoiceProjects.filter((p) => getProjectStatusState(p) === "Active").length,
    accepted: invoiceProjects.filter((p) => getProjectStatusState(p) === "Accepted").length,
    rejected: invoiceProjects.filter((p) => getProjectStatusState(p) === "Rejected").length,
    fully_paid: invoiceProjects.filter((p) => getProjectStatusState(p) !== "Rejected" && getPendingBalance(p) === 0 && (Number(p.totalCost) || 0) > 0).length,
    pending: invoiceProjects.filter((p) => getProjectStatusState(p) !== "Rejected" && getPendingBalance(p) > 0).length,
  };

  const filteredProjects = invoiceProjects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (p.clientName || "").toLowerCase().includes(q) ||
      (p.companyName || "").toLowerCase().includes(q) ||
      (p.phone || "").includes(q) ||
      (p.id || "").toLowerCase().includes(q) ||
      (p.projectName || (p.projectNames || []).join(" ")).toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const pendingBal = getPendingBalance(p);
    const cost = Number(p.totalCost) || 0;
    const isPropGiven = getProposalGivenState(p) === "Yes";
    const projStatus = getProjectStatusState(p);
    const isProjRejected = projStatus === "Rejected";

    if (filterTab === "project_created") {
      return !isPropGiven;
    }
    if (filterTab === "proposal_created") {
      return isPropGiven;
    }
    if (filterTab === "active") {
      return projStatus === "Active";
    }
    if (filterTab === "accepted") {
      return projStatus === "Accepted";
    }
    if (filterTab === "rejected") {
      return isProjRejected;
    }
    if (filterTab === "fully_paid") {
      return !isProjRejected && pendingBal === 0 && cost > 0;
    }
    if (filterTab === "pending") {
      return !isProjRejected && pendingBal > 0;
    }

    return true;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Navbar />

      <div className="flex-1 overflow-y-auto">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Project Invoices & Client History</h1>
              <p className="text-sm text-slate-500 mt-1">
                Create N number of client invoice projects and inspect full billing history.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Create Project</span>
            </button>
          </div>

          {/* Search & Status Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-xs">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                name="search_project_query"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client, company, phone, ID..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium text-slate-900"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Executive Filter Dropdown Menu */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-300 shadow-2xs hover:border-slate-400 transition-all">
                <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Filter By:
                </span>
                <select
                  value={filterTab}
                  onChange={(e) => setFilterTab(e.target.value)}
                  className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer font-sans pr-2"
                >
                  <option value="all">🌐 All Projects ({counts.all})</option>
                  <option value="project_created">📄 Proposal Not Given ({counts.project_created})</option>
                  <option value="proposal_created">📄 Proposal Given ({counts.proposal_created})</option>
                  <option value="active">⏳ Active / In Review ({counts.active})</option>
                  <option value="accepted">✅ Accepted ({counts.accepted})</option>
                  <option value="rejected">🚫 Rejected ({counts.rejected})</option>
                  <option value="fully_paid">💰 Fully Paid ({counts.fully_paid})</option>
                  <option value="pending">⏳ Pending Balance ({counts.pending})</option>
                </select>
              </div>

              {filterTab !== "all" && (
                <button
                  onClick={() => setFilterTab("all")}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-2 rounded-xl transition flex items-center gap-1 border border-slate-200"
                  title="Reset Filter to All Projects"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Project Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                Your Clients & Invoice History ({filteredProjects.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create New Card */}
              <div
                onClick={() => setIsCreateModalOpen(true)}
                className="cursor-pointer bg-white p-6 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-600 hover:bg-blue-50/40 transition-all flex flex-col items-center justify-center text-center min-h-[220px] group shadow-xs"
              >
                <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-600 text-blue-600 group-hover:text-white rounded-full flex items-center justify-center transition-all mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  + Add New Client Project
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                  Create client records, specify cost details & generate instant PDF proposals.
                </p>
              </div>

              {/* List of Created Invoice Projects */}
              {filteredProjects.map((prj, prjIdx) => {
                const history = prj.fullData?.proposalHistory || [];
                const totalBilled = history.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
                const totalCost = Number(prj.totalCost) || 0;
                const pendingBalance = Math.max(0, totalCost - totalBilled);
                const isPaid = totalCost > 0 && pendingBalance === 0;

                const clientInitial = (prj.clientName || "C").trim().charAt(0).toUpperCase();
                const hasProposalGiven = getProposalGivenState(prj) === "Yes";
                const projStatus = getProjectStatusState(prj);
                const isRejected = projStatus === "Rejected";

                return (
                  <div
                    key={prj.id ? `${prj.id}-${prjIdx}` : prjIdx}
                    className={`bg-white p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between group relative ${
                      isRejected
                        ? "border-red-200 bg-gradient-to-b from-red-50/20 via-white to-white shadow-xs"
                        : "border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1"
                    }`}
                  >
                    <div>
                      {/* Top Bar: Project ID, Proposal Delivered Badge & Outcome Badge */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-extrabold rounded-xl border border-indigo-100 uppercase tracking-wider">
                            PROJECT #{prj.id.replace("INV-PRJ-", "").replace("INV-", "")}
                          </span>

                          {/* Explicit Proposal Delivery Badge */}
                          {hasProposalGiven ? (
                            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200 flex items-center gap-1">
                              📄 Proposal Given
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-lg border border-slate-200 flex items-center gap-1">
                              📄 Proposal Not Given
                            </span>
                          )}

                          {/* Outcome Badges */}
                          {projStatus === "Accepted" && (
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-300 uppercase tracking-wider flex items-center gap-1">
                              ✅ Accepted
                            </span>
                          )}
                          {projStatus === "Rejected" && (
                            <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded-lg border border-red-300 uppercase tracking-wider flex items-center gap-1">
                              🚫 Rejected
                            </span>
                          )}
                          {projStatus === "Active" && (
                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200 uppercase tracking-wider flex items-center gap-1">
                              ⏳ Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-semibold">{prj.date}</span>
                          <button
                            onClick={(e) => handleDeleteInvoiceProject(prj.id, e)}
                            title="Delete Invoice Project"
                            className="text-slate-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Client Profile Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-2xl font-black flex items-center justify-center text-sm shadow-sm flex-shrink-0 ${
                          isRejected
                            ? "bg-gradient-to-br from-red-500 to-rose-700 text-white"
                            : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                        }`}>
                          {clientInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {prj.salutation} {prj.clientName}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 truncate">{prj.companyName || "No Company Specified"}</p>
                        </div>
                      </div>

                      {/* Project Name Badge */}
                      {(prj.projectName || (prj.projectNames && prj.projectNames.length > 0)) && (
                        <div className="mb-4">
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-xl border inline-block truncate max-w-full ${
                            isRejected
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-indigo-50/90 text-indigo-700 border-indigo-100"
                          }`}>
                            🏷️ {prj.projectName || prj.projectNames.join(", ")}
                          </span>
                        </div>
                      )}

                      {/* Financial Metrics Card Box */}
                      <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50/90 p-4 rounded-2xl border border-slate-100 mb-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">Phone:</span>
                          <span className="font-bold text-slate-800">{prj.phone}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Project Cost</span>
                            <span className="text-sm font-extrabold text-slate-900">₹{totalCost.toLocaleString("en-IN")}</span>
                          </div>
                          <div className={`p-2.5 rounded-xl border ${isPaid ? "bg-emerald-50/80 border-emerald-200 text-emerald-800" : "bg-amber-50/80 border-amber-200 text-amber-800"}`}>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Pending Bal</span>
                            <span className="text-sm font-extrabold">₹{pendingBalance.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Two Distinct Dropdowns: Proposal Issued & Project Status */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                          {/* Dropdown 1: Proposal Issued */}
                          <div>
                            <label className="text-[10px] text-slate-500 font-extrabold block mb-1 uppercase tracking-wider">
                              1. Proposal Issued?
                            </label>
                            <select
                              value={hasProposalGiven ? "Yes" : "No"}
                              onChange={(e) => handleProposalGivenChange(prj.id, e.target.value)}
                              className={`w-full text-xs font-bold rounded-xl px-2 py-1.5 border outline-none cursor-pointer transition ${
                                hasProposalGiven
                                  ? "bg-blue-50 text-blue-700 border-blue-300 focus:ring-2 focus:ring-blue-400"
                                  : "bg-slate-100 text-slate-600 border-slate-300 focus:ring-2 focus:ring-slate-400"
                              }`}
                            >
                              <option value="No">📄 No (Not Given)</option>
                              <option value="Yes">📄 Yes (Given)</option>
                            </select>
                          </div>

                          {/* Dropdown 2: Project Status */}
                          <div>
                            <label className="text-[10px] text-slate-500 font-extrabold block mb-1 uppercase tracking-wider">
                              2. Project Status
                            </label>
                            <select
                              value={projStatus}
                              onChange={(e) => handleProjectStatusChange(prj.id, e.target.value)}
                              className={`w-full text-xs font-bold rounded-xl px-2 py-1.5 border outline-none cursor-pointer transition ${
                                projStatus === "Accepted"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-2 focus:ring-emerald-400"
                                  : projStatus === "Rejected"
                                  ? "bg-red-50 text-red-700 border-red-300 font-black focus:ring-2 focus:ring-red-400"
                                  : "bg-amber-50 text-amber-700 border-amber-300 focus:ring-2 focus:ring-amber-400"
                              }`}
                            >
                              <option value="Active">⏳ Active (In Review)</option>
                              <option value="Accepted">✅ Accepted</option>
                              <option value="Rejected">🚫 Rejected</option>
                            </select>
                          </div>
                        </div>
                      </div>

                        {/* Invoices Log */}
                        <div className="mt-2 pt-2 border-t border-slate-200/60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                              INVOICES ({history.length})
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateNewInvoiceForProject(prj);
                                }}
                                disabled={isRejected}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                                  isRejected
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : "text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border-blue-200"
                                }`}
                              >
                                + Invoice #{history.length + 1}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProposalProject(prj);
                                  setIsProposalModalOpen(true);
                                }}
                                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition flex items-center gap-1"
                              >
                                📄 Proposal
                              </button>
                            </div>
                          </div>

                          {history.length > 0 && (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {history.map((hist, hIdx) => (
                                <div
                                  key={hIdx}
                                  className="flex items-center justify-between p-2 bg-white rounded-xl border border-indigo-100 text-[11px] shadow-2xs hover:border-indigo-300 transition"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800">
                                      Invoice #{hist.proposalNo} ({hist.invoiceNo})
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">{hist.date}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-indigo-600 mr-1">₹{Number(hist.amount).toLocaleString("en-IN")}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenModal({
                                          ...prj,
                                          fullData: {
                                            ...prj.fullData,
                                            proposalNo: hist.proposalNo,
                                            invoiceNo: hist.invoiceNo,
                                          }
                                        });
                                      }}
                                      title="View Invoice"
                                      className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenModal({
                                          ...prj,
                                          fullData: {
                                            ...prj.fullData,
                                            proposalNo: hist.proposalNo,
                                            invoiceNo: hist.invoiceNo,
                                          }
                                        });
                                      }}
                                      title="Edit Invoice"
                                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmState({
                                          isOpen: true,
                                          title: `Delete Invoice #${hist.proposalNo}`,
                                          message: `Are you sure you want to delete Invoice #${hist.proposalNo} (${hist.invoiceNo})? This action cannot be undone.`,
                                          onConfirm: () => {
                                            const updatedHistory = (prj.fullData?.proposalHistory || []).filter((p) => p.proposalNo !== hist.proposalNo);
                                            const updatedFullData = {
                                              ...prj.fullData,
                                              proposalHistory: updatedHistory,
                                            };
                                            handleSaveInvoiceData(updatedFullData);
                                          },
                                        });
                                      }}
                                      title="Delete Invoice"
                                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Full-Width CTA */}
                      <button
                      onClick={() => {
                        if (!hasProposalGiven) {
                          showToast("Proposal Not Issued", "Cannot create or open invoices because '1. Proposal Issued?' is set to 'No (Not Given)'. Please change to 'Yes' on the project card first.", "warning");
                          return;
                        }
                        if (isRejected) {
                          showToast("Project Marked Rejected", "Cannot create or open invoices because Project Status is set to 'Rejected'. Change status to 'Active' or 'Accepted' to enable billing.", "warning");
                          return;
                        }
                        handleOpenModal(prj);
                      }}
                      className={`w-full font-bold py-3 px-4 rounded-2xl text-xs transition-all duration-200 shadow-sm flex items-center justify-center gap-2 ${
                        isRejected
                          ? "bg-red-50 text-red-700 border border-red-300 cursor-not-allowed font-bold"
                          : hasProposalGiven
                          ? "bg-slate-900 hover:bg-indigo-950 text-white cursor-pointer shadow-md hover:shadow-lg"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {isRejected ? (
                        <>
                          <span>🚫 Project Rejected</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>
                            {!hasProposalGiven
                              ? "Proposal Not Given"
                              : (prj.fullData?.proposalHistory || []).length > 0
                              ? "Open / Edit Latest Invoice"
                              : "Create Invoice #1"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Clean Create Project Dialog Modal (Collecting ONLY 4 fields) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Create New Project Invoice</h3>
                <p className="text-xs text-slate-400">Enter project & client details below</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewProjectSubmit} className="p-6 space-y-4 text-xs">
              {/* Client Name & Salutation */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Client Name *</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={newProjectInput.salutation}
                    onChange={(e) => setNewProjectInput((prev) => ({ ...prev, salutation: e.target.value }))}
                    className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="M/s.">M/s.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Er.">Er.</option>
                    <option value="Shri">Shri</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={newProjectInput.clientName}
                    onChange={(e) => setNewProjectInput((prev) => ({ ...prev, clientName: e.target.value }))}
                    placeholder="e.g. Srinivas"
                    className="col-span-2 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company Name</label>
                <input
                  type="text"
                  value={newProjectInput.companyName}
                  onChange={(e) => setNewProjectInput((prev) => ({ ...prev, companyName: e.target.value }))}
                  placeholder="e.g. Surya Hospital"
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-white"
                />
              </div>

              {/* Preferred Project Name(s) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold">Preferred Project Name(s)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewProjectInput((prev) => ({
                        ...prev,
                        projectNames: [...(prev.projectNames || [""]), ""]
                      }))
                    }
                    className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-1 transition"
                  >
                    + Add Another Project
                  </button>
                </div>

                <div className="space-y-2">
                  {(newProjectInput.projectNames || [""]).map((pName, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={pName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...(newProjectInput.projectNames || [""])];
                          updated[index] = val;

                          // Auto-fill details if matching a DB project
                          const matchedDbPrj = dbProjects.find(
                            (p) => (p.CM_Project_Name || p.project_name || p.name) === val
                          );
                          if (matchedDbPrj) {
                            setNewProjectInput((prev) => ({
                              ...prev,
                              clientName: prev.clientName || matchedDbPrj.CM_Project_Customer || matchedDbPrj.CM_Customer_Name || "",
                              companyName: prev.companyName || matchedDbPrj.CM_Project_Name || matchedDbPrj.CM_Company_Name || "",
                              phone: prev.phone || matchedDbPrj.CM_Project_Customer_Phone || matchedDbPrj.CM_Phone_Number || "",
                              totalCost: prev.totalCost || matchedDbPrj.CM_Estimated_Cost || matchedDbPrj.estimated_cost || "",
                            }));
                          }

                          setNewProjectInput((prev) => ({ ...prev, projectNames: updated }));
                        }}
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs cursor-pointer"
                      >
                        <option value="" disabled>-- Select Project Name --</option>
                        {allDynamicProjectNames.map((name, nIdx) => (
                          <option key={nIdx} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      {(newProjectInput.projectNames || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (newProjectInput.projectNames || []).filter((_, i) => i !== index);
                            setNewProjectInput((prev) => ({ ...prev, projectNames: updated }));
                          }}
                          className="px-2.5 py-2.5 text-slate-400 hover:text-red-600 font-bold transition rounded-xl hover:bg-red-50 text-sm border border-slate-200"
                          title="Remove Project Name"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Separate Dedicated Field & Save Button to persist new Project Name to DB */}
                <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                      + Save New Project Template Name To Database
                    </label>
                    {nameSavedSuccess && (
                      <span className="text-[10px] font-bold text-emerald-600 animate-in fade-in flex items-center gap-1">
                        ✓ Saved to Database!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newProjectNameField}
                      onChange={(e) => setNewProjectNameField(e.target.value)}
                      placeholder="Type new project name (e.g. Hospital Management)..."
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      disabled={!newProjectNameField.trim() || isSavingName}
                      onClick={() => {
                        const trimmed = newProjectNameField.trim();
                        if (!trimmed) return;
                        setIsSavingName(true);

                        fetch("/api/project-names", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: trimmed }),
                        })
                          .then((res) => (res.ok ? res.json() : null))
                          .then((data) => {
                            setIsSavingName(false);
                            if (data && data.success) {
                              setCustomSavedProjectNames((prev) => Array.from(new Set([...prev, trimmed])));
                              // Auto select newly saved name into current projectNames
                              setNewProjectInput((prev) => {
                                const updated = [...(prev.projectNames || [""])];
                                if (!updated[0] || updated[0] === "") {
                                  updated[0] = trimmed;
                                } else {
                                  updated.push(trimmed);
                                }
                                return { ...prev, projectNames: updated };
                              });
                              setNewProjectNameField("");
                              setNameSavedSuccess(true);
                              setTimeout(() => setNameSavedSuccess(false), 3000);
                            }
                          })
                          .catch((err) => {
                            setIsSavingName(false);
                            console.error("Error saving new project name:", err);
                          });
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition flex items-center gap-1 shadow-xs ${!newProjectNameField.trim() || isSavingName
                          ? "bg-slate-300 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                        }`}
                    >
                      {isSavingName ? "Saving..." : "Save Name"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newProjectInput.phone}
                  onChange={(e) => setNewProjectInput((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +91 70101 10485"
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-white"
                />
              </div>

              {/* Total Project Cost */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Total Project Cost (₹) *</label>
                <input
                  type="number"
                  required
                  value={newProjectInput.totalCost}
                  onChange={(e) => setNewProjectInput((prev) => ({ ...prev, totalCost: e.target.value }))}
                  placeholder="e.g. 40000"
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600 bg-white text-sm"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render Dynamic Invoice Editor Modal */}
      <ProjectInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInvoiceData}
        initialData={selectedProject?.fullData ? selectedProject.fullData : selectedProject ? {
          salutation: selectedProject.salutation,
          clientName: selectedProject.clientName,
          clientCompany: selectedProject.companyName,
          clientPhone: selectedProject.phone,
          estimated_cost: selectedProject.totalCost,
          proposalGiven: selectedProject.proposalGiven,
        } : {}}
      />

      {/* Custom Password-Protected Delete Confirmation Modal */}
      {deleteConfirmState.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 text-center p-6 space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-2xs">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
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
                  name="security_delete_password_field"
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
                  {showDeletePassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.046 10.046 0 014.122-.963c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-6.165-4.409a3 3 0 004.243 4.243M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
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

      {/* ── Proposal Modal ── */}
      <ProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => { setIsProposalModalOpen(false); setProposalProject(null); }}
        onSave={(data) => {
          setInvoiceProjects((prev) => {
            const targetId = proposalProject?.id;
            const existingIdx = prev.findIndex((p) => p.id === targetId);
            let newList = [...prev];

            if (existingIdx >= 0) {
              newList[existingIdx] = {
                ...newList[existingIdx],
                proposalGiven: "Yes",
                status: "Proposal Saved",
                fullData: {
                  ...newList[existingIdx].fullData,
                  savedProposal: data
                }
              };
            } else {
              const newId = `PRJ-${String(prev.length + 1).padStart(2, "0")}`;
              const newRecord = {
                id: newId,
                clientName: data.clientName || "Client",
                companyName: data.clientCompany || "Company",
                phone: data.companyPhone || "Phone",
                totalCost: (Number(data.devCost) || 0) + (Number(data.serverChargePerYear) || 0),
                proposalGiven: "Yes",
                status: "Proposal Saved",
                date: data.proposalDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
                fullData: {
                  savedProposal: data
                }
              };
              newList = [newRecord, ...prev];
            }

            try {
              localStorage.setItem("celeris_project_invoices", JSON.stringify(newList));
            } catch (e) {
              console.error("Failed to save proposal to localStorage:", e);
            }
            return newList;
          });

          showToast("Proposal Saved Successfully", "Client proposal document has been updated and saved!", "success");
          setIsProposalModalOpen(false);
          setProposalProject(null);
        }}
        initialData={proposalProject ? {
          clientName: proposalProject.clientName || "",
          clientCompany: proposalProject.companyName || "",
          clientAddress: proposalProject.fullData?.clientAddress || "",
          ...(proposalProject.fullData?.savedProposal || {})
        } : {}}
      />

      {/* ── Executive Glassmorphic Toast Notification Banner ── */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[99999] max-w-sm w-full animate-in fade-in slide-in-from-top-6 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-3.5 transition-all ${
              toast.type === "success"
                ? "bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-950/30"
                : toast.type === "error" || toast.type === "warning"
                ? "bg-slate-900/95 text-white border-rose-500/40 shadow-rose-950/30"
                : "bg-slate-900/95 text-white border-indigo-500/40 shadow-indigo-950/30"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black ${
                toast.type === "success"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : toast.type === "error" || toast.type === "warning"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
              }`}
            >
              {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "⚠️"}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="text-xs font-black tracking-wide uppercase text-slate-100">
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-xs text-slate-300 mt-0.5 font-medium leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => setToast({ ...toast, show: false })}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
