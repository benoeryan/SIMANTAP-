import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught app error:", error, errorInfo);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Terjadi Kendala Muat Aplikasi</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sistem SIM-SB LPK IJEF CORP mendeteksi kendala rendering pada sesi saat ini. Silakan muat ulang halaman untuk memulihkan sesi.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-red-400 text-left overflow-x-auto max-h-32">
                  {this.state.error.toString()}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('ijef_demo_auth');
                window.location.href = '/admin/dashboard';
              }}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Dashboard Admin (irsanijefcorp)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
