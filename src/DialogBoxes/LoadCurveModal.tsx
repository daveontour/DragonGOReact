import {
  Button,
  Col,
  Container,
  FormControl,
  Modal,
  Row,
} from "react-bootstrap";

import { FileUploader } from "react-drag-drop-files";

const fileTypes = ["json"];

function LoadCurveModal({
  show,
  setState,
  activeCellState,
  setActiveCellState,
  outsideCellState,
  setOutsideCellState,
  insideCellState,
  setInsideCellState,
  pathState,
  setPathState,
  curveState,
  setCurveState,
  setDirty,
}: {
  show: any;
  setState: any;
  activeCellState: any;
  setActiveCellState: any;
  outsideCellState: any;
  setOutsideCellState: any;
  insideCellState: any;
  setInsideCellState: any;
  pathState: any;
  setPathState: any;
  curveState: any;
  setCurveState: any;
  setDirty: any;
}) {
  const dismiss = () => {
    setState(false);
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
      setActiveCellState({
        ...activeCellState,
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
      setOutsideCellState({
        ...outsideCellState,
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
      setInsideCellState({
        ...insideCellState,
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
      setPathState({
        ...pathState,
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
      setCurveState({
        ...curveState,
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

    setState(false);

    //This is a bit hacky, but it works
    setTimeout(() => {
      let btn = document.getElementById(
        "generate-dragon-curve-button"
      ) as HTMLButtonElement;
      btn.click();
    }, 1000);

    setDirty(true);
  };

  return (
    <>
      <Modal show={show} onHide={dismiss} size="lg">
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
