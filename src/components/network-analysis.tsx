import { useMemo, useState } from "react";
import {
  Network,
  X,
  Phone,
  Car,
  MapPin,
  FileText,
  Zap,
  ChevronRight,
  Fingerprint,
  ShieldAlert,
  Loader2,
  FileDown,
} from "lucide-react";
import { useNetworkNodes, useSuspects, useSuspectFirs, type Suspect } from "@/hooks/use-ksp-data";
import { TYPE_COLORS, inr } from "@/lib/ksp-analytics";
import { exportMoDossierPdf } from "@/lib/mo-dossier-pdf";

const NODE_STYLE: Record<string, { fill: string; label: string }> = {
  suspect: { fill: "#ef4444", label: "Suspect" },
  victim: { fill: "#3b82f6", label: "Victim" },
  location: { fill: "#f97316", label: "Location" },
  vehicle: { fill: "#a855f7", label: "Vehicle" },
  sim: { fill: "#22d3ee", label: "SIM / Phone" },
  mo: { fill: "#facc15", label: "Modus Operandi" },
};

export function NetworkAnalysisView({
  district,
  crimeType = "All Types",
  dateRange = "Last 7 days",
}: {
  district: string;
  crimeType?: string;
  dateRange?: string;
}) {
  const { data: nodes = [], isLoading } = useNetworkNodes(district);
  const { data: suspects = [] } = useSuspects(district);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const suspectByCode = useMemo(
    () => new Map(suspects.map((s) => [s.suspect_code, s])),
    [suspects],
  );

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.node_id, n])), [nodes]);

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: { a: string; b: string }[] = [];
    for (const n of nodes) {
      for (const l of n.linked_nodes) {
        if (!nodeById.has(l)) continue;
        const key = [n.node_id, l].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ a: n.node_id, b: l });
      }
    }
    return list;
  }, [nodes, nodeById]);

  const associations = useMemo(() => {
    const out: { a: string; b: string; via: string; strength: number }[] = [];
    for (const n of nodes) {
      if (n.node_type === "suspect") continue;
      const linkedSuspects = n.linked_nodes.filter((l) => nodeById.get(l)?.node_type === "suspect");
      for (let i = 0; i < linkedSuspects.length; i++) {
        for (let j = i + 1; j < linkedSuspects.length; j++) {
          out.push({
            a: nodeById.get(linkedSuspects[i])!.label,
            b: nodeById.get(linkedSuspects[j])!.label,
            via: `${NODE_STYLE[n.node_type]?.label ?? n.node_type} · ${n.label}`,
            strength: n.node_type === "vehicle" ? 0.88 : n.node_type === "mo" ? 0.74 : 0.6,
          });
        }
      }
    }
    return out.slice(0, 6);
  }, [nodes, nodeById]);

  const activeSuspect = openCode ? (suspectByCode.get(openCode) ?? null) : null;
  const neighbours = hovered ? new Set(nodeById.get(hovered)?.linked_nodes ?? []) : null;

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          className="xl:col-span-2"
          title="Link Analysis Graph"
          subtitle="Click any red suspect node to open the full Modus Operandi drawer"
        >
          <div className="relative h-[560px] w-full overflow-hidden rounded-md border border-slate-800 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08),transparent_60%)]">
            {isLoading ? (
              <div className="grid h-full place-items-center text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <svg viewBox="0 0 960 580" className="h-full w-full">
                {edges.map(({ a, b }, i) => {
                  const na = nodeById.get(a)!;
                  const nb = nodeById.get(b)!;
                  const active = hovered === a || hovered === b;
                  return (
                    <line
                      key={i}
                      x1={na.pos_x}
                      y1={na.pos_y}
                      x2={nb.pos_x}
                      y2={nb.pos_y}
                      stroke={active ? "#06b6d4" : "#334155"}
                      strokeWidth={active ? 2 : 1.1}
                      strokeOpacity={hovered && !active ? 0.25 : 0.9}
                    />
                  );
                })}
                {nodes.map((n) => {
                  const style = NODE_STYLE[n.node_type] ?? NODE_STYLE.mo;
                  const isSuspect = n.node_type === "suspect";
                  const r = isSuspect ? 21 : n.node_type === "location" ? 16 : 13;
                  const dim = hovered && hovered !== n.node_id && !neighbours?.has(n.node_id);
                  const suspect = n.suspect_code ? suspectByCode.get(n.suspect_code) : undefined;
                  return (
                    <g
                      key={n.node_id}
                      opacity={dim ? 0.3 : 1}
                      className={isSuspect ? "cursor-pointer" : "cursor-default"}
                      onMouseEnter={() => setHovered(n.node_id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => isSuspect && n.suspect_code && setOpenCode(n.suspect_code)}
                    >
                      <circle
                        cx={n.pos_x}
                        cy={n.pos_y}
                        r={r + 7}
                        fill={style.fill}
                        fillOpacity={0.22}
                      />
                      <circle
                        cx={n.pos_x}
                        cy={n.pos_y}
                        r={r}
                        fill={style.fill}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                      {isSuspect && (
                        <>
                          <circle
                            cx={n.pos_x}
                            cy={n.pos_y}
                            r={r + 10}
                            fill="none"
                            stroke={style.fill}
                            strokeOpacity="0.4"
                          >
                            <animate
                              attributeName="r"
                              values={`${r + 6};${r + 18};${r + 6}`}
                              dur="2.6s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="stroke-opacity"
                              values="0.5;0;0.5"
                              dur="2.6s"
                              repeatCount="indefinite"
                            />
                          </circle>
                          <text
                            x={n.pos_x}
                            y={n.pos_y + 4}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="700"
                            fill="#0f172a"
                          >
                            {suspect?.risk_score ?? ""}
                          </text>
                        </>
                      )}
                      <text
                        x={n.pos_x}
                        y={n.pos_y + r + 13}
                        textAnchor="middle"
                        fontSize="10.5"
                        fill="#cbd5e1"
                      >
                        {n.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded bg-slate-950/85 px-2 py-1 text-[10px] text-slate-300 ring-1 ring-slate-700">
              {Object.entries(NODE_STYLE).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: v.fill }}
                  />
                  {v.label}
                </span>
              ))}
            </div>
            <div className="absolute right-3 top-3 rounded bg-slate-950/85 px-2 py-1 text-[10px] text-slate-400 ring-1 ring-slate-700">
              {nodes.length} nodes · {edges.length} links
            </div>
          </div>
        </Panel>

        <Panel
          title="Hidden Association Detector"
          subtitle="Shared vehicles, SIMs and MOs across jurisdictions"
        >
          {associations.length === 0 && (
            <p className="text-xs text-slate-500">
              No shared-entity associations in this filter scope.
            </p>
          )}
          <ul className="space-y-3">
            {associations.map((a, i) => (
              <li key={i} className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-100">{a.a}</span>
                  <span className="text-slate-500">⇔</span>
                  <span className="font-medium text-slate-100">{a.b}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">{a.via}</div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-red-500"
                    style={{ width: `${a.strength * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-md border border-cyan-500/25 bg-cyan-500/5 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Zap className="h-3.5 w-3.5" /> Syndicate Hypothesis
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Shared-entity clustering suggests a coordinated cell operating across the
              Bengaluru–Mysuru–Mangaluru corridor. Confidence{" "}
              <span className="font-semibold text-cyan-300">76%</span>.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Repeat Offender Registry" subtitle="Click a row to open the MO drawer">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2">Code</th>
                <th className="px-3">Suspect</th>
                <th className="px-3">Aliases</th>
                <th className="px-3">Station</th>
                <th className="px-3">Vehicle</th>
                <th className="px-3">Status</th>
                <th className="px-3">Risk</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {suspects.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setOpenCode(s.suspect_code)}
                  className="cursor-pointer border-b border-slate-800/60 transition-colors hover:bg-slate-800/40"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-cyan-400">{s.suspect_code}</td>
                  <td className="px-3 font-medium text-slate-100">{s.name}</td>
                  <td className="px-3 text-xs text-slate-400">{s.aliases.join(", ") || "—"}</td>
                  <td className="px-3 text-slate-300">{s.station_name}</td>
                  <td className="px-3 font-mono text-xs text-slate-300">{s.vehicle ?? "—"}</td>
                  <td className="px-3 text-xs text-slate-300">{s.status}</td>
                  <td className="px-3">
                    <RiskPill value={s.risk_score} />
                  </td>
                  <td className="px-3 text-slate-500">
                    <ChevronRight className="h-4 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {suspects.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-500">
              No suspects on record for this district.
            </p>
          )}
        </div>
      </Panel>

      {activeSuspect && (
        <MoDrawer
          suspect={activeSuspect}
          filterLabel={`${district} · ${crimeType} · ${dateRange}`}
          onClose={() => setOpenCode(null)}
        />
      )}
    </>
  );
}

function MoDrawer({
  suspect,
  filterLabel,
  onClose,
}: {
  suspect: Suspect;
  filterLabel: string;
  onClose: () => void;
}) {
  const { data: firs = [], isLoading } = useSuspectFirs(suspect.suspect_code);
  const [exporting, setExporting] = useState(false);
  const districtsHit = [...new Set(firs.map((f) => f.district))];
  const stationsHit = [...new Set(firs.map((f) => f.station_name))];
  const totalLoss = firs.reduce((s, f) => s + Number(f.loss_value || 0), 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportMoDossierPdf({ suspect, firs, filterLabel });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-800 bg-gradient-to-r from-red-950/70 to-slate-900 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-red-500/20 ring-2 ring-red-500/40">
              <Fingerprint className="h-5 w-5 text-red-300" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">
                Modus Operandi Dossier
              </div>
              <h3 className="text-lg font-bold text-slate-100">{suspect.name}</h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-mono text-cyan-400">{suspect.suspect_code}</span>
                <span>· {suspect.district}</span>
                <span>· {suspect.station_name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RiskPill value={suspect.risk_score} />
            <button
              onClick={handleExport}
              disabled={exporting || isLoading}
              title="Export this MO dossier as PDF"
              className="flex h-8 items-center gap-1.5 rounded-md border border-cyan-500/50 bg-cyan-500/15 px-2.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/25 disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{exporting ? "Building…" : "Export PDF"}</span>
            </button>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-md border border-slate-700 hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Linked FIRs" value={String(firs.length)} />
            <MiniStat label="Districts" value={String(districtsHit.length)} />
            <MiniStat label="Property Loss" value={inr(totalLoss)} />
          </div>
          <div className="text-[11px] text-slate-500">
            Filter scope: <span className="text-slate-300">{filterLabel}</span>
          </div>

          <Block icon={<ShieldAlert className="h-3.5 w-3.5 text-red-400" />} title="Modus Operandi">
            <p className="text-sm leading-relaxed text-slate-100">{suspect.mo_description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suspect.mo_tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-300"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Current status: <span className="text-slate-300">{suspect.status}</span>
            </div>
          </Block>

          <Block icon={<Network className="h-3.5 w-3.5 text-cyan-400" />} title="Known Aliases">
            <div className="flex flex-wrap gap-2">
              {suspect.aliases.length ? (
                suspect.aliases.map((a) => (
                  <span
                    key={a}
                    className="rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 text-xs text-slate-200"
                  >
                    “{a}”
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No recorded aliases.</span>
              )}
            </div>
          </Block>

          <Block
            icon={<Phone className="h-3.5 w-3.5 text-purple-400" />}
            title="Phone & Vehicle Links"
          >
            <ul className="space-y-1.5 text-xs">
              {suspect.phone_numbers.map((p) => (
                <li key={p} className="flex items-center gap-2 text-slate-200">
                  <Phone className="h-3.5 w-3.5 text-purple-400" />
                  <span className="font-mono">{p}</span>
                </li>
              ))}
              <li className="flex items-center gap-2 text-slate-200">
                <Car className="h-3.5 w-3.5 text-purple-400" />
                <span className="font-mono">{suspect.vehicle ?? "No vehicle on record"}</span>
              </li>
            </ul>
          </Block>

          <Block
            icon={<MapPin className="h-3.5 w-3.5 text-orange-400" />}
            title="Cross-Jurisdiction Activity"
          >
            <div className="flex flex-wrap gap-2">
              {suspect.cross_jurisdiction.map((d) => (
                <span
                  key={d}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    districtsHit.includes(d)
                      ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                      : "border-slate-700 bg-slate-800/60 text-slate-300"
                  }`}
                >
                  {d}
                  {districtsHit.includes(d) ? " · FIR confirmed" : " · intel only"}
                </span>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Stations touched: {stationsHit.join(", ") || "—"}
            </div>
          </Block>

          <Block
            icon={<FileText className="h-3.5 w-3.5 text-cyan-400" />}
            title={`Linked FIRs (${firs.length})`}
          >
            {isLoading && <div className="text-xs text-slate-500">Loading FIR links…</div>}
            <ul className="space-y-2">
              {firs.map((f) => (
                <li key={f.id} className="rounded-md border border-slate-800 bg-slate-900/70 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-cyan-400">{f.fir_number}</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{
                        background: `${TYPE_COLORS[f.crime_type] ?? "#ef4444"}22`,
                        color: TYPE_COLORS[f.crime_type] ?? "#ef4444",
                      }}
                    >
                      {f.crime_type}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {f.incident_date} · {String(f.incident_hour).padStart(2, "0")}:00 ·{" "}
                    {f.station_name} · {f.district}
                  </div>
                  {f.summary && (
                    <p className="mt-1 text-xs leading-snug text-slate-300">{f.summary}</p>
                  )}
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{f.status}</span>
                    <span className="text-slate-300">{inr(Number(f.loss_value))}</span>
                  </div>
                </li>
              ))}
            </ul>
            {!isLoading && firs.length === 0 && (
              <p className="text-xs text-slate-500">No FIRs currently linked to this suspect.</p>
            )}
          </Block>
        </div>
      </aside>
    </div>
  );
}

function Block({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/60 p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}

function RiskPill({ value }: { value: number }) {
  const tone =
    value >= 85
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : value >= 70
        ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}
    >
      {value}
    </span>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-800 bg-slate-900/50 ${className}`}>
      <div className="border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
