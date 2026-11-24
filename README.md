# ExamPro — Online Examination Management System

> **A modern, full-featured online examination and assessment management platform built with React 19, Vite, React Router DOM, and browser LocalStorage.**

ExamPro is a professional academic frontend web application designed to demonstrate the complete, production-grade architecture of a dual-role (Administrator and Student) examination platform without requiring an external backend or database.

---

## 🌟 Key Highlights & Feature Matrix

### 🛡️ Administrator Management Suite (`/admin/*`)
- **Executive Analytics Dashboard:** Key institutional KPIs (Total Students, Active Roster, Total Examinations, Published Tests, Total Attempts, Overall Score Average) with interactive Recharts visualizations (Monthly Participation & Score Distribution) and live institutional activity streams.
- **Candidate & Student Management:** Real-time search, status filtering (Active / Suspended), activation/deactivation controls, candidate details modal, and historical examination performance transcripts.
- **Examination Orchestrator:** Complete examination lifecycle management (Draft, Scheduled, Published, Closed), 10-point pre-publish integrity checklist (requiring >= 1 question, total marks > 0, valid availability window, and passing criteria), edit, soft-delete, and retake controls.
- **Question Bank Engine:** Centralized question repository with topic tagging, difficulty tiers (Easy, Medium, Hard), negative marking, marks allocation, answer rationales, and an interactive **Student-View Question Preview Modal**.
- **Results & Attempt Inspection:** Institutional assessment registry with search, score tier badges, and an itemized **Candidate Answer Sheet Inspection Modal** displaying submitted answers against verified answer keys.
- **System Governance & Factory Reset:** Protected administrative invariants (`admin@exampro.com` invariance, student elevation protection, immutable historical result snapshots) and a non-destructive **Factory Demo Reset Workflow** with safety confirmation modal.

### 🎓 Student Examination Portal (`/student/*`)
- **Student Dashboard:** Personalized candidate greeting, student identification code, key academic metrics (Total Attempted, Completed, Average Score %, Pass Rate %), and active examination catalogue.
- **Available Examinations Catalogue:** Category filtering, keyword search, sorting (Title, Duration, Marks), attempt status badges (Not Attempted, Attempted, Retake Allowed), and instant entry gates.
- **Upcoming Examination Schedule:** Chronological catalog of future assessments with scheduled start/end windows and countdown locks.
- **Pre-Flight Examination Instructions:** Mandatory technical specifications, scoring rules, passing criteria, and a required **Academic Integrity Declaration** checkbox prior to test initiation.
- **Distraction-Free Examination Engine (`/student/exam/:examId`):**
  - Fullscreen distraction-free layout with sticky header.
  - **Absolute countdown timer** resilient against browser tab switches, reloads, and computer sleep.
  - **5-State Question Palette** (Answered: Green, Not Answered: Coral, Marked for Review: Amber, Answered & Marked for Review: Purple, Not Visited: Gray).
  - Multi-tab concurrency protection with **stale-lease recovery** to prevent duplicate simultaneous attempts.
  - Automatic submission when the duration or scheduled deadline expires.
- **Detailed Scorecard & Performance Analytics:** Total marks, percentage, pass/fail badge, accuracy breakdown (Correct, Incorrect, Unanswered), and an itemized answer review featuring candidate selections, correct answers, and educational explanations.
- **Candidate Profile & History:** Personalized profile management, student ID display, and permanent historical scorecard archive.

---

