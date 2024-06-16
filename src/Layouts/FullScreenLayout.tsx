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

  return (
    <>
      <div
        id="imageHTMLElementFullScreen"
        onClick={handleImageClick}
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
