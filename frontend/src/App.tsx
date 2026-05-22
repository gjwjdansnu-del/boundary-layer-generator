import { useMemo, useState } from "react";
import CsvExport from "./components/CsvExport";
import GeometryOverview from "./components/GeometryOverview";
import ProfilePlots from "./components/ProfilePlots";
import { OVERVIEW_LENGTH_M } from "./components/geometryPlotUtils";
import ParamRemote from "./components/ParamRemote";
import StepWizard from "./components/StepWizard";
import SummaryTable from "./components/SummaryTable";
import SweepPlots from "./components/SweepPlots";
import { MODEL_LABEL } from "./physics/constants";
import { solveBlasius } from "./physics/blasius";
import {
  fromFreestreamWithShock,
  fromModeA,
  fromModeB,
  type EdgeFromFreestreamResult,
} from "./physics/edgeConditions";
import { MANGLER_NOTE, type GeometryConfig } from "./physics/geometry";
import { linspace, profileAtX, xSweep } from "./physics/profiles";
import { DEFAULT_INPUTS, deriveGeometry, type AppInputs } from "./types";
import { APP_VERSION } from "./version";

type BuildResult = {
  edge: ReturnType<typeof fromModeB>;
  freestreamMeta: EdgeFromFreestreamResult | null;
};

function buildEdge(inputs: AppInputs): BuildResult {
  const geom = deriveGeometry(inputs);
  const deflectionDeg = geom.kind === "flat_plate" ? 0 : inputs.halfAngleDeg;

  if (inputs.flowLevel === "freestream") {
    const meta = fromFreestreamWithShock({
      inputMode: inputs.inputMode,
      T_w: inputs.T_w,
      geometry: geom.kind,
      deflectionDeg,
      ...(inputs.inputMode === "mode_a"
        ? {
            M_inf: inputs.M_inf,
            Re_unit: inputs.Re_unit,
            ...(inputs.useH0 ? { h0: inputs.h0 } : { T0: inputs.T0 }),
          }
        : {
            U_inf: inputs.U_inf,
            p_inf: inputs.p_inf,
            T_inf: inputs.T_inf,
          }),
    });
    return { edge: meta.edge, freestreamMeta: meta };
  }

  if (inputs.inputMode === "mode_a") {
    return {
      edge: fromModeA({
        M_e: inputs.M_e,
        T_w: inputs.T_w,
        Re_unit: inputs.Re_unit,
        ...(inputs.useH0 ? { h0: inputs.h0 } : { T0: inputs.T0 }),
      }),
      freestreamMeta: null,
    };
  }
  return {
    edge: fromModeB({
      U_e: inputs.U_e,
      p_e: inputs.p_e,
      T_e: inputs.T_e,
      T_w: inputs.T_w,
    }),
    freestreamMeta: null,
  };
}

