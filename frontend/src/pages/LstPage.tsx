import { useCallback, useMemo, useState } from "react";
import LstPointPlot from "../components/LstPointPlot";
import LstResultsTable from "../components/LstResultsTable";
import { extractBaseflowAtX, solverOptionsFromEdge } from "../lst/baseflowExport";
import { loadLstEngine, runLstPointsPyodide } from "../lst/pyodideEngine";
import type { LstPointResult, LstSelectedPoint, LstSession } from "../lst/types";
import { F_MAX_KHZ, F_MIN_KHZ } from "../lst/types";
import { APP_VERSION } from "../version";

type Props = {
  session: LstSession;
  onBack: () => void;
};

function newPointId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resultsToCsv(rows: LstPointResult[]): string {
  const header =
    "x_mm,f_khz,alpha_r,alpha_i,growth_rate,phase_speed,status,message";
  const lines = rows.map((r) =>
    [
      r.x_mm,
      r.f_khz,
      r.alpha_r ?? "",
      r.alpha_i ?? "",
      r.growth_rate ?? "",
      r.phase_speed ?? "",
      r.status,
      `"${(r.message ?? "").replace(/"/g, '""')}"`,
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

export default function LstPage({ session, onBack }: Props) {
  const { inputs, summary, edge, geometry } = session;
  const xMinMm = summary.x_min_m * 1e3;
  const xMaxMm = summary.x_max_m * 1e3;

  const [points, setPoints] = useState<LstSelectedPoint[]>([]);
  const [results, setResults] = useState<LstPointResult[]>([]);
  const [engineStatus, setEngineStatus] = useState<string>("");
  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const solverOptions = useMemo(
    () => solverOptionsFromEdge(edge, geometry),
    [edge, geometry]
  );

  const loadEngine = useCallback(async () => {
    setEngineError(null);
    try {
      await loadLstEngine(setEngineStatus);
      setEngineReady(true);
    } catch (e) {
      setEngineError(e instanceof Error ? e.message : String(e));
      setEngineReady(false);
    }
  }, []);

  const addPoint = (x_m: number, f_khz: number) => {
    setPoints((prev) => [
      ...prev,
      { id: newPointId(), x_m, f_khz },
    ]);
    setResults([]);
  };

  const removeLast = () => setPoints((prev) => prev.slice(0, -1));
  const clearAll = () => {
    setPoints([]);
    setResults([]);
  };

  const runSelected = async () => {
    if (points.length === 0) return;
    setRunning(true);
    setRunError(null);
    try {
      if (!engineReady) await loadEngine();
      const baseflows = points.map((p) =>
        extractBaseflowAtX(edge, geometry, p.x_m, inputs.eta_max, inputs.n_eta)
      );
      const freqs = points.map((p) => p.f_khz);
      const out = await runLstPointsPyodide(
        baseflows,
        freqs,
        solverOptions,
        setEngineStatus
      );
      setResults(out);
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const downloadCsv = () => {
    if (results.length === 0) return;
    const blob = new Blob([resultsToCsv(results)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lst_point_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasPlaceholder = results.some((r) => r.status === "placeholder");

  return (
    <div className="app lst-page">
      <header>
        <h1>
          Spatial LST Point Analysis
          <span className="app-version">{APP_VERSION}</span>
        </h1>
        <p className="subtitle">
          Compute local spatial growth rates only at selected x–frequency points.
        </p>
      </header>

      <div className="results-toolbar">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          ← Back to Boundary Layer Generator
        </button>
      </div>

      <ul className="lst-assumptions">
        <li>Local spatial LST point analysis. No N-factor is computed.</li>
        <li>Baseflow comes from the current compressible Blasius-like boundary-layer generator.</li>
        <li>Cone mode uses Taylor–Maccoll edge flow and Mangler-type x_eff = x/3 scaling.</li>
        <li>
          <strong>Experimental implementation.</strong> LST solver is being ported from the
          existing MATLAB/Python code.
        </li>
      </ul>

      {hasPlaceholder && (
        <p className="notice warn">
          Solver returned <strong>placeholder</strong> status — not real LST eigenvalues. The
          spatial GEVP core is not connected yet; UI and baseflow bridge are operational.
        </p>
      )}

      <section className="lst-summary-card">
        <h2>Current case</h2>
        <dl className="lst-summary-dl">
          <dt>Geometry</dt>
          <dd>{summary.geometryLabel}</dd>
          <dt>Edge source</dt>
          <dd>{summary.edgeSourceLabel}</dd>
          <dt>Mach (edge)</dt>
          <dd>{summary.M_e.toFixed(2)}</dd>
          <dt>Uₑ</dt>
          <dd>{summary.U_e.toFixed(1)} m/s</dd>
          <dt>Tₑ / T_w</dt>
          <dd>
            {summary.T_e.toFixed(1)} K / {summary.T_w.toFixed(1)} K
          </dd>
          <dt>Re_unit</dt>
          <dd>{summary.Re_unit.toExponential(3)} /m</dd>
          <dt>x range</dt>
          <dd>
            {xMinMm.toFixed(1)} – {xMaxMm.toFixed(1)} mm
          </dd>
          <dt>f range (plot)</dt>
          <dd>
            {F_MIN_KHZ} – {F_MAX_KHZ} kHz
          </dd>
        </dl>
      </section>

      <section className="lst-plot-section">
        <h2>Select analysis points</h2>
        <p className="section-hint">
          Click inside the gray plot area to add a point. Multiple points allowed. Pyodide loads
          only when you run LST (not on page open).
        </p>
        <LstPointPlot
          xMinMm={xMinMm}
          xMaxMm={xMaxMm}
          points={points}
          results={results}
          onAddPoint={addPoint}
        />
        {points.length > 0 && (
          <ul className="lst-point-list">
            {points.map((p, i) => (
              <li key={p.id}>
                #{i + 1}: x = {(p.x_m * 1e3).toFixed(1)} mm, f = {p.f_khz.toFixed(1)} kHz
              </li>
            ))}
          </ul>
        )}
        <div className="lst-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={points.length === 0 || running}
            onClick={() => void runSelected()}
          >
            {running ? "Running…" : "Run selected LST points"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={points.length === 0 || running}
            onClick={clearAll}
          >
            Clear selected points
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={points.length === 0 || running}
            onClick={removeLast}
          >
            Remove last point
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void loadEngine()}>
            Reload LST engine
          </button>
        </div>
        {engineStatus && <p className="section-hint lst-engine-status">{engineStatus}</p>}
        {engineError && <p className="error">{engineError}</p>}
        {runError && <p className="error">{runError}</p>}
      </section>

      {results.length > 0 && (
        <section>
          <h2>Results</h2>
          <p className="section-hint">
            Color: positive −αᵢ = amplified (unstable); negative or zero = damped (stable).
          </p>
          <LstResultsTable results={results} />
          <button type="button" className="btn btn-secondary" onClick={downloadCsv}>
            Download results CSV
          </button>
        </section>
      )}
    </div>
  );
}
