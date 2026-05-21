import { speedOfSound } from "./gas";
import type { AppInputs } from "../types";

/** Mode B: M from U and T */
export function machFromUT(U: number, T: number): number {
  const a = speedOfSound(T) as number;
  return U / a;
}

export function velocityFromMachT(M: number, T: number): number {
  return M * (speedOfSound(T) as number);
}

/** U 변경 → M 동기화 */
export function patchModeBFromU(
  inputs: AppInputs,
  U: number,
  fs: boolean
): Partial<AppInputs> {
  const T = fs ? inputs.T_inf : inputs.T_e;
  const M = machFromUT(U, T);
  if (fs) {
    return { U_inf: U, M_inf: M };
  }
  return { U_e: U, M_e: M };
}

/** T 변경 → M 유지, U 재계산 */
export function patchModeBFromT(
  inputs: AppInputs,
  T: number,
  fs: boolean
): Partial<AppInputs> {
  const M = fs ? inputs.M_inf : inputs.M_e;
  const U = velocityFromMachT(M, T);
  if (fs) {
    return { T_inf: T, U_inf: U };
  }
  return { T_e: T, U_e: U };
}

/** M 변경 (Mode A) — Mode B에서는 U,T로부터만 */
export function patchModeAFromM(M: number, fs: boolean): Partial<AppInputs> {
  if (fs) {
    return { M_inf: M };
  }
  return { M_e: M };
}
