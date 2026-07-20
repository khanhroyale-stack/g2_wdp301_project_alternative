import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Cập nhật state để lần render tiếp theo hiển thị UI fallback.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Có thể log lỗi này ra console (hoặc gửi lên service tracking trong thực tế)
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Có thể render bất kỳ UI fallback nào ở đây
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Đã có lỗi xảy ra trong quá trình hiển thị giao diện.</h2>
          <p style={{ color: "gray" }}>Vui lòng tải lại trang hoặc quay về trang chủ.</p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ margin: "16px auto", maxWidth: "900px", overflow: "auto", padding: "12px", textAlign: "left", background: "#fff1f2", color: "#be123c", borderRadius: "8px" }}>
              {this.state.error.stack || this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              marginTop: "16px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
