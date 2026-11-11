# CSI Operations - Master Architectural Guide & Sequential Dataflow Manual

---

## 1. Executive Summary & Purpose

**CSI Operations** is an enterprise-grade, institutional management platform built specifically for the **Computer Society of India (CSI) Student Branch** at **Rajagiri School of Engineering & Technology (RSET)**.

### The Real-World Operational Problem It Solves:
Managing an active technical student branch typically involves chaotic, disconnected tools:
* Event coordinators assigned manually in WhatsApp groups.
* Google Forms created by hand with inconsistent branding, wrong question formats, and misconfigured permissions (e.g., student email harvesting or requiring Google sign-in).
* Attendance sheets typed manually in Microsoft Word or Excel with misaligned tables.
* Feedback surveys manually constructed without mandatory NBA/NAAC Outcome-Based Education (OBE) course outcome (CO) and program outcome (PO) mapping.
* Certificate design and mail-merge workflows requiring Adobe Photoshop or local Python scripts to replace names, prone to typos and formatting bugs.

### The Unified Solution:
CSI Operations integrates the **entire lifecycle of a college event** into a single, cohesive web platform:
1. **Event Creation & Coordinator Workload Allocation** (tracking old vs. new coordinators, auto-balancing event counts).
2. **1-Click Google Drive Automation** (Google Apps Script webhooks automatically create official Google Forms and destination Google Sheets inside the club’s Drive folder).
3. **Institutional Document Generation** (Official Attendance Sheets with RSET/CSI crests, RSMS Notices, and Principal Permission Letters downloadable directly in `.docx` and `.pdf`).
4. **Outcome-Based Feedback Pipeline** (Dynamic Likert-scale surveys mapped directly to PO10 and PO11).
5. **Certificate Studio** (In-browser PPTX template parsing, merit winner selection for 1st/2nd/3rd place, and batch dual-folder ZIP export containing both custom PPTX and high-res vector PDFs).
6. **Cloud Database Sync** (Real-time synchronization with Supabase PostgreSQL and local offline caching).

---

## 2. Simple Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. CLIENT LAYER (BROWSER)                       │
│                                                                        │
│   ┌────────────────────┐   ┌───────────────────┐  ┌────────────────┐   │
│   │   Next.js React    │   │   ThemeContext    │  │  LocalStorage  │   │
│   │     Dashboard      │   │ (Light/Dark Mode) │  │  Fast Cache    │   │
│   └─────────┬──────────┘   └─────────┬─────────┘  └───────┬────────┘   │
└─────────────┼────────────────────────┼────────────────────┼────────────┘
              │                        │                    │
              ▼                        ▼                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               2. APPLICATION LOGIC & STORAGE ENGINE (SRC/)             │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      eventsStorage.ts                          │   │
│   │  • Syncs LocalStorage cache with cloud database                │   │
│   │  • Fires 'csi_events_updated' broadcast events                 │   │
│   │  • Calculates coordinator workload statistics                  │   │
│   └──────────┬─────────────────────────────┬───────────────────────┘   │
│              │                             │                           │
│              ▼                             ▼                           │
│   ┌──────────────────────┐      ┌──────────────────────────────┐       │
│   │ POST /api/google-form│      │   POST /api/convert-pptx     │       │
│   │ Webhook Dispatcher   │      │   Template Media Extractor   │       │
│   └──────────┬───────────┘      └──────────────┬───────────────┘       │
└──────────────┼─────────────────────────────────┼───────────────────────┘
               │                                 │
               ▼                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│             3. CLOUD BACKEND & EXTERNAL WORKSPACE SERVICES             │
│                                                                        │
│   ┌──────────────────────┐              ┌──────────────────────────┐   │
│   │   Supabase Postgres  │              │   Google Apps Script     │   │
│   │   Cloud Database     │              │   Deployments (Drive)    │   │
│   │   (events & members) │              │   (Forms & Sheets)       │   │
│   └──────────────────────┘              └──────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Tour: The Purpose of Every File & Folder

