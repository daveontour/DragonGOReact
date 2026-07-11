import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  boundsForSquares,
  buildPythagorasTree,
  clampPythagorasAngle,
  clampPythagorasDepth,
  DEFAULT_ANGLE_DEG,
  DEFAULT_DEPTH,
  drawPythagorasTree,
  MAX_ANGLE_DEG,
  MAX_DEPTH,
  MIN_ANGLE_DEG,
  MIN_DEPTH,
  PythagorasColorMode,
} from "./pythagorastree";

const ANIMATE_DURATION_SECONDS = 3;

export default function PythagorasTreeApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef(0);

  const [depth, setDepth] = useState(DEFAULT_DEPTH);
  const [angleDeg, setAngleDeg] = useState(DEFAULT_ANGLE_DEG);
  const [colorMode, setColorMode] = useState<PythagorasColorMode>("by-depth");
  const [animate, setAnimate] = useState(false);

  const squares = useMemo(() => {
    const angleRad = (angleDeg * Math.PI) / 180;
    // Root edge is a unit-length segment walked right-to-left, which (given
    // buildPythagorasTree's fixed rotation convention) puts the trunk
    // square below y=0 and grows the recursive tree upward into y<0.
    return buildPythagorasTree({ x: 0.5, y: 0 }, { x: -0.5, y: 0 }, depth, angleRad);
  }, [depth, angleDeg]);

  const bounds = useMemo(() => boundsForSquares(squares), [squares]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displaySize = Math.max(1, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)));
    canvas.width = displaySize;
    canvas.height = displaySize;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const spanX = Math.max(1e-6, bounds.maxX - bounds.minX);
    const spanY = Math.max(1e-6, bounds.maxY - bounds.minY);
    const scale = (displaySize * 0.88) / Math.max(spanX, spanY);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const revealCount = animate ? Math.floor(revealRef.current) : squares.length;
    drawPythagorasTree(ctx, displaySize, squares, colorMode, depth, scale, centerX, centerY, revealCount);
  }, [squares, bounds, colorMode, depth, animate]);

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
    revealRef.current = 0;
    let frameId = 0;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const perSecond = Math.max(1, squares.length) / ANIMATE_DURATION_SECONDS;
      revealRef.current += perSecond * dt;
      if (revealRef.current > squares.length) {
        revealRef.current = 0;
      }
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [animate, squares.length, draw]);

  const resetView = () => {
    setDepth(DEFAULT_DEPTH);
    setAngleDeg(DEFAULT_ANGLE_DEG);
    setColorMode("by-depth");
    setAnimate(false);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `pythagoras-tree.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar pythagoras-tree-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Pythagoras Tree</h2>
            </div>
            <div className="dragon-sidebar-panel pythagoras-tree-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pythagoras-depth">
                    Recursion depth
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pythagoras-depth"
                      type="range"
                      min={MIN_DEPTH}
                      max={MAX_DEPTH}
                      step={1}
                      value={depth}
                      onChange={(e) => setDepth(clampPythagorasDepth(Number(e.target.value)))}
                    />
                    <div className="pythagoras-tree-value-readout">{depth}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pythagoras-angle">
                    Branch angle
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pythagoras-angle"
                      type="range"
                      min={MIN_ANGLE_DEG}
                      max={MAX_ANGLE_DEG}
                      step={0.5}
                      value={angleDeg}
                      onChange={(e) => setAngleDeg(clampPythagorasAngle(Number(e.target.value)))}
                    />
                    <div className="pythagoras-tree-value-readout">{angleDeg.toFixed(1)}°</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pythagoras-color">
                    Color mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pythagoras-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as PythagorasColorMode)}
                    >
                      <option value="by-depth">By generation</option>
                      <option value="by-branch-side">By branch side</option>
                      <option value="mono">Single color</option>
                    </FormControl>
                  </div>
                </div>

                <FormCheck
                  id="pythagoras-animate"
                  type="checkbox"
                  label="Animate growth"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                />

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <p className="pythagoras-tree-hint">
                  Erect a right triangle on top of a square's edge, then two
                  smaller squares on that triangle's other two sides, and
                  recurse: because the triangle's legs satisfy the
                  Pythagorean theorem exactly (leg₁²+leg₂²=hypotenuse²),
                  the combined area of every pair of child squares always
                  equals their parent's area, generation after generation —
                  a visual proof of the theorem repeated at every scale. At
                  the symmetric 45° angle the two children are always
                  equal, producing the classic tree-shaped fractal first
                  described by Dutch mathematics teacher Albert E. Bosman
                  in 1942; pushing the angle away from 45° breaks the
                  symmetry and tilts the whole structure into a lopsided,
                  wind-blown-looking form, since one branch's squares now
                  shrink faster than the other's.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="pythagoras-tree-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="pythagoras-tree-canvas"
            role="img"
            aria-label="Pythagoras tree fractal"
          />
        </div>
      </div>
    </>
  );
}
