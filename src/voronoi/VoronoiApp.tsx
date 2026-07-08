import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampPointCount,
  DEFAULT_VORONOI_POINTS,
  generateRandomPoints,
  lloydRelax,
  MAX_VORONOI_POINTS,
  MIN_VORONOI_POINTS,
  renderVoronoi,
  VoronoiPoint,
} from "./voronoi";

const MAX_RENDER_SIZE = 640;
const DRAG_RENDER_SIZE = 220;
const POINT_HIT_RADIUS = 14;

export default function VoronoiApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<VoronoiPoint[]>([]);
  const draggingRef = useRef<number | null>(null);

  const [pointCount, setPointCount] = useState(DEFAULT_VORONOI_POINTS);
  const [showEdges, setShowEdges] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [relaxCount, setRelaxCount] = useState(0);
  const [renderSize, setRenderSize] = useState({ width: 1, height: 1 });

  const draw = useCallback((forceLowRes: boolean) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displayWidth = Math.max(1, Math.floor(wrap.clientWidth));
    const displayHeight = Math.max(1, Math.floor(wrap.clientHeight));
    const cap = forceLowRes ? DRAG_RENDER_SIZE : MAX_RENDER_SIZE;
    const scale = Math.min(1, cap / displayWidth, cap / displayHeight);
    const width = Math.max(1, Math.floor(displayWidth * scale));
    const height = Math.max(1, Math.floor(displayHeight * scale));

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    setRenderSize({ width, height });

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const scaledPoints = pointsRef.current.map((p) => ({
      x: (p.x / displayWidth) * width,
      y: (p.y / displayHeight) * height,
    }));

    const imageData = ctx.createImageData(width, height);
    renderVoronoi(imageData, scaledPoints, showEdges);
    ctx.putImageData(imageData, 0, 0);

    if (showPoints) {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
      ctx.lineWidth = 1;
      for (const p of scaledPoints) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }, [showEdges, showPoints]);

  const seedPoints = useCallback(() => {
    const wrap = wrapRef.current;
    const width = wrap ? Math.max(1, wrap.clientWidth) : 640;
    const height = wrap ? Math.max(1, wrap.clientHeight) : 480;
    pointsRef.current = generateRandomPoints(pointCount, width, height);
    setRelaxCount(0);
  }, [pointCount]);

  useEffect(() => {
    seedPoints();
  }, [seedPoints]);

  useEffect(() => {
    draw(false);
  }, [draw]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }
    const observer = new ResizeObserver(() => draw(false));
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [draw]);

  const pointerToDisplay = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pointerToDisplay(event.clientX, event.clientY);
    let closest: number | null = null;
    let closestDist = Infinity;
    pointsRef.current.forEach((p, i) => {
      const dist = Math.hypot(p.x - x, p.y - y);
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
    const { x, y } = pointerToDisplay(event.clientX, event.clientY);
    pointsRef.current[draggingRef.current] = { x, y };
    draw(true);
  };

  const endDrag = () => {
    if (draggingRef.current !== null) {
      draggingRef.current = null;
      setIsDragging(false);
      draw(false);
    }
  };

  const relax = () => {
    const wrap = wrapRef.current;
    const width = wrap ? Math.max(1, wrap.clientWidth) : 640;
    const height = wrap ? Math.max(1, wrap.clientHeight) : 480;
    pointsRef.current = lloydRelax(pointsRef.current, width, height, 4);
    setRelaxCount((c) => c + 1);
    draw(false);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar voronoi-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Voronoi Diagram</h2>
            </div>
            <div className="dragon-sidebar-panel voronoi-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted" htmlFor="voronoi-points">
                    Seed points
                  </FormLabel>
                  <FormControl
                    id="voronoi-points"
                    type="range"
                    min={MIN_VORONOI_POINTS}
                    max={MAX_VORONOI_POINTS}
                    step={1}
                    value={pointCount}
                    onChange={(e) =>
                      setPointCount(clampPointCount(Number(e.target.value)))
                    }
                  />
                  <div className="voronoi-value-readout">{pointCount}</div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="primary" onClick={seedPoints}>
                    New random points
                  </Button>
                </Stack>

                <Button variant="outline-light" onClick={relax}>
                  Lloyd relax step
                </Button>

                <FormCheck
                  id="voronoi-edges"
                  type="checkbox"
                  label="Show cell borders"
                  checked={showEdges}
                  onChange={(e) => setShowEdges(e.target.checked)}
                />
                <FormCheck
                  id="voronoi-points-toggle"
                  type="checkbox"
                  label="Show seed points"
                  checked={showPoints}
                  onChange={(e) => setShowPoints(e.target.checked)}
                />

                <div className="voronoi-results">
                  <div className="voronoi-result-row">
                    <span className="voronoi-result-label">Cells</span>
                    <span className="voronoi-result-value">{pointCount}</span>
                  </div>
                  <div className="voronoi-result-row">
                    <span className="voronoi-result-label">Relax steps</span>
                    <span className="voronoi-result-value">{relaxCount}</span>
                  </div>
                  <div className="voronoi-result-row">
                    <span className="voronoi-result-label">Render size</span>
                    <span className="voronoi-result-value">
                      {renderSize.width}×{renderSize.height}
                    </span>
                  </div>
                </div>

                <p className="voronoi-hint">
                  Every pixel is colored by its nearest seed point, dividing
                  the plane into cells. Drag a point to reshape its cell, or
                  relax the layout so each point moves to its cell&apos;s
                  centroid.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="voronoi-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className={`voronoi-canvas${isDragging ? " voronoi-canvas--dragging" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            role="img"
            aria-label="Voronoi diagram of draggable seed points"
          />
        </div>
      </div>
    </>
  );
}
