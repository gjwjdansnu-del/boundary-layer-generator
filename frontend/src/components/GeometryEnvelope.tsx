import Plot from "react-plotly.js";
import type { XSweepResult } from "../physics/profiles";
import { geometryLabel, type GeometryConfig } from "../physics/geometry";

interface Props {
  sweep: XSweepResult;
  geometry: GeometryConfig;
  xSel: number;
}

export default function GeometryEnvelope({ sweep, geometry, xSel }: Props) {
  const x = sweep.x;
  const halfRad = (geometry.coneHalfAngleDeg * Math.PI) / 180;

  let ySurf: number[];
  let centerline: number[] | null = null;

  if (geometry.kind === "flat_plate") {
    ySurf = x.map(() => 0);
  } else {
    const angle = geometry.kind === "wedge" ? Math.max(halfRad, 0.001) : halfRad;
    ySurf = x.map((xi) => xi * Math.tan(angle));
    if (geometry.kind === "cone") {
      centerline = x.map(() => 0);
    }
  }

  const ySurfMm = ySurf.map((y) => y * 1e3);
  const yBlMm = ySurf.map((ys, i) => (ys + sweep.delta_99[i]) * 1e3);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const traces: any[] = [];

  if (centerline) {
    traces.push({
      x,
      y: centerline.map(() => 0),
      mode: "lines",
      name: "Centerline",
      line: { color: "#666", dash: "dot", width: 1 },
    });
  }

  traces.push({
    x,
    y: ySurfMm,
    mode: "lines",
    name: "Body surface",
    line: { color: "#222", width: 2.5 },
  });
  traces.push({
    x,
    y: yBlMm,
    mode: "lines",
    name: "δ₉₉",
    line: { color: "#2980b9", dash: "dash", width: 2 },
    fill: "tonexty",
    fillcolor: "rgba(52,152,219,0.15)",
  });

  const layout: Record<string, unknown> = {
    title: { text: `Geometry & BL envelope — ${geometryLabel(geometry)}`, font: { size: 14 } },
    margin: { l: 55, r: 20, t: 45, b: 45 },
    xaxis: { title: "x [m]" },
    yaxis: { title: "y [mm]", rangemode: "tozero" },
    height: 380,
    legend: { x: 0.02, y: 0.98 },
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
      },
    ],
    paper_bgcolor: "transparent",
    plot_bgcolor: "#fafbfc",
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%" }}
    />
  );
}
