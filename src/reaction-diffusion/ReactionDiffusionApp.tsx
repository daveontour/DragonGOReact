import { useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampFeed,
  clampKill,
  clampStepsPerFrame,
  createReactionDiffusionState,
  DEFAULT_FEED,
  DEFAULT_KILL,
  DEFAULT_STEPS_PER_FRAME,
  GRID_SIZE,
  MAX_FEED,
  MAX_KILL,
  MAX_STEPS_PER_FRAME,
  MIN_FEED,
  MIN_KILL,
  MIN_STEPS_PER_FRAME,
  ReactionDiffusionColorMode,
  ReactionDiffusionState,
  REACTION_DIFFUSION_PRESETS,
  renderReactionDiffusion,
  runReactionDiffusionSteps,
} from "./reactiondiffusion";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function ReactionDiffusionApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<ReactionDiffusionState>(
    createReactionDiffusionState(GRID_SIZE, randomSeed())
  );
  const runningRef = useRef(true);
  const feedRef = useRef(DEFAULT_FEED);
  const killRef = useRef(DEFAULT_KILL);
  const stepsPerFrameRef = useRef(DEFAULT_STEPS_PER_FRAME);
  const colorModeRef = useRef<ReactionDiffusionColorMode>("mono");
  const stepCountRef = useRef(0);

  const [feed, setFeed] = useState(DEFAULT_FEED);
  const [kill, setKill] = useState(DEFAULT_KILL);
  const [stepsPerFrame, setStepsPerFrame] = useState(DEFAULT_STEPS_PER_FRAME);
  const [colorMode, setColorMode] = useState<ReactionDiffusionColorMode>("mono");
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({ steps: 0 });

  useEffect(() => {
    feedRef.current = feed;
  }, [feed]);
  useEffect(() => {
    killRef.current = kill;
  }, [kill]);
  useEffect(() => {
    stepsPerFrameRef.current = stepsPerFrame;
  }, [stepsPerFrame]);
  useEffect(() => {
    colorModeRef.current = colorMode;
  }, [colorMode]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    let frameId = 0;

    const loop = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) {
        frameId = requestAnimationFrame(loop);
        return;
      }

      if (canvas.width !== GRID_SIZE || canvas.height !== GRID_SIZE) {
        canvas.width = GRID_SIZE;
        canvas.height = GRID_SIZE;
      }
      const displaySize = Math.max(
        1,
        Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight))
      );
      canvas.style.width = `${displaySize}px`;
      canvas.style.height = `${displaySize}px`;

      if (runningRef.current) {
        runReactionDiffusionSteps(
          stateRef.current,
          feedRef.current,
          killRef.current,
          stepsPerFrameRef.current
        );
        stepCountRef.current += stepsPerFrameRef.current;
        setStats({ steps: stepCountRef.current });
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.createImageData(GRID_SIZE, GRID_SIZE);
        renderReactionDiffusion(imageData, stateRef.current, colorModeRef.current);
        ctx.putImageData(imageData, 0, 0);
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const reseed = () => {
    stateRef.current = createReactionDiffusionState(GRID_SIZE, randomSeed());
    stepCountRef.current = 0;
    setStats({ steps: 0 });
  };

  const applyPreset = (value: string) => {
    const preset = REACTION_DIFFUSION_PRESETS.find((p) => p.id === value);
    if (preset) {
      setFeed(preset.feed);
      setKill(preset.kill);
    }
  };


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `reaction-diffusion.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar reaction-diffusion-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Reaction-Diffusion</h2>
            </div>
            <div className="dragon-sidebar-panel reaction-diffusion-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label"
                    htmlFor="reaction-diffusion-preset">
                    Quick preset
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="reaction-diffusion-preset"
                      as="select"
                      value=""
                      onChange={(e) => applyPreset(e.target.value)}
                    >
                      <option value="" disabled>
                      Choose a preset…
                    </option>
                      {REACTION_DIFFUSION_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                      ))}
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label"
                    htmlFor="reaction-diffusion-feed">
                    Feed rate
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="reaction-diffusion-feed"
                      type="range"
                      min={MIN_FEED}
                      max={MAX_FEED}
                      step={0.001}
                      value={feed}
                      onChange={(e) => setFeed(clampFeed(Number(e.target.value)))}
                    />
                    <div className="reaction-diffusion-value-readout">
                      {feed.toFixed(3)}
                                      </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label"
                    htmlFor="reaction-diffusion-kill">
                    Kill rate
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="reaction-diffusion-kill"
                      type="range"
                      min={MIN_KILL}
                      max={MAX_KILL}
                      step={0.001}
                      value={kill}
                      onChange={(e) => setKill(clampKill(Number(e.target.value)))}
                    />
                    <div className="reaction-diffusion-value-readout">
                      {kill.toFixed(3)}
                                      </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label"
                    htmlFor="reaction-diffusion-steps">
                    Simulation speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="reaction-diffusion-steps"
                      type="range"
                      min={MIN_STEPS_PER_FRAME}
                      max={MAX_STEPS_PER_FRAME}
                      step={1}
                      value={stepsPerFrame}
                      onChange={(e) =>
                        setStepsPerFrame(clampStepsPerFrame(Number(e.target.value)))
                      }
                    />
                    <div className="reaction-diffusion-value-readout">
                      {stepsPerFrame} steps/frame
                                      </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label"
                    htmlFor="reaction-diffusion-color">
                    Color mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="reaction-diffusion-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) =>
                        setColorMode(e.target.value as ReactionDiffusionColorMode)
                      }
                    >
                      <option value="mono">Ink</option>
                      <option value="ocean">Ocean</option>
                      <option value="thermal">Thermal</option>
                    </FormControl>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button
                    variant={running ? "secondary" : "primary"}
                    onClick={() => setRunning((r) => !r)}
                  >
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button variant="outline-light" onClick={reseed}>
                    New pattern seed
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <div className="reaction-diffusion-results">
                  <div className="reaction-diffusion-result-row">
                    <span className="reaction-diffusion-result-label">Steps</span>
                    <span className="reaction-diffusion-result-value">
                      {stats.steps}
                    </span>
                  </div>
                </div>

                <p className="reaction-diffusion-hint">
                  Two virtual chemicals U and V diffuse across a grid and
                  react (U + 2V → 3V), while U is fed back in and V is
                  drained away. The Gray-Scott model's feed and kill rates
                  alone decide whether the result settles into spots,
                  stripes, or ever-growing coral — the same instability
                  Alan Turing proposed for how animals get their markings.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="reaction-diffusion-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="reaction-diffusion-canvas"
            role="img"
            aria-label="Gray-Scott reaction-diffusion simulation grid"
          />
        </div>
      </div>
    </>
  );
}
