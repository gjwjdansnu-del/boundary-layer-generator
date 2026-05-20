import type { AppInputs } from "../types";

interface Props {
  inputs: AppInputs;
  onChange: (patch: Partial<AppInputs>) => void;
}

function num(
  label: string,
  value: number,
  onChange: (v: number) => void,
  opts?: { min?: number; max?: number; step?: number }
) {
  return (
    <label>
      {label}
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

export default function Controls({ inputs, onChange }: Props) {
  return (
    <aside className="sidebar">
      <section>
        <h2>Flow input mode</h2>
        <div className="radio-row">
          <label>
            <input
              type="radio"
              checked={inputs.inputMode === "mode_a"}
              onChange={() => onChange({ inputMode: "mode_a" })}
            />
            Mode A — M, T₀, Re_unit
          </label>
          <label>
            <input
              type="radio"
              checked={inputs.inputMode === "mode_b"}
              onChange={() => onChange({ inputMode: "mode_b" })}
            />
            Mode B — U, p, T
          </label>
        </div>
      </section>

      <section>
        <h2>Edge flow condition</h2>
        {inputs.inputMode === "mode_a" ? (
          <>
            {num("M_e", inputs.M_e, (M_e) => onChange({ M_e }), { min: 0.01 })}
            <label>
              <input
                type="checkbox"
                checked={inputs.useH0}
                onChange={(e) => onChange({ useH0: e.target.checked })}
              />
              Use total enthalpy h₀ instead of T₀
            </label>
            {inputs.useH0
              ? num("h₀ [J/kg]", inputs.h0, (h0) => onChange({ h0 }))
              : num("T₀ [K]", inputs.T0, (T0) => onChange({ T0 }), { min: 1 })}
            {num("Re_unit [1/m]", inputs.Re_unit, (Re_unit) => onChange({ Re_unit }))}
            <label>
              <input
                type="checkbox"
                checked={inputs.specifyPe}
                onChange={(e) => onChange({ specifyPe: e.target.checked })}
              />
              Specify p_e
            </label>
            {inputs.specifyPe &&
              num("p_e [Pa]", inputs.p_e_modeA, (p_e_modeA) => onChange({ p_e_modeA }))}
          </>
        ) : (
          <>
            {num("U_e [m/s]", inputs.U_e, (U_e) => onChange({ U_e }))}
            {num("p_e [Pa]", inputs.p_e, (p_e) => onChange({ p_e }))}
            {num("T_e [K]", inputs.T_e, (T_e) => onChange({ T_e }), { min: 1 })}
          </>
        )}
      </section>

      <section>
        <h2>Geometry</h2>
        <label>
          Type
          <select
            value={inputs.geometry}
            onChange={(e) =>
              onChange({ geometry: e.target.value as AppInputs["geometry"] })
            }
          >
            <option value="flat_plate">2D flat plate</option>
            <option value="wedge">2D wedge</option>
            <option value="cone">Axisymmetric cone</option>
          </select>
        </label>
        {(inputs.geometry === "wedge" || inputs.geometry === "cone") &&
          num("Half-angle [deg]", inputs.coneHalfAngleDeg, (coneHalfAngleDeg) =>
            onChange({ coneHalfAngleDeg })
          )}
      </section>

      <section>
        <h2>Wall condition</h2>
        {num("T_w [K]", inputs.T_w, (T_w) => onChange({ T_w }), { min: 1 })}
      </section>

      <section>
        <h2>x location / x range</h2>
        {num("Selected x [m]", inputs.x_sel, (x_sel) => onChange({ x_sel }), { min: 1e-6 })}
        {num("x min [m]", inputs.x_min, (x_min) => onChange({ x_min }), { min: 1e-6 })}
        {num("x max [m]", inputs.x_max, (x_max) => onChange({ x_max }), { min: 1e-6 })}
        <label>
          Sweep points
          <input
            type="range"
            min={5}
            max={120}
            value={inputs.n_x}
            onChange={(e) => onChange({ n_x: parseInt(e.target.value, 10) })}
          />
          {inputs.n_x}
        </label>
      </section>

      <section>
        <h2>Advanced numerical settings</h2>
        {num("η_max", inputs.eta_max, (eta_max) => onChange({ eta_max }), { min: 4, max: 20 })}
        <label>
          η points
          <input
            type="range"
            min={100}
            max={800}
            step={50}
            value={inputs.n_eta}
            onChange={(e) => onChange({ n_eta: parseInt(e.target.value, 10) })}
          />
          {inputs.n_eta}
        </label>
        <label>
          <input
            type="checkbox"
            checked={inputs.yLogScale}
            onChange={(e) => onChange({ yLogScale: e.target.checked })}
          />
          Log y-axis (profiles)
        </label>
      </section>
    </aside>
  );
}
