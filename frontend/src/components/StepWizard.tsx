import { useEffect, useState, type ReactNode } from "react";
import type { AppInputs, FlowLevel, InputMode } from "../types";
import { deriveGeometry } from "../types";

const RE_PER_M_TO_E6 = 1e6;
const H_JKG_TO_MJKG = 1e6;

interface Props {
  inputs: AppInputs;
  onChange: (patch: Partial<AppInputs>) => void;
  onComplete: () => void;
  completeError?: string | null;
}

function isGeometryComplete(inputs: AppInputs): boolean {
  if (inputs.bodyType === "axisymmetric") return inputs.halfAngleDeg > 0;
  return inputs.halfAngleDeg >= 0;
}

function numField(
  label: string,
  hint: string,
  value: number,
  onChange: (v: number) => void,
  opts?: { min?: number; max?: number; step?: number }
) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-hint">{hint}</span>
      <input
        type="number"
        value={value}
        min={opts?.min}
        max={opts?.max}
        step={opts?.step ?? "any"}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </label>
  );
}

function choice<T extends string>(
  title: string,
  hint: string,
  value: T,
  options: { id: T; title: string; desc: string }[],
  onPick: (id: T) => void
) {
  return (
    <div className="choice-group">
      <p className="step-lead">{title}</p>
      <p className="step-hint">{hint}</p>
      <div className="choice-cards">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`choice-card ${value === o.id ? "selected" : ""}`}
            onClick={() => onPick(o.id)}
          >
            <strong>{o.title}</strong>
            <span>{o.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ValueFields({
  inputs,
  onChange,
}: {
  inputs: AppInputs;
  onChange: (patch: Partial<AppInputs>) => void;
}) {
  const fs = inputs.flowLevel === "freestream";

  if (inputs.inputMode === "mode_a") {
    return (
      <>
        {numField(
          fs ? "M∞" : "M_e",
          "Mach number",
          fs ? inputs.M_inf : inputs.M_e,
          (v) => onChange(fs ? { M_inf: v } : { M_e: v }),
          { min: fs ? 1.01 : 0.01 }
        )}
        {numField(
          "Re [×10⁶/m]",
          "Unit Reynolds number",
          inputs.Re_unit / RE_PER_M_TO_E6,
          (reE6) => onChange({ Re_unit: reE6 * RE_PER_M_TO_E6 })
        )}
        <label className="field checkbox-field">
          <input
            type="checkbox"
            checked={!inputs.useH0}
            onChange={(e) => onChange({ useH0: !e.target.checked })}
          />
          Use T₀ [K] instead of h_tot
        </label>
        {inputs.useH0 ? (
          numField(
            "h_tot [MJ/kg]",
            "Total enthalpy",
            inputs.h0 / H_JKG_TO_MJKG,
            (hMj) => onChange({ h0: hMj * H_JKG_TO_MJKG })
          )
        ) : (
          numField("T₀ [K]", "Total temperature", inputs.T0, (T0) => onChange({ T0 }))
        )}
      </>
    );
  }

  return (
    <>
      {numField(
        fs ? "U∞ [m/s]" : "U_e [m/s]",
        "Velocity",
        fs ? inputs.U_inf : inputs.U_e,
        (v) => onChange(fs ? { U_inf: v } : { U_e: v })
      )}
      {numField(
        fs ? "p∞ [Pa]" : "p_e [Pa]",
        "Pressure",
        fs ? inputs.p_inf : inputs.p_e,
        (v) => onChange(fs ? { p_inf: v } : { p_e: v })
      )}
      {numField(
        fs ? "T∞ [K]" : "T_e [K]",
        "Temperature",
        fs ? inputs.T_inf : inputs.T_e,
        (v) => onChange(fs ? { T_inf: v } : { T_e: v }),
        { min: 1 }
      )}
    </>
  );
}

function InputSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="input-section" aria-labelledby={`input-sec-${n}`}>
      <h3 id={`input-sec-${n}`} className="input-section-title">
        {n}. {title}
      </h3>
      {children}
    </section>
  );
}

