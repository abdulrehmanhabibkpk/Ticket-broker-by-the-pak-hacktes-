import React from "react";

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
  id,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger" | "outline";
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const baseStyle =
    "px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#1D4ED8] hover:bg-[#1E40AF] text-white focus:ring-[#1D4ED8]",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-300",
  };

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
  step,
  disabled = false,
  className = "",
}: {
  label?: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-[#111827]">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="px-3 py-2 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-md focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none transition-all duration-150 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  );
}

export function Select({
  label,
  id,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  className = "",
}: {
  label?: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-[#111827]">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="px-3 py-2 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-md focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none transition-all duration-150 disabled:bg-gray-50 disabled:text-gray-400"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Alert({
  type,
  message,
  onClose,
  id,
}: {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
  id?: string;
}) {
  const styles = {
    success: "bg-green-50 border border-green-200 text-green-800",
    error: "bg-red-50 border border-red-200 text-red-800",
    info: "bg-blue-50 border border-blue-200 text-blue-800",
  };

  return (
    <div
      id={id}
      className={`p-4 rounded-md text-sm flex items-start gap-3 transition-all duration-200 ${styles[type]}`}
    >
      <div className="flex-1 font-medium">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-base font-bold leading-none"
        >
          &times;
        </button>
      )}
    </div>
  );
}

export function Card({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`bg-white border border-[#E5E7EB] rounded-lg p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        className={`animate-spin text-[#00a29c] ${sizes[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="12"
            y1="2"
            x2="12"
            y2="7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${i * 30} 12 12)`}
            opacity={0.15 + (i / 12) * 0.85}
          />
        ))}
      </svg>
    </div>
  );
}

export function Badge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const normalized = status.toLowerCase();
  let styles = "bg-gray-100 text-gray-800 border border-gray-200";

  if (normalized === "confirmed" || normalized === "active") {
    styles = "bg-green-50 text-green-700 border border-green-200";
  } else if (normalized === "pending") {
    styles = "bg-yellow-50 text-yellow-700 border border-yellow-200";
  } else if (normalized === "cancelled" || normalized === "failed") {
    styles = "bg-red-50 text-red-700 border border-red-200";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${styles} ${className}`}
    >
      {status}
    </span>
  );
}
