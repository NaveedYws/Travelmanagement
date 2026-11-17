import jsPDF from "jspdf";
import { SavedQuotation } from "./types";

export interface PaymentReceiptCompanyInfo {
  name?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

/**
 * Resolves full company branding matching quotation template (logo, name, phone, email, address, website)
 * from parameters or localStorage.
 */
export function resolveCompanyProfile(
  companyParam?: string | PaymentReceiptCompanyInfo
): Required<PaymentReceiptCompanyInfo> {
  let localData: any = {};
  let cachedLogo = "";
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("agency_company_profile");
      if (raw) localData = JSON.parse(raw);
      cachedLogo =
        localStorage.getItem("agency_company_logo_data") ||
        localData.company_logo_data ||
        "";
    } catch {}
  }

  if (typeof companyParam === "object" && companyParam !== null) {
    const name = (
      companyParam.name ||
      localData.company_name ||
      "Trip Flow Travel Agency"
    ).trim();
    return {
      name: name || "Trip Flow Travel Agency",
      logo: companyParam.logo || cachedLogo || localData.company_logo || "",
      phone:
        companyParam.phone ||
        localData.company_phone ||
        "+91 98765 43210",
      email:
        companyParam.email ||
        localData.company_email ||
        "support@travelagency.com",
      address:
        companyParam.address ||
        localData.company_address ||
        "Jammu & Kashmir, India",
      website:
        companyParam.website ||
        localData.company_website ||
        "",
    };
  }

  const name =
    typeof companyParam === "string" && companyParam.trim()
      ? companyParam.trim()
      : localData.company_name || "Trip Flow Travel Agency";

  return {
    name: name || "Trip Flow Travel Agency",
    logo: cachedLogo || localData.company_logo || "",
    phone: localData.company_phone || "+91 98765 43210",
    email: localData.company_email || "support@travelagency.com",
    address: localData.company_address || "Jammu & Kashmir, India",
    website: localData.company_website || "",
  };
}

/**
 * Generates and downloads an official Payment Receipt PDF matching the quotation template styling:
 * - Agency Logo
 * - Agency Name
 * - Agency Phone Number (No)
 * - Agency Email
 * - Address & Website
 * - Official Agency Stamp / Seal & Authorized Signatory
 */
