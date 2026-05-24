"use client";

import { ConfirmModal } from "./ConfirmModal";

interface ShoppingInventoryMergeModalProps {
  open: boolean;
  cartItemName: string;
  existingName: string;
  onMerge: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
}

export function ShoppingInventoryMergeModal({
  open,
  cartItemName,
  existingName,
  onMerge,
  onCreateNew,
  onCancel,
}: ShoppingInventoryMergeModalProps) {
  return (
    <ConfirmModal
      open={open}
      title="Similar item in pantry"
      primaryLabel={`Add to ${existingName}`}
      secondaryLabel="Create new item"
      onPrimary={onMerge}
      onSecondary={onCreateNew}
      onCancel={onCancel}
    >
      <p>
        Add <strong>{cartItemName}</strong> to existing{" "}
        <strong>{existingName}</strong> pantry?
      </p>
    </ConfirmModal>
  );
}
