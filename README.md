# Boundary Layer Generator

Fast **similarity-profile** boundary-layer baseflow generator for 2D flat plates, wedges, and axisymmetric cones. Produces approximate compressible profiles from edge conditions in seconds—intended as **Step 1** toward LST workflows, without CFD or machine learning.

![Velocity profile](outputs/example_cone/velocity_profile.png)

## Features

- **Edge inputs:** Mode A (\(M_e\), \(T_0\), \(\mathrm{Re}_\mathrm{unit}\), \(T_w\)) or Mode B (\(U_e\), \(p_e\), \(T_e\), \(T_w\))
- **Geometries:** flat plate, wedge (local flat-plate patch), cone (Mangler \(x_\mathrm{eff}=x/3\))
- **Physics (approximate):** Blasius shooting solver + compressible Blasius-like temperature coupling
- **Outputs:** \(u\), \(T\), \(\rho\), \(\mu\), Mach profiles; \(\delta_{99}\), \(\delta^*\), \(\theta\), \(C_f\) vs \(x\)
- **UI:** Streamlit app with profile plots, x-sweep plots, geometry envelope, optional x–y contours, CSV export

## Example plots

| Profile | Streamwise | Geometry |
|---------|------------|----------|
| ![T/Te](outputs/example_cone/temperature_profile.png) | ![delta99](outputs/example_cone/delta_99_vs_x.png) | ![envelope](outputs/example_cone/geometry_envelope.png) |

Additional outputs in [`outputs/example_cone/`](outputs/example_cone/): density, Mach, \(\delta^*\), \(\theta\), \(C_f\), CSV files.

## Installation

```bash
git clone https://github.com/podobooks-ganghwa/boundary-layer-generator.git
cd boundary-layer-generator
python3 -m pip install -r requirements.txt
```

**Requirements:** Python 3.9+, `numpy`, `scipy`, `matplotlib`, `streamlit`, `pandas` (see `requirements.txt`).

## Run examples

```bash
python3 src/run_examples.py
```

Writes plots and CSVs to `outputs/example_cone/`.

## Run Streamlit UI (local)

```bash
python3 -m pip install -r requirements.txt
python3 -m streamlit run src/app.py
```

## Deploy as a Streamlit app

Host the interactive UI on [Streamlit Community Cloud](https://streamlit.io/cloud) (free tier).

1. Go to [https://streamlit.io/cloud](https://streamlit.io/cloud) and sign in with GitHub.
2. Click **Create app** → **Yup, I have an app**.
3. Select repository: **`podobooks-ganghwa/boundary-layer-generator`**
4. Branch: **`main`**
5. Main file path: **`src/app.py`**
6. (Optional) App URL slug: e.g. `boundary-layer-generator`
7. Click **Deploy**

Streamlit Cloud reads **`requirements.txt`** at the repository root and installs dependencies automatically. No extra backend or build step is required.

| Setting | Value |
|---------|--------|
| Repository | `podobooks-ganghwa/boundary-layer-generator` |
| Branch | `main` |
| Main file path | `src/app.py` |
| Python dependencies | `requirements.txt` (root) |

After deploy, share the app URL (e.g. `https://boundary-layer-generator.streamlit.app`).

## Example condition (hypersonic cone)

| Parameter | Value |
|-----------|-------|
| \(M_e\) | 5.9 |
| \(T_e\) | 206 K |
| \(U_e\) | 1698 m/s |
| \(p_e\) | 4670 Pa |
| \(T_w\) | 300 K |
| \(\mathrm{Re}_\mathrm{unit}\) | \(\approx 9.9\times 10^6\ \mathrm{m}^{-1}\) |
| Geometry | Cone (7° half-angle, Mangler scaling) |
| \(x\) | 0.3 m |

At \(x=0.3\ \mathrm{m}\): \(x_\mathrm{eff}=0.1\ \mathrm{m}\), \(\delta_{99}\approx 0.5\ \mathrm{mm}\).

## Model equations

### Incompressible Blasius

\[
f''' + \tfrac{1}{2} f f'' = 0,\quad f(0)=0,\; f'(0)=0,\; f'(\eta_\mathrm{max})=1
\]

Solved by **shooting** (`scipy.integrate.solve_ivp` + `brentq`), cached. \(u/U_e = f'(\eta)\).

### Compressible approximation

Recovery \(r=\sqrt{\mathrm{Pr}}\). Adiabatic wall temperature:

\[
T_{aw} = T_e\left[1 + r\frac{\gamma-1}{2}M_e^2\right]
\]

\[
T = T_w + (T_{aw}-T_w)\frac{u}{U_e} + (T_e-T_{aw})\left(\frac{u}{U_e}\right)^2
\]

Then \(\rho = p_e/(RT)\), Sutherland \(\mu(T)\), \(M = u/\sqrt{\gamma R T}\).

### Streamwise scaling

\[
\mathrm{Re}_x = \mathrm{Re}_\mathrm{unit}\, x_\mathrm{eff},\qquad
\delta_\mathrm{scale} = \sqrt{\frac{\mu_e x_\mathrm{eff}}{\rho_e U_e}},\qquad
y = \eta\,\delta_\mathrm{scale}
\]

| Geometry | \(x_\mathrm{eff}\) |
|----------|-------------------|
| Flat plate, wedge | \(x\) |
| Cone (1st-order Mangler) | \(x/3\) |

\[
C_f \approx \frac{2 f''(0)}{\sqrt{\mathrm{Re}_x}}
\]

## Assumptions and limitations

- **Approximate** compressible Blasius-like model—not a full coupled compressible similarity solution.
- Constant edge conditions along \(x\) (wedge: local flat-plate approximation).
- Cone: Mangler \(x_\mathrm{eff}=x/3\) only; not full axisymmetric similarity.
- **No LST**, **no CFD**, **no AI/ML** in this repository.

## Planned extensions

- Full coupled compressible Blasius / reference-enthalpy formulations
- Improved axisymmetric cone similarity (beyond Mangler \(x/3\))
- Export formats for LST solvers (baseflow grids, normalization)
- Variable edge conditions \(u_e(x)\), \(T_e(x)\) along body

## Project layout

```
boundary_layer_generator/
├── LICENSE
├── README.md
├── requirements.txt         # Streamlit Cloud dependencies
├── .streamlit/
│   └── config.toml          # theme / headless defaults
├── outputs/example_cone/    # committed example artifacts
└── src/
    ├── app.py               # Streamlit entry point
    ├── app.py
    ├── run_examples.py
    └── boundary_layer/
```

## License

MIT License — see [LICENSE](LICENSE).
