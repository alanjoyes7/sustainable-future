import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Edit3, Lightbulb, Loader2, CameraOff, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { classifyWaste } from '@/src/services/gemini';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../database/firebase';
import toast from 'react-hot-toast';
import { saveLocalScan } from '../lib/demoStorage';

const SETTINGS_STORAGE_KEY = 'biome.settings';

function shouldSaveHistory() {
  if (typeof window === 'undefined') return true;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return true;
    return JSON.parse(raw).saveHistory !== false;
  } catch {
    return true;
  }
}

export default function Scanner() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied. Please allow camera permissions or use file upload.');
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const saveToDb = async (result: any, method: 'image' | 'text' | 'camera') => {
    if (!currentUser || result.category === 'Unknown') return;

    if (!shouldSaveHistory()) {
      toast('Scan history is currently disabled in Settings.', { icon: '🛡️' });
      return;
    }

    const payload = {
      uid: currentUser.uid,
      item: result.item,
      category: result.category,
      guidance: result.guidance,
      inputMethod: method,
      offlineMode: !!result.offlineMode,
      rewardBadge: result.rewardBadge || null,
      timestamp: new Date().toISOString(),
    };

    saveLocalScan(payload);

    if (!db) {
      return;
    }

    try {
      await addDoc(collection(db, 'scans'), payload);
    } catch (err) {
      console.error('Failed to log scan:', err);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const base64Data = dataUrl.split(',')[1];

    setIsScanning(true);
    try {
      const result = await classifyWaste({ data: base64Data, mimeType: 'image/jpeg' });
      if (result.offlineMode) {
        toast('Offline smart mode used cached waste rules.', { icon: '⚡' });
      }
      await saveToDb(result, 'camera');
      navigate('/result', { state: { result, image: dataUrl } });
    } catch (error) {
      console.error('Classification failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Classification failed. Please try again.'
      );
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(',')[1];
        try {
          const result = await classifyWaste({ data: base64Data, mimeType: file.type });
          if (result.offlineMode) {
            toast('Offline smart mode used cached waste rules.', { icon: '⚡' });
          }
          await saveToDb(result, 'image');
          navigate('/result', { state: { result, image: dataUrl } });
        } catch (error) {
          console.error('Classification failed:', error);
          toast.error(
            error instanceof Error ? error.message : 'Classification failed. Please try again.'
          );
          setIsScanning(false);
        } finally {
          e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read failed:', error);
      toast.error('Failed to read file. Please try again.');
      setIsScanning(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    setIsScanning(true);
    try {
      const result = await classifyWaste(textInput);
      if (result.offlineMode) {
        toast('Offline smart mode matched this item locally.', { icon: '⚡' });
      }
      await saveToDb(result, 'text');
      navigate('/result', { state: { result } });
    } catch (error) {
      console.error('Classification failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'Classification failed. Please try again.'
      );
      setIsScanning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto flex w-full max-w-2xl flex-col"
    >
      {/* Header */}
      <section className="mb-8">
        <h2 className="mb-2 text-4xl font-bold tracking-tight">Scanner</h2>
        <p className="text-on-surface-variant font-medium">
          {cameraActive
            ? 'Live camera ready — point at any waste item'
            : 'Upload an image or describe the waste below'}
        </p>
        <div className="border-primary/20 bg-primary/5 text-primary mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold">
          <span>⚡</span>
          AI + offline smart mode are both ready for your demo.
        </div>
      </section>

      {/* Live Viewfinder */}
      <section className="relative mb-8 aspect-[4/3] w-full overflow-hidden rounded-3xl bg-black shadow-2xl">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Error / Fallback */}
        {!cameraActive && (
          <div className="bg-surface-container-high absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="bg-surface-container rounded-3xl p-6">
              <CameraOff className="text-on-surface-variant mx-auto mb-3 h-16 w-16" />
              <p className="text-on-surface-variant max-w-xs text-center text-sm font-medium">
                {cameraError || 'Camera not available'}
              </p>
            </div>
            <button
              onClick={startCamera}
              className="bg-primary flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition-transform active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Camera
            </button>
          </div>
        )}

        {/* Scan Overlay */}
        {cameraActive && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-8">
            <div className="flex justify-between">
              <div className="h-10 w-10 rounded-tl-xl border-t-4 border-l-4 border-white opacity-80" />
              <div className="h-10 w-10 rounded-tr-xl border-t-4 border-r-4 border-white opacity-80" />
            </div>
            <motion.div
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="via-primary absolute right-0 left-0 h-[2px] bg-gradient-to-r from-transparent to-transparent shadow-[0_0_12px_#4caf50]"
            />
            <div className="flex justify-between">
              <div className="h-10 w-10 rounded-bl-xl border-b-4 border-l-4 border-white opacity-80" />
              <div className="h-10 w-10 rounded-br-xl border-r-4 border-b-4 border-white opacity-80" />
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white backdrop-blur-sm"
            >
              <Loader2 className="text-primary mb-4 h-14 w-14 animate-spin" />
              <p className="text-2xl font-bold">Classifying...</p>
              <p className="mt-2 text-sm opacity-70">Gemini AI is analyzing the waste</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Action Buttons */}
      <section className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleCapture}
            disabled={!cameraActive || isScanning}
            className="from-primary to-primary-container hover:shadow-primary/20 flex flex-col items-center justify-center gap-2 rounded-3xl bg-gradient-to-br py-6 text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera className="h-8 w-8" />
            <span className="text-sm font-bold">Capture & Scan</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="bg-surface-container-low flex flex-col items-center justify-center gap-2 rounded-3xl py-6 text-green-900 transition-all hover:bg-green-50 active:scale-95 disabled:opacity-50"
          >
            <Upload className="h-8 w-8 text-green-800" />
            <span className="text-sm font-bold">Upload Image</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>

        {/* Text Input */}
        <form onSubmit={handleTextSubmit} className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center">
            <Edit3 className="text-on-surface-variant h-5 w-5" />
          </div>
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="bg-surface-container-highest focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/60 w-full rounded-full border-none py-4 pr-28 pl-14 font-medium outline-none focus:ring-2"
            placeholder="Or describe the waste..."
            type="text"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isScanning}
            className="bg-primary absolute top-1/2 right-2 -translate-y-1/2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
          >
            Classify
          </button>
        </form>
      </section>

      {/* Eco Tip */}
      <section className="bg-surface-container-low border-outline-variant/10 mt-10 flex items-start gap-4 rounded-3xl border p-6">
        <div className="bg-primary/10 text-primary rounded-full p-3">
          <Lightbulb className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-on-surface mb-1 font-bold">Eco Tip</h4>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Rinsing food containers before scanning increases classification accuracy and prepares
            them for recycling.
          </p>
        </div>
      </section>
    </motion.div>
  );
}
