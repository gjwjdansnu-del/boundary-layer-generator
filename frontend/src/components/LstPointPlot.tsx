import Plot from "react-plotly.js";
import type { LstPointResult, LstSelectedPoint } from "../lst/types";
import { F_MAX_KHZ, F_MIN_KHZ } from "../lst/types";

type Props = {
  xMinMm: number;
  xMaxMm: number;
  points: LstSelectedPoint[];
  results: LstPointResult[];
  onAddPoint: (x_m: number, f_khz: number) => void;
};

export default function LstPointPlot({ xMinMm, xMaxMm, points, results, onAddPoint }: Props) {
  const markerColors = points.map((_, i) => {
    const r = results[i];
    if (r?.growth_rate != null && Number.isFinite(r.growth_rate)) return r.growth_rate;
    return 0;
  });

  const hasGrowth = markerColors.some((c) => c > 0);

  return (
    <Plot
      data={[
        {
          type: "scatter",
          mode: "markers",
          x: points.map((p) => p.x_m * 1e3),
          y: points.map((p) => p.f_khz),
          marker: {
            size: 12,
            color: markerColors,
            colorscale: "RdYlBu_r",
            cmin: hasGrowth ? 0 : -1,
            cmax: hasGrowth ? Math.max(...markerColors, 1) : 1,
            colorbar: hasGrowth ? { title: { text: "−αᵢ [1/m]" } } : undefined,
            line: { color: "#1a1f2e", width: 1 },
          },
          name: "Selected",
          hovertemplate:
            "x=%{x:.1f} mm<br>f=%{y:.1f} kHz<extra></extra>",
        },
      ]}
      layout={{
        width: undefined,
        height: 420,
        margin: { l: 56, r: hasGrowth ? 80 : 24, t: 24, b: 48 },
        paper_bgcolor: "#fff",
        plot_bgcolor: "#fafbfc",
        xaxis: {
          title: "x [mm]",
          range: [xMinMm, xMaxMm],
          zeroline: false,
        },
        yaxis: {
          title: "f [kHz]",
          range: [F_MIN_KHZ, F_MAX_KHZ],
          zeroline: false,
        },
        showlegend: false,
        dragmode: false,
      }}
      config={{
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ["lasso2d", "select2d"],
      }}
      style={{ width: "100%" }}
      useResizeHandler
      onClick={(ev) => {
        const pt = ev.points?.[0];
        if (!pt || typeof pt.x !== "number" || typeof pt.y !== "number") return;
        const x_mm = Math.min(xMaxMm, Math.max(xMinMm, pt.x));
        const f_khz = Math.min(F_MAX_KHZ, Math.max(F_MIN_KHZ, pt.y));
        onAddPoint(x_mm / 1e3, f_khz);
      }}
    />
  );
}
