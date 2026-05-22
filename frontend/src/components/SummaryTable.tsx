import type { EdgeConditions, ResolvedFreestream } from "../physics/edgeConditions";
import {
  edgeToRows,
  freestreamDirectToRows,
  freestreamShockToRows,
  taylorMaccollToRows,
} from "../physics/edgeConditions";
import type { PostShockState } from "../physics/shockRelations";
import type { TaylorMaccollResult } from "../physics/taylorMaccoll";

interface Props {
  edge: EdgeConditions;
  resolved?: ResolvedFreestream;
  shock?: PostShockState;
  taylorMaccoll?: TaylorMaccollResult;
  freestreamIsEdge?: boolean;
  shockNote?: string;
  tmNote?: string;
}

function Table({ title, rows }: { title: string; rows: { quantity: string; value: string }[] }) {
  return (
    <>
      <h3 className="table-subtitle">{title}</h3>
      <table className="summary">
        <tbody>
          {rows.map((r) => (
            <tr key={r.quantity}>
              <th>{r.quantity}</th>
              <td>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default function SummaryTable({
  edge,
  resolved,
  shock,
  taylorMaccoll,
  freestreamIsEdge,
  shockNote,
  tmNote,
}: Props) {
  return (
    <div className="summary-wrap">
      {resolved && freestreamIsEdge && (
        <Table title="Flat plate: freestream = edge" rows={freestreamDirectToRows(resolved)} />
      )}
      {resolved && taylorMaccoll && (
        <>
          <Table
            title="Freestream → Taylor–Maccoll cone edge"
            rows={taylorMaccollToRows(resolved, taylorMaccoll)}
          />
          {tmNote && <p className="shock-note">{tmNote}</p>}
        </>
      )}
      {resolved && shock && !taylorMaccoll && (
        <>
          <Table
            title="Freestream & shock → edge"
            rows={freestreamShockToRows(resolved, shock)}
          />
          {shockNote && <p className="shock-note">{shockNote}</p>}
        </>
      )}
      <Table
        title={resolved ? "Boundary-layer edge (post-shock)" : "Edge conditions"}
        rows={edgeToRows(edge)}
      />
    </div>
  );
}
