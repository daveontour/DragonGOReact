import { Button, Stack } from "react-bootstrap";
import CurveStatsModal from "../DialogBoxes/CurveStatsModal";
import { useState } from "react";

export default function ZoomControl({
  imageSize,
  setImageSize,
  statsURL,
}: {
  imageSize: any;
  setImageSize: any;
  statsURL: any;
}) {
  const [statsShow, setStatsShow] = useState(false);

  const handleZoomIn = () => {
    debugger;

    let x = "auto";
    if (imageSize.width != "auto") {
      x = String(parseInt(imageSize.width) * 1.01) + "px";
    }
    let y = "auto";
    if (imageSize.height != "auto") {
      y = String(parseInt(imageSize.height) * 1.01) + "px";
    }

    let z = parseInt(imageSize.zoom) + 1;

    setImageSize({
      ...imageSize,
      zoom: z.toString(),
      width: x.toString(),
      height: y.toString(),
    });
  };
  const handleZoomOut = () => {
    let x = "auto";
    if (imageSize.width != "auto") {
      x = String(parseInt(imageSize.width) * 0.99) + "px";
    }
    let y = "auto";
    if (imageSize.height != "auto") {
      y = String(parseInt(imageSize.height) * 0.99) + "px";
    }
    let z = parseInt(imageSize.zoom) - 1;

    setImageSize({
      ...imageSize,
      zoom: z.toString(),
      width: x.toString(),
      height: y.toString(),
    });
  };

  return (
    <Stack direction="horizontal">
      <div
        style={{
          cursor: "pointer",
          marginLeft: "20px",
          marginRight: "15px",
          marginTop: "-7px",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-dash-circle"
          viewBox="0 0 16 16"
          onClick={() => {
            handleZoomOut();
          }}
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
          <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8" />
        </svg>
      </div>
      <h6 style={{ userSelect: "none" }}>{imageSize.zoom}%</h6>

      <div style={{ cursor: "pointer", marginLeft: "15px", marginTop: "-7px" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-plus-circle"
          viewBox="0 0 16 16"
          onClick={() => {
            handleZoomIn();
          }}
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
        </svg>
      </div>

      <div
        onClick={() => {
          setStatsShow(true);
        }}
        style={{
          display: "flex",
          justifyContent: "center",
          fontSize: "9pt",
          cursor: "pointer",
          color: "white",
          backgroundColor: "#0E6EFD",
          marginLeft: "35px",
          height: "20px",
          width: "100px",
          borderRadius: "5px",
          border: "1px solid black",
        }}
      >
        Show Curve Stats
      </div>
      <CurveStatsModal
        statsShow={statsShow}
        setStatsShow={setStatsShow}
        statsURL={statsURL}
      ></CurveStatsModal>
    </Stack>
  );
}