export default function App() {
  const [inputs, setInputs] = useState<AppInputs>(DEFAULT_INPUTS);
  const [showResults, setShowResults] = useState(false);

  const result = useMemo(() => {
    try {
      const { edge, freestreamMeta } = buildEdge(inputs);
      const geom = deriveGeometry(inputs);
      const geometry: GeometryConfig = {
        kind: geom.kind,
        coneHalfAngleDeg: geom.coneHalfAngleDeg,
      };
      const blasius = solveBlasius(inputs.eta_max, inputs.n_eta);
      const xArr = linspace(inputs.x_min, inputs.x_max, inputs.n_x);
      const overviewX = linspace(0, OVERVIEW_LENGTH_M, 80);
      const prof = profileAtX(edge, geometry, inputs.x_sel, blasius);
      const sweep = xSweep(edge, geometry, xArr, blasius);
      const overviewSweep = xSweep(edge, geometry, overviewX, blasius);
      return {
        edge,
        geometry,
        prof,
        sweep,
        overviewSweep,
        freestreamMeta,
        error: null as string | null,
      };
    } catch (e) {
      return {
        edge: null,
        geometry: null,
        prof: null,
        sweep: null,
        overviewSweep: null,
        freestreamMeta: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, [inputs]);

  const patch = (p: Partial<AppInputs>) => setInputs((prev) => ({ ...prev, ...p }));

  return (
    <div className="app">
      <header>
        <h1>
          Boundary Layer Generator
          <span className="app-version">{APP_VERSION}</span>
        </h1>
        <p className="subtitle">
          Compressible boundary-layer similarity profiles (flat plate · wedge · cone)
        </p>
      </header>
      <p className="notice info">All calculations run locally in your browser.</p>

      {!showResults ? (
        <StepWizard
          inputs={inputs}
          onChange={patch}
          onComplete={() => setShowResults(true)}
          completeError={result.error}
        />
      ) : (
        <>
          <div className="results-toolbar">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowResults(false)}
            >
              ← Edit inputs
            </button>
            <p className="notice warn subtle">{MODEL_LABEL}</p>
          </div>

          {result.error ? (
            <p className="error">{result.error}</p>
          ) : (
            result.edge &&
            result.prof &&
            result.sweep &&
            result.overviewSweep &&
            result.geometry && (
              <div className="results-layout">
                <ParamRemote inputs={inputs} onChange={patch} error={result.error} />
                <main className="main results results-main">
                  <section>
                    <h2>Summary</h2>
                    <SummaryTable
                      edge={result.edge}
                      resolved={result.freestreamMeta?.resolved}
                      shock={result.freestreamMeta?.shock}
                      taylorMaccoll={result.freestreamMeta?.taylorMaccoll}
                      freestreamIsEdge={result.freestreamMeta?.freestreamIsEdge}
                      shockNote={result.freestreamMeta?.shock?.note}
                      tmNote={result.freestreamMeta?.taylorMaccoll?.note}
                    />
                    <div className="metrics">
                      <div className="metric">
                        <div className="label">δ₉₉ @ x</div>
                        <div className="value">{(result.prof.delta_99 * 1e3).toFixed(3)} mm</div>
                      </div>
                      <div className="metric">
                        <div className="label">Re_x</div>
                        <div className="value">{result.prof.Re_x.toExponential(3)}</div>
                      </div>
                      <div className="metric">
                        <div className="label">C_f (approx.)</div>
                        <div className="value">{result.prof.Cf.toExponential(4)}</div>
                      </div>
                    </div>
                    {result.geometry.kind === "cone" && (
                      <p className="notice warn">{MANGLER_NOTE}</p>
                    )}
                  </section>

                  <section className="hero-plot">
                    <h2>Overview (500 mm)</h2>
                    <p className="section-hint">
                      Surface, shock, δ₉₉. Green line: x = {(inputs.x_sel * 1e3).toFixed(0)} mm
                      {result.freestreamMeta?.taylorMaccoll != null && (
                        <> · β = {result.freestreamMeta.taylorMaccoll.beta_deg.toFixed(2)}°</>
                      )}
                      {result.freestreamMeta?.shock != null &&
                        result.freestreamMeta.taylorMaccoll == null && (
                          <> · β = {result.freestreamMeta.shock.beta_deg.toFixed(2)}°</>
                        )}
                    </p>
                    <GeometryOverview
                      sweep={result.overviewSweep}
                      geometry={result.geometry}
                      xSel={inputs.x_sel}
                      shockAngleDeg={
                        result.freestreamMeta?.taylorMaccoll?.beta_deg ??
                        result.freestreamMeta?.shock?.beta_deg
                      }
                    />
                  </section>

                  <section>
                    <h2>Profiles at x = {inputs.x_sel} m</h2>
                    <ProfilePlots
                      prof={result.prof}
                      geometry={result.geometry}
                      yLogScale={inputs.yLogScale}
                    />
                  </section>

                  <section>
                    <h2>Streamwise δ, C_f</h2>
                    <SweepPlots
                      sweep={result.sweep}
                      geometry={result.geometry}
                      xSel={inputs.x_sel}
                    />
                  </section>

                  <section>
                    <h2>Export CSV</h2>
                    <CsvExport prof={result.prof} sweep={result.sweep} />
                  </section>
                </main>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
