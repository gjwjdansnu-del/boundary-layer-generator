"""
Spatial LST core — structure mirrors blasius_Z_first_success / LinStab2D:

  (Lc + omega * Lw) q' = alpha * R q'
  omega = 2*pi*f / U_e  (fixed)
  alpha = eigenvalue (complex)
  growth_rate = -imag(alpha)
  phase_speed = omega / real(alpha)

Full MATLAB operator assembly (GetLinProblem / GetSpatialLinProblem) is not
ported yet. Until connected, returns status='placeholder'.
"""
from __future__ import annotations

# Selection filters (lst_sparse_run.m)
C_PH_MIN = 0.80
C_PH_MAX = 0.97


def solve_spatial_lst_point(
    baseflow: dict,
    f_hz: float,
    *,
    sigma_init: float | None = None,
) -> dict:
    """
    Solve spatial LST at one (x, f) using the successful MATLAB algorithm structure.

    Returns dict with alpha_r, alpha_i, growth_rate, phase_speed, status, message.
    """
    U_e = baseflow["U_e"]
    omega = 2.0 * 3.141592653589793 * f_hz / U_e

    if f_hz <= 0:
        return _make_result(
            baseflow["x"],
            f_hz / 1e3,
            None,
            None,
            None,
            "error",
            "Frequency must be positive for spatial LST.",
        )

    # --- Real GEVP port slot ---
    # MATLAB lst_sparse_run.m:
    #   [Lc, Lw, R, idx] = GetSpatialLinProblem(mesh, sbf, '2D', 0)
    #   BC on Lc, R; A = Lc + omega*Lw
    #   lam = eigs(A, R, 10, sigma, ...)
    #   filter: ar>0, C_PH_MIN < omega/ar < C_PH_MAX, ai<0, |ai|<ar
    #   pick min(ai) among candidates
    _ = (omega, sigma_init, C_PH_MIN, C_PH_MAX)

    return _make_result(
        baseflow["x"],
        f_hz / 1e3,
        None,
        None,
        None,
        "placeholder",
        (
            "Real spatial GEVP solver not connected yet. "
            "Operator assembly (GetSpatialLinProblem) must be ported from MATLAB."
        ),
    )


def _make_result(x, f_khz, alpha_r, alpha_i, phase_speed, status, message):
    growth = (-float(alpha_i) if alpha_i is not None else None)
    return {
        "x": float(x),
        "f_khz": float(f_khz),
        "alpha_r": alpha_r,
        "alpha_i": alpha_i,
        "growth_rate": growth,
        "phase_speed": phase_speed,
        "status": status,
        "message": message,
    }
