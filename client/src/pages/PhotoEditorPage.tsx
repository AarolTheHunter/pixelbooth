import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import PhotoEditor from '@/components/PhotoEditor';
import { useAuth } from '@/contexts/AuthContext';

interface Photo {
  id: string;
  src: string;
  timestamp: Date;
  filter: string;
  shareCode?: string;
  likes?: number;
}

export default function PhotoEditorPage() {
  const [, params] = useRoute('/editor/:sessionId');
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [imageData, setImageData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('PhotoEditorPage loading...', { sessionId: params?.sessionId, isAuthenticated });
    
    // Redirect to auth if not authenticated
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to auth');
      setLocation('/auth');
      return;
    }

    // Load image data from sessionStorage
    if (params?.sessionId) {
      console.log('=== PHOTOEDITORPAGE LOADING ===');
      console.log('Session ID:', params.sessionId);
      const storedImageData = sessionStorage.getItem(`editor:${params.sessionId}`);
      console.log('SessionStorage data found:', !!storedImageData);
      
      if (storedImageData) {
        const sizeInMB = (storedImageData.length * 0.75 / (1024 * 1024)).toFixed(2);
        console.log(`Data loaded from sessionStorage: ${sizeInMB}MB`);
        console.log(`Data URL prefix: ${storedImageData.substring(0, 50)}`);
        
        // Check image resolution
        const img = new Image();
        img.onload = () => {
          const megapixels = (img.width * img.height) / 1000000;
          console.log(`PhotoEditorPage received: ${img.width}x${img.height} (${megapixels.toFixed(1)}MP)`);
          
          if (megapixels < 1.0) {
            console.error(`⚠️ QUALITY LOSS IN PHOTOEDITORPAGE: Only ${megapixels.toFixed(1)}MP!`);
            console.error('The quality loss happened BEFORE PhotoEditorPage loaded the image!');
            console.error('Check App.tsx handleCapture logs to see what was stored in sessionStorage.');
          } else {
            console.log(`✅ Good quality in PhotoEditorPage: ${megapixels.toFixed(1)}MP`);
          }
          console.log('===============================');
        };
        img.src = storedImageData;
        
        setImageData(storedImageData);
        setIsLoading(false);
      } else {
        // No image data found, redirect to camera
        console.error('No image data found for session:', params.sessionId);
        console.log('Available sessionStorage keys:', Object.keys(sessionStorage));
        setLocation('/camera');
      }
    } else {
      // No session ID, redirect to camera
      console.log('No session ID provided, redirecting to camera');
      setLocation('/camera');
    }
  }, [params?.sessionId, isAuthenticated, setLocation]);

  const handleSavePhoto = (finalImage: string) => {
    // Save the photo to the app's photo collection
    const newPhoto: Photo = {
      id: Date.now().toString(),
      src: finalImage,
      timestamp: new Date(),
      filter: 'none',
      likes: 0
    };
    
    try {
      // Store in localStorage with quota handling
      const existingPhotos = JSON.parse(localStorage.getItem('photos') || '[]');
      // Keep only the most recent 5 photos to prevent quota issues
      const updatedPhotos = [newPhoto, ...existingPhotos].slice(0, 5);
      localStorage.setItem('photos', JSON.stringify(updatedPhotos));
      console.log('Photo saved to gallery');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old photos');
        // Clear old photos and try again with just the new photo
        localStorage.setItem('photos', JSON.stringify([newPhoto]));
      } else {
        console.error('Failed to save photo:', error);
      }
    }
    
    // Clean up session storage
    if (params?.sessionId) {
      sessionStorage.removeItem(`editor:${params.sessionId}`);
    }
    
    setLocation('/gallery');
  };

  const handleCancelEdit = () => {
    // Save without edits
    if (imageData) {
      const newPhoto: Photo = {
        id: Date.now().toString(),
        src: imageData,
        timestamp: new Date(),
        filter: 'none',
        likes: 0
      };
      
      try {
        // Store in localStorage with quota handling
        const existingPhotos = JSON.parse(localStorage.getItem('photos') || '[]');
        // Keep only the most recent 5 photos to prevent quota issues
        const updatedPhotos = [newPhoto, ...existingPhotos].slice(0, 5);
        localStorage.setItem('photos', JSON.stringify(updatedPhotos));
        console.log('Photo saved without edits');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing old photos');
          // Clear old photos and try again with just the new photo
          localStorage.setItem('photos', JSON.stringify([newPhoto]));
        } else {
          console.error('Failed to save photo:', error);
        }
      }
    }
    
    // Clean up session storage
    if (params?.sessionId) {
      sessionStorage.removeItem(`editor:${params.sessionId}`);
    }
    
    setLocation('/camera');
  };

  const handleBack = () => {
    // Clean up session storage without saving
    if (params?.sessionId) {
      sessionStorage.removeItem(`editor:${params.sessionId}`);
    }
    setLocation('/camera');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  if (!imageData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No image found</h2>
          <p className="text-muted-foreground mb-4">The editing session may have expired.</p>
          <Button onClick={() => setLocation('/camera')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Camera
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            data-testid="button-back-to-camera"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-lg font-semibold">Photo Editor</h1>
          
          <Button 
            onClick={() => handleSavePhoto(imageData)}
            data-testid="button-save-photo"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      {/* Main Editor Area - Full screen without height constraints */}
      <main className="flex-1 overflow-auto">
        <PhotoEditor
          imageData={imageData}
          onSave={handleSavePhoto}
          onCancel={handleCancelEdit}
        />
      </main>
    </div>
  );
}