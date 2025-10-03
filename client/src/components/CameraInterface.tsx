import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Download, RotateCcw, Settings, Zap, Users, Heart, Timer } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface CameraInterfaceProps {
  onCapture: (imageData: string) => void;
  onPhotoboothCapture?: (images: string[], layout: 'couples' | 'friends') => void;
}

export default function CameraInterface({ onCapture, onPhotoboothCapture }: CameraInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoCollectionRef = useRef<string[]>([]);
  const captureSequenceRef = useRef<boolean>(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('none');
  const [selectedCategory, setSelectedCategory] = useState('basic');
  const [error, setError] = useState<string>('');

  // Photobooth state
  const [captureMode, setCaptureMode] = useState<'single' | 'couples' | 'friends'>('single');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const filters = [
    { id: 'none', name: 'Original', style: '', category: 'basic' },
    { id: 'sepia', name: 'Sepia', style: 'sepia(1)', category: 'vintage' },
    { id: 'grayscale', name: 'B&W', style: 'grayscale(1)', category: 'basic' },
    { id: 'blur', name: 'Blur', style: 'blur(2px)', category: 'artistic' },
    { id: 'vintage', name: 'Vintage', style: 'sepia(0.5) contrast(1.2) brightness(1.1)', category: 'vintage' },
    { id: 'bright', name: 'Bright', style: 'brightness(1.3) contrast(1.1)', category: 'enhance' },
    
    // Vintage & Film Effects
    { id: 'film1', name: 'Film', style: 'sepia(0.3) contrast(1.3) brightness(0.9) saturate(1.2)', category: 'vintage' },
    { id: 'retro', name: 'Retro', style: 'sepia(0.4) hue-rotate(15deg) contrast(1.1) brightness(1.1)', category: 'vintage' },
    { id: 'polaroid', name: 'Polaroid', style: 'sepia(0.2) contrast(1.2) brightness(1.1) saturate(0.8)', category: 'vintage' },
    { id: 'aged', name: 'Aged', style: 'sepia(0.6) contrast(1.3) brightness(0.8) saturate(0.7)', category: 'vintage' },
    
    // Color Enhancement
    { id: 'vivid', name: 'Vivid', style: 'contrast(1.2) saturate(1.4) brightness(1.1)', category: 'enhance' },
    { id: 'warm', name: 'Warm', style: 'sepia(0.1) hue-rotate(10deg) saturate(1.2)', category: 'enhance' },
    { id: 'cool', name: 'Cool', style: 'hue-rotate(180deg) saturate(1.1) brightness(1.05)', category: 'enhance' },
    { id: 'dramatic', name: 'Dramatic', style: 'contrast(1.5) brightness(0.9) saturate(1.3)', category: 'enhance' },
    { id: 'soft', name: 'Soft', style: 'contrast(0.8) brightness(1.2) saturate(0.9) blur(0.5px)', category: 'enhance' },
    
    // Artistic Effects
    { id: 'invert', name: 'Invert', style: 'invert(1)', category: 'artistic' },
    { id: 'neon', name: 'Neon', style: 'contrast(1.5) brightness(1.2) hue-rotate(90deg) saturate(2)', category: 'artistic' },
    { id: 'psychedelic', name: 'Psychedelic', style: 'hue-rotate(180deg) saturate(2) contrast(1.3)', category: 'artistic' },
    { id: 'cyberpunk', name: 'Cyberpunk', style: 'hue-rotate(270deg) contrast(1.4) brightness(0.8) saturate(1.5)', category: 'artistic' },
    { id: 'dream', name: 'Dream', style: 'blur(1px) brightness(1.3) contrast(0.8) saturate(1.2)', category: 'artistic' },
    
    // Black & White Variants
    { id: 'noir', name: 'Noir', style: 'grayscale(1) contrast(1.5) brightness(0.8)', category: 'basic' },
    { id: 'highcontrast', name: 'High Contrast', style: 'grayscale(1) contrast(2) brightness(0.9)', category: 'basic' },
    { id: 'softbw', name: 'Soft B&W', style: 'grayscale(1) contrast(0.8) brightness(1.1)', category: 'basic' },
    
    // Special Effects
    { id: 'sunset', name: 'Sunset', style: 'sepia(0.3) hue-rotate(30deg) saturate(1.3) brightness(1.1)', category: 'special' },
    { id: 'ocean', name: 'Ocean', style: 'hue-rotate(200deg) saturate(1.2) contrast(1.1)', category: 'special' },
    { id: 'forest', name: 'Forest', style: 'hue-rotate(90deg) saturate(1.1) contrast(1.2) brightness(0.95)', category: 'special' },
    { id: 'desert', name: 'Desert', style: 'sepia(0.2) hue-rotate(30deg) saturate(1.1) brightness(1.2)', category: 'special' },
    { id: 'space', name: 'Space', style: 'hue-rotate(240deg) contrast(1.4) brightness(0.7) saturate(1.5)', category: 'special' }
  ];

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError('');
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Camera access denied. Please allow camera permissions to use the photobooth.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Get the number of photos needed for the current mode
  const getPhotosNeeded = () => {
    switch (captureMode) {
      case 'couples': return 2;
      case 'friends': return 4;
      default: return 1;
    }
  };

  // Start countdown for next photo
  const startCountdown = () => {
    setCountdown(3);
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

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Apply filter to canvas context
    ctx.filter = filters.find(f => f.id === currentFilter)?.style || '';
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Get image data
    const imageData = canvas.toDataURL('image/png');
    
    // Add to photo collection using ref
    photoCollectionRef.current.push(imageData);
    const currentCount = photoCollectionRef.current.length;
    
    // Flash effect
    const flashDiv = document.createElement('div');
    flashDiv.className = 'fixed inset-0 bg-white z-50 pointer-events-none';
    document.body.appendChild(flashDiv);
    
    setTimeout(() => {
      document.body.removeChild(flashDiv);
    }, 150);
    
    console.log(`Photo ${currentCount} of ${getPhotosNeeded()} captured`);
    
    // Update display state
    setCapturedPhotos([...photoCollectionRef.current]);
    setCurrentPhotoIndex(currentCount);
    
    // Check if we have all photos needed
    if (currentCount >= getPhotosNeeded()) {
      // All photos captured, create photobooth strip
      captureSequenceRef.current = false;
      setIsCapturing(false);
      
      if (onPhotoboothCapture) {
        onPhotoboothCapture([...photoCollectionRef.current], captureMode as 'couples' | 'friends');
      }
      
      // Reset refs and state
      photoCollectionRef.current = [];
      setCapturedPhotos([]);
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
    setCapturedPhotos([]);
    setCurrentPhotoIndex(0);
    startCountdown();
  };

  // Single photo capture (original functionality)
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Apply filter to canvas context
    ctx.filter = filters.find(f => f.id === currentFilter)?.style || '';
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Get image data
    const imageData = canvas.toDataURL('image/png');
    onCapture(imageData);
    
    // Flash effect
    const flashDiv = document.createElement('div');
    flashDiv.className = 'fixed inset-0 bg-white z-50 pointer-events-none';
    document.body.appendChild(flashDiv);
    
    setTimeout(() => {
      document.body.removeChild(flashDiv);
    }, 150);
    
    console.log('Photo captured with filter:', currentFilter);
  };

  // Handle capture based on current mode
  const handleCapture = () => {
    if (captureMode === 'single') {
      capturePhoto();
    } else {
      startPhotoboothCapture();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Camera Viewfinder */}
      <Card className="relative overflow-hidden bg-black/10 backdrop-blur">
        <div className="aspect-video relative">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="text-center p-8">
                <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button 
                  onClick={startCamera} 
                  className="mt-4 hover-elevate"
                  data-testid="button-retry-camera"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
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
                className={`w-full h-full object-cover transition-all duration-300`}
                style={{ filter: filters.find(f => f.id === currentFilter)?.style }}
                data-testid="camera-preview"
              />
              
              {/* Camera overlay UI */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    <Zap className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    className="text-white hover:bg-white/20 pointer-events-auto hover-elevate"
                    data-testid="button-settings"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>

                {/* Photobooth capture progress */}
                {isCapturing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      {countdown !== null ? (
                        <div className="space-y-4">
                          <div className="text-6xl font-bold">{countdown}</div>
                          <div className="text-lg">Photo {currentPhotoIndex + 1} of {getPhotosNeeded()}</div>
                          <div className="text-sm opacity-75">Get ready!</div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Timer className="w-16 h-16 mx-auto animate-pulse" />
                          <div className="text-lg">Capturing photo {currentPhotoIndex + 1} of {getPhotosNeeded()}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Photo preview thumbnails */}
                {capturedPhotos.length > 0 && (
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    {capturedPhotos.map((photo, index) => (
                      <div key={index} className="w-12 h-12 rounded border-2 border-white/50 overflow-hidden">
                        <img src={photo} alt={`Captured ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Capture Mode Selection */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Capture Mode</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Button
            variant={captureMode === 'single' ? 'default' : 'outline'}
            onClick={() => setCaptureMode('single')}
            className="flex flex-col items-center p-4 h-auto hover-elevate"
            data-testid="mode-single"
          >
            <Camera className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Single Photo</span>
            <span className="text-xs text-muted-foreground">Classic capture</span>
          </Button>
          
          <Button
            variant={captureMode === 'couples' ? 'default' : 'outline'}
            onClick={() => setCaptureMode('couples')}
            className="flex flex-col items-center p-4 h-auto hover-elevate"
            data-testid="mode-couples"
          >
            <Heart className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Couples Strip</span>
            <span className="text-xs text-muted-foreground">2 photos</span>
          </Button>
          
          <Button
            variant={captureMode === 'friends' ? 'default' : 'outline'}
            onClick={() => setCaptureMode('friends')}
            className="flex flex-col items-center p-4 h-auto hover-elevate"
            data-testid="mode-friends"
          >
            <Users className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Friends Strip</span>
            <span className="text-xs text-muted-foreground">4 photos</span>
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Filters & Effects</h3>
        
        {/* Filter Categories */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['basic', 'vintage', 'enhance', 'artistic', 'special'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex-shrink-0 capitalize hover-elevate"
                data-testid={`category-${category}`}
              >
                {category === 'enhance' ? 'Enhance' : category === 'special' ? 'Themed' : category}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Filter Options */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {filters
            .filter(filter => filter.category === selectedCategory)
            .map((filter) => (
              <Button
                key={filter.id}
                variant={currentFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentFilter(filter.id)}
                className="hover-elevate active-elevate-2 text-xs"
                data-testid={`filter-${filter.id}`}
              >
                {filter.name}
              </Button>
            ))
          }
        </div>
      </div>

      {/* Capture Button */}
      <div className="mt-8 text-center">
        <Button
          size="lg"
          onClick={handleCapture}
          disabled={!isStreaming || isCapturing}
          className="bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90 text-white font-bold px-12 py-6 text-lg rounded-full shadow-lg hover-elevate active-elevate-2 transition-all duration-200"
          data-testid="button-capture"
        >
          <Camera className="w-6 h-6 mr-3" />
          {captureMode === 'single' ? 'CAPTURE' : 
           captureMode === 'couples' ? 'START COUPLES STRIP' : 
           'START FRIENDS STRIP'}
        </Button>
        
        {captureMode !== 'single' && (
          <p className="text-sm text-muted-foreground mt-2">
            {captureMode === 'couples' ? 'Take 2 photos for your couples strip' : 'Take 4 photos for your friends strip'}
          </p>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}