import "bootstrap/dist/css/bootstrap.min.css";
import Heading from "./Layouts/Heading";
import BodyLayout from "./Layouts/BodyLayout";
import FullScreenLayout from "./Layouts/FullScreenLayout";
import { useState } from "react";
import myGlobalObject from "./globals";

const App: React.FC = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);

  const handleFullScreenExit = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      document.getElementById("imageHTMLElement")?.focus();
    }
  };

  function handleSave(): void {
    console.log(myGlobalObject.configJSON);
    const blob = new Blob([myGlobalObject.configJSON], {
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

    document.getElementById("imageHTMLElementFullScreen")?.focus();
  }

  return (
    <div
      className={showFullScreen ? "min-vw-100" : "min-vw-100"}
      style={{
        maxHeight: "100vh",
        maxWidth: "100vw",
        backgroundColor: showFullScreen ? "unset" : "aliceblue",
      }}
    >
      <Heading showFullScreen={showFullScreen} />
      <BodyLayout
        showFullScreen={showFullScreen}
        setShowFullScreen={setShowFullScreen}
      />
      <FullScreenLayout
        showFullScreen={showFullScreen}
        setShowFullScreen={setShowFullScreen}
      />
      <div
        onClick={handleSave}
        style={{
          display: !showFullScreen ? "none" : "flex",
          position: "fixed",
          bottom: "70px",
          right: "10px",
          cursor: "pointer",
        }}
      >
        <svg
          onClick={handleSave}
          xmlns="http://www.w3.org/2000/svg"
          width="40px"
          height="40px"
          fill="#ffffff"
          fillOpacity={0.5}
          className="bi bi-fullscreen-exit"
          viewBox="0 0 16 16"
        >
          <path d="M11 2H9v3h2z" />
          <path d="M1.5 0h11.586a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13A1.5 1.5 0 0 1 1.5 0M1 1.5v13a.5.5 0 0 0 .5.5H2v-4.5A1.5 1.5 0 0 1 3.5 9h9a1.5 1.5 0 0 1 1.5 1.5V15h.5a.5.5 0 0 0 .5-.5V2.914a.5.5 0 0 0-.146-.353l-1.415-1.415A.5.5 0 0 0 13.086 1H13v4.5A1.5 1.5 0 0 1 11.5 7h-7A1.5 1.5 0 0 1 3 5.5V1H1.5a.5.5 0 0 0-.5.5m3 4a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V1H4zM3 15h10v-4.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5z" />
        </svg>
      </div>

      <div
        onClick={handleFullScreenExit}
        style={{
          display: !showFullScreen ? "none" : "flex",
          position: "fixed",
          bottom: "10px",
          right: "10px",
          cursor: "pointer",
        }}
      >
        <svg
          onClick={handleFullScreenExit}
          xmlns="http://www.w3.org/2000/svg"
          width="40px"
          height="40px"
          fill="#ffffff"
          fillOpacity={0.5}
          className="bi bi-fullscreen-exit"
          viewBox="0 0 16 16"
        >
          <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5m5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5M0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5m10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0z" />
        </svg>
      </div>
    </div>
  );
};

export default App;
