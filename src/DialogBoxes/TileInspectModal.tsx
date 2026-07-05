import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Col,
  Container,
  FormControl,
  FormLabel,
  Modal,
  Row,
} from "react-bootstrap";
import { RequestConfig } from "../servertsx/common";
import { getTileGridSize, getTileSVG, TileInfo } from "../servertsx/svg";

function tileTypeLabel(info: TileInfo): string {
  if (info.type === "inside") {
    return "Inside";
  }
  if (info.type === "outside") {
    return "Outside";
  }
  if (info.complementary) {
    return "Active (complementary turns)";
  }
  if (info.turn === "left") {
    return "Active (left turn only)";
  }
  if (info.turn === "right") {
    return "Active (right turn only)";
  }
  return "Active";
}

export default function TileInspectModal({
  show,
  onHide,
  requestConfig,
}: {
  show: boolean;
  onHide: () => void;
  requestConfig: RequestConfig | null;
}) {
  const [rowInput, setRowInput] = useState("1");
  const [colInput, setColInput] = useState("1");

  const gridSize = useMemo(() => {
    if (!requestConfig) {
      return null;
    }
    return getTileGridSize(requestConfig);
  }, [requestConfig]);

  useEffect(() => {
    if (show) {
      setRowInput("1");
      setColInput("1");
    }
  }, [show]);

  const row = Number(rowInput);
  const col = Number(colInput);
  const rowValid =
    gridSize !== null &&
    Number.isInteger(row) &&
    row >= 1 &&
    row <= gridSize.rows;
  const colValid =
    gridSize !== null &&
    Number.isInteger(col) &&
    col >= 1 &&
    col <= gridSize.cols;
  const valid = rowValid && colValid && requestConfig !== null;

  const tile = useMemo(() => {
    if (!valid || !requestConfig) {
      return null;
    }
    return getTileSVG(requestConfig, row, col);
  }, [valid, requestConfig, row, col]);

  return (
    <Modal className="dragon-modal" show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Inspect Tile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row className="mb-3 align-items-center">
            <Col xs={3}>
              <FormLabel className="mb-0">Row</FormLabel>
            </Col>
            <Col xs={3}>
              <FormControl
                type="number"
                min={1}
                max={gridSize?.rows ?? 1}
                step={1}
                value={rowInput}
                onChange={(e) => setRowInput(e.target.value)}
              />
            </Col>
            <Col xs={3}>
              <FormLabel className="mb-0">Column</FormLabel>
            </Col>
            <Col xs={3}>
              <FormControl
                type="number"
                min={1}
                max={gridSize?.cols ?? 1}
                step={1}
                value={colInput}
                onChange={(e) => setColInput(e.target.value)}
              />
            </Col>
          </Row>

          {gridSize && (
            <p className="text-muted small mb-3">
              Valid range: rows 1–{gridSize.rows}, columns 1–{gridSize.cols}
            </p>
          )}

          {!valid && (
            <p className="mb-0">Enter a valid row and column to view the tile.</p>
          )}

          {valid && tile && (
            <>
              <p className="mb-2">
                <strong>Type:</strong> {tileTypeLabel(tile.info)}
              </p>
              <div
                className="tile-inspect-preview"
                style={{
                  width: "100%",
                  maxWidth: "280px",
                  aspectRatio: "1",
                  margin: "0 auto",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "var(--color-bg-surface)",
                }}
                dangerouslySetInnerHTML={{ __html: tile.svg }}
              />
            </>
          )}
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onHide}>
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
