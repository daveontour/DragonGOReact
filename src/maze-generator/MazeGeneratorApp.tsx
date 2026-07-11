import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  BFSIterState,
  carveMazeDFS,
  clampMazeSize,
  clampSolveStepsPerFrame,
  createBFSIterState,
  createMaze,
  DEFAULT_MAZE_SIZE,
  DEFAULT_SOLVE_STEPS_PER_FRAME,
  drawMaze,
  MAX_MAZE_SIZE,
  MAX_SOLVE_STEPS_PER_FRAME,
  MazeState,
  MIN_MAZE_SIZE,
  MIN_SOLVE_STEPS_PER_FRAME,
  pathFromBFSIterState,
  runBFSFrontierSteps,
} from "./maze";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function MazeGeneratorApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [mazeSize, setMazeSize] = useState(DEFAULT_MAZE_SIZE);
  const [seed, setSeed] = useState(1);
  const [solveSpeed, setSolveSpeed] = useState(DEFAULT_SOLVE_STEPS_PER_FRAME);
  const [solving, setSolving] = useState(false);
  const [solved, setSolved] = useState(false);

  const mazeRef = useRef<MazeState>(createMaze(DEFAULT_MAZE_SIZE, DEFAULT_MAZE_SIZE));
  const bfsRef = useRef<BFSIterState | null>(null);
  const solvingRef = useRef(false);
  const solveSpeedRef = useRef(DEFAULT_SOLVE_STEPS_PER_FRAME);

  useEffect(() => {
    solvingRef.current = solving;
  }, [solving]);
  useEffect(() => {
    solveSpeedRef.current = solveSpeed;
  }, [solveSpeed]);

  const regenerate = useCallback((nextSeed: number, size: number) => {
    const maze = createMaze(size, size);
    carveMazeDFS(maze, nextSeed);
    mazeRef.current = maze;
    bfsRef.current = null;
    setSolving(false);
    setSolved(false);
  }, []);

  useEffect(() => {
    regenerate(seed, mazeSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mazeSize]);

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

    const bfs = bfsRef.current;
    const frontier = bfs ? bfs.visited : null;
    const path = bfs ? pathFromBFSIterState(bfs) : [];
    drawMaze(ctx, displaySize, mazeRef.current, 2, frontier, path);
  }, []);

  useEffect(() => {
    draw();
  }, [draw, seed, mazeSize]);

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
      if (solvingRef.current && bfsRef.current && !bfsRef.current.done) {
        const done = runBFSFrontierSteps(bfsRef.current, solveSpeedRef.current);
        draw();
        if (done) {
          solvingRef.current = false;
          setSolving(false);
          setSolved(true);
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [draw]);

  const handleGenerate = () => {
    const nextSeed = randomSeed();
    setSeed(nextSeed);
    regenerate(nextSeed, mazeSize);
    draw();
  };

  const handleSolve = () => {
    const total = mazeRef.current.width * mazeRef.current.height;
    bfsRef.current = createBFSIterState(mazeRef.current, 0, total - 1);
    setSolved(false);
    setSolving(true);
  };

  const resetView = () => {
    setMazeSize(DEFAULT_MAZE_SIZE);
    setSolveSpeed(DEFAULT_SOLVE_STEPS_PER_FRAME);
    setSeed(1);
    regenerate(1, DEFAULT_MAZE_SIZE);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `maze.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar maze-generator-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Maze Generation &amp; Solving</h2>
            </div>
            <div className="dragon-sidebar-panel maze-generator-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="maze-size">
                    Maze size
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="maze-size"
                      type="range"
                      min={MIN_MAZE_SIZE}
                      max={MAX_MAZE_SIZE}
                      step={1}
                      value={mazeSize}
                      onChange={(e) => setMazeSize(clampMazeSize(Number(e.target.value)))}
                    />
                    <div className="maze-generator-value-readout">
                      {mazeSize}×{mazeSize}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="maze-solve-speed">
                    Solve speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="maze-solve-speed"
                      type="range"
                      min={MIN_SOLVE_STEPS_PER_FRAME}
                      max={MAX_SOLVE_STEPS_PER_FRAME}
                      step={1}
                      value={solveSpeed}
                      onChange={(e) => setSolveSpeed(clampSolveStepsPerFrame(Number(e.target.value)))}
                    />
                    <div className="maze-generator-value-readout">{solveSpeed} cells/frame</div>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={handleGenerate}>
                    Generate new maze
                  </Button>
                </Stack>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="primary" onClick={handleSolve} disabled={solving}>
                    {solving ? "Solving…" : "Solve"}
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                {solved ? (
                  <p className="maze-generator-hint">
                    Solved — the highlighted trail is a guaranteed shortest
                    path from the top-left cell to the bottom-right cell.
                  </p>
                ) : null}

                <p className="maze-generator-hint">
                  This maze is carved by randomized depth-first search — the
                  'recursive backtracker' algorithm — which starts at one
                  cell, repeatedly steps to a random unvisited neighbor
                  while knocking down the wall behind it, and backtracks
                  whenever it paints itself into a corner, until every cell
                  has been visited exactly once. Because the carving path
                  never revisits a cell, the result is a 'perfect maze':
                  there is exactly one route between any two cells, with no
                  loops and no isolated pockets. Solving it here uses
                  breadth-first search, which explores outward from the
                  start one ring of distance at a time — visualized as an
                  expanding frontier — guaranteeing the very first path it
                  finds to the exit is one of shortest length, in contrast
                  to a depth-first solver which might stumble down every
                  dead end first.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="maze-generator-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="maze-generator-canvas"
            role="img"
            aria-label="Maze with an animated breadth-first search solve"
          />
        </div>
      </div>
    </>
  );
}
