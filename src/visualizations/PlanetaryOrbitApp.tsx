import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampEccentricity,
  clampOrbitRadius,
  clampSpacecraftOrbit,
  clampTimescale,
  createOrbitSimulation,
  DEFAULT_PLANET1_ECCENTRICITY,
  DEFAULT_PLANET1_RADIUS,
  DEFAULT_PLANET2_ECCENTRICITY,
  DEFAULT_PLANET2_RADIUS,
  DEFAULT_SPACECRAFT_ORBIT,
  DEFAULT_TIMESCALE,
  drawOrbitSimulation,
  MAX_ECCENTRICITY,
  MAX_ORBIT_RADIUS,
  MAX_SPACECRAFT_ORBIT,
  MAX_TIMESCALE,
  MIN_ECCENTRICITY,
  MIN_ORBIT_RADIUS,
  MIN_SPACECRAFT_ORBIT,
  MIN_TIMESCALE,
  OrbitParams,
  OrbitSimulation,
  OrbitTrailPoint,
  spacecraftAltitude,
  spacecraftSpeed,
  stepOrbitSimulation,
  ThrustMode,
} from "../orbits/orbitSimulation";

const BASE_TIME_STEP = 1 / 60;
const TRAIL_LENGTH = 500;

export default function PlanetaryOrbitApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<OrbitSimulation>(
    createOrbitSimulation({
      planet1: {
        semiMajorAxis: DEFAULT_PLANET1_RADIUS,
        eccentricity: DEFAULT_PLANET1_ECCENTRICITY,
      },
      planet2: {
        semiMajorAxis: DEFAULT_PLANET2_RADIUS,
        eccentricity: DEFAULT_PLANET2_ECCENTRICITY,
      },
      spacecraftOrbitRadius: DEFAULT_SPACECRAFT_ORBIT,
    })
  );
  const thrustRef = useRef<ThrustMode>("none");
  const timescaleRef = useRef(DEFAULT_TIMESCALE);
  const planet1TrailRef = useRef<OrbitTrailPoint[]>([]);
  const planet2TrailRef = useRef<OrbitTrailPoint[]>([]);
  const spacecraftTrailRef = useRef<OrbitTrailPoint[]>([]);

  const [planet1Radius, setPlanet1Radius] = useState(DEFAULT_PLANET1_RADIUS);
  const [planet1Eccentricity, setPlanet1Eccentricity] = useState(
    DEFAULT_PLANET1_ECCENTRICITY
  );
  const [planet2Radius, setPlanet2Radius] = useState(DEFAULT_PLANET2_RADIUS);
  const [planet2Eccentricity, setPlanet2Eccentricity] = useState(
    DEFAULT_PLANET2_ECCENTRICITY
  );
  const [spacecraftOrbitRadius, setSpacecraftOrbitRadius] = useState(
    DEFAULT_SPACECRAFT_ORBIT
  );
  const [timescale, setTimescale] = useState(DEFAULT_TIMESCALE);
  const [stats, setStats] = useState({
    altitude: DEFAULT_SPACECRAFT_ORBIT,
    speed: 0,
    time: 0,
  });

  useEffect(() => {
    timescaleRef.current = timescale;
  }, [timescale]);

  const resetSimulation = useCallback((params: OrbitParams) => {
    simRef.current = createOrbitSimulation(params);
    planet1TrailRef.current = [];
    planet2TrailRef.current = [];
    spacecraftTrailRef.current = [];
    setStats({
      altitude: params.spacecraftOrbitRadius,
      speed: spacecraftSpeed(simRef.current),
      time: 0,
    });
  }, []);

  useEffect(() => {
    resetSimulation({
      planet1: {
        semiMajorAxis: planet1Radius,
        eccentricity: planet1Eccentricity,
      },
      planet2: {
        semiMajorAxis: planet2Radius,
        eccentricity: planet2Eccentricity,
      },
      spacecraftOrbitRadius,
    });
  }, [
    planet1Eccentricity,
    planet1Radius,
    planet2Eccentricity,
    planet2Radius,
    resetSimulation,
    spacecraftOrbitRadius,
  ]);

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

      stepOrbitSimulation(
        simRef.current,
        BASE_TIME_STEP * timescaleRef.current,
        thrustRef.current
      );

      for (const [bodyId, trailRef] of [
        ["planet1", planet1TrailRef],
        ["planet2", planet2TrailRef],
        ["spacecraft", spacecraftTrailRef],
      ] as const) {
        const body = simRef.current.bodies.find((entry) => entry.id === bodyId);
        if (body) {
          trailRef.current.push({ x: body.x, y: body.y });
          if (trailRef.current.length > TRAIL_LENGTH) {
            trailRef.current.shift();
          }
        }
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawOrbitSimulation(
          ctx,
          width,
          height,
          simRef.current,
          planet1TrailRef.current,
          planet2TrailRef.current,
          spacecraftTrailRef.current
        );
      }

      setStats({
        altitude: spacecraftAltitude(simRef.current),
        speed: spacecraftSpeed(simRef.current),
        time: simRef.current.time,
      });

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const setThrust = (mode: ThrustMode) => {
    thrustRef.current = mode;
  };

  const clearThrust = () => {
    thrustRef.current = "none";
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar orbits-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Planetary Orbits</h2>
            </div>
            <div className="dragon-sidebar-panel orbits-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label orbits-planet-label orbits-planet-label--1">
                    Blue planet
                  </FormLabel>
                  <FormLabel className="section-label-muted" htmlFor="planet1-radius">
                    Orbit radius
                  </FormLabel>
                  <FormControl
                    id="planet1-radius"
                    type="range"
                    min={MIN_ORBIT_RADIUS}
                    max={MAX_ORBIT_RADIUS}
                    step={1}
                    value={planet1Radius}
                    onChange={(e) =>
                      setPlanet1Radius(clampOrbitRadius(Number(e.target.value)))
                    }
                  />
                  <div className="orbits-value-readout">{planet1Radius}</div>
                  <FormLabel
                    className="section-label-muted mt-2"
                    htmlFor="planet1-eccentricity"
                  >
                    Eccentricity
                  </FormLabel>
                  <FormControl
                    id="planet1-eccentricity"
                    type="range"
                    min={MIN_ECCENTRICITY}
                    max={MAX_ECCENTRICITY}
                    step={0.01}
                    value={planet1Eccentricity}
                    onChange={(e) =>
                      setPlanet1Eccentricity(
                        clampEccentricity(Number(e.target.value))
                      )
                    }
                  />
                  <div className="orbits-value-readout">
                    {planet1Eccentricity.toFixed(2)}
                  </div>
                </div>

                <div>
                  <FormLabel className="section-label orbits-planet-label orbits-planet-label--2">
                    Green planet
                  </FormLabel>
                  <FormLabel className="section-label-muted" htmlFor="planet2-radius">
                    Orbit radius
                  </FormLabel>
                  <FormControl
                    id="planet2-radius"
                    type="range"
                    min={MIN_ORBIT_RADIUS}
                    max={MAX_ORBIT_RADIUS}
                    step={1}
                    value={planet2Radius}
                    onChange={(e) =>
                      setPlanet2Radius(clampOrbitRadius(Number(e.target.value)))
                    }
                  />
                  <div className="orbits-value-readout">{planet2Radius}</div>
                  <FormLabel
                    className="section-label-muted mt-2"
                    htmlFor="planet2-eccentricity"
                  >
                    Eccentricity
                  </FormLabel>
                  <FormControl
                    id="planet2-eccentricity"
                    type="range"
                    min={MIN_ECCENTRICITY}
                    max={MAX_ECCENTRICITY}
                    step={0.01}
                    value={planet2Eccentricity}
                    onChange={(e) =>
                      setPlanet2Eccentricity(
                        clampEccentricity(Number(e.target.value))
                      )
                    }
                  />
                  <div className="orbits-value-readout">
                    {planet2Eccentricity.toFixed(2)}
                  </div>
                </div>

                <div>
                  <FormLabel
                    className="section-label-muted"
                    htmlFor="spacecraft-orbit-radius"
                  >
                    Spacecraft orbit radius
                  </FormLabel>
                  <FormControl
                    id="spacecraft-orbit-radius"
                    type="range"
                    min={MIN_SPACECRAFT_ORBIT}
                    max={MAX_SPACECRAFT_ORBIT}
                    step={1}
                    value={spacecraftOrbitRadius}
                    onChange={(e) =>
                      setSpacecraftOrbitRadius(
                        clampSpacecraftOrbit(Number(e.target.value))
                      )
                    }
                  />
                  <div className="orbits-value-readout">{spacecraftOrbitRadius}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="orbit-timescale">
                    Time scale
                  </FormLabel>
                  <FormControl
                    id="orbit-timescale"
                    type="range"
                    min={MIN_TIMESCALE}
                    max={MAX_TIMESCALE}
                    step={0.1}
                    value={timescale}
                    onChange={(e) =>
                      setTimescale(clampTimescale(Number(e.target.value)))
                    }
                  />
                  <div className="orbits-value-readout">{timescale.toFixed(1)}×</div>
                </div>

                <div className="orbits-results">
                  <div className="orbits-result-row">
                    <span className="orbits-result-label">Spacecraft altitude</span>
                    <span className="orbits-result-value">
                      {stats.altitude.toFixed(1)}
                    </span>
                  </div>
                  <div className="orbits-result-row">
                    <span className="orbits-result-label">Spacecraft speed</span>
                    <span className="orbits-result-value">
                      {stats.speed.toFixed(2)}
                    </span>
                  </div>
                  <div className="orbits-result-row">
                    <span className="orbits-result-label">Elapsed time</span>
                    <span className="orbits-result-value">
                      {stats.time.toFixed(1)} s
                    </span>
                  </div>
                </div>

                <div>
                  <FormLabel className="section-label-muted">Engine thrust</FormLabel>
                  <Stack direction="horizontal" gap={2}>
                    <Button
                      variant="primary"
                      className="orbits-thrust-button"
                      onMouseDown={() => setThrust("prograde")}
                      onMouseUp={clearThrust}
                      onMouseLeave={clearThrust}
                      onTouchStart={() => setThrust("prograde")}
                      onTouchEnd={clearThrust}
                    >
                      Prograde
                    </Button>
                    <Button
                      variant="secondary"
                      className="orbits-thrust-button"
                      onMouseDown={() => setThrust("retrograde")}
                      onMouseUp={clearThrust}
                      onMouseLeave={clearThrust}
                      onTouchStart={() => setThrust("retrograde")}
                      onTouchEnd={clearThrust}
                    >
                      Retrograde
                    </Button>
                  </Stack>
                  <p className="orbits-hint">
                    Hold a thrust button to fire along (prograde) or against
                    (retrograde) the spacecraft&apos;s current velocity. Fuel is
                    unlimited.
                  </p>
                </div>

                <p className="orbits-hint">
                  Each planet has its own ellipse around the sun. The yellow
                  spacecraft starts in orbit around the blue planet. Dashed rings
                  show each reference orbit.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="orbits-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="orbits-canvas"
            role="img"
            aria-label="Two planets orbiting a sun with a spacecraft orbiting one planet"
          />
        </div>
      </div>
    </>
  );
}
