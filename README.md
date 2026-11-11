# CSI Operations Platform 🚀

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

An enterprise-grade operational orchestration and event automation platform built for the **Computer Society of India (CSI) Student Branch** at **Rajagiri School of Engineering & Technology (RSET)**.

CSI Operations integrates the **entire lifecycle of a technical student branch** into a single web application: from event container creation, workload-balanced coordinator allocation, and institutional letters, to 1-click Google Drive forms, live attendance mapping, NBA/NAAC outcome-based feedback surveys, and a visual Certificate Studio with vector superscript typography.

---

## 🌟 Interactive Public Sandbox (Air-Gapped Demo Mode)

This repository is configured to run in **100% Client-Side Sandbox Mode**:
- **Zero Cloud Database Required**: Supabase connections are neutralized. All events, members, and rosters persist purely in your browser's `localStorage`.
- **Zero External Webhooks**: Form creation and responses sync are simulated locally on your device without communicating with Google Drive.
- **Pre-Loaded Sample Data**:
  - **Planned Event Container**: *CodeStorm 2026 – State Hackathon* (ready for testing coordinator allocation and letter generation).
  - **Ongoing Event Container**: *AI & Neural Agents Bootcamp* (pre-populated with **25 registered attendees** across various branches for testing attendance sheets).
  - **Completed Flagship Container**: *Off the Script* (pre-populated with **20 feedback responses**, 1st/2nd/3rd place merit winners, and linked to the **Certificate Studio**).
- **1-Click Reset**: Use the **"🔄 Reset Demo Data"** banner button anytime to restore fresh sample data.

---

## 🚀 Quick Start: How to Fork & Run Locally

### Option A: Run Instantly in Sandbox Mode (No Setup Required)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/CSI_Operations.git
   cd CSI_Operations
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).  
   *Everything runs immediately on your machine with full interactivity!*

---

### Option B: Connect to Your Own College Club's Database & Google Drive

If you want to deploy this system for your own university or tech chapter:

1. **Create your `.env.local` configuration**:
   ```bash
   cp .env.example .env.local
   ```

