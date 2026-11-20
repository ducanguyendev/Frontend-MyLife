/** html-to-image deep-clones SVGs without inlining their children's stylesheet rules. */
export async function withTreeSvgStyles<T>(root: HTMLElement, capture: () => Promise<T>): Promise<T> {
  const properties = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'opacity', 'font-family', 'font-size', 'font-weight', 'vector-effect'];
  const saved = new Map<SVGElement, string | null>();
  try {
    for (const element of root.querySelectorAll<SVGElement>('svg *')) {
      saved.set(element, element.getAttribute('style'));
      const computed = getComputedStyle(element);
      // Read first: applying parent styles must not change subsequent computed values.
      const values = properties.map(property => computed.getPropertyValue(property));
      properties.forEach((property, index) => element.style.setProperty(property, values[index]));
    }
    return await capture();
  } finally {
    for (const [element, original] of saved) {
      if (original == null) element.removeAttribute('style'); else element.setAttribute('style', original);
    }
  }
}
