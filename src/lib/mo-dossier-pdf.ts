import type { Fir, Suspect } from "@/hooks/use-ksp-data";

const M = 14;
const INK = [15, 23, 42] as const;
const MUTED = [100, 116, 139] as const;
const ACCENT = [8, 145, 178] as const;

const ascii = (t: string) =>
  t
    .replace(/₹\s?/g, "INR ")
    .replace(/[“”]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[•·⇔]/g, "-");

export type MoPdfInput = {
  suspect: Suspect;
  firs: Fir[];
  filterLabel: string;
};

export async function exportMoDossierPdf({ suspect, firs, filterLabel }: MoPdfInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 0;

  const footer = () => {
    doc
      .setFont("helvetica", "normal")
      .setFontSize(7)
      .setTextColor(...MUTED);
    doc.text("KSP-INTELLINET - Modus Operandi Dossier - Restricted / Official Use Only", M, H - 8);
    doc.text(String(doc.getNumberOfPages()), W - M, H - 8, { align: "right" });
  };
  const ensure = (need: number) => {
    if (y + need > H - 16) {
      footer();
      doc.addPage();
      y = M;
    }
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

  const districtsHit = [...new Set(firs.map((f) => f.district))];
  const stationsHit = [...new Set(firs.map((f) => f.station_name))];
  const totalLoss = firs.reduce((s, f) => s + Number(f.loss_value || 0), 0);

  // cover band
  doc.setFillColor(15, 23, 42).rect(0, 0, W, 30, "F");
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(34, 211, 238);
  doc.text("KSP-INTELLINET", M, 12);
  doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(203, 213, 225);
  doc.text("Modus Operandi Dossier - State Crime Records Bureau, Karnataka State Police", M, 18);
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(255, 255, 255);
  doc.text(`${suspect.name} (${suspect.suspect_code})`, M, 26);
  doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(148, 163, 184);
  doc.text(`Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`, W - M, 26, {
    align: "right",
  });
  y = 38;

  heading("Subject identification");
  kv("Suspect code", suspect.suspect_code);
  kv("Name", suspect.name);
  kv("Known aliases", suspect.aliases.length ? suspect.aliases.join(", ") : "None recorded");
  kv("Home jurisdiction", `${suspect.station_name}, ${suspect.district}`);
  kv("Current status", suspect.status);
  kv("Risk score", `${suspect.risk_score} / 100`);
  kv("Active filter scope", filterLabel);

  heading("Modus operandi");
  para(suspect.mo_description);
  kv("MO tags", suspect.mo_tags.length ? suspect.mo_tags.join(", ") : "None");

  heading("Communication & vehicle links");
  suspect.phone_numbers.forEach((p) => bullet("Phone / SIM", p));
  bullet("Vehicle", suspect.vehicle ?? "No vehicle on record");

  heading("Cross-jurisdiction activity");
  kv("Linked FIRs", String(firs.length));
  kv("Districts with FIRs", districtsHit.join(", ") || "None");
  kv("Stations touched", stationsHit.join(", ") || "None");
  kv("Aggregate property loss", `INR ${totalLoss.toLocaleString("en-IN")}`);
  suspect.cross_jurisdiction.forEach((d) =>
    bullet(
      d,
      districtsHit.includes(d)
        ? "FIR confirmed in this district within records."
        : "Intelligence input only - no registered FIR on file.",
      districtsHit.includes(d) ? "CONFIRMED" : "INTEL",
    ),
  );

  heading(`Linked FIRs (${firs.length})`);
  if (firs.length) {
    firs.forEach((f) =>
      bullet(
        `${f.fir_number} - ${f.crime_type}`,
        `${f.incident_date} at ${String(f.incident_hour).padStart(2, "0")}:00 - ${f.locality ?? "-"}, ${f.station_name}, ${f.district}\n` +
          `Status ${f.status} - Loss INR ${Number(f.loss_value).toLocaleString("en-IN")} - IO ${f.investigating_officer ?? "-"}` +
          (f.summary ? `\n${f.summary}` : ""),
      ),
    );
  } else {
    para("No FIRs currently linked to this suspect.");
  }

  footer();
  doc.save(`${suspect.suspect_code}-mo-dossier.pdf`);
}