```
R:\VSCODE\CSI_Operations
├── public/                 # Static assets served at the root URL (/)
│   ├── logos/              # Official institutional PNG logos
│   │   ├── csi_logo.png    # CSI official emblem (used in headers & certificates)
│   │   └── rset_logo.png   # RSET college seal (used in attendance sheets & letters)
│   └── templates/          # Base template images
├── src/                    # All active application source code
│   ├── app/                # Next.js 14 App Router (pages and server endpoints)
│   │   ├── api/            # Serverless backend routes
│   │   │   ├── convert-pptx/route.ts  # PPTX slide extraction & preview
│   │   │   └── google-form/route.ts   # Webhook router for Google Apps Script
│   │   ├── events/         # Events Archive & Event Container
│   │   │   ├── [id]/       # Dynamic single event container
│   │   │   │   ├── certificates/
│   │   │   │   │   ├── page.tsx      # Dedicated Certificate Studio (Winner assignment & uploads)
│   │   │   │   │   └── pdf/page.tsx  # Advanced Visual Certificate Customizer & Vector PDF Studio
│   │   │   │   └── page.tsx          # Event Master Dashboard (Forms, Attendance, Realtime status)
│   │   │   └── page.tsx    # All Events Grid/Table with Search, Filter & KPIs
│   │   ├── members/page.tsx# Member Directory (23 coordinators, roles, domains)
│   │   ├── globals.css     # CSS variables, typography, light/dark mode overrides
│   │   ├── layout.tsx      # Root HTML shell, anti-flash script, ThemeProvider
│   │   └── page.tsx        # Executive Overview Dashboard (KPI stats & charts)
│   ├── components/         # Reusable React components
│   │   ├── CreateEventModal.tsx # Multi-step event creation wizard with coordinator pickers
│   │   ├── Navbar.tsx      # Fixed sidebar navigation & theme toggle
│   │   └── ThemeContext.tsx# Light/Dark React Context state manager
│   └── lib/                # Pure utility logic, data engines, exporters
│       ├── certificateExport.ts # PPTX XML manipulation, jsPDF generator, ZIP builder
│       ├── data.ts          # Default initial events (13) and members (23)
│       ├── documentExport.ts# HTML-to-PDF / Word generator for attendance & notices
│       ├── eventsStorage.ts # Core sync engine (LocalStorage + Supabase + DOM events)
│       ├── feedbackFormGenerator.ts # NBA/NAAC CO/PO question builder
│       ├── formScriptGenerator.ts   # Google Apps Script code & response mapping
│       ├── supabaseClient.ts        # Supabase JavaScript SDK initializer
│       └── types.ts         # TypeScript interfaces (CSIEvent, Member, Branch)
├── supabase/               # SQL database migrations & schemas
│   ├── 01_schema.sql       # Initial table definitions
│   ├── 02_seed_members.sql # Initial 23 member profiles
│   ├── 03_seed_events.sql  # 13 historical events with coordinator assignments
│   ├── 04_rls_policies.sql # Security policy definitions
│   └── 07_migration_sync.sql# Master sync migration (adds all rich columns & unlocks RLS)
├── .env.local              # Local private environment keys (NEVER pushed to GitHub)
├── .gitignore              # Rules telling Git which files to ignore
├── next.config.mjs         # Next.js build configuration (ESLint/TS build flags)
├── package.json            # Node.js project manifest & dependencies
└── tailwind.config.ts      # Custom CSI color tokens (purple, surface, sidebar, text)
```

### Why Certain Files Are in `.gitignore`:
* **`.env.local` / `.env`:** Contains your live database keys and secrets (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). If pushed to a public GitHub repo, scrapers and bots could abuse your database quota.
* **`node_modules/`:** The third-party dependencies downloaded by `npm`. This folder is thousands of files (>200 MB); committing it would bloat the Git history. Anyone running `npm install` reconstructs it in seconds.
* **`.next/` & `build/`:** Temporary compilation outputs generated whenever `next dev` or `next build` runs. They change on every save and are specific to your local operating system architecture.
* **`*.tsbuildinfo`:** TypeScript cache files that speed up local rebuilds.

