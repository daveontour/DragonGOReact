import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampCellPixelSize,
  clampSpeed,
  countLiveCells,
  createEmptyGrid,
  createRandomGrid,
  DEFAULT_CELL_PX,
  DEFAULT_DENSITY,
  DEFAULT_SPEED,
  LifeGrid,
  LifePatternId,
  LIFE_PATTERNS,
  MAX_CELL_PX,
  MAX_SPEED,
  measureGridDimensions,
  MIN_CELL_PX,
  MIN_SPEED,
  resizeGrid,
  stampPattern,
  stepGameOfLife,
  toggleCell,
} from "./gameOfLife";

type DrawTool = "toggle" | LifePatternId;

function getGridLayout(
  displayWidth: number,
  displayHeight: number,
  cols: number,
  rows: number
) {
  const cellSize = Math.max(
    1,
    Math.min(displayWidth / cols, displayHeight / rows)
  );
  return {
    cellSize,
    offsetX: (displayWidth - cellSize * cols) / 2,
    offsetY: (displayHeight - cellSize * rows) / 2,
  };
}

export default function GameOfLifeApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const colsRef = useRef(1);
  const rowsRef = useRef(1);
  const gridRef = useRef<LifeGrid>(new Uint8Array(0));
  const gridInitializedRef = useRef(false);
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
  const [liveCount, setLiveCount] = useState(0);
  const [gridSize, setGridSize] = useState({ cols: 0, rows: 0 });
  const [cellPixelSize, setCellPixelSize] = useState(DEFAULT_CELL_PX);

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

  const syncGridDimensions = useCallback(
    (displayWidth: number, displayHeight: number, minCellPx: number) => {
      const next = measureGridDimensions(displayWidth, displayHeight, minCellPx);
      if (next.cols === colsRef.current && next.rows === rowsRef.current) {
        return;
      }

      if (!gridInitializedRef.current) {
        gridRef.current = createRandomGrid(next.cols, next.rows, DEFAULT_DENSITY);
        gridInitializedRef.current = true;
        setLiveCount(countLiveCells(gridRef.current));
      } else {
        gridRef.current = resizeGrid(
          gridRef.current,
          colsRef.current,
          rowsRef.current,
          next.cols,
          next.rows
        );
        setLiveCount(countLiveCells(gridRef.current));
      }

      colsRef.current = next.cols;
      rowsRef.current = next.rows;
      setGridSize(next);
    },
    []
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }
    const displayWidth = Math.max(1, Math.floor(wrap.clientWidth));
    const displayHeight = Math.max(1, Math.floor(wrap.clientHeight));
    syncGridDimensions(displayWidth, displayHeight, cellPixelSize);

    const cols = colsRef.current;
    const rows = rowsRef.current;
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.floor(displayWidth * dpr);
    const pixelHeight = Math.floor(displayHeight * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { cellSize, offsetX, offsetY } = getGridLayout(
      displayWidth,
      displayHeight,
      cols,
      rows
    );

    ctx.fillStyle = "#0a0d18";
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    const grid = gridRef.current;
    ctx.fillStyle = "#7fe0a8";
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y * cols + x]) {
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
      cellSize * cols,
      cellSize * rows
    );
  }, [cellPixelSize, syncGridDimensions]);

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

      if (runningRef.current && gridInitializedRef.current) {
        accumulatorRef.current += dt;
        const stepInterval = 1 / speedRef.current;
        let stepped = false;
        while (accumulatorRef.current >= stepInterval) {
          gridRef.current = stepGameOfLife(
            gridRef.current,
            colsRef.current,
            rowsRef.current,
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
    if (!canvas || !gridInitializedRef.current) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const cols = colsRef.current;
    const rows = rowsRef.current;
    const { cellSize, offsetX, offsetY } = getGridLayout(
      displayWidth,
      displayHeight,
      cols,
      rows
    );
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const gx = Math.floor((px - offsetX) / cellSize);
    const gy = Math.floor((py - offsetY) / cellSize);
    if (gx < 0 || gx >= cols || gy < 0 || gy >= rows) {
      return;
    }

    const currentTool = toolRef.current;
    if (currentTool === "toggle") {
      gridRef.current = toggleCell(gridRef.current, cols, gx, gy);
    } else {
      const pattern = LIFE_PATTERNS[currentTool];
      gridRef.current = stampPattern(
        gridRef.current,
        cols,
        rows,
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
    if (!gridInitializedRef.current) {
      return;
    }
    gridRef.current = createRandomGrid(
      colsRef.current,
      rowsRef.current,
      DEFAULT_DENSITY
    );
    setGeneration(0);
    setLiveCount(countLiveCells(gridRef.current));
    draw();
  };

  const clear = () => {
    if (!gridInitializedRef.current) {
      return;
    }
    gridRef.current = createEmptyGrid(colsRef.current, rowsRef.current);
    setRunning(false);
    setGeneration(0);
    setLiveCount(0);
    draw();
  };

  const step = () => {
    if (!gridInitializedRef.current) {
      return;
    }
    gridRef.current = stepGameOfLife(
      gridRef.current,
      colsRef.current,
      rowsRef.current,
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
                  <FormLabel className="section-label-muted" htmlFor="life-cell-size">
                    Cell size
                  </FormLabel>
                  <FormControl
                    id="life-cell-size"
                    type="range"
                    min={MIN_CELL_PX}
                    max={MAX_CELL_PX}
                    step={1}
                    value={cellPixelSize}
                    onChange={(e) =>
                      setCellPixelSize(clampCellPixelSize(Number(e.target.value)))
                    }
                  />
                  <div className="life-value-readout">{cellPixelSize}px</div>
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
                    <span className="life-result-label">Grid</span>
                    <span className="life-result-value">
                      {gridSize.cols > 0
                        ? `${gridSize.cols.toLocaleString("en-US")} × ${gridSize.rows.toLocaleString("en-US")}`
                        : "—"}
                    </span>
                  </div>
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
