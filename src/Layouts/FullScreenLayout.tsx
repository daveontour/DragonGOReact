import { useContext } from "react";
import { CurrentConfigContext } from "../Contexts";
import { SetShowFullScreen } from "../types";
import { downloadJSON } from "../utils/downloadUtils";

export default function FullScreenLayout({
  showFullScreen,
  setShowFullScreen,
}: {
  showFullScreen: boolean;
  setShowFullScreen: SetShowFullScreen;
}) {
  const config = useContext(CurrentConfigContext);
  
  const handleImageClick = () => {
    setShowFullScreen(false);
  };
  function handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.type === "keydown" && event.key.toLowerCase() === "s") {
      downloadJSON(config.configJSON, "SaveDragonCurveConfig.json");
    }

    document.getElementById("imageHTMLElementFullScreen")?.focus();
  }

  return (
    <>
      <div
        tabIndex={0}
        id="imageHTMLElementFullScreen"
        onClick={handleImageClick}
        onKeyDown={handleKeyPress}
        style={{
          display: showFullScreen ? "flex" : "none",
          height: "calc(100vh - 10px)",
          width: "calc(100vw - 10px)",
          overflow: "hide",
          marginLeft: "5px",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          userSelect: "none",
        }}
      ></div>
    </>
  );
}
