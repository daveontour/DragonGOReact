import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampControlPointCount,
  DEFAULT_CONTROL_POINTS,
  defaultControlPoints,
  drawBezierCurve,
  MAX_CONTROL_POINTS,
  MIN_CONTROL_POINTS,
  Point,
  POINT_HIT_RADIUS,
} from "./bezier";

const ANIMATE_DURATION_SECONDS = 3;

export default function BezierCurvesApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<Point[]>(defaultControlPoints(DEFAULT_CONTROL_POINTS));
  const draggingRef = useRef<number | null>(null);
  const animateTRef = useRef(0);

  const [pointCount, setPointCount] = useState(DEFAULT_CONTROL_POINTS);
  const [t, setT] = useState(0.5);
  const [lineWidth, setLineWidth] = useState(2.5);
  const [showScaffolding, setShowScaffolding] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displayWidth = Math.max(1, Math.floor(wrap.clientWidth));
    const displayHeight = Math.max(1, Math.floor(wrap.clientHeight));
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const activeT = animate ? animateTRef.current : t;
    drawBezierCurve(ctx, displayWidth, displayHeight, pointsRef.current, activeT, lineWidth, showScaffolding);
  }, [t, lineWidth, showScaffolding, animate]);

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
    if (!animate) {
      return;
    }
    let frameId = 0;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      animateTRef.current += dt / ANIMATE_DURATION_SECONDS;
      if (animateTRef.current > 1) {
        animateTRef.current -= 1;
      }
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [animate, draw]);

  const setPointCountAndReset = (value: number) => {
    const count = clampControlPointCount(value);
    setPointCount(count);
    pointsRef.current = defaultControlPoints(count);
    draw();
  };

  const pointerToNormalized = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const { x, y } = pointerToNormalized(event);
    const pxX = x * rect.width;
    const pxY = y * rect.height;

    let closest: number | null = null;
    let closestDist = Infinity;
    pointsRef.current.forEach((p, i) => {
      const dist = Math.hypot(p.x * rect.width - pxX, p.y * rect.height - pxY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });

    if (closest !== null && closestDist <= POINT_HIT_RADIUS) {
      draggingRef.current = closest;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingRef.current === null) {
      return;
    }
    const { x, y } = pointerToNormalized(event);
    pointsRef.current[draggingRef.current] = {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    };
    draw();
  };

  const endDrag = () => {
    if (draggingRef.current !== null) {
      draggingRef.current = null;
      setIsDragging(false);
      draw();
    }
  };

  const resetView = () => {
    pointsRef.current = defaultControlPoints(pointCount);
    setT(0.5);
    setLineWidth(2.5);
    setShowScaffolding(true);
    setAnimate(false);
    draw();
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `bezier-curve.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar bezier-curves-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Bézier Curves</h2>
            </div>
            <div className="dragon-sidebar-panel bezier-curves-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="bezier-count">
                    Control points
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="bezier-count"
                      type="range"
                      min={MIN_CONTROL_POINTS}
                      max={MAX_CONTROL_POINTS}
                      step={1}
                      value={pointCount}
                      onChange={(e) => setPointCountAndReset(Number(e.target.value))}
                    />
                    <div className="bezier-curves-value-readout">{pointCount}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="bezier-t">
                    t
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="bezier-t"
                      type="range"
                      min={0}
                      max={1}
                      step={0.001}
                      value={t}
                      disabled={animate}
                      onChange={(e) => setT(Number(e.target.value))}
                    />
                    <div className="bezier-curves-value-readout">{t.toFixed(3)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="bezier-width">
                    Line thickness
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="bezier-width"
                      type="range"
                      min={1}
                      max={6}
                      step={0.5}
                      value={lineWidth}
                      onChange={(e) => setLineWidth(Number(e.target.value))}
                    />
                    <div className="bezier-curves-value-readout">{lineWidth}px</div>
                  </div>
                </div>

                <FormCheck
                  id="bezier-scaffolding"
                  type="checkbox"
                  label="Show construction scaffolding"
                  checked={showScaffolding}
                  onChange={(e) => setShowScaffolding(e.target.checked)}
                />
                <FormCheck
                  id="bezier-animate"
                  type="checkbox"
                  label="Animate construction"
                  checked={animate}
                  onChange={(e) => {
                    setAnimate(e.target.checked);
                    animateTRef.current = 0;
                  }}
                />

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <p className="bezier-curves-hint">
                  Paul de Casteljau at Citroën (1959) and Pierre Bézier at
                  Renault independently discovered this construction: to
                  find the point on the curve at parameter t, repeatedly
                  lerp between every consecutive pair of points, producing
                  one fewer point each round, until a single point
                  remains. Sweep t from 0 to 1 and that point traces the
                  Bézier curve — the exact same curve as the Bernstein
                  polynomial formula, just built geometrically instead of
                  algebraically. The technique underlies vector fonts,
                  animation easing curves, and CAD surface modeling.
                </p>
                <p className="bezier-curves-hint">Drag the white control points to reshape the curve.</p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="bezier-curves-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className={`bezier-curves-canvas${isDragging ? " bezier-curves-canvas--dragging" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            role="img"
            aria-label="Draggable Bézier curve with De Casteljau construction"
          />
        </div>
      </div>
    </>
  );
}
