import { useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  applyPreset,
  AutomatonMode,
  AutomatonState,
  BRAIN_OFF,
  BRAIN_ON,
  clampSeedDensity,
  clampStepsPerFrame,
  clearGrid,
  createAutomatonState,
  DEFAULT_SEED_DENSITY,
  DEFAULT_STEPS_PER_FRAME,
  GRID_HEIGHT,
  GRID_WIDTH,
  MAX_SEED_DENSITY,
  MAX_STEPS_PER_FRAME,
  MIN_SEED_DENSITY,
  MIN_STEPS_PER_FRAME,
  renderAutomaton,
  runSteps,
  seedBriansBrainRandom,
  setCell,
  WIRE_CONDUCTOR,
  WIRE_EMPTY,
  WIRE_HEAD,
  WIRE_TAIL,
  WIREWORLD_PRESETS,
} from "./wireworld";

type WireworldTool = "conductor" | "head" | "tail" | "erase";
type BrainTool = "on" | "erase";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

function createInitialState(): AutomatonState {
  const state = createAutomatonState(GRID_WIDTH, GRID_HEIGHT);
  const loop = WIREWORLD_PRESETS.find((p) => p.id === "loop");
  if (loop) {
    applyPreset(state, loop);
  }
  return state;
}

export default function WireworldApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<AutomatonState>(createInitialState());
  const modeRef = useRef<AutomatonMode>("wireworld");
  const runningRef = useRef(true);
  const stepsPerFrameRef = useRef(DEFAULT_STEPS_PER_FRAME);
  const stepCountRef = useRef(0);
  const isPaintingRef = useRef(false);
  const wireToolRef = useRef<WireworldTool>("conductor");
  const brainToolRef = useRef<BrainTool>("on");

  const [mode, setMode] = useState<AutomatonMode>("wireworld");
  const [running, setRunning] = useState(true);
  const [stepsPerFrame, setStepsPerFrame] = useState(DEFAULT_STEPS_PER_FRAME);
  const [seedDensity, setSeedDensity] = useState(DEFAULT_SEED_DENSITY);
  const [wireTool, setWireTool] = useState<WireworldTool>("conductor");
  const [brainTool, setBrainTool] = useState<BrainTool>("on");
  const [presetId, setPresetId] = useState("loop");
  const [stats, setStats] = useState({ steps: 0 });

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    stepsPerFrameRef.current = stepsPerFrame;
  }, [stepsPerFrame]);
  useEffect(() => {
    wireToolRef.current = wireTool;
  }, [wireTool]);
  useEffect(() => {
    brainToolRef.current = brainTool;
  }, [brainTool]);

  useEffect(() => {
    let frameId = 0;
    const loop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        if (canvas.width !== GRID_WIDTH || canvas.height !== GRID_HEIGHT) {
          canvas.width = GRID_WIDTH;
          canvas.height = GRID_HEIGHT;
        }

        if (runningRef.current) {
          runSteps(stateRef.current, modeRef.current, stepsPerFrameRef.current);
          stepCountRef.current += stepsPerFrameRef.current;
          setStats({ steps: stepCountRef.current });
        }

        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imageData = ctx.createImageData(GRID_WIDTH, GRID_HEIGHT);
          renderAutomaton(imageData, stateRef.current, modeRef.current);
          ctx.putImageData(imageData, 0, 0);
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const switchMode = (nextMode: AutomatonMode) => {
    const fresh = createAutomatonState(GRID_WIDTH, GRID_HEIGHT);
    if (nextMode === "wireworld") {
      const loop = WIREWORLD_PRESETS.find((p) => p.id === "loop");
      if (loop) {
        applyPreset(fresh, loop);
      }
      setPresetId("loop");
    } else {
      seedBriansBrainRandom(fresh, randomSeed(), seedDensity);
    }
    stateRef.current = fresh;
    modeRef.current = nextMode;
    stepCountRef.current = 0;
    setMode(nextMode);
    setStats({ steps: 0 });
    setRunning(true);
  };

  const clear = () => {
    clearGrid(stateRef.current);
    stepCountRef.current = 0;
    setStats({ steps: 0 });
  };

  const randomizeBrain = () => {
    seedBriansBrainRandom(stateRef.current, randomSeed(), seedDensity);
    stepCountRef.current = 0;
    setStats({ steps: 0 });
  };

  const applyWireworldPreset = (id: string) => {
    const preset = WIREWORLD_PRESETS.find((p) => p.id === id);
    if (preset) {
      setPresetId(id);
      applyPreset(stateRef.current, preset);
      stepCountRef.current = 0;
      setStats({ steps: 0 });
    }
  };

  const cellFromEvent = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor(((event.clientX - rect.left) / rect.width) * GRID_WIDTH);
    const gy = Math.floor(((event.clientY - rect.top) / rect.height) * GRID_HEIGHT);
    return { gx, gy };
  };

  const paintAt = (event: React.MouseEvent<HTMLCanvasElement>, erase: boolean) => {
    const cell = cellFromEvent(event);
    if (!cell) {
      return;
    }
    let value: number;
    if (modeRef.current === "wireworld") {
      const tool = erase ? "erase" : wireToolRef.current;
      value =
        tool === "conductor"
          ? WIRE_CONDUCTOR
          : tool === "head"
            ? WIRE_HEAD
            : tool === "tail"
              ? WIRE_TAIL
              : WIRE_EMPTY;
    } else {
      const tool = erase ? "erase" : brainToolRef.current;
      value = tool === "on" ? BRAIN_ON : BRAIN_OFF;
    }
    setCell(stateRef.current, cell.gx, cell.gy, value);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    isPaintingRef.current = true;
    paintAt(event, event.button === 2);
  };
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current) {
      return;
    }
    paintAt(event, (event.buttons & 2) === 2);
  };
  const stopPainting = () => {
    isPaintingRef.current = false;
  };

  const resetView = () => {
    switchMode("wireworld");
    setStepsPerFrame(DEFAULT_STEPS_PER_FRAME);
    setWireTool("conductor");
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `wireworld.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar wireworld-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Wireworld / Brian's Brain</h2>
            </div>
            <div className="dragon-sidebar-panel wireworld-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="wireworld-mode">
                    Automaton
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="wireworld-mode"
                      as="select"
                      value={mode}
                      onChange={(e) => switchMode(e.target.value as AutomatonMode)}
                    >
                      <option value="wireworld">Wireworld</option>
                      <option value="briansbrain">Brian's Brain</option>
                    </FormControl>
                  </div>
                </div>

                {mode === "wireworld" ? (
                  <div className="viz-control-row">
                    <FormLabel className="section-label-muted viz-control-row-label" htmlFor="wireworld-preset">
                      Preset
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id="wireworld-preset"
                        as="select"
                        value={presetId}
                        onChange={(e) => applyWireworldPreset(e.target.value)}
                      >
                        {WIREWORLD_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.label}
                          </option>
                        ))}
                      </FormControl>
                    </div>
                  </div>
                ) : null}

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="wireworld-tool">
                    Paint tool
                  </FormLabel>
                  <div className="viz-control-row-control">
                    {mode === "wireworld" ? (
                      <FormControl
                        id="wireworld-tool"
                        as="select"
                        value={wireTool}
                        onChange={(e) => setWireTool(e.target.value as WireworldTool)}
                      >
                        <option value="conductor">Conductor</option>
                        <option value="head">Electron head</option>
                        <option value="tail">Electron tail</option>
                        <option value="erase">Erase</option>
                      </FormControl>
                    ) : (
                      <FormControl
                        id="wireworld-tool"
                        as="select"
                        value={brainTool}
                        onChange={(e) => setBrainTool(e.target.value as BrainTool)}
                      >
                        <option value="on">Firing cell</option>
                        <option value="erase">Erase</option>
                      </FormControl>
                    )}
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="wireworld-speed">
                    Steps per frame
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="wireworld-speed"
                      type="range"
                      min={MIN_STEPS_PER_FRAME}
                      max={MAX_STEPS_PER_FRAME}
                      step={1}
                      value={stepsPerFrame}
                      onChange={(e) => setStepsPerFrame(clampStepsPerFrame(Number(e.target.value)))}
                    />
                    <div className="wireworld-value-readout">{stepsPerFrame}</div>
                  </div>
                </div>

                {mode === "briansbrain" ? (
                  <div className="viz-control-row">
                    <FormLabel className="section-label-muted viz-control-row-label" htmlFor="wireworld-density">
                      Random seed density
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id="wireworld-density"
                        type="range"
                        min={MIN_SEED_DENSITY}
                        max={MAX_SEED_DENSITY}
                        step={0.01}
                        value={seedDensity}
                        onChange={(e) => setSeedDensity(clampSeedDensity(Number(e.target.value)))}
                      />
                      <div className="wireworld-value-readout">{seedDensity.toFixed(2)}</div>
                    </div>
                  </div>
                ) : null}

                <Stack direction="horizontal" gap={2}>
                  <Button variant={running ? "secondary" : "primary"} onClick={() => setRunning((r) => !r)}>
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button variant="outline-light" onClick={clear}>
                    Clear
                  </Button>
                  {mode === "briansbrain" ? (
                    <Button variant="outline-light" onClick={randomizeBrain}>
                      Randomize
                    </Button>
                  ) : null}
                </Stack>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <div className="wireworld-results">
                  <div className="wireworld-result-row">
                    <span className="wireworld-result-label">Steps</span>
                    <span className="wireworld-result-value">{stats.steps}</span>
                  </div>
                </div>

                <p className="wireworld-hint">
                  Wireworld (Brian Silverman, 1987) models electricity on a
                  printed circuit using just four cell states: empty space,
                  conductive wire, and a two-cell-long 'electron' (a bright
                  head immediately followed by a fading tail) that races
                  along wires and only turns a wire into a new head where
                  exactly one or two head-cells sit in its neighborhood —
                  enough asymmetric logic, remarkably, to build working
                  AND/OR/NOT gates and even full computers out of nothing
                  but this rule. Brian's Brain (also Silverman, early
                  1990s) strips cellular automata down further still: a
                  cell fires only if exactly two neighbors were on last
                  step, then spends one tick fading before going dark — a
                  rule too unstable to settle into Conway-style still
                  lifes, so it perpetually spawns gliders and sparks from
                  almost any seed, never quite dying and never quite
                  repeating.
                </p>
                <p className="wireworld-hint">
                  Click or drag on the grid to paint with the selected
                  tool; right-click (or drag with the right button held)
                  always erases.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="wireworld-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="wireworld-canvas"
            role="img"
            aria-label="Wireworld or Brian's Brain cellular automaton grid"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopPainting}
            onMouseLeave={stopPainting}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    </>
  );
}
