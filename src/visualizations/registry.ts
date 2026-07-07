export type VisualizationId =
  | "dragon-curves"
  | "knights-tour"
  | "pi-n-gon"
  | "collatz";

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
  {
    id: "pi-n-gon",
    title: "Pi by n-gon",
    description:
      "Bracket π with inscribed and circumscribed regular n-gons on a unit circle.",
  },
  {
    id: "collatz",
    title: "Collatz Conjecture",
    description:
      "Map the 3n + 1 sequence from any starting value and chart its path to 1.",
  },
];
