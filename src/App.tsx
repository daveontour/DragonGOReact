import "bootstrap/dist/css/bootstrap.min.css";
import Heading from "./Layouts/Heading";
import BodyLayout from "./Layouts/BodyLayout";
import FullScreenLayout from "./Layouts/FullScreenLayout";
import { useState } from "react";

const App: React.FC = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [fsImageURL, setFSImageURL] = useState("");
  const [fsImageSize, setFSImageSize] = useState({ width: 100, height: 100 });
  return (
    <div
      className="min-vw-100"
      style={{
        maxHeight: "100vh",
        maxWidth: "100vw",
        backgroundColor: "aliceblue",
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
    </div>
  );
};

export default App;
