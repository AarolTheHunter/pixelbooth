import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Heart, Download, Timer, SwitchCamera } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import logoImage from "@assets/7edd6b98-247a-49a0-b423-a67e010d87ec (1)_1759107927861.png";
import landscapeFrame from "@assets/Untitled design (1)_1759333740544.png";
import portraitFrame1 from "@assets/1_1759327682991.png";
import portraitFrame2 from "@assets/3_1759333849351.png";
import portraitFrame3 from "@assets/3_1759333963695.png";
import threePhotoFrame1 from "@assets/6_1759334598291.png";
import threePhotoFrame2 from "@assets/1_1759334598292.png";
import threePhotoFrame3 from "@assets/2_1759334598292.png";
import threePhotoFrame4 from "@assets/4_1759334598292.png";
import threePhotoFrame5 from "@assets/2_1759334664299.png";
import fourPhotoFrame1 from "@assets/5_1759338575783.png";
import fourPhotoFrame2 from "@assets/6_1759338575783.png";
import fourPhotoFrame3 from "@assets/5_1759338583655.png";

interface PrettyClickCameraProps {
  onCapture: (imageData: string) => void;
  onPhotoboothCapture?: (images: string[], layout: 'couples' | 'friends', frameId?: string) => void;
}

export default function PrettyClickCamera({ onCapture, onPhotoboothCapture }: PrettyClickCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoCollectionRef = useRef<string[]>([]);
  const captureSequenceRef = useRef<boolean>(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>('');
  const [qualityWarning, setQualityWarning] = useState<string>('');
  
  // Camera selection state
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  
  // Settings state
  const [photoCount, setPhotoCount] = useState(2);
  const [delay, setDelay] = useState(3);
  const [flash, setFlash] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('Original');
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null); // 2-photo: 'landscape', 'portrait1', 'portrait2', 'portrait3' | 3-photo: 'three1', 'three2', 'three3', 'three4', 'three5' | 4-photo: 'four1', 'four2', 'four3'
  
  // Photos state
  const [savedPhotos, setSavedPhotos] = useState<string[]>([]);
  
  // Photobooth sequence state
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Animation state
  const [newPhotoIndex, setNewPhotoIndex] = useState<number | null>(null);
  const [isPhotoAnimating, setIsPhotoAnimating] = useState(false);
  
  // Audio context for photobooth sounds
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const filters = [
    'Original', 'B&W', 'Blur', 'Bright', 'Sepia', 'Vintage'
  ];

  // Create photobooth camera sound effect
  const playPhotoboothSound = () => {
    try {
      // Initialize audio context on first use
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Create camera shutter-like sound with noise burst
      const bufferSize = audioContext.sampleRate * 0.1; // 100ms
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const channelData = buffer.getChannelData(0);
      
      // Generate white noise burst with envelope
      for (let i = 0; i < bufferSize; i++) {
        const envelope = Math.exp(-i / (bufferSize * 0.1)); // Sharp decay
        channelData[i] = (Math.random() * 2 - 1) * envelope * 0.3; // Reduce volume
      }
      
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      // High-pass filter for shutter-like sound
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(200, audioContext.currentTime);
      
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      source.start(audioContext.currentTime);
    } catch (error) {
      console.log('Audio not supported in this environment');
    }
  };

  useEffect(() => {
    startCamera();
    // Load saved photos from localStorage
    const stored = localStorage.getItem('prettyclick-photos');
    if (stored) {
      setSavedPhotos(JSON.parse(stored));
    }
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (deviceId?: string) => {
    try {
      // First enumerate all cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log(`Found ${videoDevices.length} cameras`);
      setAvailableCameras(videoDevices);
      
      let targetDeviceId = deviceId || selectedCameraId;
      let bestStream: MediaStream | null = null;
      let bestDevice = '';
      
      // If no specific camera selected, find the best one
      if (!targetDeviceId && videoDevices.length > 0) {
        let bestResolution = 0;
        
        // Try each camera to find the highest resolution one
        for (const device of videoDevices) {
          try {
            console.log(`Testing camera: ${device.label || 'Unknown'}`);
            
            const testStream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: device.deviceId },
                width: { min: 1280, ideal: 4096, max: 8192 },
                height: { min: 720, ideal: 2160, max: 4320 }
              }
            });
            
            const track = testStream.getVideoTracks()[0];
            const settings = track.getSettings();
            const resolution = (settings.width || 0) * (settings.height || 0);
            
            console.log(`${device.label || 'Camera'}: ${settings.width}x${settings.height} (${(resolution/1000000).toFixed(1)}MP)`);
            
            if (resolution > bestResolution) {
              // Stop previous best stream
              if (bestStream) {
                bestStream.getVideoTracks()[0].stop();
              }
              bestStream = testStream;
              bestResolution = resolution;
              bestDevice = device.label || 'Unknown';
              targetDeviceId = device.deviceId;
              console.log(`✓ New best camera: ${bestDevice} - ${(resolution/1000000).toFixed(1)}MP`);
            } else {
              // Stop this stream since it's not the best
              track.stop();
            }
          } catch (deviceError) {
            console.log(`✗ Failed to access ${device.label}:`, (deviceError as Error).message);
          }
        }
        
        // Set the best camera as selected
        if (targetDeviceId) {
          setSelectedCameraId(targetDeviceId);
        }
      } else if (targetDeviceId) {
        // Use specific camera - try unconstrained first for maximum resolution
        const device = videoDevices.find(d => d.deviceId === targetDeviceId);
        bestDevice = device?.label || 'Selected Camera';
        
        try {
          // First try: No constraints except device ID (gets maximum resolution)
          console.log('Trying unconstrained resolution for maximum quality...');
          bestStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: targetDeviceId }
            }
          });
          
          // Check what we got
          const track = bestStream.getVideoTracks()[0];
          const settings = track.getSettings();
          console.log(`Unconstrained: ${settings.width}x${settings.height}`);
          
          // If it's too low, try with explicit high resolution request
          const mp = (settings.width || 0) * (settings.height || 0) / 1000000;
          if (mp < 1.0) {
            console.log('Low resolution, trying with explicit constraints...');
            track.stop();
            
            bestStream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: targetDeviceId },
                width: { min: 1280, ideal: 4096, max: 8192 },
                height: { min: 720, ideal: 2160, max: 4320 }
              }
            });
          }
        } catch (unconstrainedError) {
          console.log('Unconstrained failed, using constrained approach:', (unconstrainedError as Error).message);
          bestStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: targetDeviceId },
              width: { min: 1280, ideal: 4096, max: 8192 },
              height: { min: 720, ideal: 2160, max: 4320 }
            }
          });
        }
      }
      
      // If no camera worked via deviceId, try general approach
      if (!bestStream) {
        console.log('No cameras accessible via deviceId, trying general approach...');
        bestStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { min: 1280, ideal: 3840, max: 7680 },
            height: { min: 720, ideal: 2160, max: 4320 }
          } 
        });
      }
      
      if (videoRef.current && bestStream) {
        videoRef.current.srcObject = bestStream;
        
        // Wait for video metadata to load
        await new Promise((resolve) => {
          const video = videoRef.current!;
          if (video.readyState >= 1) {
            resolve(undefined);
          } else {
            video.addEventListener('loadedmetadata', () => resolve(undefined), { once: true });
          }
        });
        
        // Log final camera selection
        const track = bestStream.getVideoTracks()[0];
        const settings = track.getSettings();
        const megapixels = (settings.width || 0) * (settings.height || 0) / 1000000;
        
        console.log('=== FINAL CAMERA SELECTION ===');
        console.log(`Camera: ${bestDevice}`);
        console.log(`Resolution: ${settings.width}x${settings.height}`);
        console.log(`Quality: ${megapixels.toFixed(1)}MP`);
        console.log('==============================');
        
        // Show quality warning if resolution is low
        if (megapixels < 1.0) {
          setQualityWarning(`⚠️ Low camera quality (${megapixels.toFixed(1)}MP at ${settings.width}x${settings.height}). Photos will be pixelated. Try switching cameras or using a different browser.`);
        } else {
          setQualityWarning('');
        }
        
        setIsStreaming(true);
        setError('');
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const switchCamera = async (deviceId: string) => {
    // Stop current camera
    stopCamera();
    setIsStreaming(false);
    
    // Start new camera
    setSelectedCameraId(deviceId);
    await startCamera(deviceId);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Start countdown for photobooth sequence
  const startCountdown = () => {
    setCountdown(delay);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            setCountdown(null);
            capturePhotoboothPhoto();
          }, 1000);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Capture a single photo in photobooth sequence
  const capturePhotoboothPhoto = () => {
    if (!videoRef.current || !canvasRef.current || !captureSequenceRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // CRITICAL: Check if video element dimensions match stream resolution
    const stream = video.srcObject as MediaStream;
    const track = stream?.getVideoTracks()[0];
    const trackSettings = track?.getSettings();
    
    const videoElementWidth = video.videoWidth;
    const videoElementHeight = video.videoHeight;
    const streamWidth = trackSettings?.width || 0;
    const streamHeight = trackSettings?.height || 0;
    
    console.log('=== PHOTOBOOTH CAPTURE CHECK ===');
    console.log(`Video element: ${videoElementWidth}x${videoElementHeight}`);
    console.log(`Stream track: ${streamWidth}x${streamHeight}`);
    
    // Use stream dimensions if available and higher than video element
    const captureWidth = Math.max(videoElementWidth, streamWidth);
    const captureHeight = Math.max(videoElementHeight, streamHeight);
    
    console.log(`Capturing at: ${captureWidth}x${captureHeight}`);
    console.log('================================');
    
    // Set canvas to maximum available resolution
    canvas.width = captureWidth;
    canvas.height = captureHeight;

    // Apply filter effect
    const filterMap: Record<string, string> = {
      'Original': '',
      'B&W': 'grayscale(1)',
      'Blur': 'blur(2px)',
      'Bright': 'brightness(1.3)',
      'Sepia': 'sepia(1)',
      'Vintage': 'sepia(0.5) contrast(1.2) brightness(1.1)'
    };
    
    ctx.filter = filterMap[currentFilter] || '';
    
    // Enable high-quality smoothing for photos
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw video at maximum resolution
    ctx.drawImage(video, 0, 0, captureWidth, captureHeight);
    
    // Use PNG for lossless quality
    const imageData = canvas.toDataURL('image/png');
    
    // Log captured photo orientation for debugging
    const orientationPhoto = captureWidth > captureHeight ? 'LANDSCAPE' : 'PORTRAIT';
    console.log(`📸 Photobooth photo captured: ${captureWidth}x${captureHeight} (${orientationPhoto})`);
    console.log(`   Aspect ratio: ${(captureWidth/captureHeight).toFixed(2)}:1`);
    
    // Play photobooth camera sound
    playPhotoboothSound();
    
    // Add to photo collection using ref
    photoCollectionRef.current.push(imageData);
    const currentCount = photoCollectionRef.current.length;
    
    // Flash effect
    if (flash) {
      const flashDiv = document.createElement('div');
      flashDiv.className = 'fixed inset-0 bg-white z-50 pointer-events-none';
      document.body.appendChild(flashDiv);
      
      setTimeout(() => {
        document.body.removeChild(flashDiv);
      }, 150);
    }
    
    console.log(`Photo ${currentCount} of ${photoCount} captured`);
    
    // Trigger slide-down animation for the newest photo (index 0)
    setNewPhotoIndex(0); // Always animate the newest photo at index 0
    setIsPhotoAnimating(true);
    
    // Update display state
    setCurrentPhotoIndex(currentCount);
    
    // Update photos for immediate display with animation (newest first)
    const updatedPhotos = [imageData, ...savedPhotos].slice(0, 10);
    setSavedPhotos(updatedPhotos);
    
    // Save immediately to avoid persistence race conditions
    try {
      localStorage.setItem('prettyclick-photos', JSON.stringify(updatedPhotos));
    } catch (storageError) {
      // Handle localStorage quota exceeded
      console.warn('localStorage quota exceeded, keeping photos in memory only');
      // Could implement thumbnail storage or backend persistence here
    }
    
    // Check if we have all photos needed
    if (currentCount >= photoCount) {
      // All photos captured, finish sequence
      captureSequenceRef.current = false;
      setIsCapturing(false);
      
      // No need to save again - already saved during capture
      
      // Create photobooth strip if callback provided
      if (onPhotoboothCapture && photoCollectionRef.current.length > 1) {
        const layout = photoCount === 2 ? 'couples' : 'friends';
        onPhotoboothCapture([...photoCollectionRef.current], layout, selectedFrame || undefined);
      }
      
      // Reset refs and state
      photoCollectionRef.current = [];
      setCurrentPhotoIndex(0);
    } else {
      // Need more photos, start countdown for next one
      setTimeout(() => {
        if (captureSequenceRef.current) {
          startCountdown();
        }
      }, 1500); // Short pause between photos
    }
  };

  // Start photobooth capture sequence
  const startPhotoboothCapture = () => {
    // Initialize refs and state
    photoCollectionRef.current = [];
    captureSequenceRef.current = true;
    setIsCapturing(true);
    setCurrentPhotoIndex(0);
    startCountdown();
  };

  // Single photo capture
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      // Try ImageCapture API first for maximum resolution
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream && 'ImageCapture' in window) {
        try {
          const track = stream.getVideoTracks()[0];
          const imageCapture = new (window as any).ImageCapture(track);
          const capabilities = await imageCapture.getPhotoCapabilities();
          
          console.log('ImageCapture capabilities:', capabilities);
          
          // Take photo at maximum resolution
          const photoSettings: any = {};
          if (capabilities.imageWidth && capabilities.imageHeight) {
            photoSettings.imageWidth = capabilities.imageWidth.max;
            photoSettings.imageHeight = capabilities.imageHeight.max;
            console.log(`Taking photo at max resolution: ${photoSettings.imageWidth}x${photoSettings.imageHeight}`);
          }
          
          const blob = await imageCapture.takePhoto(photoSettings);
          
          // Convert blob to data URL
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            console.log('High-res photo captured via ImageCapture API');
            onCapture(dataUrl);
          };
          reader.readAsDataURL(blob);
          return;
        } catch (imageCaptureError) {
          console.log('ImageCapture failed, falling back to canvas:', imageCaptureError);
        }
      }
    } catch (error) {
      console.log('ImageCapture not available, using canvas fallback');
    }

    // Fallback to canvas method
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // CRITICAL: Check if video element dimensions match stream resolution
    const stream = video.srcObject as MediaStream;
    const track = stream?.getVideoTracks()[0];
    const trackSettings = track?.getSettings();
    
    const videoElementWidth = video.videoWidth;
    const videoElementHeight = video.videoHeight;
    const streamWidth = trackSettings?.width || 0;
    const streamHeight = trackSettings?.height || 0;
    
    console.log('=== CAPTURE RESOLUTION CHECK ===');
    console.log(`Video element reports: ${videoElementWidth}x${videoElementHeight}`);
    console.log(`Stream track reports: ${streamWidth}x${streamHeight}`);
    
    // Use stream dimensions if available and higher than video element
    const captureWidth = Math.max(videoElementWidth, streamWidth);
    const captureHeight = Math.max(videoElementHeight, streamHeight);
    
    const megapixels = (captureWidth * captureHeight) / 1000000;
    console.log(`Using for capture: ${captureWidth}x${captureHeight} (${megapixels.toFixed(1)}MP)`);
    console.log('================================');
    
    if (megapixels < 1.0) {
      console.warn(`⚠️ LOW RESOLUTION WARNING: Capturing at only ${megapixels.toFixed(1)}MP`);
      console.warn('This will result in pixelated photos. Try:');
      console.warn('1. Switch to a different camera using the dropdown');
      console.warn('2. Check browser camera permissions');
      console.warn('3. Try a different browser (Chrome/Edge recommended)');
    }
    
    // Set canvas to maximum available resolution
    canvas.width = captureWidth;
    canvas.height = captureHeight;

    // Apply filter effect
    const filterMap: Record<string, string> = {
      'Original': '',
      'B&W': 'grayscale(1)',
      'Blur': 'blur(2px)',
      'Bright': 'brightness(1.3)',
      'Sepia': 'sepia(1)',
      'Vintage': 'sepia(0.5) contrast(1.2) brightness(1.1)'
    };
    
    ctx.filter = filterMap[currentFilter] || '';
    
    // Enable high-quality smoothing for photos
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw video at maximum resolution
    ctx.drawImage(video, 0, 0, captureWidth, captureHeight);
    
    // Use PNG for lossless quality
    const imageData = canvas.toDataURL('image/png');
    
    // Log captured photo orientation for debugging
    const orientationSingle = captureWidth > captureHeight ? 'LANDSCAPE' : 'PORTRAIT';
    console.log(`📸 Single photo captured: ${captureWidth}x${captureHeight} (${orientationSingle})`);
    console.log(`   Aspect ratio: ${(captureWidth/captureHeight).toFixed(2)}:1`);
    
    // Play photobooth camera sound
    playPhotoboothSound();
    
    // Flash effect
    if (flash) {
      const flashDiv = document.createElement('div');
      flashDiv.className = 'fixed inset-0 bg-white z-50 pointer-events-none';
      document.body.appendChild(flashDiv);
      
      setTimeout(() => {
        document.body.removeChild(flashDiv);
      }, 150);
    }
    
    // Trigger slide-down animation for the newest photo
    setNewPhotoIndex(0);
    setIsPhotoAnimating(true);
    
    // Save photo (newest first)
    const newPhotos = [imageData, ...savedPhotos].slice(0, 10); // Keep only last 10
    setSavedPhotos(newPhotos);
    try {
      localStorage.setItem('prettyclick-photos', JSON.stringify(newPhotos));
    } catch (storageError) {
      console.warn('localStorage quota exceeded, keeping photos in memory only');
    }
    
    onCapture(imageData);
  };

  // Handle NEXT button - create photobooth strip from recent photos
  const handleNext = () => {
    if (savedPhotos.length >= photoCount && onPhotoboothCapture) {
      const layout = photoCount === 2 ? 'couples' : 'friends';
      const photosToUse = savedPhotos.slice(0, photoCount);
      onPhotoboothCapture(photosToUse, layout, selectedFrame || undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="sr-only">prettyclick photobooth</h1>
          <div className="flex justify-center mb-2">
            <img 
              src={logoImage} 
              alt="prettyclick" 
              className="h-16 w-auto"
              data-testid="logo-camera"
              width="160"
              height="48"
              decoding="async"
            />
          </div>
          <p className="text-gray-600 text-lg">photobooth</p>
        </div>

        {/* Three Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Settings */}
          <Card className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-pink-400 to-pink-500 text-white p-4 rounded-t-3xl">
              <h2 className="text-xl font-semibold text-center">settings</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Photos Count */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Photos:</h3>
                <div className="flex gap-2">
                  {[2, 3, 4].map((count) => (
                    <Button
                      key={count}
                      size="sm"
                      variant={photoCount === count ? "default" : "outline"}
                      onClick={() => setPhotoCount(count)}
                      className={`rounded-full ${photoCount === count ? 'bg-pink-500 text-white' : 'border-pink-300 text-pink-500'}`}
                      data-testid={`photos-${count}`}
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Delay */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Delay:</h3>
                <div className="flex gap-2">
                  {[3, 5, 10, 20].map((delayTime) => (
                    <Button
                      key={delayTime}
                      size="sm"
                      variant={delay === delayTime ? "default" : "outline"}
                      onClick={() => setDelay(delayTime)}
                      className={`rounded-full ${delay === delayTime ? 'bg-pink-500 text-white' : 'border-pink-300 text-pink-500'}`}
                      data-testid={`delay-${delayTime}`}
                    >
                      {delayTime}s
                    </Button>
                  ))}
                </div>
              </div>

              {/* Flash */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Flash:</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={flash ? "default" : "outline"}
                    onClick={() => setFlash(true)}
                    className={`rounded-full ${flash ? 'bg-pink-500 text-white' : 'border-pink-300 text-pink-500'}`}
                    data-testid="flash-on"
                  >
                    On
                  </Button>
                  <Button
                    size="sm"
                    variant={!flash ? "default" : "outline"}
                    onClick={() => setFlash(false)}
                    className={`rounded-full ${!flash ? 'bg-pink-500 text-white' : 'border-pink-300 text-pink-500'}`}
                    data-testid="flash-off"
                  >
                    Off
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Filters:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {filters.map((filter) => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={currentFilter === filter ? "default" : "outline"}
                      onClick={() => setCurrentFilter(filter)}
                      className={`rounded-full text-xs ${currentFilter === filter ? 'bg-pink-500 text-white' : 'border-pink-300 text-pink-500'}`}
                      data-testid={`filter-${filter.toLowerCase()}`}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Frame Design - Only show for 2 photos */}
              {photoCount === 2 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Frame Design:</h3>
                  <p className="text-xs text-gray-500 mb-2">Optional - Auto-detects if not selected</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={selectedFrame === 'landscape' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'landscape' ? null : 'landscape')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'landscape' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-landscape"
                    >
                      <img src={landscapeFrame} alt="Landscape frame" className="w-full h-16 object-contain" />
                      <span className="text-xs">Chocolate</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFrame === 'portrait1' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'portrait1' ? null : 'portrait1')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'portrait1' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-portrait1"
                    >
                      <img src={portraitFrame1} alt="Portrait frame 1" className="w-full h-16 object-contain" />
                      <span className="text-xs">Classic</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFrame === 'portrait2' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'portrait2' ? null : 'portrait2')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'portrait2' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-portrait2"
                    >
                      <img src={portraitFrame2} alt="Portrait frame 2" className="w-full h-16 object-contain" />
                      <span className="text-xs">Scrapbook</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFrame === 'portrait3' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'portrait3' ? null : 'portrait3')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'portrait3' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-portrait3"
                    >
                      <img src={portraitFrame3} alt="Portrait frame 3" className="w-full h-16 object-contain" />
                      <span className="text-xs">Cute Pink</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Frame Design - Only show for 3 photos */}
              {photoCount === 3 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Frame Design:</h3>
                  <p className="text-xs text-gray-500 mb-2">Optional - Auto-detects if not selected</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={selectedFrame === 'three1' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'three1' ? null : 'three1')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'three1' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-three1"
                    >
                      <img src={threePhotoFrame1} alt="Theater Ticket frame" className="w-full h-20 object-contain" />
                      <span className="text-xs">Theater</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFrame === 'three2' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'three2' ? null : 'three2')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'three2' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-three2"
                    >
                      <img src={threePhotoFrame2} alt="Pink Bows frame" className="w-full h-20 object-contain" />
                      <span className="text-xs">Pink Bows</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFrame === 'three3' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'three3' ? null : 'three3')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'three3' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-three3"
                    >
                      <img src={threePhotoFrame3} alt="Christmas frame" className="w-full h-20 object-contain" />
                      <span className="text-xs">Holiday</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFrame === 'three4' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'three4' ? null : 'three4')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'three4' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-three4"
                    >
                      <img src={threePhotoFrame4} alt="Nepopotamus frame" className="w-full h-20 object-contain" />
                      <span className="text-xs">Nepopo</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFrame === 'three5' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'three5' ? null : 'three5')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'three5' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-three5"
                    >
                      <img src={threePhotoFrame5} alt="Cupcake frame" className="w-full h-20 object-contain" />
                      <span className="text-xs">Cupcake</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Frame Design - Only show for 4 photos */}
              {photoCount === 4 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Frame Design:</h3>
                  <p className="text-xs text-gray-500 mb-2">Optional - Auto-detects if not selected</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={selectedFrame === 'four1' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'four1' ? null : 'four1')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'four1' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-four1"
                    >
                      <img src={fourPhotoFrame1} alt="4-photo frame 1" className="w-full h-20 object-contain" />
                      <span className="text-xs">Cute Stars</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFrame === 'four2' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'four2' ? null : 'four2')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'four2' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-four2"
                    >
                      <img src={fourPhotoFrame2} alt="4-photo frame 2" className="w-full h-20 object-contain" />
                      <span className="text-xs">Garden</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFrame === 'four3' ? "default" : "outline"}
                      onClick={() => setSelectedFrame(selectedFrame === 'four3' ? null : 'four3')}
                      className={`rounded-md h-auto py-2 flex flex-col items-center gap-1 ${selectedFrame === 'four3' ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-300 text-pink-500'}`}
                      data-testid="frame-four3"
                    >
                      <img src={fourPhotoFrame3} alt="4-photo frame 3" className="w-full h-20 object-contain" />
                      <span className="text-xs">Valentine</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Camera Selection */}
              {availableCameras.length > 1 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <SwitchCamera className="w-4 h-4" />
                    Camera:
                  </h3>
                  <Select value={selectedCameraId} onValueChange={switchCamera}>
                    <SelectTrigger className="w-full" data-testid="camera-selector">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCameras.map((camera) => (
                        <SelectItem 
                          key={camera.deviceId} 
                          value={camera.deviceId}
                          data-testid={`camera-option-${camera.deviceId.substring(0, 8)}`}
                        >
                          {camera.label || `Camera ${camera.deviceId.substring(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Card>

          {/* Center Panel - Camera */}
          <Card className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-pink-400 to-pink-500 text-white p-4 rounded-t-3xl">
              <h2 className="text-xl font-semibold text-center">your prettycamera</h2>
            </div>
            <div className="p-6">
              {/* Quality Warning */}
              {qualityWarning && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">{qualityWarning}</p>
                </div>
              )}
              
              {/* Camera Preview */}
              <div className="relative bg-black rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: '16/9', maxHeight: '280px' }}>
                {error ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <div className="text-center p-4">
                      <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">{error}</p>
                      <Button 
                        onClick={() => startCamera()} 
                        className="mt-2 bg-pink-500 hover:bg-pink-600"
                        size="sm"
                        data-testid="button-retry-camera"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                      style={{ 
                        imageRendering: 'crisp-edges',
                        filter: currentFilter === 'Original' ? '' : 
                                currentFilter === 'B&W' ? 'grayscale(1)' :
                                currentFilter === 'Blur' ? 'blur(2px)' :
                                currentFilter === 'Bright' ? 'brightness(1.3)' :
                                currentFilter === 'Sepia' ? 'sepia(1)' :
                                currentFilter === 'Vintage' ? 'sepia(0.5) contrast(1.2) brightness(1.1)' : ''
                      }}
                      data-testid="camera-preview"
                    />
                    
                    {/* Camera indicator */}
                    <div className="absolute top-3 left-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    </div>

                    {/* Photobooth capture overlay */}
                    {isCapturing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center text-white">
                          {countdown !== null ? (
                            <div className="space-y-4">
                              <div className="text-6xl font-bold">{countdown}</div>
                              <div className="text-lg">Photo {currentPhotoIndex + 1} of {photoCount}</div>
                              <div className="text-sm opacity-75">Get ready!</div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Timer className="w-16 h-16 mx-auto animate-pulse" />
                              <div className="text-lg">Capturing photo {currentPhotoIndex + 1} of {photoCount}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Capture Button */}
              <div className="text-center">
                <Button
                  onClick={photoCount === 1 ? capturePhoto : startPhotoboothCapture}
                  disabled={!isStreaming || isCapturing}
                  className="w-16 h-16 rounded-full bg-gradient-to-b from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 shadow-lg border-4 border-white p-0"
                  data-testid="button-capture"
                  aria-label={photoCount === 1 ? "Take single photo" : `Start ${photoCount}-photo photobooth sequence`}
                >
                  <Heart className="w-8 h-8 text-white fill-white" />
                </Button>
                {photoCount > 1 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {photoCount} photos with {delay}s delay
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Right Panel - Pictures */}
          <Card className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-pink-400 to-pink-500 text-white p-4 rounded-t-3xl">
              <h2 className="text-xl font-semibold text-center">your pictures</h2>
            </div>
            <div className="p-6">
              {/* Photo Stack */}
              <div className="relative mb-6" style={{ height: '300px' }}>
                {savedPhotos.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No photos yet</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-full">
                    {savedPhotos.slice(0, 3).map((photo, index) => {
                      const isNewPhoto = isPhotoAnimating && newPhotoIndex === index;
                      const rotationAngle = index === 0 ? 0 : (index - 1) * 5; // First photo (newest) has no rotation
                      return (
                        <div
                          key={`${index}-${photo.slice(0, 20)}`} // Unique key with photo data
                          className={`absolute bg-white rounded-xl shadow-md border-2 border-pink-200 overflow-hidden transition-all duration-500 ease-out ${
                            isNewPhoto ? 'animate-slide-down' : ''
                          }`}
                          style={{
                            width: '120px',
                            height: '150px',
                            left: '50%',
                            top: '50%',
                            transform: isNewPhoto 
                              ? `translate(-50%, -50%) rotate(0deg) translateY(-100px) scale(0.8)` 
                              : `translate(-50%, -50%) rotate(${rotationAngle}deg) translateY(${index * 8}px)`,
                            zIndex: 10 - index, // Newest (index 0) has highest z-index
                            '--rotation': `${rotationAngle}deg`,
                            '--final-y': `${index * 8}px`,
                          } as React.CSSProperties}
                          onAnimationEnd={() => {
                            if (isNewPhoto) {
                              setIsPhotoAnimating(false);
                              setNewPhotoIndex(null);
                            }
                          }}
                        >
                          <img 
                            src={photo} 
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Next Button */}
              <div className="text-center">
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-semibold px-8 py-2 rounded-full shadow-lg"
                  disabled={savedPhotos.length < photoCount}
                  data-testid="button-next"
                  aria-label={`Create photobooth strip with ${photoCount} photos`}
                >
                  NEXT
                </Button>
                {savedPhotos.length < photoCount && savedPhotos.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Need {photoCount - savedPhotos.length} more photos
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Contact Us */}
        <div className="text-center mt-8">
          <Button variant="ghost" className="text-gray-500 underline">
            Contact Us
          </Button>
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}