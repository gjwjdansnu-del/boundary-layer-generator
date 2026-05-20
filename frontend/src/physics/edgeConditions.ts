import { CP, R_GAS } from "./constants";
import {
  densityFromIdealGas,
  sutherlandViscosity,
  speedOfSound,
  temperatureFromTotal,
  velocityFromMach,
} from "./gas";

export interface EdgeConditions {
  M_e: number;
  U_e: number;
  T_e: number;
  p_e: number;
  rho_e: number;
  mu_e: number;
  a_e: number;
  Re_unit: number;
  T_w: number;
}

function reUnit(rho_e: number, U_e: number, mu_e: number): number {
  return (rho_e * U_e) / mu_e;
}

export function fromModeA(params: {
  M_e: number;
  T_w: number;
  T0?: number;
  h0?: number;
  Re_unit: number;
  p_e?: number;
}): EdgeConditions {
  const { M_e, T_w, Re_unit, p_e: p_eIn } = params;
  let T0_val: number;
  if (params.T0 != null && params.h0 == null) {
    T0_val = params.T0;
  } else if (params.h0 != null && params.T0 == null) {
    T0_val = params.h0 / CP;
  } else {
    throw new Error("Specify exactly one of T0 or h0.");
  }

  const T_e = temperatureFromTotal(T0_val, M_e);
  const U_e = velocityFromMach(M_e, T_e);
  const mu_e = sutherlandViscosity(T_e) as number;

  let rho_e: number;
  let p_e: number;
  if (p_eIn != null) {
    rho_e = (Re_unit * mu_e) / U_e;
    p_e = rho_e * R_GAS * T_e;
  } else {
    rho_e = (Re_unit * mu_e) / U_e;
    p_e = rho_e * R_GAS * T_e;
  }

  const a_e = speedOfSound(T_e) as number;
  return {
    M_e,
    U_e,
    T_e,
    p_e,
    rho_e,
    mu_e,
    a_e,
    Re_unit: reUnit(rho_e, U_e, mu_e),
    T_w,
  };
}

export function fromModeB(params: {
  U_e: number;
  p_e: number;
  T_e: number;
  T_w: number;
}): EdgeConditions {
  const { U_e, p_e, T_e, T_w } = params;
  const rho_e = densityFromIdealGas(p_e, T_e) as number;
  const mu_e = sutherlandViscosity(T_e) as number;
  const a_e = speedOfSound(T_e) as number;
  const M_e = U_e / a_e;
  return {
    M_e,
    U_e,
    T_e,
    p_e,
    rho_e,
    mu_e,
    a_e,
    Re_unit: reUnit(rho_e, U_e, mu_e),
    T_w,
  };
}

export function edgeToRows(edge: EdgeConditions): { quantity: string; value: string }[] {
  return [
    { quantity: "M_e", value: edge.M_e.toPrecision(5) },
    { quantity: "U_e [m/s]", value: edge.U_e.toPrecision(5) },
    { quantity: "T_e [K]", value: edge.T_e.toPrecision(5) },
    { quantity: "p_e [Pa]", value: edge.p_e.toPrecision(5) },
    { quantity: "ρ_e [kg/m³]", value: edge.rho_e.toPrecision(5) },
    { quantity: "μ_e [Pa·s]", value: edge.mu_e.toExponential(3) },
    { quantity: "a_e [m/s]", value: edge.a_e.toPrecision(5) },
    { quantity: "Re_unit [1/m]", value: edge.Re_unit.toExponential(4) },
    { quantity: "T_w [K]", value: edge.T_w.toPrecision(5) },
  ];
}
