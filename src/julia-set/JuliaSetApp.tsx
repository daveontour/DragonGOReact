import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampJuliaIterations,
  complexFromPixel,
  DEFAULT_JULIA_C,
  DEFAULT_JULIA_ITERATIONS,
  DEFAULT_JULIA_VIEW,
  JuliaView,
  JULIA_PRESETS,
  MAX_JULIA_ITERATIONS,
  MIN_JULIA_ITERATIONS,
  renderJulia,
  ZOOM_IN_FACTOR,
  ZOOM_OUT_FACTOR,
  zoomViewAt,
  zoomViewCentered,
  zoomViewKeepingPoint,
} from "./juliaset";

const MAX_RENDER_WIDTH = 720;
const MAX_RENDER_HEIGHT = 720;

export default function JuliaSetApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<JuliaView>(DEFAULT_JULIA_VIEW);
  const [cRe, setCRe] = useState(DEFAULT_JULIA_C.cRe);
  const [cIm, setCIm] = useState(DEFAULT_JULIA_C.cIm);
  const [presetId, setPresetId] = useState(DEFAULT_JULIA_C.id);
  const [maxIterations, setMaxIterations] = useState(DEFAULT_JULIA_ITERATIONS);
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
    renderJulia(imageData, view, cRe, cIm, maxIterations);
    ctx.putImageData(imageData, 0, 0);
    setRendering(false);
  }, [view, cRe, cIm, maxIterations]);

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

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((event.clientY - rect.top) / rect.height) * canvas.height;
    setView((current) => {
      const { re, im } = complexFromPixel(px, py, canvas.width, canvas.height, current);
      const factor = event.deltaY < 0 ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR;
      return zoomViewKeepingPoint(current, re, im, factor);
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const zoomIn = () => setView((current) => zoomViewCentered(current, ZOOM_IN_FACTOR));
  const zoomOut = () => setView((current) => zoomViewCentered(current, ZOOM_OUT_FACTOR));

  const applyPreset = (id: string) => {
    const preset = JULIA_PRESETS.find((p) => p.id === id);
    if (preset) {
      setPresetId(preset.id);
      setCRe(preset.cRe);
      setCIm(preset.cIm);
      setView(DEFAULT_JULIA_VIEW);
    }
  };

  const resetView = () => {
    setView(DEFAULT_JULIA_VIEW);
    setMaxIterations(DEFAULT_JULIA_ITERATIONS);
    applyPreset(DEFAULT_JULIA_C.id);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `julia-set.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar julia-set-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Julia Sets</h2>
            </div>
            <div className="dragon-sidebar-panel julia-set-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="julia-preset">
                    Preset
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="julia-preset"
                      as="select"
                      value={presetId}
                      onChange={(e) => applyPreset(e.target.value)}
                    >
                      {JULIA_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="julia-c-re">
                    c (real)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="julia-c-re"
                      type="range"
                      min={-2}
                      max={2}
                      step={0.0001}
                      value={cRe}
                      onChange={(e) => {
                        setCRe(Number(e.target.value));
                        setPresetId("");
                      }}
                    />
                    <div className="julia-set-value-readout">{cRe.toFixed(4)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="julia-c-im">
                    c (imaginary)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="julia-c-im"
                      type="range"
                      min={-2}
                      max={2}
                      step={0.0001}
                      value={cIm}
                      onChange={(e) => {
                        setCIm(Number(e.target.value));
                        setPresetId("");
                      }}
                    />
                    <div className="julia-set-value-readout">{cIm.toFixed(4)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="julia-iterations">
                    Max iterations
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="julia-iterations"
                      type="range"
                      min={MIN_JULIA_ITERATIONS}
                      max={MAX_JULIA_ITERATIONS}
                      step={1}
                      value={maxIterations}
                      onChange={(e) =>
                        setMaxIterations(clampJuliaIterations(Number(e.target.value)))
                      }
                    />
                    <div className="julia-set-value-readout">{maxIterations}</div>
                  </div>
                </div>

                <div className="julia-set-results">
                  <div className="julia-set-result-row">
                    <span className="julia-set-result-label">c</span>
                    <span className="julia-set-result-value">
                      {cRe.toFixed(5)} + {cIm.toFixed(5)}i
                    </span>
                  </div>
                  <div className="julia-set-result-row">
                    <span className="julia-set-result-label">Zoom scale</span>
                    <span className="julia-set-result-value">
                      {view.scale.toExponential(4)}
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
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                <p className="julia-set-hint">
                  Gaston Julia and Pierre Fatou studied these sets
                  independently around 1918, decades before computers could
                  draw them. Where the Mandelbrot set colors each point c by
                  whether iterating z→z²+c from z=0 escapes, a Julia set
                  fixes c and instead tests every point of the plane as its
                  own starting z₀ — so each choice of c produces one
                  complete, self-contained fractal. The Mandelbrot set is in
                  fact a map of every possible Julia set: zooming into a
                  point c on the Mandelbrot boundary and switching to that
                  Julia set reveals filigree that echoes the local
                  Mandelbrot structure, a connection Julia and Fatou could
                  only reason about, never see.
                </p>
                {rendering ? <p className="julia-set-hint">Rendering…</p> : null}
              </Stack>
            </div>
          </div>
        </div>

        <div className="julia-set-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="julia-set-canvas"
            onClick={handleCanvasClick}
            role="img"
            aria-label="Julia set fractal"
          />
        </div>
      </div>
    </>
  );
}
