import { describe, expect, it } from "vitest";
import { pickSermonHighlights } from "../shared/sermonUtils";

describe("sermon highlights", () => {
  it("filters short duplicates and limits the shared highlights", () => {
    const text = "This is a clear teaching point from the sermon that members can remember.";
    expect(pickSermonHighlights([{ text: "too short" }, { text }, { text }, { text: "Another meaningful sermon highlight that should also be shared." }], 2)).toEqual([text, "Another meaningful sermon highlight that should also be shared."]);
  });
});
