import { Button, Col, Container, Modal, Row, Stack } from "react-bootstrap";
import { CurrentConfigContext } from "../Contexts";
import { useContext } from "react";

function RendererHelpModal() {
  let config = useContext(CurrentConfigContext);
  const dismiss = () => {
    config.setShowRendererHelp(false);
  };

  return (
    <Modal show={config.showRendererHelp} onHide={dismiss} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Tile Renderers</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack direction="vertical" gap={2} style={{ marginTop: "10px" }}>
          <Container>
            <Row>
              <Col xs={10}>
                <p>
                  The tile renderer specifies the pattern within the tile along
                  the path of the dragon curve. The "standrd" set of renderers
                  draw the line from one corner of the tile to the opposite
                  corner. The turn for the tile, the direction of the previous
                  tile in the curve and the style of renderer chosen determines
                  the pattern.
                </p>
                <p>
                  Using one of the standard renderers, creates tiles that are
                  enclosed by the curve. These are called "inside" tiles, and
                  can be used to create a variety of patterns. The "outside"
                  tiles are the tiles that are not enclosed by the curve. These
                  tiles are used to create a interesting patterns.
                </p>
                <p>
                  The "Knuth" set of renderers are named after Donald Knuth. A{" "}
                  <a href="https://www.youtube.com/watch?v=v678Em6qyzk">
                    Numberphile video
                  </a>{" "}
                  featuring Donald Knuth was one of the inspirations for this
                  work. The Knuth renderers draw the line from the center of the
                  tile to the edge of the tile. The Knuth renderers are
                  particularly interesting when used with the "outside" tiles.
                  You'll see in a Knuth tile that a tile can contain multiple
                  segments of the curve. This results in no "inside" tiles being
                  created
                </p>
                <p>
                  More details of Dragon Curves can be found at this{" "}
                  <a href="http://en.wikipedia.org/wiki/Dragon_curve">
                    Wikipedia article
                  </a>
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

export default RendererHelpModal;
