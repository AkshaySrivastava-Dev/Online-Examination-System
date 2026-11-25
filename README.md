# VERITY — Beyond the Score

### Intelligent Examination & Assessment Management System

<p align="center">
  **A modern examination platform that goes beyond marks to deliver meaningful student performance intelligence.**
</p>

<p align="center">
  <img src="public/verity-favicon.svg" alt="VERITY Logo" width="72" />
</p>

<p align="center">
  <strong>React 19 · Vite 6 · JavaScript · Tailwind CSS · Framer Motion</strong>
</p>

---

## Overview

**VERITY — Beyond the Score** is a modern online examination and assessment management platform built with React 19, Vite 6, React Router DOM 7 and browser LocalStorage.

Designed as a comprehensive academic frontend application, VERITY demonstrates the architecture and functionality of a dual-role examination ecosystem consisting of an Administrator Portal and a Student Portal.

Unlike conventional examination systems that primarily focus on marks and final results, VERITY introduces a performance intelligence layer that helps students understand what they know, identify where they struggle and determine what they should improve.

The platform combines examination lifecycle management, automated evaluation, student analytics, adaptive assessment concepts, examination replay and integrity telemetry within a unified interface.

**Product Vision:** An examination result should not only tell students how much they scored. It should help them understand what they know, where they struggle and what they should improve.

---

## Key Highlights

- Dual-role architecture with dedicated Admin and Student portals.
- Complete examination lifecycle management.
- Centralized question bank with structured academic taxonomy.
- Distraction-free examination engine with timer and recovery mechanisms.
- ExamDNA learning intelligence and personalized study recommendations.
- Adaptive Assessment using Computerized Adaptive Testing concepts.
- ExamReplay for examination attempt inspection.
- ExamFair for examination integrity telemetry.
- Custom 3D isometric analytics visualizations.
- Professional dark and light themes.
- Custom VERITY branding, SVG logo and favicon.
- Responsive layouts and Framer Motion interactions.
- Automated functional and integration test suites.

---

# Feature Matrix

## 1. Administrator Management Suite

**Route:** `/admin/*`

### Executive Analytics Dashboard

Provides an institutional overview through key performance indicators:

- Total Students
- Active Students
- Total Examinations
- Published Tests
- Total Attempts
- Average Score

Additional capabilities:

- Examination participation analytics.
- Score distribution bands.
- Custom 3D isometric cubical bar charts.
- Recent institutional activity timeline.
- Interactive tooltips and examination statistics.

### Candidate & Student Management

- Centralized student directory.
- Real-time search and filtering.
- Active and suspended status management.
- Student activation and deactivation controls.
- Candidate details inspection.
- Historical examination performance.
- Individual student intelligence view.

### Examination Orchestrator

Manages the complete examination lifecycle:

- Draft
- Scheduled
- Published
- Closed

Features include:

- Examination creation and editing.
- Examination availability configuration.
- Soft deletion and retake controls.
- Pre-publication validation checklist.
- Question and marks validation.
- Passing criteria validation.
- Availability window validation.

The pre-publication checklist validates requirements such as at least one question, positive total marks, a valid examination window and passing criteria.

### Question Bank Engine

A centralized repository for examination questions.

Features:

- Subject and topic classification.
- Subject → Topic → Subtopic → Concept taxonomy.
- Easy, Medium and Hard difficulty levels.
- Marks allocation.
- Negative marking.
- Answer explanations and rationales.
- Interactive student-view question preview.
- Question filtering and management.

### Results & Attempt Inspection

Provides an institutional assessment registry.

Features:

- Searchable examination records.
- Candidate score inspection.
- Percentage and pass/fail indicators.
- Examination integrity indicators.
- Itemized candidate answer sheet.
- Submitted answers versus correct answer keys.
- Historical result inspection.
- Immutable result snapshots.

### System Governance & Data Integrity

- Role-based access restrictions.
- Administrative account protection.
- Student privilege elevation protection.
- Immutable historical result records.
- Non-destructive data handling.
- Protected administrative workflows.

---

## 2. Student Examination Portal

**Route:** `/student/*`

### Student Dashboard

A personalized academic overview containing:

- Candidate greeting and identification.
- Available examinations.
- Upcoming examinations.
- Completed examination count.
- Average score.
- Pass rate.
- Recent examination results.

### Available Examinations Catalogue

- Examination category filtering.
- Keyword search.
- Sorting by title, duration and marks.
- Attempt status indicators.
- Retake eligibility.
- Examination entry validation.

### Upcoming Examination Schedule

- Chronological examination catalogue.
- Scheduled start and end windows.
- Countdown and availability locks.
- Examination status information.

### Pre-Flight Examination Instructions

Before beginning an examination, students can review:

- Examination duration.
- Total marks.
- Passing criteria.
- Scoring rules.
- Technical instructions.
- Academic Integrity Declaration.

