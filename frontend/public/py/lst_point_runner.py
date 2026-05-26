"""
Entry point for browser Pyodide: run spatial LST at selected x–f points.
"""
from __future__ import annotations

import numpy as np

from lst_baseflow_adapter import prepare_baseflow
from spatial_lst_core import solve_spatial_lst_point


def run_lst_points(baseflow_points, frequencies_khz, options):
    """
    Run local spatial LST for selected x-frequency points.

    Parameters
    ----------
    baseflow_points : list of dict
        Each dict: x, y, U, V, T, rho, p, mu (physical SI, from TS generator)
    frequencies_khz : list of float
        Frequency [kHz] per point
    options : dict
        Ma_e, U_e, T_e, rho_e, mu_e, Re_unit, Pr, gamma, geometry_kind

    Returns
    -------
    list of dict
        x, f_khz, alpha_r, alpha_i, growth_rate, phase_speed, status, message
    """
    if len(baseflow_points) != len(frequencies_khz):
        raise ValueError("baseflow_points and frequencies_khz must have the same length")

    results = []
    sigma_carry = None

    for pt, f_khz in zip(baseflow_points, frequencies_khz):
        try:
            bf = prepare_baseflow(pt, options)
            f_hz = float(f_khz) * 1e3
            out = solve_spatial_lst_point(bf, f_hz, sigma_init=sigma_carry)
            omega = 2.0 * np.pi * f_hz / bf["U_e"]
            ar = out.get("alpha_r")
            ai = out.get("alpha_i")
            if ar is not None and ar != 0:
                out["phase_speed"] = float(omega / ar)
            if ai is not None:
                out["growth_rate"] = -float(ai)
            if ar is not None:
                sigma_carry = float(ar)
            out["x"] = float(pt.get("x", bf.get("x", 0.0)))
            out["f_khz"] = float(f_khz)
            results.append(out)
        except Exception as exc:
            results.append(
                {
                    "x": float(pt.get("x", 0.0)),
                    "f_khz": float(f_khz),
                    "alpha_r": None,
                    "alpha_i": None,
                    "growth_rate": None,
                    "phase_speed": None,
                    "status": "error",
                    "message": str(exc),
                }
            )

    return results
