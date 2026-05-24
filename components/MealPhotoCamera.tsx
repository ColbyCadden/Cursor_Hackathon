"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera, X } from "lucide-react";

interface MealPhotoCameraProps {
  open: boolean;
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export function MealPhotoCamera({
  open,
  onCapture,
  onClose,
}: MealPhotoCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera not supported in this browser. Use Choose photo instead.");
      return;
    }

    stopCamera();
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();
      setReady(true);
    } catch (err) {
      const denied =
        err instanceof DOMException && err.name === "NotAllowedError";
      setError(
        denied
          ? "Camera permission denied. Allow camera access in your browser settings."
          : "Could not open camera. Use Choose photo instead."
      );
      stopCamera();
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setError(null);
      return;
    }

    void startCamera();
    return () => stopCamera();
  }, [open, facingMode, startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close camera"
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md rounded-t-2xl border border-[#E8D5C4] bg-[#FFFBF7] p-4 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#3D3832]">Take meal photo</h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-[#7A7268] hover:bg-[#F5F0E8]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className="aspect-[4/3] w-full object-cover"
          />
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
              Starting camera…
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() =>
              setFacingMode((prev) =>
                prev === "environment" ? "user" : "environment"
              )
            }
            disabled={!!error}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#E8D5C4] px-4 py-2.5 text-sm font-medium text-[#6B5E52] disabled:opacity-50"
          >
            <SwitchCamera size={18} aria-hidden />
            Flip
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!ready || !!error}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#E8A598] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#D97F68]"
          >
            <Camera size={18} aria-hidden />
            Capture photo
          </button>
        </div>
      </div>
    </div>
  );
}
