import { useContext } from "react";
import {
  Button,
  Col,
  Container,
  FormControl,
  Modal,
  Row,
} from "react-bootstrap";

import { FileUploader } from "react-drag-drop-files";
import { CurrentConfigContext } from "../Contexts";

const fileTypes = ["json"];

function LoadCurveModal() {
  let config = useContext(CurrentConfigContext);
  const dismiss = () => {
    config.setLoadShow(false);
  };

  const handleChange = (file: any) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const fileContent = fileReader.result as string;
      const jsonData = JSON.parse(fileContent);
      let s = document.getElementById("paste") as HTMLInputElement;
      s.value = JSON.stringify(jsonData);
    };
    fileReader.readAsText(file);
  };

  const handleClose = () => {
    const text = document.getElementById("paste") as HTMLInputElement;
    const newConfig = JSON.parse(text.value);

    try {
      config.setActiveCellState({
        ...config.activeCellState,
        backgroundColor: newConfig.active.backgroundColor,
        borderColor: newConfig.active.borderColor,
        borderWidth: newConfig.active.borderWidth,
        borderStyle: newConfig.active.borderStyle,
        borderEnabled: newConfig.active.borderEnabled,
        fillEnabled: newConfig.active.fillEnabled,
      });
    } catch (error) {
      console.error(
        "An error occurred while setting active cell state:",
        error
      );
    }
    try {
      config.setOutsideCellState({
        ...config.outsideCellState,
        backgroundColor: newConfig.outside.backgroundColor,
        borderColor: newConfig.outside.borderColor,
        borderWidth: newConfig.outside.borderWidth,
        borderStyle: newConfig.outside.borderStyle,
        borderEnabled: newConfig.outside.borderEnabled,
        fillEnabled: newConfig.outside.fillEnabled,
      });
    } catch (error) {
      console.error(
        "An error occurred while setting outside cell state:",
        error
      );
    }
    try {
      config.setInsideCellState({
        ...config.insideCellState,
        backgroundColor: newConfig.inside.backgroundColor,
        borderColor: newConfig.inside.borderColor,
        borderWidth: newConfig.inside.borderWidth,
        borderStyle: newConfig.inside.borderStyle,
        borderEnabled: newConfig.inside.borderEnabled,
        fillEnabled: newConfig.inside.fillEnabled,
      });
    } catch (error) {
      console.error(
        "An error occurred while setting inside cell state:",
        error
      );
    }
    try {
      config.setPathState({
        ...config.pathState,
        borderColor: newConfig.path.borderColor,
        borderWidth: newConfig.path.borderWidth,
        borderStyle: newConfig.path.borderStyle,
        borderEnabled: newConfig.path.borderEnabled,
        startDirection: newConfig.path.startDirection,
      });
    } catch (error) {
      console.error("An error occurred while setting path state:", error);
    }
    try {
      config.setState({
        ...config.state,
        folds: newConfig.state.folds,
        margin: newConfig.state.margin,
        cellType: newConfig.state.cellType,
        triangleAngle: newConfig.state.triangleAngle,
        radius: newConfig.state.radius,
        generateEnabled: newConfig.state.generateEnabled,
        grouting: newConfig.state.grouting,
      });
    } catch (error) {
      console.error("An error occurred while setting curve state:", error);
    }

    config.setLoadShow(false);

    //This is a bit hacky, but it works
    setTimeout(() => {
      let btn = document.getElementById(
        "generate-dragon-curve-button"
      ) as HTMLButtonElement;
      btn.click();
    }, 1000);

    config.setDirty(true);
  };

  return (
    <>
      <Modal show={config.loadShow} onHide={dismiss} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Load Curve</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row>
              <Col xs={12}>
                <FileUploader
                  style={{ width: "100%" }}
                  handleChange={handleChange}
                  name="file"
                  types={fileTypes}
                  multiple={false}
                  children={
                    <FormControl
                      as="textarea"
                      aria-label="With textarea"
                      defaultValue="Paste or Drop a previously saved config file here"
                      style={{ height: "15em", width: "750px" }}
                      id="paste"
                    />
                  }
                />
              </Col>
            </Row>
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
