import { OverlayTrigger, Stack, Tooltip, TooltipProps } from "react-bootstrap";
import CurveStatsModal from "../DialogBoxes/CurveStatsModal";
import { RefAttributes, useState } from "react";

export default function ZoomControl({
  imageSize,
  setImageSize,
  statsURL,
  setShowFullScreen,
  stopSlideShowNow,
}: {
  imageSize: any;
  setImageSize: any;
  statsURL: any;
  setShowFullScreen: any;
  stopSlideShowNow: any;
}) {
  const [statsShow, setStatsShow] = useState(false);
  const handleZoomIn = () => {
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
  const exitHandler = () => {
    if (!document.fullscreenElement) {
      setShowFullScreen(false);
      stopSlideShowNow();
      document.getElementsByTagName("body")[0].style.backgroundColor =
        "aliceblue";

      //Reload the image so it's sized correctly
      setTimeout(() => {
        let btn = document.getElementById(
          "generate-dragon-curve-button"
        ) as HTMLButtonElement;
        btn.click();
      }, 500);
    }
  };

  const goFullScreen = () => {
    // Supports most browsers and their versions.
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      document.getElementsByTagName("body")[0].style.backgroundColor = "black";
      document.addEventListener("fullscreenchange", exitHandler);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const renderStatsTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Display the statistics on each type of tile in the curve.
    </Tooltip>
  );

  const renderFullscreenTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Display in fullscreen mode.
    </Tooltip>
  );

  return (
    <Stack direction="horizontal">
      <div
        style={{
          cursor: "pointer",
          marginLeft: "20px",
          marginRight: "10px",
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

      <div style={{ cursor: "pointer", marginLeft: "10px", marginTop: "-7px" }}>
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
      <OverlayTrigger
        placement="right"
        delay={{ show: 250, hide: 400 }}
        overlay={renderStatsTooltip}
      >
        <svg
          style={{ cursor: "pointer", marginLeft: "25px", marginTop: "-4px" }}
          onClick={() => {
            setStatsShow(true);
          }}
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-bar-chart"
          viewBox="0 0 16 16"
        >
          <path d="M4 11H2v3h2zm5-4H7v7h2zm5-5v12h-2V2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z" />
        </svg>
      </OverlayTrigger>
      <OverlayTrigger
        placement="right"
        delay={{ show: 250, hide: 400 }}
        overlay={renderFullscreenTooltip}
      >
        <svg
          style={{ cursor: "pointer", marginLeft: "15px", marginTop: "-4px" }}
          onClick={() => {
            setShowFullScreen(true);
            goFullScreen();
          }}
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-fullscreen"
          viewBox="0 0 16 16"
        >
          <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5" />
        </svg>
      </OverlayTrigger>

      <CurveStatsModal
        statsShow={statsShow}
        setStatsShow={setStatsShow}
        statsURL={statsURL}
      ></CurveStatsModal>
    </Stack>
  );
}
