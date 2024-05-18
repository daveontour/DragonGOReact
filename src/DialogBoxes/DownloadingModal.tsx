import { Modal } from "react-bootstrap";

function DownloadingModal({ show }: { show: any }) {
  return (
    <Modal show={show} size="sm">
      <Modal.Body>
        <div
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <h4> File is Downloading </h4>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default DownloadingModal;
