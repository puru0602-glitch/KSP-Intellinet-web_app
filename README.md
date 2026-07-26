# KSP-INTELLINET — Command Center Dashboard

https://ksp-intellinet-web-app.vercel.app/

> Integrated Crime Intelligence & Decision-Support Platform for Karnataka State Police (SCRB)

[![Deployment Status](https://img.shields.io/badge/Deployment-Vercel-black?style=flat-square&logo=vercel)](https://ksp-intellinet.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

**KSP-INTELLINET** is a next-generation crime intelligence and command center dashboard engineered for the **Karnataka State Police (KSP)** State Crime Records Bureau (SCRB). It replaces fragmented police station logs and siloed spreadsheets with a live, unified operational picture across all Karnataka districts.

---

## 🌟 Key Features

### 🌐 Bilingual Interface (English & Kannada ಕನ್ನಡ)
- Instant toggle between **English** and **Kannada (ಕನ್ನಡ)**.
- Localized district names (*ಬೆಂಗಳೂರು ನಗರ, ಮೈಸೂರು, ಮಂಗಳೂರು, etc.*), crime categories, navigation labels, and department titles (*ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ · ಎಸ್‌ಸಿಆರ್‌ಬಿ*).

### 📊 7 Specialized Command Modules

1. **Executive Command Overview**
   - Real-time KPI metrics tracking statewide FIR counts, resolved cases, open investigations, repeat offender counts, and estimated property loss.
   - Dynamic ticker feed highlighting live incident dispatches and status shifts.

2. **Crime Frequency Analytics**
   - Recharts-powered interactive typology dashboard breaking down crime categories, time-of-day distributions, monthly trends, and property damage values.

3. **Geospatial Hotspots & Cluster Mapping**
   - Interactive Leaflet map displaying police station density, district-level load, cluster heatmaps, and dynamic risk shifts across Karnataka.

4. **Criminological Link & Network Analysis**
   - Node graph mapping relations between suspects, shared mobile numbers, vehicle registrations, Modus Operandi (MO), and cross-jurisdictional crime syndicates.

5. **Predictive Analytics & Risk Profiling**
   - Recidivism risk indexes, seasonal trend projections, and hotspot forecasting models to optimize police patrolling resources.

6. **KSP-Copilot & Anomaly Detection**
   - Natural language query interface and automated behavioral anomaly detection flagging unusual spikes in crime activity.

7. **FIR / Incident Registry & Dossier Exporter**
   - Searchable, filterable FIR registry with instant detail inspection.
   - **Automated PDF Dossier Generator (`jsPDF`)**: One-click field officer intelligence report export including suspect profiles, criminal histories, linked evidence, and case summaries.

---

## 🛠️ Tech Stack

### Frontend & UI
- **React 18 + TypeScript** — High-density, type-safe data component system.
- **TanStack Router / Start** — Modern type-safe routing and SSR infrastructure.
- **Tailwind CSS v4** — Dark/Light police command center styling with responsive density control.
- **Lucide React** — Crisp vector icons for tactical UI components.

### Data Visualization & Mapping
- **Leaflet & `react-leaflet`** — High-performance interactive geospatial mapping with custom markers and cluster layers.
- **Recharts** — Responsive line charts, bar graphs, radar metrics, and district distribution charts.
- **jsPDF & html2canvas** — Client-side vector report generation for downloading suspect dossiers.

### Backend & Storage
- **Supabase (PostgreSQL)** — Cloud database storing FIR entries, suspect networks, station coordinates, and link relations.
- **Supabase Realtime** — WebSocket channels for streaming live incident alerts without page refreshes.
- **Nitro Engine** — Serverless deployment engine supporting multi-preset builds (Vercel, Cloudflare, Node).

---

## 📁 Project Structure

```text
ksp-intellinet/
├── src/
│   ├── routes/
│   │   └── index.tsx                    # Command center main shell & sub-module manager
│   ├── components/
│   │   ├── crime-frequency-dashboard.tsx # Recharts typology & frequency analytics
│   │   ├── fir-registry.tsx             # Searchable FIR grid & data generator
│   │   ├── fir-dossier.tsx              # Suspect dossier modal & PDF exporter
│   │   ├── karnataka-map.tsx            # Leaflet map with district clusters
│   │   └── network-analysis.tsx         # Suspect node link graph
│   ├── context/
│   │   └── language-context.tsx         # English / Kannada bilingual state provider
│   ├── hooks/
│   │   ├── use-ksp-data.ts              # Supabase data fetching & fallback generator
│   │   └── use-ksp-realtime.ts          # WebSocket realtime event listener
│   └── integrations/
│       └── supabase/                    # Supabase client setup & types
├── supabase/                            # Database migrations & schemas
├── vercel.json                          # Vercel deployment routing configuration
└── vite.config.ts                       # Vite build configuration
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` in the root folder and populate your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_PROJECT_ID=your-project-id

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

*Note: The application includes built-in offline synthetic fallback data, ensuring maps, analytics, and network graphs function even if no Supabase instance is attached.*

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js** v18 or higher
- **npm** or **bun**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/ksp-intellinet.git
   cd ksp-intellinet
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment

### Deploying to Vercel

1. Push your repository to **GitHub** / **GitLab**.
2. Import the project into your **Vercel Dashboard**.
3. Set the build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add your Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
5. Click **Deploy**.

The repository includes a preset build configuration that outputs the client build to `dist` for Vercel deployment.

---

## ⚖️ License & Disclaimer

Designed for the **Karnataka State Police State Crime Records Bureau (SCRB)**. Synthetic data is used for demonstration and testing purposes.

