import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  ChladniRenderMode,
  clampMode,
  clampParticleCount,
  clampThreshold,
  DEFAULT_MODE_M,
  DEFAULT_MODE_N,
  DEFAULT_PARTICLES,
  DEFAULT_THRESHOLD,
  MAX_MODE,
  MAX_PARTICLES,
  MAX_THRESHOLD,
  MIN_MODE,
  MIN_PARTICLES,
  MIN_THRESHOLD,
  nodalCoverageFraction,
  renderChladni,
} from "./chladni";

const MAX_RENDER_WIDTH = 640;
const MAX_RENDER_HEIGHT = 640;

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function ChladniApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<ChladniRenderMode>("nodal-lines");
  const [modeN, setModeN] = useState(DEFAULT_MODE_N);
  const [modeM, setModeM] = useState(DEFAULT_MODE_M);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [particleCount, setParticleCount] = useState(DEFAULT_PARTICLES);
  const [seed, setSeed] = useState(randomSeed);
  const [coverage, setCoverage] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displaySize = Math.max(
      1,
      Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight))
    );
    const size = Math.min(displaySize, MAX_RENDER_WIDTH, MAX_RENDER_HEIGHT);

    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const imageData = ctx.createImageData(size, size);
    renderChladni(imageData, {
      mode,
      n: modeN,
      m: modeM,
      threshold,
      particleCount,
      seed,
    });
    ctx.putImageData(imageData, 0, 0);
    setCoverage(nodalCoverageFraction(imageData));
  }, [mode, modeN, modeM, threshold, particleCount, seed]);

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

  const randomizeModes = () => {
    setModeN(Math.floor(Math.random() * (MAX_MODE - MIN_MODE + 1)) + MIN_MODE);
    setModeM(Math.floor(Math.random() * (MAX_MODE - MIN_MODE + 1)) + MIN_MODE);
    setSeed(randomSeed());
  };

  const resetView = () => {
    setMode("nodal-lines");
    setModeN(DEFAULT_MODE_N);
    setModeM(DEFAULT_MODE_M);
    setThreshold(DEFAULT_THRESHOLD);
    setParticleCount(DEFAULT_PARTICLES);
  };

  const coveragePercent = useMemo(() => (coverage * 100).toFixed(1), [coverage]);


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `chladni-patterns.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar chladni-patterns-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Chladni Patterns</h2>
            </div>
            <div className="dragon-sidebar-panel chladni-patterns-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="chladni-mode">
                    Render mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="chladni-mode"
                      as="select"
                      value={mode}
                      onChange={(e) => setMode(e.target.value as ChladniRenderMode)}
                    >
                      <option value="nodal-lines">Nodal lines</option>
                      <option value="sand-particles">Sand particles</option>
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="chladni-mode-n">
                    Mode n
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="chladni-mode-n"
                      type="range"
                      min={MIN_MODE}
                      max={MAX_MODE}
                      step={1}
                      value={modeN}
                      onChange={(e) => setModeN(clampMode(Number(e.target.value)))}
                    />
                    <div className="chladni-patterns-value-readout">{modeN}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="chladni-mode-m">
                    Mode m
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="chladni-mode-m"
                      type="range"
                      min={MIN_MODE}
                      max={MAX_MODE}
                      step={1}
                      value={modeM}
                      onChange={(e) => setModeM(clampMode(Number(e.target.value)))}
                    />
                    <div className="chladni-patterns-value-readout">{modeM}</div>
                  </div>
                </div>

                {mode === "nodal-lines" ? (
                  <div className="viz-control-row">
                    <FormLabel className="section-label-muted viz-control-row-label"
                      htmlFor="chladni-threshold">
                      Line thickness
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id="chladni-threshold"
                        type="range"
                        min={MIN_THRESHOLD}
                        max={MAX_THRESHOLD}
                        step={0.01}
                        value={threshold}
                        onChange={(e) =>
                          setThreshold(clampThreshold(Number(e.target.value)))
                        }
                      />
                      <div className="chladni-patterns-value-readout">
                        {threshold.toFixed(2)}
                                          </div>
                    </div>
                  </div>
                ) : (
                  <div className="viz-control-row">
                    <FormLabel className="section-label-muted viz-control-row-label"
                      htmlFor="chladni-particles">
                      Particle count
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id="chladni-particles"
                        type="range"
                        min={MIN_PARTICLES}
                        max={MAX_PARTICLES}
                        step={500}
                        value={particleCount}
                        onChange={(e) =>
                          setParticleCount(clampParticleCount(Number(e.target.value)))
                        }
                      />
                      <div className="chladni-patterns-value-readout">
                        {particleCount}
                                          </div>
                    </div>
                  </div>
                )}

                <div className="chladni-patterns-results">
                  <div className="chladni-patterns-result-row">
                    <span className="chladni-patterns-result-label">Modes</span>
                    <span className="chladni-patterns-result-value">
                      n={modeN}, m={modeM}
                    </span>
                  </div>
                  <div className="chladni-patterns-result-row">
                    <span className="chladni-patterns-result-label">
                      Nodal coverage
                    </span>
                    <span className="chladni-patterns-result-value">
                      {coveragePercent}%
                    </span>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="primary" onClick={randomizeModes}>
                    Randomize modes
                  </Button>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <p className="chladni-patterns-hint">
                  A vibrating square plate settles into standing waves; sand
                  sprinkled on it gathers along the still, silent nodal lines.
                  z(x,y) = cos(nπx)cos(mπy) − cos(mπx)cos(nπy) — the lines are
                  where z ≈ 0.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="chladni-patterns-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="chladni-patterns-canvas"
            role="img"
            aria-label="Chladni nodal pattern for the selected plate modes"
          />
        </div>
      </div>
    </>
  );
}
