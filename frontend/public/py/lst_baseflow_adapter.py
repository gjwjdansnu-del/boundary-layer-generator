"""
Adapt browser-generated baseflow profiles to the normalized format used by
the MATLAB read_openfoam_baseflow / LinStab2D spatial LST pipeline.
"""
from __future__ import annotations

import numpy as np

MU_REF = 1.716e-5
T_REF = 273.15
S_SUTH = 110.4


def sutherland_mu_physical(T: np.ndarray) -> np.ndarray:
    return MU_REF * (T / T_REF) ** 1.5 * (T_REF + S_SUTH) / (T + S_SUTH)


def prepare_baseflow(point: dict, options: dict) -> dict:
    """
    Physical profile columns (SI) -> normalized 1D baseflow for spatial_lst_core.

    point keys: x, y, U, V, T, rho, p, mu (lists)
    options: Ma_e, U_e, T_e, rho_e, mu_e, Re_unit, Pr, gamma
    """
    y = np.asarray(point["y"], dtype=float).ravel()
    U = np.asarray(point["U"], dtype=float).ravel()
    V = np.asarray(point.get("V") or np.zeros_like(y), dtype=float).ravel()
    T = np.asarray(point["T"], dtype=float).ravel()
    rho = np.asarray(point["rho"], dtype=float).ravel()
    p = np.asarray(point.get("p") or np.full_like(y, options["U_e"]), dtype=float).ravel()
    mu_in = np.asarray(point.get("mu") or sutherland_mu_physical(T), dtype=float).ravel()

    if y.size < 4:
        raise ValueError("Baseflow needs at least 4 wall-normal points")

    # Sort by y
    order = np.argsort(y)
    y, U, V, T, rho, p, mu_in = (a[order] for a in (y, U, V, T, rho, p, mu_in))

    U_max = np.max(U)
    idx_edge = np.where(U / max(U_max, 1e-30) >= 0.99)[0]
    idx_edge = int(idx_edge[0]) if idx_edge.size else len(U) - 1

    U_e = float(options.get("U_e", U[idx_edge]))
    T_e = float(options.get("T_e", T[idx_edge]))
    rho_e = float(options.get("rho_e", rho[idx_edge]))
    mu_e = float(options.get("mu_e", mu_in[idx_edge]))

    if y[0] > 1e-12:
        y = np.concatenate([[0.0], y])
        U = np.concatenate([[0.0], U])
        V = np.concatenate([[0.0], V])
        T = np.concatenate([[T[0]], T])
        rho = np.concatenate([[rho[0]], rho])
        p = np.concatenate([[p[0]], p])
        mu_in = np.concatenate([[mu_in[0]], mu_in])
    y[0] = 0.0
    U[0] = 0.0
    V[0] = 0.0

    U_nd = U / U_e
    T_nd = T / T_e
    rho_nd = rho / rho_e
    V_nd = V / U_e
    mu_nd = mu_in / mu_e

    dU = np.gradient(U_nd, y)
    dT = np.gradient(T_nd, y)
    dmu_dT = np.gradient(mu_nd, T_nd)
    dmu = dmu_dT * dT

    return {
        "x": float(point.get("x", 0.0)),
        "y": y,
        "U": U_nd,
        "V": V_nd,
        "T": T_nd,
        "rho": rho_nd,
        "p": p / (rho_e * T_e / (options.get("gamma", 1.4) * options.get("Ma_e", 1.0) ** 2 * T_e) + 1e-30),
        "mu": mu_nd,
        "dU": dU,
        "dT": dT,
        "dmu": dmu,
        "U_e": U_e,
        "T_e": T_e,
        "rho_e": rho_e,
        "mu_e": mu_e,
        "Ma_e": float(options.get("Ma_e", U_e / np.sqrt(options.get("gamma", 1.4) * 287.043 * T_e))),
        "Re_unit": float(options.get("Re_unit", rho_e * U_e / mu_e)),
        "Pr": float(options.get("Pr", 0.72)),
        "gamma": float(options.get("gamma", 1.4)),
    }
