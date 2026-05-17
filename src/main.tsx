import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import { TRPCProvider } from "@/providers/trpc";
import App from "./App.tsx";
import { Component, type ReactNode } from "react";

class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]">
          <div className="text-center space-y-4 p-8">
            <h2 className="text-xl font-bold text-[#1E293B]">页面出错了</h2>
            <p className="text-sm text-[#94A3B8]">
              {this.state.error?.message || "发生了未知错误"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="h-9 px-4 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0]"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <TRPCProvider>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </TRPCProvider>
  </BrowserRouter>
);
