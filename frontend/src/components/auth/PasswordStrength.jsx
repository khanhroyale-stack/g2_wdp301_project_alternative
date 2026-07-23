// Thanh gợi ý độ mạnh mật khẩu.
// CHỈ mang tính tham khảo — không bao giờ chặn submit, vì backend chấp nhận
// mật khẩu từ 6 ký tự (xem BR-03 và minLength trong form đăng ký).
const LEVELS = [
  { label: "Yếu", bar: "bg-error", text: "text-error" },
  { label: "Trung bình", bar: "bg-secondary", text: "text-secondary" },
  { label: "Khá", bar: "bg-primary-container", text: "text-primary" },
  { label: "Mạnh", bar: "bg-primary", text: "text-primary" },
];

// Trả về 0..4 — 0 nghĩa là chưa đạt tối thiểu 6 ký tự.
export const getPasswordScore = (password = "") => {
  if (password.length < 6) return 0;

  let score = 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  return Math.min(score, 4);
};

const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const score = getPasswordScore(password);
  const level = LEVELS[Math.max(score - 1, 0)];

  return (
    <div className="mt-2">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-1 flex-1 rounded-full transition-colors ${
              step <= score ? level.bar : "bg-surface-variant"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1.5 ${score === 0 ? "text-on-surface-variant" : level.text}`}>
        {score === 0 ? "Mật khẩu tối thiểu 6 ký tự" : `Độ mạnh: ${level.label}`}
      </p>
    </div>
  );
};

export default PasswordStrength;