export default function StepWizard({
  inputs,
  onChange,
  onComplete,
  completeError,
}: Props) {
  const [unlocked, setUnlocked] = useState(1);
  const geom = deriveGeometry(inputs);
  const stateLabel = inputs.flowLevel === "freestream" ? "Freestream" : "Edge";

  useEffect(() => {
    if (isGeometryComplete(inputs)) {
      setUnlocked((u) => Math.max(u, 2));
    }
  }, [inputs.bodyType, inputs.halfAngleDeg]);

  const pickFlow = (flowLevel: FlowLevel) => {
    onChange({ flowLevel });
    setUnlocked((u) => Math.max(u, 3));
  };

  const pickMode = (inputMode: InputMode) => {
    onChange({ inputMode });
    setUnlocked((u) => Math.max(u, 4));
  };

  useEffect(() => {
    if (unlocked >= 4) setUnlocked((u) => Math.max(u, 5));
  }, [unlocked]);

  useEffect(() => {
    if (unlocked >= 5) setUnlocked((u) => Math.max(u, 6));
  }, [unlocked]);

  const freestreamFlowHint =
    geom.kind === "flat_plate"
      ? "Flat plate: freestream equals edge (no shock)."
      : geom.kind === "cone"
        ? "Cone: Taylor–Maccoll → edge."
        : "Wedge: 2D oblique shock → edge.";

  return (
    <div className="wizard input-stack">
      <h2 className="input-stack-heading">Inputs</h2>
      <p className="step-hint">
        Complete each section from top to bottom. The next section appears as you go.
      </p>

      <InputSection n={1} title="Geometry">
        {choice(
          "Body",
          "Flat plate (0°) · wedge: 2D oblique · cone: Taylor–Maccoll",
          inputs.bodyType,
          [
            { id: "2d", title: "2D (plate / wedge)", desc: "Flat plate or wedge" },
            { id: "axisymmetric", title: "Axisymmetric (cone)", desc: "Mangler x_eff = x/3" },
          ],
          (bodyType) => onChange({ bodyType })
        )}
        {numField(
          inputs.bodyType === "2d" ? "Wedge angle [deg]" : "Cone half-angle [deg]",
          inputs.bodyType === "2d" ? "0° = flat plate" : "e.g. 7",
          inputs.halfAngleDeg,
          (halfAngleDeg) => onChange({ halfAngleDeg }),
          { min: 0, step: 0.1 }
        )}
      </InputSection>

      {unlocked >= 2 && (
        <InputSection n={2} title="Which state to specify?">
          {choice(
            "Flow level",
            "Freestream = upstream of shock. Edge = outer boundary-layer state.",
            inputs.flowLevel,
            [
              {
                id: "freestream",
                title: "Freestream",
                desc: freestreamFlowHint,
              },
              {
                id: "edge",
                title: "Edge",
                desc: "Known edge conditions (skip shock / TM solve).",
              },
            ],
            pickFlow
          )}
        </InputSection>
      )}

      {unlocked >= 3 && (
        <InputSection n={3} title="How to specify that state?">
          {choice(
            "Input format",
            `${stateLabel} — choose one format.`,
            inputs.inputMode,
            [
              {
                id: "mode_a",
                title: "M + Re + h_tot",
                desc: "Mach, Re [×10⁶/m], h_tot [MJ/kg] (or T₀)",
              },
              {
                id: "mode_b",
                title: "u + p + T",
                desc: "Velocity, pressure, temperature (static)",
              },
            ],
            pickMode
          )}
        </InputSection>
      )}

      {unlocked >= 4 && (
        <InputSection n={4} title={`${stateLabel} values`}>
          {inputs.flowLevel === "freestream" && (
            <p className="step-hint">{freestreamFlowHint}</p>
          )}
          {inputs.flowLevel === "edge" && (
            <p className="step-hint">Values are used directly as edge conditions.</p>
          )}
          <ValueFields inputs={inputs} onChange={onChange} />
        </InputSection>
      )}

      {unlocked >= 5 && (
        <InputSection n={5} title="Wall temperature">
          {numField("T_w [K]", "Isothermal wall", inputs.T_w, (T_w) => onChange({ T_w }), {
            min: 1,
          })}
        </InputSection>
      )}

      {unlocked >= 6 && (
        <InputSection n={6} title="Streamwise range">
          {numField("x min [m]", "Sweep / CSV lower bound", inputs.x_min, (x_min) =>
            onChange({ x_min })
          )}
          {numField(
            "x max [m]",
            "Sweep / CSV upper bound (overview plot fixed at 500 mm)",
            inputs.x_max,
            (x_max) => onChange({ x_max })
          )}
          <p className="step-hint">
            Profile station x is adjusted on the results page (parameter remote).
          </p>
        </InputSection>
      )}

      {unlocked >= 6 && (
        <div className="wizard-complete">
          {completeError && <p className="error">{completeError}</p>}
          <button
            type="button"
            className="btn btn-complete"
            disabled={!isGeometryComplete(inputs)}
            onClick={onComplete}
          >
            Complete — show results
          </button>
        </div>
      )}
    </div>
  );
}
