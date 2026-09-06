import * as XLSX from "xlsx";
import Papa from "papaparse";
import * as pdfjsLib from "pdfjs-dist";

// Configure pdfjs worker if in browser
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  // Using unpkg or cdnjs worker compatible with the pdfjs-dist version
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface ParsedLead {
  customer_name: string;
  contact_no: string;
  email?: string;
  address?: string;
  campaign_name?: string;
  source: "meta_ads" | "google_ads" | "website" | "csv_import" | "pdf_import";
  message?: string;
  raw?: Record<string, any>;
}

export interface ParseResult {
  leads: ParsedLead[];
  detectedSource: string;
  fileName: string;
  totalFound: number;
  errors: string[];
}

/**
 * Normalizes header keys to lowercase trimmed alphanumeric
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Finds the value from a row whose key matches any of the candidate keywords
 */
function findValue(row: Record<string, any>, candidates: string[]): string {
  const normCandidates = candidates.map(normalizeKey);
  for (const [key, val] of Object.entries(row)) {
    if (val === null || val === undefined || val === "") continue;
    const normKey = normalizeKey(key);
    for (const cand of normCandidates) {
      if (normKey === cand || normKey.includes(cand)) {
        return String(val).trim();
      }
    }
  }
  return "";
}

/**
 * Smart detection of source platform based on column names
 */
function detectPlatform(headers: string[]): "meta_ads" | "google_ads" | "csv_import" {
  const normHeaders = headers.map(normalizeKey);

  // Meta Ads headers check
  const metaKeywords = ["adname", "adsetname", "campaignname", "formid", "formname", "isorganic", "platform"];
  const metaMatches = normHeaders.filter(h => metaKeywords.some(mk => h.includes(mk)));
  if (metaMatches.length >= 2 || normHeaders.includes("adname") || normHeaders.includes("adsetname")) {
    return "meta_ads";
  }

  // Google Ads headers check
  const googleKeywords = ["adgroupname", "campaignname", "campaignid", "gclid", "userphonenumber", "useremail", "username"];
  const googleMatches = normHeaders.filter(h => googleKeywords.some(gk => h.includes(gk)));
  if (googleMatches.length >= 2 || normHeaders.includes("adgroupname") || normHeaders.includes("userphonenumber")) {
    return "google_ads";
  }

  return "csv_import";
}

/**
 * Parse an array of generic records (from CSV or Excel) into ParsedLead objects
 */
