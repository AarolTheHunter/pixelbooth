import PhotoGallery from '../PhotoGallery';
import { useState } from 'react';

export default function PhotoGalleryExample() {
  // todo: remove mock functionality
  const [mockPhotos, setMockPhotos] = useState([
    {
      id: '1',
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNDBFMEQwIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkY4QTY1Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9InVybCgjYSkiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmaWxsPSJ3aGl0ZSI+📸</dGV4dD48L3N2Zz4=',
      timestamp: new Date('2024-01-15T10:30:00'),
      filter: 'vintage',
      shareCode: 'ABC123XY',
      likes: 12
    },
    {
      id: '2', 
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImIiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjOEM2NUU2Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkY4QTY1Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9InVybCgjYikiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmaWxsPSJ3aGl0ZSI+🎉</dGV4dD48L3N2Zz4=',
      timestamp: new Date('2024-01-14T14:22:00'),
      filter: 'sepia',
      likes: 8
    },
    {
      id: '3',
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImMiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNDBFMEQwIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjOEM2NUU2Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9InVybCgjYykiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmaWxsPSJ3aGl0ZSI+✨</dGV4dD48L3N2Zz4=',
      timestamp: new Date('2024-01-13T16:45:00'),
      filter: 'bright',
      shareCode: 'XYZ789AB',
      likes: 15
    }
  ]);
  
  const handleShare = (photo: any) => {
    console.log('Sharing photo:', photo.id);
    alert(`Sharing photo with filter: ${photo.filter}`);
  };
  
  const handleDelete = (photoId: string) => {
    console.log('Deleting photo:', photoId);
    setMockPhotos(prev => prev.filter(p => p.id !== photoId));
  };
  
  const handleDownload = (photo: any) => {
    console.log('Downloading photo:', photo.id);
    alert(`Downloaded photo with ${photo.filter} filter`);
  };
  
  return (
    <PhotoGallery 
      photos={mockPhotos}
      onShare={handleShare}
      onDelete={handleDelete}
      onDownload={handleDownload}
    />
  );
}