import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "kn";

export interface Translations {
  // Brand & Header
  deptName: string;
  appTitle: string;
  commandCenter: string;
  selectLanguage: string;
  
  // Navigation Modules
  overview: string;
  crimeFrequency: string;
  geoHeatmap: string;
  networkAnalysis: string;
  predictiveAnalytics: string;
  aiCopilot: string;
  firRegistry: string;

  // Filters
  filterByDistrict: string;
  filterByCrimeType: string;
  filterByDate: string;
  allDistricts: string;
  allTypes: string;
  last7days: string;
  last30days: string;
  quarterToDate: string;

  // KPIs & Metrics
  activeFirs: string;
  highRiskSyndicates: string;
  totalPropertyLoss: string;
  hotspotDistricts: string;
  clearanceRate: string;
  predictedIncidents: string;

  // Common UI
  searchPlaceholder: string;
  exportCsv: string;
  printReport: string;
  applyFilter: string;
  resetFilter: string;
  status: string;
  actions: string;
  viewDossier: string;
  close: string;
  details: string;
  severity: string;
  district: string;
  station: string;
  crimeType: string;
  date: string;
  time: string;
  officer: string;
  suspects: string;
  lossValue: string;
  summary: string;
  firsInWindow: string;

  // Module Eyebrows & Subtitles
  module01Subtitle: string;
  module02Subtitle: string;
  module03Subtitle: string;
  module04Subtitle: string;
  module05Subtitle: string;
  module06Subtitle: string;
}

const translations: Record<Language, Translations> = {
  en: {
    deptName: "Karnataka State Police · SCRB",
    appTitle: "KSP-INTELLINET",
    commandCenter: "Command Center",
    selectLanguage: "Language",

    overview: "Overview",
    crimeFrequency: "Crime Frequency",
    geoHeatmap: "Geospatial Heatmap",
    networkAnalysis: "Network Analysis",
    predictiveAnalytics: "Predictive Analytics",
    aiCopilot: "AI Copilot",
    firRegistry: "FIR Registry",

    filterByDistrict: "District",
    filterByCrimeType: "Crime Type",
    filterByDate: "Date Window",
    allDistricts: "All Districts",
    allTypes: "All Crime Types",
    last7days: "Last 7 days",
    last30days: "Last 30 days",
    quarterToDate: "Quarter to Date",

    activeFirs: "Active FIR Reports",
    highRiskSyndicates: "High Risk Syndicates",
    totalPropertyLoss: "Total Property Loss",
    hotspotDistricts: "Hotspot Districts",
    clearanceRate: "Clearance Rate",
    predictedIncidents: "Predicted Incidents",

    searchPlaceholder: "Search FIR number, suspect, vehicle or station...",
    exportCsv: "Export CSV",
    printReport: "Print Report",
    applyFilter: "Apply Filters",
    resetFilter: "Reset Filters",
    status: "Status",
    actions: "Actions",
    viewDossier: "View Dossier",
    close: "Close",
    details: "Details",
    severity: "Severity",
    district: "District",
    station: "Police Station",
    crimeType: "Crime Type",
    date: "Date",
    time: "Time",
    officer: "Investigating Officer",
    suspects: "Suspects / Accused",
    lossValue: "Property Loss Value",
    summary: "Brief Case Summary",
    firsInWindow: "FIRs in current filter window",

    module01Subtitle: "Strategic Crime Intelligence & Real-Time Situational Awareness",
    module02Subtitle: "Crime Incident Frequency & Temporal Trend Analytics",
    module03Subtitle: "Criminological Network & Link Association Analysis",
    module04Subtitle: "AI-Powered Spatiotemporal Crime Trend Prediction",
    module05Subtitle: "KSP Intelligence Assistant & Case Dossier Generator",
    module06Subtitle: "Karnataka State Crime Records Bureau Official Registry",
  },
  kn: {
    deptName: "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ · ಎಸ್‌ಸಿಆರ್‌ಬಿ",
    appTitle: "ಕೆಎಸ್‌ಪಿ-ಇಂಟೆಲ್ಲಿನೆಟ್",
    commandCenter: "ಕಮಾಂಡ್ ಸೆಂಟರ್",
    selectLanguage: "ಭಾಷೆ",

    overview: "ಅವಲೋಕನ",
    crimeFrequency: "ಅಪರಾಧ ಆವರ್ತನ",
    geoHeatmap: "ಭೂಮಿತಿ ನಕ್ಷೆ",
    networkAnalysis: "ನೆಟ್‌ವರ್ಕ್ ವಿಶ್ಲೇಷಣೆ",
    predictiveAnalytics: "ಮುನ್ಸೂಚನೆ ವಿಶ್ಲೇಷಣೆ",
    aiCopilot: "ಎಐ ಸಹಾಯಕ",
    firRegistry: "ಎಫ್‌ಐಆರ್ ನೋಂದಣಿ",

    filterByDistrict: "ಜಿಲ್ಲೆ",
    filterByCrimeType: "ಅಪರಾಧ ಪ್ರಕಾರ",
    filterByDate: "ದಿನಾಂಕ ಅವಧಿ",
    allDistricts: "ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು",
    allTypes: "ಎಲ್ಲಾ ಅಪರಾಧ ಪ್ರಕಾರಗಳು",
    last7days: "ಕಳೆದ ೭ ದಿನಗಳು",
    last30days: "ಕಳೆದ ೩೦ ದಿನಗಳು",
    quarterToDate: "ಈ ತ್ರೈಮಾಸಿಕ",

    activeFirs: "ಸಕ್ರಿಯ ಎಫ್‌ಐಆರ್ ವರದಿಗಳು",
    highRiskSyndicates: "ಹೆಚ್ಚಿನ ಅಪಾಯದ ಗ್ಯಾಂಗ್‌ಗಳು",
    totalPropertyLoss: "ಒಟ್ಟು ಆಸ್ತಿ ನಷ್ಟ",
    hotspotDistricts: "ಅಪಾಯಕಾರಿ ಜಿಲ್ಲೆಗಳು",
    clearanceRate: "ವಿಲೇವಾರಿ ದರ",
    predictedIncidents: "ಮುನ್ಸೂಚಿತ ಘಟನೆಗಳು",

    searchPlaceholder: "ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆ, ಶಂಕಿತರು, ವಾಹನ ಅಥವಾ ಠಾಣೆ ಹುಡುಕಿ...",
    exportCsv: "ಸಿಎಸ್‌ವಿ ರಫ್ತು",
    printReport: "ವರದಿ ಮುದ್ರಿಸಿ",
    applyFilter: "ಶೋಧಕಗಳನ್ನು ಅನ್ವಯಿಸಿ",
    resetFilter: "ಮರುಹೊಂದಿಸಿ",
    status: "ಸ್ಥಿತಿ",
    actions: "ಕ್ರಮಗಳು",
    viewDossier: "ದಾಖಲೆ ವೀಕ್ಷಿಸಿ",
    close: "ಮುಚ್ಚಿ",
    details: "ವಿವರಗಳು",
    severity: "ತೀವ್ರತೆ",
    district: "ಜಿಲ್ಲೆ",
    station: "ಪೊಲೀಸ್ ಠಾಣೆ",
    crimeType: "ಅಪರಾಧ ಪ್ರಕಾರ",
    date: "ದಿನಾಂಕ",
    time: "ಸಮಯ",
    officer: "ತನಿಖಾಧಿಕಾರಿ",
    suspects: "ಶಂಕಿತರು / ಆರೋಪಿಗಳು",
    lossValue: "ಆಸ್ತಿ ನಷ್ಟದ ಮೌಲ್ಯ",
    summary: "ಪ್ರಕರಣದ ಸಾರಾಂಶ",
    firsInWindow: "ಪ್ರಸ್ತುತ ಅವಧಿಯ ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆ",

    module01Subtitle: "ಆಯಕಟ್ಟಿನ ಅಪರಾಧ ಸುಳಿವು ಮತ್ತು ನೈಜ ಸಮಯದ ಪರಿಸ್ಥಿತಿ ಜಾಗೃತಿ",
    module02Subtitle: "ಅಪರಾಧ ಘಟನೆಗಳ ಆವರ್ತನ ಮತ್ತು ಸಮಯ ಆಧಾರಿತ ವಿಶ್ಲೇಷಣೆ",
    module03Subtitle: "ಅಪರಾಧ ಜಾಲ ಮತ್ತು ಸರಣಿ ಸಂಘಟಿತ ವಿಶ್ಲೇಷಣೆ",
    module04Subtitle: "ಎಐ-ಚಾಲಿತ ಭೂಮಿ-ಸಮಯ ಅಪರಾಧ ಮುನ್ಸೂಚನೆ",
    module05Subtitle: "ಕೆಎಸ್‌ಪಿ ಬುದ್ಧಿವಂತಿಕಾ ಸಹಾಯಕ ಮತ್ತು ಪ್ರಕರಣ ವರದಿ ಜನರೇಟರ್",
    module06Subtitle: "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಅಪರಾಧ ದಾಖಲೆಗಳ ಬ್ಯೂರೋ ಅಧಿಕೃತ ನೋಂದಣಿ",
  },
};

