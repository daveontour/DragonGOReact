import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampPenroseDivisions,
  DEFAULT_PENROSE_DIVISIONS,
  fitTrianglesToViewport,
  generatePenroseTriangles,
  MAX_PENROSE_DIVISIONS,
  MIN_PENROSE_DIVISIONS,
} from "./penrose";

const THIN_COLOR = "#f6a86a";
const THICK_COLOR = "#5aa0ff";

export default function PenroseApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [divisions, setDivisions] = useState(DEFAULT_PENROSE_DIVISIONS);

  const triangles = useMemo(
    () => generatePenroseTriangles(divisions),
    [divisions]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }
    const width = Math.max(1, Math.floor(wrap.clientWidth));
    const height = Math.max(1, Math.floor(wrap.clientHeight));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0a0d18";
    ctx.fillRect(0, 0, width, height);

    const fitted = fitTrianglesToViewport(triangles, width, height, 12);
    for (const t of fitted) {
      const color = t.color === 0 ? THIN_COLOR : THICK_COLOR;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(t.a.x, t.a.y);
      ctx.lineTo(t.b.x, t.b.y);
      ctx.lineTo(t.c.x, t.c.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(10, 13, 24, 0.9)";
    ctx.lineWidth = 1.25;
    for (const t of fitted) {
      ctx.beginPath();
      ctx.moveTo(t.b.x, t.b.y);
      ctx.lineTo(t.c.x, t.c.y);
      ctx.stroke();
    }
  }, [triangles]);

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

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar penrose-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Penrose Tiling</h2>
            </div>
            <div className="dragon-sidebar-panel penrose-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted" htmlFor="penrose-divisions">
                    Subdivisions
                  </FormLabel>
                  <FormControl
                    id="penrose-divisions"
                    type="range"
                    min={MIN_PENROSE_DIVISIONS}
                    max={MAX_PENROSE_DIVISIONS}
                    step={1}
                    value={divisions}
                    onChange={(e) =>
                      setDivisions(clampPenroseDivisions(Number(e.target.value)))
                    }
                  />
                  <div className="penrose-value-readout">
                    {divisions} / {MAX_PENROSE_DIVISIONS}
                  </div>
                </div>

                <div className="penrose-results">
                  <div className="penrose-result-row">
                    <span className="penrose-result-label">Triangles</span>
                    <span className="penrose-result-value">
                      {triangles.length.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="penrose-result-row">
                    <span className="penrose-result-label">Rhombi (approx.)</span>
                    <span className="penrose-result-value">
                      {Math.round(triangles.length / 2).toLocaleString("en-US")}
                    </span>
                  </div>
                </div>

                <p className="penrose-hint">
                  Ten golden triangles are arranged in a &quot;sun&quot; around
                  the center, then repeatedly split using the golden ratio:
                  each thin (orange) triangle becomes one thin and one thick
                  child, each thick (blue) triangle becomes two thick and one
                  thin child. Matching pairs form the classic Penrose rhombi —
                  a pattern that tiles the plane but never repeats.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="penrose-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="penrose-canvas"
            role="img"
            aria-label="Penrose rhombus tiling"
          />
        </div>
      </div>
    </>
  );
}