2. **Connect Supabase PostgreSQL (Optional)**:
   - Create a free project at [supabase.com](https://supabase.com).
   - In Supabase SQL Editor, execute the migration scripts located in `/supabase`.
   - Paste your project URL and Anon Key into `.env.local`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Connect Google Drive Webhook Automation (Optional)**:
   - Open [script.google.com](https://script.google.com) in your club's Google Workspace account.
   - Deploy the provided Apps Script generators (found in `src/lib/formScriptGenerator.ts` and `src/lib/feedbackFormGenerator.ts`) as a Web App (Access: Anyone).
   - Paste the deployment URLs into `.env.local`:
     ```env
     NEXT_PUBLIC_CSI_GOOGLE_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
     NEXT_PUBLIC_CSI_FEEDBACK_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
     ```

4. **Deploy with Vercel**:
   - Push your fork to GitHub and import it on [Vercel](https://vercel.com).
   - Add your environment variables in Vercel project settings and click **Deploy**!

---

## 💎 Key Architectural Systems

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CSI OPERATIONS LIFECYCLE                        │
│                                                                        │
│  Event Creation ➔ Workload Allocation ➔ Approvals (RSMS/Permission)    │
│                           │                                            │
│                           ▼                                            │
│  Registration Form ➔ Attendance Sign-in ➔ Outcome Feedback (PO10/11)  │
│                           │                                            │
│                           ▼                                            │
│  Merit Winner Selection ➔ Visual Certificate Studio ➔ Batch ZIP Export │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Coordinator Workload Balancing Engine
- Distinguishes between **Old Coordinators** (Senior executive mentors) and **New Coordinators** (Junior leads gaining hands-on event leadership).
- Tracks individual event counts (`events_coordinated_count`) in real time.
- Displays visual indicators in the event wizard to prevent coordinator burnout and ensure equitable task distribution.

### 2. Institutional Document Generator (`documentExport.ts`)
- **Official Attendance Sign-In Sheets**: Automatically formats student tables, faculty sign-off blocks, and official RSET & CSI emblems (Exportable in **Word `.docx`** and **Vector `.pdf`**).
- **Principal Permission Letters**: Generates formal institutional requests addressed to college leadership with date, venue, and faculty coordinator endorsements.
- **RSMS Student Intranet Notices**: Formats announcements ready for student portals.

### 3. Dual-Webhook Google Drive Automation
- **Registration Pipeline**: Automatically deploys a branded Google Form with department choices and connects it to a live Google Sheet without email login barriers.
- **Outcome-Based Feedback Pipeline**: Generates an accredited 2-page survey:
  - **Page 1**: 8 mandatory verification fields (Name as required in certificate, UID, Email, Gender, Year, Branch, Section, WhatsApp No).
  - **Page 2**: Evaluates criteria mapped directly to **PO10 (Communication)** and **PO11 (Project Management)**.
- **Auditorium Projector Display**: Generates high-definition on-screen QR codes for live projection during event conclusions.

### 4. Dedicated Visual Certificate Studio (`/certificates/pdf`)
- **Interactive Drag & Slider Canvas**: Real-time visual manipulation of text coordinates (X %, Y %, Font Size, Alignment, Color) for Name, Details, Date/Venue, and Faculty Signatures.
- **Superscript Ordinal Typography Engine**: Automatically parses merit positions (`1st`, `2nd`, `3rd`, `10th`, `21st`) and renders clean vector superscript typography (`1ˢᵗ`, `2ⁿᵈ`, `3ʳᵈ`) in jsPDF by dynamically scaling character heights (0.55x) and elevating the vertical baseline.
- **Dynamic Write-Up Interpolation**: Supports dynamic placeholders `{name}`, `{position}`, `{event_name}`, `{date}`, `{venue}` with instant live preview.
- **Batch Dual-Folder ZIP Export**: Pure client-side packaging via `JSZip` delivering two organized folders:
  - `Winners_Appreciation_Certificates/` (1st, 2nd, 3rd place PDFs)
  - `Participation_Certificates/` (Individual verified attendee PDFs)

---

## 📂 Project Structure

```
├── public/                 # Static assets, institutional crests & template previews
│   └── logos/              # CSI and RSET high-resolution emblems
├── src/
│   ├── app/                # Next.js 14 App Router
│   │   ├── api/
│   │   │   └── google-form/route.ts # Mock Google Drive API dispatcher
│   │   ├── events/         # Event management hub & active containers
│   │   │   ├── [id]/       # Dynamic single event container
│   │   │   │   ├── certificates/
│   │   │   │   │   ├── page.tsx     # Certificate Studio (Winner assignment)
│   │   │   │   │   └── pdf/page.tsx # Visual Certificate Customizer Studio
│   │   │   │   └── page.tsx         # Event Master Container (Forms, Attendance)
│   │   │   └── page.tsx    # Events Archive with Filters & Search
│   │   ├── members/page.tsx# Member Directory & Coordinator Workload Table
│   │   ├── globals.css     # Tailwind styling & dark/light mode tokens
│   │   ├── layout.tsx      # Root shell with anti-flash script & DemoBanner
│   │   └── page.tsx        # Central Operations KPI Dashboard
│   ├── components/         # Reusable React components
│   │   ├── CreateEventModal.tsx # Multi-step event creation wizard
│   │   ├── DemoBanner.tsx  # Sandbox mode indicator & Reset button
│   │   ├── Navbar.tsx      # Fixed navigation sidebar with theme toggler
│   │   └── ThemeContext.tsx# Light / Dark mode state manager
│   └── lib/                # Pure business logic & document engines
│       ├── certificateExport.ts     # Vector jsPDF & JSZip batch packaging
│       ├── data.ts                  # Default sample members & event containers
│       ├── documentExport.ts        # Word & PDF Attendance/Letter generator
│       ├── eventsStorage.ts         # Hybrid LocalStorage sync engine
│       ├── feedbackFormGenerator.ts # NBA/NAAC Outcome survey generator
│       ├── formScriptGenerator.ts   # Google Apps Script code generators
│       ├── supabaseClient.ts        # Neutralized client in sandbox mode
│       └── types.ts                 # TypeScript domain interfaces
├── supabase/               # SQL database migration files
├── .env.example            # Environment variables template
├── next.config.mjs         # Next.js build configuration
├── package.json            # Node.js dependencies
└── tailwind.config.ts      # Custom theme color definitions
```

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE) — feel free to fork, adapt, and deploy it for your student branch, college club, or tech organization!
