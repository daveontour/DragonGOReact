import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  AStarGrid,
  AStarState,
  clampGridSize,
  clampObstacleDensity,
  clampStepsPerFrame,
  createGrid,
  DEFAULT_GRID_SIZE,
  DEFAULT_OBSTACLE_DENSITY,
  DEFAULT_STEPS_PER_FRAME,
  drawAStarGrid,
  generateRandomObstacles,
  initAStar,
  MAX_GRID_SIZE,
  MAX_OBSTACLE_DENSITY,
  MAX_STEPS_PER_FRAME,
  MIN_GRID_SIZE,
  MIN_OBSTACLE_DENSITY,
  MIN_STEPS_PER_FRAME,
  MUD_COST,
  NORMAL_COST,
  pathCost,
  reconstructPath,
  runAStarSteps,
  WALL_COST,
} from "./astar";

type BrushMode = "wall" | "mud" | "clear" | "start" | "goal";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function AStarApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [obstacleDensity, setObstacleDensity] = useState(DEFAULT_OBSTACLE_DENSITY);
  const [seed, setSeed] = useState(1);
  const [stepsPerFrame, setStepsPerFrame] = useState(DEFAULT_STEPS_PER_FRAME);
  const [brush, setBrush] = useState<BrushMode>("wall");
  const [solving, setSolving] = useState(false);
  const [solved, setSolved] = useState(false);
  const [pathLength, setPathLength] = useState<number | null>(null);

  const gridRef = useRef<AStarGrid>(createGrid(DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE));
  const startRef = useRef(0);
  const goalRef = useRef(DEFAULT_GRID_SIZE * DEFAULT_GRID_SIZE - 1);
  const astarStateRef = useRef<AStarState | null>(null);
  const pathRef = useRef<number[]>([]);
  const solvingRef = useRef(false);
  const stepsPerFrameRef = useRef(DEFAULT_STEPS_PER_FRAME);
  const isPaintingRef = useRef(false);

  useEffect(() => {
    solvingRef.current = solving;
  }, [solving]);
  useEffect(() => {
    stepsPerFrameRef.current = stepsPerFrame;
  }, [stepsPerFrame]);

  const regenerate = useCallback((size: number, density: number, nextSeed: number) => {
    const grid = createGrid(size, size);
    const startIdx = 0;
    const goalIdx = size * size - 1;
    generateRandomObstacles(grid, density, nextSeed, startIdx, goalIdx);
    gridRef.current = grid;
    startRef.current = startIdx;
    goalRef.current = goalIdx;
    astarStateRef.current = null;
    pathRef.current = [];
    setSolving(false);
    setSolved(false);
    setPathLength(null);
  }, []);

  useEffect(() => {
    regenerate(gridSize, obstacleDensity, seed);
  }, [gridSize, obstacleDensity, seed, regenerate]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }
    const displaySize = Math.max(1, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)));
    canvas.width = displaySize;
    canvas.height = displaySize;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    drawAStarGrid(
      ctx,
      displaySize,
      gridRef.current,
      astarStateRef.current,
      startRef.current,
      goalRef.current,
      pathRef.current
    );
  }, []);

  useEffect(() => {
    draw();
  }, [draw, gridSize, obstacleDensity, seed]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }
    const observer = new ResizeObserver(() => draw());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    let frameId = 0;
    const loop = () => {
      if (solvingRef.current && astarStateRef.current && !astarStateRef.current.done) {
        runAStarSteps(gridRef.current, astarStateRef.current, goalRef.current, stepsPerFrameRef.current);
        if (astarStateRef.current.done) {
          if (astarStateRef.current.found) {
            pathRef.current = reconstructPath(astarStateRef.current, startRef.current, goalRef.current);
            setPathLength(pathCost(gridRef.current, pathRef.current));
          }
          solvingRef.current = false;
          setSolving(false);
          setSolved(true);
        }
        draw();
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [draw]);

  const handleSolve = () => {
    astarStateRef.current = initAStar(gridRef.current, startRef.current);
    pathRef.current = [];
    setSolved(false);
    setPathLength(null);
    setSolving(true);
  };

  const cellFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    const grid = gridRef.current;
    const gx = Math.floor(((event.clientX - rect.left) / rect.width) * grid.width);
    const gy = Math.floor(((event.clientY - rect.top) / rect.height) * grid.height);
    if (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height) {
      return null;
    }
    return gy * grid.width + gx;
  };

  const paintAt = (idx: number) => {
    const grid = gridRef.current;
    if (brush === "start") {
      startRef.current = idx;
      grid.cost[idx] = NORMAL_COST;
    } else if (brush === "goal") {
      goalRef.current = idx;
      grid.cost[idx] = NORMAL_COST;
    } else if (idx !== startRef.current && idx !== goalRef.current) {
      grid.cost[idx] = brush === "wall" ? WALL_COST : brush === "mud" ? MUD_COST : NORMAL_COST;
    }
    astarStateRef.current = null;
    pathRef.current = [];
    setSolved(false);
    draw();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const idx = cellFromEvent(event);
    if (idx === null) {
      return;
    }
    isPaintingRef.current = true;
    paintAt(idx);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current || brush === "start" || brush === "goal") {
      return;
    }
    const idx = cellFromEvent(event);
    if (idx !== null) {
      paintAt(idx);
    }
  };

  const endPaint = () => {
    isPaintingRef.current = false;
  };

  const resetView = () => {
    setGridSize(DEFAULT_GRID_SIZE);
    setObstacleDensity(DEFAULT_OBSTACLE_DENSITY);
    setSeed(1);
    setStepsPerFrame(DEFAULT_STEPS_PER_FRAME);
    setBrush("wall");
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `astar-pathfinding.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar astar-pathfinding-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">A* Pathfinding</h2>
            </div>
            <div className="dragon-sidebar-panel astar-pathfinding-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="astar-size">
                    Grid size
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="astar-size"
                      type="range"
                      min={MIN_GRID_SIZE}
                      max={MAX_GRID_SIZE}
                      step={1}
                      value={gridSize}
                      onChange={(e) => setGridSize(clampGridSize(Number(e.target.value)))}
                    />
                    <div className="astar-pathfinding-value-readout">
                      {gridSize}×{gridSize}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="astar-density">
                    Obstacle density
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="astar-density"
                      type="range"
                      min={MIN_OBSTACLE_DENSITY}
                      max={MAX_OBSTACLE_DENSITY}
                      step={0.01}
                      value={obstacleDensity}
                      onChange={(e) => setObstacleDensity(clampObstacleDensity(Number(e.target.value)))}
                    />
                    <div className="astar-pathfinding-value-readout">{obstacleDensity.toFixed(2)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="astar-brush">
                    Paint tool
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="astar-brush"
                      as="select"
                      value={brush}
                      onChange={(e) => setBrush(e.target.value as BrushMode)}
                    >
                      <option value="wall">Wall</option>
                      <option value="mud">Mud (slow)</option>
                      <option value="clear">Clear</option>
                      <option value="start">Move start</option>
                      <option value="goal">Move goal</option>
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="astar-speed">
                    Steps per frame
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="astar-speed"
                      type="range"
                      min={MIN_STEPS_PER_FRAME}
                      max={MAX_STEPS_PER_FRAME}
                      step={1}
                      value={stepsPerFrame}
                      onChange={(e) => setStepsPerFrame(clampStepsPerFrame(Number(e.target.value)))}
                    />
                    <div className="astar-pathfinding-value-readout">{stepsPerFrame}</div>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={() => setSeed(randomSeed())}>
                    Regenerate
                  </Button>
                  <Button variant="primary" onClick={handleSolve} disabled={solving}>
                    {solving ? "Solving…" : "Solve"}
                  </Button>
                </Stack>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                {solved ? (
                  <p className="astar-pathfinding-hint">
                    {pathLength !== null
                      ? `Solved — optimal path cost ${pathLength}.`
                      : "No path exists between start and goal."}
                  </p>
                ) : null}

                <p className="astar-pathfinding-hint">
                  A* (Hart, Nilsson &amp; Raphael, 1968) expands the grid
                  cell with lowest f = g + h — g being the exact cost so
                  far, h a heuristic estimate of the remaining cost. On
                  this uniform-floor-cost grid (every cell costs at least
                  1 to enter, difficult 'mud' terrain costs more), Manhattan
                  distance is an admissible and consistent heuristic: it
                  never overestimates the true remaining cost, which
                  guarantees A* finds the optimal path while expanding far
                  fewer nodes than Dijkstra's algorithm (equivalent to A*
                  with h=0) would need to.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="astar-pathfinding-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="astar-pathfinding-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPaint}
            onPointerLeave={endPaint}
            role="img"
            aria-label="A* pathfinding grid with animated frontier expansion"
          />
        </div>
      </div>
    </>
  );
}
