import { GAMMA, PR } from "../physics/constants";
import type { EdgeConditions } from "../physics/edgeConditions";
import { profileAtX } from "../physics/profiles";
import type { GeometryConfig } from "../physics/geometry";
import { solveBlasius } from "../physics/blasius";
import type { LstBaseflowPayload, LstSolverOptions } from "./types";

/** Physical BL profile at x for LST (matches LST_profile *.dat columns). */
export function extractBaseflowAtX(
  edge: EdgeConditions,
  geometry: GeometryConfig,
  x: number,
  eta_max: number,
  n_eta: number
): LstBaseflowPayload {
  const blasius = solveBlasius(eta_max, n_eta);
  const prof = profileAtX(edge, geometry, x, blasius);
  const p = prof.rho.map(() => edge.p_e); // constant p_e along y (similarity)
  return {
    x: prof.x,
    y: prof.y,
    U: prof.u,
    V: prof.y.map(() => 0),
    T: prof.T,
    rho: prof.rho,
    p,
    mu: prof.mu,
  };
}

export function solverOptionsFromEdge(
  edge: EdgeConditions,
  geometry: GeometryConfig
): LstSolverOptions {
  return {
    Ma_e: edge.M_e,
    U_e: edge.U_e,
    T_e: edge.T_e,
    rho_e: edge.rho_e,
    mu_e: edge.mu_e,
    Re_unit: edge.Re_unit,
    Pr: PR,
    gamma: GAMMA,
    geometry_kind: geometry.kind,
  };
}
