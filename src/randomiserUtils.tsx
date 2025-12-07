export function generateColor(
  palette: string,
  lastConstrastValue: string,
  contrastCount: number,
  setLastConstrastValue: (value: string) => void,
  setContrastCount: (value: number) => void
) {
  let actualPalette = palette;
  if (palette === "randomPalette") {
    actualPalette = [
      "pastel",
      "vibrant",
      "redhue",
      "greenhue",
      "bluehue",
      "randomhue",
      "highcontrast",
      "random",
      "vangogh",
      "monet",
      "blueyellow",
    ][Math.floor(Math.random() * 11)];
  }

  if (actualPalette === "pastel") {
    return generatePastelColor();
  } else if (actualPalette === "vibrant") {
    return generateVibrantColor();
  } else if (actualPalette === "redhue") {
    return generateRedHueColor();
  } else if (actualPalette === "greenhue") {
    return generateGreenHueColor();
  } else if (actualPalette === "bluehue") {
    return generateBlueHueColor();
  } else if (actualPalette === "randomhue") {
    return generateRandomHueColor();
  } else if (actualPalette === "highcontrast") {
    return generateHighContrastColor(
      lastConstrastValue,
      contrastCount,
      setLastConstrastValue,
      setContrastCount
    );
  } else if (actualPalette === "vangogh") {
    return generateVanGoghColor();
  } else if (actualPalette === "monet") {
    return generateMonetColor();
  } else if (actualPalette === "blueyellow") {
    return generateBlueYellowColor();
  } else {
    return generateRandomColor();
  }
}

export function generateHighContrastColor(
  lastConstrastValue: string,
  contrastCount: number,
  setLastConstrastValue: (value: string) => void,
  setContrastCount: (value: number) => void
) {
  if (lastConstrastValue === "" || contrastCount % 5 === 0) {
    let x = generateVibrantColor();
    setLastConstrastValue(x);
    setContrastCount(contrastCount + 1);
    return x;
  } else {
    //convert the last contrast value to RGBA

    let y = stringToRGBA(lastConstrastValue);

    let x = rgbaToHsla(y[0], y[1], y[2], y[3] / 255);
    var newHSL = hslaRotate(x[0], x[1], x[2], x[3], 137.5);
    var newRGB = hslToRgb(newHSL[0], newHSL[1], newHSL[2]);
    let newVal = `#${newRGB[0].toString(16).padStart(2, "0")}${newRGB[1]
      .toString(16)
      .padStart(2, "0")}${newRGB[2].toString(16).padStart(2, "0")}${Math.round(
      newHSL[3] * 255
    )
      .toString(16)
      .padStart(2, "0")}`;
    setLastConstrastValue(newVal);
    setContrastCount(contrastCount + 1);
    return newVal;
  }
}

export function generateRandomHueColor() {
  if (Math.random() > 0.66) {
    return generateRedHueColor();
  } else if (Math.random() > 0.5) {
    return generateGreenHueColor();
  } else {
    return generateBlueHueColor();
  }
}
export function generateRedHueColor() {
  let R = Math.floor(Math.random() * 127 + 127);
  let G = Math.floor(Math.random() * 63);
  let B = Math.floor(Math.random() * 63);

  let rgb = (R << 16) + (G << 8) + B;
  return `#${rgb.toString(16)}${generateRandomOpacity()}`;
}

export function generateBlueHueColor() {
  let R = Math.floor(Math.random() * 63);
  let G = Math.floor(Math.random() * 63);
  let B = Math.floor(Math.random() * 127 + 127);

  let rgb = (R << 16) + (G << 8) + B;
  return `#${rgb.toString(16)}${generateRandomOpacity()}`;
}
export function generateGreenHueColor() {
  let R = Math.floor(Math.random() * 63);
  let G = Math.floor(Math.random() * 127 + 127);
  let B = Math.floor(Math.random() * 63);

  let rgb = (R << 16) + (G << 8) + B;
  return `#${rgb.toString(16)}`;
}

export function generateRandomColor() {
  let R = Math.floor(Math.random() * 255);
  let G = Math.floor(Math.random() * 255);
  let B = Math.floor(Math.random() * 255);

  let rgb = (R << 16) + (G << 8) + B;
  return `#${rgb.toString(16)}${generateRandomOpacity()}`;
}
export function generatePastelColor() {
  let R = Math.floor(Math.random() * 127 + 127);
  let G = Math.floor(Math.random() * 127 + 127);
  let B = Math.floor(Math.random() * 127 + 127);

  let rgb = (R << 16) + (G << 8) + B;
  return `#${rgb.toString(16)}${generateRandomOpacity()}`;
}

export function generateVibrantColor() {
  let R = Math.floor(Math.random() * 255);
  let G = Math.floor(Math.random() * 255);
  let B = Math.floor(Math.random() * 255);

  if (Math.random() > 0.66) {
    R = 255;
  } else if (Math.random() > 0.5) {
    G = 255;
  } else {
    B = 255;
  }

  let rgb = (R << 16) + (G << 8) + B;
  return `#${rgb.toString(16).padStart(6, "0")}`;
}

