import type { EdgeConditions } from "../physics/edgeConditions";
import type { GeometryConfig } from "../physics/geometry";
import type { AppInputs } from "../types";

export interface LstSelectedPoint {
  id: string;
  x_m: number;
  f_khz: number;
}

export interface LstFlowSummary {
  geometryLabel: string;
  edgeSourceLabel: string;
  M_e: number;
  U_e: number;
  T_e: number;
  T_w: number;
  Re_unit: number;
  x_min_m: number;
  x_max_m: number;
}

export interface LstSession {
  inputs: AppInputs;
  summary: LstFlowSummary;
  edge: EdgeConditions;
  geometry: GeometryConfig;
}

export interface LstBaseflowPayload {
  x: number;
  y: number[];
  U: number[];
  V: number[];
  T: number[];
  rho: number[];
  p: number[];
  mu: number[];
}

export interface LstSolverOptions {
  Ma_e: number;
  U_e: number;
  T_e: number;
  rho_e: number;
  mu_e: number;
  Re_unit: number;
  Pr: number;
  gamma: number;
  geometry_kind: string;
}

export interface LstPointResult {
  x_mm: number;
  f_khz: number;
  alpha_r: number | null;
  alpha_i: number | null;
  growth_rate: number | null;
  phase_speed: number | null;
  status: string;
  message: string;
}

export const F_MIN_KHZ = 0;
export const F_MAX_KHZ = 1100;
