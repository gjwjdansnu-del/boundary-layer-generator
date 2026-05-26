type Props = {
  onRunLst: () => void;
  disabled?: boolean;
};

export default function LinearStabilitySection({ onRunLst, disabled }: Props) {
  return (
    <section className="lst-entry-section">
      <h2>Linear Stability Analysis</h2>
      <p className="section-hint">
        Select points in an x–frequency plane and compute local spatial LST growth rates.
      </p>
      <button type="button" className="btn btn-primary" onClick={onRunLst} disabled={disabled}>
        Run LST analysis
      </button>
    </section>
  );
}