---

## 4. End-to-End Sequential Dataflow

Here is what happens step-by-step from the exact moment a user opens the website to certificate export and database storage:

```
[1. User visits /]
       │
       ▼
[layout.tsx <head> script] ──► Checks localStorage('csi_theme') ──► Injects .light or .dark to <html> (0ms flash)
       │
       ▼
[page.tsx / events/page.tsx] ──► Calls getStoredEvents() in eventsStorage.ts
       │
       ├──► 1. Synchronously reads LocalStorage cache (Renders immediately in 0ms)
       │
       └──► 2. Asynchronously fetches supabase.from('events').select('*')
                 │
                 ▼
       [Supabase returns live rows] ──► Updates LocalStorage ──► Dispatches 'csi_events_updated'
                                                                           │
                                                                           ▼
                                                    [React state updates smoothly without refresh]

─────────────────────────────────────────────────────────────────────────────

[2. User creates an Event in CreateEventModal.tsx]
       │
       ▼
[saveNewEvent(newEvent) in eventsStorage.ts]
       │
       ├──► Generates UUID / ID ('e' + timestamp)
       ├──► Updates LocalStorage immediately
       ├──► Dispatches 'csi_events_updated' (UI shows event instantly)
       ├──► Updates assigned coordinators' workload counts (+1)
       │
       └──► Sends async REST to Supabase:
                 │
                 ├──► supabase.from('events').insert(...)
                 └──► supabase.from('members').update(events_coordinated_count)

─────────────────────────────────────────────────────────────────────────────

[3. User clicks "Create Form in Drive" on /events/[id]]
       │
       ▼
[src/app/api/google-form/route.ts]
       │
       ▼
[Registration Webhook (NEXT_PUBLIC_CSI_GOOGLE_WEBHOOK_URL)]
       │
       ├──► FormApp.create() creates Registration Form in CSI Google Drive
       │    └── Settings: No email harvest (collectEmail=false), unlimited responses (limitOne=false),
       │                  no response edits (allowEdits=false), no progress bar
       ├──► SpreadsheetApp.create() creates Destination Registrations Google Sheet
       ├──► Links Form responses to this Google Sheet
       │
       └──► Returns { formUrl, editUrl, sheetUrl, sheetId }
                 │
                 ▼
[src/app/events/[id]/page.tsx]
       │
       ├──► Saves links to event.google_form_url & event.google_sheet_url
       ├──► Saves links to Supabase via updateEvent()
       └──► UI reveals: "Live Student Form", "Edit in Forms", and "Sync Final Roster to Attendance"

─────────────────────────────────────────────────────────────────────────────

[4. User clicks "Sync Final Roster to Attendance"]
       │
       ▼
[Registration Webhook reads linked Google Sheet rows]
       │
       ▼
[mapGoogleFormResponsesToAttendance in formScriptGenerator.ts]
       │
       ├──► Maps Name, Email, Department, Division into event.registered_attendees
       └──► Saves to Supabase
                 │
                 ▼
[User clicks "Download Attendance Sheet"] ──► documentExport.ts generates official Word (.docx) & PDF

─────────────────────────────────────────────────────────────────────────────

[5. Outcome-Based Feedback Form & Live Projection QR Code]
       │
       ▼
[feedbackFormGenerator.ts]
       │
       ├──► Polished introduction header description (without awkward fragments)
       ├──► 2-Page Form Structure:
       │    ├── Page 1: 8 Attendee Verification Profile Fields (Name, UID, Email, Gender, Year, Branch, Sec, Phone)
       │    └── Page 2: Dynamic NBA PO10 (Communication) & PO11 (Project Management) Likert-scale questions
       ├──► Deploys via Feedback Webhook (NEXT_PUBLIC_CSI_FEEDBACK_WEBHOOK_URL)
       │    └── Settings: Limit 1 response per user (limitOneResponsePerUser=true), no email harvest, no edits
       ├──► Generates live on-screen downloadable QR code & short links for auditorium projection
       │
       └──► When participants submit, "Sync Sheet Responses" imports attendees into Certificate Pipeline

─────────────────────────────────────────────────────────────────────────────

[6. Dedicated Certificate Studio on /events/[id]/certificates & /pdf]
       │
       ▼
[Coordinator selects 1st, 2nd, 3rd Place Winners]
       │
       ▼
[Coordinator uploads .pptx PowerPoint template (or image)]
       │
       ▼
[Visual Certificate Customizer Studio (/events/[id]/certificates/pdf)]
       │
       ├──► Real-time interactive canvas with drag & slider coordinate positioning
       ├──► Dynamic Write-up Template interpolation ({name}, {position}, {event_name}, {date}, {venue})
       ├──► Automatic Superscript Ordinal Suffix Engine (1ˢᵗ, 2ⁿᵈ, 3ʳᵈ, 10ᵗʰ, 21ˢᵗ) in vector PDF typography
       │
       └──► User clicks "Download All Verified Certificates (ZIP)":
                 │
                 ├──► Winners_Appreciation_Certificates/: 1st, 2nd, 3rd Place high-res vector PDFs
                 ├──► Participation_Certificates/: Individual certificates for all verified attendees
                 └──► Browser delivers dual-folder .zip archive!
```

