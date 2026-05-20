import type { EdgeConditions, ResolvedFreestream } from "../physics/edgeConditions";
import { edgeToRows, freestreamShockToRows } from "../physics/edgeConditions";
import type { PostShockState } from "../physics/shockRelations";

interface Props {
  edge: EdgeConditions;
  resolved?: ResolvedFreestream;
  shock?: PostShockState;
  shockNote?: string;
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

export default function SummaryTable({ edge, resolved, shock, shockNote }: Props) {
  return (
    <div className="summary-wrap">
      {resolved && shock && (
        <>
          <Table
            title="프리스트림 & 충격파 → 엣지 (자동 계산)"
            rows={freestreamShockToRows(resolved, shock)}
          />
          {shockNote && <p className="shock-note">{shockNote}</p>}
        </>
      )}
      <Table
        title={resolved ? "경계층 엣지 조건 (충격 후)" : "엣지 조건"}
        rows={edgeToRows(edge)}
      />
    </div>
  );
}
