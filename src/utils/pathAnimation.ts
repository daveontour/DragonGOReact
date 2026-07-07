const SEGMENT_DURATION_S = 0.06;
const MIN_SEGMENT_DURATION_S = 0.02;
const MAX_TOTAL_DURATION_S = 8;

export function segmentDuration(pathCount: number): number {
  if (pathCount <= 0) {
    return SEGMENT_DURATION_S;
  }
  const evenSplit = MAX_TOTAL_DURATION_S / pathCount;
  return Math.max(MIN_SEGMENT_DURATION_S, Math.min(SEGMENT_DURATION_S, evenSplit));
}

export function getDragonPathsInOrder(
  container: HTMLElement
): SVGPathElement[] {
  const indexedPaths = Array.from(
    container.querySelectorAll<SVGPathElement>("path.dragon[data-path-index]")
  );

  if (indexedPaths.length > 0) {
    indexedPaths.sort((a, b) => {
      const ai = Number(a.getAttribute("data-path-index"));
      const bi = Number(b.getAttribute("data-path-index"));
      return ai - bi;
    });
    return indexedPaths;
  }

  const groups = Array.from(
    container.querySelectorAll<SVGGElement>("g[data-path-index]")
  );

  if (groups.length > 0) {
    groups.sort((a, b) => {
      const ai = Number(a.getAttribute("data-path-index"));
      const bi = Number(b.getAttribute("data-path-index"));
      return ai - bi;
    });

    const paths: SVGPathElement[] = [];
    groups.forEach((group) => {
      group.querySelectorAll("path.dragon").forEach((path) => {
        paths.push(path as SVGPathElement);
      });
    });
    return paths;
  }

  return Array.from(container.querySelectorAll("path.dragon"));
}

export function clearPathAnimation(container: HTMLElement | null): void {
  if (!container) {
    return;
  }

  container.querySelectorAll("path.dragon").forEach((path) => {
    const el = path as SVGPathElement;
    el.style.removeProperty("stroke-dasharray");
    el.style.removeProperty("stroke-dashoffset");
    el.style.removeProperty("animation");
    el.style.removeProperty("animation-delay");
  });
}

export function applyPathAnimation(container: HTMLElement | null): void {
  if (!container) {
    return;
  }

  const paths = getDragonPathsInOrder(container);
  if (paths.length === 0) {
    return;
  }

  const duration = segmentDuration(paths.length);
  let delay = 0;

  paths.forEach((el) => {
    const length = el.getTotalLength();
    if (length <= 0) {
      return;
    }

    el.style.strokeDasharray = `${length}`;
    el.style.strokeDashoffset = `${length}`;
    el.style.animation = `dragon-path-draw ${duration}s ease forwards`;
    el.style.animationDelay = `${delay}s`;
    delay += duration;
  });
}

export function schedulePathAnimation(container: HTMLElement | null): void {
  if (!container) {
    return;
  }

  requestAnimationFrame(() => {
    applyPathAnimation(container);
  });
}
