export type GeometryKind = "flat_plate" | "wedge" | "cone";

export interface GeometryConfig {
  kind: GeometryKind;
  coneHalfAngleDeg: number;
}

export const MANGLER_NOTE =
  "Cone (1st order): x_eff = x / 3 (Mangler-type). Not full axisymmetric similarity.";

export function geometryLabel(g: GeometryConfig): string {
  switch (g.kind) {
    case "flat_plate":
      return "2D flat plate";
    case "wedge":
      return "2D wedge (local flat-plate)";
    case "cone":
      return `Axisymmetric cone (${g.coneHalfAngleDeg}° half-angle)`;
  }
}

export function effectiveStreamwiseDistance(x: number, g: GeometryConfig): number {
  return g.kind === "cone" ? x / 3 : x;
}

export function effectiveStreamwiseArray(xs: number[], g: GeometryConfig): number[] {
  return xs.map((x) => effectiveStreamwiseDistance(x, g));
}
