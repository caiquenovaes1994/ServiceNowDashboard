<!-- markdownlint-disable MD012 MD031 MD033 MD041 -->

<div align="center">

🇺🇸 English | [🇧🇷 Português (PT-BR)](./README.pt-BR.md)

# 📊 ServiceNow Dashboard

> Integrated Operational Platform for Incident Management, Ticket Monitoring, NPS, SLA, Perfect Fix Analysis, and On-Call / Overtime Management

![Version 1.2.0](https://img.shields.io/badge/version-1.2.0-0ea5e9?style=flat&logo=semver&logoColor=white)
![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=node.js&logoColor=white)
![React 18.2.0](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat&logo=react&logoColor=black)
![Vite 5.4+](https://img.shields.io/badge/Vite-5.4%2B-646CFF?style=flat&logo=vite&logoColor=white)
![Express 4.18.2](https://img.shields.io/badge/Express-4.18.2-000000?style=flat&logo=express&logoColor=white)
![SQLite3 5.1.7](https://img.shields.io/badge/SQLite3-5.1.7-003B57?style=flat&logo=sqlite&logoColor=white)
![PDF pdfmake](https://img.shields.io/badge/PDF-pdfmake-FF6F00?style=flat)
![ExcelJS 4.4.0](https://img.shields.io/badge/ExcelJS-4.4.0-217346?style=flat&logo=microsoft-excel&logoColor=white)

</div>

---

## <a id="executive-summary"></a>📑 Executive Summary

The **ServiceNow Dashboard** is a unified enterprise platform designed to centralize **strategic performance analysis** (NPS, SLA, Perfect Fix), **real-time operational incident management**, and **on-call and overtime tracking and calculation**.

### 📌 Platform Operational Summary

| Pillar | Technical / Functional Highlight |
| :--- | :--- |
| **Architecture** | Modular frontend in React 18 + Vite and native backend in Node.js ESM + Express with an embedded SQLite 3 database. |
| **Metrics & Quality** | Automated CSV and JSON ingestion with business-hours SLA calculation (accounting for Brazilian national, São Paulo state, and municipal holidays) and Perfect Fix. |
| **Incident Operations** | Major Incidents support, child ticket linking, row drag & drop, dynamic filters, and visual inactivity alerts (+3d). |
| **Overtime & On-Call** | Official calculation (50% and 100%), salary history protection, overlap grouping, and midnight rollover handling (+1). |
| **Security & Auditing** | Master Password with Bcrypt, inactivity auto-lock (2 min), AES-256-GCM authenticated encryption for salary values, and debounced backups. |
| **Document Generation** | Executive A4 Landscape Timesheet generated directly in memory via **pdfmake** (100% Node.js) and XLSX export via **ExcelJS**. |
| **Identity & Autonomy** | Proprietary Vanilla CSS Design System (*Deep Blue* and *Wine*) with 100% local typography (zero dependency on external connections or CDNs). |

### 🧭 Table of Contents

- [📋 1. About the Project](#about-the-project)
- [✨ 2. Application Modules](#application-modules)
  - [📈 Analytical Module (Metrics & KPIs)](#analytical-module)
  - [🚨 Operational Incident Module](#operational-module)
  - [⏱️ Overtime Management Module (On-Call & Entries)](#overtime-module)
  - [⚙️ Base Records & Settings Module](#settings-module)
- [🛠️ 3. Tech Stack](#tech-stack)
- [📁 4. Directory Structure](#directory-structure)
- [🚀 5. How to Run](#how-to-run)
  - [Prerequisites](#prerequisites)
  - [1. Installing Dependencies](#installing-dependencies)
  - [2. Running in Development (Frontend + Backend)](#running-development)
  - [3. Running in Production](#running-production)
  - [4. Quick Startup on Windows (.bat)](#windows-startup)
- [📡 6. REST API Endpoints](#api-endpoints)
  - [Metrics & Analytics](#api-metrics)
  - [Incident Management](#api-incidents)
  - [Overtime & On-Call](#api-overtime)
  - [Base Records](#api-base-records)
- [⚙️ 7. Useful Commands](#useful-commands)
- [🎨 8. Typography & Visual Tokens](#typography-and-tokens)
- [📄 9. License](#license)
- [👨‍💻 10. Author](#developed-by)

---

## <a id="about-the-project"></a>📋 About the Project

The **ServiceNow Dashboard** is a unified enterprise solution built to centralize **strategic performance analysis** (NPS, SLA, Perfect Fix, volume), **real-time operational incident management**, and **on-call and overtime tracking and calculation**.

Built on a modern modular architecture (React 18 + Vite on the frontend, native ESM Express with SQLite on the backend, native Node.js engine (pdfmake) for high-fidelity corporate PDF rendering, and a **Vanilla CSS** Design System), the system operates autonomously, ultra-fast, and with end-to-end security.

---

## <a id="application-modules"></a>✨ Application Modules

### <a id="analytical-module"></a>1. 📈 Analytical Module (Metrics & KPIs)

- **8 Dynamic KPI Cards**: Quick overview of closed tickets YTD, closed per month, personal NPS, overall corporate NPS, SLA%, evaluated YTD, evaluations per month, and Perfect Fix rate.
- **Recharts Comparative Charts**:
  - NPS comparison (Personal vs. Company Overall Average) with dynamic best/worst month highlights.
  - Closed tickets volume vs. evaluated tickets.
  - SLA accuracy and Perfect Fix rate with target line (95%).
- **Collapsible Monthly Breakdown**: Expandable analytical table with CSS Grid animation for controlled editing of the current and previous month.
- **Unified Data Upload**:
  - ServiceNow CSV export ingestion with automatic business-hours SLA calculation (considering business hours and national, São Paulo state, and São Paulo municipal holidays) and Perfect Fix.
  - Corporate JSON ingestion (`asmt_metric_result.json`) for Overall NPS calculation.

### <a id="operational-module"></a>2. 🚨 Operational Incident Module

- **Sub-tab Views**: Instant switching between **Open** (`Abertos`) and **Resolved** (`Resolvidos`) incidents.
- **Smart Sorting**:
  - *Open* tab: Custom sorting with **native Drag & Drop (HTML5)** directly on the row via a visual handle (`GripVertical`), with instant database persistence.
  - *Resolved* tab: Automatic reverse chronological sorting by resolution date/time (most recent on top).
- **Major Incidents & Child Tickets**:
  - Dynamic top banner highlighting active massive occurrences (5+ tickets).
  - *"My Responsibility"* (`Minha Responsabilidade`) assignment tracking with synchronized counters.
  - Management and linking modal for child tickets associated with a Major Incident, with individual export.
- **Visual Highlight for Stale Incidents (+3 days)**:
  - Prominent visual alert on incident rows without updates for 3 or more days (soft amber background, glowing alert side bar, and pulsing `+3d` pill).
- **Quick Timestamp Update**:
  - Quick action button (`RotateCw`) in the date/time column to instantly update the last updated timestamp to the current time, recording a history entry without opening edit modals.
- **Interactive Footer Statistics**:
  - Dynamic *"Incidents by Hotel"* and *"Incidents by Assignee"* panels with proportional fill bars and quick click-to-filter toggles.
- **Animated Quick Search**:
  - Expandable and collapsible neon search bar with a quick-clear button.
- **Advanced XLSX Export**:
  - Professionally formatted Excel spreadsheets via **ExcelJS** with a dark executive header (`#1F2937`), zebra-striped rows (`#FFFFFF` and `#D9D9D9`), and automatic dedicated child sheets `(!) [Incident]` for each Major Incident.
  - Dynamic code-splitting with asynchronous loading of the export module only on demand.

### <a id="overtime-module"></a>3. ⏱️ Overtime Management Module (On-Call & Entries)

- **Secure Authentication & Inactivity Auto-Lock**:
  - Protected by a **Bcrypt**-encrypted Master Password (10 salt rounds).
  - **2-Minute Inactivity Timer**: Automatically locks the Overtime tab if there is no interaction (the timer keeps running even if the user temporarily navigates to other tabs).
  - Immediate manual lock button in the header.
- **Financial Security with AES-256-GCM Encryption**:
  - Base salary and financial snapshots are **encrypted with AES-256-GCM** (random 12-byte `IV` per record and integrity tag) before being persisted to the SQLite database (`overtime_config`, `chamados.valor_base_snapshot`, and `overtime_salary_history`).
  - No confidential financial or salary data is stored in plain text.
- **Immutability & Salary History Protection**:
  - Each entry records its own immutable `valor_base_snapshot`. Changing the salary in settings **does not retroactively alter** earnings and values from previous periods or entries.
  - Salary history table (`overtime_salary_history`) to intelligently support retroactively logged entries, ensuring they receive the salary in effect on the date of service.
- **Smart Entry Modal**:
  - **Type-ahead (Autocomplete)**: Hotel field with a dropdown dynamically filtered in real time as you type.
  - **Time Mask & Validation**: Automatic formatting to `HH:MM`.
  - **Overnight Rollover**: Automatic detection when the end time passes midnight, with a discreet `+1` visual indicator in the UI and accurate accounting split for the official timesheet.
  - **Data Loss Prevention**: The modal does not close on accidental backdrop clicks, requiring an explicit click on *Save* or *Cancel/Close*.
- **Automated Calculation & Overlap Grouping**:
  - Overlapping times on the same day are automatically merged (earliest start and latest end) without double-counting worked hours.
  - Accurate rate separation: **100%** for Sundays and holidays (calculated via Brazilian and SP holiday library) and **50%** for weekdays and Saturdays.
- **Centered Executive Analytical Cards**:
  - 4 symmetrically centered cards at the top: **Hours (50% / 100%)**, **Estimated Earnings** (private calculation), **Total Tickets**, and **Average Time per Ticket**.
  - Complete entries table with columns: *Date*, *Weekday*, *Case/INC*, *Hotel*, *Start*, *End*, *Duration*, *Rate*, *Reason*, *Notes*, and *Actions*.
  - Individual deletion and bulk deletion with multi-select checkboxes.
- **Official Timesheet PDF Generation & Download**:
  - Native Node.js generator integrated via **pdfmake** producing an official executive A4 Landscape document directly in memory.
  - Standardized 4-line header identical to the Excel template: Calibri typography (14px title, 11px body), `#D9D9D9` gray background on employee name, month, and year, and width aligned with the table.
  - Table with columns: `DIA`, `SEMANA`, `DATA`, `INÍCIO`, `INTERVALO`, `VOLTA`, `TÉRMINO`, `HORAS TRABALHADAS`, `Horas a Receber (50% / 100%)`, and `OBSERVAÇÕES`.
  - Two entries on the same day are organized into Start/Break and Return/End (`Início/Intervalo` and `Volta/Término`).
  - The **OBSERVAÇÕES** column in the PDF reflects **strictly and exclusively** what is entered in the notes field in the modal (no case number leakage or automatic text).
  - No monetary data and no unnecessary signature fields on the document.
- **Debounced Automatic Backups**:
  - On every insert, update, or delete in the Overtime module, an automatic SQLite backup is triggered with a 5-second debounce, protecting the database without disk overhead.
  - Instant manual download button for the database file (`dashboard.db`).

### <a id="settings-module"></a>4. ⚙️ Base Records & Settings Module

- Centralized in the **Settings** dropdown (gear icon) in the header.
- Complete CRUD for Hotels (RID, Name, Active/Inactive status) and Assignees (Name, Active/Inactive status).
- Real-time text search and status filters (*Active*, *Inactive*, *All*).
- **Full Pagination**: 20 items per page with smart numeric controls and ellipses.
- Standardized confirmation dialogs for safe deletions.

---

## <a id="tech-stack"></a>🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite 5 | Reactive rendering, ultra-fast HMR, and modularization |
| **Design System** | Pure Vanilla CSS | Executive *Deep Blue* and *Wine* design modularized across 9 CSS files |
| **PWA** | vite-plugin-pwa | Service Worker support, offline cache, and installable manifest |
| **Charts** | Recharts 2.12 | Interactive and responsive visualization of metrics and indicators |
| **Icons** | Lucide React | Clean, standardized SVG icon library (no external CDNs) |
| **Typography** | Local WOFF2 + TTF | 100% self-hosted fonts in dedicated directories with no external requests (Plus Jakarta Sans, Montserrat, JetBrains Mono, Calibri) |
| **XLSX Export** | ExcelJS 4.4 | Client-side generation of formatted, zebra-striped `.xlsx` spreadsheets |
| **PDF Generator** | Node.js + pdfmake | High-fidelity official A4 Landscape Timesheet generation in memory |
| **Holidays** | date-holidays | Accurate calculation of Brazilian national, state, and SP municipal holidays |
| **Backend** | Node.js + Express (ESM) | Native ECMAScript Modules RESTful API |
| **Database** | SQLite 3 | Embedded relational database in a single local file (`server/dashboard.db`) |
| **Encryption** | Node crypto + Bcrypt | Authenticated symmetric AES-256-GCM encryption for sensitive data and Bcrypt for passwords |
| **Auditing & Logs** | Winston | Chronological logging to file (`audit.log`) and SQLite table with automatic pruning |
| **Security** | Helmet + CORS | HTTP security headers and access control |
| **Backups** | Custom Scheduler | Debounced backups (5s) and automatic `.bak` file rotation |

---

## <a id="directory-structure"></a>📁 Directory Structure

```text
ServiceNowDashboard/
├── server/                          # Application Backend (native ESM)
│   ├── assets/                      # Server static assets
│   │   └── fonts/                   # Dedicated fonts for PDF rendering (Calibri TTF)
│   ├── controllers/                 # Business controllers
│   │   ├── IncidentController.js    # Incidents CRUD, reordering, and history
│   │   ├── HotelController.js       # Hotels CRUD
│   │   ├── ResponsibleController.js # Assignees CRUD
│   │   ├── MajorIncidentController.js# Major Incidents management
│   │   ├── OvertimeController.js    # Overtime CRUD, calculation, and KPIs
│   │   ├── OvertimeAuthController.js# Authentication, master password, and configs
│   │   └── BackupController.js      # Manual download and backup management
│   ├── services/                    # Specialized services
│   │   ├── CryptoService.js         # Symmetric AES-256-GCM encryption (Salaries and Snapshots)
│   │   ├── OvertimeTimeUtils.js     # Time handling, overlaps, and overnight rollover
│   │   ├── OvertimeHolidayService.js# Sunday and holiday calculation (100% vs 50%)
│   │   ├── OvertimePdfService.js    # In-memory Timesheet PDF streaming service
│   │   ├── OvertimePdfGenerator.js  # Node.js/pdfmake rendering engine (Official Timesheet)
│   │   ├── pdf_generator.js         # ESM JavaScript compatibility wrapper
│   │   ├── IncidentService.js       # Incident persistence rules
│   │   ├── MajorIncidentService.js  # Linked massive tickets logic
│   │   ├── AuditService.js          # System action auditing
│   │   └── BackupService.js         # Rotating backup routines
│   ├── routes/                      # RESTful API routes (/api/...)
│   │   └── api.js                   # Centralized endpoint mapping
│   ├── uploads/                     # Temporary upload and generation files (gitignored)
│   ├── backups/                     # Automatic rotating SQLite backups (gitignored)
│   ├── database.js                  # Database initialization, schema, and migrations
│   ├── dashboard.db                 # Main SQLite database (gitignored)
│   └── index.js                     # Express server entry point
├── src/                             # React Frontend
│   ├── components/
│   │   ├── common/                  # Shared components (Header, NavTabs, Pagination, Modals)
│   │   ├── incidents/               # Incident table, history modals, and major cards
│   │   ├── metrics/                 # KPI cards, Recharts charts, and metrics tables
│   │   ├── overtime/                # Overtime Module
│   │   │   ├── OvertimeModule.jsx   # Main container and state/auto-lock manager
│   │   │   ├── OvertimeDashboard.jsx# Centered KPIs, entries table, and actions
│   │   │   ├── OvertimeLockScreen.jsx# Lock screen and initial setup
│   │   │   ├── OvertimeRecordModal.jsx# Create/edit modal with autocomplete and overnight +1
│   │   │   └── OvertimeSettingsModal.jsx# Settings modal (employee, salary, password)
│   │   └── settings/                # Hotels and Assignees management modules
│   ├── styles/                      # Refactored Vanilla CSS Design System
│   │   ├── fonts.css                # Local self-hosted @font-face declarations (100% offline)
│   │   ├── tokens.css               # Colors, fonts, shadows, and transitions (Deep Blue)
│   │   ├── base.css                 # Reset, global typography, and scrollbars
│   │   ├── layout.css               # Dashboard grid, toolbar, clock, and footer
│   │   ├── cards.css                # Glassmorphism cards and status badges
│   │   ├── tables.css               # Zebra-striped tables, drag & drop, and alerts (+3d)
│   │   ├── forms.css                # Inputs, autocomplete, buttons, and neon search bar
│   │   ├── modals.css               # Floating modal windows with backdrop blur
│   │   ├── badges.css               # RID badges, status tags, and pulsing pills
│   │   ├── overtime.css             # Dedicated styles for the Overtime module (Wine theme)
│   │   └── index.css                # Unification entry point for all styles
│   ├── utils/
│   │   └── excelExport.js           # Async utility for XLSX export with ExcelJS
│   ├── App.jsx                      # Root component with navigation and tabs
│   └── main.jsx                     # React entry point with PWA registration
├── public/                          # Static assets, favicon, and manifest
│   └── fonts/                       # Local WOFF2 web typography (Plus Jakarta Sans, Montserrat, JetBrains Mono)
├── start_dashboard.bat              # Windows launcher with auto-restart on failure
├── package.json                     # Dependencies and npm scripts
├── vite.config.js                   # Build, proxy, and PWA configuration
└── eslint.config.js                 # Project linting rules
```

---

## <a id="how-to-run"></a>🚀 How to Run

### <a id="prerequisites"></a>Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher installed.
- npm (included in the Node.js installer).

### <a id="installing-dependencies"></a>1. Installing Dependencies

```bash
npm install
```

### <a id="running-development"></a>2. Running in Development (Frontend + Backend)

```bash
npm run dev
```

- **Frontend (Vite)**: `http://localhost:3002`
- **Backend (Express API)**: `http://localhost:5000` (with automatic proxy configured in Vite)

### <a id="running-production"></a>3. Running in Production

```bash
# Builds minified frontend files into the dist/ folder
npm run build

# Starts the Node.js server serving the API and static files from dist/
npm start
```

### <a id="windows-startup"></a>4. Quick Startup on Windows (Auto-Restart Script)

Double-click the file:

```text
start_dashboard.bat
```

Or run it via Command Prompt. The script monitors the process and automatically restarts services if any unexpected interruption occurs.

---

## <a id="api-endpoints"></a>📡 REST API Endpoints

### <a id="api-metrics"></a>Metrics & Analytics

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/metrics?year=2026` | Returns monthly analytical metrics for the specified year |
| `POST` | `/api/metrics` | Manually creates or updates a monthly metric (UPSERT) |
| `POST` | `/api/upload-metrics` | Processes ServiceNow CSV for SLA and Perfect Fix calculation |
| `POST` | `/api/upload-json` | Processes evaluation JSON for corporate Overall NPS calculation |

### <a id="api-incidents"></a>Incident Management

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/incidentes?status=Aberto` | Lists incidents filtered by status (*Aberto* or *Resolvido*) |
| `GET` | `/api/incidentes/:id` | Returns details of a specific incident |
| `POST` | `/api/incidentes` | Creates a new incident (and links tickets if it is a Major Incident) |
| `PUT` | `/api/incidentes/:id` | Updates incident data (or only update timestamp with `forcar_historico`) |
| `DELETE` | `/api/incidentes/:id` | Permanently deletes the incident, child tickets, and history |
| `PUT` | `/api/incidentes/reordenar` | Persists the new row order (Drag & Drop) via an array of IDs |
| `GET` | `/api/incidentes/:id/historico` | Returns the chronological status history of the incident |
| `GET` | `/api/incidentes/:id/chamados` | Returns all child tickets linked to the incident |
| `POST` | `/api/incidentes/:id/chamados` | Adds a child ticket to a massive (*Major*) incident |
| `DELETE` | `/api/chamados/:id` | Removes a linked child ticket |
| `GET` | `/api/incidentes-maiores` | Returns aggregated data of active Major Incidents |
| `POST` | `/api/incidentes-maiores/:num/toggle` | Toggles the analyst's responsibility flag on the Major Incident |

### <a id="api-overtime"></a>Overtime & On-Call

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/overtime/auth/status` | Checks if the module is configured and returns employee details |
| `POST` | `/api/overtime/auth/setup` | Initial setup with master password, employee, and base salary |
| `POST` | `/api/overtime/auth/verify` | Validates module unlock password |
| `PUT` | `/api/overtime/auth/config` | Updates name, base salary (AES-256), and/or master password |
| `GET` | `/api/overtime/chamados?mes=X&ano=Y` | Lists entries for the period with official KPI and rate calculations |
| `POST` | `/api/overtime/chamados` | Records a new overtime entry with salary snapshot |
| `PUT` | `/api/overtime/chamados/:id` | Updates an entry while preserving its original financial snapshot |
| `DELETE` | `/api/overtime/chamados/:id` | Deletes an overtime entry and triggers a debounced backup |
| `POST` | `/api/overtime/chamados/bulk-delete` | Bulk deletion of multiple entries |
| `GET` | `/api/overtime/download-pdf?mes=X&ano=Y` | Generates and downloads the official A4 Landscape Timesheet PDF |
| `GET` | `/api/backup/download` | Downloads the binary backup of the SQLite database (`dashboard.db`) |

### <a id="api-base-records"></a>Base Records

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/hoteis` | Lists registered hotels (supports optional filter `?rede=Accor` or `?rede=Intercity`) |
| `POST` | `/api/hoteis` | Registers a new hotel (Chain, Name, and optional RID for chains without RID such as Intercity) |
| `PUT` | `/api/hoteis/:id` | Updates hotel details or active/inactive status |
| `DELETE` | `/api/hoteis/:id` | Deletes a hotel from the catalog |
| `GET` | `/api/responsaveis` | Lists registered assignees |
| `POST` | `/api/responsaveis` | Registers a new assignee |
| `PUT` | `/api/responsaveis/:id` | Updates assignee name or status |
| `DELETE` | `/api/responsaveis/:id` | Deletes an assignee from the catalog |

---

## <a id="useful-commands"></a>⚙️ Useful Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts both the backend server and the Vite client simultaneously in development mode |
| `npm run server` | Starts only the Express backend (`server/index.js`) on port 5000 |
| `npm run client` | Starts only the Vite client (`localhost:3002`) |
| `npm run build` | Compiles the minified production bundle into `dist/` |
| `npm run lint` | Runs ESLint across the entire source code |
| `npm run preview` | Runs a local preview of the `dist/` folder |

---

## <a id="typography-and-tokens"></a>🎨 Typography & Visual Tokens

The project adopts a precise typographic hierarchy, documented in detail in the artifact [font_families_inventory.md](file:///C:/Users/caiqu/.gemini/antigravity-ide/brain/d1841552-cd8c-4025-9fc8-77014c0058a1/font_families_inventory.md):

- **`--font-main` (`Plus Jakarta Sans`)**: Main interface, body text, and operational tables.
- **`--font-title` (`Montserrat`)**: High-impact visual titles, modal headers, and KPIs.
- **`--font-mono` (`JetBrains Mono`)**: Tickets, tabular data, numeric values, and clock.
- **`Calibri`**: Used exclusively in the **PDF Timesheet**.

---

## <a id="license"></a>📄 License

This project is for internal corporate use under the **MIT** license. See the [LICENSE](LICENSE) file for more details.

---

<div align="center">

## <a id="developed-by"></a>👨‍💻 Developed by

**Caique Novaes**<br>
<sub>Support Analyst & Developer</sub>

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/caiquenovaes1994)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=flat&logo=gmail&logoColor=white)](mailto:caiquenovaes1994@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/caiquenovaes)
[![Telegram](https://img.shields.io/badge/Telegram-26A5E4?style=flat&logo=telegram&logoColor=white)](https://t.me/caiquenovaes1994)

Made with ❤️ and ☕ — *2024–2026*

</div>
