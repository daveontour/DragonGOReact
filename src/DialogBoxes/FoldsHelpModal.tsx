import { Button, Col, Container, Modal, Row, Stack } from "react-bootstrap";

function FoldsHelpModal({ show, setState }: { show: any; setState: any }) {
  const dismiss = () => {
    setState(false);
  };

  return (
    <Modal show={show} onHide={dismiss} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Number of Folds</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack direction="vertical" gap={2} style={{ marginTop: "10px" }}>
          <Container>
            <Row>
              <Col xs={10}>
                <p>
                  The series of left and right turns that make up the Dragon can
                  be determineded by folding a strip of paper in half
                  successively. When the strip of paper is unfolded, the creases
                  in the paper will form the Dragon curve.
                </p>
                <p>
                  Because the number of folds doubles with every fold, the
                  number of turns grows exponentially. The number of turns is
                  equal to 2^n - 1, where n is the number of folds.For example,
                  with 3 folds, the number of turns is 2^3 - 1 = 7. With 10
                  folds, the number of turns is 2^10 - 1 = 1023.
                </p>
                <p>
                  This parameter allows you to specify the number of folds to be
                  used in the Dragon curve.
                </p>
              </Col>
            </Row>
          </Container>
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={dismiss}>
          Dismiss
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default FoldsHelpModal;
