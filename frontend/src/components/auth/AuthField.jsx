// Ô nhập dùng chung cho form auth: label + input + dòng lỗi inline.
// `error` chỉ được truyền vào khi ô đã "touched" — xem logic ở trang cha.
const AuthField = ({ id, label, error, trailing, className = "", ...inputProps }) => {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-on-surface mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full px-4 py-3 border rounded-xl text-sm bg-surface-bright outline-none transition-all ${
            error
              ? "border-error focus:border-error focus:ring-2 focus:ring-error/10"
              : "border-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/10"
          } ${trailing ? "pr-12" : ""} ${className}`}
          {...inputProps}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-error text-xs mt-1.5">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default AuthField;
