import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampSpiralN,
  DEFAULT_SPIRAL_N,
  fitPointsToViewport,
  generateSpiralPoints,
  MAX_SPIRAL_N,
  MIN_SPIRAL_N,
  SpiralType,
} from "./primespiral";

export default function PrimeSpiralApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [spiralType, setSpiralType] = useState<SpiralType>("ulam");
  const [maxN, setMaxN] = useState(DEFAULT_SPIRAL_N);
  const [showComposites, setShowComposites] = useState(false);

  const points = useMemo(
    () => generateSpiralPoints(spiralType, maxN),
    [spiralType, maxN]
  );
  const primeCount = useMemo(
    () => points.reduce((count, p) => count + (p.isPrime ? 1 : 0), 0),
    [points]
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

    const fitted = fitPointsToViewport(points, width, height, 16);
    const dotSize = spiralType === "ulam" ? Math.max(1, Math.min(4, 900 / Math.sqrt(maxN))) : 1.6;

    if (showComposites) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      for (const p of fitted) {
        if (!p.isPrime) {
          ctx.fillRect(p.x - dotSize / 2, p.y - dotSize / 2, dotSize, dotSize);
        }
      }
    }

    ctx.fillStyle = "#7fd4ff";
    for (const p of fitted) {
      if (p.isPrime) {
        ctx.fillRect(p.x - dotSize / 2, p.y - dotSize / 2, dotSize, dotSize);
      }
    }
  }, [points, spiralType, maxN, showComposites]);

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


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `prime-spirals.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar primespiral-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Prime Spirals</h2>
            </div>
            <div className="dragon-sidebar-panel primespiral-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="primespiral-type">
                    Spiral
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="primespiral-type"
                      as="select"
                      value={spiralType}
                      onChange={(e) => setSpiralType(e.target.value as SpiralType)}
                    >
                      <option value="ulam">Ulam spiral (square)</option>
                      <option value="sacks">Sacks spiral (polar)</option>
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="primespiral-n">
                    Numbers plotted
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="primespiral-n"
                      type="range"
                      min={MIN_SPIRAL_N}
                      max={MAX_SPIRAL_N}
                      step={100}
                      value={maxN}
                      onChange={(e) => setMaxN(clampSpiralN(Number(e.target.value)))}
                    />
                    <div className="primespiral-value-readout">
                      {maxN.toLocaleString("en-US")}
                                      </div>
                  </div>
                </div>

                <FormCheck
                  id="primespiral-composites"
                  type="checkbox"
                  label="Show composite numbers (faint)"
                  checked={showComposites}
                  onChange={(e) => setShowComposites(e.target.checked)}
                />

                <div className="primespiral-results">
                  <div className="primespiral-result-row">
                    <span className="primespiral-result-label">Primes found</span>
                    <span className="primespiral-result-value">
                      {primeCount.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="primespiral-result-row">
                    <span className="primespiral-result-label">Density</span>
                    <span className="primespiral-result-value">
                      {((primeCount / maxN) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <Button variant="secondary" onClick={downloadPng}>
                  Download PNG
                </Button>


                <p className="primespiral-hint">
                  {spiralType === "ulam"
                    ? "Integers are laid out on a square spiral starting from the center. Primes fall along surprising diagonal lines, first spotted by Stanisław Ulam in 1963."
                    : "Each integer n sits at polar radius √n and angle 2π√n, so perfect squares always land on the same ray. Primes trace curved arms outward."}
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="primespiral-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="primespiral-canvas"
            role="img"
            aria-label={`${spiralType === "ulam" ? "Ulam" : "Sacks"} prime spiral`}
          />
        </div>
      </div>
    </>
  );
}
