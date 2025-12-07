import { useContext } from "react";
import { CurrentConfigContext } from "../Contexts";
import ZoomControl from "../Widgets/ZoomControlWidget";
import "./ImageLayout.css";
import { SetShowFullScreen, StopSlideShowNow } from "../types";

export default function ImageLayout({
  statsURL,
  setShowFullScreen,
  stopSlideShowNow,
}: {
  statsURL: string;
  setShowFullScreen: SetShowFullScreen;
  stopSlideShowNow: StopSlideShowNow;
}) {
  let config = useContext(CurrentConfigContext);

  function handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.type === "keydown" && event.key.toLowerCase() === "s") {
      const blob = new Blob([config.configJSON], {
        type: "application/json",
      });
      const href = URL.createObjectURL(blob);

      // create "a" HTML element with href to file & click
      const link = document.createElement("a");
      link.href = href;
      var fname = `SaveDragonCurveConfig.json`;
      link.setAttribute("download", fname); //or any other extension
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    }

    document.getElementById("imageHTMLElement")?.focus();
  }

  return (
    <>
      <div
        onKeyDown={handleKeyPress}
        style={{
          height: "calc(100vh - 90px)",
          width: "calc(100vw - 335px)",
          overflow: "hide",
          backgroundColor: "aliceblue",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          marginLeft: "2px",
          borderRadius: "5px",
          userSelect: "none",
        }}
      >
        <div
          tabIndex={0}
          onKeyDown={handleKeyPress}
          id="imageHTMLElement"
          className={config.settingsConfig.background}
          style={{
            outline: "none",
            height: "calc(100% - 25px)",
            width: "100%",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginLeft: "2px",
            borderRadius: "5px",
            userSelect: "none",
          }}
        ></div>
        <div
          style={{
            width: "100%",
            height: 25,
            paddingLeft: 5,
            backgroundColor: "#ccccccbb",
            borderRadius: "5px",
          }}
        >
          <ZoomControl
            statsURL={statsURL}
            setShowFullScreen={setShowFullScreen}
            stopSlideShowNow={stopSlideShowNow}
          />
        </div>
      </div>
    </>
  );
}
