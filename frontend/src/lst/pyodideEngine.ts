import type { LstBaseflowPayload, LstPointResult, LstSolverOptions } from "./types";

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL?: string }) => Promise<PyodideInterface>;
  }
}

interface PyodideInterface {
  loadPackage: (names: string | string[]) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: { get: (name: string) => unknown; set: (name: string, value: unknown) => void };
  FS: {
    writeFile: (path: string, data: string | Uint8Array) => void;
  };
}

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise: Promise<PyodideInterface> | null = null;
let modulesLoaded = false;

function loadPyodideScript(): Promise<void> {
  if (window.loadPyodide) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-pyodide="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Pyodide script failed")));
      if (window.loadPyodide) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.async = true;
    script.dataset.pyodide = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide from CDN"));
    document.head.appendChild(script);
  });
}

async function fetchPyModule(relativePath: string): Promise<string> {
  const base = import.meta.env.BASE_URL;
  const url = `${base}${relativePath}`.replace(/\/+/g, "/");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function installPythonModules(pyodide: PyodideInterface): Promise<void> {
  if (modulesLoaded) return;
  const files = [
    "lst_baseflow_adapter.py",
    "spatial_lst_core.py",
    "lst_point_runner.py",
  ] as const;
  for (const name of files) {
    const src = await fetchPyModule(`py/${name}`);
    pyodide.FS.writeFile(name, src);
  }
  await pyodide.runPythonAsync(`
import importlib.util
import sys
for _name in ("lst_baseflow_adapter", "spatial_lst_core", "lst_point_runner"):
    spec = importlib.util.spec_from_file_location(_name, _name)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[_name] = mod
    spec.loader.exec_module(mod)
`);
  modulesLoaded = true;
}

/** Lazy-load Pyodide (CDN). Not loaded on initial app entry. */
export async function loadLstEngine(onStatus?: (msg: string) => void): Promise<PyodideInterface> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    onStatus?.("Loading Pyodide runtime…");
    await loadPyodideScript();
    if (!window.loadPyodide) throw new Error("loadPyodide not available");
    const pyodide = await window.loadPyodide({ indexURL: PYODIDE_CDN });
    onStatus?.("Installing NumPy / SciPy…");
    await pyodide.loadPackage(["numpy", "scipy"]);
    onStatus?.("Loading LST modules…");
    await installPythonModules(pyodide);
    onStatus?.("LST engine ready");
    return pyodide;
  })();
  return pyodidePromise;
}

export function resetLstEngine(): void {
  pyodidePromise = null;
  modulesLoaded = false;
}

export async function runLstPointsPyodide(
  baseflowPoints: LstBaseflowPayload[],
  frequenciesKhz: number[],
  options: LstSolverOptions,
  onStatus?: (msg: string) => void
): Promise<LstPointResult[]> {
  const pyodide = await loadLstEngine(onStatus);
  pyodide.globals.set("_lst_baseflows", baseflowPoints);
  pyodide.globals.set("_lst_freqs", frequenciesKhz);
  pyodide.globals.set("_lst_options", options);

  const raw = await pyodide.runPythonAsync(`
import json
from lst_point_runner import run_lst_points
out = run_lst_points(_lst_baseflows, _lst_freqs, _lst_options)
json.dumps(out)
`);
  const parsed = JSON.parse(String(raw)) as Array<{
    x: number;
    f_khz: number;
    alpha_r: number | null;
    alpha_i: number | null;
    growth_rate: number | null;
    phase_speed: number | null;
    status: string;
    message: string;
  }>;

  return parsed.map((r) => ({
    x_mm: r.x * 1e3,
    f_khz: r.f_khz,
    alpha_r: r.alpha_r,
    alpha_i: r.alpha_i,
    growth_rate: r.growth_rate,
    phase_speed: r.phase_speed,
    status: r.status,
    message: r.message,
  }));
}
