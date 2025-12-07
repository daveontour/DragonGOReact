/**
 * Print utilities for A4 paper printing with 0.5cm margins
 * A4 paper: 210mm × 297mm
 * Printable area with 0.5cm margins: 200mm × 287mm
 */

const A4_PRINTABLE_WIDTH_MM = 200;
const A4_PRINTABLE_HEIGHT_MM = 287;
const A4_MARGIN_MM = 5; // 0.5cm = 5mm

/**
 * Extract viewBox dimensions from SVG string
 */
function extractViewBox(svgContent: string): { width: number; height: number } | null {
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/);
    if (parts.length >= 4) {
      return {
        width: parseFloat(parts[2]),
        height: parseFloat(parts[3]),
      };
    }
  }
  return null;
}

/**
 * Generate print-optimized SVG for A4 paper with 0.5cm margins
 * Scales the SVG to fit within the printable area while maintaining aspect ratio
 * Rotates landscape SVGs (wider than tall) 90 degrees to the left
 */
export function generatePrintOptimizedSVG(svgContent: string): string {
  const viewBox = extractViewBox(svgContent);
  if (!viewBox) {
    return svgContent;
  }

  let { width: svgWidth, height: svgHeight } = viewBox;
  const isLandscape = svgWidth > svgHeight;
  
  // If landscape, swap dimensions for rotation calculation
  // After rotating 90° left, width becomes height and height becomes width
  let effectiveWidth = svgWidth;
  let effectiveHeight = svgHeight;
  
  if (isLandscape) {
    // After 90° left rotation, dimensions swap
    effectiveWidth = svgHeight;
    effectiveHeight = svgWidth;
  }

  // Calculate scale factor to fit within printable area
  const scaleX = A4_PRINTABLE_WIDTH_MM / effectiveWidth;
  const scaleY = A4_PRINTABLE_HEIGHT_MM / effectiveHeight;
  const scale = Math.min(scaleX, scaleY);

  // Calculate scaled dimensions
  const scaledWidth = effectiveWidth * scale;
  const scaledHeight = effectiveHeight * scale;

  // Calculate centering offsets (center of printable area)
  const centerX = A4_PRINTABLE_WIDTH_MM / 2;
  const centerY = A4_PRINTABLE_HEIGHT_MM / 2;

  // Extract the inner content of the SVG (everything between <svg> and </svg>)
  const contentMatch = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (!contentMatch || !contentMatch[1]) {
    return svgContent;
  }

  const content = contentMatch[1].trim();

  // Build transform string
  // SVG transforms are applied right-to-left (rightmost transform is applied first)
  let transform: string;
  
  if (isLandscape) {
    // For landscape: rotate 90° left (counterclockwise)
    // Simplified approach: scale, center, rotate, then position correctly
    
    // Calculate scaled dimensions
    const scaledWidth = svgWidth * scale;
    const scaledHeight = svgHeight * scale;
    
    // After rotation, visual dimensions are swapped
    const visualWidth = scaledHeight;
    const visualHeight = scaledWidth;
    
    // Calculate where the center of the rotated content should be
    // This is simply the center of the printable area, adjusted for the rotated size
    const offsetX = (A4_PRINTABLE_WIDTH_MM - visualWidth) / 2;
    const offsetY = (A4_PRINTABLE_HEIGHT_MM - visualHeight) / 2;
    
    // The target center after rotation (in original coordinate system)
    const targetX = centerX + offsetX;
    const targetY = centerY + offsetY;
    
    // Transform sequence (applied right-to-left):
    // 1. translate(-svgWidth/2, -svgHeight/2) - center content at origin
    // 2. scale(scale) - scale content  
    // 3. rotate(-90) - rotate counterclockwise around origin
    // 4. translate(targetY, -targetX) - move to target position
    //    After -90° rotation, coordinate (x,y) becomes (-y,x)
    //    So to position at (targetX, targetY), translate by (targetY, -targetX)
    transform = `translate(${targetY}, ${-targetX}) rotate(-90) scale(${scale}) translate(${-svgWidth / 2}, ${-svgHeight / 2})`;
  } else {
    // For portrait: no rotation needed, just scale and center
    transform = `translate(${centerX}, ${centerY}) scale(${scale}) translate(${-svgWidth / 2}, ${-svgHeight / 2})`;
  }

  // Use a viewBox that's large enough to contain the rotated content
  // Calculate maximum extent needed
  let viewBoxX = 0;
  let viewBoxY = 0;
  let viewBoxWidth = A4_PRINTABLE_WIDTH_MM;
  let viewBoxHeight = A4_PRINTABLE_HEIGHT_MM;
  
  if (isLandscape) {
    // After rotation, content might extend beyond the standard viewBox
    // Calculate the maximum extent needed
    const scaledWidth = svgWidth * scale;
    const scaledHeight = svgHeight * scale;
    const maxExtent = Math.max(scaledWidth, scaledHeight);
    
    // Expand viewBox symmetrically to accommodate rotated content
    const expansion = Math.max(0, (maxExtent - Math.min(A4_PRINTABLE_WIDTH_MM, A4_PRINTABLE_HEIGHT_MM)) / 2 + 10);
    viewBoxX = -expansion;
    viewBoxY = -expansion;
    viewBoxWidth = A4_PRINTABLE_WIDTH_MM + 2 * expansion;
    viewBoxHeight = A4_PRINTABLE_HEIGHT_MM + 2 * expansion;
  }

  // Create new SVG with A4 dimensions and wrap content in a group with transform
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${A4_PRINTABLE_WIDTH_MM}mm" height="${A4_PRINTABLE_HEIGHT_MM}mm" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}">
  <g transform="${transform}">
    ${content}
  </g>
</svg>`;
}

/**
 * Open browser print dialog with A4 formatting
 */
export function openPrintDialog(svgContent: string): void {
  // Create a temporary print container
  const printContainer = document.createElement("div");
  printContainer.id = "print-container";
  printContainer.style.position = "absolute";
  printContainer.style.left = "-9999px";
  printContainer.style.width = "210mm";
  printContainer.style.height = "297mm";
  printContainer.style.padding = "5mm";
  printContainer.style.boxSizing = "border-box";
  printContainer.style.backgroundColor = "white";

  // Generate print-optimized SVG
  const printSVG = generatePrintOptimizedSVG(svgContent);

  // Create a wrapper div for the SVG
  const svgWrapper = document.createElement("div");
  svgWrapper.style.width = "200mm";
  svgWrapper.style.height = "287mm";
  svgWrapper.style.display = "flex";
  svgWrapper.style.justifyContent = "center";
  svgWrapper.style.alignItems = "center";
  svgWrapper.innerHTML = printSVG;

  printContainer.appendChild(svgWrapper);
  document.body.appendChild(printContainer);

  // Wait a moment for the content to render, then print
  setTimeout(() => {
    window.print();

    // Clean up after a delay (print dialog might still be open)
    setTimeout(() => {
      if (printContainer.parentNode) {
        printContainer.parentNode.removeChild(printContainer);
      }
    }, 1000);
  }, 100);
}

/**
 * Download print-optimized SVG file
 */
export function downloadPrintOptimizedSVG(svgContent: string, filename: string = "DragonCurve_A4_Print.svg"): void {
  const printSVG = generatePrintOptimizedSVG(svgContent);
  const blob = new Blob([printSVG], {
    type: "application/svg+xml",
  });
  const href = URL.createObjectURL(blob);

  // Create download link
  const link = document.createElement("a");
  link.href = href;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}

