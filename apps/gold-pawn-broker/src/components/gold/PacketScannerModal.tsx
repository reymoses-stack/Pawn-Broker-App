import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import {
  QrCode, X, CheckCircle2, AlertCircle, ArrowRight,
  Gem, Smartphone, User, Camera, ScanLine, Zap, Wifi,
  Settings2, Loader2, RefreshCw, Package
} from 'lucide-react';
import { Mortgage } from '../../types';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';

interface PacketScannerModalProps {
  onClose: () => void;
}

type ScanMode = 'camera' | 'hid' | 'manual';

export const PacketScannerModal: React.FC<PacketScannerModalProps> = ({ onClose }) => {
  const {
    packets, mortgages, customers,
    setSelectedMortgage, setSelectedCustomer,
    setIsCustomerPortalOpen, setPortalCustomerId,
    setActiveTab, language
  } = useApp();

  const [mode, setMode] = useState<ScanMode>('hid');
  const [inputCode, setInputCode] = useState('');
  const [scannedPacket, setScannedPacket] = useState<any | null>(null);
  const [scannedCustomer, setScannedCustomer] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastScannedRaw, setLastScannedRaw] = useState<string | null>(null);
  const [scanFlash, setScanFlash] = useState(false);

  // Camera state — use refs for stream and animation frame
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<'scanning' | 'found' | 'error'>('scanning');
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  // ─── Resolve barcode/QR code to a record ──────────────────────────────────
  const resolveCode = useCallback((rawCode: string) => {
    if (!rawCode?.trim()) return;

    let code = rawCode.trim();
    setLastScannedRaw(code);
    setErrorMsg(null);
    setScannedPacket(null);
    setScannedCustomer(null);

    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 300);

    // ── Strip common prefixes from QR/barcodes ──
    let cleanCode = code;
    if (cleanCode.startsWith('NEXUS:')) cleanCode = cleanCode.substring(6);
    if (cleanCode.startsWith('MORTGAGE:')) cleanCode = cleanCode.substring(9);
    else if (cleanCode.startsWith('PACKET:')) cleanCode = cleanCode.substring(7);
    else if (cleanCode.startsWith('CUSTOMER:')) cleanCode = cleanCode.substring(9);
    else if (cleanCode.startsWith('ID:')) cleanCode = cleanCode.substring(3);

    // ── Check if JSON format ──
    let extractedCustId: string | null = null;
    let extractedMortId: string | null = null;
    let extractedPktId: string | null = null;

    if (code.startsWith('{') && code.endsWith('}')) {
      try {
        const parsed = JSON.parse(code);
        extractedCustId = parsed.customerId || parsed.customer || parsed.c || null;
        extractedMortId = parsed.mortgageNumber || parsed.mortgage || parsed.m || null;
        extractedPktId = parsed.packetId || parsed.packet || parsed.p || null;
      } catch {}
    }

    // ── Check if URL / query string format ──
    if (!extractedCustId && !extractedMortId && (code.includes('portal=') || code.includes('c=') || code.includes('m=') || code.startsWith('http'))) {
      try {
        const urlObj = new URL(code.startsWith('http') ? code : `http://dummy.com/${code}`);
        extractedCustId = urlObj.searchParams.get('c');
        extractedMortId = urlObj.searchParams.get('m');
        extractedPktId = urlObj.searchParams.get('p') || urlObj.searchParams.get('pkt');
      } catch {
        const matchC = code.match(/[?&]c=([^&#]+)/);
        if (matchC) extractedCustId = decodeURIComponent(matchC[1]);
        const matchM = code.match(/[?&]m=([^&#]+)/);
        if (matchM) extractedMortId = decodeURIComponent(matchM[1]);
        const matchP = code.match(/[?&]p(?:kt)?=([^&#]+)/);
        if (matchP) extractedPktId = decodeURIComponent(matchP[1]);
      }
    }

    const upperCode = cleanCode.toUpperCase().trim();
    const alphanumCode = upperCode.replace(/[^A-Z0-9]/g, '');

    // ── 1. Priority: Check Mortgage match (if extractedMortId or barcode matches mortgage) ──
    const targetMortNumber = (extractedMortId || upperCode).toUpperCase();
    const targetMortAlpha = targetMortNumber.replace(/[^A-Z0-9]/g, '');

    const foundMortgage = mortgages.find(m => {
      const mNumUpper = m.mortgageNumber.toUpperCase();
      const mIdUpper = m.id.toUpperCase();
      const mPktUpper = (m.packetId || '').toUpperCase();
      return (
        mNumUpper === targetMortNumber ||
        mIdUpper === targetMortNumber ||
        (mPktUpper && mPktUpper === targetMortNumber) ||
        (targetMortAlpha.length >= 4 && (
          mNumUpper.replace(/[^A-Z0-9]/g, '') === targetMortAlpha ||
          mIdUpper.replace(/[^A-Z0-9]/g, '') === targetMortAlpha
        ))
      );
    });

    if (foundMortgage) {
      const pkt = packets.find(p => p.mortgageId === foundMortgage.id || p.id === foundMortgage.packetId);
      const cust = customers.find(c => c.id === foundMortgage.customerId);
      const netWeight = foundMortgage.items?.reduce((s, i) => s + i.netWeight, 0) || 0;
      setScannedPacket({
        packet: pkt || {
          id: foundMortgage.packetId || `PKT-${foundMortgage.mortgageNumber.replace(/[^0-9]/g, '')}`,
          status: 'In Locker',
          lockerId: 'L-01',
          rack: 'R-01',
          tray: 'T-01',
          totalNetWeight: netWeight,
          itemCount: foundMortgage.items?.length || 1
        },
        mortgage: foundMortgage,
        customer: cust
      });
      return;
    }

    // ── 2. Gold Packet lookup (PKT-...) ──
    const targetPkt = (extractedPktId || upperCode).toUpperCase();
    const targetPktAlpha = targetPkt.replace(/[^A-Z0-9]/g, '');

    const foundPacket = packets.find(p => {
      const pId = p.id.toUpperCase();
      const pMort = p.mortgageId.toUpperCase();
      return (
        pId === targetPkt ||
        pMort === targetPkt ||
        (targetPktAlpha.length >= 4 && (
          pId.replace(/[^A-Z0-9]/g, '') === targetPktAlpha ||
          pMort.replace(/[^A-Z0-9]/g, '') === targetPktAlpha
        ))
      );
    });

    if (foundPacket) {
      const mort = mortgages.find(m => m.id === foundPacket.mortgageId);
      const cust = customers.find(c => c.id === foundPacket.customerId);
      setScannedPacket({ packet: foundPacket, mortgage: mort, customer: cust });
      return;
    }

    // ── 3. Customer lookup (CUS-... or Phone or Name) ──
    const targetCustId = (extractedCustId || upperCode).toUpperCase();
    const targetCustAlpha = targetCustId.replace(/[^A-Z0-9]/g, '');
    const numericCode = code.replace(/\D/g, '');

    const foundCust = customers.find(c => {
      const cId = c.id.toUpperCase();
      const cPhone = c.mobile.replace(/\D/g, '');
      const cName = c.name.toUpperCase();
      return (
        cId === targetCustId ||
        (targetCustAlpha.length >= 4 && cId.replace(/[^A-Z0-9]/g, '') === targetCustAlpha) ||
        (numericCode.length >= 10 && cPhone.endsWith(numericCode.slice(-10))) ||
        cName === upperCode
      );
    });

    if (foundCust) {
      const custMortgages = mortgages.filter(m => m.customerId === foundCust.id);
      const activeMort = custMortgages.filter(m => ['Active', 'Due', 'Overdue'].includes(m.status));
      setScannedCustomer({
        customer: foundCust,
        mortgages: custMortgages,
        activeMortgages: activeMort,
        totalOutstanding: activeMort.reduce((s, m) => s + m.outstandingPrincipal, 0),
        totalNetGrams: custMortgages.reduce((s, m) => s + (m.items?.reduce((w, i) => w + i.netWeight, 0) || 0), 0),
        targetMortgageNumber: extractedMortId
      });
      return;
    }

    // ── Nothing found ──
    const isEmpty = customers.length === 0 && mortgages.length === 0;
    setErrorMsg(
      isEmpty
        ? `No data found. The system has no customers or mortgages yet — create a mortgage first, then scan its pawn ticket or packet label.`
        : `No record matching "${code}". Scanned code: "${cleanCode}". Try scanning the Mortgage barcode or Passbook QR.`
    );
  }, [customers, mortgages, packets]);

  // ─── HID barcode scanner hook ──────────────────────────────────────────────
  useBarcodeScanner(
    (code) => { setInputCode(code); resolveCode(code); },
    { enabled: mode === 'hid', minLength: 3, maxCharInterval: 55 }
  );

  useEffect(() => {
    if (mode === 'manual') setTimeout(() => manualInputRef.current?.focus(), 100);
  }, [mode]);

  // ─── Camera enumeration ────────────────────────────────────────────────────
  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(d => d.kind === 'videoinput');
      setAvailableCameras(cams);
      if (!selectedCameraId && cams.length > 0) {
        const external = cams.find(c => c.label && !c.label.toLowerCase().includes('facetime'));
        setSelectedCameraId(external?.deviceId || cams[0].deviceId);
      }
    } catch {}
  };

  // ─── Stop camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraRunning(false);
    setCameraLoading(false);
  }, []);

  // ─── QR frame decode loop ─────────────────────────────────────────────────
  const startDecodeLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const decode = () => {
      if (!video.paused && !video.ended && video.readyState >= 2 && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          try {
            const qrCode = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });
            if (qrCode?.data) {
              setScanStatus('found');
              resolveCode(qrCode.data);
              stopCamera();
              return;
            }
          } catch {}
        }
      }
      animFrameRef.current = requestAnimationFrame(decode);
    };
    animFrameRef.current = requestAnimationFrame(decode);
  }, [resolveCode, stopCamera]);

  // ─── Start camera QR ──────────────────────────────────────────────────────
  // FIX: Video element is ALWAYS in the DOM (hidden with opacity/CSS).
  // This means videoRef.current is never null when we assign srcObject.
  const startCameraQR = useCallback(async (deviceId?: string) => {
    setCameraError(null);
    setScanStatus('scanning');
    setCameraLoading(true);
    stopCamera();

    const camId = deviceId || selectedCameraId;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: camId
          ? { deviceId: { exact: camId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;

      // videoRef.current is always available because <video> is always in DOM
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraRunning(true);
      setCameraLoading(false);
      await enumerateCameras();
      startDecodeLoop();
    } catch (err: any) {
      setCameraLoading(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Click the lock icon in the address bar → allow Camera.'
          : err.name === 'NotFoundError'
            ? 'No camera found. Make sure your USB webcam is plugged in.'
            : `Camera error: ${err.message || err.name}`
      );
    }
  }, [selectedCameraId, stopCamera, startDecodeLoop]);

  // Camera mode lifecycle
  useEffect(() => {
    if (mode === 'camera') {
      enumerateCameras().then(() => startCameraQR());
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]); // eslint-disable-line

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleCameraChange = (id: string) => { setSelectedCameraId(id); startCameraQR(id); };

  const handleOpenMortgage = (m?: Mortgage) => {
    const mort = m || scannedPacket?.mortgage;
    if (mort) { setSelectedMortgage(mort); onClose(); }
  };
  const handleOpenCustomerPortal = () => {
    if (scannedCustomer?.customer) {
      setPortalCustomerId(scannedCustomer.customer.id);
      setIsCustomerPortalOpen(true);
      onClose();
    }
  };
  const handleViewCustomerProfile = () => {
    if (scannedCustomer?.customer) {
      setSelectedCustomer(scannedCustomer.customer);
      setActiveTab('customers');
      onClose();
    }
  };

  const hasResult = scannedPacket || scannedCustomer;
  const hasData = customers.length > 0 || mortgages.length > 0;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-amber-200/80 my-auto bg-white/98">

        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-white to-amber-500/5 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/15 text-amber-900 rounded-xl border border-amber-400/50">
              <QrCode className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {language === 'ta' ? 'பாக்கெட் & வாடிக்கையாளர் QR ஸ்கேனர்' : 'Packet & Customer QR Scanner'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Camera QR decode · USB HID Barcode Scanner · Manual Entry
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 text-xs text-slate-700">

          {/* No data warning */}
          {!hasData && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs">
              <Package className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong>No records yet.</strong> Create at least one customer and mortgage first, then scan the pawn ticket or packet label barcode.
              </div>
            </div>
          )}

          {/* Mode selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
            {([
              { key: 'hid' as const, icon: <Zap className="w-3.5 h-3.5" />, label: 'HID Scanner', desc: 'USB Barcode Gun' },
              { key: 'camera' as const, icon: <Camera className="w-3.5 h-3.5" />, label: 'Camera QR', desc: 'Webcam Decode' },
              { key: 'manual' as const, icon: <ScanLine className="w-3.5 h-3.5" />, label: 'Manual', desc: 'Type / Paste' },
            ]).map(m => (
              <button key={m.key} type="button"
                onClick={() => { setMode(m.key); setScannedPacket(null); setScannedCustomer(null); setErrorMsg(null); setInputCode(''); }}
                className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl font-bold transition text-center ${
                  mode === m.key ? 'bg-white text-amber-900 shadow-sm border border-amber-300' : 'text-slate-500 hover:text-slate-800'
                }`}>
                {m.icon}
                <span className="text-[11px] font-black">{m.label}</span>
                <span className="text-[9px] font-medium opacity-70">{m.desc}</span>
              </button>
            ))}
          </div>

          {/* ── HID Mode UI ── */}
          {mode === 'hid' && (
            <div className={`relative flex flex-col items-center justify-center h-40 rounded-2xl border-2 transition-colors text-center p-4 overflow-hidden
              ${scanFlash ? 'bg-amber-400/20 border-amber-500' : hasResult ? 'border-emerald-400 bg-emerald-50/30' : 'border-dashed border-amber-400/70 bg-amber-50/40'}`}>
              {scanFlash && <div className="absolute inset-0 bg-amber-400/30 pointer-events-none" />}
              <div className="relative z-10 space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-amber-700" />
                </div>
                <div className="font-black text-slate-900">
                  {hasResult ? '✅ Barcode Detected!' : 'HID Barcode Scanner Ready'}
                </div>
                <div className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  {hasResult
                    ? `Read: ${lastScannedRaw}`
                    : 'Pull the trigger on your USB barcode gun and point it at any packet label or customer QR — fires automatically'}
                </div>
                {!hasResult && (
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-700 font-bold mt-1">
                    <Wifi className="w-3 h-3 animate-pulse" />
                    <span>Listening for scanner input…</span>
                  </div>
                )}
              </div>
              {!hasResult && (
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-pulse opacity-60" />
              )}
            </div>
          )}

          {/* ── Camera QR Mode UI ── */}
          {mode === 'camera' && (
            <div className="space-y-2">
              {availableCameras.length > 1 && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <Settings2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-600 shrink-0">Camera:</span>
                  <select value={selectedCameraId} onChange={e => handleCameraChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 py-0.5 px-1.5 focus:outline-none">
                    {availableCameras.map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label ? (d.label.toLowerCase().includes('facetime') ? `🖥 ${d.label}` : `🎥 ${d.label}`) : `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => startCameraQR()}
                    className="shrink-0 p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition" title="Restart camera">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Camera viewport — video ALWAYS in DOM (just hidden) so videoRef is never null */}
              <div className={`relative w-full h-52 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 transition-colors ${
                scanStatus === 'found' ? 'border-emerald-500' : 'border-amber-400/60'
              }`}>

                {/* THE FIX: <video> is always rendered, just hidden when not running */}
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${cameraRunning ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* QR targeting overlay */}
                {cameraRunning && scanStatus === 'scanning' && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <div className="w-44 h-44 relative">
                      <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-amber-400 rounded-tl-md" />
                      <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-amber-400 rounded-tr-md" />
                      <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-amber-400 rounded-bl-md" />
                      <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-amber-400 rounded-br-md" />
                      {/* Moving scan line */}
                      <div className="absolute left-1 right-1 h-0.5 bg-amber-400/80 animate-[bounce_1.5s_ease-in-out_infinite]" style={{ top: '50%' }} />
                    </div>
                    <div className="absolute bottom-3 text-[10px] text-amber-300 font-bold bg-slate-900/70 px-2 py-1 rounded-full">
                      Hold QR code inside the frame
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {cameraLoading && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white/80 bg-slate-900">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <span className="text-xs">Starting camera…</span>
                  </div>
                )}

                {/* Success overlay */}
                {scanStatus === 'found' && (
                  <div className="absolute inset-0 z-20 bg-emerald-500/20 flex items-center justify-center">
                    <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg">
                      <CheckCircle2 className="w-4 h-4" /> QR Decoded!
                    </div>
                  </div>
                )}

                {/* Idle state (not running, no loading) */}
                {!cameraRunning && !cameraLoading && !cameraError && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white/60 gap-2">
                    <Camera className="w-8 h-8" />
                    <span className="text-xs">Camera stopped</span>
                    <button type="button" onClick={() => startCameraQR()}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl mt-1">
                      Start Camera
                    </button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Camera Error:</strong> {cameraError}
                    <button type="button" onClick={() => { setCameraError(null); startCameraQR(); }}
                      className="block mt-1 text-blue-600 hover:underline font-semibold">Try Again</button>
                  </div>
                </div>
              )}

              {/* Hidden decode canvas */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* ── Manual Mode UI ── */}
          {mode === 'manual' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input ref={manualInputRef} type="text" autoFocus
                    placeholder="Type or paste Customer ID (CUS-...), Mortgage No (GM-...), or Packet ID (PKT-...)"
                    value={inputCode}
                    onChange={e => setInputCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && resolveCode(inputCode)}
                    className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                  {inputCode && (
                    <button type="button" onClick={() => setInputCode('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button type="button" onClick={() => resolveCode(inputCode)}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl transition text-xs shrink-0">
                  Search
                </button>
              </div>
              {/* Show available IDs as hint when data exists */}
              {hasData && (
                <div className="text-[10px] text-slate-400 flex flex-wrap gap-1 items-center">
                  <span className="font-bold">Example IDs:</span>
                  {customers.slice(0, 2).map(c => (
                    <button key={c.id} type="button" onClick={() => { setInputCode(c.id); resolveCode(c.id); }}
                      className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-mono hover:bg-amber-200 transition">{c.id}</button>
                  ))}
                  {mortgages.slice(0, 2).map(m => (
                    <button key={m.id} type="button" onClick={() => { setInputCode(m.mortgageNumber); resolveCode(m.mortgageNumber); }}
                      className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono hover:bg-emerald-200 transition">{m.mortgageNumber}</button>
                  ))}
                  {packets.slice(0, 1).map(p => (
                    <button key={p.id} type="button" onClick={() => { setInputCode(p.id); resolveCode(p.id); }}
                      className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-mono hover:bg-blue-200 transition">{p.id}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Error ── */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="text-xs">{errorMsg}</span>
            </div>
          )}

          {/* ── Result: Customer ── */}
          {scannedCustomer && (
            <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white rounded-2xl border-2 border-amber-400 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-extrabold text-amber-950 text-xs uppercase flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-800" />Customer Passbook Detected
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950">
                  {scannedCustomer.customer.id}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {scannedCustomer.customer.photoUrl
                  ? <img src={scannedCustomer.customer.photoUrl} alt="" className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-300" />
                  : <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg">{scannedCustomer.customer.name.charAt(0)}</div>
                }
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{scannedCustomer.customer.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">📞 +91 {scannedCustomer.customer.mobile}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-white border border-amber-200/70">
                  <span className="text-slate-400 text-[10px] uppercase block font-bold">Principal Due</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{formatCurrency(scannedCustomer.totalOutstanding)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-amber-200/70">
                  <span className="text-slate-400 text-[10px] uppercase block font-bold">Active Pledges</span>
                  <span className="font-mono font-black text-amber-900 text-sm">
                    {scannedCustomer.activeMortgages.length} loans ({formatWeight(scannedCustomer.totalNetGrams)})
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleOpenCustomerPortal}
                  className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black rounded-xl flex items-center justify-center gap-1.5 text-xs">
                  <Smartphone className="w-4 h-4" />Open Passbook
                </button>
                <button type="button" onClick={handleViewCustomerProfile}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 text-xs">
                  <User className="w-4 h-4 text-blue-600" />View Profile
                </button>
              </div>
              {scannedCustomer.activeMortgages.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-amber-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Pledge Accounts:</span>
                  {scannedCustomer.activeMortgages.slice(0, 3).map((m: Mortgage) => (
                    <div key={m.id} onClick={() => handleOpenMortgage(m)}
                      className="p-2 rounded-xl bg-white hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 cursor-pointer flex items-center justify-between transition">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-900 text-xs">{m.mortgageNumber}</span>
                        <span className="text-[10px] text-slate-500">Packet: {m.packetId}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-900">
                        {formatCurrency(m.outstandingPrincipal)} <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Result: Gold Packet ── */}
          {scannedPacket && (
            <div className="p-4 bg-white rounded-2xl border-2 border-emerald-400 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono font-black text-amber-950 text-sm">{scannedPacket.packet.id}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  scannedPacket.packet.status === 'In Locker' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'
                }`}>{scannedPacket.packet.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400 text-[10px] uppercase block font-medium">Borrower</span>
                  <span className="font-bold text-slate-900">{scannedPacket.customer?.name || '—'}</span></div>
                <div><span className="text-slate-400 text-[10px] uppercase block font-medium">Mortgage No</span>
                  <span className="font-mono font-bold text-amber-900">{scannedPacket.mortgage?.mortgageNumber || '—'}</span></div>
                <div><span className="text-slate-400 text-[10px] uppercase block font-medium">Locker</span>
                  <span className="font-semibold text-slate-800">{scannedPacket.packet.lockerId} • {scannedPacket.packet.rack} • {scannedPacket.packet.tray}</span></div>
                <div><span className="text-slate-400 text-[10px] uppercase block font-medium">Net Gold</span>
                  <span className="font-mono font-bold text-emerald-700">{formatWeight(scannedPacket.packet.totalNetWeight)} ({scannedPacket.packet.itemCount} items)</span></div>
              </div>
              <button type="button" onClick={() => handleOpenMortgage()}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs">
                Open Full Pledge Record <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${
              mode === 'hid' ? 'bg-emerald-500 animate-pulse' :
              mode === 'camera' && cameraRunning ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'
            }`} />
            <span className="font-semibold">
              {mode === 'hid' ? 'HID Scanner listening' : mode === 'camera' && cameraRunning ? 'Camera decoding frames' : 'Ready'}
            </span>
          </div>
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition">
            {language === 'ta' ? 'மூடு' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
