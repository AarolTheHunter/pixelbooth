import EmojiOverlay from '../EmojiOverlay';

export default function EmojiOverlayExample() {
  // todo: remove mock functionality
  const mockImageData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNDBFMEQwIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkY4QTY1Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSI0ODAiIGZpbGw9InVybCgjYSkiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmaWxsPSJ3aGl0ZSI+🎭</dGV4dD48L3N2Zz4=';
  
  const handleSave = (finalImage: string) => {
    console.log('Saving photo with emojis');
    alert('Photo saved with emojis! In a real app, this would save to the gallery.');
  };
  
  const handleCancel = () => {
    console.log('Cancelled emoji editing');
    alert('Cancelled emoji editing');
  };
  
  return (
    <EmojiOverlay 
      imageData={mockImageData}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}