"use client";

import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Slider from "@mui/material/Slider";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CropIcon from "@mui/icons-material/Crop";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/gif";
const ACCEPTED_TYPES = ACCEPT_ATTR.split(",");
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Longest edge of the cropped output, in pixels. */
const MAX_OUTPUT_EDGE = 1600;

const ASPECT_PRESETS: { label: string; value: number }[] = [
  { label: "1:1", value: 1 },
  { label: "3:4", value: 3 / 4 },
  { label: "4:3", value: 4 / 3 },
];

export type ImageUploadFolder = "books" | "reviewers" | "editorial-board" | "issues";

export interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: ImageUploadFolder;
  /** Preview shape. Defaults to "circle". */
  variant?: "circle" | "rect";
  /**
   * Initial crop aspect ratio (width / height). Use 1 for people photos and
   * 3 / 4 for covers / books. Defaults to 1 for "circle" and 3 / 4 for "rect".
   */
  aspect?: number;
}

type CropSource = { url: string; name: string; file?: File; revoke: boolean };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Draws the cropped area onto a canvas and returns a WebP (or JPEG fallback) blob. */
async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const img = await loadImage(src);
  const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);

  let blob: Blob | null = null;
  try {
    blob = await canvasToBlob(canvas, "image/webp", 0.9);
    if (blob && blob.type !== "image/webp") blob = null; // browser ignored webp
    if (!blob) blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
  } catch {
    throw new Error("This image cannot be edited in the browser (cross-origin). Upload a new file instead.");
  }
  if (!blob) throw new Error("Could not process image");
  return blob;
}

