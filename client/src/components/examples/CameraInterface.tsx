import PrettyClickCamera from '../PrettyClickCamera';
import { useState } from 'react';

export default function CameraInterfaceExample() {
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  
  const handleCapture = (imageData: string) => {
    setCapturedPhotos(prev => [...prev, imageData]);
    console.log('Photo captured and saved to gallery');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20">
      <PrettyClickCamera onCapture={handleCapture} />
      
      {capturedPhotos.length > 0 && (
        <div className="max-w-4xl mx-auto p-4 mt-8">
          <h3 className="text-lg font-semibold mb-4">Recently Captured ({capturedPhotos.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {capturedPhotos.map((photo, index) => (
              <img 
                key={index}
                src={photo}
                alt={`Captured photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-md border"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}