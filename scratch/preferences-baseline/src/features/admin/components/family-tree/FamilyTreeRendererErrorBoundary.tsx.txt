import React from "react";

interface Props {
  children: React.ReactNode;
  fallback: React.ReactNode;
  onError: (error: Error) => void;
}

interface State { failed: boolean }

/** Isolates experimental tree renderer failures from the rest of the family tree route. */
export class FamilyTreeRendererErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidCatch(error: Error): void { this.props.onError(error); }

  render(): React.ReactNode { return this.state.failed ? this.props.fallback : this.props.children; }
}
