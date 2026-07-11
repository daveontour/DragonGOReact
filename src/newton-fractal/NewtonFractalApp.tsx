import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampNewtonDegree,
  clampNewtonIterations,
  complexFromPixel,
  DEFAULT_NEWTON_DEGREE,
  DEFAULT_NEWTON_ITERATIONS,
  DEFAULT_NEWTON_VIEW,
  MAX_NEWTON_DEGREE,
  MAX_NEWTON_ITERATIONS,
  MIN_NEWTON_DEGREE,
  MIN_NEWTON_ITERATIONS,
  NewtonView,
  renderNewtonFractal,
  zoomNewtonViewAt,
} from "./newtonFractal";

const MAX_RENDER_WIDTH = 720;
const MAX_RENDER_HEIGHT = 720;

export default function NewtonFractalApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<NewtonView>(DEFAULT_NEWTON_VIEW);
  const [degree, setDegree] = useState(DEFAULT_NEWTON_DEGREE);
  const [maxIterations, setMaxIterations] = useState(DEFAULT_NEWTON_ITERATIONS);
  const [rendering, setRendering] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displayWidth = Math.max(1, Math.floor(wrap.clientWidth));
    const displayHeight = Math.max(1, Math.floor(wrap.clientHeight));
    const scale = Math.min(
      1,
      MAX_RENDER_WIDTH / displayWidth,
      MAX_RENDER_HEIGHT / displayHeight
    );
    const width = Math.max(1, Math.floor(displayWidth * scale));
    const height = Math.max(1, Math.floor(displayHeight * scale));

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    setRendering(true);
    const imageData = ctx.createImageData(width, height);
    renderNewtonFractal(imageData, view, degree, maxIterations);
    ctx.putImageData(imageData, 0, 0);
    setRendering(false);
  }, [view, degree, maxIterations]);

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

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const { re, im } = complexFromPixel(px, py, canvas.width, canvas.height, view);
    setView((current) => zoomNewtonViewAt(current, re, im, 0.5));
  };

  const resetView = () => {
    setView(DEFAULT_NEWTON_VIEW);
    setMaxIterations(DEFAULT_NEWTON_ITERATIONS);
  };


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `newton-fractal.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar newton-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Newton&apos;s Fractal</h2>
            </div>
            <div className="dragon-sidebar-panel newton-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="newton-degree">
                    Polynomial degree (z^n - 1)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="newton-degree"
                      type="range"
                      min={MIN_NEWTON_DEGREE}
                      max={MAX_NEWTON_DEGREE}
                      step={1}
                      value={degree}
                      onChange={(e) =>
                        setDegree(clampNewtonDegree(Number(e.target.value)))
                      }
                    />
                    <div className="newton-value-readout">n = {degree}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="newton-iterations">
                    Max iterations
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="newton-iterations"
                      type="range"
                      min={MIN_NEWTON_ITERATIONS}
                      max={MAX_NEWTON_ITERATIONS}
                      step={1}
                      value={maxIterations}
                      onChange={(e) =>
                        setMaxIterations(
                          clampNewtonIterations(Number(e.target.value))
                        )
                      }
                    />
                    <div className="newton-value-readout">{maxIterations}</div>
                  </div>
                </div>

                <div className="newton-results">
                  <div className="newton-result-row">
                    <span className="newton-result-label">Zoom scale</span>
                    <span className="newton-result-value">
                      {view.scale.toExponential(4)}
                    </span>
                  </div>
                  <div className="newton-result-row">
                    <span className="newton-result-label">View centre</span>
                    <span className="newton-result-value">
                      {view.centerRe.toFixed(6)} + {view.centerIm.toFixed(6)}i
                    </span>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={resetView}>
                  Reset view
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                  Download PNG
                  </Button>
                </Stack>


                <p className="newton-hint">
                  Each pixel is a starting guess for Newton&apos;s method
                  solving z<sup>n</sup> = 1. Color shows which root it
                  converges to; brightness shows how fast. Click to zoom.
                </p>
                {rendering ? <p className="newton-hint">Rendering…</p> : null}
              </Stack>
            </div>
          </div>
        </div>

        <div className="newton-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="newton-canvas"
            onClick={handleCanvasClick}
            role="img"
            aria-label="Newton's method fractal"
          />
        </div>
      </div>
    </>
  );
}
