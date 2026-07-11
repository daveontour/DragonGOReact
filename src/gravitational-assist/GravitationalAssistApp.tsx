import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampApproachSpeed,
  clampEncounterAngle,
  clampImpactParameter,
  clampPlanetSpeed,
  clampTimescale,
  computeGravitationalAssistStats,
  createGravitationalAssistEncounter,
  DEFAULT_APPROACH_SPEED,
  DEFAULT_ENCOUNTER_ANGLE,
  DEFAULT_IMPACT_PARAMETER,
  DEFAULT_PLANET_SPEED,
  DEFAULT_TIMESCALE,
  drawGravitationalAssist,
  GravitationalAssistStats,
  hyperbolicTurnAngleRad,
  MAX_APPROACH_SPEED,
  MAX_ENCOUNTER_ANGLE,
  MAX_IMPACT_PARAMETER,
  MAX_PLANET_SPEED,
  MAX_TIMESCALE,
  MIN_APPROACH_SPEED,
  MIN_ENCOUNTER_ANGLE,
  MIN_IMPACT_PARAMETER,
  MIN_PLANET_SPEED,
  MIN_TIMESCALE,
  PLANET_MASS,
  stepGravitationalAssist,
  TRAIL_LENGTH,
  TrailPoint,
} from "./gravitationalAssist";

const BASE_TIME_STEP = 1 / 60;

