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

  it("orders paths by data-path-index on path elements", () => {
    const makePath = (index: number) => ({
      getAttribute: (attr: string) =>
        attr === "data-path-index" ? String(index) : null,
    });

    const container = {
      querySelectorAll: (selector: string) => {
        if (selector === "path.dragon[data-path-index]") {
          return [makePath(2), makePath(0), makePath(1)];
        }
        return [];
      },
    } as unknown as HTMLElement;

    const paths = getDragonPathsInOrder(container);
    expect(
      paths.map((path) => Number(path.getAttribute("data-path-index")))
    ).toEqual([0, 1, 2]);
  });
});
