import Plot from "react-plotly.js";
import type { ProfileAtX } from "../physics/profiles";
import { geometryLabel, type GeometryConfig } from "../physics/geometry";

interface Props {
  prof: ProfileAtX;
  geometry: GeometryConfig;
  yLogScale: boolean;
}

function profileLayout(
  title: string,
  xTitle: string,
  yLogScale: boolean
): Record<string, unknown> {
  return {
    title: { text: title, font: { size: 13 } },
    margin: { l: 55, r: 20, t: 40, b: 45 },
    xaxis: { title: xTitle },
    yaxis: {
      title: "y [mm]",
      type: yLogScale ? "log" : "linear",
      rangemode: yLogScale ? undefined : "tozero",
    },
    height: 320,
    paper_bgcolor: "transparent",
    plot_bgcolor: "#fafbfc",
  };
}

export default function ProfilePlots({ prof, geometry, yLogScale }: Props) {
  const geom = geometryLabel(geometry);
  const yMm = prof.y.map((v) => v * 1e3);
  const baseTitle = `${geom} @ x = ${prof.x.toPrecision(3)} m`;

  const plots = [
    {
      title: `u/U_e — ${baseTitle}`,
      x: prof.u_over_Ue,
      xTitle: "u/U_e",
      color: "#2980b9",
    },
    {
      title: `T/T_e — ${baseTitle}`,
      x: prof.T_over_Te,
      xTitle: "T/T_e",
      color: "#c0392b",
    },
    {
      title: `ρ/ρ_e — ${baseTitle}`,
      x: prof.rho_over_rhoe,
      xTitle: "ρ/ρ_e",
      color: "#27ae60",
    },
    {
      title: `Mach — ${baseTitle}`,
      x: prof.M,
      xTitle: "Mach",
      color: "#8e44ad",
    },
  ];

  return (
    <div className="plot-grid">
      {plots.map((p) => (
        <div key={p.xTitle} className="plot-box">
          <Plot
            data={[
              {
                x: p.x,
                y: yMm,
                type: "scatter",
                mode: "lines",
                line: { color: p.color, width: 2 },
              },
            ]}
            layout={profileLayout(p.title, p.xTitle, yLogScale)}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%" }}
          />
        </div>
      ))}
    </div>
  );
}
