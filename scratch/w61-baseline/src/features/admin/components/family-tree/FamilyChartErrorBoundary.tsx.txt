import React from "react";

interface FamilyChartErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  onError: (error: Error) => void;
}

interface FamilyChartErrorBoundaryState {
  hasError: boolean;
}

/** Isolate React render errors from the experimental family-chart renderer only. */
export class FamilyChartErrorBoundary extends React.Component<FamilyChartErrorBoundaryProps, FamilyChartErrorBoundaryState> {
  state: FamilyChartErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): FamilyChartErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    this.props.onError(error);
  }

  render(): React.ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
