import React, { forwardRef } from "react";

const DEFAULT_INTRO = `Celeris Solutions is pleased to present this proposal for a comprehensive E-Commerce & Billing Web Application, designed to integrate online sales, billing, product management, inventory management, customer management, payment tracking, and reporting into a single centralized application. The proposed system combines a modern E-Commerce Platform with an integrated Billing and Inventory Management System, allowing the business to manage both online and offline sales operations from one application. The application will provide a seamless shopping experience for customers while giving administrators complete control over products, categories, pricing, stock, orders, billing, payments, customers, and business reports. The system will support online product browsing, shopping cart and checkout, order processing, invoice generation, cash/UPI/card payments, credit billing, outstanding tracking, inventory movement, and centralized reporting. The objective of the proposed application is to provide a Reliable, User-Friendly, Secure, and Scalable Business Management System that reduces manual work, minimizes billing and inventory errors, improves operational efficiency, and supports the business's online and offline sales requirements.`;

const DEFAULT_CONCLUSION = `Celeris Solutions is committed to delivering a secure, reliable, scalable, and efficient E-Commerce & Billing Web Application that brings the client's online and offline sales operations together in one centralized system. The proposed solution will enable the business to manage products, inventory, customers, online orders, billing, payments, invoices, outstanding amounts, and business reports through a single application. By integrating E-Commerce and Billing into one platform, the system will reduce duplicate data entry, improve stock accuracy, simplify billing operations, provide better visibility into sales performance, and deliver a seamless experience for both customers and business users. The proposed application is designed to be user-friendly, secure, scalable, and suitable for day-to-day business operations, while providing a strong foundation for future expansion. We at Celeris Solutions look forward to partnering with you and supporting your business with a powerful and practical E-Commerce & Billing Solution.`;

