import { useCallback, useId, useMemo } from "react";
import type { LstPointResult, LstSelectedPoint } from "../lst/types";
import { F_MAX_KHZ, F_MIN_KHZ } from "../lst/types";

type Props = {
  xMinMm: number;
  xMaxMm: number;
  points: LstSelectedPoint[];
  results: LstPointResult[];
  onAddPoint: (x_m: number, f_khz: number) => void;
};

const W = 640;
const H = 420;
const PAD = { l: 56, r: 24, t: 24, b: 48 };

function plotRect() {
  return {
    x0: PAD.l,
    y0: PAD.t,
    w: W - PAD.l - PAD.r,
    h: H - PAD.t - PAD.b,
  };
}

function dataToSvg(xMm: number, fKhz: number, xMinMm: number, xMaxMm: number) {
  const { x0, y0, w, h } = plotRect();
  const sx = x0 + ((xMm - xMinMm) / (xMaxMm - xMinMm)) * w;
  const sy = y0 + (1 - (fKhz - F_MIN_KHZ) / (F_MAX_KHZ - F_MIN_KHZ)) * h;
  return { sx, sy };
}

function svgToData(sx: number, sy: number, xMinMm: number, xMaxMm: number) {
  const { x0, y0, w, h } = plotRect();
  const fracX = (sx - x0) / w;
  const fracY = (sy - y0) / h;
  const x_mm = Math.min(xMaxMm, Math.max(xMinMm, xMinMm + fracX * (xMaxMm - xMinMm)));
  const f_khz = Math.min(
    F_MAX_KHZ,
    Math.max(F_MIN_KHZ, F_MAX_KHZ - fracY * (F_MAX_KHZ - F_MIN_KHZ))
  );
  return { x_mm, f_khz };
}

function growthColor(g: number, gMax: number): string {
  if (!Number.isFinite(g) || g <= 0) return "#2980b9";
  const t = Math.min(1, g / Math.max(gMax, 1e-6));
  const r = Math.round(192 + 63 * t);
  const gch = Math.round(57 * (1 - t));
  const b = Math.round(43 * (1 - t));
  return `rgb(${r},${gch},${b})`;
}

export default function LstPointPlot({ xMinMm, xMaxMm, points, results, onAddPoint }: Props) {
  const clipId = useId().replace(/:/g, "");

  const gMax = useMemo(() => {
    let m = 0;
    for (const r of results) {
      if (r.growth_rate != null && r.growth_rate > m) m = r.growth_rate;
    }
    return m;
  }, [results]);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const loc = pt.matrixTransform(ctm.inverse());
      const { x0, y0, w, h } = plotRect();
      if (loc.x < x0 || loc.x > x0 + w || loc.y < y0 || loc.y > y0 + h) return;
      const { x_mm, f_khz } = svgToData(loc.x, loc.y, xMinMm, xMaxMm);
      onAddPoint(x_mm / 1e3, f_khz);
    },
    [xMinMm, xMaxMm, onAddPoint]
  );

  const { x0, y0, w, h } = plotRect();
  const xTicks = 5;
  const yTicks = 6;

  return (
    <div className="lst-point-plot">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="lst-point-plot-svg"
        role="img"
        aria-label="x–frequency plane; click to add analysis points"
        onClick={handleSvgClick}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={x0} y={y0} width={w} height={h} />
          </clipPath>
        </defs>

        <rect width={W} height={H} fill="#fff" />
        <rect x={x0} y={y0} width={w} height={h} fill="#fafbfc" stroke="#dde3ec" />

        {/* grid */}
        {Array.from({ length: xTicks + 1 }, (_, i) => {
          const xMm = xMinMm + (i / xTicks) * (xMaxMm - xMinMm);
          const { sx } = dataToSvg(xMm, F_MIN_KHZ, xMinMm, xMaxMm);
          return (
            <g key={`gx-${i}`}>
              <line x1={sx} y1={y0} x2={sx} y2={y0 + h} stroke="#e8ecf1" />
              <text x={sx} y={H - 16} textAnchor="middle" fontSize={11} fill="#5c6578">
                {xMm.toFixed(0)}
              </text>
            </g>
          );
        })}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const fKhz = F_MIN_KHZ + (i / yTicks) * (F_MAX_KHZ - F_MIN_KHZ);
          const { sy } = dataToSvg(xMinMm, fKhz, xMinMm, xMaxMm);
          return (
            <g key={`gy-${i}`}>
              <line x1={x0} y1={sy} x2={x0 + w} y2={sy} stroke="#e8ecf1" />
              <text x={x0 - 8} y={sy + 4} textAnchor="end" fontSize={11} fill="#5c6578">
                {fKhz.toFixed(0)}
              </text>
            </g>
          );
        })}

        <text x={x0 + w / 2} y={H - 4} textAnchor="middle" fontSize={12} fill="#1a1f2e">
          x [mm]
        </text>
        <text
          x={14}
          y={y0 + h / 2}
          textAnchor="middle"
          fontSize={12}
          fill="#1a1f2e"
          transform={`rotate(-90, 14, ${y0 + h / 2})`}
        >
          f [kHz]
        </text>

        <g clipPath={`url(#${clipId})`}>
          {points.map((p, i) => {
            const { sx, sy } = dataToSvg(p.x_m * 1e3, p.f_khz, xMinMm, xMaxMm);
            const gr = results[i]?.growth_rate;
            const fill =
              gr != null && Number.isFinite(gr) && gr > 0
                ? growthColor(gr, gMax)
                : "#2980b9";
            return (
              <circle
                key={p.id}
                cx={sx}
                cy={sy}
                r={8}
                fill={fill}
                stroke="#1a1f2e"
                strokeWidth={1.2}
                style={{ pointerEvents: "none" }}
              />
            );
          })}
        </g>

        {/* click capture on top of plot area */}
        <rect
          x={x0}
          y={y0}
          width={w}
          height={h}
          fill="transparent"
          style={{ cursor: "crosshair" }}
        />
      </svg>
    </div>
  );
}
