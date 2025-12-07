import { useContext } from "react";
import {
  Button,
  Col,
  Container,
  FormControl,
  FormLabel,
  Modal,
  Row,
  Stack,
} from "react-bootstrap";
import { CurrentConfigContext } from "../Contexts";

function ConfigSlideShowModal() {
  let config = useContext(CurrentConfigContext);
  const dismiss = () => {
    config.setSlideShowConfig(false);
  };

  return (
    <Modal show={config.showSlideShowConfig} onHide={dismiss} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Slide Show Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack direction="vertical" gap={2} style={{ marginTop: "10px" }}>
          <Container>
            <Row className="mb-1">
              <Col xs={4}>
                <FormLabel>Slide Show Interval (seconds)</FormLabel>
              </Col>
              <Col xs={4}>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={config.settingsConfig.slideShowInterval}
                  onChange={(e) => {
                    config.setSettingsConfig({
                      ...config.settingsConfig,
                      slideShowInterval: parseInt(e.target.value),
                    });
                  }}
                />
              </Col>
            </Row>
          </Container>
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={dismiss}>
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfigSlideShowModal;
