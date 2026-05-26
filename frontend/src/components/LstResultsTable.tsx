import type { LstPointResult } from "../lst/types";

type Props = {
  results: LstPointResult[];
};

function fmt(v: number | null, digits = 4): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toExponential(digits);
}

export default function LstResultsTable({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <div className="lst-results-wrap">
      <table className="lst-results-table">
        <thead>
          <tr>
            <th>x [mm]</th>
            <th>f [kHz]</th>
            <th>αᵣ [1/m]</th>
            <th>αᵢ [1/m]</th>
            <th>−αᵢ [1/m]</th>
            <th>cₚₕ [m/s]</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => {
            const unstable = r.growth_rate != null && r.growth_rate > 0;
            const stable = r.growth_rate != null && r.growth_rate <= 0;
            return (
              <tr
                key={`${r.x_mm}-${r.f_khz}-${i}`}
                className={
                  unstable ? "lst-row-unstable" : stable ? "lst-row-stable" : undefined
                }
              >
                <td>{r.x_mm.toFixed(2)}</td>
                <td>{r.f_khz.toFixed(1)}</td>
                <td>{fmt(r.alpha_r)}</td>
                <td>{fmt(r.alpha_i)}</td>
                <td>{fmt(r.growth_rate)}</td>
                <td>{fmt(r.phase_speed, 3)}</td>
                <td title={r.message}>
                  <span className={`lst-status lst-status-${r.status}`}>{r.status}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ul className="lst-messages">
        {results.map((r, i) =>
          r.message ? (
            <li key={i}>
              ({r.x_mm.toFixed(0)} mm, {r.f_khz.toFixed(0)} kHz): {r.message}
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
}
