import { useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  CENTER,
  clampGrainCount,
  clampTopplesPerFrame,
  createSandpileState,
  DEFAULT_GRAINS,
  DEFAULT_TOPPLES_PER_FRAME,
  dropGrains,
  GRID_SIZE,
  MAX_GRAINS,
  MAX_TOPPLES_PER_FRAME,
  MIN_GRAINS,
  MIN_TOPPLES_PER_FRAME,
  renderSandpile,
  runToppleBudget,
  SandpileState,
} from "./sandpile";

export default function SandpileApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Lazily created and dropped exactly once per component instance, right
  // here in the render body rather than in a mount effect: an effect with
  // no cleanup runs its body twice under StrictMode's dev-only
  // double-invoke check, which would silently drop the initial pile twice
  // (this "if not yet created" ref guard is React's documented pattern for
  // a StrictMode-safe one-time ref initialization).
  const initialRef = useRef<{ state: SandpileState; queue: number[] } | null>(null);
  if (initialRef.current === null) {
    const state = createSandpileState(GRID_SIZE);
    const queue: number[] = [];
    dropGrains(state, CENTER, CENTER, DEFAULT_GRAINS, queue);
    initialRef.current = { state, queue };
  }
  const stateRef = useRef<SandpileState>(initialRef.current.state);
  const queueRef = useRef<number[]>(initialRef.current.queue);
  const runningRef = useRef(true);
  const topplesPerFrameRef = useRef(DEFAULT_TOPPLES_PER_FRAME);
  const totalTopplesRef = useRef(0);

  const [grains, setGrains] = useState(DEFAULT_GRAINS);
  const [topplesPerFrame, setTopplesPerFrame] = useState(DEFAULT_TOPPLES_PER_FRAME);
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({ topples: 0, queued: 0 });

  useEffect(() => {
    topplesPerFrameRef.current = topplesPerFrame;
  }, [topplesPerFrame]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    let frameId = 0;

    const loop = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) {
        frameId = requestAnimationFrame(loop);
        return;
      }

      if (canvas.width !== GRID_SIZE || canvas.height !== GRID_SIZE) {
        canvas.width = GRID_SIZE;
        canvas.height = GRID_SIZE;
      }
      const displaySize = Math.max(
        1,
        Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight))
      );
      canvas.style.width = `${displaySize}px`;
      canvas.style.height = `${displaySize}px`;

      if (runningRef.current) {
        const done = runToppleBudget(
          stateRef.current,
          queueRef.current,
          topplesPerFrameRef.current
        );
        totalTopplesRef.current += done;
        setStats({ topples: totalTopplesRef.current, queued: queueRef.current.length });
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.createImageData(GRID_SIZE, GRID_SIZE);
        renderSandpile(imageData, stateRef.current);
        ctx.putImageData(imageData, 0, 0);
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const dropNewPile = () => {
    stateRef.current = createSandpileState(GRID_SIZE);
    queueRef.current = [];
    totalTopplesRef.current = 0;
    dropGrains(stateRef.current, CENTER, CENTER, grains, queueRef.current);
    setStats({ topples: 0, queued: queueRef.current.length });
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `abelian-sandpile.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar abelian-sandpile-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Abelian Sandpile</h2>
            </div>
            <div className="dragon-sidebar-panel abelian-sandpile-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="sandpile-grains"
                  >
                    Grain count
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="sandpile-grains"
                      type="range"
                      min={MIN_GRAINS}
                      max={MAX_GRAINS}
                      step={100}
                      value={grains}
                      onChange={(e) => setGrains(clampGrainCount(Number(e.target.value)))}
                    />
                    <div className="abelian-sandpile-value-readout">
                      {grains.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="sandpile-topples"
                  >
                    Relaxation speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="sandpile-topples"
                      type="range"
                      min={MIN_TOPPLES_PER_FRAME}
                      max={MAX_TOPPLES_PER_FRAME}
                      step={100}
                      value={topplesPerFrame}
                      onChange={(e) =>
                        setTopplesPerFrame(clampTopplesPerFrame(Number(e.target.value)))
                      }
                    />
                    <div className="abelian-sandpile-value-readout">
                      {topplesPerFrame.toLocaleString()} topples/frame
                    </div>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button
                    variant={running ? "secondary" : "primary"}
                    onClick={() => setRunning((r) => !r)}
                  >
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button variant="outline-light" onClick={dropNewPile}>
                    Drop new pile
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <div className="abelian-sandpile-results">
                  <div className="abelian-sandpile-result-row">
                    <span className="abelian-sandpile-result-label">Topples so far</span>
                    <span className="abelian-sandpile-result-value">
                      {stats.topples.toLocaleString()}
                    </span>
                  </div>
                  <div className="abelian-sandpile-result-row">
                    <span className="abelian-sandpile-result-label">Cells still unstable</span>
                    <span className="abelian-sandpile-result-value">
                      {stats.queued.toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="abelian-sandpile-hint">
                  Any cell holding four or more grains topples, giving one
                  grain to each of its four neighbors; a topple can push a
                  neighbor over the same threshold, cascading further
                  topples until every cell is stable again. Dropping a huge
                  pile of grains onto a single cell and letting it relax
                  under this purely arithmetic rule produces an intricate,
                  self-similar fractal pattern — a striking example of
                  "self-organized criticality," the same phenomenon behind
                  avalanches and earthquakes.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="abelian-sandpile-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="abelian-sandpile-canvas"
            role="img"
            aria-label="Abelian sandpile relaxation grid"
          />
        </div>
      </div>
    </>
  );
}
