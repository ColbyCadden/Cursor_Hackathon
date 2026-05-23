"use client";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Type a message…",
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm text-[#3D3429] outline-none focus:border-[#E8927C] focus:ring-2 focus:ring-[#F4A896]/40 disabled:opacity-60"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="rounded-xl bg-[#E8927C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D97F68] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
