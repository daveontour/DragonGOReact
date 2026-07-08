import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampSpeed,
  countLiveCells,
  createEmptyGrid,
  createRandomGrid,
  DEFAULT_COLS,
  DEFAULT_DENSITY,
  DEFAULT_ROWS,
  DEFAULT_SPEED,
  LifeGrid,
  LifePatternId,
  LIFE_PATTERNS,
  MAX_SPEED,
  MIN_SPEED,
  stampPattern,
  stepGameOfLife,
  toggleCell,
} from "../automaton/gameOfLife";

type DrawTool = "toggle" | LifePatternId;

export default function GameOfLifeApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<LifeGrid>(createRandomGrid(DEFAULT_COLS, DEFAULT_ROWS, DEFAULT_DENSITY));
  const runningRef = useRef(false);
  const wrapAroundRef = useRef(true);
  const speedRef = useRef(DEFAULT_SPEED);
  const accumulatorRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const toolRef = useRef<DrawTool>("toggle");

  const [running, setRunning] = useState(false);
  const [wrapAround, setWrapAround] = useState(true);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [tool, setTool] = useState<DrawTool>("toggle");
  const [generation, setGeneration] = useState(0);
  const [liveCount, setLiveCount] = useState(countLiveCells(gridRef.current));

  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    wrapAroundRef.current = wrapAround;
  }, [wrapAround]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }
    const width = Math.max(1, wrap.clientWidth);
    const height = Math.max(1, wrap.clientHeight);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const cellSize = Math.max(
      2,
      Math.min(width / DEFAULT_COLS, height / DEFAULT_ROWS)
    );
    const offsetX = (width - cellSize * DEFAULT_COLS) / 2;
    const offsetY = (height - cellSize * DEFAULT_ROWS) / 2;

    ctx.fillStyle = "#0a0d18";
    ctx.fillRect(0, 0, width, height);

    const grid = gridRef.current;
    ctx.fillStyle = "#7fe0a8";
    for (let y = 0; y < DEFAULT_ROWS; y++) {
      for (let x = 0; x < DEFAULT_COLS; x++) {
        if (grid[y * DEFAULT_COLS + x]) {
          ctx.fillRect(
            offsetX + x * cellSize,
            offsetY + y * cellSize,
            Math.ceil(cellSize) - 0.5,
            Math.ceil(cellSize) - 0.5
          );
        }
      }
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      offsetX,
      offsetY,
      cellSize * DEFAULT_COLS,
      cellSize * DEFAULT_ROWS
    );
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

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

    const loop = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (runningRef.current) {
        accumulatorRef.current += dt;
        const stepInterval = 1 / speedRef.current;
        let stepped = false;
        while (accumulatorRef.current >= stepInterval) {
          gridRef.current = stepGameOfLife(
            gridRef.current,
            DEFAULT_COLS,
            DEFAULT_ROWS,
            wrapAroundRef.current
          );
          accumulatorRef.current -= stepInterval;
          stepped = true;
        }
        if (stepped) {
          setGeneration((g) => g + 1);
          setLiveCount(countLiveCells(gridRef.current));
          draw();
        }
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [draw]);

  const applyAtCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const width = canvas.width;
    const height = canvas.height;
    const cellSize = Math.max(
      2,
      Math.min(width / DEFAULT_COLS, height / DEFAULT_ROWS)
    );
    const offsetX = (width - cellSize * DEFAULT_COLS) / 2;
    const offsetY = (height - cellSize * DEFAULT_ROWS) / 2;
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const gx = Math.floor((px - offsetX) / cellSize);
    const gy = Math.floor((py - offsetY) / cellSize);
    if (gx < 0 || gx >= DEFAULT_COLS || gy < 0 || gy >= DEFAULT_ROWS) {
      return;
    }

    const currentTool = toolRef.current;
    if (currentTool === "toggle") {
      gridRef.current = toggleCell(gridRef.current, DEFAULT_COLS, gx, gy);
    } else {
      const pattern = LIFE_PATTERNS[currentTool];
      gridRef.current = stampPattern(
        gridRef.current,
        DEFAULT_COLS,
        DEFAULT_ROWS,
        pattern,
        gx - Math.floor(2),
        gy - Math.floor(2)
      );
    }
    setLiveCount(countLiveCells(gridRef.current));
    draw();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    applyAtCanvasPoint(event.clientX, event.clientY);
  };

  const randomize = () => {
    gridRef.current = createRandomGrid(DEFAULT_COLS, DEFAULT_ROWS, DEFAULT_DENSITY);
    setGeneration(0);
    setLiveCount(countLiveCells(gridRef.current));
    draw();
  };

  const clear = () => {
    gridRef.current = createEmptyGrid(DEFAULT_COLS, DEFAULT_ROWS);
    setRunning(false);
    setGeneration(0);
    setLiveCount(0);
    draw();
  };

  const step = () => {
    gridRef.current = stepGameOfLife(
      gridRef.current,
      DEFAULT_COLS,
      DEFAULT_ROWS,
      wrapAroundRef.current
    );
    setGeneration((g) => g + 1);
    setLiveCount(countLiveCells(gridRef.current));
    draw();
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar life-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Conway&apos;s Game of Life</h2>
            </div>
            <div className="dragon-sidebar-panel life-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <Stack direction="horizontal" gap={2}>
                  <Button
                    variant={running ? "secondary" : "primary"}
                    onClick={() => setRunning((r) => !r)}
                  >
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button variant="outline-light" onClick={step} disabled={running}>
                    Step
                  </Button>
                </Stack>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="life-speed">
                    Speed (generations/sec)
                  </FormLabel>
                  <FormControl
                    id="life-speed"
                    type="range"
                    min={MIN_SPEED}
                    max={MAX_SPEED}
                    step={1}
                    value={speed}
                    onChange={(e) => setSpeed(clampSpeed(Number(e.target.value)))}
                  />
                  <div className="life-value-readout">{speed}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="life-tool">
                    Click tool
                  </FormLabel>
                  <FormControl
                    id="life-tool"
                    as="select"
                    value={tool}
                    onChange={(e) => setTool(e.target.value as DrawTool)}
                  >
                    <option value="toggle">Toggle single cell</option>
                    {Object.values(LIFE_PATTERNS).map((p) => (
                      <option key={p.id} value={p.id}>
                        Stamp: {p.name}
                      </option>
                    ))}
                  </FormControl>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="outline-light" onClick={randomize}>
                    Random soup
                  </Button>
                  <Button variant="outline-light" onClick={clear}>
                    Clear
                  </Button>
                </Stack>

                <FormCheck
                  id="life-wrap"
                  type="checkbox"
                  label="Wrap edges (toroidal grid)"
                  checked={wrapAround}
                  onChange={(e) => setWrapAround(e.target.checked)}
                />

                <div className="life-results">
                  <div className="life-result-row">
                    <span className="life-result-label">Generation</span>
                    <span className="life-result-value">
                      {generation.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="life-result-row">
                    <span className="life-result-label">Live cells</span>
                    <span className="life-result-value">
                      {liveCount.toLocaleString("en-US")}
                    </span>
                  </div>
                </div>

                <p className="life-hint">
                  Any live cell with 2 or 3 live neighbors survives; any dead
                  cell with exactly 3 live neighbors is born. Click the grid
                  to toggle a cell or stamp a chosen pattern.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="life-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="life-canvas"
            onClick={handleCanvasClick}
            role="img"
            aria-label="Conway's Game of Life grid"
          />
        </div>
      </div>
    </>
  );
}