export function downloadPaymentReceiptPdf(
  quotation: SavedQuotation,
  companyParam?: string | PaymentReceiptCompanyInfo
): string {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const company = resolveCompanyProfile(companyParam);
  const clientName = quotation.clientName || "Valued Client";
  const tripTitle =
    quotation.tripTitle || quotation.destination || "Custom Tour Package";
  const quotationRef =
    quotation.quotationRef || `QT-${quotation.id.slice(0, 8).toUpperCase()}`;
  const receiptNo = `RCP-${quotationRef.replace(/^QT-?/, "")}`;
  const receiptDate =
    quotation.paymentDate ||
    quotation.quotationDate ||
    new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const totalAmount =
    Number(quotation.paidAmount || quotation.finalQuotationTotal) || 0;
  const paymentMethod =
    quotation.paymentMethod || "UPI / QR Code / Online Transfer";

  // Brand Palette matching quotation template
  const navyR = 15,
    navyG = 41,
    navyB = 66; // #0f2942
  const tealR = 15,
    tealG = 118,
    tealB = 110; // #0f766e
  const emeraldR = 16,
    emeraldG = 149,
    emeraldB = 93;
  const slateR = 71,
    slateG = 85,
    slateB = 105;
  const stampRedR = 185,
    stampRedG = 28,
    stampRedB = 28; // #b91c1c official stamp crimson

  // =========================================================================
  // 1. TOP EXECUTIVE HEADER CARD (Matching Quotation Template)
  // =========================================================================
  let y = 10;
  const headerH = 36;

  // Header card container
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225); // #cbd5e1
  doc.roundedRect(14, y, 182, headerH, 2.5, 2.5, "FD");

  // Top accent colored line
  doc.setFillColor(tealR, tealG, tealB);
  doc.rect(14, y, 182, 1.8, "F");

  // Determine Logo presentation
  let hasImageLogo = false;
  const logoX = 18;
  const logoY = y + 5;
  const logoW = 28;
  const logoH = 24;

  if (company.logo && company.logo.startsWith("data:image")) {
    try {
      const format =
        company.logo.includes("image/jpeg") || company.logo.includes("image/jpg")
          ? "JPEG"
          : "PNG";
      doc.addImage(
        company.logo,
        format,
        logoX,
        logoY,
        logoW,
        logoH,
        undefined,
        "FAST"
      );
      hasImageLogo = true;
    } catch {
      hasImageLogo = false;
    }
  }

  if (!hasImageLogo) {
    // Stylized brand badge icon matching quotation template fallback
    doc.setFillColor(tealR, tealG, tealB);
    doc.roundedRect(logoX, logoY + 1, 22, 22, 3, 3, "F");
    const initials = company.name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PH";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(initials, logoX + 11, logoY + 15, { align: "center" });
  }

  // Company Details (beside logo)
  const textX = hasImageLogo ? 50 : 44;

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(navyR, navyG, navyB);
  doc.text(company.name.toUpperCase().slice(0, 36), textX, y + 10);

  // Website
  if (company.website) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(tealR, tealG, tealB);
    doc.text(company.website.slice(0, 36), textX, y + 15);
  }

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slateR, slateG, slateB);
  doc.text(
    (company.address || "Jammu & Kashmir, India").slice(0, 42),
    textX,
    company.website ? y + 20 : y + 16
  );

  // Phone (No)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Phone: ${company.phone}`,
    textX,
    company.website ? y + 25 : y + 21
  );

  // Email
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Email: ${company.email}`,
    textX,
    company.website ? y + 30 : y + 26
  );

  // Right Side: Receipt Badge & Reference Details
  const rightX = 191;
  doc.setFillColor(tealR, tealG, tealB);
  doc.roundedRect(138, y + 5, 53, 6.5, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL PAYMENT RECEIPT", 164.5, y + 9.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navyR, navyG, navyB);
  doc.text(`Receipt No: ${receiptNo}`, rightX, y + 17, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(slateR, slateG, slateB);
  doc.text(`Quotation Ref: ${quotationRef}`, rightX, y + 22, { align: "right" });
  doc.text(`Receipt Date: ${receiptDate}`, rightX, y + 27, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(emeraldR, emeraldG, emeraldB);
  doc.text("Status: PAID IN FULL", rightX, y + 32, { align: "right" });

  // =========================================================================
  // 2. BILLED TO & BOOKING DETAILS CARDS
  // =========================================================================
  y = 50;
  const cardH = 38;

  // Left Card: Customer Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 88, cardH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(tealR, tealG, tealB);
  doc.text("CUSTOMER DETAILS (BILLED TO)", 19, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(clientName.slice(0, 32), 19, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(slateR, slateG, slateB);
  doc.text(`Phone: ${quotation.clientPhone || "Not specified"}`, 19, y + 20);
  doc.text(`Email: ${quotation.clientEmail || "Not specified"}`, 19, y + 25);
  doc.text(
    `Address: ${(quotation.clientAddress || "Not specified").slice(0, 34)}`,
    19,
    y + 30
  );

  // Right Card: Booking Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(108, y, 88, cardH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(tealR, tealG, tealB);
  doc.text("TRIP & PACKAGE CONFIRMATION", 113, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(tripTitle.slice(0, 32), 113, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(slateR, slateG, slateB);
  doc.text(
    `Destination: ${quotation.destination || "As per Itinerary"}`,
    113,
    y + 20
  );
  doc.text(
    `Travel Dates: ${quotation.startDate || "TBD"} – ${
      quotation.endDate || "TBD"
    }`,
    113,
    y + 25
  );
  doc.text(
    `Travelers: ${quotation.adults || 1} Adults${
      Number(quotation.children) > 0
        ? `, ${quotation.children} Children`
        : ""
    }`,
    113,
    y + 30
  );

  // =========================================================================
  // 3. PAYMENT CONFIRMATION BANNER
  // =========================================================================
  y = 92;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(14, y, 182, 11, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(emeraldR, emeraldG, emeraldB);
  doc.text("PAYMENT RECEIVED & CONVERTED BOOKING CONFIRMED", 20, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(slateR, slateG, slateB);
  doc.text(`Payment Mode: ${paymentMethod}`, 190, y + 7, { align: "right" });

  // =========================================================================
  // 4. PARTICULARS TABLE
  // =========================================================================
  y = 108;
  doc.setFillColor(navyR, navyG, navyB);
  doc.rect(14, y, 182, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("PARTICULARS / DESCRIPTION", 18, y + 5.5);
  doc.text("PAYMENT MODE", 110, y + 5.5);
  doc.text("STATUS", 145, y + 5.5);
  doc.text("AMOUNT (INR)", 191, y + 5.5, { align: "right" });

  // Table Row
  y += 8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, 182, 16, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(tripTitle.slice(0, 48), 18, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slateR, slateG, slateB);
  doc.text(
    `Ref: ${quotationRef} | Destination: ${
      quotation.destination || "Tour"
    }${quotation.transactionRef ? ` | Ref: ${quotation.transactionRef}` : ""}`,
    18,
    y + 11.5
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(paymentMethod.slice(0, 18), 110, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(emeraldR, emeraldG, emeraldB);
  doc.text("PAID", 145, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${totalAmount.toLocaleString("en-IN")}`, 191, y + 8, {
    align: "right",
  });

  // =========================================================================
  // 5. CALCULATIONS BREAKDOWN & TERMS
  // =========================================================================
  y += 20;

  // Notes on Left
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navyR, navyG, navyB);
  doc.text("PAYMENT NOTES & TERMS:", 14, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slateR, slateG, slateB);
  doc.text(
    "• This receipt confirms payment settlement for the converted booking.",
    14,
    y + 12
  );
  doc.text(
    "• Official hotel vouchers, transport slips, and tickets will be dispatched.",
    14,
    y + 17
  );
  doc.text(
    "• For amendments or inquiries, contact our agency customer care desk.",
    14,
    y + 22
  );
  doc.text(
    `• Associated Quotation Reference: ${quotationRef}`,
    14,
    y + 27
  );

  // Financial Summary on Right
  const summaryX = 112;
  const summaryW = 84;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, y, summaryW, 36, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(slateR, slateG, slateB);
  doc.text("Quoted Package Total:", summaryX + 5, y + 8);
  doc.text(
    `Rs. ${totalAmount.toLocaleString("en-IN")}`,
    summaryX + summaryW - 5,
    y + 8,
    { align: "right" }
  );

  doc.text("Taxes & GST (Included):", summaryX + 5, y + 14);
  doc.text("Included (5%)", summaryX + summaryW - 5, y + 14, {
    align: "right",
  });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(emeraldR, emeraldG, emeraldB);
  doc.text("Total Paid / Received:", summaryX + 5, y + 21);
  doc.text(
    `Rs. ${totalAmount.toLocaleString("en-IN")}`,
    summaryX + summaryW - 5,
    y + 21,
    { align: "right" }
  );

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 5, y + 25, summaryX + summaryW - 5, y + 25);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(navyR, navyG, navyB);
  doc.text("Balance Outstanding:", summaryX + 5, y + 31);
  doc.text("Rs. 0.00 (PAID)", summaryX + summaryW - 5, y + 31, {
    align: "right",
  });

  // =========================================================================
  // 6. OFFICIAL STAMP & AUTHORIZED SIGN-OFF (Matching Quotation Template)
  // =========================================================================
  y += 46;

  // --- A. AUTHENTIC OFFICIAL AGENCY STAMP (SEAL) ---
  const stampCenterX = 56;
  const stampCenterY = y + 14;

  // Outer circle
  doc.setDrawColor(stampRedR, stampRedG, stampRedB);
  doc.setLineWidth(0.9);
  doc.circle(stampCenterX, stampCenterY, 17);

  // Inner circle
  doc.setLineWidth(0.4);
  doc.circle(stampCenterX, stampCenterY, 15);

  // Top Curved Stamp Text (Company Name)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(stampRedR, stampRedG, stampRedB);
  doc.text(
    company.name.toUpperCase().slice(0, 24),
    stampCenterX,
    stampCenterY - 8.5,
    { align: "center" }
  );

  // Center Badge: [ ★ PAID ★ ]
  doc.setFillColor(254, 242, 242); // light red tint
  doc.setDrawColor(stampRedR, stampRedG, stampRedB);
  doc.setLineWidth(0.5);
  doc.rect(stampCenterX - 13, stampCenterY - 3.8, 26, 7.6, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(stampRedR, stampRedG, stampRedB);
  doc.text("★ PAID ★", stampCenterX, stampCenterY + 1.6, { align: "center" });

  // Bottom Stamp Text (Official Verification)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(stampRedR, stampRedG, stampRedB);
  doc.text("OFFICIAL SEAL & VERIFIED", stampCenterX, stampCenterY + 7.8, {
    align: "center",
  });
  doc.setFontSize(6);
  doc.text(receiptDate, stampCenterX, stampCenterY + 11.5, {
    align: "center",
  });

  // --- B. AUTHORIZED SIGN & SEAL BOX (Matching Quotation Template) ---
  const sigX = 125;
  const sigY = y + 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.roundedRect(sigX, sigY, 60, 20, 2, 2, "FD");
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Authorized Sign & Seal", sigX + 30, sigY + 11, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navyR, navyG, navyB);
  doc.text("Official Travel Specialist Signature", sigX + 30, sigY + 26, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slateR, slateG, slateB);
  doc.text(company.name, sigX + 30, sigY + 30, { align: "center" });

  // =========================================================================
  // 7. FOOTER
  // =========================================================================
  doc.setFillColor(navyR, navyG, navyB);
  doc.rect(0, 285, 210, 12, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${company.name} · Phone: ${company.phone} · Email: ${company.email}`,
    105,
    290,
    { align: "center" }
  );
  doc.text(
    "Thank you for booking with us! We wish you a delightful journey.",
    105,
    294,
    { align: "center" }
  );

  const filename = `Receipt_${clientName.replace(/\s+/g, "_")}_${quotationRef}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Generates and downloads a summary report PDF of all converted leads & payments.
 */
export function downloadPaymentsSummaryPdf(
  quotations: SavedQuotation[],
  companyParam?: string | PaymentReceiptCompanyInfo
): string {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const company = resolveCompanyProfile(companyParam);
  const paidLeads = quotations.filter((q) => q.paymentRecorded === true || q.status === "Converted");
  const totalAmount = paidLeads.reduce(
    (sum, q) => sum + (Number(q.paidAmount || q.finalQuotationTotal) || 0),
    0
  );
  const reportDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const navyR = 15,
    navyG = 41,
    navyB = 66;
  const slateR = 71,
    slateG = 85,
    slateB = 105;

  // Header Banner
  doc.setFillColor(navyR, navyG, navyB);
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(company.name, 14, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Financial Collections Ledger · Phone: ${company.phone} · Email: ${company.email}`,
    14,
    20
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${reportDate}`, 196, 13, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Total Records: ${paidLeads.length}`, 196, 20, { align: "right" });

  // Summary KPI Row
  let y = 40;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 16, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(navyR, navyG, navyB);
  doc.text(
    `TOTAL REVENUE COLLECTED: Rs. ${totalAmount.toLocaleString("en-IN")}`,
    20,
    y + 10
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(slateR, slateG, slateB);
  doc.text(`Across ${paidLeads.length} converted booking(s)`, 190, y + 10, {
    align: "right",
  });

  // Table Header
  y += 22;
  doc.setFillColor(navyR, navyG, navyB);
  doc.rect(14, y, 182, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("#", 17, y + 5.5);
  doc.text("CUSTOMER NAME", 26, y + 5.5);
  doc.text("DATE", 78, y + 5.5);
  doc.text("PACKAGE / DESTINATION", 112, y + 5.5);
  doc.text("AMOUNT (INR)", 175, y + 5.5);
  doc.text("STATUS", 192, y + 5.5, { align: "right" });

  // Table Rows
  y += 8;
  doc.setFontSize(8);

  if (paidLeads.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(14, y, 182, 14, "F");
    doc.setTextColor(slateR, slateG, slateB);
    doc.text("No recorded payments found.", 105, y + 9, { align: "center" });
    y += 14;
  } else {
    paidLeads.slice(0, 20).forEach((lead, idx) => {
      const rowY = y + idx * 9;
      doc.setFillColor(
        idx % 2 === 0 ? 255 : 248,
        idx % 2 === 0 ? 255 : 250,
        idx % 2 === 0 ? 255 : 252
      );
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, rowY, 182, 9, "FD");

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(String(idx + 1), 17, rowY + 6);
      doc.setFont("helvetica", "bold");
      doc.text((lead.clientName || "Untitled Client").slice(0, 22), 26, rowY + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(slateR, slateG, slateB);
      doc.text(
        (lead.paymentDate || lead.quotationDate || lead.createdAt?.slice(0, 10) || "N/A").slice(
          0,
          14
        ),
        78,
        rowY + 6
      );
      doc.text(
        (lead.tripTitle || lead.destination || "Tour Package").slice(0, 28),
        112,
        rowY + 6
      );

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const amt = Number(lead.paidAmount || lead.finalQuotationTotal) || 0;
      doc.text(`Rs. ${amt.toLocaleString("en-IN")}`, 175, rowY + 6);

      doc.setTextColor(16, 149, 93);
      doc.text("PAID", 192, rowY + 6, { align: "right" });
    });

    y += paidLeads.slice(0, 20).length * 9;

    // Total Row
    doc.setFillColor(navyR, navyG, navyB);
    doc.rect(14, y, 182, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("GRAND TOTAL", 26, y + 5.5);
    doc.text(`Rs. ${totalAmount.toLocaleString("en-IN")}`, 175, y + 5.5);
    doc.text(`${paidLeads.length} Bookings`, 192, y + 5.5, { align: "right" });
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(slateR, slateG, slateB);
  doc.text(`Confidential Financial Report · ${company.name}`, 105, 290, {
    align: "center",
  });

  const filename = `Payments_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return filename;
}
