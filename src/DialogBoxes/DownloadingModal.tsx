import { Modal } from "react-bootstrap";
import { CurrentConfigContext } from "../Contexts";
import { useContext } from "react";

function DownloadingModal() {
  let config = useContext(CurrentConfigContext);

  return (
    <Modal show={config.downloadShow} size="sm">
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
