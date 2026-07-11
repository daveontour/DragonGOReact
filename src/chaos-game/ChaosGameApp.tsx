import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  CHAOS_GAME_MAX_RENDER_SIZE,
  ChaosGameColorMode,
  ChaosGameMode,
  clampPointCount,
  clampRatio,
  clampRestrictionK,
  clampVertexCount,
  DEFAULT_POINT_COUNT,
  DEFAULT_RATIO,
  DEFAULT_RESTRICTION_K,
  DEFAULT_VERTICES,
  MAX_POINT_COUNT,
  MAX_RATIO,
  MAX_RESTRICTION_K,
  MAX_VERTICES,
  MIN_POINT_COUNT,
  MIN_RATIO,
  MIN_RESTRICTION_K,
  MIN_VERTICES,
  renderChaosGameDensity,
  runChaosGameDensity,
} from "./chaosgame";

const ANIMATE_DURATION_SECONDS = 4;

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function ChaosGameApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef(0);

  const [mode, setMode] = useState<ChaosGameMode>("polygon");
  const [vertices, setVertices] = useState(DEFAULT_VERTICES);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [restrictionK, setRestrictionK] = useState(DEFAULT_RESTRICTION_K);
  const [pointCount, setPointCount] = useState(DEFAULT_POINT_COUNT);
  const [colorMode, setColorMode] = useState<ChaosGameColorMode>("mono");
  const [seed, setSeed] = useState(randomSeed);
  const [animate, setAnimate] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displaySize = Math.max(1, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)));
    const renderSize = Math.min(CHAOS_GAME_MAX_RENDER_SIZE, displaySize);
    canvas.width = renderSize;
    canvas.height = renderSize;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const activePointCount = animate
      ? Math.max(1, Math.floor(revealRef.current))
      : pointCount;

    const density = runChaosGameDensity({
      mode,
      width: renderSize,
      height: renderSize,
      vertices,
      ratio,
      restrictionK,
      pointCount: activePointCount,
      seed,
    });

    const imageData = ctx.createImageData(renderSize, renderSize);
    renderChaosGameDensity(imageData, density, colorMode);
    ctx.putImageData(imageData, 0, 0);
  }, [mode, vertices, ratio, restrictionK, pointCount, colorMode, seed, animate]);

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

  // Animate build-up is an opt-in reveal layered on top of the otherwise
  // static render, the same pattern used elsewhere in this gallery: only
  // runs while enabled, re-invokes the same draw() with a growing point
  // budget (rather than a growing polyline reveal count) each frame.
  useEffect(() => {
    if (!animate) {
      return;
    }
    revealRef.current = 1;
    let frameId = 0;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const perSecond = pointCount / ANIMATE_DURATION_SECONDS;
      revealRef.current += perSecond * dt;
      if (revealRef.current > pointCount) {
        revealRef.current = 1;
      }
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [animate, pointCount, draw]);

  const resetView = () => {
    setMode("polygon");
    setVertices(DEFAULT_VERTICES);
    setRatio(DEFAULT_RATIO);
    setRestrictionK(DEFAULT_RESTRICTION_K);
    setPointCount(DEFAULT_POINT_COUNT);
    setColorMode("mono");
    setAnimate(false);
  };

  const newSeed = () => setSeed(randomSeed());

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `chaos-game.png`);
  };

  const isPolygon = mode === "polygon";

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar chaos-game-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Chaos Game</h2>
            </div>
            <div className="dragon-sidebar-panel chaos-game-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="chaos-game-mode"
                  >
                    Pattern
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="chaos-game-mode"
                      as="select"
                      value={mode}
                      onChange={(e) => setMode(e.target.value as ChaosGameMode)}
                    >
                      <option value="polygon">Polygon chaos game</option>
                      <option value="fern">Barnsley fern</option>
                    </FormControl>
                  </div>
                </div>

                {isPolygon ? (
                  <>
                    <div className="viz-control-row">
                      <FormLabel
                        className="section-label-muted viz-control-row-label"
                        htmlFor="chaos-game-vertices"
                      >
                        Vertices
                      </FormLabel>
                      <div className="viz-control-row-control">
                        <FormControl
                          id="chaos-game-vertices"
                          type="range"
                          min={MIN_VERTICES}
                          max={MAX_VERTICES}
                          step={1}
                          value={vertices}
                          onChange={(e) =>
                            setVertices(clampVertexCount(Number(e.target.value)))
                          }
                        />
                        <div className="chaos-game-value-readout">{vertices}</div>
                      </div>
                    </div>

                    <div className="viz-control-row">
                      <FormLabel
                        className="section-label-muted viz-control-row-label"
                        htmlFor="chaos-game-ratio"
                      >
                        Jump ratio
                      </FormLabel>
                      <div className="viz-control-row-control">
                        <FormControl
                          id="chaos-game-ratio"
                          type="range"
                          min={MIN_RATIO}
                          max={MAX_RATIO}
                          step={0.01}
                          value={ratio}
                          onChange={(e) => setRatio(clampRatio(Number(e.target.value)))}
                        />
                        <div className="chaos-game-value-readout">{ratio.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="viz-control-row">
                      <FormLabel
                        className="section-label-muted viz-control-row-label"
                        htmlFor="chaos-game-restriction"
                      >
                        Avoid repeating last
                      </FormLabel>
                      <div className="viz-control-row-control">
                        <FormControl
                          id="chaos-game-restriction"
                          type="range"
                          min={MIN_RESTRICTION_K}
                          max={MAX_RESTRICTION_K}
                          step={1}
                          value={restrictionK}
                          onChange={(e) =>
                            setRestrictionK(clampRestrictionK(Number(e.target.value)))
                          }
                        />
                        <div className="chaos-game-value-readout">
                          {restrictionK === 0 ? "off" : `${restrictionK} pick(s)`}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="chaos-game-points"
                  >
                    Point count
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="chaos-game-points"
                      type="range"
                      min={MIN_POINT_COUNT}
                      max={MAX_POINT_COUNT}
                      step={5000}
                      value={pointCount}
                      onChange={(e) =>
                        setPointCount(clampPointCount(Number(e.target.value)))
                      }
                    />
                    <div className="chaos-game-value-readout">
                      {pointCount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="chaos-game-color"
                  >
                    Color mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="chaos-game-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as ChaosGameColorMode)}
                    >
                      <option value="mono">Ink</option>
                      <option value="thermal">Thermal</option>
                    </FormControl>
                  </div>
                </div>

                <FormCheck
                  id="chaos-game-animate"
                  type="checkbox"
                  label="Animate build-up"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                />

                <Stack direction="horizontal" gap={2}>
                  <Button variant="outline-light" onClick={newSeed}>
                    New random seed
                  </Button>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <p className="chaos-game-hint">
                  Pick a random point, then repeatedly jump a fixed fraction
                  of the way toward a randomly chosen vertex of a polygon
                  (or, for the fern, one of four weighted affine
                  transformations) and plot where you land. Despite every
                  step being random, the accumulated points settle onto a
                  fixed fractal shape — three vertices at a half-step gives
                  the Sierpinski triangle, while forbidding immediate
                  repeats among four or more vertices turns an otherwise
                  solid polygon into a lattice of nested holes, and
                  Barnsley's four-transform recipe famously converges to a
                  lifelike fern frond.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="chaos-game-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="chaos-game-canvas"
            role="img"
            aria-label="Chaos game fractal density render"
          />
        </div>
      </div>
    </>
  );
}