// District Kannada Translations
export const DISTRICT_NAMES_KN: Record<string, string> = {
  "All Districts": "ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು",
  "Bengaluru Urban": "ಬೆಂಗಳೂರು ನಗರ",
  Mysuru: "ಮೈಸೂರು",
  "Hubballi-Dharwad": "ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ",
  Mangaluru: "ಮಂಗಳೂರು",
  Belagavi: "ಬೆಳಗಾವಿ",
  Kalaburagi: "ಕಲಬುರಗಿ",
};

// Crime Type Kannada Translations
export const CRIME_TYPE_NAMES_KN: Record<string, string> = {
  "All Types": "ಎಲ್ಲಾ ಪ್ರಕಾರಗಳು",
  "Motor Vehicle Theft": "ವಾಹನ ಕಳವು",
  "Chain Snatching": "ಚೈನ್ ಸರಗಳ್ಳತನ",
  "Commercial Burglary": "ವಾಣಿಜ್ಯ ಕನ್ನಗಳ್ಳತನ",
  "Cyber Fraud / Financial": "ಸೈಬರ್ ವಂಚನೆ / ಹಣಕಾಸು",
  "Extortion / Robbery": "ಸುಲಿಗೆ / ದರೋಡೆ",
};

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
  translateDistrict: (d: string) => string;
  translateCrimeType: (c: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ksp_lang");
      if (saved === "en" || saved === "kn") return saved;
    }
    return "en";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ksp_lang", lang);
    }
  }, [lang]);

  const translateDistrict = (d: string) => {
    if (lang === "kn" && DISTRICT_NAMES_KN[d]) return DISTRICT_NAMES_KN[d];
    return d;
  };

  const translateCrimeType = (c: string) => {
    if (lang === "kn" && CRIME_TYPE_NAMES_KN[c]) return CRIME_TYPE_NAMES_KN[c];
    return c;
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t: translations[lang],
        translateDistrict,
        translateCrimeType,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      lang: "en" as Language,
      setLang: () => {},
      t: translations.en,
      translateDistrict: (d: string) => d,
      translateCrimeType: (c: string) => c,
    };
  }
  return context;
};
