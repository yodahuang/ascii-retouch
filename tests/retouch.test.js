import { describe, expect, test } from "bun:test";
import { retouchDiagram } from "../retouch.js";

describe("retouchDiagram", () => {
  test("aligns boxes to widest box center", () => {
    const input = [
      "  ┌────┐",
      "  │Top │",
      "  └────┘",
      "   │",
      "┌──────────┐",
      "│  Bottom  │",
      "└──────────┘"
    ].join("\n");

    const output = retouchDiagram(input);
    const lines = output.split("\n");

    // Both boxes should be centered on the wider box
    expect(lines[4]).toBe("┌──────────┐");
    expect(lines[0]).toContain("┌────┐");
  });

  test("keeps multi-column layouts separate", () => {
    const input = [
      "┌───┐          ┌───┐",
      "│ L │          │ R │",
      "└───┘          └───┘"
    ].join("\n");

    const output = retouchDiagram(input);

    // Should preserve two distinct columns
    expect(output).toContain("┌───┐");
    expect(output.split("\n")[0].indexOf("┌───┐")).not.toBe(
      output.split("\n")[0].lastIndexOf("┌───┐")
    );
  });

  test("normalizes tabs and trailing spaces", () => {
    const input = "\tline one   \nline two\t\t\n";
    const output = retouchDiagram(input);

    expect(output).toBe("  line one\nline two\n");
  });

  test("is idempotent", () => {
    const input = [
      "  ┌────┐",
      "  │Top │",
      "  └────┘",
      "   │",
      "┌──────────┐",
      "│  Bottom  │",
      "└──────────┘"
    ].join("\n");

    const once = retouchDiagram(input);
    const twice = retouchDiagram(once);

    expect(twice).toBe(once);
  });

  test("shifts connector lines to match box centers", () => {
    const input = [
      "┌──────────┐",
      "│   Box    │",
      "└──────────┘",
      "  │",
      "  v"
    ].join("\n");

    const output = retouchDiagram(input);
    const lines = output.split("\n");

    // Connector should be centered under box
    const boxCenter = lines[0].indexOf("┌") + Math.floor(12 / 2);
    expect(lines[3].indexOf("│")).toBe(boxCenter);
  });

  test("handles empty input", () => {
    expect(retouchDiagram("")).toBe("");
  });

  test("handles input with no boxes", () => {
    const input = "just some text\nno boxes here";
    expect(retouchDiagram(input)).toBe(input);
  });

  test("fixes misaligned box edges within tolerance", () => {
    // Box with edges off by 1 character
    const input = [
      "  ┌──────┐",
      " │ text  │",
      "  └──────┘"
    ].join("\n");

    const output = retouchDiagram(input);
    const lines = output.split("\n");

    // All edges should align after retouching
    const topLeft = lines[0].indexOf("┌");
    const midLeft = lines[1].indexOf("│");
    const botLeft = lines[2].indexOf("└");

    expect(topLeft).toBe(midLeft);
    expect(midLeft).toBe(botLeft);
  });

  test("extends horizontal borders without extra spaces", () => {
    // When normalizing width, horizontal lines should use ─ not spaces
    const input = [
      "  ┌──────┐",
      " │ text  │",
      "  └──────┘"
    ].join("\n");

    const output = retouchDiagram(input);
    const lines = output.split("\n");

    // No space before the corner characters
    expect(lines[0]).not.toMatch(/─ +┐/);
    expect(lines[2]).not.toMatch(/─ +┘/);

    // Corners should be immediately after horizontal lines
    expect(lines[0]).toMatch(/─┐$/);
    expect(lines[2]).toMatch(/─┘$/);
  });

  test("normalizes all edges to same width", () => {
    // Box where content lines are wider than border lines
    const input = [
      "        ┌─────────────────────────────────────────────────────────────────┐",
      "        │  ACTION DATA (Post)                                               │",
      "        │    - MM  FILTERED: keep successful episodes + length <= threshold │",
      "        └─────────────────────────────────────────────────────────────────┘"
    ].join("\n");

    const output = retouchDiagram(input);
    const lines = output.split("\n");

    // All right edges should align
    const topRight = lines[0].indexOf("┐");
    const mid1Right = lines[1].lastIndexOf("│");
    const mid2Right = lines[2].lastIndexOf("│");
    const botRight = lines[3].indexOf("┘");

    expect(topRight).toBe(mid1Right);
    expect(mid1Right).toBe(mid2Right);
    expect(mid2Right).toBe(botRight);
  });

  test("realigns complex multi-stage diagram", () => {
    const input = [
      "                      ┌──────────────────────────────────────────────┐",
      "                     │                  PRE-TRAINING                │",
      "                     │   (mixed next-token training over modalities) │",
      "                     └──────────────────────────────────────────────┘",
      "                                      │",
      "                                      │  data mixture",
      "                                      v",
      "        ┌─────────────────────────────────────────────────────────────────┐",
      "        │  ROBOT ACTION DATA (imitation)                                   │",
      "        │    - details here                                                │",
      "        └─────────────────────────────────────────────────────────────────┘"
    ].join("\n");

    const output = retouchDiagram(input);
    const lines = output.split("\n");

    // Check that box edges are aligned within each box
    // First box (PRE-TRAINING)
    const box1Top = lines[0].indexOf("┌");
    const box1Mid = lines[1].indexOf("│");
    const box1Bot = lines[3].indexOf("└");
    expect(box1Top).toBe(box1Mid);
    expect(box1Mid).toBe(box1Bot);

    // Second box (ROBOT ACTION DATA)
    const box2Top = lines[7].indexOf("┌");
    const box2Mid = lines[8].indexOf("│");
    const box2Bot = lines[10].indexOf("└");
    expect(box2Top).toBe(box2Mid);
    expect(box2Mid).toBe(box2Bot);

    // Connectors should align with box centers
    const connectorLine = lines[4];
    const connectorPos = connectorLine.indexOf("│");
    expect(connectorPos).toBeGreaterThan(0);

    // Should be idempotent
    expect(retouchDiagram(output)).toBe(output);
  });
});
