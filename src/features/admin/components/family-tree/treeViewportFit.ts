interface NodeBounds { x: number; y: number; width: number; height: number }

/** Fit visible content rather than layout padding; height limits keep all generations reachable. */
export function fitTreeContent(nodes: readonly NodeBounds[], viewport: { width: number; height: number }, toolbarHeight = 64, readable = false) {
  if (!nodes.length || viewport.width <= 0 || viewport.height <= 0) return null;
  const left = Math.min(...nodes.map(node => node.x));
  const right = Math.max(...nodes.map(node => node.x + node.width));
  const top = Math.min(...nodes.map(node => node.y));
  const bottom = Math.max(...nodes.map(node => node.y + node.height));
  const usefulHeight = Math.max(120, viewport.height - toolbarHeight - 40);
  const widthScale = viewport.width * .88 / Math.max(1, right - left);
  const containedScale = Math.min(widthScale, usefulHeight / Math.max(1, bottom - top), 1.35);
  // A distant generation must not shrink a modest desktop tree into unreadable dots.
  // Large forests and exports retain the complete-bounds fit; panning reaches lower
  // generations in the readable desktop view without changing node/layout geometry.
  const readableFloor = readable && viewport.width >= 600 && nodes.length <= 40 ? Math.min(.95, widthScale) : 0;
  const scale = Math.max(.05, containedScale, readableFloor);
  const contentHeight = (bottom - top) * scale;
  const topInset = toolbarHeight + 16;
  const y = contentHeight > usefulHeight ? topInset - top * scale : topInset + usefulHeight / 2 - (top + bottom) / 2 * scale;
  return { scale, x: viewport.width / 2 - (left + right) / 2 * scale, y };
}
