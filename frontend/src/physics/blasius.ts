/** Blasius: f''' + 0.5 f f'' = 0 via shooting + RK4 */

export interface BlasiusSolution {
  eta: number[];
  f: number[];
  fp: number[];
  fpp: number[];
}

const cache = new Map<string, BlasiusSolution>();
const FPP0_LO = 0.31;
const FPP0_HI = 0.35;

type State = [number, number, number]; // f, fp, fpp

function ode(_eta: number, y: State): State {
  const [f, fp, fpp] = y;
  return [fp, fpp, -0.5 * f * fpp];
}

function rk4Step(
  eta: number,
  y: State,
  h: number
): State {
  const k1 = ode(eta, y);
  const y2 = y.map((v, i) => v + 0.5 * h * k1[i]) as State;
  const k2 = ode(eta + 0.5 * h, y2);
  const y3 = y.map((v, i) => v + 0.5 * h * k2[i]) as State;
  const k3 = ode(eta + 0.5 * h, y3);
  const y4 = y.map((v, i) => v + h * k3[i]) as State;
  const k4 = ode(eta + h, y4);
  return y.map(
    (v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
  ) as State;
}

function integrateBlasius(fpp0: number, etaMax: number, nSteps: number): { eta: number[]; y: State[] } {
  const h = etaMax / nSteps;
  const eta: number[] = [0];
  const y: State[] = [[0, 0, fpp0]];
  for (let i = 0; i < nSteps; i++) {
    const next = rk4Step(eta[i], y[i], h);
    eta.push(eta[i] + h);
    y.push(next);
  }
  return { eta, y };
}

function shootingResidual(fpp0: number, etaMax: number): number {
  const nSteps = Math.max(2000, Math.ceil(etaMax * 250));
  const { y } = integrateBlasius(fpp0, etaMax, nSteps);
  return y[y.length - 1][1] - 1;
}

function bisectFpp0(etaMax: number): number {
  let lo = FPP0_LO;
  let hi = FPP0_HI;
  let fLo = shootingResidual(lo, etaMax);
  let fHi = shootingResidual(hi, etaMax);
  if (fLo * fHi > 0) {
    throw new Error("Blasius shooting bracket failed");
  }
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    const fMid = shootingResidual(mid, etaMax);
    if (Math.abs(fMid) < 1e-10) return mid;
    if (fLo * fMid <= 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return 0.5 * (lo + hi);
}

function linspace(a: number, b: number, n: number): number[] {
  if (n <= 1) return [a];
  const out: number[] = [];
  const step = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) out.push(a + i * step);
  return out;
}

function interp(x: number[], y: number[], xq: number): number {
  if (xq <= x[0]) return y[0];
  if (xq >= x[x.length - 1]) return y[y.length - 1];
  let i = 0;
  while (i < x.length - 1 && x[i + 1] < xq) i++;
  const t = (xq - x[i]) / (x[i + 1] - x[i]);
  return y[i] + t * (y[i + 1] - y[i]);
}

function solveShooting(etaMax: number, nPoints: number): BlasiusSolution {
  const fpp0 = bisectFpp0(etaMax);
  const nSteps = Math.max(2000, Math.ceil(etaMax * 250));
  const { eta: etaFine, y } = integrateBlasius(fpp0, etaMax, nSteps);
  const fFine = y.map((s) => s[0]);
  const fpFine = y.map((s) => s[1]);
  const fppFine = y.map((s) => s[2]);
  const eta = linspace(0, etaMax, nPoints);
  return {
    eta,
    f: eta.map((e) => interp(etaFine, fFine, e)),
    fp: eta.map((e) => interp(etaFine, fpFine, e)),
    fpp: eta.map((e) => interp(etaFine, fppFine, e)),
  };
}

export function solveBlasius(etaMax = 8, nPoints = 400): BlasiusSolution {
  const key = `${etaMax}:${nPoints}`;
  let sol = cache.get(key);
  if (!sol) {
    sol = solveShooting(etaMax, nPoints);
    cache.set(key, sol);
  }
  return sol;
}

export function wallShearParameter(sol: BlasiusSolution): number {
  return sol.fpp[0];
}
