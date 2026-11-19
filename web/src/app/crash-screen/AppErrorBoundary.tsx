import { Component } from 'react';
import type { ReactNode } from 'react';
import { CrashScreen } from './CrashScreen';

type Props = { children: ReactNode };
type State = { hasError: boolean };

// Covers what sits above the router; route errors are the router's. React already logs the error.
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? <CrashScreen /> : this.props.children;
  }
}