## 📐 Architecture & Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime / Core** | [React 19](https://react.dev/) | Component architecture, hooks, concurrent rendering |
| **Build Tool** | [Vite 6](https://vitejs.dev/) | Lightning-fast HMR, Rollup code-splitting, tree-shaking |
| **Routing** | [React Router DOM 7](https://reactrouter.com/) | Declarative nested routing, role-based route guards |
| **Global State** | [React Context API](https://react.dev/reference/react/useContext) | `AuthContext` (sessions & RBAC), `ToastContext` (notifications) |
| **Persistence Engine** | Browser LocalStorage | Versioned (`exampro_v1_`) storage abstraction with safe JSON parsing |
| **Data Visualizations**| [Recharts 2.15](https://recharts.org/) | Performance charts and candidate distribution curves |
| **Iconography** | [Lucide React](https://lucide.dev/) | Clean, consistent SVG icon set |
| **Design System** | Custom CSS3 Tokens | Professional SaaS design system inspired by Linear & Stripe |

---

## 🗄️ Storage Engine & Data Integrity

ExamPro implements an enterprise-grade client-side storage architecture (`src/services/storageService.js`):

1. **Versioned Namespace (`exampro_v1_`):** Prevents collisions with other applications on the same origin.
2. **Safe JSON Parsing with Fallbacks:** Guarded read operations ensure corrupted records never crash the application.
3. **Storage Quota Notification:** Listens for `QuotaExceededError` and dispatches global recovery events.
4. **Multi-Tab Concurrency Guard with Stale-Lease Recovery:** Uses timestamped heartbeat locks (`tab_lock_${studentId}_${examId}`) with a 15-second timeout, allowing graceful lock recovery if a browser tab is accidentally terminated.
5. **Idempotent Result Persistence:** Safeguards against duplicate submissions resulting from rapid double-clicks or multiple tabs submitting simultaneously.
6. **Snapshot Result Immutability:** When an examination attempt is submitted, a frozen snapshot of the exam settings, question text, options, and scoring weights is permanently archived with the result. Subsequent admin edits or deletions never alter historical transcripts.

---

## 🚀 Quickstart & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` or `pnpm`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/exampro-online-examination-system.git
cd exampro-online-examination-system
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173` to explore ExamPro.

### 3. Build for Production
```bash
npm run build
```
Creates an optimized production bundle in `/dist` with route-level code splitting and isolated vendor chunks.

### 4. Preview Production Build
```bash
npm run preview
```

---

## 🔑 Predefined Demo Credentials

ExamPro comes pre-seeded with realistic institutional demo data on first launch:

### Institutional Administrator
| Field | Credential |
| :--- | :--- |
| **Role** | System Administrator |
| **Email** | `admin@exampro.com` |
| **Password** | `Admin@123` |
| **Privileges** | Full administrative rights over students, exams, question bank, and results |

### Sample Students
| Name | Email | Password | Student ID | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Morgan** | `alex.morgan@university.edu` | `Student@123` | `STD-2026-001` | Active (Sample Results Pre-seeded) |
| **Priya Sharma**| `priya.sharma@university.edu`| `Student@123` | `STD-2026-002` | Active |
| **David Kim**   | `david.kim@university.edu`   | `Student@123` | `STD-2026-003` | Active |
| **Marcus Vance**| `marcus.vance@university.edu`| `Student@123` | `STD-2026-004` | Suspended (Auth Testing) |

*Note: You can also register a new student account at any time using the Signup page (`/signup`).*

---

## 🧪 Comprehensive Automated Test Suites

ExamPro includes 5 automated test harnesses covering 197 end-to-end and integration assertions:

```bash
# 1. Authentication & RBAC Test Suite (28 tests)
npm run test:auth

# 2. Browser E2E Automation Audit via Chrome CDP (29 tests)
npm run test:e2e

# 3. Admin Management E2E Audit (24 tests)
npm run test:admin

# 4. Student Portal & Exam Engine Audit (29 tests)
npm run test:student

# 5. Critical Examination Engine Multi-Tab & Timer Audit (87 tests)
npm run test:critical
```

---

## 🌐 Production Deployment (Vercel Ready)

ExamPro is pre-configured for zero-configuration static deployment on [Vercel](https://vercel.com):

`vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This rewrite rule ensures client-side routing works seamlessly without 404 errors on direct URL visits or browser refreshes across all 15 routes.

---

## ⚠️ Academic Demonstration Disclosure & Production Roadmap

> **Educational Project Disclosure:**
> ExamPro was developed as a frontend engineering academic project demonstrating advanced React architecture, asynchronous client-side state synchronization, and UI design systems.
> In this academic edition, authentication sessions and data persistence are simulated using browser `LocalStorage`. LocalStorage credentials are accessible to scripts on the client and are intended solely for academic demonstration, grading, and local evaluation.

### Production Upgrade Roadmap
For production institutional deployments, the following backend integrations are recommended:
1. **Server-Authoritative Authentication:** Replace client-side mock hashing with Bcrypt/Argon2 password hashing, HTTP-only secure cookie JWT sessions, and Multi-Factor Authentication (MFA).
2. **Relational Database Backend:** Migrate LocalStorage schema to PostgreSQL / MySQL with ACID transactions, row-level locking, and foreign key cascades.
3. **Server-Authoritative Timer & Proctoring:** Enforce server-side timestamp validation via WebSocket/SSE to verify submitted answers against server-clock deadlines, paired with webcam/browser-blur proctoring telemetry.

---

## 📄 License
This project is open-source under the MIT License. Developed for academic evaluation and educational demonstration.

