// Box corner and edge characters
const BOX_TL = "┌";
const BOX_TR = "┐";
const BOX_BL = "└";
const BOX_BR = "┘";
const BOX_V = "│";

const LEFT_EDGE_CHARS = new Set([BOX_TL, BOX_BL, BOX_V]);
const RIGHT_EDGE_CHARS = new Set([BOX_TR, BOX_BR, BOX_V]);

const CONNECTORS = new Set(["│", "|", "v", "^", "┴", "┬", "┼", "├", "┤", "╵", "╷"]);

const TAB_WIDTH = 2;
const EDGE_TOLERANCE = 4;
const CLUSTER_THRESHOLD = 8;

function normalizeLines(input) {
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map(line => line.replace(/\t/g, " ".repeat(TAB_WIDTH)).trimEnd());
}

function findCharInRange(line, chars, center, tolerance) {
  const start = Math.max(0, center - tolerance);
  const end = Math.min(line.length - 1, center + tolerance);
  for (let i = start; i <= end; i++) {
    if (chars.has(line[i])) return i;
  }
  return -1;
}

function detectBoxes(lines) {
  const boxes = [];

  for (let top = 0; top < lines.length; top++) {
    const line = lines[top];
    let col = 0;

    while ((col = line.indexOf(BOX_TL, col)) !== -1) {
      const topRight = line.indexOf(BOX_TR, col + 1);
      if (topRight === -1) {
        col++;
        continue;
      }

      // Search for bottom edge with tolerance
      for (let bottom = top + 1; bottom < lines.length; bottom++) {
        const bottomLine = lines[bottom];

        const blPos = findCharInRange(bottomLine, new Set([BOX_BL]), col, EDGE_TOLERANCE);
        const brPos = findCharInRange(bottomLine, new Set([BOX_BR]), topRight, EDGE_TOLERANCE);

        if (blPos !== -1 && brPos !== -1 && blPos < brPos) {
          // Found a box - now find the true extents by checking all lines
          let minLeft = Math.min(col, blPos);
          let maxRight = Math.max(topRight, brPos);

          // Check middle lines for edge positions
          for (let j = top + 1; j < bottom; j++) {
            const midLine = lines[j];
            const leftEdge = findCharInRange(midLine, LEFT_EDGE_CHARS, minLeft, EDGE_TOLERANCE);
            const rightEdge = findCharInRange(midLine, RIGHT_EDGE_CHARS, maxRight, EDGE_TOLERANCE);
            if (leftEdge !== -1) minLeft = Math.min(minLeft, leftEdge);
            if (rightEdge !== -1) maxRight = Math.max(maxRight, rightEdge);
          }

          const width = maxRight - minLeft + 1;
          const center = minLeft + Math.floor(width / 2);

          boxes.push({
            top,
            bottom,
            left: minLeft,
            right: maxRight,
            width,
            center,
            topLeft: col,
            topRight,
            bottomLeft: blPos,
            bottomRight: brPos
          });
          break;
        }
      }

      col = topRight + 1;
    }
  }

  return boxes;
}

function clusterBoxes(boxes) {
  if (boxes.length === 0) return [];

  const sorted = [...boxes].sort((a, b) => a.center - b.center);
  const clusters = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    if (curr.center - prev.center > CLUSTER_THRESHOLD) {
      clusters.push([curr]);
    } else {
      clusters[clusters.length - 1].push(curr);
    }
  }

  return clusters;
}

function findAnchor(cluster) {
  let widest = cluster[0];
  for (const box of cluster) {
    if (box.width > widest.width) widest = box;
  }
  return widest.center;
}

function isConnectorChar(ch) {
  return CONNECTORS.has(ch);
}

function getConnectorPositions(line) {
  const positions = [];
  for (let i = 0; i < line.length; i++) {
    if (isConnectorChar(line[i])) positions.push(i);
  }
  return positions;
}

function isConnectorOnlyLine(line) {
  let hasConnector = false;
  for (const ch of line) {
    if (isConnectorChar(ch)) hasConnector = true;
    else if (ch !== " ") return false;
  }
  return hasConnector;
}

const HORIZ_LINE = "─";

// Check if line segment is a horizontal border (top/bottom of box)
function isHorizontalBorder(inner) {
  const nonSpace = inner.replace(/ /g, "");
  return nonSpace.length > 0 && [...nonSpace].every(c => c === HORIZ_LINE);
}

