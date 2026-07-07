import { describe, expect, it } from "vitest";
import { getDragonPathsInOrder, segmentDuration } from "./pathAnimation";

describe("pathAnimation", () => {
  it("shortens segment duration for long paths", () => {
    expect(segmentDuration(10)).toBeGreaterThan(segmentDuration(200));
  });

  it("never returns zero duration", () => {
    expect(segmentDuration(0)).toBeGreaterThan(0);
    expect(segmentDuration(1000)).toBeGreaterThan(0);
  });

  it("orders paths by data-path-index on parent groups", () => {
    const makeGroup = (index: number) => ({
      getAttribute: (attr: string) =>
        attr === "data-path-index" ? String(index) : null,
      querySelectorAll: () => [{ pathIndex: index }],
    });

    const container = {
      querySelectorAll: (selector: string) => {
        if (selector === "g[data-path-index]") {
          return [makeGroup(2), makeGroup(0), makeGroup(1)];
        }
        return [];
      },
    } as unknown as HTMLElement;

    const paths = getDragonPathsInOrder(container);
    expect(
      paths.map((path) => (path as unknown as { pathIndex: number }).pathIndex)
    ).toEqual([0, 1, 2]);
  });
});
