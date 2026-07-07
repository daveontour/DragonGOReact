import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  boardToSequence,
  CellPos,
  generateRandomKnightsTour,
  KNIGHTS_TOUR_BOARD_SIZE,
  TourType,
} from "../knightsTour/knightsTourAlgorithm";

const ANIMATION_MS = 150;

type StatusTone = "ready" | "calculating" | "playing" | "success" | "warning" | "error";

interface PathLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  closed?: boolean;
}

function cellCenterPercent(pos: CellPos): { x: number; y: number } {
  const cellSize = 100 / KNIGHTS_TOUR_BOARD_SIZE;
  return {
    x: (pos.c + 0.5) * cellSize,
    y: (pos.r + 0.5) * cellSize,
  };
}

export default function KnightsTourApp({ onHome }: { onHome: () => void }) {
  const [startRow, setStartRow] = useState(0);
  const [startCol, setStartCol] = useState(0);
  const [tourType, setTourType] = useState<TourType>("open");
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [tourSequence, setTourSequence] = useState<CellPos[]>([]);
  const [pathLines, setPathLines] = useState<PathLine[]>([]);
  const [statusTone, setStatusTone] = useState<StatusTone>("ready");
  const [statusText, setStatusText] = useState(
    "Ready. Select a square and generate!"
  );
  const [knightPos, setKnightPos] = useState<CellPos>({ r: 0, c: 0 });
  const [showKnight, setShowKnight] = useState(true);

  const animationRef = useRef<number | null>(null);
  const tourTypeRef = useRef(tourType);
  tourTypeRef.current = tourType;

  const clearAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      window.clearInterval(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearAnimation();
  }, [clearAnimation]);

  const resetVisuals = useCallback(() => {
    setPathLines([]);
    setTourSequence([]);
    setAnimationStep(0);
  }, []);

  const selectStartSquare = useCallback(
    (r: number, c: number) => {
      if (isPlaying) {
        return;
      }
      setStartRow(r);
      setStartCol(c);
      setKnightPos({ r, c });
      setShowKnight(true);
      resetVisuals();
      setStatusTone("ready");
      setStatusText("Ready. Select a square and generate!");
    },
    [isPlaying, resetVisuals]
  );

  const stopAnimation = useCallback(
    (message?: string) => {
      clearAnimation();
      setIsPlaying(false);
      if (message) {
        setStatusTone("warning");
        setStatusText(message);
      }
    },
    [clearAnimation]
  );

  const beginAnimation = useCallback((sequence: CellPos[]) => {
    setTourSequence(sequence);
    setIsPlaying(true);
    setAnimationStep(0);
    setPathLines([]);
    setKnightPos(sequence[0]);
    setShowKnight(true);

    animationRef.current = window.setInterval(() => {
      setAnimationStep((prev) => {
        const next = prev + 1;
        if (next >= KNIGHTS_TOUR_BOARD_SIZE * KNIGHTS_TOUR_BOARD_SIZE) {
          clearAnimation();
          setIsPlaying(false);
          setStatusTone("success");
          setStatusText("Tour complete!");

          if (tourTypeRef.current === "closed") {
            const from = cellCenterPercent(sequence[63]);
            const to = cellCenterPercent(sequence[0]);
            setPathLines((lines) => [
              ...lines,
              {
                x1: from.x,
                y1: from.y,
                x2: to.x,
                y2: to.y,
                closed: true,
              },
            ]);
          }
          return prev;
        }

        const curr = sequence[next];
        const prevPos = sequence[next - 1];
        const from = cellCenterPercent(prevPos);
        const to = cellCenterPercent(curr);

        setKnightPos(curr);
        setPathLines((lines) => [
          ...lines,
          { x1: from.x, y1: from.y, x2: to.x, y2: to.y },
        ]);

        return next;
      });
    }, ANIMATION_MS);
  }, [clearAnimation]);

  const handleGenerate = () => {
    if (isPlaying) {
      return;
    }

    resetVisuals();
    setStatusTone("calculating");
    setStatusText("Calculating tour...");

    window.setTimeout(() => {
      const startTime = performance.now();
      const result = generateRandomKnightsTour(
        startRow,
        startCol,
        tourType === "closed"
      );
      const elapsed = performance.now() - startTime;

      if (result.board) {
        const sequence = boardToSequence(result.board);
        setStatusTone("playing");
        setStatusText(
          `Tour found in ${result.operations.toLocaleString()} ops (${elapsed.toFixed(1)}ms). Playing...`
        );
        beginAnimation(sequence);
        return;
      }

      if (result.operations > 1_000_000) {
        setStatusTone("error");
        setStatusText(
          "Hit operation limit. Random path got stuck. Try again!"
        );
        return;
      }

      setStatusTone("error");
      setStatusText("No valid path found from this square.");
    }, 50);
  };

  const visitedSteps = new Map<string, number>();
  for (let i = 0; i <= animationStep && i < tourSequence.length; i++) {
    const pos = tourSequence[i];
    if (pos) {
      visitedSteps.set(`${pos.r}-${pos.c}`, i + 1);
    }
  }

  const isStartSquare = (r: number, c: number) =>
    r === startRow && c === startCol && !isPlaying && animationStep === 0;

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar knights-tour-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Knight&apos;s Tour</h2>
            </div>
            <div className="dragon-sidebar-panel knights-tour-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted">
                    Starting square (click board to change)
                  </FormLabel>
                  <div className="knights-tour-coords">
                    Row: <strong>{startRow}</strong>, Col:{" "}
                    <strong>{startCol}</strong>
                  </div>
                </div>

                <div>
                  <FormLabel className="section-label-muted">Tour type</FormLabel>
                  <FormControl
                    as="select"
                    value={tourType}
                    disabled={isPlaying}
                    onChange={(e) =>
                      setTourType(e.target.value as TourType)
                    }
                  >
                    <option value="open">Open tour</option>
                    <option value="closed">Closed tour</option>
                  </FormControl>
                </div>

                <Button
                  variant="primary"
                  disabled={isPlaying}
                  onClick={handleGenerate}
                >
                  Generate &amp; play
                </Button>

                {isPlaying ? (
                  <Button
                    variant="secondary"
                    onClick={() => stopAnimation("Animation stopped.")}
                  >
                    Stop animation
                  </Button>
                ) : null}

                <p
                  className={`knights-tour-status knights-tour-status--${statusTone}`}
                  role="status"
                >
                  {statusText}
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="knights-tour-canvas-wrap">
          <div className="knights-tour-board-frame">
            <div className="knights-tour-board" role="grid" aria-label="Chess board">
              {Array.from({ length: KNIGHTS_TOUR_BOARD_SIZE * KNIGHTS_TOUR_BOARD_SIZE }, (_, index) => {
                const r = Math.floor(index / KNIGHTS_TOUR_BOARD_SIZE);
                const c = index % KNIGHTS_TOUR_BOARD_SIZE;
                const key = `${r}-${c}`;
                const isLight = (r + c) % 2 === 0;
                const stepNumber = visitedSteps.get(key);
                const isStart = isStartSquare(r, c);

                return (
                  <button
                    key={key}
                    type="button"
                    className={[
                      "knights-tour-square",
                      isLight
                        ? "knights-tour-square--light"
                        : "knights-tour-square--dark",
                      stepNumber ? "knights-tour-square--visited" : "",
                      isStart ? "knights-tour-square--start" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => selectStartSquare(r, c)}
                    disabled={isPlaying}
                    aria-label={`Square row ${r}, column ${c}`}
                  >
                    {stepNumber ? stepNumber : null}
                  </button>
                );
              })}
            </div>

            <svg
              className="knights-tour-path"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {pathLines.map((line, index) => (
                <line
                  key={index}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  className={
                    line.closed
                      ? "knights-tour-path-line knights-tour-path-line--closed"
                      : "knights-tour-path-line"
                  }
                />
              ))}
            </svg>

            {showKnight ? (
              <div
                className="knights-tour-knight"
                style={{
                  top: `${knightPos.r * (100 / KNIGHTS_TOUR_BOARD_SIZE)}%`,
                  left: `${knightPos.c * (100 / KNIGHTS_TOUR_BOARD_SIZE)}%`,
                  width: `${100 / KNIGHTS_TOUR_BOARD_SIZE}%`,
                  height: `${100 / KNIGHTS_TOUR_BOARD_SIZE}%`,
                }}
                aria-hidden="true"
              >
                <span className="knights-tour-knight-piece">♞</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
