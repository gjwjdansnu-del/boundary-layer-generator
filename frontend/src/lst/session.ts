import { deriveGeometry, type AppInputs } from "../types";
import type { EdgeConditions } from "../physics/edgeConditions";
import type { LstFlowSummary } from "./types";

export function buildLstFlowSummary(
  inputs: AppInputs,
  edge: EdgeConditions,
  edgeSourceLabel: string
): LstFlowSummary {
  const geom = deriveGeometry(inputs);
  const geometryLabel =
    geom.kind === "flat_plate"
      ? "Flat plate"
      : geom.kind === "wedge"
        ? `2D wedge (${inputs.halfAngleDeg}°)`
        : `Cone (${inputs.halfAngleDeg}° half-angle)`;

  return {
    geometryLabel,
    edgeSourceLabel,
    M_e: edge.M_e,
    U_e: edge.U_e,
    T_e: edge.T_e,
    T_w: inputs.T_w,
    Re_unit: edge.Re_unit,
    x_min_m: inputs.x_min,
    x_max_m: inputs.x_max,
  };
}