A required integrity declaration must be acknowledged before entering the examination.

### Distraction-Free Examination Engine

**Route:** `/student/exam/:examId`

The examination engine provides a focused testing environment.

Features:

- Fullscreen examination layout.
- Sticky examination header.
- Absolute countdown timer.
- Question navigation.
- Answer selection and persistence.
- Automatic submission.
- Recovery after reloads.
- Multi-tab concurrency protection.
- Examination deadline enforcement.

**Five-State Question Palette**

| State | Indicator |
|---|---|
| Answered | Green |
| Not Answered | Coral |
| Marked for Review | Amber |
| Answered & Marked for Review | Purple |
| Not Visited | Gray |

### Detailed Scorecard & Performance Analytics

After submission, students can review:

- Total marks.
- Score percentage.
- Pass/fail result.
- Correct answers.
- Incorrect answers.
- Unanswered questions.
- Candidate selections.
- Correct answer keys.
- Educational explanations.

### Candidate Profile & History

- Personalized profile management.
- Student identification details.
- Historical examination archive.
- Previous scorecards.
- Examination attempt records.

---

# 3. ExamDNA — Learning Intelligence

ExamDNA is VERITY's flagship performance intelligence module.

Its objective is to move beyond marks-based evaluation and provide actionable insights into student learning behaviour.

It analyzes examination data across multiple dimensions.

### Core Intelligence Dimensions

**1. Topic Mastery Analysis**

Identifies strong, developing and weak academic areas using examination performance and question taxonomy.

**2. Confidence Alignment**

Compares student confidence with actual answer correctness to identify overconfidence and underconfidence patterns.

**3. Time Intelligence**

Analyzes response time and question-level time expenditure to identify potentially difficult concepts and inefficient answering patterns.

**4. Answer Stability**

Examines answer revisions and changes during examinations.

**5. Weak Area Identification**

Classifies academic performance using evidence-based sample thresholds.

| Sample Size | Classification |
|---|---|
| Fewer than 3 attempts | Insufficient Data |
| 3–4 attempts | Preliminary Evidence |
| 5 or more attempts | Conclusive Evidence |

**6. Learning Priority Score**

A multi-factor score from 0–100 that prioritizes areas requiring attention.

The scoring model considers:

- Accuracy deficit — 35%
- Error recurrence — 25%
- Confidence misalignment — 15%
- Difficulty failure — 15%
- Trend and volatility — 10%

Weights are normalized when certain telemetry is unavailable.

### Revision vs. Relearning

| Classification | Reported Condition |
|---|---|
| Concept Relearning | Accuracy below 40% or repeated high-confidence errors |
| Targeted Revision | Accuracy between 40% and 69% |
| Practice Needed | Accuracy between 70% and 79%, or high average response time |
| Maintain Mastery | At least 80% accuracy with consistency |
| Insufficient Evidence | Fewer than 3 attempts |

### Personalized 7-Day Study Plan

- Automatically prioritized learning activities.
- Topic-level study recommendations.
- Daily completion tracking.
- Persistent progress.
- Revision and relearning guidance.

The study plan is designed to help students convert performance analysis into actionable learning activities.

---

# 4. Adaptive Assessment

VERITY introduces Computerized Adaptive Testing (CAT) concepts to provide a more responsive assessment experience.

Features:

- Dynamic question difficulty adjustment.
- Performance-based assessment progression.
- Estimated ability parameter (theta).
- Ability range from -3 to +3.
- Estimated percentile.
- Difficulty-based assessment indicators.

The assessment logic adjusts according to student performance and available assessment data.

---

# 5. ExamReplay — Examination Review

ExamReplay allows students and administrators to inspect completed examination attempts.

Features:

- Examination attempt review.
- Question-level answer inspection.
- Candidate response history.
- Answer revision details.
- Historical result context.
- Scorecard integration.

The module improves transparency by making examination outcomes easier to review.

---

# 6. ExamFair — Examination Integrity

ExamFair provides browser-based examination integrity telemetry.

It records relevant examination behaviour, including:

- Browser tab switching.
- Page visibility changes.
- Clipboard-related events.
- Rapid answer activity.
- Examination audit information.

These indicators help administrators review potentially unusual examination activity.

**Important:** Browser-based integrity signals are review indicators, not definitive proof of academic misconduct. They cannot guarantee detection of every form of cheating.

---

# Architecture & Technology Stack

VERITY follows a modular frontend architecture with reusable components, dedicated services and browser-based data persistence.

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | React 19 | Component architecture and UI |
| Build Tool | Vite 6 | Development server and production builds |
| Language | JavaScript | Application logic |
| Routing | React Router DOM 7 | Nested routes and route protection |
| Global State | React Context API | Authentication, sessions and notifications |
| Persistence | Browser LocalStorage | Client-side data storage |
| Data Visualization | Recharts | Analytics and chart rendering |
| Custom Graphics | SVG | 3D isometric visualizations |
| Animation | Framer Motion | Transitions and micro-interactions |
| Iconography | Lucide React | SVG icon system |
| UI Primitives | Radix UI | Accessible interface components |
| Styling | Tailwind CSS 3.4 | Responsive design system |

