import type { ProfileAtX, XSweepResult } from "../physics/profiles";

interface Props {
  prof: ProfileAtX;
  sweep: XSweepResult;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function profileCsv(prof: ProfileAtX): string {
  const headers = [
    "x", "y", "eta", "u", "u_over_Ue", "T", "T_over_Te",
    "rho", "rho_over_rhoe", "mu", "mu_over_mue", "Mach",
  ];
  const n = prof.y.length;
  const rows: string[][] = [];
  for (let i = 0; i < n; i++) {
    rows.push([
      String(prof.x),
      String(prof.y[i]),
      String(prof.eta[i]),
      String(prof.u[i]),
      String(prof.u_over_Ue[i]),
      String(prof.T[i]),
      String(prof.T_over_Te[i]),
      String(prof.rho[i]),
      String(prof.rho_over_rhoe[i]),
      String(prof.mu[i]),
      String(prof.mu_over_mue[i]),
      String(prof.M[i]),
    ]);
  }
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function sweepCsv(sweep: XSweepResult): string {
  const headers = ["x", "x_eff", "Re_x", "delta_99", "delta_star", "theta", "Cf"];
  const rows = sweep.x.map((_, i) =>
    [
      sweep.x[i],
      sweep.x_eff[i],
      sweep.Re_x[i],
      sweep.delta_99[i],
      sweep.delta_star[i],
      sweep.theta[i],
      sweep.Cf[i],
    ].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export default function CsvExport({ prof, sweep }: Props) {
  return (
    <div className="csv-row">
      <button
        type="button"
        className="btn"
        onClick={() =>
          downloadCsv(`profile_x${prof.x.toFixed(3)}.csv`, profileCsv(prof))
        }
      >
        Download selected profile CSV
      </button>
      <button
        type="button"
        className="btn"
        onClick={() => downloadCsv("x_sweep.csv", sweepCsv(sweep))}
      >
        Download x-sweep CSV
      </button>
    </div>
  );
}
