import { Button, Modal } from "react-bootstrap";
import React from "react";

function CurveStatsModal({
  statsShow,
  setStatsShow,
  statsURL,
}: {
  statsShow: boolean;
  setStatsShow: React.Dispatch<React.SetStateAction<boolean>>;
  statsURL: string;
}) {
  const dismiss = () => {
    setStatsShow(false);
  };

  return (
    <>
      <Modal show={statsShow} onHide={dismiss} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Curve Tile Statistics</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <img
            src={statsURL}
            alt="Connecting to server..."
            style={{ width: 800, height: 800 }}
            id="imageHTMLElement"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={dismiss}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default CurveStatsModal;
