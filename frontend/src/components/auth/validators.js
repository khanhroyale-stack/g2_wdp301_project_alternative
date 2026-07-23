// Luật validate phía client cho form auth.
// Nguyên tắc: KHÔNG được chặt hơn backend. Backend chỉ bắt buộc fullName/email/password
// (auth.controller.js — register), nên ở đây cũng chỉ chặn đúng ngần đó cộng định dạng.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9,11}$/;

export const validators = {
  name: (value) => (value.trim() ? "" : "Vui lòng nhập họ và tên"),

  email: (value) => {
    if (!value.trim()) return "Vui lòng nhập email";
    return EMAIL_PATTERN.test(value.trim()) ? "" : "Email không đúng định dạng";
  },

  // Số điện thoại không bắt buộc ở backend — chỉ báo lỗi khi đã nhập mà sai định dạng.
  phone: (value) => {
    if (!value.trim()) return "";
    return PHONE_PATTERN.test(value.replace(/\s/g, "")) ? "" : "Số điện thoại không hợp lệ";
  },

  password: (value) => {
    if (!value) return "Vui lòng nhập mật khẩu";
    return value.length >= 6 ? "" : "Mật khẩu tối thiểu 6 ký tự";
  },

  confirmPassword: (value, form) => {
    if (!value) return "Vui lòng nhập lại mật khẩu";
    return value === form.password ? "" : "Mật khẩu nhập lại không khớp";
  },
};

// Chạy toàn bộ luật cho các field được liệt kê, trả về { field: message }.
export const validateAll = (form, fields) =>
  fields.reduce((errors, field) => {
    const message = validators[field]?.(form[field], form) || "";
    if (message) errors[field] = message;
    return errors;
  }, {});