export function normalizeRowsToLeads(rows: Record<string, any>[], platformOverride?: "meta_ads" | "google_ads" | "csv_import"): ParsedLead[] {
  if (!rows || rows.length === 0) return [];

  const headers = Object.keys(rows[0] || {});
  const detectedPlatform = platformOverride || detectPlatform(headers);

  const leads: ParsedLead[] = [];

  for (const row of rows) {
    // Determine Customer Name
    let customerName = findValue(row, ["full_name", "fullname", "user_name", "username", "customer_name", "customername", "name", "client_name", "client"]);
    if (!customerName) {
      const firstName = findValue(row, ["first_name", "firstname", "first"]);
      const lastName = findValue(row, ["last_name", "lastname", "last"]);
      if (firstName || lastName) {
        customerName = `${firstName} ${lastName}`.trim();
      }
    }

    // Determine Contact Number / Phone
    let contactNo = findValue(row, ["phone_number", "phonenumber", "user_phone_number", "phone", "contact_no", "contact", "mobile_number", "mobile", "whatsapp", "cell"]);
    // Clean phone number: remove quotes, spaces, keep + and digits
    contactNo = contactNo.replace(/['"\s]/g, "");

    // Determine Email
    const email = findValue(row, ["email_address", "email", "user_email", "mail"]);

    // Determine City / Address
    let address = findValue(row, ["street_address", "address", "city", "location", "destination", "postal_code", "zip_code"]);
    const city = findValue(row, ["city"]);
    if (city && address && !address.includes(city)) {
      address = `${address}, ${city}`;
    }

    // Determine Campaign Name / Ad Name
    const campaignName = findValue(row, ["campaign_name", "campaign", "ad_name", "adgroup_name", "ad_group", "form_name"]);

    // Determine Message / Notes / Inquiry requirement
    let message = findValue(row, ["message", "inquiry", "requirement", "requirements", "notes", "description", "query", "preferred_date", "comments"]);
    
    // Gather any additional custom questions / answers from Meta/Google Lead Forms
    const extraInfo: string[] = [];
    for (const [k, v] of Object.entries(row)) {
      if (!v) continue;
      const nk = normalizeKey(k);
      const isKnown = [
        "fullname", "firstname", "lastname", "name", "userphone", "phonenumber", "phone", "contact", "mobile",
        "email", "useremail", "address", "city", "postalcode", "campaignname", "campaign", "adname", "adgroupname", "id", "createdtime"
      ].some(known => nk.includes(known));

      if (!isKnown && typeof v === "string" && v.trim().length > 0 && v.length < 200) {
        extraInfo.push(`${k}: ${v}`);
      }
    }

    if (extraInfo.length > 0) {
      message = message ? `${message} | ${extraInfo.join(" | ")}` : extraInfo.join(" | ");
    }

    // If there's no name and no phone, this row is likely an empty or meta row
    if (!customerName && !contactNo && !email) {
      continue;
    }

    leads.push({
      customer_name: customerName || "Lead",
      contact_no: contactNo || "N/A",
      email: email || undefined,
      address: address || undefined,
      campaign_name: campaignName || undefined,
      source: detectedPlatform,
      message: message || undefined,
      raw: row,
    });
  }

  return leads;
}

/**
 * Parse a CSV file (Meta Ads, Google Ads, or Custom CSV)
 */
export async function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as Record<string, any>[];
          const headers = results.meta.fields || (rows[0] ? Object.keys(rows[0]) : []);
          const detectedSource = detectPlatform(headers);
          const leads = normalizeRowsToLeads(rows, detectedSource);

          resolve({
            leads,
            detectedSource: detectedSource === "meta_ads" ? "Meta Ads (Facebook/Instagram)" : detectedSource === "google_ads" ? "Google Ads" : "CSV Spreadsheet",
            fileName: file.name,
            totalFound: leads.length,
            errors: results.errors.map(e => e.message),
          });
        } catch (err: any) {
          resolve({
            leads: [],
            detectedSource: "Unknown",
            fileName: file.name,
            totalFound: 0,
            errors: [err.message || "Failed to process CSV file"],
          });
        }
      },
      error: (error) => {
        resolve({
          leads: [],
          detectedSource: "Unknown",
          fileName: file.name,
          totalFound: 0,
          errors: [error.message],
        });
      },
    });
  });
}

/**
 * Parse an Excel file (.xlsx, .xls)
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        leads: [],
        detectedSource: "Excel Spreadsheet",
        fileName: file.name,
        totalFound: 0,
        errors: ["Excel workbook has no sheets"],
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

    const headers = rows[0] ? Object.keys(rows[0]) : [];
    const detectedSource = detectPlatform(headers);
    const leads = normalizeRowsToLeads(rows, detectedSource);

    return {
      leads,
      detectedSource: detectedSource === "meta_ads" ? "Meta Ads (Excel)" : detectedSource === "google_ads" ? "Google Ads (Excel)" : "Excel Spreadsheet",
      fileName: file.name,
      totalFound: leads.length,
      errors: [],
    };
  } catch (err: any) {
    return {
      leads: [],
      detectedSource: "Excel Spreadsheet",
      fileName: file.name,
      totalFound: 0,
      errors: [err.message || "Failed to parse Excel file"],
    };
  }
}

/**
 * Parse a PDF file (extracting tabular / list leads from PDF text)
 */
export async function parsePdfFile(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let textLines: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageLines = textContent.items
        .map((item: any) => item.str)
        .filter((str: string) => str.trim().length > 0);
      textLines = textLines.concat(pageLines);
    }

    const fullText = textLines.join("\n");

    // Try to extract leads using regex for phone numbers, emails, and names
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const phoneRegex = /(\+?[0-9]{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d]{3}[-.\s]?[\d]{4}/g;

    const emails = Array.from(new Set(fullText.match(emailRegex) || []));
    const phones = Array.from(new Set(fullText.match(phoneRegex) || [])).filter(p => p.replace(/\D/g, "").length >= 7);

    const leads: ParsedLead[] = [];

    // Pair phone numbers and emails line by line or clustered
    const maxEntries = Math.max(emails.length, phones.length);

    if (maxEntries > 0) {
      for (let i = 0; i < maxEntries; i++) {
        const phone = phones[i] || "";
        const email = emails[i] || "";
        
        // Find potential name nearby in textLines
        let nameCandidate = `Lead ${i + 1}`;
        if (email) {
          const namePart = email.split("@")[0].replace(/[._-]/g, " ");
          nameCandidate = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        }

        leads.push({
          customer_name: nameCandidate,
          contact_no: phone || "N/A",
          email: email || undefined,
          source: "pdf_import",
          message: `Imported from PDF: ${file.name}`,
        });
      }
    }

    return {
      leads,
      detectedSource: "PDF Document",
      fileName: file.name,
      totalFound: leads.length,
      errors: leads.length === 0 ? ["No structured contact details (phones/emails) were detected in the PDF"] : [],
    };
  } catch (err: any) {
    return {
      leads: [],
      detectedSource: "PDF Document",
      fileName: file.name,
      totalFound: 0,
      errors: [err.message || "Failed to parse PDF document"],
    };
  }
}

