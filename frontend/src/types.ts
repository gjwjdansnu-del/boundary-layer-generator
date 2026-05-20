import type { GeometryKind } from "./physics/geometry";

export type InputMode = "mode_a" | "mode_b";

export interface AppInputs {
  inputMode: InputMode;
  // Mode A
  M_e: number;
  T0: number;
  useH0: boolean;
  h0: number;
  Re_unit: number;
  specifyPe: boolean;
  p_e_modeA: number;
  // Mode B
  U_e: number;
  p_e: number;
  T_e: number;
  // Common
  T_w: number;
  geometry: GeometryKind;
  coneHalfAngleDeg: number;
  x_sel: number;
  x_min: number;
  x_max: number;
  n_x: number;
  eta_max: number;
  n_eta: number;
  yLogScale: boolean;
}

export const DEFAULT_INPUTS: AppInputs = {
  inputMode: "mode_b",
  M_e: 5.9,
  T0: 1500,
  useH0: false,
  h0: 1.5e6,
  Re_unit: 9.9e6,
  specifyPe: false,
  p_e_modeA: 4670,
  U_e: 1698,
  p_e: 4670,
  T_e: 206,
  T_w: 300,
  geometry: "cone",
  coneHalfAngleDeg: 7,
  x_sel: 0.3,
  x_min: 0.05,
  x_max: 0.5,
  n_x: 40,
  eta_max: 8,
  n_eta: 400,
  yLogScale: false,
};
