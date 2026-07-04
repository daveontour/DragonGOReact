import { Button, Modal, Table } from "react-bootstrap";
import { RequestConfig, TileStats } from "../servertsx/common";
import { getPlansSVG } from "../servertsx/svg";
import { downloadSVG } from "../utils/downloadUtils";

export default function CurveStatsModal({
  show,
  onHide,
  stats,
  requestConfig,
}: {
  show: boolean;
  onHide: () => void;
  stats: TileStats;
  requestConfig: RequestConfig | null;
}) {
  const downloadPlans = () => {
    if (!requestConfig) {
      return;
    }
    const svg = getPlansSVG(requestConfig);
    if (!svg) {
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadSVG(svg, `DragonCurvePlans_${timestamp}.svg`);
  };

  return (
    <Modal className="dragon-modal" show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Curve Tile Statistics</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table bordered hover size="sm" className="mb-0">
          <thead>
            <tr>
              <th>Tile type</th>
              <th className="text-end">Count</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Left turns only</td>
              <td className="text-end">{stats.activeLeftOnly}</td>
            </tr>
            <tr>
              <td>Right turns only</td>
              <td className="text-end">{stats.activeRightOnly}</td>
            </tr>
            <tr>
              <td>Complementary turns</td>
              <td className="text-end">{stats.complementary}</td>
            </tr>
            <tr>
              <td>Inside</td>
              <td className="text-end">{stats.inside}</td>
            </tr>
            <tr>
              <td>Outside</td>
              <td className="text-end">{stats.outside}</td>
            </tr>
            <tr>
              <td>Horizontal (columns)</td>
              <td className="text-end">{stats.horizontal}</td>
            </tr>
            <tr>
              <td>Vertical (rows)</td>
              <td className="text-end">{stats.vertical}</td>
            </tr>
            <tr>
              <td>
                <strong>Total</strong>
              </td>
              <td className="text-end">
                <strong>{stats.total}</strong>
              </td>
            </tr>
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={downloadPlans}
          disabled={!requestConfig}
        >
          Download Plans
        </Button>
        <Button variant="primary" onClick={onHide}>
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
