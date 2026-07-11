import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampAngleDeg,
  clampAnimateSpeed,
  clampDotRadius,
  clampPointCount,
  clampScale,
  DEFAULT_ANGLE_DEG,
  DEFAULT_ANIMATE_SPEED,
  DEFAULT_DOT_RADIUS,
  DEFAULT_POINTS,
  DEFAULT_SCALE,
  drawPhyllotaxis,
  GOLDEN_ANGLE_DEG,
  MAX_ANGLE_DEG,
  MAX_ANIMATE_SPEED,
  MAX_DOT_RADIUS,
  MAX_POINTS,
  MAX_SCALE,
  MIN_ANGLE_DEG,
  MIN_ANIMATE_SPEED,
  MIN_DOT_RADIUS,
  MIN_POINTS,
  MIN_SCALE,
  PhyllotaxisColorMode,
} from "./phyllotaxis";

export default function PhyllotaxisApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(DEFAULT_ANGLE_DEG);

  const [pointCount, setPointCount] = useState(DEFAULT_POINTS);
  const [angleDeg, setAngleDeg] = useState(DEFAULT_ANGLE_DEG);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [dotRadius, setDotRadius] = useState(DEFAULT_DOT_RADIUS);
  const [colorMode, setColorMode] = useState<PhyllotaxisColorMode>("radius");
  const [animate, setAnimate] = useState(false);
  const [animateSpeed, setAnimateSpeed] = useState(DEFAULT_ANIMATE_SPEED);

  useEffect(() => {
    angleRef.current = angleDeg;
  }, [angleDeg]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displayWidth = Math.max(1, wrap.clientWidth);
    const displayHeight = Math.max(1, wrap.clientHeight);
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    drawPhyllotaxis(
      ctx,
      displayWidth,
      displayHeight,
      pointCount,
      angleRef.current,
      scale,
      dotRadius,
      colorMode
    );
  }, [pointCount, scale, dotRadius, colorMode]);

  useEffect(() => {
    draw();
  }, [draw, angleDeg]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }
    const observer = new ResizeObserver(() => draw());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [draw]);

  // Animating the turning angle is layered on top of the otherwise
  // static/parametric visualization, the same opt-in pattern used by Op
  // Art's auto-rotate: it only runs while enabled, and re-invokes the same
  // draw() used everywhere else via the angle ref rather than adopting the
  // full animated-template shape.
  useEffect(() => {
    if (!animate) {
      return;
    }
    let frameId = 0;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      let next = angleRef.current + animateSpeed * dt;
      if (next > MAX_ANGLE_DEG) {
        next = MIN_ANGLE_DEG;
      }
      angleRef.current = next;
      setAngleDeg(next);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [animate, animateSpeed]);

  const resetView = () => {
    setPointCount(DEFAULT_POINTS);
    setAngleDeg(DEFAULT_ANGLE_DEG);
    setScale(DEFAULT_SCALE);
    setDotRadius(DEFAULT_DOT_RADIUS);
    setColorMode("radius");
    setAnimate(false);
    setAnimateSpeed(DEFAULT_ANIMATE_SPEED);
  };

  const useGoldenAngle = () => {
    setAngleDeg(GOLDEN_ANGLE_DEG);
  };


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `phyllotaxis.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar phyllotaxis-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Phyllotaxis Spirals</h2>
            </div>
            <div className="dragon-sidebar-panel phyllotaxis-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="phyllotaxis-count">
                    Seed count
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="phyllotaxis-count"
                      type="range"
                      min={MIN_POINTS}
                      max={MAX_POINTS}
                      step={50}
                      value={pointCount}
                      onChange={(e) =>
                        setPointCount(clampPointCount(Number(e.target.value)))
                      }
                    />
                    <div className="phyllotaxis-value-readout">{pointCount}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="phyllotaxis-angle">
                    Turning angle
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="phyllotaxis-angle"
                      type="range"
                      min={MIN_ANGLE_DEG}
                      max={MAX_ANGLE_DEG}
                      step={0.01}
                      value={angleDeg}
                      onChange={(e) => setAngleDeg(clampAngleDeg(Number(e.target.value)))}
                    />
                    <div className="phyllotaxis-value-readout">
                      {angleDeg.toFixed(3)}°
                                      </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="phyllotaxis-scale">
                    Spacing
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="phyllotaxis-scale"
                      type="range"
                      min={MIN_SCALE}
                      max={MAX_SCALE}
                      step={0.5}
                      value={scale}
                      onChange={(e) => setScale(clampScale(Number(e.target.value)))}
                    />
                    <div className="phyllotaxis-value-readout">{scale.toFixed(1)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="phyllotaxis-dot">
                    Seed size
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="phyllotaxis-dot"
                      type="range"
                      min={MIN_DOT_RADIUS}
                      max={MAX_DOT_RADIUS}
                      step={0.5}
                      value={dotRadius}
                      onChange={(e) =>
                        setDotRadius(clampDotRadius(Number(e.target.value)))
                      }
                    />
                    <div className="phyllotaxis-value-readout">{dotRadius.toFixed(1)}px</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="phyllotaxis-color">
                    Color by
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="phyllotaxis-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) =>
                        setColorMode(e.target.value as PhyllotaxisColorMode)
                      }
                    >
                      <option value="radius">Distance from center</option>
                      <option value="index">Seed order</option>
                      <option value="mono">Single color</option>
                    </FormControl>
                  </div>
                </div>

                <FormCheck
                  id="phyllotaxis-animate"
                  type="checkbox"
                  label="Animate turning angle"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                />

                {animate ? (
                  <div className="viz-control-row">
                    <FormLabel className="section-label-muted viz-control-row-label"
                      htmlFor="phyllotaxis-animate-speed">
                      Animate speed
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id="phyllotaxis-animate-speed"
                        type="range"
                        min={MIN_ANIMATE_SPEED}
                        max={MAX_ANIMATE_SPEED}
                        step={0.005}
                        value={animateSpeed}
                        onChange={(e) =>
                          setAnimateSpeed(clampAnimateSpeed(Number(e.target.value)))
                        }
                      />
                      <div className="phyllotaxis-value-readout">
                        {animateSpeed.toFixed(3)}°/s
                                          </div>
                    </div>
                  </div>
                ) : null}

                <Stack direction="horizontal" gap={2}>
                  <Button variant="primary" onClick={useGoldenAngle}>
                    Golden angle
                  </Button>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <p className="phyllotaxis-hint">
                  Each seed turns a fixed angle from the last and pushes
                  outward by √index, the packing rule behind sunflower heads
                  and pinecones. At exactly the golden angle (≈137.508°) the
                  spiral arms never realign; nudge the angle even slightly and
                  the pattern collapses into a small number of straight arms.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="phyllotaxis-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="phyllotaxis-canvas"
            role="img"
            aria-label="Phyllotaxis spiral of seeds arranged by a fixed turning angle"
          />
        </div>
      </div>
    </>
  );
}
