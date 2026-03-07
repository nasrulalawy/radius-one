# MixRadius Manager – Menu & Page Content Report

**Source:** Built from [MixRadius official features](https://mixradius.com/fitur-mixradius/), product documentation, and the menu structure you provided.  
**Note:** This was not captured by live browser navigation (no browser automation available). Demo: https://demo.mixradius.com:2143/ (user: `demo`, password: `demo`).

---

## Users Session

### Hotspot
- **Page title/header:** Hotspot sessions / User session (Hotspot)
- **Main content:** List of active hotspot sessions; online user count; session duration and traffic.
- **Table columns (typical):** Username, IP, MAC, NAS/Router, Uptime, Download/Upload, Session ID, Actions (disconnect).
- **Filters:** Username, router, date range.
- **Action buttons:** Disconnect session, Refresh, Export.

### PPP
- **Page title/header:** PPP sessions / User session (PPP/PPPoE)
- **Main content:** Active PPPoE (or PPtP/L2TP/SSTP/OpenVPN) sessions; online count.
- **Table columns (typical):** Username, IP, NAS, Uptime, Download/Upload, Session ID, Actions.
- **Filters:** Username, NAS, date range.
- **Action buttons:** Disconnect, Refresh, Export.

---

## Dashboard

### (Main dashboard – no submenu)
- **Page title/header:** Dashboard
- **Main content:** Summary cards (revenue, active users, expiring soon, unpaid invoices); charts (monthly revenue, traffic); quick links; operator/reseller balance or stats when applicable.
- **Sections/cards:** Revenue summary, User online/expire monitoring, Unpaid invoices, Payment gateway summary, Recent activity or alerts.
- **Action buttons:** Refresh, possible shortcuts to Add User, Add Voucher, View Reports.

---

## App Settings

### General Settings
- **Page title/header:** General Settings
- **Main content:** Global application options.
- **Form fields:** Company name, timezone, date format, currency, session timeout, default language, prepaid/postpaid defaults, customer ID format (auto/custom).
- **Action buttons:** Save, Reset.

### Localisation
- **Page title/header:** Localisation
- **Main content:** Language and regional settings.
- **Form fields:** Default language, date/time format, number format, timezone, optional custom labels.
- **Action buttons:** Save.

### User Management
- **Page title/header:** User Management (operators/reseller accounts)
- **Main content:** List of operator/reseller accounts; isolated per-operator data.
- **Table columns (typical):** Username, Role (operator/manager), Balance/Deposit, Permissions, Status, Created, Actions.
- **Form fields (add/edit):** Username, password, role, permissions (profile ownership, API Hotspot view/manage, API PPPoE view/manage), deposit/topup.
- **Action buttons:** Add user, Edit, Delete, Topup/Deposit.

### Invoice Logo
- **Page title/header:** Invoice Logo / Invoice design
- **Main content:** Invoice branding and layout.
- **Form fields/options:** Logo upload, company name, address, footer text, invoice template selector; design described as “simple and menarik” (simple and attractive).
- **Action buttons:** Upload logo, Save, Preview invoice.

### SMS / Email / Whatsapp / Google Map / API / Payment Gateway
- **Page title/header:** Notifications & integrations (or split into sub-pages)
- **Main content:** Configuration for notifications and third-party APIs.
- **SMS:** API provider (NexMo, OneWaySMS, iSMS, MedanSMS Reguler); credentials; templates for new registration, due date, renewal.
- **Email:** SMTP (Gmail or custom); templates for registration, due date, renewal.
- **WhatsApp:** WABLAS, STARSENDER, or MESSAGEBIRD; templates (registration, due, renewal).
- **Google Map:** API key or embed for ODP/POP map (if used).
- **API:** MikroTik API options; optional webhook or external API settings.
- **Payment Gateway:** DUITKU, XENDIT, NICEPAY, MIDTRANS, IPAYMU, PAYPAL; per-gateway credentials; auto-renewal on successful payment.
- **Action buttons:** Save per section, Test send.

### Voucher Template
- **Page title/header:** Voucher Template
- **Main content:** Custom voucher print layout; “Template selector” and “Hotspot Domain Selector” at print time.
- **Form fields/options:** Template name; custom HTML editor; QRCode option; selector for template when printing; design options.
- **Action buttons:** Add template, Edit, Delete, Preview, Set default.

### Hotspot Domain
- **Page title/header:** Hotspot Domain
- **Main content:** Domains used for hotspot login page / DNS.
- **Table columns (typical):** Domain name, NAS/Router, Status, Actions.
- **Form fields:** Domain, optional NAS mapping.
- **Action buttons:** Add domain, Edit, Delete.

### Called Station
- **Page title/header:** Called Station
- **Main content:** RADIUS Called-Station-Id mapping (NAS identifier / SSID mapping for accounting).
- **Table columns (typical):** Called-Station-Id, Name/Description, NAS, Actions.
- **Form fields:** ID, name/description, NAS association.
- **Action buttons:** Add, Edit, Delete.

---

## Licence Info

### (No submenu)
- **Page title/header:** Licence Info / License Information
- **Main content:** Subscription and licence details.
- **Sections/cards:** Plan name (e.g. CM LITE 1, CM MED, CM PRO); expiry; user limit; features enabled; VPN radius access; backup/update status.
- **Action buttons:** Renew, Contact support (e.g. +62 817 7992 8444).

---

## Router [NAS]

### (No submenu)
- **Page title/header:** Router / NAS
- **Main content:** List of MikroTik routers (NAS) used for Hotspot/PPPoE.
- **Table columns (typical):** Router name, Address (IP/Domain/DDNS), Radius Secret, API status, Type (Hotspot/PPPoE), Actions.
- **Form fields (add router):** Router name, Router address (IP/domain/DDNS), Radius secret, API username, API password, API port (default 8728).
- **Action buttons:** Add router, Edit, Delete, Test connection, Copy script (for MikroTik).

---

## ODP | POP Data

### Manage ODP | POP
- **Page title/header:** Manage ODP | POP
- **Main content:** List of ODP/POP points (outdoor/point-of-presence equipment).
- **Table columns (typical):** ODP/POP name, Code, Location, Router/NAS, Status, Customer count, Actions.
- **Form fields:** Name, code, address/location, latitude/longitude, router link.
- **Action buttons:** Add, Edit, Delete, Export.

### View Map
- **Page title/header:** View Map / ODP POP Map
- **Main content:** Map view of ODP/POP locations (Google Map or similar).
- **Sections:** Map; list or sidebar with ODP/POP; click to see details.
- **Action buttons:** Filter by area, Refresh, Full screen.

---

## Service Plan

### Bandwidth
- **Page title/header:** Bandwidth / Bandwidth profile
- **Main content:** Bandwidth profiles (limit-at, max-limit, burst).
- **Table columns (typical):** Profile name, Limit At, Max Limit, Burst, Shared/Per-user, Actions.
- **Form fields:** Name, limit-at, max-limit, burst settings.
- **Action buttons:** Add, Edit, Delete.

### Profile Group
- **Page title/header:** Profile Group
- **Main content:** Grouping of profiles for assignment to plans or users.
- **Table columns (typical):** Group name, Profiles included, Actions.
- **Form fields:** Group name, select profiles.
- **Action buttons:** Add, Edit, Delete.

### Hotspot Profile
- **Page title/header:** Hotspot Profile
- **Main content:** Service plans for hotspot (time-based, quota-based, unlimited).
- **Table columns (typical):** Profile name, Type (time/quota/unlimited), Validity, Bandwidth, Price, Actions.
- **Form fields:** Name, type, validity (days/hours), quota (if any), bandwidth profile, price, router/NAS scope.
- **Action buttons:** Add, Edit, Delete.

### PPP Profile
- **Page title/header:** PPP Profile
- **Main content:** Service plans for PPP (PPPoE, PPtP/L2TP, SSTP/OpenVPN); static/dynamic IP option.
- **Table columns (typical):** Profile name, Type, Validity, Bandwidth, IP type, Price, Actions.
- **Form fields:** Same as hotspot plus IP (static/dynamic), PPP type.
- **Action buttons:** Add, Edit, Delete.

---

## Customers

### Hotspot Users
- **Page title/header:** Hotspot Users / Member Hotspot
- **Main content:** List of hotspot customers (prepaid/postpaid).
- **Table columns (typical):** Customer ID, Username, Name, Profile, Expiry, Status (active/expired/online), Balance, Actions.
- **Filters:** Status, profile, expiry range, search (name/username).
- **Form fields (add/edit):** Username, password, name, profile, validity, quota, MAC bind (Bind On Login), auto-isolate on expire.
- **Action buttons:** Add user, Edit, Delete, Extend, Export (CSV/Excel/Word), Print invoice.

### PPP Users
- **Page title/header:** PPP Users / Member PPP
- **Main content:** List of PPPoE (and other PPP) customers.
- **Table columns (typical):** Customer ID, Username, Profile, IP (static if any), Expiry, Status, Actions.
- **Filters:** Status, profile, NAS.
- **Form fields (add/edit):** Username, password, profile, static IP (optional), validity.
- **Action buttons:** Add, Edit, Delete, Extend, Export.

### Mapping Users
- **Page title/header:** Mapping Users
- **Main content:** Mapping between external IDs and radius users (e.g. voucher-to-user or payment-to-user mapping).
- **Table columns (typical):** External ID, Username, Type, Mapped at, Actions.
- **Form fields:** External ID, username, mapping type.
- **Action buttons:** Add, Edit, Delete, Import.

---

## Voucher Card

### Hotspot Voucher
- **Page title/header:** Hotspot Voucher
- **Main content:** Generated hotspot vouchers; supports Username+Password or Voucher code; QRCode.
- **Table columns (typical):** Code/Username, Password (masked), Profile, Validity, Status (used/unused), Created, Actions.
- **Filters:** Profile, status, prefix, date.
- **Form fields (generate):** Profile, quantity, validity, code pattern/prefix; template selector; hotspot domain selector for print.
- **Action buttons:** Generate voucher, Print (all/selected/by prefix), Export, Delete.

### PPP Voucher
- **Page title/header:** PPP Voucher
- **Main content:** PPP vouchers (same idea as hotspot).
- **Table columns (typical):** Code/Username, Password, Profile, Validity, Status, Actions.
- **Form fields:** Same as hotspot voucher for PPP profiles.
- **Action buttons:** Generate, Print, Export, Delete.

---

## Unpaid Invoice

### (No submenu)
- **Page title/header:** Unpaid Invoice / Tagihan Belum Dibayar
- **Main content:** Invoices not yet paid; separated by operator/reseller when applicable.
- **Table columns (typical):** Invoice no, Customer, Amount, Due date, Days overdue, Actions.
- **Filters:** Date range, customer, operator.
- **Action buttons:** Send reminder, Mark paid, Print, Export.

---

## Finance Report

### Payout
- **Page title/header:** Payout / Laporan Payout
- **Main content:** Payout reports (e.g. to resellers or expense payouts).
- **Table columns (typical):** Date, Recipient, Amount, Method, Status, Reference.
- **Filters:** Date range, recipient, status.
- **Action buttons:** Export, Print.

### Net Profit
- **Page title/header:** Net Profit / Laba Bersih
- **Main content:** Revenue minus cost/profit summary.
- **Sections/cards:** Period summary; revenue vs expense; net profit; optional chart.
- **Filters:** Date range, operator.
- **Action buttons:** Export, Print.

### Statistics
- **Page title/header:** Statistics / Statistik
- **Main content:** Revenue and usage statistics (e.g. monthly income); “Statistik laporan pendapatan bulanan”.
- **Sections/cards:** Revenue by month; user growth; payment gateway breakdown; operator/reseller stats.
- **Filters:** Year, month, operator.
- **Action buttons:** Export, Print.

---

## Online Payment

### (e.g. NICEPAY)
- **Page title/header:** Online Payment / Payment Gateway
- **Main content:** Payment gateway configuration and/or transaction list (DUITKU, XENDIT, NICEPAY, MIDTRANS, IPAYMU, PAYPAL).
- **Table columns (typical):** Transaction ID, Customer, Amount, Gateway, Status, Date, Actions.
- **Filters:** Gateway, status, date range.
- **Form fields (in settings):** Gateway enable, API keys, callback URL, auto-renewal toggle.
- **Action buttons:** Configure gateway, View transaction, Refund (if supported).

---

## Support Tickets

### All
- **Page title/header:** Support Tickets – All
- **Main content:** All support tickets.
- **Table columns (typical):** Ticket ID, Subject, Customer/User, Status, Priority, Created, Updated, Actions.
- **Filters:** Status, priority, date, assignee.
- **Action buttons:** New ticket, Reply, Close, Reopen.

### Opened
- **Page title/header:** Support Tickets – Opened
- **Main content:** Open tickets only.
- **Same structure as All, filtered to open status.**

### Closed
- **Page title/header:** Support Tickets – Closed
- **Main content:** Closed tickets only.
- **Same structure as All, filtered to closed status.**

---

## System Tools

### Import User
- **Page title/header:** Import User
- **Main content:** Bulk import users (CSV); “Support Import (CSV) dan Export Data”.
- **Form fields:** File upload (CSV); column mapping (username, password, profile, etc.); delimiter; option to update existing.
- **Action buttons:** Download sample CSV, Upload, Validate, Import.

### Backup Restore
- **Page title/header:** Backup Restore
- **Main content:** Database backup and restore; “Backup, restore dan reset (default database configuration) database”.
- **Sections:** Create backup; list of backups; restore; reset to default (if allowed).
- **Action buttons:** Create backup, Download backup, Restore, Reset default (with confirmation).

---

## Software Logs

### Activity Log
- **Page title/header:** Activity Log
- **Main content:** Admin/operator actions (login, user add/edit, settings change).
- **Table columns (typical):** Date/time, User, Action, Target (e.g. username), IP, Details.
- **Filters:** User, action type, date range.
- **Action buttons:** Export, Clear (if allowed).

### Radius Authentication Log
- **Page title/header:** Radius Authentication Log
- **Main content:** RADIUS auth/acct logs (accept/reject, session start/stop).
- **Table columns (typical):** Time, Username, NAS, Result (accept/reject), Session ID, IP.
- **Filters:** Username, NAS, result, date range.
- **Action buttons:** Export, Refresh.

---

## Neighbor List

### (No submenu)
- **Page title/header:** Neighbor List
- **Main content:** Typically MikroTik wireless or network “neighbors” (discovered devices); may show connected CPEs or nearby routers.
- **Table columns (typical):** Identity, Address, MAC, Signal, Interface, Last seen.
- **Filters:** Router, interface.
- **Action buttons:** Refresh, Export.

---

## PPPOE

### (No submenu)
- **Page title/header:** PPPoE / PPPOE
- **Main content:** PPPoE server status and/or PPPoE user/session summary (may overlap with Users Session > PPP).
- **Sections/cards:** PPPoE server status per NAS; active sessions count; optional graph.
- **Table columns (if user list):** Username, NAS, IP, Uptime, Traffic.
- **Action buttons:** Refresh, Disconnect (per session if listed).

---

## Summary Table

| Menu            | Submenu                          | Page content summary (bullets) |
|-----------------|----------------------------------|--------------------------------|
| Users Session   | Hotspot                          | Active hotspot sessions; table: user, IP, MAC, NAS, uptime, traffic; disconnect, refresh, export. |
| Users Session   | PPP                              | Active PPP sessions; same pattern as Hotspot for PPPoE/PPtP/L2TP/SSTP. |
| Dashboard       | —                                | Summary cards (revenue, users, unpaid); charts; quick actions. |
| App Settings    | General Settings                 | Company, timezone, currency, language, customer ID format; save. |
| App Settings    | Localisation                     | Language, date/time/number format, timezone; save. |
| App Settings    | User Management                  | Operator/reseller list; permissions, deposit; add/edit/topup. |
| App Settings    | Invoice Logo                     | Logo upload, invoice design; save, preview. |
| App Settings    | SMS/Email/WhatsApp/Map/API/Payment | SMS, Email, WhatsApp, Google Map, API, Payment gateway configs; test send. |
| App Settings    | Voucher Template                 | Custom voucher HTML; template selector; QRCode; preview. |
| App Settings    | Hotspot Domain                   | Domains for hotspot login; add/edit/delete. |
| App Settings    | Called Station                   | Called-Station-Id mapping for RADIUS; add/edit/delete. |
| Licence Info    | —                                | Plan, expiry, user limit, features; renew, support. |
| Router [NAS]    | —                                | List of routers; add with IP, secret, API; copy script, test. |
| ODP \| POP Data | Manage ODP \| POP                | ODP/POP list; name, code, location, router; map link. |
| ODP \| POP Data | View Map                         | Map of ODP/POP locations; filter, refresh. |
| Service Plan    | Bandwidth                        | Bandwidth profiles (limit-at, max-limit, burst); add/edit/delete. |
| Service Plan    | Profile Group                    | Groups of profiles; add/edit/delete. |
| Service Plan    | Hotspot Profile                  | Hotspot plans (time/quota/unlimited); validity, price; add/edit/delete. |
| Service Plan    | PPP Profile                      | PPP plans; same + static IP option; add/edit/delete. |
| Customers       | Hotspot Users                    | Hotspot members; extend, export, print invoice; filters. |
| Customers       | PPP Users                        | PPP members; extend, export; filters. |
| Customers       | Mapping Users                    | External ID to user mapping; add/edit/import. |
| Voucher Card    | Hotspot Voucher                  | Generate/print hotspot vouchers; template selector; export. |
| Voucher Card    | PPP Voucher                      | Generate/print PPP vouchers; export. |
| Unpaid Invoice  | —                                | Unpaid invoices list; reminder, mark paid, export. |
| Finance Report  | Payout                           | Payout list; export, print. |
| Finance Report  | Net Profit                       | Revenue vs cost; net profit; export. |
| Finance Report  | Statistics                       | Monthly revenue stats; charts; export. |
| Online Payment  | (e.g. NICEPAY)                   | Gateway config; transaction list; refund if supported. |
| Support Tickets | All / Opened / Closed            | Ticket list; new, reply, close; filters by status. |
| System Tools    | Import User                      | CSV upload; column mapping; validate, import. |
| System Tools    | Backup Restore                   | Create/download backup; restore; reset default. |
| Software Logs   | Activity Log                     | Admin action log; filter, export. |
| Software Logs   | Radius Authentication Log        | RADIUS auth/acct log; filter, export. |
| Neighbor List   | —                                | MikroTik neighbors (CPE/routers); refresh, export. |
| PPPOE           | —                                | PPPoE server status; active sessions; refresh/disconnect. |

---

*End of report. For exact labels and layout, log in at https://demo.mixradius.com:2143/ (demo/demo) and walk each menu.*
