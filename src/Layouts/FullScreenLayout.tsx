export default function FullScreenLayout({
  imgUrl,
  imageSize,
  showFullScreen,
  setShowFullScreen,
}: {
  imgUrl: string;
  imageSize: any;
  setImageSize: any;
  showFullScreen: boolean;
  setShowFullScreen: any;
}) {
  const handleImageClick = () => {
    setShowFullScreen(false);
  };

  return (
    <>
      <div
        onClick={handleImageClick}
        style={{
          display: showFullScreen ? "flex" : "none",
          height: "95%",
          width: "calc(100vw - 10px)",
          overflow: "hide",
          marginLeft: "5px",
          backgroundColor: "aliceblue",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          userSelect: "none",
        }}
      >
        <div
          onClick={handleImageClick}
          style={{
            height: "100%",
            width: "100%",
            overflow: "hide",
            backgroundColor: "aliceblue",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginLeft: "2px",
            userSelect: "none",
          }}
        >
          <img
            onClick={handleImageClick}
            src={imgUrl}
            alt="Connecting to server..."
            style={{ width: imageSize.width, height: imageSize.height }}
            id="imageHTMLElementFullScreen"
          />
        </div>
      </div>
    </>
  );
}
