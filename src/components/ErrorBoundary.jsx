import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CYBRVEXIS Global Error Caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cyber-dark text-white flex items-center justify-center p-6 font-mono">
          <div className="max-w-xl w-full p-8 bg-cyber-darker border-2 border-cyber-pink rounded-2xl shadow-[0_0_50px_rgba(255,0,127,0.3)] text-center space-y-6">
            <div className="flex justify-center">
              <AlertTriangle size={56} className="text-cyber-pink animate-bounce" />
            </div>
            
            <h1 className="font-cyber text-2xl sm:text-3xl font-black text-cyber-pink tracking-widest uppercase">
              SYSTEM ANOMALY DETECTED
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              An unexpected runtime anomaly occurred. Your mission state has been saved in tactical memory cache.
            </p>

            <div className="p-3 bg-slate-950 border border-cyber-pink/40 rounded text-left overflow-x-auto text-[11px] text-cyber-pink font-mono">
              {this.state.error?.toString()}
            </div>

            <button
              onClick={this.handleReload}
              className="w-full py-4 px-8 bg-cyber-pink/20 border-2 border-cyber-pink text-white hover:bg-cyber-pink hover:text-black font-cyber rounded-xl text-sm tracking-widest transition-all duration-300 hover:shadow-neon-pink uppercase font-black flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RefreshCw size={18} />
              <span>RECOVER SYSTEM SESSION</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
