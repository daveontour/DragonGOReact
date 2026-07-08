import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampMandelbrotIterations,
  complexFromPixel,
  DEFAULT_MANDELBROT_ITERATIONS,
  DEFAULT_MANDELBROT_VIEW,
  MandelbrotView,
  MAX_MANDELBROT_ITERATIONS,
  MIN_MANDELBROT_ITERATIONS,
  renderMandelbrot,
  ZOOM_IN_FACTOR,
  ZOOM_OUT_FACTOR,
  zoomViewAt,
  zoomViewCentered,
  zoomViewKeepingPoint,
} from "./mandelbrot";

const MAX_RENDER_WIDTH = 720;
const MAX_RENDER_HEIGHT = 720;

export default function MandelbrotApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MandelbrotView>(DEFAULT_MANDELBROT_VIEW);
  const [maxIterations, setMaxIterations] = useState(
    DEFAULT_MANDELBROT_ITERATIONS
  );
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
    renderMandelbrot(imageData, view, maxIterations);
    ctx.putImageData(imageData, 0, 0);
    setRendering(false);
  }, [maxIterations, view]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }

    const observer = new ResizeObserver(() => {
      draw();
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [draw]);

  const complexAtEvent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * canvas.width;
    const py = ((clientY - rect.top) / rect.height) * canvas.height;
    return complexFromPixel(px, py, canvas.width, canvas.height, view);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const point = complexAtEvent(event.clientX, event.clientY);
    if (!point) {
      return;
    }
    setView((current) => zoomViewAt(current, point.re, point.im, ZOOM_IN_FACTOR));
  };

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const py = ((event.clientY - rect.top) / rect.height) * canvas.height;
      setView((current) => {
        const { re, im } = complexFromPixel(
          px,
          py,
          canvas.width,
          canvas.height,
          current
        );
        const factor = event.deltaY < 0 ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR;
        return zoomViewKeepingPoint(current, re, im, factor);
      });
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const zoomIn = () => {
    setView((current) => zoomViewCentered(current, ZOOM_IN_FACTOR));
  };

  const zoomOut = () => {
    setView((current) => zoomViewCentered(current, ZOOM_OUT_FACTOR));
  };

  const resetView = () => {
    setView(DEFAULT_MANDELBROT_VIEW);
    setMaxIterations(DEFAULT_MANDELBROT_ITERATIONS);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar mandelbrot-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Mandelbrot Set</h2>
            </div>
            <div className="dragon-sidebar-panel mandelbrot-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel
                    className="section-label-muted"
                    htmlFor="mandelbrot-iterations"
                  >
                    Max iterations
                  </FormLabel>
                  <FormControl
                    id="mandelbrot-iterations"
                    type="number"
                    min={MIN_MANDELBROT_ITERATIONS}
                    max={MAX_MANDELBROT_ITERATIONS}
                    step={1}
                    value={maxIterations}
                    onChange={(e) =>
                      setMaxIterations(
                        clampMandelbrotIterations(Number(e.target.value))
                      )
                    }
                  />
                  <FormControl
                    className="mt-2"
                    type="range"
                    min={MIN_MANDELBROT_ITERATIONS}
                    max={MAX_MANDELBROT_ITERATIONS}
                    step={1}
                    value={maxIterations}
                    onChange={(e) =>
                      setMaxIterations(
                        clampMandelbrotIterations(Number(e.target.value))
                      )
                    }
                  />
                </div>

                <div>
                  <FormLabel
                    className="section-label-muted"
                    htmlFor="mandelbrot-center-re"
                  >
                    Centre (real)
                  </FormLabel>
                  <FormControl
                    id="mandelbrot-center-re"
                    type="number"
                    step="0.0001"
                    value={view.centerRe}
                    onChange={(e) =>
                      setView((current) => ({
                        ...current,
                        centerRe: Number(e.target.value),
                      }))
                    }
                  />
                  <FormLabel
                    className="section-label-muted mt-2"
                    htmlFor="mandelbrot-center-im"
                  >
                    Centre (imaginary)
                  </FormLabel>
                  <FormControl
                    id="mandelbrot-center-im"
                    type="number"
                    step="0.0001"
                    value={view.centerIm}
                    onChange={(e) =>
                      setView((current) => ({
                        ...current,
                        centerIm: Number(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="mandelbrot-results">
                  <div className="mandelbrot-result-row">
                    <span className="mandelbrot-result-label">Zoom scale</span>
                    <span className="mandelbrot-result-value">
                      {view.scale.toExponential(4)}
                    </span>
                  </div>
                  <div className="mandelbrot-result-row">
                    <span className="mandelbrot-result-label">View centre</span>
                    <span className="mandelbrot-result-value">
                      {view.centerRe.toFixed(6)} + {view.centerIm.toFixed(6)}i
                    </span>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="outline-light" onClick={zoomOut}>
                    Zoom out
                  </Button>
                  <Button variant="outline-light" onClick={zoomIn}>
                    Zoom in
                  </Button>
                </Stack>

                <Button variant="secondary" onClick={resetView}>
                  Reset view
                </Button>

                <p className="mandelbrot-hint">
                  Click the fractal to zoom in on a point, or scroll to zoom in
                  and out under the cursor. Each point c is tested by iterating
                  z → z² + c from z = 0.
                </p>
                {rendering ? (
                  <p className="mandelbrot-hint">Rendering…</p>
                ) : null}
              </Stack>
            </div>
          </div>
        </div>

        <div className="mandelbrot-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="mandelbrot-canvas"
            onClick={handleCanvasClick}
            role="img"
            aria-label="Mandelbrot set fractal"
          />
        </div>
      </div>
    </>
  );
}
