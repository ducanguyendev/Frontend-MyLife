import { Component, type ReactNode } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';

export function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage();
  return <div role="alert" className="min-h-48 p-8 flex flex-col items-center justify-center gap-4 bg-primary-bg text-primary-text">
    <p>{t('common.render_error')}</p>
    <button className="px-5 py-2 rounded-xl border border-custom-border bg-secondary-bg cursor-pointer" onClick={onRetry}>{t('common.try_again')}</button>
  </div>;
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <ErrorFallback onRetry={() => this.setState({ failed: false })} /> : this.props.children;
  }
}
