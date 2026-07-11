/** Trigger a browser download of a data URL or blob URL. */
export function triggerDownload(href: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = href;
  link.click();
}

/** Download the current contents of a canvas as a PNG. */
export function downloadCanvasPng(
  canvas: HTMLCanvasElement,
  filename: string
): void {
  triggerDownload(canvas.toDataURL("image/png"), filename);
}

/** Serialize an SVG element and download it as an .svg file. */
export function downloadSvgElement(
  svg: SVGSVGElement,
  filename: string
): void {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clone);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

/**
 * Rasterize an SVG element to a PNG (at the SVG's current pixel size, or
 * an optional scale factor) and download it.
 */
export function downloadSvgAsPng(
  svg: SVGSVGElement,
  filename: string,
  scale = 2
): void {
  const bbox = svg.getBoundingClientRect();
  const width = Math.max(1, Math.round(bbox.width * scale));
  const height = Math.max(1, Math.round(bbox.height * scale));

  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clone);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }
    ctx.fillStyle = "#0a0d18";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    URL.revokeObjectURL(url);
    downloadCanvasPng(canvas, filename);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
  };
  image.src = url;
}
