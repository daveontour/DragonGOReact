import { useContext } from "react";
import {
  Button,
  Col,
  Container,
  FormControl,
  Modal,
  Row,
} from "react-bootstrap";
import { CurrentConfigContext } from "../Contexts";
import { downloadJSON } from "../utils/downloadUtils";
import { SavedConfig } from "../types";

function SaveCurveModal({ config }: { config: SavedConfig }) {
  let c = useContext(CurrentConfigContext);
  const dismiss = () => {
    c.setSaveShow(false);
  };
  const handleClose = () => {
    c.setSaveShow(false);
    downloadJSON(config, "DragonCurveConfig.json");
    c.setSaveShow(false);
  };

  return (
    <>
      <Modal show={c.saveShow} onHide={dismiss} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Save Curve. - Copy and save or Download the configuration below
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row>
              <Col>
                <FormControl
                  as="textarea"
                  aria-label="With textarea"
                  value={JSON.stringify(config, null, 2)}
                  readOnly
                  style={{ height: "15em" }}
                />
              </Col>
            </Row>
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={dismiss}>
            Done
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Download
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default SaveCurveModal;
