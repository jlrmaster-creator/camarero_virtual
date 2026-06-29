import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
            Error en la aplicación
          </h1>
          <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>
            {this.state.error.message}
          </p>
          {this.state.info && (
            <pre style={{
              fontSize: '11px',
              color: '#94a3b8',
              maxHeight: '300px',
              overflow: 'auto',
              width: '100%',
              background: '#1e293b',
              padding: '12px',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {this.state.info.componentStack}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
