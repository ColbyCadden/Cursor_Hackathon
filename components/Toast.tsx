"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl border border-[#E8DDD0] bg-[#3D3429] px-5 py-3 text-sm font-medium text-white shadow-lg"
    >
      {message}
    </div>
  );
}
