"use client";

interface ChipSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  single?: boolean;
}

export function ChipSelect({
  options,
  selected,
  onChange,
  single = false,
}: ChipSelectProps) {
  const toggle = (option: string) => {
    if (single) {
      onChange([option]);
      return;
    }
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#F4A896]/50 text-[#5C4033] ring-2 ring-[#E8927C]/40"
                : "bg-[#FAF6F0] text-[#6B5E52] hover:bg-[#F4E8DC]/60"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