---

## 5. Detailed Breakdown of Each Pipeline

### Stage 1: Boot & Theme Architecture (`layout.tsx`, `ThemeContext.tsx`, `globals.css`)
1. **The Anti-Flash Script (`src/app/layout.tsx`):**
   When the browser first requests HTML, before React even mounts, an inline script in `<head>` executes:
   ```javascript
   const t = localStorage.getItem('csi_theme');
   if (t === 'light') document.documentElement.classList.add('light');
   else document.documentElement.classList.add('dark');
   ```
   This prevents the "white flash" or "dark flash" that plagues most client-side apps.
2. **The Theme Manager (`src/components/ThemeContext.tsx`):**
   Wraps `{children}`. It provides `theme` ("dark" | "light") and `toggleTheme()`. When clicked, it flips the class on `document.documentElement` and saves the preference to `localStorage.setItem('csi_theme', ...)`.
3. **The Styling Engine (`src/app/globals.css`):**
   Tailwind CSS is customized with semantic variables (`--background`, `--foreground`). In light mode (`html.light`), surfaces invert to crisp `#ffffff` and text becomes `#0f172a`, while in dark mode they revert to deep violet-black (`#0b0914`).

---

### Stage 2: The Hybrid Cache & Sync Engine (`eventsStorage.ts`)
To ensure the app feels instantaneous and never shows a blank loading spinner, it uses an **Optimistic Cache-First Strategy**:
1. **Read Path:**
   * When `getStoredEvents()` is called, it reads synchronously from `localStorage`.
   * It immediately returns the cached array, so the page renders in **0 milliseconds**.
   * If in a browser and 20 seconds have elapsed, it quietly fires `syncEventsWithSupabase()` in the background.
   * When Supabase responds with the latest database records, it updates `localStorage` and triggers:
     ```typescript
     window.dispatchEvent(new CustomEvent("csi_events_updated", { detail: mergedEvents }));
     ```
   * Any page listening to this event automatically updates its React state without reloading the browser.
2. **Write Path:**
   * When `saveNewEvent()` is called, it assigns a UUID (`crypto.randomUUID()`), prepends it to the local array, and writes to `localStorage`.
   * It dispatches `"csi_events_updated"` so the UI reflects the new event in less than 1 frame (16ms).
   * It asynchronously runs `supabase.from('events').insert(...)` to persist the event in the cloud.

---

### Stage 3: Event Wizard & Workload Balancing (`CreateEventModal.tsx`)
1. The coordinator opens the modal. It reads the 23 club members from `getStoredMembers()`.
2. As coordinators are selected for an event, the badge displays their classification:
   * **Old Coordinator:** Senior executive mentor.
   * **New Coordinator:** Junior coordinator gaining hands-on event leadership.
