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
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError("Camera access denied. Please allow camera permissions or use file upload.");
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
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
      timestamp: new Date().toISOString()
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
      toast.error(error instanceof Error ? error.message : 'Classification failed. Please try again.');
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
          toast.error(error instanceof Error ? error.message : 'Classification failed. Please try again.');
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
      toast.error(error instanceof Error ? error.message : 'Classification failed. Please try again.');
      setIsScanning(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col max-w-2xl mx-auto w-full"
    >
      {/* Header */}
      <section className="mb-8">
        <h2 className="text-4xl font-bold tracking-tight mb-2">Scanner</h2>
        <p className="text-on-surface-variant font-medium">
          {cameraActive ? 'Live camera ready — point at any waste item' : 'Upload an image or describe the waste below'}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary">
          <span>⚡</span>
          AI + offline smart mode are both ready for your demo.
        </div>
      </section>

      {/* Live Viewfinder */}
      <section className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-black mb-8 shadow-2xl">
        {/* Video Element */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Error / Fallback */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface-container-high">
            <div className="p-6 rounded-3xl bg-surface-container">
              <CameraOff className="w-16 h-16 text-on-surface-variant mx-auto mb-3" />
              <p className="text-on-surface-variant text-sm text-center font-medium max-w-xs">
                {cameraError || 'Camera not available'}
              </p>
            </div>
            <button 
              onClick={startCamera}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Camera
            </button>
          </div>
        )}

        {/* Scan Overlay */}
        {cameraActive && (
          <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between">
              <div className="w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-xl opacity-80" />
              <div className="w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-xl opacity-80" />
            </div>
            <motion.div 
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_#4caf50]"
            />
            <div className="flex justify-between">
              <div className="w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-xl opacity-80" />
              <div className="w-10 h-10 border-b-4 border-r-4 border-white rounded-br-xl opacity-80" />
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
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20"
            >
              <Loader2 className="w-14 h-14 animate-spin mb-4 text-primary" />
              <p className="text-2xl font-bold">Classifying...</p>
              <p className="text-sm opacity-70 mt-2">Gemini AI is analyzing the waste</p>
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
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-3xl bg-gradient-to-br from-primary to-primary-container text-white transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-primary/20"
          >
            <Camera className="w-8 h-8" />
            <span className="text-sm font-bold">Capture & Scan</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-3xl bg-surface-container-low text-green-900 hover:bg-green-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <Upload className="w-8 h-8 text-green-800" />
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
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Edit3 className="w-5 h-5 text-on-surface-variant" />
          </div>
          <input 
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full pl-14 pr-28 py-4 rounded-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-on-surface-variant/60 outline-none" 
            placeholder="Or describe the waste..." 
            type="text"
          />
          <button 
            type="submit"
            disabled={!textInput.trim() || isScanning}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-bold disabled:opacity-40 transition-all active:scale-95"
          >
            Classify
          </button>
        </form>
      </section>

      {/* Eco Tip */}
      <section className="mt-10 p-6 rounded-3xl bg-surface-container-low border border-outline-variant/10 flex gap-4 items-start">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-on-surface mb-1">Eco Tip</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Rinsing food containers before scanning increases classification accuracy and prepares them for recycling.
          </p>
        </div>
      </section>
    </motion.div>
  );
}
