/**
 * Utility functions for downloading files
 */

/**
 * Downloads content as a file with the specified filename and MIME type
 * @param content - The content to download (string or Blob)
 * @param filename - The filename for the downloaded file
 * @param mimeType - The MIME type (default: "application/json")
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string = "application/json"
): void {
  // Create blob if content is a string
  const blob = content instanceof Blob 
    ? content 
    : new Blob([content], { type: mimeType });
  
  // Create object URL
  const href = URL.createObjectURL(blob);

  // Create download link
  const link = document.createElement("a");
  link.href = href;
  link.setAttribute("download", filename);
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}

/**
 * Downloads JSON content as a file
 * @param jsonContent - The JSON content (string or object to stringify)
 * @param filename - The filename for the downloaded file (default: "DragonCurveConfig.json")
 * @param prettyPrint - Whether to pretty print the JSON (default: true)
 */
export function downloadJSON(
  jsonContent: string | object,
  filename: string = "DragonCurveConfig.json",
  prettyPrint: boolean = true
): void {
  const content = typeof jsonContent === "string" 
    ? jsonContent 
    : JSON.stringify(jsonContent, null, prettyPrint ? 2 : 0);
  
  downloadFile(content, filename, "application/json");
}

/**
 * Downloads SVG content as a file
 * @param svgContent - The SVG content string
 * @param filename - The filename for the downloaded file (default: "DragonCurve.svg")
 */
export function downloadSVG(
  svgContent: string,
  filename: string = "DragonCurve.svg"
): void {
  downloadFile(svgContent, filename, "application/svg+xml");
}

