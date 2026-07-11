import { useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampAntCount,
  clampStepsPerFrame,
  createTurmiteState,
  DEFAULT_ANT_COUNT,
  DEFAULT_RULE,
  DEFAULT_STEPS_PER_FRAME,
  GRID_SIZE,
  isValidRule,
  MAX_ANT_COUNT,
  MAX_STEPS_PER_FRAME,
  MIN_ANT_COUNT,
  MIN_STEPS_PER_FRAME,
  renderTurmite,
  RULE_PRESETS,
  runTurmiteSteps,
  TurmiteState,
} from "./langtonsant";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function LangtonsAntApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<TurmiteState>(
    createTurmiteState(GRID_SIZE, DEFAULT_RULE, DEFAULT_ANT_COUNT, randomSeed())
  );
  const runningRef = useRef(true);
  const stepsPerFrameRef = useRef(DEFAULT_STEPS_PER_FRAME);
  const stepCountRef = useRef(0);

  const [ruleInput, setRuleInput] = useState(DEFAULT_RULE);
  const [antCount, setAntCount] = useState(DEFAULT_ANT_COUNT);
  const [stepsPerFrame, setStepsPerFrame] = useState(DEFAULT_STEPS_PER_FRAME);
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({ steps: 0 });

  useEffect(() => {
    stepsPerFrameRef.current = stepsPerFrame;
  }, [stepsPerFrame]);
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
        runTurmiteSteps(stateRef.current, stepsPerFrameRef.current);
        stepCountRef.current += stepsPerFrameRef.current;
        setStats({ steps: stepCountRef.current });
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.createImageData(GRID_SIZE, GRID_SIZE);
        renderTurmite(imageData, stateRef.current);
        ctx.putImageData(imageData, 0, 0);
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const reseed = (rule: string, count: number) => {
    stateRef.current = createTurmiteState(GRID_SIZE, rule, count, randomSeed());
    stepCountRef.current = 0;
    setStats({ steps: 0 });
  };

  const applyRule = (value: string) => {
    setRuleInput(value);
    if (isValidRule(value)) {
      reseed(value, antCount);
    }
  };

  const applyAntCount = (value: number) => {
    const next = clampAntCount(value);
    setAntCount(next);
    if (isValidRule(ruleInput)) {
      reseed(ruleInput, next);
    }
  };

  const applyPreset = (id: string) => {
    const preset = RULE_PRESETS.find((p) => p.id === id);
    if (preset) {
      applyRule(preset.rule);
    }
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `langtons-ant.png`);
  };

  const ruleIsValid = isValidRule(ruleInput);

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar langtons-ant-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Langton's Ant</h2>
            </div>
            <div className="dragon-sidebar-panel langtons-ant-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="langtons-ant-preset"
                  >
                    Quick preset
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="langtons-ant-preset"
                      as="select"
                      value=""
                      onChange={(e) => applyPreset(e.target.value)}
                    >
                      <option value="" disabled>
                        Choose a preset…
                      </option>
                      {RULE_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label} ({preset.rule})
                        </option>
                      ))}
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="langtons-ant-rule"
                  >
                    Rule (L/R string)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="langtons-ant-rule"
                      type="text"
                      value={ruleInput}
                      isInvalid={!ruleIsValid}
                      onChange={(e) =>
                        applyRule(e.target.value.toUpperCase().slice(0, 8))
                      }
                    />
                    <div className="langtons-ant-value-readout">
                      {ruleIsValid ? `${ruleInput.length} colors` : "2-8 letters, L/R only"}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="langtons-ant-count"
                  >
                    Ant count
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="langtons-ant-count"
                      type="range"
                      min={MIN_ANT_COUNT}
                      max={MAX_ANT_COUNT}
                      step={1}
                      value={antCount}
                      onChange={(e) => applyAntCount(Number(e.target.value))}
                    />
                    <div className="langtons-ant-value-readout">{antCount}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="langtons-ant-steps"
                  >
                    Simulation speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="langtons-ant-steps"
                      type="range"
                      min={MIN_STEPS_PER_FRAME}
                      max={MAX_STEPS_PER_FRAME}
                      step={1}
                      value={stepsPerFrame}
                      onChange={(e) =>
                        setStepsPerFrame(clampStepsPerFrame(Number(e.target.value)))
                      }
                    />
                    <div className="langtons-ant-value-readout">
                      {stepsPerFrame} steps/frame
                    </div>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button
                    variant={running ? "secondary" : "primary"}
                    onClick={() => setRunning((r) => !r)}
                  >
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button
                    variant="outline-light"
                    onClick={() => reseed(ruleIsValid ? ruleInput : DEFAULT_RULE, antCount)}
                  >
                    Restart
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <div className="langtons-ant-results">
                  <div className="langtons-ant-result-row">
                    <span className="langtons-ant-result-label">Steps</span>
                    <span className="langtons-ant-result-value">{stats.steps}</span>
                  </div>
                </div>

                <p className="langtons-ant-hint">
                  A single ant sits on a grid of cells that are each one of a
                  few colors. At each step it turns per a fixed rule keyed to
                  the color it's standing on (L = left, R = right), advances
                  that cell to the next color, and moves forward one square.
                  From this trivial rule, thousands of chaotic-looking steps
                  eventually resolve into an infinitely repeating diagonal
                  "highway" — order emerging from simple, fully deterministic
                  motion. Longer rule strings (more colors) can produce
                  entirely different symmetric or explosive growth patterns.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="langtons-ant-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="langtons-ant-canvas"
            role="img"
            aria-label="Langton's ant simulation grid"
          />
        </div>
      </div>
    </>
  );
}
