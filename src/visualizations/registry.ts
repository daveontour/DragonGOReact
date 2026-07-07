export type VisualizationId = "dragon-curves" | "knights-tour";

export interface VisualizationMeta {
  id: VisualizationId;
  title: string;
  description: string;
}

export const VISUALIZATIONS: VisualizationMeta[] = [
  {
    id: "dragon-curves",
    title: "Dragon Curves",
    description:
      "Generate variations of Heighway–Harter dragon curves with configurable tiles, paths, and colours.",
  },
  {
    id: "knights-tour",
    title: "Knight's Tour",
    description:
      "Find and animate knight's tours on a chessboard using Warnsdorff's rule with open or closed paths.",
  },
];
