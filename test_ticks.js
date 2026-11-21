// Calculate 60 ticks around rounded rectangle of width W, height H, radius R
function getRoundedRectTicks(W, H, R, tickLen) {
  const topEdge = W - 2 * R;
  const rightEdge = H - 2 * R;
  const bottomEdge = W - 2 * R;
  const leftEdge = H - 2 * R;
  const cornerLen = (Math.PI / 2) * R;
  const totalPerim = topEdge + rightEdge + bottomEdge + leftEdge + 4 * cornerLen;

  // We want tick 0 to be at top center (x = W/2, y = 0)
  // Distance from top-left tangent to top-center is topEdge / 2
  const offset = topEdge / 2;

  const getPointAndNormal = (dist) => {
    // Wrap dist in [0, totalPerim)
    let d = (dist % totalPerim + totalPerim) % totalPerim;

    // Segment 1: top edge right half: from (W/2, 0) to (W-R, 0)
    // length is topEdge / 2
    if (d < topEdge / 2) {
      return { x: W / 2 + d, y: 0, nx: 0, ny: 1 };
    }
    d -= topEdge / 2;

    // Segment 2: top-right corner
    if (d < cornerLen) {
      const angle = -Math.PI / 2 + (d / cornerLen) * (Math.PI / 2);
      const cx = W - R;
      const cy = R;
      return {
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle),
        nx: -Math.cos(angle),
        ny: -Math.sin(angle)
      };
    }
    d -= cornerLen;

    // Segment 3: right edge
    if (d < rightEdge) {
      return { x: W, y: R + d, nx: -1, ny: 0 };
    }
    d -= rightEdge;

    // Segment 4: bottom-right corner
    if (d < cornerLen) {
      const angle = 0 + (d / cornerLen) * (Math.PI / 2);
      const cx = W - R;
      const cy = H - R;
      return {
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle),
        nx: -Math.cos(angle),
        ny: -Math.sin(angle)
      };
    }
    d -= cornerLen;

    // Segment 5: bottom edge (right to left)
    if (d < bottomEdge) {
      return { x: W - R - d, y: H, nx: 0, ny: -1 };
    }
    d -= bottomEdge;

    // Segment 6: bottom-left corner
    if (d < cornerLen) {
      const angle = Math.PI / 2 + (d / cornerLen) * (Math.PI / 2);
      const cx = R;
      const cy = H - R;
      return {
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle),
        nx: -Math.cos(angle),
        ny: -Math.sin(angle)
      };
    }
    d -= cornerLen;

    // Segment 7: left edge (bottom to top)
    if (d < leftEdge) {
      return { x: 0, y: H - R - d, nx: 1, ny: 0 };
    }
    d -= leftEdge;

    // Segment 8: top-left corner
    if (d < cornerLen) {
      const angle = Math.PI + (d / cornerLen) * (Math.PI / 2);
      const cx = R;
      const cy = R;
      return {
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle),
        nx: -Math.cos(angle),
        ny: -Math.sin(angle)
      };
    }
    d -= cornerLen;

    // Segment 9: top edge left half: from (R, 0) to (W/2, 0)
    return { x: R + d, y: 0, nx: 0, ny: 1 };
  };

  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const dist = (i / 60) * totalPerim;
    const pt = getPointAndNormal(dist);
    ticks.push({
      i,
      x1: Math.round(pt.x * 10) / 10,
      y1: Math.round(pt.y * 10) / 10,
      x2: Math.round((pt.x + pt.nx * tickLen) * 10) / 10,
      y2: Math.round((pt.y + pt.ny * tickLen) * 10) / 10
    });
  }
  return ticks;
}

const ticks = getRoundedRectTicks(180, 180, 36, 8);
console.log("Tick 0 (12 o'clock):", ticks[0]);
console.log("Tick 15 (3 o'clock):", ticks[15]);
console.log("Tick 30 (6 o'clock):", ticks[30]);
console.log("Tick 45 (9 o'clock):", ticks[45]);
