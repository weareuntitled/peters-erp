# 🛠️ GSWIN ERP: Reverse Engineered Workflow & Implementation Guide

This document captures the actual behavioral patterns and data logic extracted from the legacy GSWIN system. It serves as the "Source of Truth" for designing the new modern ERP to match (and improve) the user's real-world workflow.

---

## 📊 1. Core Document Usage (Priority Matrix)

The legacy system was not used for its full suite. To optimize the new development, we must focus on the "High Frequency" modules.

| Priority | Document Type | Frequency | Usage Profile | Action for New System |
| :--- | :--- | :--- | :--- | :--- |
| 🔴 **HIGH** | **RE (Rechnungen)** | ~66% | Primary revenue driver | **Full CRUD + PDF Generation** |
| 🟡 **MED** | **AN (Angebote)** | ~33% | Sales pipeline | **Full CRUD + Convert to RE** |
| 🟢 **LOW** | **ST (Stornierung)** | < 1% | Error correction | **Minimalist implementation** |
| ⚪ **NONE** | **AU, LI, GU** | ~0% | Unused features | **Do not implement in Phase 1** |

---

## ⚙️ 2. Transaction Complexity (UI/UX Requirements)

Analysis of the `dokument_positionen` (line items) shows the scale of business operations.

* **Average Density:** ~13 line items per document.
* **UX Requirement:** The "Position" entry form must support rapid entry (keyboard shortcuts, auto-completing articles) because users are dealing with substantial lists of services/materials, not just single-item receipts.

---

## 📅 3. The "Date Logic" (Critical Fix)

**CRITICAL:** The legacy data contains "Fake Dates" due to system clock manipulation used to bypass licensing.

| Field | Legacy Value (Fake) | New System Value (Real) |
| :--- | :--- | :--- |
| **Year** | `2005` | `2026` |
| **Example** | `2005-04-26` | `2026-04-26` |
| **ID Suffix** | `-042005` | `-042026` |

**Implementation Rule:**
All incoming data from the GSWIN migration must pass through a `date_correction_service` that shifts the year from 2005 to 2026 to ensure the timeline in the new app is chronologically correct.

---

## 🔄 4. Workflow Gap: The "Manual Transition"

**The Problem:** 
The database shows **zero (0)** automatic transitions from `AN` (Offer) to `RE` (Invoice). 

**The Discovery:** 
The user currently performs "Manual Conversion" (re-typing data from an offer into a new invoice).

**The Solution (Value Add):**
In the new system, implement a **"Convert to Invoice"** button on every Offer. This will be the single most impactful "Quality of Life" improvement for the user.

---

## 🧑‍🔧 5. User Behavior & Rhythm

The "Working Day" data reveals a non-standard professional pattern:

* **Weekly Rhythm:** Consistent activity Monday–Thursday.
* **The "Weekend Worker" Pattern:** High activity on **Sundays** and **Saturdays** (comparable to weekdays).
* **UI implication:** The system must be highly optimized for **Mobile/Tablet** use. The user is likely performing work (and documentation) on-site or during non-standard hours.

---

## ✅ Implementation Roadmap Summary

1.  [ ] **Implement Date Shifter:** `2005` $\rightarrow$ `2026`.
2.  [ ] **Build "Power Duo":** Focus exclusively on robust **Offer** and **Invoice** modules.
3.  [ ] **Create "Convert" Feature:** One-click transition from `AN` $\rightarrow$ `RE`.
4.  [ ] **Mobile-First UI:** Ensure the "Position" entry is easy to use on a tablet in the field.
