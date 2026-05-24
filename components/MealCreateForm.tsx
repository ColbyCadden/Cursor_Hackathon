"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon } from "lucide-react";
import { MealPhotoCamera } from "@/components/MealPhotoCamera";
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

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Not an image"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read image"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export function MealCreateForm({ onSubmit }: Props) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [name, setName] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [difficulty, setDifficulty] = useState<RatingLevel>(2);
  const [price, setPrice] = useState<RatingLevel>(2);
  const [highProtein, setHighProtein] = useState(false);
  const [highVegetables, setHighVegetables] = useState(false);
  const [ingredientsText, setIngredientsText] = useState("");
  const [photoError, setPhotoError] = useState<string | null>(null);

  const hasUploadedPhoto =
    imageUri.startsWith("data:") || imageUri.startsWith("blob:");

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setImageUri(dataUrl);
    } catch {
      setPhotoError("Could not use that image. Try another photo.");
    }
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
    setPhotoError(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
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
        <label className="mb-2 block text-xs font-bold uppercase text-[#7A7268]">
          Meal photo
        </label>

        {imageUri && (
          <div className="relative mb-3 aspect-[4/3] max-h-48 overflow-hidden rounded-xl border border-[#E8D5C4] bg-[#F5F0E8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUri}
              alt="Meal preview"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setImageUri("");
                setPhotoError(null);
                if (galleryInputRef.current) galleryInputRef.current.value = "";
              }}
              className="absolute right-2 top-2 rounded-lg bg-black/50 px-2 py-1 text-xs font-medium text-white"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#E8A598] bg-[#F5F0E8] px-4 py-2.5 text-sm font-semibold text-[#3D3832] hover:bg-[#F4E8DC]/80"
          >
            <Camera size={18} strokeWidth={1.75} aria-hidden />
            Take photo
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#E8D5C4] bg-[#FFFBF7] px-4 py-2.5 text-sm font-semibold text-[#3D3832] hover:bg-[#F5F0E8]"
          >
            <ImageIcon size={18} strokeWidth={1.75} aria-hidden />
            Choose photo
          </button>
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void handleImageFile(e.target.files?.[0])}
        />

        <MealPhotoCamera
          open={showCamera}
          onClose={() => setShowCamera(false)}
          onCapture={(dataUrl) => {
            setPhotoError(null);
            setImageUri(dataUrl);
          }}
        />

        {photoError && (
          <p className="mt-2 text-xs text-[#B85C4A]">{photoError}</p>
        )}

        <label className="mb-1 mt-3 block text-xs font-medium text-[#7A7268]">
          Or paste image URL
        </label>
        <input
          value={hasUploadedPhoto ? "" : imageUri}
          onChange={(e) => {
            setPhotoError(null);
            setImageUri(e.target.value);
          }}
          disabled={hasUploadedPhoto}
          className="w-full rounded-xl border border-[#E8D5C4] bg-[#FFFBF7] px-3 py-3 text-[#3D3832] disabled:opacity-50"
          placeholder="https://..."
        />
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
