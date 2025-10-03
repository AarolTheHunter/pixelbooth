import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Smile, X, Brush, Eraser, Palette, Sticker } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface EmojiElement {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface EmojiOverlayProps {
  imageData?: string;
  onSave: (finalImage: string) => void;
  onCancel: () => void;
}

export default function EmojiOverlay({ imageData, onSave, onCancel }: EmojiOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [emojis, setEmojis] = useState<EmojiElement[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const emojiCategories = {
    faces: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘'],
    gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘'],
    objects: ['🎉', '🎊', '🎈', '🎁', '🌟', '⭐', '✨', '💫', '🔥', '💥', '💢', '💯', '🏆', '🎯', '🎪', '🎭', '🎨']
  };

  const addEmoji = (emoji: string) => {
    const newEmoji: EmojiElement = {
      id: Date.now().toString(),
      emoji,
      x: Math.random() * 200 + 100,
      y: Math.random() * 200 + 100,
      scale: 1,
      rotation: 0
    };
    setEmojis(prev => [...prev, newEmoji]);
    console.log('Added emoji:', emoji);
  };

  const deleteEmoji = (id: string) => {
    setEmojis(prev => prev.filter(e => e.id !== id));
    setSelectedEmoji(null);
    console.log('Deleted emoji:', id);
  };

  const handleEmojiDrag = (id: string, deltaX: number, deltaY: number) => {
    setEmojis(prev => prev.map(emoji => 
      emoji.id === id 
        ? { ...emoji, x: Math.max(0, emoji.x + deltaX), y: Math.max(0, emoji.y + deltaY) }
        : emoji
    ));
  };

  const generateFinalImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Draw emojis
      emojis.forEach(emoji => {
        ctx.save();
        ctx.translate(emoji.x, emoji.y);
        ctx.rotate((emoji.rotation * Math.PI) / 180);
        ctx.scale(emoji.scale, emoji.scale);
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(emoji.emoji, 0, 16);
        ctx.restore();
      });

      // Return final image
      const finalImageData = canvas.toDataURL('image/png');
      onSave(finalImageData);
    };
    img.src = imageData;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col z-50">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur border-b p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold flex items-center">
            <Smile className="w-5 h-5 mr-2" />
            Add Emojis
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} data-testid="button-cancel-emoji">
              Cancel
            </Button>
            <Button onClick={generateFinalImage} className="hover-elevate" data-testid="button-save-emoji">
              Save Photo
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 p-4 overflow-auto">
          <div 
            ref={containerRef}
            className="relative inline-block border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden max-w-full max-h-full"
            style={{ minWidth: '400px', minHeight: '300px' }}
          >
            {imageData && (
              <img
                src={imageData}
                alt="Photo with emojis"
                className="block max-w-full h-auto"
                draggable={false}
              />
            )}
            
            {/* Emoji Elements */}
            {emojis.map(emoji => (
              <div
                key={emoji.id}
                className={`absolute cursor-move select-none text-4xl hover:scale-110 transition-transform ${
                  selectedEmoji === emoji.id ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                style={{
                  left: `${emoji.x}px`,
                  top: `${emoji.y}px`,
                  transform: `rotate(${emoji.rotation}deg) scale(${emoji.scale})`,
                  zIndex: selectedEmoji === emoji.id ? 10 : 1
                }}
                onClick={() => setSelectedEmoji(emoji.id)}
                onMouseDown={(e) => {
                  setIsDragging(true);
                  setSelectedEmoji(emoji.id);
                  const startX = e.clientX;
                  const startY = e.clientY;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaY = moveEvent.clientY - startY;
                    handleEmojiDrag(emoji.id, deltaX, deltaY);
                  };
                  
                  const handleMouseUp = () => {
                    setIsDragging(false);
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                data-testid={`emoji-element-${emoji.id}`}
              >
                {emoji.emoji}
                
                {/* Delete button for selected emoji */}
                {selectedEmoji === emoji.id && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEmoji(emoji.id);
                    }}
                    data-testid={`button-delete-emoji-${emoji.id}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Emoji Picker Sidebar */}
        <Card className="w-80 m-4 bg-card/95 backdrop-blur overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Choose Emojis</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {Object.entries(emojiCategories).map(([category, categoryEmojis]) => (
              <div key={category} className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
                  {category}
                </h4>
                <div className="grid grid-cols-6 gap-2">
                  {categoryEmojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      className="aspect-square p-0 text-2xl hover:bg-accent/50 hover-elevate active-elevate-2"
                      onClick={() => addEmoji(emoji)}
                      data-testid={`emoji-picker-${emoji}`}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hidden canvas for generating final image */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}