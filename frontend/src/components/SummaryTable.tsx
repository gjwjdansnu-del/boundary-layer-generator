import type { EdgeConditions } from "../physics/edgeConditions";
import { edgeToRows } from "../physics/edgeConditions";

interface Props {
  edge: EdgeConditions;
}

export default function SummaryTable({ edge }: Props) {
  const rows = edgeToRows(edge);
  return (
    <table className="summary">
      <thead>
        <tr>
          <th>Quantity</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.quantity}>
            <td>{r.quantity}</td>
            <td>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