// Extract and normalize a box segment to canonical width
function extractBoxSegment(line, box) {
  const leftEdge = findCharInRange(line, LEFT_EDGE_CHARS, box.left, EDGE_TOLERANCE);
  const rightEdge = findCharInRange(line, RIGHT_EDGE_CHARS, box.right, EDGE_TOLERANCE);

  if (leftEdge === -1 || rightEdge === -1) {
    const start = Math.max(0, box.left);
    const end = Math.min(line.length, box.right + 1);
    const text = line.slice(start, end).padEnd(box.width, " ");
    return { text, originalLeft: start, originalRight: end - 1 };
  }

  const content = line.slice(leftEdge, rightEdge + 1);
  const leftChar = content[0];
  const rightChar = content[content.length - 1];
  const inner = content.slice(1, -1);

  const targetInnerWidth = box.width - 2;
  let paddedInner;

  if (isHorizontalBorder(inner)) {
    // Extend horizontal line with more ─ characters
    paddedInner = HORIZ_LINE.repeat(targetInnerWidth);
  } else if (inner.length < targetInnerWidth) {
    // Pad content with spaces
    paddedInner = inner + " ".repeat(targetInnerWidth - inner.length);
  } else {
    paddedInner = inner.slice(0, targetInnerWidth);
  }

  return {
    text: leftChar + paddedInner + rightChar,
    originalLeft: leftEdge,
    originalRight: rightEdge
  };
}

export function retouchDiagram(input) {
  const lines = normalizeLines(input);
  const boxes = detectBoxes(lines);

  if (boxes.length === 0) {
    return lines.join("\n");
  }

  // Mark which lines are inside boxes
  const inBox = new Set();
  for (const box of boxes) {
    for (let i = box.top; i <= box.bottom; i++) inBox.add(i);
  }

  // Cluster boxes and find anchors
  const clusters = clusterBoxes(boxes);
  const anchors = clusters.map(cluster => ({
    boxes: cluster,
    center: findAnchor(cluster)
  }));

  // If all connectors form a single column, merge all clusters
  const connectorCols = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (inBox.has(i)) continue;
    for (const pos of getConnectorPositions(lines[i])) {
      connectorCols.add(pos);
    }
  }

  // Only merge clusters if there ARE connectors forming a single column
  let finalAnchors = anchors;
  if (anchors.length > 1 && connectorCols.size > 0) {
    const colSpread = Math.max(...connectorCols) - Math.min(...connectorCols);
    if (colSpread <= CLUSTER_THRESHOLD) {
      const allBoxes = boxes;
      const widest = allBoxes.reduce((a, b) => b.width > a.width ? b : a);
      finalAnchors = [{ boxes: allBoxes, center: widest.center }];
    }
  }

  // Build result with box segments properly placed
  const result = lines.map(line => line.split(""));

  // Ensure result arrays are long enough
  const ensureLength = (arr, len) => {
    while (arr.length < len) arr.push(" ");
  };

  // Process each anchor group
  for (const anchor of finalAnchors) {
    for (const box of anchor.boxes) {
      const targetLeft = anchor.center - Math.floor(box.width / 2);

      for (let lineIdx = box.top; lineIdx <= box.bottom; lineIdx++) {
        const line = lines[lineIdx];
        const segment = extractBoxSegment(line, box);

        // Clear old position (use wider range to handle misaligned edges)
        const clearStart = Math.min(segment.originalLeft, box.left);
        const clearEnd = Math.max(segment.originalRight, box.right);
        for (let i = clearStart; i <= clearEnd && i < result[lineIdx].length; i++) {
          result[lineIdx][i] = " ";
        }

        // Place normalized segment at target position
        ensureLength(result[lineIdx], targetLeft + segment.text.length);
        for (let i = 0; i < segment.text.length; i++) {
          result[lineIdx][targetLeft + i] = segment.text[i];
        }
      }
    }
  }

  // Convert back to strings and trim
  const output = result.map(chars => chars.join("").trimEnd());

  // Shift connector lines
  for (let i = 0; i < output.length; i++) {
    if (inBox.has(i)) continue;

    const line = output[i];
    const positions = getConnectorPositions(line);
    if (positions.length === 0) continue;

    const findNearestAnchor = pos => {
      let best = finalAnchors[0];
      let bestDist = Math.abs(pos - best.center);
      for (const a of finalAnchors) {
        const dist = Math.abs(pos - a.center);
        if (dist < bestDist) {
          best = a;
          bestDist = dist;
        }
      }
      return best.center;
    };

    if (isConnectorOnlyLine(line)) {
      const chars = [];
      let maxPos = 0;
      for (const pos of positions) {
        const target = findNearestAnchor(pos);
        chars.push({ ch: line[pos], pos: target });
        maxPos = Math.max(maxPos, target);
      }
      const newLine = Array(maxPos + 1).fill(" ");
      for (const { ch, pos } of chars) newLine[pos] = ch;
      output[i] = newLine.join("").trimEnd();
    } else if (positions.length === 1) {
      const delta = findNearestAnchor(positions[0]) - positions[0];
      if (delta > 0) {
        output[i] = " ".repeat(delta) + line;
      } else if (delta < 0) {
        const trim = Math.min(-delta, line.search(/\S|$/));
        output[i] = line.slice(trim);
      }
    }
  }

  return output.join("\n");
}
