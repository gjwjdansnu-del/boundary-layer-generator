import type { BlasiusSolution } from "./blasius";
import { solveBlasius } from "./blasius";
import { buildSimilarityProfiles } from "./compressibleProfile";
import type { EdgeConditions } from "./edgeConditions";
import {
  effectiveStreamwiseArray,
  effectiveStreamwiseDistance,
  type GeometryConfig,
} from "./geometry";

export interface ProfileAtX {
  x: number;
  x_eff: number;
  Re_x: number;
  delta_scale: number;
  y: number[];
  eta: number[];
  u: number[];
  u_over_Ue: number[];
  T: number[];
  T_over_Te: number[];
  rho: number[];
  rho_over_rhoe: number[];
  mu: number[];
  mu_over_mue: number[];
  M: number[];
  delta_99: number;
  delta_star: number;
  theta: number;
  Cf: number;
}

export interface XSweepResult {
  x: number[];
  x_eff: number[];
  Re_x: number[];
  delta_99: number[];
  delta_star: number[];
  theta: number[];
  Cf: number[];
}

function deltaScale(edge: EdgeConditions, xEff: number): number {
  if (xEff <= 0) return 0;
  return Math.sqrt((edge.mu_e * xEff) / (edge.rho_e * edge.U_e));
}

function skinFriction(fpp0: number, Re_x: number): number {
  if (Re_x <= 0) return NaN;
  return (2 * fpp0) / Math.sqrt(Re_x);
}

function trapezoid(y: number[], f: number[]): number {
  let sum = 0;
  for (let i = 0; i < y.length - 1; i++) {
    sum += 0.5 * (f[i] + f[i + 1]) * (y[i + 1] - y[i]);
  }
  return sum;
}

function integrateThicknesses(
  y: number[],
  uOverUe: number[],
  rhoOverRhoe: number[]
): { delta_99: number; delta_star: number; theta: number } {
  let idx99 = uOverUe.findIndex((u) => u >= 0.99);
  if (idx99 < 0) idx99 = y.length - 1;
  let delta_99: number;
  if (idx99 === 0) {
    delta_99 = y[0];
  } else {
    const i0 = idx99 - 1;
    const i1 = idx99;
    const u0 = uOverUe[i0];
    const u1 = uOverUe[i1];
    if (u1 === u0) delta_99 = y[idx99];
    else {
      const frac = (0.99 - u0) / (u1 - u0);
      delta_99 = y[i0] + frac * (y[i1] - y[i0]);
    }
  }
  const integrandStar = rhoOverRhoe.map((r, i) => r * (1 - uOverUe[i]));
  const integrandTheta = rhoOverRhoe.map((r, i) => r * uOverUe[i] * (1 - uOverUe[i]));
  return {
    delta_99,
    delta_star: trapezoid(y, integrandStar),
    theta: trapezoid(y, integrandTheta),
  };
}

export function profileAtX(
  edge: EdgeConditions,
  geometry: GeometryConfig,
  x: number,
  blasius?: BlasiusSolution
): ProfileAtX {
  const bl = blasius ?? solveBlasius();
  const sim = buildSimilarityProfiles(edge, bl);
  const x_eff = effectiveStreamwiseDistance(x, geometry);
  const Re_x = edge.Re_unit * x_eff;
  const d_scale = deltaScale(edge, x_eff);
  const y = sim.eta.map((e) => e * d_scale);
  const u = sim.u_over_Ue.map((u) => u * edge.U_e);
  const thick = integrateThicknesses(y, sim.u_over_Ue, sim.rho_over_rhoe);
  return {
    x,
    x_eff,
    Re_x,
    delta_scale: d_scale,
    y,
    eta: sim.eta,
    u,
    u_over_Ue: sim.u_over_Ue,
    T: sim.T,
    T_over_Te: sim.T_over_Te,
    rho: sim.rho,
    rho_over_rhoe: sim.rho_over_rhoe,
    mu: sim.mu,
    mu_over_mue: sim.mu_over_mue,
    M: sim.M,
    delta_99: thick.delta_99,
    delta_star: thick.delta_star,
    theta: thick.theta,
    Cf: skinFriction(sim.fpp0, Re_x),
  };
}

export function xSweep(
  edge: EdgeConditions,
  geometry: GeometryConfig,
  xArray: number[],
  blasius?: BlasiusSolution
): XSweepResult {
  const bl = blasius ?? solveBlasius();
  const sim = buildSimilarityProfiles(edge, bl);
  const x_eff = effectiveStreamwiseArray(xArray, geometry);
  const Re_x = x_eff.map((xe) => edge.Re_unit * xe);
  const d_scale = x_eff.map((xe) => deltaScale(edge, xe));

  const delta_99: number[] = [];
  const delta_star: number[] = [];
  const theta: number[] = [];
  const Cf: number[] = [];

  for (let i = 0; i < xArray.length; i++) {
    const y = sim.eta.map((e) => e * d_scale[i]);
    const t = integrateThicknesses(y, sim.u_over_Ue, sim.rho_over_rhoe);
    delta_99.push(t.delta_99);
    delta_star.push(t.delta_star);
    theta.push(t.theta);
    Cf.push(skinFriction(sim.fpp0, Re_x[i]));
  }

  return { x: xArray, x_eff, Re_x, delta_99, delta_star, theta, Cf };
}

export function linspace(a: number, b: number, n: number): number[] {
  if (n <= 1) return [a];
  const step = (b - a) / (n - 1);
  return Array.from({ length: n }, (_, i) => a + i * step);
}
