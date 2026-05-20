import Plot from "react-plotly.js";
import type { XSweepResult } from "../physics/profiles";
import { geometryLabel, type GeometryConfig } from "../physics/geometry";

interface Props {
  sweep: XSweepResult;
  geometry: GeometryConfig;
  xSel: number;
}

function sweepLayout(
  title: string,
  yTitle: string,
  xSel: number,
  yFormat?: "sci"
): Record<string, unknown> {
  return {
    title: { text: title, font: { size: 13 } },
    margin: { l: 60, r: 20, t: 40, b: 45 },
    xaxis: { title: "x [m]" },
    yaxis: {
      title: yTitle,
      tickformat: yFormat === "sci" ? ".2e" : undefined,
    },
    shapes: [
      {
        type: "line",
        x0: xSel,
        x1: xSel,
        y0: 0,
        y1: 1,
        yref: "paper",
        line: { color: "#c0392b", dash: "dot", width: 1.5 },
      },
    ],
    annotations: [
      {
        x: xSel,
        y: 1,
        yref: "paper",
        text: `x = ${xSel.toPrecision(3)} m`,
        showarrow: false,
        font: { size: 10, color: "#c0392b" },
        xanchor: "left",
        yanchor: "bottom",
      },
    ],
    height: 300,
    paper_bgcolor: "transparent",
    plot_bgcolor: "#fafbfc",
  };
}

export default function SweepPlots({ sweep, geometry, xSel }: Props) {
  const geom = geometryLabel(geometry);
  const plots = [
    {
      title: `δ₉₉ vs x — ${geom}`,
      y: sweep.delta_99.map((d) => d * 1e3),
      yTitle: "δ₉₉ [mm]",
    },
    {
      title: `δ* vs x — ${geom}`,
      y: sweep.delta_star.map((d) => d * 1e3),
      yTitle: "δ* [mm]",
    },
    {
      title: `θ vs x — ${geom}`,
      y: sweep.theta.map((d) => d * 1e3),
      yTitle: "θ [mm]",
    },
    {
      title: `C_f vs x (approx.) — ${geom}`,
      y: sweep.Cf,
      yTitle: "C_f",
      sci: true as const,
    },
  ];

  return (
    <div className="plot-grid">
      {plots.map((p) => (
        <div key={p.yTitle} className="plot-box">
          <Plot
            data={[
              {
                x: sweep.x,
                y: p.y,
                type: "scatter",
                mode: "lines+markers",
                marker: { size: 4 },
                line: { width: 1.5 },
              },
            ]}
            layout={sweepLayout(p.title, p.yTitle, xSel, p.sci ? "sci" : undefined)}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%" }}
          />
        </div>
      ))}
    </div>
  );
}
