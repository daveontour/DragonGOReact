import { useMemo, useState } from "react";
import { FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  calculatePiBounds,
  clampNGonSides,
  circumscribedExtentRadius,
  circumscribedNGonVertices,
  DEFAULT_N_GON_SIDES,
  formatPi,
  inscribedNGonVertices,
  MAX_N_GON_SIDES,
  MIN_N_GON_SIDES,
  piBracketWidth,
  polygonPath,
} from "./piNGonMath";

const UNIT_RADIUS = 1;
const VIEW_PADDING = 0.1;

export default function PiNGonApp({ onHome }: { onHome: () => void }) {
  const [sides, setSides] = useState(DEFAULT_N_GON_SIDES);

  const n = clampNGonSides(sides);
  const bounds = useMemo(() => calculatePiBounds(n), [n]);
  const bracketWidth = useMemo(() => piBracketWidth(bounds), [bounds]);

  const viewExtent = useMemo(
    () => circumscribedExtentRadius(UNIT_RADIUS, n) * (1 + VIEW_PADDING),
    [n]
  );
  const viewSize = viewExtent * 2;
  const center = viewExtent;

  const inscribedVertices = useMemo(
    () => inscribedNGonVertices(n, center, center, UNIT_RADIUS),
    [n, center]
  );
  const circumscribedVertices = useMemo(
    () => circumscribedNGonVertices(n, center, center, UNIT_RADIUS),
    [n, center]
  );
  const inscribedPath = useMemo(
    () => polygonPath(inscribedVertices),
    [inscribedVertices]
  );
  const circumscribedPath = useMemo(
    () => polygonPath(circumscribedVertices),
    [circumscribedVertices]
  );

  const handleSidesChange = (raw: string) => {
    const parsed = Number(raw);
    if (raw === "") {
      return;
    }
    setSides(clampNGonSides(parsed));
  };

  const showVertices = n <= 120;

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar pi-ngon-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Pi by n-gon</h2>
            </div>
            <div className="dragon-sidebar-panel pi-ngon-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted" htmlFor="pi-ngon-n">
                    Number of sides (N)
                  </FormLabel>
                  <FormControl
                    id="pi-ngon-n"
                    type="number"
                    min={MIN_N_GON_SIDES}
                    max={MAX_N_GON_SIDES}
                    step={1}
                    value={n}
                    onChange={(e) => handleSidesChange(e.target.value)}
                  />
                  <FormControl
                    className="mt-2"
                    type="range"
                    min={MIN_N_GON_SIDES}
                    max={Math.min(MAX_N_GON_SIDES, 200)}
                    step={1}
                    value={Math.min(n, 200)}
                    onChange={(e) =>
                      setSides(clampNGonSides(Number(e.target.value)))
                    }
                  />
                  <p className="pi-ngon-hint">
                    Compare inscribed and circumscribed regular {n}-gons on a
                    unit circle. π lies between their perimeters ÷ 2.
                  </p>
                </div>

                <div className="pi-ngon-results">
                  <div className="pi-ngon-result-row">
                    <span className="pi-ngon-result-label pi-ngon-result-label--lower">
                      Lower bound (inscribed)
                    </span>
                    <span className="pi-ngon-result-value pi-ngon-result-value--lower">
                      {formatPi(bounds.lower)}
                    </span>
                  </div>
                  <div className="pi-ngon-result-row">
                    <span className="pi-ngon-result-label pi-ngon-result-label--upper">
                      Upper bound (circumscribed)
                    </span>
                    <span className="pi-ngon-result-value pi-ngon-result-value--upper">
                      {formatPi(bounds.upper)}
                    </span>
                  </div>
                  <div className="pi-ngon-result-row">
                    <span className="pi-ngon-result-label">Actual π</span>
                    <span className="pi-ngon-result-value">
                      {formatPi(Math.PI)}
                    </span>
                  </div>
                  <div className="pi-ngon-result-row">
                    <span className="pi-ngon-result-label">Bracket width</span>
                    <span className="pi-ngon-result-value">
                      {bracketWidth.toExponential(3)}
                    </span>
                  </div>
                </div>

                <p className="pi-ngon-formula">
                  Lower: N·sin(π/N) = {n}·sin(π/{n})
                  <br />
                  Upper: N·tan(π/N) = {n}·tan(π/{n})
                </p>

                <div className="pi-ngon-legend" aria-hidden="true">
                  <span className="pi-ngon-legend-item pi-ngon-legend-item--lower">
                    Inscribed
                  </span>
                  <span className="pi-ngon-legend-item pi-ngon-legend-item--upper">
                    Circumscribed
                  </span>
                </div>
              </Stack>
            </div>
          </div>
        </div>

        <div className="pi-ngon-canvas-wrap">
          <svg
            className="pi-ngon-svg"
            viewBox={`0 0 ${viewSize} ${viewSize}`}
            role="img"
            aria-label={`Inscribed and circumscribed ${n}-gons on a unit circle`}
          >
            <path
              className="pi-ngon-polygon pi-ngon-polygon--circumscribed"
              d={circumscribedPath}
            />
            <circle
              className="pi-ngon-circle"
              cx={center}
              cy={center}
              r={UNIT_RADIUS}
            />
            <path
              className="pi-ngon-polygon pi-ngon-polygon--inscribed"
              d={inscribedPath}
            />
            {showVertices
              ? circumscribedVertices.map((vertex, index) => (
                  <circle
                    key={`outer-${index}`}
                    className="pi-ngon-vertex pi-ngon-vertex--upper"
                    cx={vertex.x}
                    cy={vertex.y}
                    r={0.025}
                  />
                ))
              : null}
            {showVertices
              ? inscribedVertices.map((vertex, index) => (
                  <circle
                    key={`inner-${index}`}
                    className="pi-ngon-vertex pi-ngon-vertex--lower"
                    cx={vertex.x}
                    cy={vertex.y}
                    r={0.025}
                  />
                ))
              : null}
            <circle
              className="pi-ngon-center-point"
              cx={center}
              cy={center}
              r={0.03}
            />
          </svg>
        </div>
      </div>
    </>
  );
}
