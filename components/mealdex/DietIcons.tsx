interface Props {
  highProtein: boolean;
  highVegetables: boolean;
}

export function DietIcons({ highProtein, highVegetables }: Props) {
  if (!highProtein && !highVegetables) {
    return <div className="min-h-8" />;
  }

  return (
    <div className="flex min-h-8 justify-center gap-3">
      {highProtein && (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#E8D5C4] bg-[#F5F0E8] px-2.5 py-1 text-xs font-semibold text-[#5E9462]">
          💪 Protein
        </span>
      )}
      {highVegetables && (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#E8D5C4] bg-[#F5F0E8] px-2.5 py-1 text-xs font-semibold text-[#5E9462]">
          🥬 Veg
        </span>
      )}
    </div>
  );
}