export function generateVanGoghColor() {
  // Van Gogh palette: bold yellows, deep blues, rich greens, oranges, warm earth tones
  const colorType = Math.random();
  let R, G, B;

  if (colorType < 0.25) {
    // Bold yellows and oranges (sunflowers, stars)
    R = Math.floor(Math.random() * 55 + 200); // 200-255
    G = Math.floor(Math.random() * 75 + 180); // 180-255
    B = Math.floor(Math.random() * 70 + 30);  // 30-100
  } else if (colorType < 0.45) {
    // Deep blues (starry night)
    R = Math.floor(Math.random() * 50 + 10);  // 10-60
    G = Math.floor(Math.random() * 60 + 40);   // 40-100
    B = Math.floor(Math.random() * 106 + 150); // 150-255
  } else if (colorType < 0.65) {
    // Rich greens (fields, cypress trees)
    R = Math.floor(Math.random() * 80 + 50);  // 50-130
    G = Math.floor(Math.random() * 100 + 100); // 100-200
    B = Math.floor(Math.random() * 70 + 40);  // 40-110
  } else if (colorType < 0.80) {
    // Warm earth tones and reds
    R = Math.floor(Math.random() * 80 + 140); // 140-220
    G = Math.floor(Math.random() * 100 + 80); // 80-180
    B = Math.floor(Math.random() * 60 + 40);  // 40-100
  } else {
    // Mix of vibrant colors
    R = Math.floor(Math.random() * 120 + 120); // 120-240
    G = Math.floor(Math.random() * 120 + 100); // 100-220
    B = Math.floor(Math.random() * 100 + 80);  // 80-180
  }

  let rgb = (R << 16) + (G << 8) + B;
  return `#${rgb.toString(16).padStart(6, "0")}${generateRandomOpacity()}`;
}

export function generateMonetColor() {
  // Monet palette: soft pastels, blues/purples, muted greens, pinks/lavenders
  const colorType = Math.random();
  let R, G, B;

  if (colorType < 0.30) {
    // Soft blues and purples (water lilies)
    R = Math.floor(Math.random() * 60 + 100); // 100-160
    G = Math.floor(Math.random() * 70 + 120); // 120-190
    B = Math.floor(Math.random() * 80 + 140); // 140-220
  } else if (colorType < 0.55) {
    // Muted greens (gardens)
    R = Math.floor(Math.random() * 50 + 100); // 100-150
    G = Math.floor(Math.random() * 60 + 120); // 120-180
    B = Math.floor(Math.random() * 50 + 100); // 100-150
  } else if (colorType < 0.75) {
    // Pinks and lavenders
    R = Math.floor(Math.random() * 60 + 180); // 180-240
    G = Math.floor(Math.random() * 70 + 150); // 150-220
    B = Math.floor(Math.random() * 60 + 160); // 160-220
  } else {
    // General soft pastels (impressionistic)
    R = Math.floor(Math.random() * 70 + 150); // 150-220
    G = Math.floor(Math.random() * 70 + 150); // 150-220
    B = Math.floor(Math.random() * 70 + 150); // 150-220
  }

  let rgb = (R << 16) + (G << 8) + B;
  return `#${rgb.toString(16).padStart(6, "0")}${generateRandomOpacity()}`;
}

export function generateBlueYellowColor() {
  // Blue and Yellow palette: only shades of blue and yellow
  const colorType = Math.random();
  let R, G, B;

  if (colorType < 0.5) {
    // Various shades of blue
    // Light blues to deep blues
    R = Math.floor(Math.random() * 80 + 10);  // 10-90 (low red)
    G = Math.floor(Math.random() * 100 + 50);  // 50-150 (medium green)
    B = Math.floor(Math.random() * 155 + 100); // 100-255 (high blue)
  } else {
    // Various shades of yellow
    // Light yellows to deep golds
    R = Math.floor(Math.random() * 55 + 200); // 200-255 (high red)
    G = Math.floor(Math.random() * 55 + 200); // 200-255 (high green)
    B = Math.floor(Math.random() * 100 + 20); // 20-120 (low blue)
  }

  let rgb = (R << 16) + (G << 8) + B;
  return `#${rgb.toString(16).padStart(6, "0")}${generateRandomOpacity()}`;
}

export function generateRandomOpacity() {
  let randomHex = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
  if (Math.random() > 0.5) {
    randomHex = "ff";
  }
  return `${randomHex}`;
}

export function generateBorderWidth(seed: number) {
  return Math.floor(Math.random() * seed).toString() + "px";
}
export function generatePathWidth(seed: number) {
  if (Math.random() > 0.5) {
    return Math.floor(2 + Math.random() * seed).toString() + "px";
  } else {
    if (Math.random() > 0.5) {
      return 1 + Math.floor(Math.random() * seed).toString() + "px";
    } else {
      return 2 + Math.floor(Math.random() * seed).toString() + "px";
    }
  }
}

export function rgbToHsl(r: number, g: number, b: number): number[] {
  (r /= 255), (g /= 255), (b /= 255);
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);

  let h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
    return [h, s, l];
  } else {
    var d = max - min;
    let h: number = 0;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;

    return [h, s, l];
  }
}

export function rgbaToHsla(
  r: number,
  g: number,
  b: number,
  a: number
): number[] {
  var hsl = rgbToHsl(r, g, b);
  return [hsl[0], hsl[1], hsl[2], a];
}

export function stringToRGBA(str: string): number[] {
  var hex = str.replace("#", "");
  var bigint = parseInt(hex, 16);
  var r = (bigint >> 24) & 255;
  var g = (bigint >> 16) & 255;
  var b = (bigint >> 8) & 255;
  var a = bigint & 255;
  return [r, g, b, a];
}

function hslaRotate(
  h: number,
  s: number,
  l: number,
  a: number,
  degrees: number
): number[] {
  let newH = (h + degrees / 360) % 360;
  return [newH, s, l, a];
}
function hslToRgb(h: number, s: number, l: number) {
  var r, g, b;
  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p: number, q: number, t: number) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
