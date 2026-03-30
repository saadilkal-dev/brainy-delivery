
# Delivery Brain — MVP Frontend

## Overview
AI-powered delivery planning tool for Softway's software teams. Operates at the module level (2-week chunks), ingests meeting transcripts via AI, and surfaces blockers with nudge generation. All data from a FastAPI backend.

## Architecture
- **API Layer**: Axios client pointing to `VITE_API_URL` (default `http://localhost:8000`), with typed functions for projects, modules, ingestion, blockers, and dashboard endpoints
- **Data Fetching**: TanStack Query v5 for all server state — caching, refetching, mutations with query invalidation
- **Routing**: React Router v6 with nested project routes
- **Design**: Always-dark theme (`gray-950/900/800`), accent colors for status (blue/red/green/amber), system font

## Layout
- **Sidebar** (240px): "🧠 Delivery Brain" logo, project selector dropdown, nav links (Dashboard, Plan, Ingestion Feed, Blockers & Nudges). Collapses to hamburger on mobile.
- **Top Bar** (56px): Page title + notification bell with active blocker count
- **Main Content**: Scrollable, padded area

## Pages

### 1. Dashboard (`/projects/:id/dashboard`)
- **4 stat cards**: Overall Progress (color-coded ring), Active Blockers (clickable), Predicted Delivery (drift coloring), Brain Activity count
- **Module Grid**: 3-col grid of module cards with status badges, progress bars, blocker reasons, assumption counts. Click to expand inline with assumptions/dependencies.
- **Recent Brain Activity**: Last 5 extractions with source/type badges and affected module tags

### 2. Plan (`/projects/:id/plan`)
- **AI Plan Generator card** (placeholder with "Coming soon" toast)
- **Ordered module list**: Expandable rows with 3 tabs each:
  - Assumptions: list with status actions (Confirm/Invalidate), add form
  - Dependencies: list with overdue detection, "Generate Nudge" link, add form
  - Brain Updates: filtered extractions for that module
- **Add Module modal**: Name, description, owner, hours, dates, order

### 3. Ingestion Feed (`/projects/:id/ingestion`)
- **Transcript input card**: Source name input, large textarea, "Load Sample" button, "Process Transcript" button with brain-pulsing loading state
- **Extraction results** shown inline on success before appearing in feed
- **Extraction feed**: Grouped by date, each card with source/type badges, summary, source quote block, affected module, action taken

### 4. Blockers & Nudges (`/projects/:id/blockers`)
- **Active Blockers**: Blocked module cards with reasons and downstream impact. Overdue dependency cards with "Generate Nudge Email" button.
- **Nudge Modal**: Shows AI-generated subject/body (editable), "Mark as Sent" and "Copy to Clipboard" buttons
- **Nudge History**: Chronological list of sent nudges with view-detail modal

### 5. First-Run / Welcome
- When no projects exist: centered welcome screen with create-project form (name, client, target date)
- Project selector in sidebar for switching between projects

## Shared Components
- `LoadingSpinner`, `ErrorMessage` (with retry), `EmptyState` (contextual CTA) — used on every page
- `Badge` for status/type pills, `ProgressBar`, `Modal` wrapper
- Toast notifications via Sonner for all success/error feedback

## Key Behaviors
- Every page handles loading/error/empty states — never a blank screen
- Mutations invalidate relevant queries on success
- Minimal Framer Motion: route fade-in (0.2s), brain processing pulse
- Mobile responsive: sidebar collapses, module grid goes single-column
