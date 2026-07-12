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
  | "curve-stitching"
  | "langtons-ant"
  | "chaos-game"
  | "diffusion-limited-aggregation"
  | "abelian-sandpile"
  | "gravitational-assist"
  | "truchet-tiles"
  | "julia-set"
  | "wireworld"
  | "maze-generator"
  | "pythagoras-tree"
  | "apollonian-gasket"
  | "double-pendulum"
  | "magnetic-pendulum"
  | "triple-pendulum"
  | "bezier-curves"
  | "percolation"
  | "poisson-disk"
  | "kaleidoscope"
  | "boids"
  | "astar-pathfinding"
  | "wave-function-collapse"
  | "fractal-terrain"
  | "monte-carlo-pi"
  | "elastic-collisions";

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
  {
    id: "langtons-ant",
    title: "Langton's Ant",
    description:
      "Watch a single ant turn left or right based on the color beneath it, its chaotic scribbling eventually resolving into an endlessly repeating diagonal highway.",
  },
  {
    id: "chaos-game",
    title: "Chaos Game",
    description:
      "Jump repeatedly toward random polygon vertices — or Barnsley's four weighted transforms — to watch a Sierpinski triangle, restricted-polygon lattice, or lifelike fern frond emerge from pure randomness.",
  },
  {
    id: "diffusion-limited-aggregation",
    title: "Diffusion-Limited Aggregation",
    description:
      "Release random-walking particles that stick the moment they touch the growing structure, building the same branching dendrites seen in frost, minerals, and lightning.",
  },
  {
    id: "abelian-sandpile",
    title: "Abelian Sandpile",
    description:
      "Drop a huge pile of grains on a single cell and let cascading four-grain topples relax it into an intricate, self-similar fractal — a textbook case of self-organized criticality.",
  },
  {
    id: "gravitational-assist",
    title: "Gravitational Assist",
    description:
      "Fly a spacecraft past a moving planet on a hyperbolic arc — adjust the encounter angle to see how a slingshot steals or donates momentum and changes the craft's speed.",
  },
  {
    id: "truchet-tiles",
    title: "Truchet Tiles",
    description:
      "Rotate a single simple square tile at random across a grid and watch purely local randomness weave sweeping loops, faux mazes, and moiré texture with no coordination between neighbors.",
  },
  {
    id: "julia-set",
    title: "Julia Sets",
    description:
      "Fix a complex constant c and test every point of the plane as its own starting value under z→z²+c, revealing the self-contained fractal companion to the Mandelbrot set.",
  },
  {
    id: "wireworld",
    title: "Wireworld / Brian's Brain",
    description:
      "Simulate digital logic gates from four humble cell states, or switch to Brian's Brain's unstable three-state rule that perpetually spawns gliders and sparks.",
  },
  {
    id: "maze-generator",
    title: "Maze Generation & Solving",
    description:
      "Carve a perfect maze with a randomized depth-first search, then watch breadth-first search's expanding frontier find the guaranteed-shortest path through it.",
  },
  {
    id: "pythagoras-tree",
    title: "Pythagoras Tree",
    description:
      "Erect a right triangle on a square's edge and two smaller squares on its other sides, then recurse — a visual proof of the Pythagorean theorem repeated at every scale.",
  },
  {
    id: "apollonian-gasket",
    title: "Apollonian Gasket",
    description:
      "Apply Descartes' Circle Theorem recursively, inscribing a tangent circle in every gap left behind, to pack infinitely many shrinking circles with zero space between them.",
  },
  {
    id: "double-pendulum",
    title: "Double Pendulum",
    description:
      "Couple two rigid rods under gravity and watch a textbook-simple system turn fully chaotic, with two near-identical starts visibly diverging within seconds.",
  },
  {
    id: "magnetic-pendulum",
    title: "Magnetic Pendulum",
    description:
      "Swing a damped pendulum over three fixed magnets and color every possible starting point by which magnet it eventually settles near, revealing fractal basins of attraction.",
  },
  {
    id: "triple-pendulum",
    title: "Triple Pendulum",
    description:
      "Add a third rigid rod to the double pendulum, trading its tidy closed-form equations for a 3×3 mass-matrix solve at every instant and even faster-blooming chaos.",
  },
  {
    id: "bezier-curves",
    title: "Bézier Curves",
    description:
      "Drag control points and watch De Casteljau's recursive lerp construction sweep out the curve, one converging level of scaffolding at a time.",
  },
  {
    id: "percolation",
    title: "Percolation Theory",
    description:
      "Open each cell independently at probability p and watch a spanning cluster suddenly appear as p crosses the critical threshold — a textbook phase transition.",
  },
  {
    id: "poisson-disk",
    title: "Poisson Disk Sampling",
    description:
      "Scatter points with Bridson's algorithm so no two ever land closer than a minimum distance, producing natural-looking 'blue noise' instead of clumpy randomness.",
  },
  {
    id: "kaleidoscope",
    title: "Kaleidoscope",
    description:
      "Draw with the mouse and watch every stroke reflect through N-fold rotational and mirror symmetry live, building a kaleidoscope pattern as you go.",
  },
  {
    id: "boids",
    title: "Boids (Flocking)",
    description:
      "Watch convincing flocking emerge from three purely local rules — separation, alignment, cohesion — with no boid aware of the flock as a whole.",
  },
  {
    id: "astar-pathfinding",
    title: "A* Pathfinding",
    description:
      "Paint walls and difficult terrain, then watch A* expand the lowest-cost frontier outward to find and highlight the guaranteed-optimal path.",
  },
  {
    id: "wave-function-collapse",
    title: "Wave Function Collapse",
    description:
      "Collapse a grid of superposed pipe-tile possibilities one cell at a time, propagating socket constraints outward until a coherent tiling emerges.",
  },
  {
    id: "fractal-terrain",
    title: "Fractal Terrain",
    description:
      "Grow a mountain range from four random corners with the diamond-square midpoint-displacement algorithm, tuning roughness to go from jagged peaks to rolling hills.",
  },
  {
    id: "monte-carlo-pi",
    title: "Monte Carlo π",
    description:
      "Drop random dots into a square containing an inscribed circle and estimate π from four times the fraction that land inside.",
  },
  {
    id: "elastic-collisions",
    title: "Elastic Collisions",
    description:
      "Send two configurable masses sliding across a frictionless surface, conserving energy as they collide with each other and a fixed wall.",
  },
];
