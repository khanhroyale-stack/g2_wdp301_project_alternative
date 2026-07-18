import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatDateTime(value) {
  if (!value) return "Chưa cập nhật";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(value) {
  if (!value) return "Chưa cập nhật";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
