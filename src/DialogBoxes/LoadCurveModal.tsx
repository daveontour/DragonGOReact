import { useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  Button,
  Col,
  Container,
  FormControl,
  Modal,
  Row,
} from "react-bootstrap";
import { CurrentConfigContext } from "../Contexts";
import {
  applySavedConfig,
  buildLoadedSnapshot,
  parseSavedConfig,
} from "../utils/savedConfig";

function LoadCurveModal() {
  const config = useContext(CurrentConfigContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [configText, setConfigText] = useState("");
  const [error, setError] = useState("");

  const dismiss = () => {
    config.setLoadShow(false);
  };

  useEffect(() => {
    if (config.loadShow) {
      setConfigText("");
      setError("");
    }
  }, [config.loadShow]);

  const loadFileContent = (file: File) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      try {
        const fileContent = fileReader.result as string;
        const saved = parseSavedConfig(fileContent);
        setConfigText(JSON.stringify(saved, null, 2));
        setError("");
      } catch {
        setError("The selected file is not a valid configuration.");
      }
    };
    fileReader.readAsText(file);
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      loadFileContent(file);
    }
    event.target.value = "";
  };

  const handleClose = () => {
    if (!configText.trim()) {
      setError("Select a configuration file or paste JSON before loading.");
      return;
    }

    try {
      const saved = parseSavedConfig(configText);
      const snapshot = buildLoadedSnapshot(config, saved);
      flushSync(() => {
        applySavedConfig(config, saved);
        if (saved.state.pallette === "randomhue") {
          config.setRandomHue(true);
        } else {
          config.setRandomHue(false);
        }
      });
      config.setLoadShow(false);
      config.setDirty(false);
      config.regenerateCurve(snapshot);
    } catch {
      setError(
        "The configuration text is not valid JSON or is missing required fields."
      );
    }
  };

  return (
    <>
      <Modal className="dragon-modal" show={config.loadShow} onHide={dismiss} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Load Curve</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row className="mb-3">
              <Col xs={12}>
                <Button variant="outline-secondary" onClick={handleSelectFile}>
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: "none" }}
                  onChange={handleFileInputChange}
                />
              </Col>
            </Row>
            <Row>
              <Col xs={12}>
                <FormControl
                  as="textarea"
                  aria-label="Configuration JSON"
                  placeholder="Select a file or paste a saved configuration here"
                  style={{ height: "15em", width: "100%" }}
                  value={configText}
                  onChange={(e) => {
                    setConfigText(e.target.value);
                    setError("");
                  }}
                />
              </Col>
            </Row>
            {error && (
              <Row className="mt-2">
                <Col xs={12}>
                  <p className="text-danger mb-0">{error}</p>
                </Col>
              </Row>
            )}
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={dismiss}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Load
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default LoadCurveModal;
