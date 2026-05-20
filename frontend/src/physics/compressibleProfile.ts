import { GAMMA, PR } from "./constants";
import { densityFromIdealGas, speedOfSound, sutherlandViscosity } from "./gas";
import type { BlasiusSolution } from "./blasius";
import { solveBlasius } from "./blasius";
import type { EdgeConditions } from "./edgeConditions";

export function recoveryFactor(): number {
  return Math.sqrt(PR);
}

export function adiabaticWallTemperature(T_e: number, M_e: number): number {
  const r = recoveryFactor();
  return T_e * (1 + (r * (GAMMA - 1) * M_e * M_e) / 2);
}

export function temperatureProfile(
  uOverUe: number[],
  T_e: number,
  T_w: number,
  M_e: number
): number[] {
  const T_aw = adiabaticWallTemperature(T_e, M_e);
  return uOverUe.map(
    (u) => T_w + (T_aw - T_w) * u + (T_e - T_aw) * u * u
  );
}

export interface SimilarityProfiles {
  eta: number[];
  u_over_Ue: number[];
  T: number[];
  T_over_Te: number[];
  rho: number[];
  rho_over_rhoe: number[];
  mu: number[];
  mu_over_mue: number[];
  M: number[];
  fpp0: number;
}

export function buildSimilarityProfiles(
  edge: EdgeConditions,
  blasius?: BlasiusSolution
): SimilarityProfiles {
  const bl = blasius ?? solveBlasius();
  const eta = bl.eta;
  const u_over_Ue = bl.fp;
  const T = temperatureProfile(u_over_Ue, edge.T_e, edge.T_w, edge.M_e);
  const rho = densityFromIdealGas(edge.p_e, T) as number[];
  const mu = sutherlandViscosity(T) as number[];
  const a = speedOfSound(T) as number[];
  const M = u_over_Ue.map((u, i) => (u * edge.U_e) / a[i]);
  return {
    eta,
    u_over_Ue,
    T,
    T_over_Te: T.map((t) => t / edge.T_e),
    rho,
    rho_over_rhoe: rho.map((r) => r / edge.rho_e),
    mu,
    mu_over_mue: mu.map((m) => m / edge.mu_e),
    M,
    fpp0: bl.fpp[0],
  };
}
