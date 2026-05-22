import type { AppInputs } from "../types";
import { deriveGeometry } from "../types";
import {
  machFromUT,
  patchModeAFromM,
  patchModeBFromT,
  patchModeBFromU,
} from "../physics/paramCoupling";

const RE_E6 = 1e6;
const H_MJ = 1e6;

interface Props {
  inputs: AppInputs;
  onChange: (patch: Partial<AppInputs>) => void;
  error: string | null;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="remote-slider">
      <span className="remote-slider-head">
        <span>{label}</span>
        <span className="remote-slider-val">
          {value.toPrecision(4)} {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

export default function ParamRemote({ inputs, onChange, error }: Props) {
  const fs = inputs.flowLevel === "freestream";
  const geom = deriveGeometry(inputs);
  const showAngle = geom.kind !== "flat_plate";
  const angleMax = inputs.bodyType === "axisymmetric" ? 20 : 25;

  const modeB_M = fs
    ? machFromUT(inputs.U_inf, inputs.T_inf)
    : machFromUT(inputs.U_e, inputs.T_e);

  return (
    <aside className="param-remote" aria-label="Parameter remote">
      <h2 className="param-remote-title">Parameters</h2>
      <p className="param-remote-hint">
        {fs ? "Freestream" : "Edge"} · {inputs.inputMode === "mode_a" ? "M+Re+h" : "u+p+T"}
      </p>
      {error && <p className="param-remote-error">{error}</p>}

      {showAngle && (
        <SliderRow
          label={inputs.bodyType === "axisymmetric" ? "Cone half-angle" : "Wedge angle"}
          value={inputs.halfAngleDeg}
          min={inputs.bodyType === "axisymmetric" ? 0.5 : 0}
          max={angleMax}
          step={0.1}
          unit="°"
          onChange={(halfAngleDeg) => onChange({ halfAngleDeg })}
        />
      )}

      {inputs.inputMode === "mode_a" ? (
        <>
          <SliderRow
            label={fs ? "M∞" : "M_e"}
            value={fs ? inputs.M_inf : inputs.M_e}
            min={1.2}
            max={12}
            step={0.01}
            unit=""
            onChange={(M) => onChange(patchModeAFromM(M, fs))}
          />
          <SliderRow
            label="Re (×10⁶/m)"
            value={inputs.Re_unit / RE_E6}
            min={1}
            max={20}
            step={0.1}
            unit=""
            onChange={(re) => onChange({ Re_unit: re * RE_E6 })}
          />
          {inputs.useH0 ? (
            <SliderRow
              label="h_tot"
              value={inputs.h0 / H_MJ}
              min={0.4}
              max={3.5}
              step={0.01}
              unit="MJ/kg"
              onChange={(h) => onChange({ h0: h * H_MJ })}
            />
          ) : (
            <SliderRow
              label="T₀"
              value={inputs.T0}
              min={400}
              max={2500}
              step={5}
              unit="K"
              onChange={(T0) => onChange({ T0 })}
            />
          )}
        </>
      ) : (
        <>
          <SliderRow
            label={fs ? "U∞" : "U_e"}
            value={fs ? inputs.U_inf : inputs.U_e}
            min={400}
            max={3500}
            step={5}
            unit="m/s"
            onChange={(U) => onChange(patchModeBFromU(inputs, U, fs))}
          />
          <SliderRow
            label={fs ? "p∞" : "p_e"}
            value={fs ? inputs.p_inf : inputs.p_e}
            min={200}
            max={80000}
            step={50}
            unit="Pa"
            onChange={(p) =>
              onChange(fs ? { p_inf: p } : { p_e: p })
            }
          />
          <SliderRow
            label={fs ? "T∞" : "T_e"}
            value={fs ? inputs.T_inf : inputs.T_e}
            min={120}
            max={450}
            step={1}
            unit="K"
            onChange={(T) => onChange(patchModeBFromT(inputs, T, fs))}
          />
          <p className="remote-derived">M (coupled) = {modeB_M.toFixed(3)}</p>
        </>
      )}

      <SliderRow
        label="T_w"
        value={inputs.T_w}
        min={200}
        max={1200}
        step={5}
        unit="K"
        onChange={(T_w) => onChange({ T_w })}
      />

      <SliderRow
        label="x (profile)"
        value={inputs.x_sel * 1e3}
        min={inputs.x_min * 1e3}
        max={inputs.x_max * 1e3}
        step={1}
        unit="mm"
        onChange={(xmm) => onChange({ x_sel: xmm / 1e3 })}
      />
    </aside>
  );
}
