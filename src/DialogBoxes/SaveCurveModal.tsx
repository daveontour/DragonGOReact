import { useContext } from "react";
import {
  Button,
  Col,
  Container,
  FormControl,
  Modal,
  Row,
} from "react-bootstrap";
import { CurrentConfigContext, Config } from "../Contexts";

function SaveCurveModal({ config }: { config: Config }) {
  let c = useContext(CurrentConfigContext);
  const dismiss = () => {
    c.setSaveShow(false);
  };
  const handleClose = () => {
    c.setSaveShow(false);
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);

    // create "a" HTML element with href to file & click
    const link = document.createElement("a");
    link.href = href;
    var fname = `DragonCurveConfig.json`;
    link.setAttribute("download", fname); //or any other extension
    document.body.appendChild(link);
    link.click();

    // clean up "a" element & remove ObjectURL
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
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
