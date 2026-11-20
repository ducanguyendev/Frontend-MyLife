import React from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '../src/shared/components/ErrorBoundary';
import i18n from '../src/shared/i18n';

let shouldThrow = true;
function ThrowingChild() {
  if (shouldThrow) throw new Error('Deliberate boundary regression');
  return <p>Boundary recovered</p>;
}
export async function mountBoundaryFixture(element: HTMLElement, language: string) {
  await i18n.changeLanguage(language); shouldThrow = true;
  const caughtErrors: string[] = [];
  const root = createRoot(element, { onCaughtError: error => caughtErrors.push(error instanceof Error ? error.message : String(error)) });
  root.render(<ErrorBoundary><ThrowingChild /></ErrorBoundary>);
  return { errors: () => caughtErrors, recover: () => { shouldThrow = false; }, cleanup: () => root.unmount() };
}