export default function GravitationalAssistApp({
  onHome,
}: {
  onHome: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef = useRef(
    createGravitationalAssistEncounter({
      encounterAngleDeg: DEFAULT_ENCOUNTER_ANGLE,
      approachSpeed: DEFAULT_APPROACH_SPEED,
      planetSpeed: DEFAULT_PLANET_SPEED,
      impactParameter: DEFAULT_IMPACT_PARAMETER,
    })
  );
  const trailRef = useRef<TrailPoint[]>([]);
  const timescaleRef = useRef(DEFAULT_TIMESCALE);
  const runningRef = useRef(true);

  const [encounterAngleDeg, setEncounterAngleDeg] = useState(
    DEFAULT_ENCOUNTER_ANGLE
  );
  const [approachSpeed, setApproachSpeed] = useState(DEFAULT_APPROACH_SPEED);
  const [planetSpeed, setPlanetSpeed] = useState(DEFAULT_PLANET_SPEED);
  const [impactParameter, setImpactParameter] = useState(
    DEFAULT_IMPACT_PARAMETER
  );
  const [timescale, setTimescale] = useState(DEFAULT_TIMESCALE);
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState<GravitationalAssistStats>(() =>
    computeGravitationalAssistStats(simRef.current)
  );

  useEffect(() => {
    timescaleRef.current = timescale;
  }, [timescale]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const resetEncounter = useCallback(() => {
    simRef.current = createGravitationalAssistEncounter({
      encounterAngleDeg,
      approachSpeed,
      planetSpeed,
      impactParameter,
    });
    trailRef.current = [];
    setStats(computeGravitationalAssistStats(simRef.current));
    setRunning(true);
  }, [approachSpeed, encounterAngleDeg, impactParameter, planetSpeed]);

  useEffect(() => {
    resetEncounter();
  }, [resetEncounter]);

  useEffect(() => {
    let frameId = 0;

    const loop = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) {
        frameId = requestAnimationFrame(loop);
        return;
      }

      const width = Math.max(1, wrap.clientWidth);
      const height = Math.max(1, wrap.clientHeight);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      if (runningRef.current) {
        stepGravitationalAssist(
          simRef.current,
          BASE_TIME_STEP * timescaleRef.current
        );
        const { spacecraft } = simRef.current;
        trailRef.current.push({ x: spacecraft.x, y: spacecraft.y });
        if (trailRef.current.length > TRAIL_LENGTH) {
          trailRef.current.shift();
        }
        setStats(computeGravitationalAssistStats(simRef.current));
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawGravitationalAssist(
          ctx,
          width,
          height,
          simRef.current,
          trailRef.current
        );
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const predictedTurnDeg =
    (hyperbolicTurnAngleRad(impactParameter, approachSpeed, PLANET_MASS) *
      180) /
    Math.PI;

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, "gravitational-assist.png");
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar gravassist-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Gravitational Assist</h2>
            </div>
            <div className="dragon-sidebar-panel gravassist-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="gravassist-angle"
                  >
                    Encounter angle
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="gravassist-angle"
                      type="range"
                      min={MIN_ENCOUNTER_ANGLE}
                      max={MAX_ENCOUNTER_ANGLE}
                      step={1}
                      value={encounterAngleDeg}
                      onChange={(e) =>
                        setEncounterAngleDeg(
                          clampEncounterAngle(Number(e.target.value))
                        )
                      }
                    />
                    <div className="gravassist-value-readout">
                      {encounterAngleDeg}°
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="gravassist-approach"
                  >
                    Approach speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="gravassist-approach"
                      type="range"
                      min={MIN_APPROACH_SPEED}
                      max={MAX_APPROACH_SPEED}
                      step={1}
                      value={approachSpeed}
                      onChange={(e) =>
                        setApproachSpeed(
                          clampApproachSpeed(Number(e.target.value))
                        )
                      }
                    />
                    <div className="gravassist-value-readout">
                      {approachSpeed}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="gravassist-planet-speed"
                  >
                    Planet speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="gravassist-planet-speed"
                      type="range"
                      min={MIN_PLANET_SPEED}
                      max={MAX_PLANET_SPEED}
                      step={1}
                      value={planetSpeed}
                      onChange={(e) =>
                        setPlanetSpeed(clampPlanetSpeed(Number(e.target.value)))
                      }
                    />
                    <div className="gravassist-value-readout">
                      {planetSpeed}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="gravassist-impact"
                  >
                    Impact parameter
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="gravassist-impact"
                      type="range"
                      min={MIN_IMPACT_PARAMETER}
                      max={MAX_IMPACT_PARAMETER}
                      step={1}
                      value={impactParameter}
                      onChange={(e) =>
                        setImpactParameter(
                          clampImpactParameter(Number(e.target.value))
                        )
                      }
                    />
                    <div className="gravassist-value-readout">
                      {impactParameter}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="gravassist-timescale"
                  >
                    Time scale
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="gravassist-timescale"
                      type="range"
                      min={MIN_TIMESCALE}
                      max={MAX_TIMESCALE}
                      step={0.1}
                      value={timescale}
                      onChange={(e) =>
                        setTimescale(clampTimescale(Number(e.target.value)))
                      }
                    />
                    <div className="gravassist-value-readout">
                      {timescale.toFixed(1)}×
                    </div>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button
                    variant={running ? "secondary" : "primary"}
                    onClick={() => setRunning((value) => !value)}
                  >
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button variant="outline-light" onClick={resetEncounter}>
                    Reset flyby
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <div className="gravassist-results">
                  <div className="gravassist-result-row">
                    <span className="gravassist-result-label">
                      Predicted turn (planet frame)
                    </span>
                    <span className="gravassist-result-value">
                      {predictedTurnDeg.toFixed(1)}°
                    </span>
                  </div>
                  <div className="gravassist-result-row">
                    <span className="gravassist-result-label">
                      Spacecraft speed
                    </span>
                    <span className="gravassist-result-value">
                      {stats.spacecraftSpeed.toFixed(1)}
                    </span>
                  </div>
                  <div className="gravassist-result-row">
                    <span className="gravassist-result-label">Δ speed</span>
                    <span className="gravassist-result-value">
                      {stats.speedChange >= 0 ? "+" : ""}
                      {stats.speedChange.toFixed(1)}
                    </span>
                  </div>
                  <div className="gravassist-result-row">
                    <span className="gravassist-result-label">
                      Closest approach
                    </span>
                    <span className="gravassist-result-value">
                      {stats.closestApproach.toFixed(1)}
                    </span>
                  </div>
                  <div className="gravassist-result-row">
                    <span className="gravassist-result-label">Status</span>
                    <span className="gravassist-result-value">
                      {stats.finished ? "departed" : "in flight"}
                    </span>
                  </div>
                </div>

                <p className="gravassist-hint">
                  A spacecraft swings past a moving planet on a hyperbolic arc.
                  The encounter angle is measured from the planet&apos;s velocity
                  arrow: prograde angles steal momentum from the planet and
                  speed the craft up, while retrograde angles slow it down.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="gravassist-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="gravassist-canvas"
            role="img"
            aria-label="Gravitational assist flyby simulation"
          />
        </div>
      </div>
    </>
  );
}
