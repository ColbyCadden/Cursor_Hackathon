"use client";

import { useState } from "react";
import type { RatingLevel } from "@/lib/types";
import { StarRating } from "@/components/mealdex/StarRating";
import { PriceLevel } from "@/components/mealdex/PriceLevel";

export interface MealFormValues {
  name: string;
  imageUri: string;
  difficulty: RatingLevel;
  price: RatingLevel;
  highProtein: boolean;
  highVegetables: boolean;
  ingredients: string[];
}

interface Props {
  onSubmit: (values: MealFormValues) => void;
}

export function MealCreateForm({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [difficulty, setDifficulty] = useState<RatingLevel>(2);
  const [price, setPrice] = useState<RatingLevel>(2);
  const [highProtein, setHighProtein] = useState(false);
  const [highVegetables, setHighVegetables] = useState(false);
  const [ingredientsText, setIngredientsText] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageUri(URL.createObjectURL(file));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ingredients = ingredientsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!name.trim() || !imageUri.trim() || !ingredients.length) {
      window.alert("Name, photo, and at least one ingredient are required.");
      return;
    }
    onSubmit({
      name: name.trim(),
      imageUri: imageUri.trim(),
      difficulty,
      price,
      highProtein,
      highVegetables,
      ingredients,
    });
    setName("");
    setImageUri("");
    setDifficulty(2);
    setPrice(2);
    setHighProtein(false);
    setHighVegetables(false);
    setIngredientsText("");
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-8">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-[#7A7268]">
          Meal name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-[#E8D5C4] bg-[#FFFBF7] px-3 py-3 text-[#3D3832]"
          placeholder="e.g. Turkey Chili"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-[#7A7268]">
          Photo URL
        </label>
        <input
          value={imageUri.startsWith("blob:") ? "" : imageUri}
          onChange={(e) => setImageUri(e.target.value)}
          className="w-full rounded-xl border border-[#E8D5C4] bg-[#FFFBF7] px-3 py-3 text-[#3D3832]"
          placeholder="https://..."
        />
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#D48476]">
          <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
          📷 Pick from gallery
        </label>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-[#7A7268]">
          Difficulty
        </label>
        <LevelPicker
          levels={[1, 2, 3, 4, 5] as RatingLevel[]}
          value={difficulty}
          onChange={setDifficulty}
          render={(n) => <StarRating value={n} size="sm" />}
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-[#7A7268]">
          Price
        </label>
        <LevelPicker
          levels={[1, 2, 3, 4, 5] as RatingLevel[]}
          value={price}
          onChange={setPrice}
          render={(n) => <PriceLevel value={n} />}
        />
      </div>

      <label className="flex items-center justify-between py-2">
        <span className="text-[#3D3832]">High protein</span>
        <input
          type="checkbox"
          checked={highProtein}
          onChange={(e) => setHighProtein(e.target.checked)}
          className="h-5 w-5 accent-[#7BAE7F]"
        />
      </label>
      <label className="flex items-center justify-between py-2">
        <span className="text-[#3D3832]">High vegetables</span>
        <input
          type="checkbox"
          checked={highVegetables}
          onChange={(e) => setHighVegetables(e.target.checked)}
          className="h-5 w-5 accent-[#7BAE7F]"
        />
      </label>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-[#7A7268]">
          Ingredients (one per line)
        </label>
        <textarea
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-[#E8D5C4] bg-[#FFFBF7] px-3 py-3 text-[#3D3832]"
          placeholder={"ground turkey\nkidney beans"}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-[#E8A598] py-4 text-base font-bold text-white"
      >
        Add to deck
      </button>
    </form>
  );
}

function LevelPicker({
  levels,
  value,
  onChange,
  render,
}: {
  levels: RatingLevel[];
  value: RatingLevel;
  onChange: (v: RatingLevel) => void;
  render: (n: RatingLevel) => React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {levels.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`rounded-lg border px-2 py-1 ${
            value === n
              ? "border-[#E8A598] bg-[#F5F0E8]"
              : "border-[#E8D5C4] bg-[#FFFBF7]"
          }`}
        >
          {render(n)}
        </button>
      ))}
    </div>
  );
}
