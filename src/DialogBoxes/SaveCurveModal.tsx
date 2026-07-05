import { useContext, useMemo } from "react";
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
import { buildSavedConfig } from "../utils/savedConfig";

function SaveCurveModal() {
  const config = useContext(CurrentConfigContext);
  const savedConfig = useMemo(
    () => buildSavedConfig(config),
    [
      config.state,
      config.pathState,
      config.activeCellState,
      config.insideCellState,
      config.outsideCellState,
    ]
  );

  const dismiss = () => {
    config.setSaveShow(false);
  };
  const handleClose = () => {
    downloadJSON(savedConfig, "DragonCurveConfig.json");
    config.setSaveShow(false);
  };

  return (
    <>
      <Modal className="dragon-modal" show={config.saveShow} onHide={dismiss} size="lg">
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
                  value={JSON.stringify(savedConfig, null, 2)}
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
