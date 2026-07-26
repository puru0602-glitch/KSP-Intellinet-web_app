import type { FirRecord } from "@/components/fir-registry";

export type DossierPdfInput = {
  fir: FirRecord;
  filterLabel: string;
  typology: {
    group: string;
    ipc: string;
    modality: string;
    weapon: string;
    window: string;
    recidivism: number;
    clearance: number;
  };
  associates: {
    name: string;
    role: string;
    state: string;
    risk: number;
    priors: number;
    link: string;
  }[];
  evidence: { label: string; detail: string; status: string }[];
  timeline: { day: number; label: string; detail: string; done: boolean }[];
  related: { f: FirRecord; why: string[] }[];
};

const M = 14;

const ascii = (t: string) =>
  t
    .replace(/₹\s?/g, "INR ")
    .replace(/[“”]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-");
const INK = [15, 23, 42] as const;
const MUTED = [100, 116, 139] as const;
const ACCENT = [8, 145, 178] as const;

export async function exportDossierPdf(d: DossierPdfInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 0;

  const ensure = (need: number) => {
    if (y + need > H - 16) {
      footer();
      doc.addPage();
      y = M;
    }
  };
  const footer = () => {
    doc
      .setFont("helvetica", "normal")
      .setFontSize(7)
      .setTextColor(...MUTED);
    doc.text(
      "KSP-INTELLINET · Strategic Crime Intelligence & Analytics Platform · Restricted / Official Use Only",
      M,
      H - 8,
    );
    doc.text(String(doc.getNumberOfPages()), W - M, H - 8, { align: "right" });
  };
  const heading = (t: string) => {
    ensure(12);
    doc.setFillColor(...ACCENT).rect(M, y, 2, 5, "F");
    doc
      .setFont("helvetica", "bold")
      .setFontSize(10)
      .setTextColor(...INK);
    doc.text(ascii(t).toUpperCase(), M + 4, y + 4);
    y += 9;
  };
  const kv = (label: string, value: string) => {
    ensure(6);
    doc
      .setFont("helvetica", "normal")
      .setFontSize(8)
      .setTextColor(...MUTED);
    doc.text(ascii(label), M, y);
    doc.setTextColor(...INK).setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(ascii(value), W - M - 55);
    doc.text(lines, M + 45, y);
    y += Math.max(5, lines.length * 4.2);
  };
  const para = (t: string) => {
    doc
      .setFont("helvetica", "normal")
      .setFontSize(9)
      .setTextColor(...INK);
    const lines = doc.splitTextToSize(ascii(t), W - 2 * M);
    ensure(lines.length * 4.4 + 2);
    doc.text(lines, M, y);
    y += lines.length * 4.4 + 3;
  };
  const bullet = (title: string, detail: string, tag?: string) => {
    ensure(9);
    doc
      .setFont("helvetica", "bold")
      .setFontSize(8.5)
      .setTextColor(...INK);
    doc.text(`- ${ascii(title)}`, M, y);
    if (tag) {
      doc
        .setFont("helvetica", "bold")
        .setFontSize(7.5)
        .setTextColor(...ACCENT);
      doc.text(ascii(tag), W - M, y, { align: "right" });
    }
    y += 4;
    doc
      .setFont("helvetica", "normal")
      .setFontSize(8)
      .setTextColor(...MUTED);
    const lines = doc.splitTextToSize(ascii(detail), W - 2 * M - 6);
    doc.text(lines, M + 4, y);
    y += lines.length * 3.9 + 2.5;
  };

  const { fir, typology } = d;

  // cover band
  doc.setFillColor(15, 23, 42).rect(0, 0, W, 30, "F");
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(34, 211, 238);
  doc.text("KSP-INTELLINET", M, 12);
  doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(203, 213, 225);
  doc.text("Full Case Dossier · State Crime Records Bureau, Karnataka State Police", M, 18);
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(255, 255, 255);
  doc.text(fir.id, M, 26);
  doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(148, 163, 184);
  doc.text(`Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`, W - M, 26, {
    align: "right",
  });
  y = 38;

  heading("Case identification");
  kv("FIR number", fir.id);
  kv("Date / time", `${fir.date} · ${fir.time} hrs`);
  kv("Police station", `${fir.station}, ${fir.district}`);
  kv(
    "Scene of offence",
    `${fir.locality} · ${fir.beat} · ${fir.coords.lat}° N, ${fir.coords.lng}° E`,
  );
  kv("Investigating officer", fir.io);
  kv("Status", fir.status);
  kv("Typology", `${fir.crimeType} — ${typology.group}`);
  kv("Legal sections", typology.ipc);
  kv("Property loss", `INR ${fir.lossValue.toLocaleString("en-IN")}`);
  kv("Active filter scope", d.filterLabel);

  heading("Case synopsis");
  para(
    `On ${fir.date} at approx. ${fir.time} hrs, a ${fir.crimeType.toLowerCase()} offence was reported at ${fir.locality} within ${fir.station} limits (${fir.beat}). ` +
      `Complainant: ${fir.victim}. Property loss assessed at INR ${fir.lossValue.toLocaleString("en-IN")}. Registered u/s ${typology.ipc}. ` +
      (fir.suspect
        ? `Accused ${fir.suspect.name} (alias "${fir.suspect.alias}") identified with ${fir.suspect.priors} prior FIR(s); ${fir.suspect.custody.toLowerCase()}.`
        : "No accused identified; case under source development."),
  );
  kv("Typical MO window", typology.window);
  kv("Recidivism / clearance", `${typology.recidivism}% / ${typology.clearance}%`);

  heading("Suspect cards");
  if (fir.suspect) {
    bullet(
      `${fir.suspect.name} (alias "${fir.suspect.alias}") — Prime accused`,
      `ID ${fir.suspect.id} · Risk ${fir.suspect.risk}/100 · Prior FIRs ${fir.suspect.priors} · Custody: ${fir.suspect.custody}\nVehicle ${fir.suspect.vehicle} · Phone ${fir.suspect.phone}\nMO: ${fir.suspect.mo}`,
      `RISK ${fir.suspect.risk}`,
    );
  } else {
    bullet(
      "No accused identified",
      `Case under source development. CCTV status: ${fir.cctv}. Typology recidivism ${typology.recidivism}%.`,
    );
  }
  d.associates.forEach((a) =>
    bullet(
      `${a.name} — ${a.role}`,
      `Status ${a.state} · Prior FIRs ${a.priors} · Link basis: ${a.link}`,
      `RISK ${a.risk}`,
    ),
  );
  bullet("Victim / complainant", `${fir.victim} · statement recorded at ${fir.station}`);

  heading("Evidence summary");
  d.evidence.forEach((e) => bullet(e.label, e.detail, e.status.toUpperCase()));

  heading("Case timeline");
  d.timeline.forEach((e) =>
    bullet(
      `${e.day === 0 ? "Day 0" : `Day +${e.day}`} — ${e.label}`,
      e.detail,
      e.done ? "COMPLETED" : "PENDING",
    ),
  );

  heading(`Related FIRs within current filters (${d.related.length})`);
  if (d.related.length) {
    d.related.forEach(({ f, why }) =>
      bullet(
        `${f.id} · ${f.crimeType}`,
        `${f.date} · ${f.locality}, ${f.station} · ${f.suspect ? f.suspect.name : "Unidentified"} · loss INR ${f.lossValue.toLocaleString("en-IN")}\nLinkage: ${why.join(", ")}`,
      ),
    );
  } else {
    para("No linked FIRs within the active filter scope.");
  }

  footer();
  doc.save(`${fir.id.replace(/\//g, "-")}-dossier.pdf`);
}
