import { useState } from "react";
import AuthField from "./AuthField";

// Ô mật khẩu: bọc AuthField và thêm nút hiện/ẩn.
const PasswordField = ({ id, label, error, ...inputProps }) => {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField
      id={id}
      label={label}
      error={error}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            {visible ? "visibility_off" : "visibility"}
          </span>
        </button>
      }
      {...inputProps}
    />
  );
};

export default PasswordField;
