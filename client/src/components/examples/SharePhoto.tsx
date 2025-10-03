import SharePhoto from '../SharePhoto';

export default function SharePhotoExample() {
  // todo: remove mock functionality
  const mockPhoto = {
    id: 'example-123',
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNDBFMEQwIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkY4QTY1Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9InVybCgjYSkiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmaWxsPSJ3aGl0ZSI+🌟</dGV4dD48L3N2Zz4=',
    timestamp: new Date('2024-01-15T12:00:00'),
    filter: 'vintage'
  };
  
  const handleClose = () => {
    console.log('Closing share dialog');
    alert('Share dialog closed');
  };
  
  return (
    <SharePhoto 
      photo={mockPhoto}
      onClose={handleClose}
    />
  );
}