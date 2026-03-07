# Full UI Audit Report — demo.mixradius.com:2143

**Base URL:** https://demo.mixradius.com:2143/  
**Login:** demo / demo  
**Audit method:** Automated sidebar traversal (Playwright); multiple runs merged.  
**Date:** 2026-03-07  

---

## Summary

- **Menus expected:** Users Session, Dashboard, App Settings, Licence Info, Router [ NAS ], ODP | POP Data, Service Plan, Customers, Voucher Card, Unpaid Invoice, Finance Report, Online Payment, Support Tickets, System Tools, Software Logs, Neighbor List, PPPOE.
- **Fully traversed:** All except **PPPOE** (no sidebar link found; menu may be hidden or absent in demo).
- **Inaccessible (demo user):** See [Inaccessible / restricted](#inaccessible--restricted) below.

---

## 1. Users Session

### 1.1 Hotspot
- **Page title:** Hotspot Session - RADIUS TOPSETTING.COM  
- **URL:** `/rad-users-session/active-hotspot`  
- **Key elements:** DataTable with session list.  
- **Table columns:** Username, Router [ NAS ], Calling Station, IP Address, Start Time, Data Owner, Upload, Download, Action.  
- **Filters/forms:** Show 10/25/50/100/500/1,000 entries, Search; confirmation "Are you sure to remove selected data ?".  
- **Action buttons:** Remove, Search Data, Search Customer, Search Voucher, Add Router, Export User to File, View Reports, Delete Report, Reset DB.  

### 1.2 PPP
- **Page title:** PPP Session - RADIUS TOPSETTING.COM  
- **URL:** `/rad-users-session/active-ppp`  
- **Key elements:** Same structure as Hotspot.  
- **Table columns:** Username, Router [ NAS ], Calling Station, IP Address, Start Time, Data Owner, Upload, Download, Action.  
- **Filters/forms:** Entries selector, Search; per-row remove confirmations (e.g. "Are you sure to remove this data ?[ username ]").  
- **Action buttons:** Remove, Search Data, Search Customer, Search Voucher, Add Router, Export User to File, View Reports, Delete Report, Reset DB.  

---

## 2. Dashboard

### 2.1 Dashboard (root — "Dashboardnew")
- **Page title:** HOME - RADIUS TOPSETTING.COM  
- **URL:** `/rad-dashboard`  
- **Key elements:** Home/dashboard with report table and controls.  
- **Table columns:** Id, Invoice, Customer ID, Name, Service Type, Server, Service Plan, Amount, Pay Period, Data Owner, Action, Full Name, Total Bill, Due Date.  
- **Filters/forms:** Show entries, Search, router select, select_interface, dashboard_report_daily_length.  
- **Action buttons:** START, Invoice, Router, Remove, Search Data, Search Customer, Search Voucher, Add Router, Export User to File, View Reports, Delete Report, Reset DB.  

---

## 3. App Settings

### 3.1 General Settings
- **Page title:** General Settings - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/app`  
- **Key elements:** Form for app-wide settings.  
- **Form fields / filters:** User Type, Customer, VOUCHER, Customer ID | Username, Voucher Code | MAC Address, Router Name, Router Address, Radius Secret, API Port, API Username, API Password, Hotspot URL [ Need for QRCode ], Due Notice Url ( Optional ), Description, CUSTOMER, Service Type, Data Owner, Service Plan, File Type, Payment Method, From Date, Till Date, etc.  

### 3.2 Localisation
- **Page title:** Localisation - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/localisation`  
- **Form fields:** EN, ID, Company, Address, Mobile Phone, Time Zone, Date Format, Decimal Point, Thousands Separator, Currency Code [ Do not use Special Characters ].  

### 3.3 User Management
- **Page title:** Access Denied - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/users` (redirects to access-denied for demo user).  
- **Status:** **Inaccessible** — demo account lacks permission.  

### 3.4 Invoice Logo
- **Page title:** Invoice Logo - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/invoice-logo`  

### 3.5 SMS Setting
- **Page title:** SMS Notification - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/sms-api`  

### 3.6 Email Setting
- **Page title:** Email Notification - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/smtp-setup`  

### 3.7 Whatsapp API
- **Page title:** Whatsapp API - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/whatsapp-api`  

### 3.8 Google Map API
- **Page title:** Google Map API - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/gmap-api`  

### 3.9 API Setting
- **Page title:** API Setting - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/api-setting`  

### 3.10 Payment Gateway
- **Page title:** Payment Gateway - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/payment-gateway`  
- **Form fields (key):** Payment Gateway Server, Payment URL [ Do Not Change ], Activate/deactivate payment channel; Supported Port, Payment Notification, Payment Method.  

### 3.11 Voucher Template
- **Page title:** Template Editor - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/voucher-template`  

### 3.12 Hotspot Domain
- **Page title:** Hotspot Domain - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/hotspot-url`  

### 3.13 Called Station
- **Page title:** Called Station - RADIUS TOPSETTING.COM  
- **URL:** `/rad-settings/calledstation`  

### 3.14 Licence Info
- **Page title:** Licence Info - RADIUS TOPSETTING.COM  
- **URL:** `/rad-licence/details`  
- **Note:** Listed under App Settings in sidebar; no separate top-level "Licence Info" item in discovered links.  

---

## 4. Router [ NAS ]

### 4.1 Router [ NAS ] (root)
- **Page title:** Routers - RADIUS TOPSETTING.COM  
- **URL:** `/rad-routers/list`  
- **Key elements:** List of NAS/routers with API and ping status.  
- **Table columns:** API Features, Ping Status, Router Name, IP Address, Time Zone, Description, Online Users, Last Checked, Action.  
- **Filters/forms:** Show entries, Search; remove confirmations per NAS (e.g. "Are you sure to remove this data ?[ NAS : GR3-PON-2 ]").  
- **Action buttons:** Remove, Save Basic Config, Search Data, Search Customer, Search Voucher, Add Router, Export User to File, View Reports, Delete Report, Reset DB.  

---

## 5. ODP | POP Data

### 5.1 Manage ODP | POP
- **Page title:** ODP | POP Data - RADIUS TOPSETTING.COM  
- **URL:** `/rad-odp/list`  
- **Table columns:** Id, ODP | POP Name or Code, ODP | POP Area, Latitude, Longitude, (and others).  
- **Filters/forms:** Show entries, Search; "Are you sure to remove this data ?[ ODP CAREK ]", "Are you sure to remove selected data ?".  
- **Action buttons:** Standard data/search/export set.  

### 5.2 View Map
- **Page title:** ODP | POP Map - RADIUS TOPSETTING.COM  
- **URL:** `/rad-odp/mapping`  
- **Key elements:** Map view for ODP/POP locations.  

---

## 6. Service Plan

### 6.1 Bandwidth
- **Page title:** Bandwidth Profile - RADIUS TOPSETTING.COM  
- **URL:** `/rad-bw-profiles/list`  

### 6.2 Profile Group
- **Page title:** Profile Group - RADIUS TOPSETTING.COM  
- **URL:** `/rad-profile-group/list`  

### 6.3 Hotspot Profile
- **Page title:** Hotspot Profile - RADIUS TOPSETTING.COM  
- **URL:** `/rad-services/hotspot`  

### 6.4 PPP Profile
- **Page title:** PPP Profile - RADIUS TOPSETTING.COM  
- **URL:** `/rad-services/ppp`  

---

## 7. Customers

### 7.1 Hotspot Users
- **Page title:** Hotspot Users - RADIUS TOPSETTING.COM  
- **URL:** `/rad-customers/hotspot`  
- **Table columns:** Customer ID, Name, Service Type, Service Plan, Renewed On, Due Date, Data Owner, Renew | Print, Action.  
- **Filters/forms:** Service Status, Data Owner, Service Plan, Name Prefix | Customer ID, ODP | POP, Register Date, Due Date, Renewal; Show entries, Search; Select Data Owner, Customer Type, Payment Status; confirmations for remove, change type, process registration, renew, bind.  
- **Action buttons:** Close, Show Data, Remove, Change Data Owner, Change Customer Type, Process Registration, Renew Plan, Enable Bind, Disable Bind, Variables, Send Notification, Copy, Apply, plus global search/export.  

### 7.2 PPP Users
- **Page title:** PPP Users - RADIUS TOPSETTING.COM  
- **URL:** `/rad-customers/ppp`  
- **Table columns:** Customer ID, Name, Service Type, Service Plan, IP Address, Renewed On, Due Date, Data Owner, Renew | Print, Action.  
- **Filters/forms:** Same type as Hotspot Users; printer selection for invoice (Standar Printer, Thermal Printer).  
- **Action buttons:** Standar Printer, Thermal Printer, Remove, Change Data Owner, (and same workflow set as Hotspot).  

### 7.3 Mapping Users
- **Page title:** Mapping Users - RADIUS TOPSETTING.COM  
- **URL:** `/rad-customers/mapping`  

---

## 8. Voucher Card

### 8.1 Hotspot Voucher
- **Page title:** Voucher Card - RADIUS TOPSETTING.COM  
- **URL:** `/rad-vouchers/hotspot`  

### 8.2 PPP Voucher
- **Page title:** Voucher Card - RADIUS TOPSETTING.COM  
- **URL:** `/rad-vouchers/ppp`  

---

## 9. Unpaid Invoice

### 9.1 All Invoice
- **Page title:** HOME - RADIUS TOPSETTING.COM  
- **URL:** `/#unpaid-invoice` (dashboard with hash).  

### 9.2 Invoice By Period
- **Page title:** HOME - RADIUS TOPSETTING.COM  
- **URL:** `/#unpaid-period` (dashboard with hash).  

---

## 10. Finance Report

### 10.1 Reseller Topup
- **Page title:** HOME - RADIUS TOPSETTING.COM  
- **URL:** `/#topup_report`  

### 10.2 Daily Income
- **Page title:** HOME - RADIUS TOPSETTING.COM  
- **URL:** `/#report-daily`  

### 10.3 Period Income
- **Page title:** HOME - RADIUS TOPSETTING.COM  
- **URL:** `/#report-period`  

### 10.4 Payout
- **Page title:** Payout Report - RADIUS TOPSETTING.COM  
- **URL:** `/rad-reports/payout`  

### 10.5 Net Profit
- **Page title:** Profit Report - RADIUS TOPSETTING.COM  
- **URL:** `/rad-reports/profit`  

### 10.6 Statistics
- **URL:** `/rad-reports/statistics`  

### 10.7 Reset Reports
- **URL:** `/#clear-reports`  

---

## 11. Online Payment

### 11.1 NICEPAY
- **Page title:** NicePay Transactions - RADIUS TOPSETTING.COM  
- **URL:** `/rad-onlinepayment/nicepay-trx`  
- **Table columns:** Id, TRX Id, Reference, Customer, Plan, Status, TRX Time, Channel, Amount, Data Owner, Action.  
- **Filters/forms:** Show entries, Search; "Online Transaction record will be flushed, continue ?".  
- **Action buttons:** Reset History, Search Data, Search Customer, Search Voucher, Add Router, Export User to File, View Reports, Delete Report, Reset DB.  

---

## 12. Support Tickets

### 12.1 All Tickets
- **Page title:** Support Tickets - RADIUS TOPSETTING.COM  
- **URL:** `/rad-tickets/list`  
- **Table columns:** Id, Ticket Number, Customer ID, Email, Department, Priority & Subject, Status, Last Update, Data Owner, Action.  
- **Filters/forms:** Show entries, Search; Customer, Department, Priority, Subject, Message; "Are you sure to remove selected data ?", "Selected ticket will be closed, continue ?".  
- **Action buttons:** Create Ticket, Remove, Close Ticket, plus global search/export.  

### 12.2 Opened Tickets
- **URL:** `/rad-tickets/opened`  
- **Status:** **Inaccessible** — navigation timeout during audit (page may be slow or failing for demo).  

### 12.3 Closed Tickets
- **Page title:** Support Tickets - RADIUS TOPSETTING.COM  
- **URL:** `/rad-tickets/closed`  
- **Table columns:** Id, Ticket Number, Customer ID, Email, Department, Priority & Subject, Status, Closed By, Last Update, Data Owner, Action.  
- **Action buttons:** Same pattern as All Tickets.  

---

## 13. System Tools

### 13.1 Usage Report
- **URL:** `/#usage-info` (dashboard section).  
- **Key elements:** Usage info panel/section on dashboard.  

### 13.2 Import User
- **URL:** `/rad-import-csv/upload-file`  
- **Key elements:** CSV upload for user import.  
- **Note:** In one run, after navigation the page showed dashboard (possible redirect); Import User form may load on same URL.  

### 13.3 Export User
- **URL:** `/#export-data` (dashboard section).  

### 13.4 Backup Restore
- **URL:** `/rad-settings/dbstatus`  
- **Status:** **Inaccessible** for demo user — redirects to Access Denied (insufficient permission).  

### 13.5 Reset Database
- **URL:** `/#reset-db` (dashboard section).  
- **Special workflow:** Reset DB / "Warning !Back to default database ?" — destructive action.  

---

## 14. Software Logs

### 14.1 Activity Log
- **URL:** `/rad-activity/logs`  
- **Status:** **Inaccessible** for demo user — redirects to Access Denied.  

### 14.2 Radius Authentication Log
- **URL:** `/rad-auth-record/details`  
- **Status:** **Inaccessible** for demo user — redirects to Access Denied.  

---

## 15. Neighbor List

### 15.1 Neighbor List (root)
- **Page title:** Neighbor List - RADIUS TOPSETTING.COM  
- **URL:** `/rad-neighbor/list`  
- **Filters/forms:** Select Router, neighborlist, plus common user/customer/voucher filters.  
- **Table columns:** (Present; exact column set not enumerated in capture.)  
- **Action buttons:** Standard search/export set.  

---

## 16. PPPOE

- **Status:** **Not found** — no sidebar link discovered for "PPPOE" in any run. Menu may be hidden, absent in demo, or named differently.  

---

## Inaccessible / restricted

| Menu → Submenu / Item | Reason |
|------------------------|--------|
| **demo** (user profile link) | Redirects to **Access Denied** — demo user cannot open own profile edit (`/rad-settings/users-edit/12`). |
| **App Settings → User Management** | **Access Denied** — demo user lacks permission to `/rad-settings/users`. |
| **System Tools → Backup Restore** | **Access Denied** — demo user lacks permission to `/rad-settings/dbstatus`. |
| **Software Logs → Activity Log** | **Access Denied** — demo user lacks permission to `/rad-activity/logs`. |
| **Software Logs → Radius Authentication Log** | **Access Denied** — demo user lacks permission to `/rad-auth-record/details`. |
| **Support Tickets → Opened Tickets** | **Timeout** — `page.goto` to `/rad-tickets/opened` exceeded 30s (domcontentloaded). Page may be slow or error for demo. |

---

## Raw data

- **Click-based crawl (8‑min cap):** `audit-output/ui-audit-report.json`  
- **Full href-based crawl:** `audit-output/ui-audit-href-report.json`  
- **Targeted crawl (partial sidebar):** `audit-output/ui-audit-targeted-report.json`  

This report was generated by merging the above JSON outputs and normalising menu/submenu names and URLs.
