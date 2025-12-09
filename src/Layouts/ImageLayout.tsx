import { useContext } from "react";
import { CurrentConfigContext } from "../Contexts";
import "./ImageLayout.css";
import { downloadJSON } from "../utils/downloadUtils";

export default function ImageLayout() {
  let config = useContext(CurrentConfigContext);

  function handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.type === "keydown" && event.key.toLowerCase() === "s") {
      downloadJSON(config.configJSON, "SaveDragonCurveConfig.json");
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
            height: "100%",
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
      </div>
    </>
  );
}
