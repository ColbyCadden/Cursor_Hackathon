import type { Html5Qrcode } from "html5-qrcode";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { BrowserMultiFormatReader } from "@zxing/browser";

const BARCODE_FORMATS = [
  "upc_a",
  "upc_e",
  "ean_13",
  "ean_8",
  "code_128",
  "code_39",
  "codabar",
  "itf",
  "qr_code",
] as const;

type CropRegion = { x: number; y: number; w: number; h: number };

const CAPTURE_CROPS: CropRegion[] = [
  { x: 0, y: 0, w: 1, h: 1 },
  { x: 0.05, y: 0.25, w: 0.9, h: 0.5 },
  { x: 0.1, y: 0.3, w: 0.8, h: 0.4 },
  { x: 0, y: 0.4, w: 1, h: 0.25 },
];

let zxingReader: BrowserMultiFormatReader | null = null;

function getZxingReader(): BrowserMultiFormatReader {
  if (!zxingReader) {
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODABAR,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    zxingReader = new BrowserMultiFormatReader(hints);
  }
  return zxingReader;
}

function hasNativeBarcodeDetector(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasFromImage(
  img: HTMLImageElement,
  crop: CropRegion,
  enhance = false
): HTMLCanvasElement | null {
  const sourceWidth = img.naturalWidth || img.width;
  const sourceHeight = img.naturalHeight || img.height;
  if (!sourceWidth || !sourceHeight) return null;

  const sx = Math.floor(sourceWidth * crop.x);
  const sy = Math.floor(sourceHeight * crop.y);
  const sw = Math.max(1, Math.floor(sourceWidth * crop.w));
  const sh = Math.max(1, Math.floor(sourceHeight * crop.h));

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  if (enhance) {
    const imageData = ctx.getImageData(0, 0, sw, sh);
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const boosted = gray > 128 ? Math.min(255, gray * 1.15) : Math.max(0, gray * 0.85);
      const v = boosted;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas;
}

async function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File | null> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.95);
  });
  if (!blob) return null;
  return new File([blob], name, { type: "image/jpeg" });
}

async function detectWithNativeSource(
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap
): Promise<string | null> {
  if (!hasNativeBarcodeDetector()) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Detector = (window as any).BarcodeDetector as new (opts: {
      formats: string[];
    }) => {
      detect: (
        src: HTMLImageElement | HTMLCanvasElement | ImageBitmap
      ) => Promise<Array<{ rawValue?: string }>>;
    };

    const detector = new Detector({ formats: [...BARCODE_FORMATS] });
    const results = await detector.detect(source);
    return results[0]?.rawValue?.trim() ?? null;
  } catch {
    return null;
  }
}

async function detectWithHtml5Qrcode(file: File, scanner: Html5Qrcode): Promise<string | null> {
  try {
    const result = await scanner.scanFileV2(file, false);
    return result.decodedText?.trim() ?? null;
  } catch {
    return null;
  }
}

function detectWithZxingFromCanvas(canvas: HTMLCanvasElement): string | null {
  try {
    const result = getZxingReader().decodeFromCanvas(canvas);
    return result.getText()?.trim() ?? null;
  } catch {
    return null;
  }
}

async function detectWithZxingFromImage(img: HTMLImageElement): Promise<string | null> {
  try {
    const result = await getZxingReader().decodeFromImageElement(img);
    return result.getText()?.trim() ?? null;
  } catch {
    return null;
  }
}

/** Run native BarcodeDetector, html5-qrcode, and ZXing together; return first hit. */
async function decodeFromSources(
  visual: HTMLImageElement | HTMLCanvasElement,
  file: File,
  scanner: Html5Qrcode
): Promise<string | null> {
  const decoders: Array<() => Promise<string | null>> = [
    () => detectWithNativeSource(visual),
    () => detectWithHtml5Qrcode(file, scanner),
  ];

  if (visual instanceof HTMLCanvasElement) {
    decoders.push(() => Promise.resolve(detectWithZxingFromCanvas(visual)));
  } else {
    decoders.push(() => detectWithZxingFromImage(visual));
  }

  const results = await Promise.all(decoders.map((decode) => decode().catch(() => null)));
  return results.find((value) => Boolean(value)) ?? null;
}

const LIVE_CROPS: CropRegion[] = [
  { x: 0.05, y: 0.28, w: 0.9, h: 0.44 },
  { x: 0, y: 0, w: 1, h: 1 },
];

export function captureVideoFrame(
  video: HTMLVideoElement,
  crop: CropRegion = LIVE_CROPS[0]
): HTMLCanvasElement | null {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (!sourceWidth || !sourceHeight || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return null;
  }

  const sx = Math.floor(sourceWidth * crop.x);
  const sy = Math.floor(sourceHeight * crop.y);
  const sw = Math.max(1, Math.floor(sourceWidth * crop.w));
  const sh = Math.max(1, Math.floor(sourceHeight * crop.h));

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
}

/** Decode from a live video frame — runs all decoders in parallel on rotating crops. */
export async function decodeBarcodeFromVideoFrame(
  video: HTMLVideoElement,
  scanner: Html5Qrcode,
  cropIndex = 0
): Promise<string | null> {
  const crop = LIVE_CROPS[cropIndex % LIVE_CROPS.length];
  const canvas = captureVideoFrame(video, crop);
  if (!canvas) return null;

  const file = await canvasToFile(canvas, "live-frame.jpg");
  if (!file) return null;

  const decoded = await decodeFromSources(canvas, file, scanner);
  if (decoded) return decoded;

  const altCrop = LIVE_CROPS[(cropIndex + 1) % LIVE_CROPS.length];
  const altCanvas = captureVideoFrame(video, altCrop);
  if (!altCanvas) return null;

  const altFile = await canvasToFile(altCanvas, "live-frame-alt.jpg");
  if (!altFile) return null;

  return decodeFromSources(altCanvas, altFile, scanner);
}

async function decodeImageElement(
  img: HTMLImageElement,
  scanner: Html5Qrcode,
  originalFile: File
): Promise<string | null> {
  const fullImage = await decodeFromSources(img, originalFile, scanner);
  if (fullImage) return fullImage;

  for (const enhance of [false, true]) {
    for (const crop of CAPTURE_CROPS) {
      if (!enhance && crop.x === 0 && crop.y === 0 && crop.w === 1 && crop.h === 1) {
        continue;
      }

      const canvas = canvasFromImage(img, crop, enhance);
      if (!canvas) continue;

      const cropFile = await canvasToFile(
        canvas,
        enhance ? "barcode-enhanced.jpg" : "barcode-crop.jpg"
      );
      if (!cropFile) continue;

      const decoded = await decodeFromSources(canvas, cropFile, scanner);
      if (decoded) return decoded;
    }
  }

  return null;
}

/** Decode barcode from a photo using native, html5-qrcode, and ZXing in parallel. */
export async function decodeBarcodeFromPhoto(
  file: File,
  scanner: Html5Qrcode
): Promise<string | null> {
  const img = await loadImageFromFile(file);
  return decodeImageElement(img, scanner, file);
}

export function normalizeBarcode(raw: string): string {
  const digits = raw.trim().replace(/\D/g, "");
  return digits || raw.trim();
}
