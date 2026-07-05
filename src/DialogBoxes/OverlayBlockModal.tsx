import { useMemo } from "react";
import { Button, Modal, Nav, Tab, Table } from "react-bootstrap";
import { RequestConfig } from "../servertsx/common";
import {
  getOverlayBlockDetails,
  OverlayBlockDetails,
  TileInfo,
} from "../servertsx/svg";

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

export default function OverlayBlockModal({
  show,
  onHide,
  requestConfig,
  blockRow,
  blockCol,
}: {
  show: boolean;
  onHide: () => void;
  requestConfig: RequestConfig | null;
  blockRow: number | null;
  blockCol: number | null;
}) {
  const details = useMemo((): OverlayBlockDetails | null => {
    if (
      !show ||
      !requestConfig ||
      blockRow === null ||
      blockCol === null
    ) {
      return null;
    }
    return getOverlayBlockDetails(requestConfig, blockRow, blockCol);
  }, [show, requestConfig, blockRow, blockCol]);

  const tabKey =
    blockRow !== null && blockCol !== null
      ? `${blockRow}-${blockCol}`
      : "closed";

  return (
    <Modal
      className="dragon-modal overlay-block-modal"
      show={show}
      onHide={onHide}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Overlay Square Details</Modal.Title>
      </Modal.Header>
      <Modal.Body className="overlay-block-modal__body">
        {!details && (
          <p className="mb-0">No tile data is available for this overlay square.</p>
        )}

        {details && (
          <Tab.Container defaultActiveKey="overview" key={tabKey}>
            <Nav variant="tabs" className="overlay-block-modal__tabs">
              <Nav.Item>
                <Nav.Link eventKey="overview">Overview</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="tiles">Tiles</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content className="overlay-block-modal__tab-content">
              <Tab.Pane eventKey="overview">
                <p className="mb-2">
                  Overlay square row {details.blockRow + 1}, column {details.blockCol + 1}
                  {" · "}
                  tiles rows {details.startRow}–{details.endRow}, columns{" "}
                  {details.startCol}–{details.endCol}
                </p>

                <Table bordered hover size="sm" className="mb-3">
                  <tbody>
                    <tr>
                      <td>Left turns only</td>
                      <td className="text-end">{details.activeLeftOnly}</td>
                    </tr>
                    <tr>
                      <td>Right turns only</td>
                      <td className="text-end">{details.activeRightOnly}</td>
                    </tr>
                    <tr>
                      <td>Complementary turns</td>
                      <td className="text-end">{details.complementary}</td>
                    </tr>
                    <tr>
                      <td>Inside</td>
                      <td className="text-end">{details.inside}</td>
                    </tr>
                    <tr>
                      <td>Outside</td>
                      <td className="text-end">{details.outside}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Total</strong>
                      </td>
                      <td className="text-end">
                        <strong>{details.total}</strong>
                      </td>
                    </tr>
                  </tbody>
                </Table>

                <div
                  className="overlay-block-preview"
                  style={{
                    width: "100%",
                    maxWidth: "360px",
                    margin: "0 auto",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "var(--color-bg-surface)",
                  }}
                  dangerouslySetInnerHTML={{ __html: details.svg }}
                />
              </Tab.Pane>

              <Tab.Pane eventKey="tiles">
                <Table bordered hover size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Column</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.tiles.map((tile) => (
                      <tr key={`${tile.row}-${tile.col}`}>
                        <td>{tile.row}</td>
                        <td>{tile.col}</td>
                        <td>{tileTypeLabel(tile.info)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onHide}>
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