function baseName(name: string): string {
  return (name.replace(/\.[^.]+$/, "") || "image").slice(0, 60);
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  folder,
  variant = "circle",
  aspect,
}: ImageUploadFieldProps) {
  const { enqueueSnackbar } = useSnackbar();
  const defaultAspect = aspect ?? (variant === "rect" ? 3 / 4 : 1);

  const [uploading, setUploading] = React.useState(false);
  const [loadingExisting, setLoadingExisting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [source, setSource] = React.useState<CropSource | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [cropAspect, setCropAspect] = React.useState(defaultAspect);
  const [croppedArea, setCroppedArea] = React.useState<Area | null>(null);

  const closeCropper = React.useCallback(() => {
    setSource((prev) => {
      if (prev?.revoke) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  // Revoke any outstanding object URL on unmount.
  const sourceRef = React.useRef<CropSource | null>(null);
  sourceRef.current = source;
  React.useEffect(
    () => () => {
      if (sourceRef.current?.revoke) URL.revokeObjectURL(sourceRef.current.url);
    },
    []
  );

  const openCropper = (next: CropSource) => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropAspect(defaultAspect);
    setCroppedArea(null);
    setSource(next);
  };

  const upload = async (blob: Blob, fileName: string) => {
    if (blob.size > MAX_UPLOAD_BYTES) throw new Error("Image must be smaller than 5 MB");
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("folder", folder);
    const res = await fetch("/api/uploads/image", { method: "POST", body: formData });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.url) throw new Error(body?.error ?? "Upload failed");
    return body.url as string;
  };

  const runUpload = async (getBlob: () => Promise<{ blob: Blob; name: string }>) => {
    setError(null);
    setUploading(true);
    try {
      const { blob, name } = await getBlob();
      const url = await upload(blob, name);
      onChange(url);
      enqueueSnackbar("Image uploaded", { variant: "success" });
      closeCropper();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      const message = "Only JPEG, PNG, WEBP, or GIF images are supported";
      setError(message);
      enqueueSnackbar(message, { variant: "error" });
      return;
    }
    setError(null);
    openCropper({ url: URL.createObjectURL(file), name: file.name, file, revoke: true });
  };

  const handleAdjustExisting = async () => {
    if (!value) return;
    setLoadingExisting(true);
    setError(null);
    try {
      // Fetching into a same-origin object URL keeps the canvas untainted.
      const res = await fetch(value, { mode: "cors", cache: "no-cache" });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const name = decodeURIComponent(value.split("/").pop()?.split("?")[0] ?? "image");
      openCropper({ url: URL.createObjectURL(blob), name, revoke: true });
    } catch {
      try {
        // Fallback: load directly with crossOrigin; works if the host sends CORS headers for images.
        await loadImage(value);
        openCropper({ url: value, name: "image", revoke: false });
      } catch {
        const message = "This image cannot be adjusted here (cross-origin). Upload a new file instead.";
        setError(message);
        enqueueSnackbar(message, { variant: "warning" });
      }
    } finally {
      setLoadingExisting(false);
    }
  };

  const applyCrop = () => {
    if (!source || !croppedArea) return;
    const src = source;
    const area = croppedArea;
    void runUpload(async () => {
      const blob = await cropToBlob(src.url, area);
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      return { blob, name: `${baseName(src.name)}.${ext}` };
    });
  };

  const useOriginal = () => {
    const file = source?.file;
    if (!file) return;
    void runUpload(async () => ({ blob: file, name: file.name }));
  };

  const previewWidth = variant === "circle" ? 72 : Math.round(96 * Math.min(defaultAspect, 1.5));
  const previewHeight = variant === "circle" ? 72 : Math.round(previewWidth / defaultAspect);
  const busy = uploading || loadingExisting;

  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        {variant === "circle" ? (
          <Avatar src={value || undefined} sx={{ width: previewWidth, height: previewHeight }} />
        ) : (
          <Box
            role="img"
            aria-label={value ? `${label} preview` : "No image"}
            sx={{
              width: previewWidth,
              height: previewHeight,
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              backgroundImage: value ? `url(${value})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              flexShrink: 0,
            }}
          />
        )}
        <Stack spacing={1} alignItems="flex-start">
          <Button
            component="label"
            variant="outlined"
            size="small"
            startIcon={uploading ? <CircularProgress size={14} /> : <UploadFileIcon />}
            disabled={busy}
          >
            {uploading ? "Uploading..." : value ? "Replace Image" : "Upload Image"}
            <input type="file" hidden accept={ACCEPT_ATTR} onChange={handleFileChange} />
          </Button>
          {value && (
            <Button
              size="small"
              startIcon={loadingExisting ? <CircularProgress size={14} /> : <CropIcon />}
              onClick={handleAdjustExisting}
              disabled={busy}
            >
              Adjust
            </Button>
          )}
        </Stack>
      </Stack>
      {error && (
        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
        JPEG, PNG, WEBP, or GIF. You can crop and zoom before uploading. Maximum 5 MB.
      </Typography>

      <Dialog open={!!source} onClose={uploading ? undefined : closeCropper} fullWidth maxWidth="sm">
        <DialogTitle>Adjust Image</DialogTitle>
        <DialogContent>
          <Box sx={{ position: "relative", width: "100%", height: { xs: 300, sm: 380 }, bgcolor: "grey.900" }}>
            {source && (
              <Cropper
                image={source.url}
                crop={crop}
                zoom={zoom}
                minZoom={1}
                maxZoom={4}
                aspect={cropAspect}
                cropShape={variant === "circle" && cropAspect === 1 ? "round" : "rect"}
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, areaPixels) => setCroppedArea(areaPixels)}
                mediaProps={{ crossOrigin: "anonymous" }}
              />
            )}
          </Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <ZoomOutIcon fontSize="small" color="action" />
            <Slider
              aria-label="Zoom"
              value={zoom}
              min={1}
              max={4}
              step={0.01}
              onChange={(_e, v) => setZoom(v as number)}
            />
            <ZoomInIcon fontSize="small" color="action" />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Aspect
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={ASPECT_PRESETS.some((p) => p.value === cropAspect) ? cropAspect : null}
              onChange={(_e, v) => {
                if (typeof v === "number") setCropAspect(v);
              }}
            >
              {ASPECT_PRESETS.map((p) => (
                <ToggleButton key={p.label} value={p.value}>
                  {p.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCropper} disabled={uploading}>
            Cancel
          </Button>
          {source?.file && (
            <Button onClick={useOriginal} disabled={uploading}>
              Use Original
            </Button>
          )}
          <Button
            variant="contained"
            onClick={applyCrop}
            disabled={uploading || !croppedArea}
            startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {uploading ? "Uploading..." : "Crop & Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
