# KSP-INTELLINET — Command Center Dashboard

https://ksp-intellinet.vercel.app/

KSP-INTELLINET is an integrated crime intelligence and decision-support platform designed for the Karnataka State Police (KSP) State Crime Records Bureau (SCRB).

Instead of dealing with siloed Excel spreadsheets and fragmented station logs, this dashboard consolidates FIR records, suspect networks, geospatial hotspots, and predictive analytics into a single live interface.

---

## What It Does (Core Features)

- **Executive Command Dashboard:** Real-time KPI counters tracking statewide FIRs, resolved cases, open investigations, repeat offenders, and estimated property loss.
- **Geospatial Hotspot Analysis:** Interactive Leaflet map of Karnataka showing cluster density, station load, and dynamic risk shifts across districts (Bengaluru Urban, Mysuru, Mangaluru, etc.).
- **Criminological Link & Network Graphs:** Visual graph node mapping connecting suspects, shared phone links, cross-jurisdictional MO (Modus Operandi), and crime rings.
- **FIR Registry & Search:** Filterable dataset of FIR records with synthetic data generators for offline testing and rapid querying.
- **Automated Dossier Exporter:** One-click PDF report generation (`jsPDF`) for field officers, compiling suspect aliases, linked evidence, and case summaries instantly.
- **Predictive Copilot:** Query interface designed for natural language filtering, trend discovery, and behavioral anomaly alerts.

---

## Tech Stack

### Frontend & UI

- **React + TypeScript** — Component-driven UI built for high-density data views.
- **TanStack Router / Start** — Type-safe routing and Server-Side Rendering (SSR).
- **Tailwind CSS** — Custom styling and dark-mode dashboard UI.
- **Leaflet (`react-leaflet`)** — Interactive geospatial mapping, heatmaps, and marker clustering.
- **Recharts** — Dynamic analytical graphs and district load charts.
- **jsPDF** — Client-side dossier and summary report export.

### Backend & Database

- **Supabase (PostgreSQL)** — Managed database storing FIRs, suspect profiles, station coordinates, and graph nodes.
- **Supabase Realtime** — WebSocket channels listening for instant database updates without page reloads.
- **TanStack Start Server Middleware** — Handles secure server-side operations and client authentication wrappers.

---

## Project Structure

```text
├── src/
│   ├── routes/
│   │   └── index.tsx            # Main command center layout & sub-modules
│   ├── components/
│   │   ├── fir-registry.tsx     # FIR searchable grid and synthetic data generator
│   │   ├── fir-dossier.tsx      # Modal dossier view + PDF exporter
│   │   ├── karnataka-map.tsx    # Leaflet map with clusters and station load
│   │   └── network-analysis.tsx # Suspect node graph & link analysis
│   ├── hooks/
│   │   ├── use-ksp-data.ts      # Supabase query hooks (FIRs, suspects, hotspots)
│   │   └── use-ksp-realtime.ts  # Live WebSocket subscription listener
│   ├── integrations/
│   │   └── supabase/            # Client and Server SDK setups
│   └── lib/                     # Data adapters, PDF exporters, and analytics utilities
├── supabase/                    # SQL migrations, database tables, and schema config
└── vite.config.ts               # Vite & TanStack build configuration



Getting Started Locally
Prerequisites
Node.js (v18+ recommended)

npm or bun

Setup Instructions
1. Clone the repository:
git clone [https://github.com/YOUR_USERNAME/ksp-intellinet.git](https://github.com/YOUR_USERNAME/ksp-intellinet.git)
cd ksp-intellinet

2.Install dependencies:
npm install

3. Configure Environment Variables:
Create a .env file in the root folder (use .env.example as a template):
VITE_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

4. Run the local development server:
npm run dev

Open http://localhost:3000 in your browser.

Note: The application includes embedded synthetic data fallbacks. Many features (maps, network graphs, filtering) will render and operate smoothly even without a active database connection.

Architecture Note
KSP-INTELLINET uses a modern Serverless BaaS (Backend-as-a-Service) architecture:

Rather than maintaining a custom REST/Express monolithic server, the client interfaces directly with Supabase for database operations and real-time event streams.

Server-side rendering (SSR) and privileged database operations are managed via TanStack Start middleware using the Supabase Service-Role SDK.
```