3. Upon submission:
   * The assigned coordinator names are saved into `event.assigned_coordinators: TEXT[]`.
   * The app increments `events_coordinated_count` for each assigned member in `members` table in Supabase.

---

### Stage 4: Google Drive Automation & Dual-Webhook Architecture (`/api/google-form/route.ts`)
1. In the event details page ([`src/app/events/[id]/page.tsx`](file:///r:/VSCODE/CSI_Operations/src/app/events/[id]/page.tsx)), Google Drive actions are routed through `/api/google-form`.
2. **Dual-Webhook Isolation:**
   * **Registration Webhook (`NEXT_PUBLIC_CSI_GOOGLE_WEBHOOK_URL`):**
     * Handles `create_form`, `toggle_registration`, `fetch_sheet_data`.
     * **CSI Institutional Settings:** `form.setCollectEmail(false)` (eliminates Google account sign-in barrier), `form.setLimitOneResponsePerUser(false)` (allows multiple students to register from shared college terminals), `form.setAllowResponseEdits(false)`, `form.setProgressBar(false)`.
     * Injects the 9 institutional RSET questions (Title, Name, Rajagiri Email, WhatsApp, Year, Department, Division, CSI Membership status, Membership ID).
     * Automatically provisions a linked Google Sheet: `"Event Name - Registrations (Responses)"`.
   * **Feedback Webhook (`NEXT_PUBLIC_CSI_FEEDBACK_WEBHOOK_URL`):**
     * Handles `create_feedback_form`, `toggle_feedback`, `fetch_feedback_sheet_data`.
     * **CSI Audit Settings:** `form.setCollectEmail(false)`, `form.setLimitOneResponsePerUser(true)` (enforces one submission per student for genuine NBA/NAAC evaluation), `form.setAllowResponseEdits(false)`.
     * Provisions a linked Google Sheet: `"Event Name - Feedback (Responses)"`.
3. The Next.js app receives these URLs, updates `event.google_form_url`, `event.feedback_google_form_url`, and the linked sheet IDs, synchronizing them to Supabase and the local cache.

---

### Stage 5: Attendance Sheet & Document Pipeline (`documentExport.ts`)
1. Once registrations close, the coordinator clicks **"Sync Final Roster to Attendance"**.
2. The webhook reads the rows of the Google Sheet and returns the student roster.
3. The names, roll numbers, and branches are mapped into `event.registered_attendees`.
4. When the coordinator clicks **Download Attendance Sheet**:
   * If `event.mode === "Online"`, the system notifies that physical attendance sheets are not applicable for online webinars.
   * If `event.mode === "Offline"`, [`documentExport.ts`](file:///r:/VSCODE/CSI_Operations/src/lib/documentExport.ts) generates:
     * **Official Attendance Sheet (.docx / .pdf):** Formatted with RSET and CSI headers, faculty coordinator signatures, and sign-in columns.
     * **Principal Permission Letter (.docx / .pdf):** Formatted institutional request letter addressed to the Principal.
     * **RSMS Notice (.docx / .pdf):** Clean text notice formatted for student intranet publication.

---

### Stage 6: Outcome-Based Feedback Pipeline & State Resilience (`feedbackFormGenerator.ts`)
1. Before event conclusion, the coordinator opens the Feedback section.
2. **Polished Header Description (`getFeedbackHeaderDescription`):**
   * Automatically formats a polite, professional invitation dynamically addressed to participants:
     > *"Please take a moment to share your valuable feedback and ratings for [Event Name], organized by the Computer Society of India (CSI) Student Branch, RSET.*  
     > *Thank you for participating – your feedback will help us improve and deliver even better events ahead!"*
3. **2-Page Form Structure:**
   * **Page 1: Attendee Profile Verification (8 Required Fields):**
     1. Name (as required in certificate)
     2. UID
     3. UID Email
     4. Gender (Mr / Mrs)
     5. Year of Study
     6. Branch (filtered to event target branches)
     7. Section (Alpha, Beta, Gamma, Delta, Nil)
     8. WhatsApp Number
   * **Page 2: Event-Specific CO/PO Evaluation:**
     * Dynamic Likert questions mapped directly to **PO10 (Communication)** and **PO11 (Project Management)**.
4. **State Resilience & Anti-Flicker Architecture:**
   * In `src/app/events/[id]/page.tsx`, local storage cache takes precedence upon creation completion.
   * Event listeners read directly from local state rather than firing premature remote database reads, preventing the UI from bouncing between creation and live states during database writes.
5. **Projector-Ready Projection:**
   * Generates live on-screen downloadable QR code canvas (`qrcode`) and short links for instant projection on auditorium displays.

---

### Stage 7: Dedicated Certificate Studio & Vector PDF Engine (`certificates/page.tsx`, `certificates/pdf/page.tsx`, `certificateExport.ts`)
1. **Attendee Loading & Verification:**
   Synced feedback responses directly populate verified attendees into the certificate roster.
2. **Winner Selection:**
   Coordinators select 1st, 2nd, and 3rd place winners from searchable attendee dropdowns with full multi-winner support.
3. **Advanced Visual Customizer Studio (`/events/[id]/certificates/pdf`):**
   * **Interactive Drag & Slider Canvas:** Real-time visual manipulation of text coordinates (X %, Y %, Font Size, Alignment, Color) for Name, Details, Date/Venue, and Faculty Signatures.
   * **Superscript Ordinal Typography Engine:** Automatically parses merit positions (e.g., `1st`, `2nd`, `3rd`, `10th`, `21st`) and renders clean vector superscript typography (`1ˢᵗ`, `2ⁿᵈ`, `3ʳᵈ`) in jsPDF by dynamically scaling character heights (0.55x) and shifting vertical baselines.
   * **Dynamic Write-Up Interpolation:** Custom templates support placeholders `{name}`, `{position}`, `{event_name}`, `{date}`, `{venue}` with instant live canvas previews.
4. **Dual-Folder Batch ZIP Export (`certificateExport.ts`):**
   Client-side packaging with `JSZip` delivers a clean, organized `.zip` containing:
   * `Winners_Appreciation_Certificates/`: High-resolution vector PDFs for 1st, 2nd, and 3rd place awardees.
   * `Participation_Certificates/`: Individual verified vector PDFs for all attendees.

---

## 6. Supabase Database Schema Reference

The platform uses two tables connected by coordinator name arrays:

### `events` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `TEXT PRIMARY KEY` | Unique ID (e.g. `'e1'` or UUID) |
| `event_name` | `TEXT NOT NULL` | Title of the event |
| `event_date` | `TEXT NOT NULL` | Date in `'YYYY-MM-DD'` format |
| `time_start` / `time_end` | `TEXT` | Event time window |
| `mode` | `TEXT DEFAULT 'Offline'` | `'Offline'` or `'Online'` |
| `venue` | `TEXT` | Auditorium, Lab, or HackerRank platform |
| `target_branches` | `TEXT[]` | Target student branches (`CSE`, `IT`, `CSBS`, etc.) |
| `status` | `TEXT` | `'planned'`, `'confirmed'`, `'completed'` |
| `assigned_coordinators` | `TEXT[]` | Array of student coordinator names |
| `google_form_url` | `TEXT` | Published Google Form link |
| `google_form_edit_url` | `TEXT` | Google Form edit link |
| `google_form_id` | `TEXT` | Google Form Drive file ID |
| `google_sheet_url` | `TEXT` | Linked Registrations Google Sheet URL |
| `google_sheet_id` | `TEXT` | Registrations Google Sheet file ID |
| `is_registration_closed` | `BOOLEAN` | Whether registration submissions are locked |
| `registered_attendees` | `JSONB` | Array of students registered from Google Sheet |
| `feedback_google_form_url` | `TEXT` | Published Feedback Google Form link |
| `feedback_google_form_edit_url` | `TEXT` | Feedback Google Form edit link |
| `feedback_google_form_id` | `TEXT` | Feedback Google Form Drive file ID |
| `feedback_google_sheet_url` | `TEXT` | Linked Feedback Google Sheet responses URL |
| `feedback_google_sheet_id` | `TEXT` | Feedback Google Sheet file ID |
| `is_feedback_closed` | `BOOLEAN` | Whether feedback submissions are locked |
| `feedback_attendees` | `JSONB` | Array of verified students who submitted feedback |
| `winners` | `JSONB` | JSON object containing `first_place`, `second_place`, `third_place` |
| `certificate_templates` | `JSONB` | Custom template coordinate offsets & background image |
| `certificate_writeups` | `JSONB` | Custom write-up body text templates |
| `custom_feedback_questions` | `JSONB` | Event-specific CO/PO survey questions |

### `members` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID / TEXT PRIMARY KEY` | Member unique identifier |
| `name` | `TEXT NOT NULL` | Full student name |
| `role` | `TEXT` | Leadership designation (e.g. President, Creative Lead) |
| `domain` | `TEXT` | Domain (`Executive`, `Operations`, `Technical`, etc.) |
| `class_batch` | `TEXT` | Semester & Class (e.g. `S7 CS A`, `S5 CSBS`) |
| `member_type` | `TEXT` | `'old_coordinator'` or `'new_coordinator'` |
| `is_active` | `BOOLEAN` | Active term status (`true` / `false`) |
| `events_coordinated_count` | `INTEGER` | Real-time count of events coordinated |

---

## 7. Recent Operational Upgrades & Change Log Summary

The following major upgrades have been designed, tested, and implemented in the CSI Operations platform:

### 1. Dual Independent Webhook Architecture
* **Decoupled Workflows:** Split Google Apps Script webhooks into `NEXT_PUBLIC_CSI_GOOGLE_WEBHOOK_URL` (registrations) and `NEXT_PUBLIC_CSI_FEEDBACK_WEBHOOK_URL` (feedback) to allow independent deployments and permissions.
* **Institutional Permissions Configured:**
  * Registration forms configured with `setCollectEmail(false)` and `setLimitOneResponsePerUser(false)` so students can register rapidly without email login gates.
  * Feedback forms configured with `setLimitOneResponsePerUser(true)` to enforce strict 1-response-per-student compliance for NBA/NAAC auditing.

### 2. Dedicated Certificate Visual Customizer Studio (`/pdf`)
* **Real-time Visual Layout:** Added `/events/[id]/certificates/pdf` featuring interactive sliders and draggable visual elements directly over high-resolution certificate templates.
* **Vector Superscript Ordinal Engine:** Implemented proportional ordinal typography in jsPDF (`1ˢᵗ`, `2ⁿᵈ`, `3ʳᵈ`, `10ᵗʰ`, `21ˢᵗ`), ensuring certificates render with publication-grade typography.
* **Dynamic Template Placeholders:** Supported `{name}`, `{position}`, `{event_name}`, `{date}`, `{venue}` interpolation with live instant preview.
* **Clean Batch ZIP Packaging:** Configured `JSZip` to generate neatly organized dual folders (`Winners_Appreciation_Certificates/` and `Participation_Certificates/`) containing high-res vector PDFs.

### 3. State Resilience & Anti-Flicker Architecture
* **Race Condition Fix:** Resolved an asynchronous race condition during Google Drive form generation where out-of-order Supabase sync queries briefly wiped out newly assigned form URLs, eliminating the visual button flicker.
* **Optimistic Local Cache Precedence:** Event state transitions now render immediately from local storage cache while background syncing occurs smoothly without interrupting the user.

### 4. Professionalized Feedback Form Presentation
* **Refined Header Descriptions:** Replaced awkward sentence fragments in `getFeedbackHeaderDescription()` with a polite, standardized invitation to share feedback while preserving mandatory appreciation notices.
* **Direct Presentation Integration:** Enabled on-screen projector-ready QR codes and shortened URLs for effortless auditorium displays during event conclusions.

