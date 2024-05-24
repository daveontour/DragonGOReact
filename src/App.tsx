import "bootstrap/dist/css/bootstrap.min.css";
import Heading from "./Layouts/Heading";
import BodyLayout from "./Layouts/BodyLayout";
import FullScreenLayout from "./Layouts/FullScreenLayout";
import { useState } from "react";

const App: React.FC = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [fsImageURL, setFSImageURL] = useState("");
  const [fsImageSize, setFSImageSize] = useState({ width: 100, height: 100 });

  const handleFullScreenExit = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };
  return (
    <div
      className="min-vw-100"
      style={{
        maxHeight: "100vh",
        maxWidth: "100vw",
        backgroundColor: showFullScreen ? "black" : "aliceblue",
      }}
    >
      <Heading showFullScreen={showFullScreen} />
      <BodyLayout
        showFullScreen={showFullScreen}
        setShowFullScreen={setShowFullScreen}
        setFSImageURL={setFSImageURL}
        setFSImageSize={setFSImageSize}
      />
      <FullScreenLayout
        imgUrl={fsImageURL}
        imageSize={fsImageSize}
        setImageSize={setFSImageSize}
        showFullScreen={showFullScreen}
        setShowFullScreen={setShowFullScreen}
      />
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
