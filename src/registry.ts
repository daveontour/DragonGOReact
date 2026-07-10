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
  | "penrose-tiling"
  | "morellet"
  | "morellet-tiles"
  | "op-art"
  | "chladni-patterns"
  | "flow-fields"
  | "phyllotaxis"
  | "reaction-diffusion"
  | "spirograph"
  | "lissajous"
  | "harmonograph"
  | "rose-curves"
  | "superformula"
  | "euler-spiral"
  | "curve-stitching";

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
    id: "morellet-tiles",
    title: "Morellet Color Grid",
    description:
      "Fill a fine square grid with randomly distributed red, green, blue, and orange tiles at adjustable weights.",
  },
  {
    id: "morellet",
    title: "Morellet Patterns",
    description:
      "Generate tiled line compositions in the spirit of François Morellet's grids, trames, and random distributions.",
  },
  {
    id: "penrose-tiling",
    title: "Penrose Tiling",
    description:
      "Deflate golden triangles from a radial sun into an aperiodic rhombus tiling.",
  },
  {
    id: "op-art",
    title: "Op Art / Moiré",
    description:
      "Overlay two fine geometric layers — line gratings, concentric rings, or radial rays — at slightly different spacing or angle to conjure Bridget Riley-style moiré interference.",
  },
  {
    id: "chladni-patterns",
    title: "Chladni Patterns",
    description:
      "Compute the nodal lines of a vibrating square plate for any pair of modes, and scatter sand-like particles along them the way Chladni's original experiment did.",
  },
  {
    id: "flow-fields",
    title: "Flow Fields",
    description:
      "Thousands of particles drift along a hand-rolled Perlin-noise vector field, laying down trails that slowly build into an organic, painterly composition.",
  },
  {
    id: "phyllotaxis",
    title: "Phyllotaxis Spirals",
    description:
      "Scatter seeds outward from the center at a fixed turning angle, the golden-ratio packing rule sunflowers and pinecones use to arrange their florets.",
  },
  {
    id: "reaction-diffusion",
    title: "Reaction-Diffusion",
    description:
      "Simulate two virtual chemicals reacting and diffusing across a grid via the Gray-Scott model, growing the spots, stripes, and coral-like textures behind Turing's patterns.",
  },
  {
    id: "spirograph",
    title: "Spirograph",
    description:
      "Trace hypotrochoid and epitrochoid curves as a pen-fitted wheel rolls inside or outside a fixed ring, exactly like the classic Spirograph toy.",
  },
  {
    id: "lissajous",
    title: "Lissajous Curves",
    description:
      "Trace the looping figures formed by feeding two independent sine waves into the x and y axes, the classic oscilloscope pattern.",
  },
  {
    id: "harmonograph",
    title: "Harmonograph",
    description:
      "Simulate the decaying, drifting trace two pairs of damped pendulums would ink onto a swinging drawing table.",
  },
  {
    id: "rose-curves",
    title: "Rose Curves",
    description:
      "Sweep the polar formula r = cos(k·θ) through a full turn to bloom looping petal patterns, with a petal count set by the rational value of k.",
  },
  {
    id: "superformula",
    title: "Superformula",
    description:
      "Morph circles, polygons, stars, and organic leaf and flower outlines from Johan Gielis's single generalized polar formula.",
  },
  {
    id: "euler-spiral",
    title: "Euler Spiral",
    description:
      "Numerically integrate the Fresnel integrals to trace a clothoid, the curve of linearly increasing curvature used in road and rollercoaster design.",
  },
  {
    id: "curve-stitching",
    title: "Curve Stitching",
    description:
      "Draw only straight lines between points on a circle or two rays and watch a parabola, cardioid, or nephroid emerge from their envelope.",
  },
];
