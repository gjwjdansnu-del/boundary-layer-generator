import { useMemo, useState } from "react";
import Controls from "./components/Controls";
import CsvExport from "./components/CsvExport";
import GeometryEnvelope from "./components/GeometryEnvelope";
import ProfilePlots from "./components/ProfilePlots";
import SummaryTable from "./components/SummaryTable";
import SweepPlots from "./components/SweepPlots";
import { MODEL_LABEL } from "./physics/constants";
import { solveBlasius } from "./physics/blasius";
import { fromModeA, fromModeB } from "./physics/edgeConditions";
import { MANGLER_NOTE, type GeometryConfig } from "./physics/geometry";
import { linspace, profileAtX, xSweep } from "./physics/profiles";
import { DEFAULT_INPUTS, type AppInputs } from "./types";

function buildEdge(inputs: AppInputs) {
  if (inputs.inputMode === "mode_a") {
    return fromModeA({
      M_e: inputs.M_e,
      T_w: inputs.T_w,
      Re_unit: inputs.Re_unit,
      ...(inputs.useH0 ? { h0: inputs.h0 } : { T0: inputs.T0 }),
      ...(inputs.specifyPe ? { p_e: inputs.p_e_modeA } : {}),
    });
  }
  return fromModeB({
    U_e: inputs.U_e,
    p_e: inputs.p_e,
    T_e: inputs.T_e,
    T_w: inputs.T_w,
  });
}

export default function App() {
  const [inputs, setInputs] = useState<AppInputs>(DEFAULT_INPUTS);

  const result = useMemo(() => {
    try {
      const edge = buildEdge(inputs);
      const geometry: GeometryConfig = {
        kind: inputs.geometry,
        coneHalfAngleDeg: inputs.coneHalfAngleDeg,
      };
      const blasius = solveBlasius(inputs.eta_max, inputs.n_eta);
      const xArr = linspace(inputs.x_min, inputs.x_max, inputs.n_x);
      const prof = profileAtX(edge, geometry, inputs.x_sel, blasius);
      const sweep = xSweep(edge, geometry, xArr, blasius);
      return { edge, geometry, prof, sweep, error: null as string | null };
    } catch (e) {
      return {
        edge: null,
        geometry: null,
        prof: null,
        sweep: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, [inputs]);

  const patch = (p: Partial<AppInputs>) => setInputs((prev) => ({ ...prev, ...p }));

  return (
    <div className="app">
      <header>
        <h1>Boundary Layer Generator</h1>
        <p className="subtitle">
          Browser-based similarity-profile generator for flat plates, wedges, and cones.
        </p>
      </header>
      <p className="notice info">All calculations run locally in your browser.</p>
      <p className="notice warn">{MODEL_LABEL}</p>

      <div className="layout">
        <Controls inputs={inputs} onChange={patch} />

        <main className="main">
          {result.error ? (
            <p className="error">{result.error}</p>
          ) : result.edge && result.prof && result.sweep && result.geometry ? (
            <>
              <section>
                <h2>A. Edge condition summary</h2>
                <SummaryTable edge={result.edge} />
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
                  <div className="metric">
                    <div className="label">x_eff</div>
                    <div className="value">{result.prof.x_eff.toFixed(4)} m</div>
                  </div>
                </div>
                {inputs.geometry === "cone" && (
                  <p className="notice warn" style={{ marginTop: "0.75rem" }}>
                    {MANGLER_NOTE}
                  </p>
                )}
              </section>

              <section>
                <h2>B. Geometry &amp; boundary-layer envelope</h2>
                <GeometryEnvelope
                  sweep={result.sweep}
                  geometry={result.geometry}
                  xSel={inputs.x_sel}
                />
              </section>

              <section>
                <h2>C. Profiles at x = {inputs.x_sel} m</h2>
                <ProfilePlots
                  prof={result.prof}
                  geometry={result.geometry}
                  yLogScale={inputs.yLogScale}
                />
              </section>

              <section>
                <h2>D. Streamwise evolution</h2>
                <SweepPlots
                  sweep={result.sweep}
                  geometry={result.geometry}
                  xSel={inputs.x_sel}
                />
              </section>

              <section>
                <h2>E. CSV export</h2>
                <CsvExport prof={result.prof} sweep={result.sweep} />
              </section>

              <section>
                <h2>F. Assumptions &amp; limitations</h2>
                <div className="assumptions">
                  <ul>
                    <li>{MODEL_LABEL}</li>
                    <li>
                      Incompressible Blasius velocity (shooting + RK4); temperature via
                      Crocco-like relation.
                    </li>
                    <li>
                      Flat plate / wedge: x_eff = x. Cone: Mangler x_eff = x/3 (first-order).
                    </li>
                    <li>C_f ≈ 2f&quot;(0)/√Re_x — approximate for compressible flow.</li>
                    <li>No LST, CFD, or AI/ML in this app.</li>
                  </ul>
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
