import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { FiCamera, FiCheckCircle, FiChevronDown, FiCrosshair, FiLoader, FiRefreshCcw, FiXCircle, FiZap } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import * as qrService from '../services/qrService';

const SCANNER_ID = 'yqueue-qr-reader';

const getScannerErrorMessage = (error) => {
  const message = error?.message || error?.toString() || '';

  if (!message) {
    return 'Html5Qrcode initialization failed';
  }

  if (message.includes('NotAllowedError') || message.includes('Permission denied') || message.includes('denied')) {
    return 'Permission denied';
  }

  if (message.includes('already in use') || message.includes('in use')) {
    return 'Camera already in use';
  }

  if (message.includes('No camera') || message.includes('not found') || message.includes('devices')) {
    return 'No camera detected';
  }

  if (message.includes('Html5Qrcode') || message.includes('element') || message.includes('container')) {
    return 'Html5Qrcode initialization failed';
  }

  return message;
};

const WorkerScanner = () => {
  const scannerRef = useRef(null);
  const busyRef = useRef(false);
  // Guards against React.StrictMode's dev-mode double-invoke of effects.
  // Refs persist across the synchronous mount->cleanup->mount cycle StrictMode
  // performs, so this ensures init() (and therefore getUserMedia/getCameras)
  // only ever runs once per real mount, instead of twice concurrently.
  const initStartedRef = useRef(false);
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading');
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);

  const stopScanner = async () => {
    if (!scannerRef.current) {
      return;
    }

    const scanner = scannerRef.current;
    // Null out immediately so a concurrent call (e.g. cleanup firing while
    // a start() is still resolving) can't operate on the same instance twice.
    scannerRef.current = null;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch (error) {
      console.error('[Scanner] Cleanup error:', error);
    }

    setFlashOn(false);
  };

  const handleScanSuccess = async (decodedText) => {
    console.log('[Scanner] QR detected:', decodedText);

    if (busyRef.current) return;
    busyRef.current = true;
    setStatus('processing');
    setResult(null);
    setCameraError(null);

    try {
      await stopScanner();
      const res = await qrService.verifyQr(decodedText);
      setResult({ success: true, message: res.message, order: res.order });
      setStatus('result');

      window.setTimeout(() => {
        navigate('/worker/dashboard');
      }, 1800);
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed';
      console.error('[WorkerScanner] verification failed:', err);
      setResult({ success: false, message });
      setStatus('result');
    } finally {
      busyRef.current = false;
    }
  };

  const handleScanFailure = (error) => {
    console.error('[WorkerScanner] scan failure:', error);
  };

  // Single, linear scanner startup path:
  // stop any existing instance -> create ONE Html5Qrcode instance ->
  // enumerate cameras ONCE (unless we already have them cached) ->
  // prefer rear camera -> start(). No nested retries, no duplicate
  // getCameras() calls, no duplicate instance creation.
  const startScanner = async (cameraId = selectedCameraId) => {
    await stopScanner();
    setCameraError(null);
    setResult(null);
    setStatus('loading');

    try {
      const element = document.getElementById(SCANNER_ID);
      if (!element) {
        throw new Error(`Scanner DOM element #${SCANNER_ID} not found`);
      }

      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      let availableCameras = cameras;
      if (!availableCameras.length) {
        console.log('[Scanner] Permission request');
        availableCameras = await Html5Qrcode.getCameras();
        console.log('[Scanner] Permission granted');
        console.log('[Scanner] Cameras found:', availableCameras);
        if (!availableCameras?.length) {
          throw new Error('No camera devices detected');
        }
        setCameras(availableCameras);
      }

      const targetCameraId =
        cameraId ||
        availableCameras.find((camera) => camera.label?.toLowerCase().includes('back'))?.id ||
        availableCameras[0].id;
      console.log('[Scanner] Selected camera:', targetCameraId);

      if (targetCameraId !== selectedCameraId) {
        setSelectedCameraId(targetCameraId);
      }

      await scanner.start(
        targetCameraId,
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
        handleScanSuccess,
        handleScanFailure
      );
      console.log('[Scanner] Scanner started');

      setStatus('scanning');
      const supportsFlash = await scanner.isFlashSupported().catch(() => false);
      setFlashSupported(supportsFlash);
    } catch (error) {
      console.error('[Scanner] Error:', error);
      setCameraError(getScannerErrorMessage(error));
      setStatus('idle');
    }
  };

  const toggleFlash = async () => {
    if (!scannerRef.current || !flashSupported) return;

    try {
      if (flashOn) {
        await scannerRef.current.turnOffFlash();
        setFlashOn(false);
      } else {
        await scannerRef.current.turnOnFlash();
        setFlashOn(true);
      }
    } catch {
      setCameraError('Flash is not available for the current camera.');
    }
  };

  useEffect(() => {
    // StrictMode runs this effect twice in dev (mount -> cleanup -> mount).
    // Without this guard, startScanner() below fires twice concurrently,
    // producing two overlapping Html5Qrcode.getCameras()/getUserMedia()
    // calls. Chrome (desktop and Android) does not resolve or reject a
    // getUserMedia() call that races another one on the same origin — it
    // just hangs forever, which is exactly the "stuck on Preparing camera"
    // symptom. initStartedRef persists across the double-invoke (refs are
    // not reset by StrictMode's fake unmount/remount) so only the first
    // invocation ever actually starts the camera.
    if (initStartedRef.current) {
      return undefined;
    }
    initStartedRef.current = true;

    console.log('[Scanner] Mount');
    startScanner();

    return () => {
      console.log('[Scanner] Cleanup');
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-primary-950/70 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Pickup Verification</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Scan and confirm</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">The scanner now opens automatically, supports multiple cameras, and verifies every QR code server-side before any order is released.</p>
      </div>

      <div className="card mt-6 overflow-hidden p-0 text-center sm:p-0">
        <div className="relative border-b border-white/10 bg-slate-950/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <FiCamera size={16} />
              <span>{status === 'scanning' ? 'Live scanner active' : status === 'processing' ? 'Verifying QR' : status === 'result' ? 'Result ready' : 'Scanner ready'}</span>
            </div>
            <div className="flex items-center gap-2">
              {cameras.length > 1 && (
                <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-300">
                  <FiChevronDown size={14} />
                  <select
                    value={selectedCameraId}
                    onChange={async (event) => {
                      const nextCameraId = event.target.value;
                      setSelectedCameraId(nextCameraId);
                      await startScanner(nextCameraId);
                    }}
                    className="bg-transparent text-sm text-slate-100 outline-none"
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id} className="bg-slate-900 text-slate-100">
                        {camera.label || `Camera ${camera.id.slice(0, 6)}`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {flashSupported && (
                <button onClick={toggleFlash} className="rounded-full border border-white/10 bg-white/10 p-2 text-slate-100">
                  <FiZap size={16} className={flashOn ? 'text-amber-300' : ''} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative bg-slate-950/80 p-4 sm:p-6">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
            <div id={SCANNER_ID} className="min-h-[320px] w-full rounded-[1.5rem] bg-black" />
            <div className="scanner-frame pointer-events-none absolute inset-4 rounded-[1.25rem] border border-white/40" />
            <div className="scanner-line pointer-events-none absolute left-8 right-8 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
          </div>

          {status === 'loading' && (
            <div className="mt-4 flex min-h-[56px] flex-col items-center justify-center text-sm leading-7 text-slate-400">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-500/10 text-primary-200">
                <FiLoader size={28} className="animate-spin" />
              </div>
              <p className="mt-4">{cameraError || 'Preparing the camera feed and scanner overlay…'}</p>
            </div>
          )}

          {status === 'scanning' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
              <FiCrosshair size={14} /> Point the camera at the pickup QR code.
            </div>
          )}
        </div>

        {status === 'processing' && (
          <div className="flex min-h-[360px] flex-col items-center justify-center bg-slate-950/70 p-8">
            <FiLoader size={28} className="animate-spin text-primary-200" />
            <p className="mt-4 text-sm leading-7 text-slate-400">Verifying QR signature and order status on the server…</p>
          </div>
        )}

        {status === 'idle' && (
          <div className="flex min-h-[360px] flex-col items-center justify-center bg-slate-950/70 p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-500/10 text-primary-200">
              <FiCamera size={28} />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-400">Start the scanner to verify a student pickup QR securely.</p>
            {cameraError && <p className="mt-3 text-sm text-rose-300">{cameraError}</p>}
            <button onClick={() => startScanner(selectedCameraId)} className="btn-primary mt-6 inline-flex items-center gap-2">
              <FiCrosshair size={16} /> Start scanner
            </button>
          </div>
        )}

        {status === 'result' && result && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[360px] flex-col items-center justify-center bg-slate-950/70 p-8">
            {result.success ? (
              <FiCheckCircle size={56} className="mb-4 text-emerald-400" />
            ) : (
              <FiXCircle size={56} className="mb-4 text-rose-400" />
            )}
            <p className={`text-center text-lg font-semibold ${result.success ? 'text-emerald-200' : 'text-rose-200'}`}>
              {result.message}
            </p>
            {result.success && result.order && (
              <div className="mt-4 w-full rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/10 p-4 text-left">
                <p className="text-sm font-semibold text-emerald-100">{result.order.student?.name || 'Student'}</p>
                <p className="mt-1 text-xs text-emerald-100/80">Queue #{result.order.queueNumber || '—'} · {result.order.items?.length || 0} item(s)</p>
                <p className="text-xs text-emerald-100/80">Total ₹{result.order.totalPrice}</p>
              </div>
            )}
            {!result.success && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
                <FiRefreshCcw size={14} /> Try another scan
              </div>
            )}
            <button onClick={() => startScanner(selectedCameraId)} className="btn-primary mt-5">Scan Next</button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WorkerScanner;
