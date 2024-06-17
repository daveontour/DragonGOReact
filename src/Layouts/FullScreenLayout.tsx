import myGlobalObject from "../globals";

export default function FullScreenLayout({
  showFullScreen,
  setShowFullScreen,
}: {
  showFullScreen: boolean;
  setShowFullScreen: any;
}) {
  const handleImageClick = () => {
    setShowFullScreen(false);
  };
  function handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.type === "keydown" && event.key.toLowerCase() === "s") {
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
