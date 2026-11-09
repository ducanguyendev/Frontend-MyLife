let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';
let originalBodyPaddingRight = '';

export function acquireBodyScrollLock(): () => void {
  if (typeof document === 'undefined') return () => {};

  if (lockCount === 0) {
    const body = document.body;
    const html = document.documentElement;
    originalBodyOverflow = body.style.overflow;
    originalHtmlOverflow = html.style.overflow;
    originalBodyPaddingRight = body.style.paddingRight;

    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
    const currentPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
  }

  lockCount += 1;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount !== 0 || typeof document === 'undefined') return;

    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.paddingRight = originalBodyPaddingRight;
  };
}

export function getBodyScrollLockCount(): number {
  return lockCount;
}
