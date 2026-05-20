import { GAMMA, R_GAS } from "./constants";

const MU_REF = 1.716e-5;
const T_REF = 273.15;
const S_SUTH = 110.4;

export function sutherlandViscosity(T: number | number[]): number | number[] {
  if (typeof T === "number") {
    return MU_REF * (T / T_REF) ** 1.5 * ((T_REF + S_SUTH) / (T + S_SUTH));
  }
  return T.map((t) => sutherlandViscosity(t) as number);
}

export function speedOfSound(T: number | number[]): number | number[] {
  if (typeof T === "number") {
    return Math.sqrt(GAMMA * R_GAS * T);
  }
  return T.map((t) => speedOfSound(t) as number);
}

export function densityFromIdealGas(p: number, T: number | number[]): number | number[] {
  if (typeof T === "number") {
    return p / (R_GAS * T);
  }
  return T.map((t) => p / (R_GAS * t));
}

export function velocityFromMach(M: number, T: number): number {
  return M * (speedOfSound(T) as number);
}

export function temperatureFromTotal(T0: number, M: number): number {
  return T0 / (1 + 0.5 * (GAMMA - 1) * M * M);
}