---

# Storage Engine & Data Integrity

The project uses a versioned browser-based storage architecture.

**Storage Namespace:** `exampro_v1_`

The existing namespace is intentionally retained for backward compatibility with previously stored application data.

### Storage Architecture

**1. Versioned Namespace**

Prevents collisions with unrelated applications using the same browser origin.

**2. Safe JSON Parsing**

Guarded read operations and fallback handling help prevent corrupted records from crashing the application.

**3. Storage Quota Handling**

Handles `QuotaExceededError` and provides application-level recovery notifications.

**4. Multi-Tab Concurrency Protection**

Uses timestamped heartbeat locks:

`tab_lock_${studentId}_${examId}`

A 15-second stale-lease timeout allows recovery when a browser tab is unexpectedly terminated.

**5. Idempotent Result Persistence**

Protects against duplicate submissions caused by rapid repeated actions or multiple tabs submitting simultaneously.

**6. Immutable Result Snapshots**

When an examination is submitted, a historical snapshot preserves examination settings, question text, options and scoring weights.

Subsequent administrative edits or deletions do not alter previously archived examination results.

---

# UI & Design System

VERITY uses a professional, minimal SaaS interface inspired by modern product experiences such as Linear and Vercel.

### Visual Identity

- Custom geometric VERITY logo.
- SVG favicon.
- Full, compact and symbol logo variants.
- Dark and light theme support.
- Orange-based visual identity.
- Consistent typography and spacing.
- Responsive Admin and Student layouts.

### Brand Palette

| Token | Hex |
|---|---|
| Primary Orange | `#FFA116` |
| Dark Background | `#1A1A1A` |
| Dark Surface | `#282828` |
| Dark Hover | `#333333` |
| Dark Border | `#3E3E3E` |
| Light Background | `#F7F8FA` |
| Light Surface | `#FFFFFF` |
| Success | `#2CBB5D` |
| Easy | `#00B8A3` |
| Medium | `#FFC01E` |
| Hard | `#EF4743` |

### Motion Design

Reusable Framer Motion components include:

- `StaggerContainer`
- `StaggerItem`
- `AnimatedProgressBar`
- `AnimatedCounter`
- `PageTransition`

Motion is used for:

- Dashboard KPI counters.
- Staggered card entrances.
- Chart animations.
- Progress indicators.
- Page transitions.
- Modal and interaction feedback.
- Table and list transitions.

The active examination interface remains distraction-free to protect timer, navigation, autosave and submission behaviour.

---

# Application Architecture

```text
VERITY/
│
├── public/
│   └── verity-favicon.svg
│
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── VerityLogo.jsx
│   │       ├── IsometricBarChart.jsx
│   │       └── Motion.jsx
│   │
│   ├── layouts/
│   │
│   ├── pages/
│   │   ├── admin/
│   │   ├── student/
│   │   └── auth/
│   │
│   ├── services/
│   │
│   ├── context/
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── index.html
├── package.json
└── README.md
```

*This is a high-level architectural overview. Individual files and folders may vary in the current repository.*

---

# Quickstart & Installation

## Prerequisites

- Node.js 18 or later.
- npm or pnpm.
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/AkshaySrivastava-Dev/Online-Examination-System.git
```

### 2. Navigate to the Project

```bash
cd Online-Examination-System
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

Open the local development URL displayed in your terminal. The default Vite URL is:

```text
http://localhost:5173
```

### 5. Create a Production Build

```bash
npm run build
```

Creates an optimized production bundle in the `dist/` directory.

### 6. Preview the Production Build

```bash
npm run preview
```

---

# Predefined Academic Demonstration Credentials

VERITY includes pre-seeded institutional data for local academic demonstration.

### Institutional Administrator

| Field | Credential |
|---|---|
| Role | System Administrator |
| Email | `admin@exampro.com` |
| Password | `Admin@123` |
| Privileges | Administrative management of students, examinations, questions and results |

### Sample Student Accounts

| Name | Email | Password | Student ID |
|---|---|---|---|
| Alex Morgan | `alex.morgan@university.edu` | `Student@123` | `STD-2026-001` |
| Priya Sharma | `priya.sharma@university.edu` | `Student@123` | `STD-2026-002` |
| David Kim | `david.kim@university.edu` | `Student@123` | `STD-2026-003` |
| Marcus Vance | `marcus.vance@university.edu` | `Student@123` | `STD-2026-004` |

The Marcus Vance account is a suspended sample account used for authentication testing.

