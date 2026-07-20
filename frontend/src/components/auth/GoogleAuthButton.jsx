import { GoogleLogin } from "@react-oauth/google";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Nút "Đăng nhập với Google" dùng chung cho trang đăng nhập & đăng ký.
// onError: callback nhận message lỗi để trang cha hiển thị.
const GoogleAuthButton = ({ onError }) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  const handleSuccess = async (credentialResponse) => {
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      if (data.user.role === "shipper") {
        navigate("/shipper", { replace: true });
      } else {
        const from = location.state?.from?.pathname;
        navigate(from || "/", { replace: true });
      }
    } catch (err) {
      onError?.(err.response?.data?.message || "Đăng nhập Google thất bại.");
    }
  };

  if (!googleClientId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
        Đăng nhập Google chưa được cấu hình. Vui lòng đăng nhập bằng email và mật khẩu.
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.("Đăng nhập Google thất bại.")}
        text="continue_with"
        shape="rectangular"
        locale="vi"
      />
    </div>
  );
};

export default GoogleAuthButton;
