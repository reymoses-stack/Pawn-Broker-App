import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera, RefreshCw, Upload, Check, AlertCircle, Settings2, X,
  FlipHorizontal2
} from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  initialPhotoUrl?: string;
  /** 'portrait' = square crop (KYC), 'landscape' = 4:3 (ornament/item photo) */
  mode?: 'portrait' | 'landscape';
  label?: string;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCapture,
  initialPhotoUrl,
  mode = 'portrait',
  label
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // Track stream in ref, not state

  const [photo, setPhoto] = useState<string | null>(initialPhotoUrl || null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Sync photo if initialPhotoUrl changes
  useEffect(() => {
    setPhoto(initialPhotoUrl || null);
  }, [initialPhotoUrl]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isFlashing, setIsFlashing] = useState(false);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  const isLandscape = mode === 'landscape';

  // ─── Enumerate cameras ──────────────────────────────────────────────────
  const enumerateCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        const external = videoDevices.find(d =>
          d.label && !d.label.toLowerCase().includes('facetime') && !d.label.toLowerCase().includes('built-in')
        );
        const preferred = external || videoDevices[0];
        setSelectedDeviceId(preferred.deviceId);
        return preferred.deviceId;
      }
    } catch {}
    return undefined;
  }, [selectedDeviceId]);

  // ─── Stop camera ────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    // Detach srcObject from video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setCameraLoading(false);
  }, []);

  // ─── Start camera ───────────────────────────────────────────────────────
  // FIX: We use a ref for the video element so we DON'T rely on isStreaming
  // to render the <video> tag. The video element is ALWAYS in the DOM (just
  // hidden) so videoRef.current is never null when we need to assign srcObject.
  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraError(null);
    setCameraLoading(true);
    stopCamera();

    // If no deviceId yet, enumerate first
    let camId = deviceId || selectedDeviceId;
    if (!camId) {
      camId = (await enumerateCameras()) || '';
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: camId
          ? { deviceId: { exact: camId }, width: { ideal: isLandscape ? 1280 : 640 }, height: { ideal: isLandscape ? 960 : 640 } }
          : { facingMode: isLandscape ? 'environment' : 'user', width: { ideal: 1280 }, height: { ideal: 960 } }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      // Assign to video element — video element is ALWAYS rendered (just hidden)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }

      setIsStreaming(true);
      setMirrorMode(!isLandscape);
      setCameraLoading(false);

      // Re-enumerate to get labels after permission granted
      await enumerateCameras();
    } catch (err: any) {
      setCameraLoading(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Click the camera icon in the address bar to allow access.'
          : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
            ? 'No camera found. Make sure your USB webcam is plugged in and not busy.'
            : `Camera error: ${err.message || err.name}. Try a different camera or upload a photo.`
      );
    }
  }, [selectedDeviceId, isLandscape, stopCamera, enumerateCameras]);

  // ─── Capture photo ──────────────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isStreaming) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    if (isLandscape) {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = Math.round(w * 0.75);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (mirrorMode) { ctx.translate(w, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, 0, (h - canvas.height) / 2, w, canvas.height, 0, 0, w, canvas.height);
      }
    } else {
      const size = Math.min(video.videoWidth || 480, video.videoHeight || 480) || 480;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (mirrorMode) { ctx.translate(size, 0); ctx.scale(-1, 1); }
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
      }
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPhoto(dataUrl);
    onCapture(dataUrl);
    stopCamera();
  }, [isLandscape, mirrorMode, isStreaming, onCapture, stopCamera]);

  const handleDeviceChange = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    startCamera(newDeviceId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      setPhoto(result);
      onCapture(result);
    };
    reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera(selectedDeviceId);
  };

  // Enumerate cameras on mount (but don't auto-start — wait for button click)
  useEffect(() => {
    enumerateCameras();
    return () => stopCamera();
  }, []); // eslint-disable-line

  const boxW = isLandscape ? 'w-full' : 'w-52';
  const boxH = isLandscape ? 'h-40 sm:h-48' : 'h-52';

  return (
    <div className="space-y-3">
      {/* Label row */}
      <div className="flex items-center justify-between text-xs text-slate-700">
        <span className="font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-amber-600" />
          <span>{label || (isLandscape ? 'Ornament / Item Photo' : 'Customer Live Portrait')}</span>
        </span>
        {!isLandscape && (
          <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            KYC / Section 25 Compliant
          </span>
        )}
      </div>

      {/* Camera device selector */}
      {availableDevices.length > 1 && (
        <div className="flex items-center gap-1.5 bg-amber-50/70 p-1.5 rounded-xl border border-amber-200 text-xs">
          <Settings2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="text-[10px] font-bold text-slate-600 shrink-0">Camera:</span>
          <select
            value={selectedDeviceId}
            onChange={e => handleDeviceChange(e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-lg text-[11px] font-semibold text-slate-800 py-0.5 px-1.5 focus:outline-none"
          >
            {availableDevices.map((dev, idx) => (
              <option key={dev.deviceId || idx} value={dev.deviceId}>
                {dev.label
                  ? (dev.label.toLowerCase().includes('facetime') || dev.label.toLowerCase().includes('built-in'))
                    ? `🖥 ${dev.label}`
                    : `🎥 ${dev.label}`
                  : `Camera ${idx + 1}`
                }
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Camera viewport */}
      <div className={`relative ${boxW} ${boxH} ${isLandscape ? '' : 'mx-auto'} bg-slate-900 border-2 border-amber-300/80 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg`}>

        {/* Photo preview (shown after capture) */}
        {photo && (
          <div className="absolute inset-0 z-20">
            <img src={photo} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/60 flex items-center justify-center transition-all duration-200 group">
              <button type="button" onClick={retakePhoto}
                className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md transition">
                <RefreshCw className="w-3.5 h-3.5" />Retake
              </button>
            </div>
            <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-md z-10">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* THE FIX: video is ALWAYS in the DOM — just hidden behind photo or idle state.
            This ensures videoRef.current is always non-null when we assign srcObject. */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isStreaming && !photo ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } ${mirrorMode ? 'scale-x-[-1]' : ''}`}
        />

        {/* Framing overlay — shown when streaming */}
        {isStreaming && !photo && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            {isLandscape
              ? <div className="w-4/5 h-4/5 border-2 border-dashed border-amber-400/70 rounded-xl" />
              : <div className="w-36 h-44 rounded-full border-2 border-dashed border-amber-400/70" />
            }
            {isFlashing && <div className="absolute inset-0 bg-white" />}
          </div>
        )}

        {/* Controls bar — shown when streaming */}
        {isStreaming && !photo && (
          <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center items-center gap-2 px-3">
            <button type="button" onClick={() => setMirrorMode(m => !m)}
              className={`p-1.5 rounded-full shadow-md text-xs transition ${mirrorMode ? 'bg-amber-500 text-slate-950' : 'bg-slate-800/80 text-white hover:bg-slate-700'}`}
              title="Toggle mirror">
              <FlipHorizontal2 className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={capturePhoto}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black rounded-full shadow-xl flex items-center gap-1.5 transition active:scale-95 border border-white">
              <Camera className="w-4 h-4 text-amber-950" />
              {isLandscape ? 'Snap Ornament' : 'Snap Customer'}
            </button>
            <button type="button" onClick={stopCamera}
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-white text-xs rounded-full shadow-md" title="Cancel">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Idle / loading state (no photo, not streaming) */}
        {!photo && !isStreaming && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4">
            {cameraLoading ? (
              <>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2 animate-pulse">
                  <Camera className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-xs font-bold text-slate-300">Starting camera…</div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2.5">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-200">Ready to Capture</div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {availableDevices.length > 0
                    ? `${availableDevices.length} camera${availableDevices.length > 1 ? 's' : ''} detected`
                    : 'Connect USB webcam or use built-in'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-3.5">
                  <button type="button" onClick={() => startCamera()}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition active:scale-95">
                    <Camera className="w-3.5 h-3.5" />Open Camera
                  </button>
                  <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />Upload
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {cameraError && (
        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <span>{cameraError}</span>
            <button type="button" onClick={() => { setCameraError(null); startCamera(); }} className="ml-2 text-blue-700 hover:underline font-bold">
              Retry
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
