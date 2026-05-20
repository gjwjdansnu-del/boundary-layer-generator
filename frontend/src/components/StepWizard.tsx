import type { AppInputs, FlowLevel } from "../types";
import { TOTAL_STEPS } from "../types";

interface Props {
  inputs: AppInputs;
  step: number;
  onStepChange: (step: number) => void;
  onChange: (patch: Partial<AppInputs>) => void;
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

export default function StepWizard({ inputs, step, onStepChange, onChange }: Props) {
  const setFlowLevel = (flowLevel: FlowLevel) => {
    onChange({
      flowLevel,
      inputMode: flowLevel === "freestream" ? ("mode_a" as const) : ("mode_b" as const),
    });
  };

  const canNext =
    step < TOTAL_STEPS &&
    (step !== 2 ||
      (inputs.bodyType === "2d" && inputs.halfAngleDeg >= 0) ||
      (inputs.bodyType === "axisymmetric" && inputs.halfAngleDeg > 0));

  return (
    <div className="wizard">
      <div className="wizard-header">
        <h2>입력 단계</h2>
        <div className="step-dots">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`dot ${step === i + 1 ? "active" : ""} ${step > i + 1 ? "done" : ""}`}
              onClick={() => onStepChange(i + 1)}
              title={`${i + 1}단계`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="wizard-body">
        {step === 1 &&
          choice(
            "1. 몸체는 2차원인가요, 축대칭인가요?",
            "2D는 평판·웨지, 축대칭은 원뿔(콘) 흐름을 의미합니다.",
            inputs.bodyType,
            [
              { id: "2d", title: "2D (평판 / 웨지)", desc: "평판 또는 날카로운 웨지" },
              { id: "axisymmetric", title: "축대칭 (콘)", desc: "원뿔 — Mangler x_eff = x/3" },
            ],
            (bodyType) => onChange({ bodyType })
          )}

        {step === 2 && (
          <div>
            <p className="step-lead">
              2. {inputs.bodyType === "2d" ? "2D 기하 각도" : "콘 반각"}
            </p>
            <p className="step-hint">
              {inputs.bodyType === "2d"
                ? "0° = 평판 (충격파 없음). 그 외 = 웨지 각도 θ."
                : "콘 반각 = 충격파 편향각 θ 근사 (1차)."}
            </p>
            {numField(
              inputs.bodyType === "2d" ? "웨지 각도 [deg]" : "콘 반각 [deg]",
              inputs.bodyType === "2d" ? "0 = 평판" : "예: 7",
              inputs.halfAngleDeg,
              (halfAngleDeg) => onChange({ halfAngleDeg }),
              { min: 0, step: 0.1 }
            )}
          </div>
        )}

        {step === 3 &&
          choice(
            "3. 프리스트림 vs 엣지 — 무엇을 아시나요?",
            "프리스트림: M∞+T₀+Re 또는 U∞+p∞+T∞. 엣지: U_e+p_e+T_e 직접.",
            inputs.flowLevel,
            [
              {
                id: "freestream",
                title: "프리스트림 (원류)",
                desc: "M∞+T₀+Re 또는 U∞+p∞+T∞ → 충격파 후 엣지 자동 계산",
              },
              {
                id: "edge",
                title: "엣지 (이미 알고 있음)",
                desc: "U_e, p_e, T_e 를 직접 입력",
              },
            ],
            setFlowLevel
          )}

        {step === 4 &&
          choice(
            inputs.flowLevel === "freestream" ? "4. 프리스트림 입력 형식" : "4. 엣지 입력 형식",
            inputs.flowLevel === "freestream"
              ? "원류(충격파 앞) 조합"
              : "경계층 외연(충격파 뒤) 조합",
            inputs.inputMode,
            [
              {
                id: "mode_a",
                title:
                  inputs.flowLevel === "freestream"
                    ? "M∞ + T₀ + Re_unit"
                    : "M_e + T₀ + Re_unit",
                desc: "마하, 총온도(또는 h₀), 단위 레이놀즈",
              },
              {
                id: "mode_b",
                title: inputs.flowLevel === "freestream" ? "U∞ + p∞ + T∞" : "U_e + p_e + T_e",
                desc: "속도, 압력, 온도",
              },
            ],
            (inputMode) => onChange({ inputMode })
          )}

        {step === 5 && inputs.flowLevel === "freestream" && (
          <div>
            <p className="step-lead">5. 프리스트림 (원류) 수치</p>
            <p className="step-hint">
              → 정적 (M∞,p∞,T∞) 유도 → θ 충격파 → 엣지.{" "}
              <a href="https://devenport.aoe.vt.edu/aoe3114/calc.html" target="_blank" rel="noreferrer">
                VT 계산기
              </a>{" "}
              와 동일 충격식.
            </p>
            {inputs.inputMode === "mode_a" ? (
              <>
                {numField("M∞", "프리스트림 마하", inputs.M_inf, (M_inf) => onChange({ M_inf }), {
                  min: 1.01,
                })}
                <label className="field checkbox-field">
                  <input
                    type="checkbox"
                    checked={inputs.useH0}
                    onChange={(e) => onChange({ useH0: e.target.checked })}
                  />
                  h₀ (T₀ 대신)
                </label>
                {inputs.useH0
                  ? numField("h₀ [J/kg]", "", inputs.h0, (h0) => onChange({ h0 }))
                  : numField("T₀ [K]", "총온도", inputs.T0, (T0) => onChange({ T0 }))}
                {numField("Re_unit [1/m]", "프리스트림", inputs.Re_unit, (Re_unit) =>
                  onChange({ Re_unit })
                )}
              </>
            ) : (
              <>
                {numField("U∞ [m/s]", "", inputs.U_inf, (U_inf) => onChange({ U_inf }))}
                {numField("p∞ [Pa]", "", inputs.p_inf, (p_inf) => onChange({ p_inf }))}
                {numField("T∞ [K]", "", inputs.T_inf, (T_inf) => onChange({ T_inf }), { min: 1 })}
              </>
            )}
          </div>
        )}

        {step === 5 && inputs.flowLevel === "edge" && (
          <div>
            <p className="step-lead">5. 엣지 유동</p>
            <p className="step-hint">경계층 외연(충격파 뒤) 조건입니다.</p>
            {inputs.inputMode === "mode_a" ? (
              <>
                {numField("M_e", "엣지 마하", inputs.M_e, (M_e) => onChange({ M_e }), { min: 0.01 })}
                <label className="field checkbox-field">
                  <input
                    type="checkbox"
                    checked={inputs.useH0}
                    onChange={(e) => onChange({ useH0: e.target.checked })}
                  />
                  h₀ 사용 (T₀ 대신)
                </label>
                {inputs.useH0
                  ? numField("h₀ [J/kg]", "", inputs.h0, (h0) => onChange({ h0 }))
                  : numField("T₀ [K]", "엣지 총온도", inputs.T0, (T0) => onChange({ T0 }))}
                {numField("Re_unit [1/m]", "엣지 기준", inputs.Re_unit, (Re_unit) =>
                  onChange({ Re_unit })
                )}
              </>
            ) : (
              <>
                {numField("U_e [m/s]", "", inputs.U_e, (U_e) => onChange({ U_e }))}
                {numField("p_e [Pa]", "", inputs.p_e, (p_e) => onChange({ p_e }))}
                {numField("T_e [K]", "", inputs.T_e, (T_e) => onChange({ T_e }), { min: 1 })}
              </>
            )}
          </div>
        )}

        {step === 6 && (
          <div>
            <p className="step-lead">6. 벽 온도 T_w</p>
            {numField("T_w [K]", "등온 벽", inputs.T_w, (T_w) => onChange({ T_w }), { min: 1 })}
          </div>
        )}

        {step === 7 && (
          <div>
            <p className="step-lead">7. 스트림 위치 x</p>
            {numField("선택 x [m]", "", inputs.x_sel, (x_sel) => onChange({ x_sel }))}
            {numField("x min [m]", "", inputs.x_min, (x_min) => onChange({ x_min }))}
            {numField("x max [m]", "", inputs.x_max, (x_max) => onChange({ x_max }))}
            <label className="field">
              <span className="field-label">경계층 그림 과장</span>
              <input
                type="range"
                min={1}
                max={40}
                value={inputs.blVisualScale}
                onChange={(e) => onChange({ blVisualScale: parseInt(e.target.value, 10) })}
              />
              <span className="range-val">{inputs.blVisualScale}×</span>
            </label>
          </div>
        )}
      </div>

      <div className="wizard-nav">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={step <= 1}
          onClick={() => onStepChange(step - 1)}
        >
          ← 이전
        </button>
        <span className="step-counter">
          {step} / {TOTAL_STEPS}
        </span>
        <button
          type="button"
          className="btn"
          disabled={!canNext}
          onClick={() => onStepChange(Math.min(TOTAL_STEPS, step + 1))}
        >
          {step >= TOTAL_STEPS ? "완료" : "다음 →"}
        </button>
      </div>
    </div>
  );
}