/**
 * Universal file parser dispatcher
 */
export async function parseLeadsFile(file: File): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return await parseCsvFile(file);
  } else if (extension === "xlsx" || extension === "xls") {
    return await parseExcelFile(file);
  } else if (extension === "pdf") {
    return await parsePdfFile(file);
  } else {
    return {
      leads: [],
      detectedSource: "Unknown",
      fileName: file.name,
      totalFound: 0,
      errors: [`Unsupported file format .${extension}. Please upload a CSV, Excel (.xlsx, .xls), or PDF file.`],
    };
  }
}

/**
 * Generate sample CSV templates for download
 */
export function downloadSampleTemplate(type: "meta" | "google" | "standard") {
  let headers: string[] = [];
  let sampleRows: Record<string, string>[] = [];
  let filename = "leads_template.csv";

  if (type === "meta") {
    filename = "meta_leads_template.csv";
    headers = ["campaign_name", "ad_name", "full_name", "phone_number", "email", "city", "street_address", "what_destination_do_you_prefer"];
    sampleRows = [
      {
        campaign_name: "Dubai Summer Special",
        ad_name: "Dubai 5D4N Luxury",
        full_name: "Rahul Sharma",
        phone_number: "+91 98765 43210",
        email: "rahul.sharma@example.com",
        city: "Mumbai",
        street_address: "Bandra West",
        what_destination_do_you_prefer: "Dubai with Desert Safari",
      },
      {
        campaign_name: "Bali Honeymoon Deals",
        ad_name: "Bali Private Pool Villa",
        full_name: "Priya Patel",
        phone_number: "+91 98220 12345",
        email: "priya.p@example.com",
        city: "Ahmedabad",
        street_address: "SG Highway",
        what_destination_do_you_prefer: "Seminyak & Ubud",
      },
    ];
  } else if (type === "google") {
    filename = "google_ads_leads_template.csv";
    headers = ["Campaign Name", "Ad Group Name", "User Name", "User Phone Number", "User Email", "City", "Requirements"];
    sampleRows = [
      {
        "Campaign Name": "Kashmir Tour Packages 2026",
        "Ad Group Name": "Srinagar Gulmarg Deluxe",
        "User Name": "Amit Kumar",
        "User Phone Number": "+91 91234 56789",
        "User Email": "amit.kumar@example.com",
        "City": "Delhi",
        "Requirements": "Need 6 days package for family of 4",
      },
      {
        "Campaign Name": "Thailand Holiday Packages",
        "Ad Group Name": "Phuket Krabi Special",
        "User Name": "Sneha Roy",
        "User Phone Number": "+91 98300 98765",
        "User Email": "sneha.roy@example.com",
        "City": "Kolkata",
        "Requirements": "Couple package for November",
      },
    ];
  } else {
    filename = "standard_leads_template.csv";
    headers = ["Name", "Phone", "Email", "City", "Campaign", "Notes"];
    sampleRows = [
      {
        Name: "Vikas Verma",
        Phone: "+91 99887 76655",
        Email: "vikas.verma@example.com",
        City: "Bangalore",
        Campaign: "Winter Gateway",
        Notes: "Interested in Maldives 4N5N Water Villa",
      },
      {
        Name: "Ananya Iyer",
        Phone: "+91 97766 55443",
        Email: "ananya.iyer@example.com",
        City: "Chennai",
        Campaign: "Kerala Backwaters",
        Notes: "Houseboat stay and Munnar resort",
      },
    ];
  }

  const csvContent = Papa.unparse({
    fields: headers,
    data: sampleRows,
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