New student accounts can also be created through the Signup page, if enabled in the current application.

---

# Automated Testing & Quality Assurance

The project includes automated test suites covering authentication, examination workflows, analytics and major application features.

| Test Suite | Command |
|---|---|
| Authentication & RBAC | `npm run test:auth` |
| Critical Examination Engine | `npm run test:critical` |
| ExamDNA Intelligence | `npm run test:dna` |
| Taxonomy & Intelligence | `npm run test:taxonomy` |
| MVP Features | `npm run test:mvp` |
| Admin Portal | `npm run test:admin` |
| Student Portal | `npm run test:student` |
| Release Walkthrough | `npm run test:walkthrough` |

### Latest Reported QA Results

| Test Suite | Assertions Passed |
|---|---:|
| Authentication | 28 / 28 |
| Critical Examination Engine | 35 / 35 |
| ExamDNA | 18 / 18 |
| Taxonomy & Intelligence | 38 / 38 |
| MVP Features | 40 / 40 |
| Admin System E2E | 24 / 24 |
| Student Portal E2E | 29 / 29 |
| Release Walkthrough | 26 / 26 |
| **Total** | **238 / 238** |

**Production Build:** Successful — exit code 0.

These are the latest reported local QA results for the project. Results may vary depending on the execution environment and subsequent code changes.

---

# Responsive Design & Compatibility

The interface has been reported as visually checked across the following viewport widths:

| Viewport | Target |
|---|---|
| 1920px | Large Desktop |
| 1440px | Standard Desktop |
| 1366px | Laptop |
| 768px | Tablet |
| 430px | Large Mobile |
| 375px | Compact Mobile |

The design aims to maintain readable charts, consistent spacing and usable navigation across screen sizes.

---

# Production Deployment

The application includes a Vercel-compatible configuration for static frontend deployment.

### `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

The rewrite supports client-side routing and direct navigation to application routes.

**Deployment status:** Deployment is not claimed in this repository description. The application should be deployed only after final release verification.

---

# Academic Demonstration Disclosure & Production Roadmap

### Educational Project Disclosure

VERITY is an academic frontend engineering project demonstrating modern React architecture, client-side state management, examination workflows, data visualization and UI design systems.

In the current academic MVP:

- Authentication sessions are managed client-side.
- Application data is persisted using browser LocalStorage.
- Demo credentials are intended for local academic evaluation.
- No dedicated backend server or centralized database is integrated.

Browser LocalStorage is accessible to client-side scripts. Therefore, the current authentication and persistence model is not suitable for production institutional security requirements.

### Recommended Production Upgrades

**1. Server-Authoritative Authentication**

- Secure password hashing using Bcrypt or Argon2.
- HTTP-only secure cookie sessions.
- Server-side role validation.
- Multi-Factor Authentication.

**2. Relational Database Backend**

- PostgreSQL or MySQL.
- ACID transactions.
- Foreign key constraints.
- Row-level locking.
- Centralized result and examination storage.

**3. Server-Authoritative Examination Engine**

- Server-side timer validation.
- Deadline enforcement.
- Secure submission processing.
- Real-time synchronization through WebSocket or SSE.

**4. Advanced Examination Integrity**

- Centralized audit records.
- Improved monitoring workflows.
- Secure proctoring integrations where institutionally appropriate.

**5. Cloud Infrastructure**

- Frontend hosting.
- Backend deployment.
- Database hosting.
- Monitoring, logging and backup infrastructure.

---

# Future Scope

Potential future enhancements include:

- Full-stack backend integration using Node.js, Express or FastAPI.
- PostgreSQL or MongoDB integration.
- Secure institutional authentication.
- Real-time examination monitoring.
- Advanced learning analytics.
- Enhanced adaptive assessment models.
- Learning Management System integration.
- Institutional student information system integration.
- Production-grade cloud deployment.

---

# Project Team

| Name | Registration Number | Role |
|---|---|---|
| **Akshay Srivastava** | 2500031594 | Team Lead |
| Shakkara Meghana | 2500031626 | Team Member |
| Allari Jagadish | 2500031667 | Team Member |

**Department:** Computer Science and Engineering  
**Institution:** Koneru Lakshmaiah Education Foundation (KL University)  
**Academic Year:** 2026–2027

---

# Repository Information

**Repository:** [Online-Examination-System](https://github.com/AkshaySrivastava-Dev/Online-Examination-System)

**Project:** VERITY — Beyond the Score

**Category:** Examination & Assessment Management

**Primary Language:** JavaScript

**Application Type:** Frontend MVP

---

# License

This project is open-source under the MIT License.

Developed for academic evaluation, educational demonstration and learning purposes.

---

<p align="center">
  **VERITY — BEYOND THE SCORE**
  
  *Understand performance. Identify gaps. Improve learning.*
</p>