/* ─── Shared Letterhead Header Component ─── */
const LetterheadHeader = () => (
  <div className="flex justify-between items-center mb-4 pb-1 w-full">
    {/* Header Left: 5 Faint Speed Lines + Logo + Corporate Wordmark */}
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <svg className="w-5 h-10 flex-shrink-0 overflow-visible" viewBox="0 0 20 40">
        <defs>
          <linearGradient id="propFadeLeftLines" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <line x1="0" y1="4" x2="18" y2="4" stroke="url(#propFadeLeftLines)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="0" y1="12" x2="18" y2="12" stroke="url(#propFadeLeftLines)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="0" y1="20" x2="18" y2="20" stroke="url(#propFadeLeftLines)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="0" y1="28" x2="18" y2="28" stroke="url(#propFadeLeftLines)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="0" y1="36" x2="18" y2="36" stroke="url(#propFadeLeftLines)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <img src="/logo.png" alt="Celeris Solutions Logo" className="h-12 w-auto object-contain flex-shrink-0" />

      {/* SVG Corporate Wordmark */}
      <svg width="225" height="38" viewBox="0 0 225 38" className="overflow-visible flex-shrink-0 ml-0.5">
        <defs>
          <filter id="propCorporateShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="0.7" floodColor="#3b0012" floodOpacity="0.5" />
          </filter>
        </defs>

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
          filter="url(#propCorporateShadow)"
        >
          CELERIS SOLUTIONS
        </text>

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
          CELERIS SOLUTIONS
        </text>
      </svg>
    </div>

    {/* Header Right: Parallel Horizontal Grey Lines */}
    <svg className="flex-1 ml-4 h-10 overflow-visible min-w-[120px]" viewBox="0 0 240 40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="propFadeRightBar" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#64748b" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#94a3b8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <line x1="0" y1="4" x2="240" y2="4" stroke="url(#propFadeRightBar)" strokeWidth="1.5" />
      <line x1="0" y1="9" x2="240" y2="9" stroke="url(#propFadeRightBar)" strokeWidth="1.5" />
      <line x1="0" y1="14" x2="240" y2="14" stroke="url(#propFadeRightBar)" strokeWidth="1.5" />
      <line x1="0" y1="19" x2="240" y2="19" stroke="url(#propFadeRightBar)" strokeWidth="1.5" />
      <line x1="0" y1="24" x2="240" y2="24" stroke="url(#propFadeRightBar)" strokeWidth="1.5" />
      <line x1="0" y1="29" x2="240" y2="29" stroke="url(#propFadeRightBar)" strokeWidth="1.5" />
      <line x1="0" y1="34" x2="240" y2="34" stroke="url(#propFadeRightBar)" strokeWidth="1.5" />
    </svg>
  </div>
);

/* ─── Shared Letterhead Footer Component ─── */
const LetterheadFooter = ({ pageNum, totalPages }) => (
  <div className="mt-6 pt-3 flex justify-between items-end border-t border-transparent relative z-10 w-full">
    {/* Bottom Left: Phone & Address */}
    <div className="space-y-2 text-gray-800">
      <div className="flex items-center gap-2.5">
        <svg className="w-5 h-5 text-[#475569] fill-current" viewBox="0 0 24 24">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
        <span className="text-[18px] font-black text-gray-900 tracking-wider font-sans">99403 56707</span>
      </div>
      <div className="flex items-start gap-2.5">
        <svg className="w-5 h-5 text-[#475569] fill-current mt-0.5 shrink-0" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        <div className="text-[13px] font-extrabold text-gray-800 leading-tight">
          #25, Sathasivam Street,<br />Gobichettipalayam - 638 452.
        </div>
      </div>
    </div>

    {/* Bottom Right: Stepped horizontal lines + Page Number */}
    <div className="flex-1 ml-6 flex flex-col items-end gap-[3px] mb-1">
      {pageNum && (
        <div className="text-right text-[#2b579a] text-[12px] font-bold tracking-widest mb-1">
          P a g e &nbsp;{pageNum} | {totalPages || 5}
        </div>
      )}
      <div className="h-[2px] bg-[#94a3b8] w-[45%]"></div>
      <div className="h-[2px] bg-[#94a3b8] w-[60%]"></div>
      <div className="h-[2px] bg-[#94a3b8] w-[75%]"></div>
      <div className="h-[2px] bg-[#94a3b8] w-[90%]"></div>
      <div className="h-[2px] bg-[#94a3b8] w-full"></div>
    </div>
  </div>
);

/* ─── Individual Page Wrapper Component (Supports With/Without Template) ─── */
const ProposalPage = ({ children, pageNum, totalPages, showTemplate = true }) => (
  <div
    className="proposal-page bg-white text-gray-900 mx-auto font-sans shadow-sm print:shadow-none print:border-none text-xs sm:text-sm relative overflow-hidden aspect-[210/297] mb-8 print:mb-0"
    style={{
      width: "100%",
      maxWidth: "800px",
      minHeight: "1131px",
      boxSizing: "border-box",
      backgroundColor: "#ffffff",
      lineHeight: "1.5",
      pageBreakAfter: "always"
    }}
  >
    {showTemplate && (
      <>
        {/* Background Watermark */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.07]">
          <img src="/logo.png" alt="Watermark" className="w-[560px] max-w-full h-auto object-contain" />
        </div>

        {/* Left Edge Gray Bar & Orange Ribbon Accent */}
        <div className="absolute left-[18px] top-0 bottom-0 w-[18px] bg-[#c5c9d0] z-0"></div>
        <div
          className="absolute left-[18px] top-[45%] w-[18px] h-72 bg-[#ea580c] z-10"
          style={{ clipPath: 'polygon(0 14%, 100% 0%, 100% 86%, 0 100%)' }}
        ></div>

        {/* Right Edge Gray Bar & Orange Ribbon Accent */}
        <div className="absolute right-[18px] top-0 bottom-0 w-[18px] bg-[#c5c9d0] z-0"></div>
        <div
          className="absolute right-[18px] top-[12%] w-[18px] h-72 bg-[#ea580c] z-10"
          style={{ clipPath: 'polygon(0 0%, 100% 14%, 100% 100%, 0 86%)' }}
        ></div>
      </>
    )}

    {/* Content Wrapper */}
    <div className={`relative z-20 w-full h-full min-h-[1131px] flex flex-col justify-between pt-5 pb-6 box-border ${showTemplate ? 'px-12' : 'px-10'}`}>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {showTemplate ? (
            <LetterheadHeader />
          ) : (
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
              <img src="/logo.png" alt="Celeris Solutions Logo" className="h-10 w-auto object-contain" />
              <div className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Celeris Solutions
              </div>
            </div>
          )}
          {children}
        </div>

        {showTemplate ? (
          <LetterheadFooter pageNum={pageNum} totalPages={totalPages} />
        ) : (
          <div className="mt-6 pt-3 flex justify-between items-center border-t border-gray-200 text-xs text-gray-500 font-medium">
            <span>Celeris Solutions</span>
            {pageNum && (
              <span className="font-bold text-[#2b579a]">
                Page {pageNum} of {totalPages || 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

const ProposalTemplate = forwardRef(({ proposalData }, ref) => {
  if (!proposalData) return null;

  const {
    clientName = "",
    clientCompany = "",
    clientAddress = "",
    proposalDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(),
    companyName = "Celeris Solutions",
    companyCity = "Hosur",
    companyGstin = "33AAVFC1276D1ZI",
    companyEmail = "prabakar@celerissolutions.in",
    companyPhone = "9597979111",
    proposalTitle = "Proposal for e-Commerce Web Application",
    introduction = DEFAULT_INTRO,
    devCost = 50000,
    serverChargePerYear = 3000,
    amcAmount = 5084.75,
    milestones = [
      { label: "Project Kick-Off", percent: 30 },
      { label: "On Pilot Release", percent: 35 },
      { label: "On Go-Live", percent: 35 },
    ],
    adminModuleFeatures = [],
    ecommerceFeatures = [],
    inventoryFeatures = [],
    reportsFeatures = [],
    userModuleFeatures = [],
    devScope = [],
    outOfScope = [],
    conclusion = DEFAULT_CONCLUSION,
    clientAuthName = "",
    clientAuthDesignation = "",
    clientAuthCompany = "",
    tableOfContents = "",
    customSections = [],
    showTemplate = true,
    sectionOrder = [
      "introduction",
      "pricing",
      "adminModuleFeatures",
      "userModuleFeatures",
      "devScope",
      "outOfScope",
      ...(proposalData.customSections || []).map((s) => s.id),
      "conclusion",
    ],
  } = proposalData;

  const cgstRate = 9;
  const sgstRate = 9;

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // One-time calculations
  const devNum = Number(devCost) || 0;
  const devCgst = +((devNum * cgstRate) / 100).toFixed(2);
  const devSgst = +((devNum * sgstRate) / 100).toFixed(2);
  const devTotal = devNum + devCgst + devSgst;

  const serverNum = Number(serverChargePerYear) || 0;
  const serverCgst = +((serverNum * cgstRate) / 100).toFixed(2);
  const serverSgst = +((serverNum * sgstRate) / 100).toFixed(2);
  const serverTotal = serverNum + serverCgst + serverSgst;

  const grandTotal = devTotal + serverTotal;

  // Recurring
  const amcNum = Number(amcAmount) || 0;
  const amcCgst = +((amcNum * cgstRate) / 100).toFixed(2);
  const amcSgst = +((amcNum * sgstRate) / 100).toFixed(2);
  const amcTotal = amcNum + amcCgst + amcSgst;

  // Milestone rows
  const milestoneRows = (milestones || []).map((m, i) => ({
    ...m,
    sno: i + 1,
    amount: +((grandTotal * (Number(m.percent) || 0)) / 100).toFixed(2),
  }));

  const hasToc = Array.isArray(tableOfContents) && tableOfContents.length > 0;
  const customSecList = Array.isArray(customSections) ? customSections : [];

  const SectionHeader = ({ num, title }) => (
    <h2
      style={{
        fontSize: "14px",
        fontWeight: "bold",
        color: "#2b579a",
        marginBottom: "8px",
        marginTop: "12px",
        borderBottom: "1px solid #cbd5e1",
        paddingBottom: "4px"
      }}
    >
      {num}. {title}
    </h2>
  );

  const thStyle = {
    padding: "6px 8px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "bold",
    backgroundColor: "#2b579a",
    color: "#ffffff",
    border: "1px solid #cbd5e1",
  };

  const tdStyle = {
    padding: "6px 8px",
    fontSize: "11px",
    border: "1px solid #e2e8f0",
    color: "#1e293b",
  };

  const FeatureList = ({ features }) =>
    (features || []).map((f, i) => (
      <li
        key={i}
        style={{
          fontSize: "11px",
          color: f.checked ? "#1e293b" : "#94a3b8",
          textDecoration: f.checked ? "none" : "line-through",
          marginBottom: "4px",
          display: "flex",
          gap: "6px",
        }}
      >
        <span>{f.checked ? "•" : "x"}</span>
        <span>{f.label}</span>
      </li>
    ));

  const moduleGroups = proposalData.moduleGroups || [
    { title: "Admin Module", features: adminModuleFeatures },
    { title: "E-Commerce & Billing Module", features: ecommerceFeatures },
    { title: "Inventory & Stock Module", features: inventoryFeatures },
    { title: "Invoice & Reports Module", features: reportsFeatures },
  ];

  const renderCustomSectionItem = (sec, secIdx, numStr) => {
    if (!sec) return null;
    return (
      <section key={sec.id || secIdx} className="mb-6">
        <SectionHeader num={numStr} title={sec.title} />
        {sec.type === "checklist" ? (
          <div>
            {(sec.groups || []).map((group, gi) =>
              group.features && group.features.length > 0 ? (
                <div key={gi} style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "bold", textDecoration: "underline", marginBottom: "4px", color: "#1e293b" }}>
                    {group.title}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "16px", listStyle: "none" }}>
                    <FeatureList features={group.features} />
                  </ul>
                </div>
              ) : null
            )}
          </div>
        ) : (
          <div>
            {sec.groups && sec.groups.length > 0 ? (
              sec.groups.map((group, gi) => (
                <div key={gi} style={{ marginBottom: "12px" }}>
                  {group.title && (
                    <div style={{ fontSize: "11px", fontWeight: "bold", textDecoration: "underline", marginBottom: "4px", color: "#1e293b" }}>
                      {group.title}
                    </div>
                  )}
                  <div
                    className="rich-text-content"
                    style={{ fontSize: "11px", lineHeight: "1.6", color: "#334155" }}
                    dangerouslySetInnerHTML={{ __html: group.content || "" }}
                  />
                </div>
              ))
            ) : (
              <div
                className="rich-text-content"
                style={{ fontSize: "11px", lineHeight: "1.6", color: "#334155" }}
                dangerouslySetInnerHTML={{ __html: sec.content || "" }}
              />
            )}
          </div>
        )}
      </section>
    );
  };

  // Build rendered sections array following sectionOrder
  let sectionCounter = 1;

  const renderSectionByKey = (key, idx) => {
    if (key === "introduction") {
      const numStr = sectionCounter++;
      return (
        <section key={`intro-${idx}`} className="mb-6">
          <SectionHeader num={numStr} title="Introduction" />
          <p style={{ fontSize: "11px", lineHeight: "1.7", color: "#334155", textAlign: "justify" }}>
            {introduction}
          </p>
        </section>
      );
    }

    if (key === "pricing") {
      const numStr = sectionCounter++;
      return (
        <section key={`pricing-${idx}`} className="mb-6">
          <SectionHeader num={numStr} title="Project Quotation" />
          <p style={{ fontSize: "11px", color: "#475569", marginBottom: "8px" }}>
            The cost breakdown for the proposed web application is detailed below:
          </p>

          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#2b579a", marginBottom: "4px" }}>
              A. Software Development Cost (One-Time)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>S.No</th>
                  <th style={thStyle}>Description</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "center" }}>1</td>
                  <td style={tdStyle}>E-Commerce & Billing Web Application Development (Custom Design, Coding, Database Setup)</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(devNum)}</td>
                </tr>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "center" }}>2</td>
                  <td style={tdStyle}>CGST (9%)</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(devCgst)}</td>
                </tr>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "center" }}>3</td>
                  <td style={tdStyle}>SGST (9%)</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(devSgst)}</td>
                </tr>
                <tr style={{ backgroundColor: "#f8fafc", fontWeight: "bold" }}>
                  <td colSpan={2} style={{ ...tdStyle, textAlign: "right" }}>Subtotal (Development Cost)</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: "#2b579a" }}>{fmt(devTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#2b579a", marginBottom: "4px" }}>
              B. Cloud Server & Hosting Charges (Per Year)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>S.No</th>
                  <th style={thStyle}>Description</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "center" }}>1</td>
                  <td style={tdStyle}>Cloud Server, Domain & SSL Certificate (1 Year)</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(serverNum)}</td>
                </tr>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "center" }}>2</td>
                  <td style={tdStyle}>CGST (9%)</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(serverCgst)}</td>
                </tr>
                <tr>
                  <td style={{ ...tdStyle, textAlign: "center" }}>3</td>
                  <td style={tdStyle}>SGST (9%)</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(serverSgst)}</td>
                </tr>
                <tr style={{ backgroundColor: "#f8fafc", fontWeight: "bold" }}>
                  <td colSpan={2} style={{ ...tdStyle, textAlign: "right" }}>Subtotal (Server Charges)</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: "#2b579a" }}>{fmt(serverTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "8px 12px", borderRadius: "4px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#1e3a8a" }}>Total Initial Project Cost (A + B):</span>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a8a" }}>₹ {fmt(grandTotal)}</span>
          </div>

          {milestoneRows.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "#2b579a", marginBottom: "4px" }}>
                Payment Schedule / Milestones
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>S.No</th>
                    <th style={thStyle}>Milestone</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Percentage</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {milestoneRows.map((m) => (
                    <tr key={m.sno}>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{m.sno}</td>
                      <td style={tdStyle}>{m.label}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{m.percent}%</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(m.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#2b579a", marginBottom: "4px" }}>
              C. Annual Maintenance Contract (AMC - Optional / From Year 2)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Description</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Base Amount (₹)</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>GST (18%) (₹)</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Total AMC / Year (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>Annual Maintenance & Technical Support (Bug fixes, server maintenance, minor updates)</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(amcNum)}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(amcCgst + amcSgst)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold" }}>{fmt(amcTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (key === "adminModuleFeatures") {
      const numStr = sectionCounter++;
      return (
        <section key={`admin-${idx}`} className="mb-6">
          <SectionHeader num={numStr} title="Application Modules" />
          {moduleGroups.map((group, gi) => (
            <div key={group.id || gi} style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "#2b579a", marginBottom: "4px" }}>
                {numStr}.{gi + 1} {group.title}
              </div>
              <ul style={{ margin: 0, paddingLeft: "16px", listStyle: "none" }}>
                <FeatureList features={group.features || []} />
              </ul>
            </div>
          ))}
        </section>
      );
    }

    if (key === "userModuleFeatures") {
      const numStr = sectionCounter++;
      return (
        <section key={`user-${idx}`} className="mb-6">
          <SectionHeader num={numStr} title="User / Customer Module Features" />
          <ul style={{ margin: 0, paddingLeft: "16px", listStyle: "none" }}>
            <FeatureList features={userModuleFeatures || []} />
          </ul>
        </section>
      );
    }

    if (key === "devScope") {
      const numStr = sectionCounter++;
      return (
        <section key={`devScope-${idx}`} className="mb-6">
          <SectionHeader num={numStr} title="Development Scope (What We Provide)" />
          <ul style={{ margin: 0, paddingLeft: "16px", listStyle: "none" }}>
            <FeatureList features={devScope || []} />
          </ul>
        </section>
      );
    }

    if (key === "outOfScope") {
      const numStr = sectionCounter++;
      return (
        <section key={`outOfScope-${idx}`} className="mb-6">
          <SectionHeader num={numStr} title="Out of Scope (What We Do Not Provide)" />
          <ul style={{ margin: 0, paddingLeft: "16px", listStyle: "none" }}>
            <FeatureList features={outOfScope || []} />
          </ul>
        </section>
      );
    }

    if (key === "conclusion") {
      const numStr = sectionCounter++;
      return (
        <section key={`conclusion-${idx}`} className="mb-6">
          <SectionHeader num={numStr} title="Conclusion" />
          <p style={{ fontSize: "11px", lineHeight: "1.7", color: "#334155", textAlign: "justify" }}>
            {conclusion}
          </p>
        </section>
      );
    }

    const customSec = customSecList.find((s) => s.id === key);
    if (customSec) {
      const numStr = sectionCounter++;
      return renderCustomSectionItem(customSec, idx, numStr);
    }

    return null;
  };

  const renderedSections = (sectionOrder || [])
    .map((key, idx) => renderSectionByKey(key, idx))
    .filter(Boolean);

  // Group sections into pages (chunk by 2 for clean page layout)
  const contentPages = [];
  const chunkSize = 2;
  for (let i = 0; i < renderedSections.length; i += chunkSize) {
    contentPages.push(renderedSections.slice(i, i + chunkSize));
  }

  const totalPages = (hasToc ? 2 : 1) + (contentPages.length || 1);
  let currentPage = 1;

  return (
    <div ref={ref} className="proposal-document">
      <style>{`
        .rich-text-content p { margin: 0 0 8px 0; }
        .rich-text-content ul { margin: 0 0 8px 0; padding-left: 20px; list-style-type: disc; }
        .rich-text-content ol { margin: 0 0 8px 0; padding-left: 20px; list-style-type: decimal; }
        .rich-text-content li { margin-bottom: 4px; }
        .rich-text-content table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .rich-text-content th, .rich-text-content td { border: 1px solid #cbd5e1; padding: 6px; }
        .rich-text-content th { background-color: #2b579a; color: white; text-align: left; }
        .rich-text-content .ql-align-center, .rich-text-content p.ql-align-center, .rich-text-content td.ql-align-center, .rich-text-content th.ql-align-center { text-align: center !important; }
        .rich-text-content .ql-align-right, .rich-text-content p.ql-align-right, .rich-text-content td.ql-align-right, .rich-text-content th.ql-align-right { text-align: right !important; }
        .rich-text-content .ql-align-justify, .rich-text-content p.ql-align-justify, .rich-text-content td.ql-align-justify, .rich-text-content th.ql-align-justify { text-align: justify !important; }
      `}</style>

      {/* PAGE 1: COVER PAGE */}
      <ProposalPage pageNum={String(currentPage++)} totalPages={totalPages} showTemplate={showTemplate}>
        <div className="min-h-[750px] flex flex-col justify-center items-center text-center px-4 my-auto">
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#2b579a", marginBottom: "20px", lineHeight: "1.3", whiteSpace: "pre-line" }}>
            {proposalTitle.includes(" for ") ? proposalTitle.replace(" for ", " for \n") : proposalTitle}
          </h1>
          <div style={{ borderBottom: "2px solid #2b579a", width: "80%", margin: "0 auto 36px auto" }} />

          <div className="text-gray-800 space-y-1.5 text-sm">
            <p className="font-semibold text-gray-600">Submitted by,</p>
            <p className="font-bold text-gray-900 text-base">M/s. {companyName},</p>
            <p className="text-gray-700">{companyCity}</p>
          </div>

          {clientCompany && (
            <div className="mt-8 text-gray-800 space-y-1.5 text-sm">
              <p className="font-semibold text-gray-600">To</p>
              <p className="font-bold text-gray-900 text-base">M/s. {clientCompany},</p>
              {clientName && (
                <p className="text-gray-700 font-medium">{clientName}</p>
              )}
            </div>
          )}
        </div>
      </ProposalPage>

      {/* PAGE 2: TABLE OF CONTENTS (If Present) */}
      {hasToc && (
        <ProposalPage pageNum={String(currentPage++)} totalPages={totalPages} showTemplate={showTemplate}>
          <div className="min-h-[750px]">
            <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "#2b579a" }}>Table of Contents</h2>
            <div style={{ fontSize: "12px", lineHeight: "2.2" }}>
              {tableOfContents.map((item, idx) => (
                <div key={idx} style={{ display: "flex", items: "baseline", paddingLeft: `${(Number(item.indent) || 0) * 16}px` }}>
                  <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
                  <span style={{ flexGrow: 1, borderBottom: "1px dotted #94a3b8", margin: "0 8px" }}></span>
                  <span className="font-semibold text-gray-700">{item.page}</span>
                </div>
              ))}
            </div>
          </div>
        </ProposalPage>
      )}

      {/* DYNAMIC ORDERED SECTIONS PAGES */}
      {contentPages.map((pageSections, pIdx) => (
        <ProposalPage key={pIdx} pageNum={String(currentPage++)} totalPages={totalPages} showTemplate={showTemplate}>
          <div>
            {pageSections}
            {pIdx === contentPages.length - 1 && (
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "24px", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <div style={{ width: "45%" }}>
                  <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "8px", color: "#1e293b" }}>Client Authentication</div>
                  <div style={{ marginBottom: "6px" }}><strong>{clientAuthCompany || clientCompany || "Client Company"}</strong></div>
                  <div style={{ marginBottom: "4px" }}>Name: <strong>{clientAuthName || clientName}</strong></div>
                  <div style={{ marginBottom: "4px" }}>Designation: <strong>{clientAuthDesignation}</strong></div>
                  <div style={{ marginBottom: "4px" }}>Company: <strong>{clientAuthCompany || clientCompany}</strong></div>
                  <div style={{ marginTop: "16px", marginBottom: "4px" }}>Signature: ______________________</div>
                  <div style={{ marginBottom: "4px" }}>Date: </div>
                  <div style={{ marginBottom: "4px" }}>Company Seal: </div>
                </div>

                <div style={{ width: "45%" }}>
                  <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "8px", color: "#2b579a" }}>Celeris Solutions</div>
                  <div style={{ marginBottom: "6px" }}><strong>{companyName}</strong></div>
                  <div style={{ marginBottom: "4px" }}>Name: <strong>Prabakar Devarajan</strong></div>
                  <div style={{ marginBottom: "4px" }}>Designation: <strong>MD & CEO</strong></div>
                  <div style={{ marginBottom: "4px" }}>Company: <strong>{companyName}</strong></div>
                  <div style={{ display: "flex", alignItems: "flex-end", marginBottom: "4px", marginTop: "4px", height: "32px" }}>
                    <span style={{ marginRight: "8px" }}>Signature:</span>
                    <img src="/Picture1.png" alt="Signature" style={{ height: "32px", objectFit: "contain" }} />
                  </div>
                  <div style={{ marginBottom: "4px" }}>Date: <strong>{proposalDate}</strong></div>
                  <div style={{ marginBottom: "4px" }}>Company Seal: </div>
                </div>
              </div>
            )}
          </div>
        </ProposalPage>
      ))}
    </div>
  );
});

ProposalTemplate.displayName = "ProposalTemplate";
export default ProposalTemplate;
