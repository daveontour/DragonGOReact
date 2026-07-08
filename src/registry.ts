import mondrianPreview from "./assets/previews/mondrian-298998.png";
import dragonPreview from "./assets/previews/DragonCurve.svg";

export type VisualizationId =
  | "dragon-curves"
  | "knights-tour"
  | "pi-n-gon"
  | "collatz"
  | "mandelbrot"
  | "l-systems"
  | "game-of-life"
  | "voronoi"
  | "n-body"
  | "newton-fractal"
  | "mondrian"
  | "strange-attractors"
  | "fourier-epicycles"
  | "bifurcation"
  | "elementary-ca"
  | "prime-spirals"
  | "penrose-tiling";

export interface VisualizationMeta {
  id: VisualizationId;
  title: string;
  description: string;
  previewImage?: string;
}

export const VISUALIZATIONS: VisualizationMeta[] = [
  {
    id: "dragon-curves",
    title: "Dragon Curves",
    description:
      "Generate variations of Heighway–Harter dragon curves with configurable tiles, paths, and colours.",
    previewImage: dragonPreview,
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
  {
    id: "mandelbrot",
    title: "Mandelbrot Set",
    description:
      "Explore the famous fractal boundary by zooming and adjusting iteration depth.",
  },
  {
    id: "l-systems",
    title: "L-Systems",
    description:
      "Grow Koch, Sierpinski, dragon, plant, and Hilbert fractals from turtle-graphics rewrite rules.",
  },
  {
    id: "game-of-life",
    title: "Conway's Game of Life",
    description:
      "Run Conway's cellular automaton with presets like the glider and Gosper glider gun.",
  },
  {
    id: "voronoi",
    title: "Voronoi Diagram",
    description:
      "Drag seed points to reshape their cells, or relax the layout toward centroids.",
  },
  {
    id: "n-body",
    title: "N-Body Gravity",
    description:
      "Simulate several bodies pulling on each other under mutual Newtonian gravity.",
  },
  {
    id: "newton-fractal",
    title: "Newton's Fractal",
    description:
      "Color the complex plane by which root of zⁿ = 1 Newton's method converges to.",
  },
  {
    id: "mondrian",
    title: "Mondrian Generator",
    description:
      "Create De Stijl grid compositions with recursive splits, primary colours, and black lines.",
    previewImage: mondrianPreview,
  },
  {
    id: "strange-attractors",
    title: "Strange Attractors",
    description:
      "Watch Lorenz and Rössler flows spiral forever, or render Clifford and De Jong maps as density clouds.",
  },
  {
    id: "fourier-epicycles",
    title: "Fourier Epicycles",
    description:
      "Trace a star, heart, or square as the sum of rotating circles from a discrete Fourier series.",
  },
  {
    id: "bifurcation",
    title: "Bifurcation Diagram",
    description:
      "Chart the logistic map's route from stability to chaos as its growth rate increases.",
  },
  {
    id: "elementary-ca",
    title: "Elementary Cellular Automata",
    description:
      "Generate Wolfram's 1D automata from any of the 256 rules, stacked generation by generation.",
  },
  {
    id: "prime-spirals",
    title: "Prime Spirals",
    description:
      "Plot integers on Ulam's square spiral or the Sacks polar spiral to reveal prime patterns.",
  },
  {
    id: "penrose-tiling",
    title: "Penrose Tiling",
    description:
      "Deflate golden triangles from a radial sun into an aperiodic rhombus tiling.",
  },
];
