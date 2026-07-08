import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  CAInitialCondition,
  clampCARule,
  DEFAULT_CA_RULE,
  FAMOUS_CA_RULES,
  MAX_CA_RULE,
  MIN_CA_RULE,
  renderElementaryCA,
} from "../elementaryCA/elementaryCA";

const CA_COLOR: [number, number, number] = [143, 217, 122];

export default function ElementaryCAApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [rule, setRule] = useState(DEFAULT_CA_RULE);
  const [condition, setCondition] = useState<CAInitialCondition>("single");
  const [seedTick, setSeedTick] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }
    const width = Math.max(1, Math.floor(wrap.clientWidth));
    const height = Math.max(1, Math.floor(wrap.clientHeight));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const imageData = ctx.createImageData(width, height);
    renderElementaryCA(imageData, rule, condition, CA_COLOR);
    ctx.putImageData(imageData, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule, condition, seedTick]);

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

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar elementary-ca-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Elementary Cellular Automata</h2>
            </div>
            <div className="dragon-sidebar-panel elementary-ca-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted" htmlFor="ca-rule">
                    Wolfram rule number
                  </FormLabel>
                  <FormControl
                    id="ca-rule"
                    type="range"
                    min={MIN_CA_RULE}
                    max={MAX_CA_RULE}
                    step={1}
                    value={rule}
                    onChange={(e) => setRule(clampCARule(Number(e.target.value)))}
                  />
                  <div className="elementary-ca-value-readout">Rule {rule}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted">Famous rules</FormLabel>
                  <div className="elementary-ca-rule-buttons">
                    {FAMOUS_CA_RULES.map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={rule === r ? "primary" : "outline-light"}
                        onClick={() => setRule(r)}
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="ca-condition">
                    Starting row
                  </FormLabel>
                  <FormControl
                    id="ca-condition"
                    as="select"
                    value={condition}
                    onChange={(e) =>
                      setCondition(e.target.value as CAInitialCondition)
                    }
                  >
                    <option value="single">Single cell</option>
                    <option value="random">Random noise</option>
                  </FormControl>
                </div>

                {condition === "random" ? (
                  <Button
                    variant="outline-light"
                    onClick={() => setSeedTick((t) => t + 1)}
                  >
                    New random seed
                  </Button>
                ) : null}

                <p className="elementary-ca-hint">
                  Each row is generated from the one above it: every cell
                  looks at itself and its two neighbors (8 possible 3-cell
                  patterns) and applies the rule&apos;s fixed lookup table,
                  encoded as an 8-bit number from 0–255.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="elementary-ca-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="elementary-ca-canvas"
            role="img"
            aria-label={`Elementary cellular automaton, rule ${rule}`}
          />
        </div>
      </div>
    </>
  );
}
