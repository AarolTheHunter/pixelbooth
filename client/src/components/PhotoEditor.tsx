import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, X, Brush, Eraser, Palette, Sticker, Plus, Save, Square, Upload, Type, Layout, Settings, Check } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ExportOptions, { ExportConfig } from './ExportOptions';

interface EmojiElement {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface TextOverlayElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
  shadow: boolean;
  outline: boolean;
  templateId?: string; // Track which template created this text
}

interface DrawingPath {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
}

interface BorderConfig {
  style: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  color: string;
  width: number;
  radius: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  config: {
    backgroundColor?: string;
    backgroundImage?: string;
    textElements?: Array<{
      text: string;
      x: number;
      y: number;
      fontSize: number;
      fontFamily: string;
      color: string;
    }>;
    decorativeElements?: Array<{
      type: string;
      x: number;
      y: number;
      scale: number;
      rotation: number;
    }>;
  };
  isPremium: boolean;
}

interface Frame {
  id: string;
  name: string;
  description: string;
  category: string;
  config: {
    borderStyle: string;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    shadowConfig?: {
      enabled: boolean;
      blur: number;
      color: string;
      offsetX: number;
      offsetY: number;
    };
  };
  isPremium: boolean;
}

interface PhotoEditorProps {
  imageData?: string;
  onSave: (finalImage: string) => void;
  onCancel: () => void;
}

export default function PhotoEditor({ imageData, onSave, onCancel }: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const borderCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<'emoji' | 'draw' | 'sticker' | 'border' | 'text' | 'template'>('emoji');
  const [drawMode, setDrawMode] = useState<'brush' | 'eraser'>('brush');
  const [emojis, setEmojis] = useState<EmojiElement[]>([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlayElement[]>([]);
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [brushColor, setBrushColor] = useState('#ff6b9d');
  const [brushSize, setBrushSize] = useState([8]);
  const [customColor, setCustomColor] = useState('#ff6b9d');
  const [savedColors, setSavedColors] = useState<string[]>([]);
  
  // Touch gesture state for mobile
  const [touchState, setTouchState] = useState({
    lastTouchDistance: 0,
    isPinching: false,
    isDragging: false,
    lastTouchCenter: { x: 0, y: 0 }
  });
  
  // Mobile detection hook
  const isMobile = useIsMobile();
  
  // Mobile tools state
  const [showMobileTools, setShowMobileTools] = useState(false);
  
  // Image transform state for mobile gestures
  const [imageTransform, setImageTransform] = useState({
    scale: 1,
    x: 0,
    y: 0
  });
  
  const [customStickers, setCustomStickers] = useState<string[]>([]);
  const [borderConfig, setBorderConfig] = useState<BorderConfig>({
    style: 'none',
    color: '#ff6b9d',
    width: 5,
    radius: 10
  });
  const [newTextInput, setNewTextInput] = useState('');
  const [textConfig, setTextConfig] = useState({
    fontSize: 32,
    fontFamily: 'Arial',
    color: '#ffffff',
    shadow: true,
    outline: true
  });

  // Template state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateCategories] = useState(['birthday', 'wedding', 'travel', 'family', 'modern']);
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<string>('all');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportPreview, setExportPreview] = useState<string>('');
  const [imageBounds, setImageBounds] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [displayTransform, setDisplayTransform] = useState({ scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 });
  
  // Dynamic resolution based on actual image dimensions - no forced upscaling
  const [baseWidth, setBaseWidth] = useState(1920);
  const [baseHeight, setBaseHeight] = useState(1080);
  
  // Auth and Toast
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Save to Gallery mutation
  const saveToGalleryMutation = useMutation({
    mutationFn: async (photoData: { imageData: string; isPublic: boolean }) => {
      return apiRequest('POST', '/api/photos', photoData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos/public'] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/users', user.id, 'photos'] });
      }
      toast({ 
        title: "Photo saved to gallery!",
        description: "Your edited photo has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to save photo",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const colors = [
    '#ff6b9d', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#6c5ce7', '#74b9ff', '#00d2d3',
    '#ff4757', '#2ed573', '#3742fa', '#ffa502', '#ff6348', '#5f27cd', '#1dd1a1', '#ff9ff3',
    '#54a0ff', '#a55eea', '#26de81', '#fed330', '#f368e0', '#ff3838', '#ff9500', '#ffdd59',
    '#c44569', '#f8b500', '#833471', '#a4b0be', '#57606f', '#2f3542', '#ffffff', '#000000'
  ];
  
  const emojiCategories = {
    faces: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩'],
    gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💕', '💞', '💓', '💗', '💖', '💘'],
    objects: ['🎉', '🎊', '🎈', '🎁', '🌟', '⭐', '✨', '💫', '🔥', '💥', '💢', '💯', '🏆', '🎯', '🎪']
  };

  const stickers = [
    // Food & Drinks
    '🍕', '🍔', '🍰', '🎂', '🧁', '🍭', '🍎', '🥑', '🌮', '🌯', '🥪', '🍿', '☕', '🍺', '🍷', '🥂',
    '🍦', '🍩', '🍪', '🥨', '🥯', '🧀', '🥓', '🌭', '🥞', '🍳', '🥗', '🍜', '🍝', '🍛', '🍣', '🍱',
    
    // Tech & Gaming
    '🎮', '🎧', '📱', '💻', '⌚', '📷', '🖥️', '⌨️', '🖱️', '💾', '💽', '📀', '🎚️', '🎛️', '📺', '📻',
    '🔌', '🔋', '💡', '🔦', '🕹️', '📟', '📠', '☎️', '📞', '📧', '📨', '📩', '📤', '📥', '📫', '📬',
    
    // Sports & Activities
    '🏀', '⚽', '🎾', '🏈', '⚾', '🎳', '🏓', '🏸', '🥅', '⛳', '🎯', '🏹', '🎣', '🥊', '🥋', '🎿',
    '⛷️', '🏂', '🛹', '🛼', '🚴', '🏊', '🏄', '🧗', '🤸', '🤾', '🤽', '🤹', '🎪', '🎭', '🎨', '🎬',
    
    // Nature & Weather
    '🌈', '⚡', '🔥', '❄️', '☀️', '🌙', '⭐', '✨', '☁️', '🌧️', '⛈️', '🌩️', '🌊', '🌀', '🌪️', '☄️',
    '🌍', '🌎', '🌏', '🌋', '🏔️', '⛰️', '🏕️', '🏖️', '🏜️', '🏝️', '🌲', '🌳', '🌴', '🌵', '🌿', '🍀',
    
    // Animals & Magical
    '🦄', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🙈', '🙉',
    '🙊', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦉', '🦅', '🦋', '🐛', '🐝', '🐞', '🦗', '🕷️', '🦂',
    
    // Objects & Symbols
    '🎵', '🎶', '🎸', '🎹', '🥁', '🎺', '🎷', '🎻', '🎤', '🎙️', '🎚️', '🎛️', '🎧', '📯', '🔔', '🔕',
    '💎', '💍', '👑', '🎩', '🧢', '👒', '🎓', '💄', '👄', '💋', '👠', '👢', '🧳', '👜', '🎒', '💼'
  ];

  useEffect(() => {
    if (imageData && imageRef.current) {
      const img = imageRef.current;
      const updateImageBounds = () => {
        // Set base resolution to image's natural dimensions for no upscaling
        if (img.naturalWidth && img.naturalHeight) {
          setBaseWidth(img.naturalWidth);
          setBaseHeight(img.naturalHeight);
          
          console.log('=== PHOTOEDITOR COMPONENT ===');
          console.log(`Image naturalWidth x naturalHeight: ${img.naturalWidth}x${img.naturalHeight}`);
          
          // Calculate megapixels for quality assessment
          const megapixels = (img.naturalWidth * img.naturalHeight) / 1000000;
          console.log(`PhotoEditor will use base resolution: ${img.naturalWidth}x${img.naturalHeight} (${megapixels.toFixed(1)}MP)`);
          
          if (megapixels < 1.0) {
            console.error(`⚠️ PHOTOEDITOR COMPONENT: Low resolution image ${megapixels.toFixed(1)}MP`);
            console.error('PhotoEditor exports will be limited to this resolution!');
            console.error('The quality loss happened BEFORE the image reached PhotoEditor component!');
          } else {
            console.log(`✅ PhotoEditor component has good quality: ${megapixels.toFixed(1)}MP`);
          }
          console.log('============================');
          
          // Prevent upscaling - cap display size to natural resolution divided by device pixel ratio
          const dpr = window.devicePixelRatio || 1;
          const maxDisplayWidth = img.naturalWidth / dpr;
          const maxDisplayHeight = img.naturalHeight / dpr;
          
          const container = containerRef.current;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            
            // Calculate target size that doesn't exceed natural resolution
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            let targetWidth = Math.min(containerRect.width, maxDisplayWidth);
            let targetHeight = targetWidth / aspectRatio;
            
            if (targetHeight > Math.min(containerRect.height, maxDisplayHeight)) {
              targetHeight = Math.min(containerRect.height, maxDisplayHeight);
              targetWidth = targetHeight * aspectRatio;
            }
            
            // Apply size constraints to prevent upscaling
            img.style.width = `${targetWidth}px`;
            img.style.height = `${targetHeight}px`;
            
            console.log(`Display size capped to: ${targetWidth}x${targetHeight} (no upscaling from ${img.naturalWidth}x${img.naturalHeight})`);
          }
        }
        
        const rect = img.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          // Store actual display bounds
          const displayBounds = {
            width: rect.width,
            height: rect.height,
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top
          };
          
          setImageBounds(displayBounds);
          
          // Calculate transform between native image resolution and display coordinates
          const scaleX = displayBounds.width / (img.naturalWidth || baseWidth);
          const scaleY = displayBounds.height / (img.naturalHeight || baseHeight);
          const offsetX = displayBounds.x;
          const offsetY = displayBounds.y;
          
          setDisplayTransform({ scaleX, scaleY, offsetX, offsetY });
          
          console.log('Display transform:', { scaleX, scaleY, offsetX, offsetY });
        }
      };
      
      img.onload = updateImageBounds;
      if (img.complete) updateImageBounds();
      
      window.addEventListener('resize', updateImageBounds);
      return () => window.removeEventListener('resize', updateImageBounds);
    }
  }, [imageData, baseWidth, baseHeight]);

  // Helper functions to convert between display and logical coordinates
  const logicalToDisplay = useCallback((logicalX: number, logicalY: number) => ({
    x: logicalX * displayTransform.scaleX + displayTransform.offsetX,
    y: logicalY * displayTransform.scaleY + displayTransform.offsetY
  }), [displayTransform]);

  const displayToLogical = useCallback((displayX: number, displayY: number) => ({
    x: (displayX - displayTransform.offsetX) / displayTransform.scaleX,
    y: (displayY - displayTransform.offsetY) / displayTransform.scaleY
  }), [displayTransform]);

  const addEmoji = (emoji: string) => {
    // Use logical coordinates (1920x1080) instead of display coordinates
    const centerX = baseWidth / 2;
    const centerY = baseHeight / 2;
    
    const newEmoji: EmojiElement = {
      id: Date.now().toString(),
      emoji,
      x: centerX - 24, // Center the emoji (48px font size / 2)
      y: centerY - 24,
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

  const handleEmojiDrag = useCallback((id: string, newX: number, newY: number) => {
    setEmojis(prev => prev.map(emoji => {
      if (emoji.id !== id) return emoji;
      
      // Convert display coordinates to logical coordinates
      const logical = displayToLogical(newX, newY);
      
      // Constrain within TARGET resolution
      const constrainedX = Math.max(0, Math.min(logical.x, baseWidth - 48));
      const constrainedY = Math.max(0, Math.min(logical.y, baseHeight - 48));
      
      return { ...emoji, x: constrainedX, y: constrainedY };
    }));
  }, [displayToLogical, baseWidth, baseHeight]);

  // Text overlay functions
  const addTextOverlay = () => {
    if (!newTextInput.trim()) return;
    
    // Use logical coordinates (1920x1080) instead of display coordinates
    const centerX = baseWidth / 2;
    const centerY = baseHeight / 2;
    
    const newText: TextOverlayElement = {
      id: Date.now().toString(),
      text: newTextInput.trim(),
      x: centerX - (textConfig.fontSize * newTextInput.length) / 4, // Approximate center
      y: centerY - textConfig.fontSize / 2,
      fontSize: textConfig.fontSize,
      fontFamily: textConfig.fontFamily,
      color: textConfig.color,
      rotation: 0,
      shadow: textConfig.shadow,
      outline: textConfig.outline
    };
    setTextOverlays(prev => [...prev, newText]);
    setNewTextInput('');
    console.log('Added text overlay:', newText.text);
  };

  const deleteTextOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(t => t.id !== id));
    setSelectedText(null);
    console.log('Deleted text overlay:', id);
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlayElement>) => {
    setTextOverlays(prev => prev.map(text => 
      text.id === id ? { ...text, ...updates } : text
    ));
  };

  // Template and Frame functions
  const fetchTemplates = useCallback(async (category?: string) => {
    try {
      const url = category && category !== 'all' ? `/api/templates?category=${category}` : '/api/templates';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  }, []);

  const applyTemplate = (template: Template) => {
    setSelectedTemplate(template);
    // Apply template text elements using logical coordinates
    if (template.config.textElements) {
      const newTextOverlays = template.config.textElements.map(element => ({
        id: `template-text-${Date.now()}-${Math.random()}`,
        text: element.text,
        x: (element.x / 100) * baseWidth,  // Use logical coordinates
        y: (element.y / 100) * baseHeight, // Use logical coordinates
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        color: element.color,
        rotation: 0,
        shadow: false,
        outline: false,
        templateId: template.id // Track the template that created this text
      }));
      setTextOverlays(prev => [...prev, ...newTextOverlays]);
    }
  };

  const removeTemplate = () => {
    if (selectedTemplate) {
      // Remove only text overlays from the currently selected template
      setTextOverlays(prev => prev.filter(text => text.templateId !== selectedTemplate.id));
    }
    setSelectedTemplate(null);
  };

  const handleTextDrag = useCallback((id: string, newX: number, newY: number) => {
    setTextOverlays(prev => prev.map(text => {
      if (text.id !== id) return text;
      
      // Convert display coordinates to logical coordinates
      const logical = displayToLogical(newX, newY);
      
      // Constrain within TARGET resolution (estimate text width)
      const textWidth = text.fontSize * text.text.length * 0.6;
      const constrainedX = Math.max(0, Math.min(logical.x, baseWidth - textWidth));
      const constrainedY = Math.max(text.fontSize, Math.min(logical.y, baseHeight));
      
      return { ...text, x: constrainedX, y: constrainedY };
    }));
  }, [displayToLogical, baseWidth, baseHeight]);

  // Custom sticker handling
  const handleStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;
      setCustomStickers(prev => [...prev, imageDataUrl]);
      console.log('Added custom sticker');
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  const addCustomSticker = (stickerDataUrl: string) => {
    // Use logical coordinates (1920x1080) instead of display coordinates
    const centerX = baseWidth / 2;
    const centerY = baseHeight / 2;
    
    const newSticker: EmojiElement = {
      id: Date.now().toString(),
      emoji: stickerDataUrl, // Store the data URL as emoji
      x: centerX - 24,
      y: centerY - 24,
      scale: 1,
      rotation: 0
    };
    setEmojis(prev => [...prev, newSticker]);
    console.log('Added custom sticker');
  };

  const removeCustomSticker = (index: number) => {
    setCustomStickers(prev => prev.filter((_, i) => i !== index));
    console.log('Removed custom sticker:', index);
  };

  const startDrawing = useCallback((e: React.MouseEvent) => {
    if (mode !== 'draw' || !drawingCanvasRef.current) return;
    
    setIsDrawing(true);
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;
    
    // Convert to logical coordinates
    const logical = displayToLogical(displayX, displayY);
    
    console.log('Start drawing at:', { logical, mode });
    
    // Only draw within logical bounds
    if (logical.x < 0 || logical.y < 0 || logical.x > baseWidth || logical.y > baseHeight) {
      console.log('Drawing outside bounds, stopping');
      return;
    }
    
    const newPath: DrawingPath = {
      id: Date.now().toString(),
      points: [{ x: logical.x, y: logical.y }],
      color: drawMode === 'eraser' ? 'transparent' : brushColor,
      width: brushSize[0]
    };
    setCurrentPath(newPath);
    console.log('Created new drawing path:', newPath);
  }, [mode, brushColor, brushSize, drawMode, displayToLogical, baseWidth, baseHeight]);

  const draw = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !currentPath || !drawingCanvasRef.current) return;
    
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;
    
    // Convert to logical coordinates
    const logical = displayToLogical(displayX, displayY);
    
    // Only draw within logical bounds
    if (logical.x < 0 || logical.y < 0 || logical.x > baseWidth || logical.y > baseHeight) return;
    
    const updatedPath = {
      ...currentPath,
      points: [...currentPath.points, { x: logical.x, y: logical.y }]
    };
    setCurrentPath(updatedPath);
    
    // Draw on canvas using display coordinates for visual feedback
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (drawMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
    }
    
    ctx.lineWidth = brushSize[0] * displayTransform.scaleX;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const points = updatedPath.points;
    if (points.length > 1) {
      const lastPoint = points[points.length - 2];
      const currentPoint = points[points.length - 1];
      
      // Convert logical coordinates back to display for drawing
      const lastDisplay = logicalToDisplay(lastPoint.x, lastPoint.y);
      const currentDisplay = logicalToDisplay(currentPoint.x, currentPoint.y);
      
      ctx.beginPath();
      ctx.moveTo(lastDisplay.x, lastDisplay.y);
      ctx.lineTo(currentDisplay.x, currentDisplay.y);
      ctx.stroke();
    }
  }, [isDrawing, currentPath, brushColor, brushSize, displayToLogical, logicalToDisplay, displayTransform, drawMode, baseWidth, baseHeight]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && currentPath) {
      setDrawingPaths(prev => [...prev, currentPath]);
      setCurrentPath(null);
    }
    setIsDrawing(false);
  }, [isDrawing, currentPath]);

  const clearDrawing = () => {
    setDrawingPaths([]);
    setCurrentPath(null);
    redrawOverlayFromPaths([]);
    console.log('Cleared all drawings');
  };

  // Redraw all drawing paths on the canvas
  const redrawOverlayFromPaths = useCallback((paths: DrawingPath[] = drawingPaths) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all paths using logical to display conversion
    paths.forEach(path => {
      if (path.points.length < 2) return;
      
      if (path.color === 'transparent') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = path.color;
      }
      
      ctx.lineWidth = path.width * displayTransform.scaleX;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      path.points.forEach((point, index) => {
        // Convert logical coordinates to display coordinates
        const display = logicalToDisplay(point.x, point.y);
        
        if (index === 0) {
          ctx.moveTo(display.x, display.y);
        } else {
          ctx.lineTo(display.x, display.y);
        }
      });
      ctx.stroke();
    });
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }, [drawingPaths, displayTransform, logicalToDisplay]);

  // Redraw border overlay
  const redrawBorderOverlay = useCallback(() => {
    const canvas = borderCanvasRef.current;
    if (!canvas || borderConfig.style === 'none') {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up border styling
    ctx.strokeStyle = borderConfig.color;
    ctx.lineWidth = borderConfig.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Set line dash pattern
    switch (borderConfig.style) {
      case 'dashed':
        ctx.setLineDash([borderConfig.width * 3, borderConfig.width * 2]);
        break;
      case 'dotted':
        ctx.setLineDash([borderConfig.width, borderConfig.width]);
        break;
      default:
        ctx.setLineDash([]);
        break;
    }
    
    const borderOffset = borderConfig.width / 2;
    const x = imageBounds.x + borderOffset;
    const y = imageBounds.y + borderOffset;
    const width = imageBounds.width - borderConfig.width;
    const height = imageBounds.height - borderConfig.width;
    
    if (borderConfig.style === 'double') {
      // Draw outer border
      ctx.lineWidth = borderConfig.width / 3;
      if (borderConfig.radius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, borderConfig.radius);
        ctx.stroke();
        
        // Draw inner border
        const innerOffset = borderConfig.width * 0.67;
        ctx.beginPath();
        ctx.roundRect(
          x + innerOffset, 
          y + innerOffset, 
          width - innerOffset * 2, 
          height - innerOffset * 2, 
          Math.max(0, borderConfig.radius - innerOffset)
        );
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, width, height);
        const innerOffset = borderConfig.width * 0.67;
        ctx.strokeRect(x + innerOffset, y + innerOffset, width - innerOffset * 2, height - innerOffset * 2);
      }
    } else {
      // Draw single border
      if (borderConfig.radius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, borderConfig.radius);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, width, height);
      }
    }
  }, [borderConfig, imageBounds]);

  const borderStyles = [
    { value: 'none', label: 'None' },
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'double', label: 'Double' }
  ] as const;

  const saveCustomColor = () => {
    if (customColor && !savedColors.includes(customColor)) {
      setSavedColors(prev => [...prev, customColor]);
      setBrushColor(customColor);
      console.log('Saved custom color:', customColor);
    }
  };

  const removeCustomColor = (color: string) => {
    setSavedColors(prev => prev.filter(c => c !== color));
    console.log('Removed custom color:', color);
  };

  const generateFinalImage = (exportConfig?: ExportConfig) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Default to native image resolution - no upscaling for best quality
      let targetWidth = baseWidth;
      let targetHeight = baseHeight;
      
      if (exportConfig?.size && exportConfig.size !== 'original') {
        if (exportConfig.width && exportConfig.height) {
          // Use custom dimensions
          targetWidth = exportConfig.width;
          targetHeight = exportConfig.height;
        } else {
          // Use preset dimensions with 1920x1080 as base
          switch (exportConfig.size) {
            case 'large':
              targetWidth = baseWidth;
              targetHeight = baseHeight;
              break;
            case 'medium':
              targetWidth = 1280;
              targetHeight = 720; // Maintain 16:9 aspect ratio
              break;
            case 'small':
              targetWidth = 640;
              targetHeight = 360; // Maintain 16:9 aspect ratio
              break;
          }
        }
      } else if (exportConfig?.size === 'original') {
        // Only use original size if explicitly requested
        targetWidth = img.width;
        targetHeight = img.height;
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Calculate how to fit the image into the target canvas while maintaining aspect ratio
      const imgAspectRatio = img.width / img.height;
      const canvasAspectRatio = targetWidth / targetHeight;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspectRatio > canvasAspectRatio) {
        // Image is wider - fit to width with letterboxing top/bottom
        drawWidth = targetWidth;
        drawHeight = targetWidth / imgAspectRatio;
        drawX = 0;
        drawY = (targetHeight - drawHeight) / 2;
      } else {
        // Image is taller - fit to height with letterboxing left/right
        drawHeight = targetHeight;
        drawWidth = targetHeight * imgAspectRatio;
        drawX = (targetWidth - drawWidth) / 2;
        drawY = 0;
      }

      // Draw original image fitted to canvas
      ctx.fillStyle = '#000000'; // Black letterbox background
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Apply template background if selected
      if (selectedTemplate && selectedTemplate.config.backgroundColor) {
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = selectedTemplate.config.backgroundColor;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      // Scale factor for all elements - scale from display bounds to target resolution
      const scaleX = targetWidth / baseWidth;
      const scaleY = targetHeight / baseHeight;

      // Draw all drawing paths
      drawingPaths.forEach(path => {
        if (path.points.length < 2) return;
        
        if (path.color === 'transparent') {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = path.color;
        }
        
        ctx.lineWidth = path.width * scaleX;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        path.points.forEach((point, index) => {
          const scaledX = point.x * scaleX;
          const scaledY = point.y * scaleY;
          
          if (index === 0) {
            ctx.moveTo(scaledX, scaledY);
          } else {
            ctx.lineTo(scaledX, scaledY);
          }
        });
        ctx.stroke();
      });

      // Draw border if enabled
      if (borderConfig.style !== 'none') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = borderConfig.color;
        ctx.lineWidth = borderConfig.width * scaleX;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Set line dash pattern
        switch (borderConfig.style) {
          case 'dashed':
            const dashSize = ctx.lineWidth * 3;
            const gapSize = ctx.lineWidth * 2;
            ctx.setLineDash([dashSize, gapSize]);
            break;
          case 'dotted':
            ctx.setLineDash([ctx.lineWidth, ctx.lineWidth]);
            break;
          default:
            ctx.setLineDash([]);
            break;
        }
        
        const borderOffset = ctx.lineWidth / 2;
        const borderRadius = borderConfig.radius * scaleX;
        
        if (borderConfig.style === 'double') {
          // Draw outer border
          ctx.lineWidth = (borderConfig.width / 3) * scaleX;
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(
              borderOffset, 
              borderOffset, 
              targetWidth - ctx.lineWidth, 
              targetHeight - ctx.lineWidth, 
              borderRadius
            );
            ctx.stroke();
            
            // Draw inner border
            const innerOffset = (borderConfig.width * 0.67) * scaleX;
            const innerRadius = Math.max(0, borderRadius - innerOffset);
            ctx.beginPath();
            ctx.roundRect(
              innerOffset, 
              innerOffset, 
              targetWidth - innerOffset * 2, 
              targetHeight - innerOffset * 2, 
              innerRadius
            );
            ctx.stroke();
          } else {
            ctx.strokeRect(borderOffset, borderOffset, targetWidth - ctx.lineWidth, targetHeight - ctx.lineWidth);
            const innerOffset = (borderConfig.width * 0.67) * scaleX;
            ctx.strokeRect(innerOffset, innerOffset, targetWidth - innerOffset * 2, targetHeight - innerOffset * 2);
          }
        } else {
          // Draw single border
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(
              borderOffset, 
              borderOffset, 
              targetWidth - ctx.lineWidth, 
              targetHeight - ctx.lineWidth, 
              borderRadius
            );
            ctx.stroke();
          } else {
            ctx.strokeRect(borderOffset, borderOffset, targetWidth - ctx.lineWidth, targetHeight - ctx.lineWidth);
          }
        }
        
        // Reset line dash
        ctx.setLineDash([]);
      }

      // Draw text overlays
      textOverlays.forEach(text => {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        
        const scaledX = text.x * scaleX;
        const scaledY = text.y * scaleY;
        const scaledFontSize = text.fontSize * scaleX;
        
        // Set up text properties
        ctx.font = `${scaledFontSize}px ${text.fontFamily}`;
        ctx.fillStyle = text.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Apply rotation if any
        if (text.rotation !== 0) {
          ctx.translate(scaledX, scaledY);
          ctx.rotate((text.rotation * Math.PI) / 180);
          ctx.translate(-scaledX, -scaledY);
        }
        
        // Add text shadow if enabled
        if (text.shadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }
        
        // Add text outline if enabled
        if (text.outline) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.lineWidth = 1;
          ctx.strokeText(text.text, scaledX, scaledY);
        }
        
        // Draw the main text
        ctx.fillText(text.text, scaledX, scaledY);
        
        ctx.restore();
      });

      // Draw emojis and custom stickers
      const emojiPromises = emojis.map(emoji => {
        return new Promise<void>((resolve) => {
          ctx.save();
          const scaledX = emoji.x * scaleX;
          const scaledY = emoji.y * scaleY;
          const scaledSize = 48 * scaleX;
          
          ctx.translate(scaledX + scaledSize/2, scaledY + scaledSize/2);
          ctx.rotate((emoji.rotation * Math.PI) / 180);
          ctx.scale(emoji.scale, emoji.scale);
          
          if (emoji.emoji.startsWith('data:')) {
            // Handle custom sticker (image)
            const stickerImg = new Image();
            stickerImg.onload = () => {
              ctx.drawImage(stickerImg, -scaledSize/2, -scaledSize/2, scaledSize, scaledSize);
              ctx.restore();
              resolve();
            };
            stickerImg.onerror = () => {
              ctx.restore();
              resolve();
            };
            stickerImg.src = emoji.emoji;
          } else {
            // Handle text emoji
            ctx.font = `${scaledSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(emoji.emoji, 0, scaledSize/3);
            ctx.restore();
            resolve();
          }
        });
      });

      // Wait for all emojis/stickers to be drawn before processing final image
      Promise.all(emojiPromises).then(() => {
        // Generate final image with specified format and maximum quality
        const format = exportConfig?.format || 'png';
        const quality = exportConfig?.quality || 1.0;
        
        // Use toBlob for better quality control and larger file support
        const generateBlob = () => {
          return new Promise<string>((resolve) => {
            const handleBlob = (blob: Blob | null) => {
              if (blob) {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              } else {
                // Fallback to toDataURL if toBlob fails
                let fallbackData: string;
                switch (format) {
                  case 'jpeg':
                    fallbackData = canvas.toDataURL('image/jpeg', quality);
                    break;
                  case 'webp':
                    fallbackData = canvas.toDataURL('image/webp', quality);
                    break;
                  default:
                    fallbackData = canvas.toDataURL('image/png');
                    break;
                }
                resolve(fallbackData);
              }
            };
            
            switch (format) {
              case 'jpeg':
                canvas.toBlob(handleBlob, 'image/jpeg', quality);
                break;
              case 'webp':
                canvas.toBlob(handleBlob, 'image/webp', quality);
                break;
              default:
                // For PNG, don't specify quality (lossless)
                canvas.toBlob(handleBlob, 'image/png');
                break;
            }
          });
        };
        
        generateBlob().then(finalImageData => {
          if (exportConfig) {
            // Handle export action (download or share)
            if (exportConfig.action === 'share') {
              shareImageData(finalImageData, exportConfig);
            } else {
              downloadImageData(finalImageData, exportConfig);
            }
          } else {
            // Save through the normal flow
            onSave(finalImageData);
          }
        });
      });
    };
    img.src = imageData;
  };

  const downloadImageData = (dataUrl: string, config: ExportConfig) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    const extension = config.format === 'jpeg' ? 'jpg' : config.format;
    link.download = `${config.filename}.${extension}`;
    link.click();
  };

  const shareImageData = async (dataUrl: string, config: ExportConfig) => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const extension = config.format === 'jpeg' ? 'jpg' : config.format;
      const filename = `${config.filename}.${extension}`;
      
      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: blob.type });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'PrettyClick Photo',
            text: 'Check out this photo I created with PrettyClick!',
            files: [file]
          });
          return;
        }
      }
      
      // Fallback: Copy share URL to clipboard and show instructions
      const shareUrl = `${window.location.origin}/shared/${Date.now()}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Photo prepared for sharing! Share URL copied to clipboard.\n\nNote: For direct image sharing, use the download option and share the file manually.');
      
    } catch (error) {
      console.error('Sharing failed:', error);
      alert('Sharing failed. Please use the download option instead.');
    }
  };

  const handleSaveToGallery = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save photos to your gallery.",
        variant: "destructive"
      });
      return;
    }

    // Generate the final image with all edits, then save to gallery
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Use native resolution for gallery save
      let targetWidth = baseWidth;
      let targetHeight = baseHeight;

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the base image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Draw all editing elements (paths, emojis, text, borders)
      const scaleX = targetWidth / imageBounds.width;
      const scaleY = targetHeight / imageBounds.height;

      // Draw paths
      drawingPaths.forEach(path => {
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width * Math.min(scaleX, scaleY);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        path.points.forEach((point, index) => {
          const x = (point.x - imageBounds.x) * scaleX;
          const y = (point.y - imageBounds.y) * scaleY;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      });

      // Draw text overlays
      textOverlays.forEach(text => {
        ctx.save();
        const x = (text.x - imageBounds.x) * scaleX;
        const y = (text.y - imageBounds.y) * scaleY;
        ctx.translate(x, y);
        ctx.rotate((text.rotation * Math.PI) / 180);
        ctx.font = `${text.fontSize * Math.min(scaleX, scaleY)}px ${text.fontFamily}`;
        ctx.fillStyle = text.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (text.shadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 4 * Math.min(scaleX, scaleY);
          ctx.shadowOffsetX = 2 * scaleX;
          ctx.shadowOffsetY = 2 * scaleY;
        }

        if (text.outline) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2 * Math.min(scaleX, scaleY);
          ctx.strokeText(text.text, 0, 0);
        }

        ctx.fillText(text.text, 0, 0);
        ctx.restore();
      });

      // Draw emojis and stickers
      const emojiPromises = emojis.map(emoji => {
        return new Promise<void>((resolve) => {
          const scaledSize = emoji.scale * 50 * Math.min(scaleX, scaleY);
          ctx.save();
          const x = (emoji.x - imageBounds.x) * scaleX;
          const y = (emoji.y - imageBounds.y) * scaleY;
          ctx.translate(x, y);
          ctx.rotate((emoji.rotation * Math.PI) / 180);
          ctx.font = `${scaledSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji.emoji, 0, scaledSize/3);
          ctx.restore();
          resolve();
        });
      });

      // Wait for all elements to be drawn, then save to gallery
      Promise.all(emojiPromises).then(() => {
        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              const imageData = reader.result as string;
              saveToGalleryMutation.mutate({ imageData, isPublic: true });
            };
            reader.readAsDataURL(blob);
          } else {
            // Fallback to toDataURL
            const imageData = canvas.toDataURL('image/png');
            saveToGalleryMutation.mutate({ imageData, isPublic: true });
          }
        }, 'image/png');
      });
    };
    img.src = imageData;
  };

  const handleExportPhoto = () => {
    // Generate preview for export options
    const tempCanvas = canvasRef.current;
    if (!tempCanvas || !imageData) return;
    
    // Create a temporary small preview
    const previewCanvas = document.createElement('canvas');
    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) return;
    
    const img = new Image();
    img.onload = () => {
      previewCanvas.width = 400;
      previewCanvas.height = (400 * img.height) / img.width;
      previewCtx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
      
      const previewData = previewCanvas.toDataURL('image/png');
      setExportPreview(previewData);
      setShowExportOptions(true);
    };
    img.src = imageData;
  };

  const handleExport = (config: ExportConfig) => {
    generateFinalImage(config);
    setShowExportOptions(false);
  };

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Fetch templates when category changes
  useEffect(() => {
    fetchTemplates(activeTemplateCategory === 'all' ? undefined : activeTemplateCategory);
  }, [activeTemplateCategory, fetchTemplates]);

  // Update canvas dimensions and redraw when image bounds change
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    
    if (drawingCanvasRef.current && imageBounds.width > 0) {
      const canvas = drawingCanvasRef.current;
      const cssWidth = imageBounds.width + imageBounds.x * 2;
      const cssHeight = imageBounds.height + imageBounds.y * 2;
      
      // Set CSS size
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      
      // Set actual bitmap size with device pixel ratio for crisp display
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      
      // Scale the context to account for device pixel ratio
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
      
      redrawOverlayFromPaths();
    }
    
    if (borderCanvasRef.current && imageBounds.width > 0) {
      const canvas = borderCanvasRef.current;
      const cssWidth = imageBounds.width + imageBounds.x * 2;
      const cssHeight = imageBounds.height + imageBounds.y * 2;
      
      // Set CSS size
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      
      // Set actual bitmap size with device pixel ratio for crisp display
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      
      // Scale the context to account for device pixel ratio
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
      
      redrawBorderOverlay();
    }
  }, [imageBounds, redrawOverlayFromPaths, redrawBorderOverlay]);

  // Redraw when drawing paths change (but not during active drawing)
  useEffect(() => {
    if (!isDrawing) {
      redrawOverlayFromPaths();
    }
  }, [redrawOverlayFromPaths, isDrawing]);

  // Redraw border when config changes
  useEffect(() => {
    redrawBorderOverlay();
  }, [redrawBorderOverlay]);

  // Touch gesture helpers for mobile
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchCenter = (touches: React.TouchList): { x: number; y: number } => {
    if (touches.length === 0) return { x: 0, y: 0 };
    let x = 0, y = 0;
    for (let i = 0; i < touches.length; i++) {
      x += touches[i].clientX;
      y += touches[i].clientY;
    }
    return { x: x / touches.length, y: y / touches.length };
  };

  // Touch event handlers for mobile gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touches = e.touches;
    if (touches.length === 2) {
      // Pinch gesture
      const distance = getTouchDistance(touches);
      const center = getTouchCenter(touches);
      setTouchState(prev => ({
        ...prev,
        isPinching: true,
        lastTouchDistance: distance,
        lastTouchCenter: center
      }));
    } else if (touches.length === 1) {
      // Single touch - pan gesture
      const center = getTouchCenter(touches);
      setTouchState(prev => ({
        ...prev,
        isDragging: true,
        lastTouchCenter: center
      }));
    }
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    e.preventDefault();
    
    const touches = e.touches;
    if (touches.length === 2 && touchState.isPinching) {
      // Handle pinch-to-zoom
      const distance = getTouchDistance(touches);
      const center = getTouchCenter(touches);
      
      if (touchState.lastTouchDistance > 0) {
        const scale = distance / touchState.lastTouchDistance;
        const deltaScale = scale - 1;
        
        // Apply zoom (limited scaling for reasonable experience)
        if (Math.abs(deltaScale) > 0.01) {
          setImageTransform(prev => ({
            ...prev,
            scale: Math.max(0.5, Math.min(3, prev.scale + deltaScale * 0.5))
          }));
        }
      }
      
      setTouchState(prev => ({
        ...prev,
        lastTouchDistance: distance,
        lastTouchCenter: center
      }));
    } else if (touches.length === 1 && touchState.isDragging) {
      // Handle pan gesture
      const center = getTouchCenter(touches);
      const deltaX = center.x - touchState.lastTouchCenter.x;
      const deltaY = center.y - touchState.lastTouchCenter.y;
      
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        setImageTransform(prev => ({
          ...prev,
          x: prev.x + deltaX * 0.5,
          y: prev.y + deltaY * 0.5
        }));
        
        setTouchState(prev => ({
          ...prev,
          lastTouchCenter: center
        }));
      }
    }
  }, [isMobile, touchState, setImageTransform]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    
    setTouchState(prev => ({
      ...prev,
      isPinching: false,
      isDragging: false,
      lastTouchDistance: 0
    }));
  }, [isMobile]);

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col z-50">
      {/* Header with Mode Selector */}
      <div className="bg-card/95 backdrop-blur border-b shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full"></div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">Photo Editor</h2>
              <p className="text-xs text-muted-foreground">Transform your photos with creative tools</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="hover-elevate" data-testid="button-cancel-editor">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveToGallery} 
              variant="default"
              disabled={saveToGalleryMutation.isPending}
              className="hover-elevate" 
              data-testid="button-save-to-gallery"
            >
              {saveToGalleryMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save to Gallery
                </>
              )}
            </Button>
            <Button onClick={handleExportPhoto} className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white border-0 hover-elevate" data-testid="button-export-photo">
              Export Photo
            </Button>
          </div>
        </div>
        
        {/* Mode Selector - Horizontal */}
        <div className="p-3 bg-gradient-to-r from-muted/20 to-muted/10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={mode === 'emoji' ? 'default' : 'outline'}
              onClick={() => setMode('emoji')}
              className="hover-elevate"
              data-testid="button-emoji-mode"
            >
              <Smile className="w-4 h-4 mr-1" />
              Emoji
            </Button>
            <Button
              size="sm"
              variant={mode === 'draw' ? 'default' : 'outline'}
              onClick={() => setMode('draw')}
              className="hover-elevate"
              data-testid="button-draw-mode"
            >
              <Brush className="w-4 h-4 mr-1" />
              Draw
            </Button>
            <Button
              size="sm"
              variant={mode === 'sticker' ? 'default' : 'outline'}
              onClick={() => setMode('sticker')}
              className="hover-elevate"
              data-testid="button-sticker-mode"
            >
              <Sticker className="w-4 h-4 mr-1" />
              Stickers
            </Button>
            <Button
              size="sm"
              variant={mode === 'text' ? 'default' : 'outline'}
              onClick={() => setMode('text')}
              className="hover-elevate"
              data-testid="button-text-mode"
            >
              <Type className="w-4 h-4 mr-1" />
              Text
            </Button>
            <Button
              size="sm"
              variant={mode === 'border' ? 'default' : 'outline'}
              onClick={() => setMode('border')}
              className="hover-elevate"
              data-testid="button-border-mode"
            >
              <Square className="w-4 h-4 mr-1" />
              Border
            </Button>
            <Button
              size="sm"
              variant={mode === 'template' ? 'default' : 'outline'}
              onClick={() => setMode('template')}
              className="hover-elevate"
              data-testid="button-template-mode"
            >
              <Layout className="w-4 h-4 mr-1" />
              Templates
            </Button>
          </div>
        </div>
      </div>


      {/* Main Canvas Area - Now with much more space */}
      <div className="flex-1 overflow-auto flex items-center justify-center relative p-4">
          <div 
            ref={containerRef}
            className="relative inline-block border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={isMobile ? {
              width: '100%',
              maxWidth: '100vw',
              aspectRatio: '16/9',
              minHeight: '500px', // Increased for better quality display
              maxHeight: '80vh'
            } : { 
              width: '1400px', // Increased width for better photo quality
              height: '787px', // 16:9 aspect ratio (1400 * 9/16 = 787)
              maxWidth: '95vw',
              maxHeight: '85vh' // Increased height for more display space
            }}
          >
            {imageData && (
              <>
                <img
                  ref={imageRef}
                  src={imageData}
                  alt="Photo being edited"
                  className="block w-full h-full object-contain"
                  style={{ 
                    imageRendering: 'auto',
                    width: '100%',
                    height: '100%'
                  }}
                  draggable={false}
                />
                
                {/* Drawing Canvas Overlay */}
                {/* Template Background Overlay */}
                {selectedTemplate && selectedTemplate.config.backgroundColor && (
                  <div
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{
                      backgroundColor: selectedTemplate.config.backgroundColor,
                      opacity: 0.3,
                      zIndex: 0.5
                    }}
                    data-testid="template-background"
                  />
                )}

                {/* Border Canvas */}
                <canvas
                  ref={borderCanvasRef}
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{ zIndex: 1 }}
                  data-testid="border-canvas"
                />
                
                {/* Drawing Canvas - Always visible but only interactive in draw mode */}
                <canvas
                  ref={drawingCanvasRef}
                  className="absolute top-0 left-0"
                  style={{ 
                    pointerEvents: mode === 'draw' ? 'auto' : 'none',
                    cursor: mode === 'draw' ? 'crosshair' : 'default',
                    zIndex: 2
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </>
            )}
            
            {/* Emoji Elements */}
            {emojis.map(emoji => (
              <div
                key={emoji.id}
                className={`absolute cursor-move select-none text-4xl hover:scale-110 transition-transform ${
                  selectedEmoji === emoji.id ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                style={{
                  left: `${logicalToDisplay(emoji.x, emoji.y).x}px`,
                  top: `${logicalToDisplay(emoji.x, emoji.y).y}px`,
                  transform: `rotate(${emoji.rotation}deg) scale(${emoji.scale})`,
                  zIndex: selectedEmoji === emoji.id ? 10 : 3
                }}
                onClick={() => setSelectedEmoji(emoji.id)}
                onMouseDown={(e) => {
                  setSelectedEmoji(emoji.id);
                  const container = containerRef.current;
                  if (!container) return;
                  
                  const rect = container.getBoundingClientRect();
                  const startX = e.clientX - rect.left;
                  const startY = e.clientY - rect.top;
                  const startEmojiX = emoji.x;
                  const startEmojiY = emoji.y;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const currentX = moveEvent.clientX - rect.left;
                    const currentY = moveEvent.clientY - rect.top;
                    const deltaX = currentX - startX;
                    const deltaY = currentY - startY;
                    const displayX = logicalToDisplay(startEmojiX, startEmojiY).x + deltaX;
                    const displayY = logicalToDisplay(startEmojiX, startEmojiY).y + deltaY;
                    handleEmojiDrag(emoji.id, displayX, displayY);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                data-testid={`emoji-element-${emoji.id}`}
              >
                {emoji.emoji.startsWith('data:') ? (
                  <img 
                    src={emoji.emoji} 
                    alt="Custom sticker"
                    className="w-12 h-12 object-contain"
                    draggable={false}
                  />
                ) : (
                  emoji.emoji
                )}
                
                {/* Controls for selected emoji */}
                {selectedEmoji === emoji.id && (
                  <>
                    {/* Delete button */}
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
                    
                    {/* Resize handle */}
                    <div
                      className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary rounded-full cursor-se-resize border-2 border-white shadow-lg flex items-center justify-center"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startScale = emoji.scale;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const deltaY = moveEvent.clientY - startY;
                          const scaleDelta = (deltaX + deltaY) / 100; // Sensitivity adjustment
                          const newScale = Math.max(0.3, Math.min(3, startScale + scaleDelta));
                          
                          setEmojis(prev => prev.map(e => 
                            e.id === emoji.id ? { ...e, scale: newScale } : e
                          ));
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                      data-testid={`resize-handle-emoji-${emoji.id}`}
                    >
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Text Overlays */}
            {textOverlays.map(text => (
              <div
                key={text.id}
                className={`absolute cursor-move select-none hover:scale-105 transition-transform ${
                  selectedText === text.id ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                style={{
                  left: `${logicalToDisplay(text.x, text.y).x}px`,
                  top: `${logicalToDisplay(text.x, text.y).y}px`,
                  fontSize: `${text.fontSize * displayTransform.scaleY}px`,
                  fontFamily: text.fontFamily,
                  color: text.color,
                  transform: `rotate(${text.rotation}deg)`,
                  zIndex: selectedText === text.id ? 10 : 4,
                  textShadow: text.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                  WebkitTextStroke: text.outline ? '1px rgba(0,0,0,0.8)' : 'none',
                  lineHeight: '1',
                  whiteSpace: 'nowrap',
                  userSelect: 'none'
                }}
                onClick={() => setSelectedText(text.id)}
                onMouseDown={(e) => {
                  setSelectedText(text.id);
                  const container = containerRef.current;
                  if (!container) return;
                  
                  const rect = container.getBoundingClientRect();
                  const startX = e.clientX - rect.left;
                  const startY = e.clientY - rect.top;
                  const startTextX = text.x;
                  const startTextY = text.y;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const currentX = moveEvent.clientX - rect.left;
                    const currentY = moveEvent.clientY - rect.top;
                    const deltaX = currentX - startX;
                    const deltaY = currentY - startY;
                    const displayX = logicalToDisplay(startTextX, startTextY).x + deltaX;
                    const displayY = logicalToDisplay(startTextX, startTextY).y + deltaY;
                    handleTextDrag(text.id, displayX, displayY);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                data-testid={`text-element-${text.id}`}
              >
                {text.text}
                
                {/* Controls for selected text */}
                {selectedText === text.id && (
                  <>
                    {/* Delete button */}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTextOverlay(text.id);
                      }}
                      data-testid={`delete-text-${text.id}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    
                    {/* Font size handle */}
                    <div
                      className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary border-2 border-white rounded-full cursor-nw-resize hover:scale-110 transition-transform"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startFontSize = text.fontSize;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const sizeChange = deltaX * 0.5;
                          const newSize = Math.max(12, Math.min(120, startFontSize + sizeChange));
                          updateTextOverlay(text.id, { fontSize: newSize });
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                      data-testid={`resize-handle-text-${text.id}`}
                    >
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                    
                    {/* Rotation handle */}
                    <div
                      className="absolute -top-2 -left-2 w-6 h-6 bg-secondary border-2 border-white rounded-full cursor-grab hover:scale-110 transition-transform"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - centerX;
                          const deltaY = moveEvent.clientY - centerY;
                          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                          updateTextOverlay(text.id, { rotation: angle });
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                      data-testid={`rotate-handle-text-${text.id}`}
                    >
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
      </div>

      {/* Tool Controls Toggle Button (Mobile only - desktop has inline controls) */}
      {isMobile && (
        <Button
          size="lg"
          className="fixed bottom-4 right-4 z-40 shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => setShowMobileTools(!showMobileTools)}
          data-testid="button-mobile-tools-toggle"
        >
          <Settings className="w-5 h-5 mr-2" />
          Tools
        </Button>
      )}

      {(isMobile ? showMobileTools : true) && (
        <div className={isMobile ? "fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t transition-transform duration-300 z-40 max-h-[60vh] overflow-y-auto" : "bg-card/90 backdrop-blur border-b max-h-32 overflow-y-auto"}>
          <div className={isMobile ? "p-4" : "px-3 py-1 max-w-7xl mx-auto"}>
            {isMobile && (
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Editing Tools</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowMobileTools(false)}
                  data-testid="button-close-mobile-tools"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {/* Drawing Tools */}
            {mode === 'draw' && (
              <div className={isMobile ? "space-y-4" : "flex flex-wrap items-center gap-4"}>
                {/* Brush/Eraser Toggle */}
                <div className={isMobile ? "" : "flex items-center gap-2"}>
                  <h4 className={isMobile ? "text-sm font-medium mb-3" : "text-xs font-medium whitespace-nowrap"}>Tool:</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={drawMode === 'brush' ? 'default' : 'outline'}
                      onClick={() => setDrawMode('brush')}
                      className={isMobile ? "flex-1 hover-elevate" : "hover-elevate"}
                      data-testid="button-brush-tool"
                    >
                      <Brush className="w-4 h-4 mr-1" />
                      Brush
                    </Button>
                    <Button
                      size="sm"
                      variant={drawMode === 'eraser' ? 'default' : 'outline'}
                      onClick={() => setDrawMode('eraser')}
                      className={isMobile ? "flex-1 hover-elevate" : "hover-elevate"}
                      data-testid="button-eraser-tool"
                    >
                      <Eraser className="w-4 h-4 mr-1" />
                      Eraser
                    </Button>
                  </div>
                </div>

                <div className={isMobile ? "" : "flex items-center gap-2 min-w-[180px]"}>
                  <h4 className={isMobile ? "text-sm font-medium mb-3" : "text-xs font-medium whitespace-nowrap"}>Size:</h4>
                  <div className="flex-1">
                    <Slider
                      value={brushSize}
                      onValueChange={setBrushSize}
                      min={drawMode === 'eraser' ? 5 : 2}
                      max={drawMode === 'eraser' ? 40 : 20}
                      step={1}
                      className="mb-1"
                      data-testid="slider-brush-size"
                    />
                    <div className="text-xs text-muted-foreground text-center">{brushSize[0]}px</div>
                  </div>
                </div>
                
                {drawMode === 'brush' && (
                  <div className={isMobile ? "" : "flex items-center gap-2"}>
                    <h4 className={isMobile ? "text-sm font-medium mb-3" : "text-xs font-medium whitespace-nowrap"}>Colors:</h4>
                    
                    {/* Preset Colors */}
                    <div className={isMobile ? "grid grid-cols-4 gap-2 mb-4" : "flex flex-wrap gap-1.5"}>
                      {colors.map((color) => (
                        <Button
                          key={color}
                          className={`w-7 h-7 p-0 rounded-full border hover-elevate ${
                            brushColor === color ? 'border-primary' : 'border-muted'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setBrushColor(color)}
                          data-testid={`color-${color}`}
                        />
                      ))}
                    </div>

                    {/* Custom Color Picker */}
                    <div className="space-y-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start hover-elevate"
                            data-testid="button-custom-color"
                          >
                            <Palette className="w-4 h-4 mr-2" />
                            Custom Color
                            <div 
                              className="w-4 h-4 rounded-full ml-auto border border-muted"
                              style={{ backgroundColor: customColor }}
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" side="left">
                          <div className="space-y-3">
                            <Label htmlFor="color-input">Choose Color</Label>
                            <div className="flex gap-2">
                              <Input
                                id="color-input"
                                type="color"
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                className="w-16 h-10 p-1 border rounded cursor-pointer"
                                data-testid="input-color-picker"
                              />
                              <Input
                                type="text"
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                placeholder="#ff6b9d"
                                className="flex-1"
                                data-testid="input-color-hex"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => setBrushColor(customColor)}
                                className="flex-1 hover-elevate"
                                data-testid="button-use-custom-color"
                              >
                                Use Color
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={saveCustomColor}
                                className="hover-elevate"
                                data-testid="button-save-custom-color"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Saved Custom Colors */}
                      {savedColors.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">Saved Colors</h5>
                          <div className="flex flex-wrap gap-2">
                            {savedColors.map((color, index) => (
                              <div key={index} className="relative group">
                                <Button
                                  className={`w-8 h-8 p-0 rounded-full border-2 hover-elevate ${
                                    brushColor === color ? 'border-primary' : 'border-muted'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setBrushColor(color)}
                                  data-testid={`saved-color-${index}`}
                                />
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeCustomColor(color)}
                                  data-testid={`remove-saved-color-${index}`}
                                >
                                  <X className="w-2 h-2" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={clearDrawing}
                  className="w-full hover-elevate"
                  data-testid="button-clear-drawing"
                >
                  <Eraser className="w-4 h-4 mr-2" />
                  Clear All Drawing
                </Button>
              </div>
            )}

            {/* Emoji Picker */}
            {mode === 'emoji' && (
              <div>
                {Object.entries(emojiCategories).map(([category, categoryEmojis]) => (
                  <div key={category} className={isMobile ? "mb-6" : "mb-2"}>
                    <h4 className={isMobile ? "text-sm font-medium text-muted-foreground mb-2 capitalize" : "text-xs font-medium text-muted-foreground mb-1 capitalize"}>
                      {category}
                    </h4>
                    <div className={isMobile ? "grid grid-cols-6 gap-2" : "flex flex-wrap gap-1"}>
                      {categoryEmojis.map((emoji) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          className={isMobile ? "aspect-square p-0 text-2xl hover:bg-accent/50 hover-elevate active-elevate-2" : "w-8 h-8 p-0 text-base hover:bg-accent/50 hover-elevate active-elevate-2"}
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
            )}

            {/* Sticker Picker */}
            {mode === 'sticker' && (
              <div className={isMobile ? "space-y-4" : "space-y-2"}>
                {/* Upload Custom Sticker */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-center">📸 Upload Custom Sticker</h4>
                  <label htmlFor="sticker-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center hover:border-primary/50 transition-colors hover-elevate">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload image</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </label>
                  <input
                    id="sticker-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleStickerUpload}
                    data-testid="input-sticker-upload"
                  />
                </div>

                {/* Custom Stickers */}
                {customStickers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Custom Stickers</h4>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {customStickers.map((sticker, index) => (
                        <div key={`custom-${index}`} className="relative group">
                          <Button
                            variant="ghost"
                            className="aspect-square p-1 hover:bg-accent/50 hover-elevate active-elevate-2 hover:scale-110 transition-transform w-full h-auto"
                            onClick={() => addCustomSticker(sticker)}
                            data-testid={`custom-sticker-${index}`}
                          >
                            <img 
                              src={sticker} 
                              alt={`Custom sticker ${index + 1}`}
                              className="w-full h-full object-contain rounded"
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeCustomSticker(index)}
                            data-testid={`remove-custom-sticker-${index}`}
                          >
                            <X className="w-2 h-2" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Built-in Stickers */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Built-in Stickers</h4>
                  <div className="text-center mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {stickers.length} Available
                    </Badge>
                  </div>
                  <div className={isMobile ? "grid grid-cols-6 gap-2 max-h-64 overflow-y-auto" : "flex flex-wrap gap-1"}>
                    {stickers.map((sticker, index) => (
                      <Button
                        key={`${sticker}-${index}`}
                        variant="ghost"
                        className={isMobile ? "aspect-square p-0 text-xl hover:bg-accent/50 hover-elevate active-elevate-2 hover:scale-110 transition-transform" : "w-8 h-8 p-0 text-base hover:bg-accent/50 hover-elevate active-elevate-2 hover:scale-105 transition-transform"}
                        onClick={() => addEmoji(sticker)}
                        data-testid={`sticker-picker-${index}`}
                        title={`Add ${sticker} sticker`}
                      >
                        {sticker}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Text Overlay Controls */}
            {mode === 'text' && (
              <div className={isMobile ? "space-y-4" : "space-y-2"}>
                  <div>
                    <h4 className={isMobile ? "text-sm font-medium mb-3" : "text-xs font-medium mb-1"}>Font Size</h4>
                    <Slider
                      value={[textConfig.fontSize]}
                      onValueChange={(value) => setTextConfig(prev => ({ ...prev, fontSize: value[0] }))}
                      min={12}
                      max={120}
                      step={2}
                      className="mb-2"
                      data-testid="slider-font-size"
                    />
                    <div className="text-xs text-muted-foreground text-center">{textConfig.fontSize}px</div>
                  </div>

                {/* Text Color */}
                <div>
                  <h4 className={isMobile ? "text-sm font-medium mb-3" : "text-xs font-medium mb-1"}>Text Color</h4>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {colors.slice(0, 16).map((color, index) => (
                      <Button
                        key={`text-color-${index}`}
                        className={`w-10 h-10 p-0 rounded-full border-2 hover-elevate ${
                          textConfig.color === color ? 'border-primary' : 'border-muted'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setTextConfig(prev => ({ ...prev, color }))}
                        data-testid={`text-color-${index}`}
                      />
                    ))}
                  </div>

                  {/* Custom Text Color */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start hover-elevate"
                        data-testid="button-custom-text-color"
                      >
                        <Palette className="w-4 h-4 mr-2" />
                        Custom Text Color
                        <div 
                          className="w-4 h-4 rounded-full ml-auto border border-muted"
                          style={{ backgroundColor: textConfig.color }}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" side="left">
                      <div className="space-y-3">
                        <Label htmlFor="text-color-input">Choose Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="text-color-input"
                            type="color"
                            value={textConfig.color}
                            onChange={(e) => setTextConfig(prev => ({ ...prev, color: e.target.value }))}
                            className="w-16 h-10 p-1 border rounded cursor-pointer"
                            data-testid="input-text-color-picker"
                          />
                          <Input
                            type="text"
                            value={textConfig.color}
                            onChange={(e) => setTextConfig(prev => ({ ...prev, color: e.target.value }))}
                            placeholder="#ffffff"
                            className="flex-1"
                            data-testid="input-text-color-hex"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Text Effects */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Text Effects</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={textConfig.shadow ? 'default' : 'outline'}
                      onClick={() => setTextConfig(prev => ({ ...prev, shadow: !prev.shadow }))}
                      className="hover-elevate"
                      data-testid="button-text-shadow"
                    >
                      Shadow
                    </Button>
                    <Button
                      size="sm"
                      variant={textConfig.outline ? 'default' : 'outline'}
                      onClick={() => setTextConfig(prev => ({ ...prev, outline: !prev.outline }))}
                      className="hover-elevate"
                      data-testid="button-text-outline"
                    >
                      Outline
                    </Button>
                  </div>
                </div>

                {/* Text Overlay List */}
                {textOverlays.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Added Text ({textOverlays.length})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {textOverlays.map((text) => (
                        <div
                          key={text.id}
                          className={`flex items-center justify-between p-2 rounded border hover-elevate cursor-pointer ${
                            selectedText === text.id ? 'border-primary bg-accent/20' : 'border-muted'
                          }`}
                          onClick={() => setSelectedText(text.id)}
                          data-testid={`text-overlay-item-${text.id}`}
                        >
                          <span className="text-sm truncate flex-1" style={{ 
                            fontFamily: text.fontFamily,
                            fontSize: '12px',
                            color: text.color 
                          }}>
                            {text.text}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-6 h-6 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTextOverlay(text.id);
                            }}
                            data-testid={`delete-text-${text.id}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Border Controls */}
            {mode === 'border' && (
              <div className={isMobile ? "space-y-4" : "space-y-2"}>
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    Custom Photo Borders
                  </Badge>
                </div>

                {/* Border Style */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Border Style</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {borderStyles.map((style) => (
                      <Button
                        key={style.value}
                        size="sm"
                        variant={borderConfig.style === style.value ? 'default' : 'outline'}
                        onClick={() => setBorderConfig(prev => ({ ...prev, style: style.value }))}
                        className="hover-elevate"
                        data-testid={`border-style-${style.value}`}
                      >
                        {style.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {borderConfig.style !== 'none' && (
                  <>
                    {/* Border Width */}
                    <div>
                      <h4 className={isMobile ? "text-sm font-medium mb-3" : "text-xs font-medium mb-1"}>Border Width</h4>
                      <Slider
                        value={[borderConfig.width]}
                        onValueChange={(value) => setBorderConfig(prev => ({ ...prev, width: value[0] }))}
                        min={1}
                        max={20}
                        step={1}
                        className="mb-2"
                        data-testid="slider-border-width"
                      />
                      <div className="text-xs text-muted-foreground text-center">{borderConfig.width}px</div>
                    </div>

                    {/* Border Radius */}
                    <div>
                      <h4 className={isMobile ? "text-sm font-medium mb-3" : "text-xs font-medium mb-1"}>Corner Radius</h4>
                      <Slider
                        value={[borderConfig.radius]}
                        onValueChange={(value) => setBorderConfig(prev => ({ ...prev, radius: value[0] }))}
                        min={0}
                        max={50}
                        step={1}
                        className="mb-2"
                        data-testid="slider-border-radius"
                      />
                      <div className="text-xs text-muted-foreground text-center">{borderConfig.radius}px</div>
                    </div>

                    {/* Border Color */}
                    <div>
                      <h4 className={isMobile ? "text-sm font-medium mb-3" : "text-xs font-medium mb-1"}>Border Color</h4>
                      
                      {/* Preset Colors */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {colors.slice(0, 16).map((color, index) => (
                          <Button
                            key={`border-color-${index}`}
                            className={`w-10 h-10 p-0 rounded-full border-2 hover-elevate ${
                              borderConfig.color === color ? 'border-primary' : 'border-muted'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setBorderConfig(prev => ({ ...prev, color }))}
                            data-testid={`border-color-${index}`}
                          />
                        ))}
                      </div>

                      {/* Custom Color Picker for Border */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start hover-elevate"
                            data-testid="button-custom-border-color"
                          >
                            <Palette className="w-4 h-4 mr-2" />
                            Custom Border Color
                            <div 
                              className="w-4 h-4 rounded-full ml-auto border border-muted"
                              style={{ backgroundColor: borderConfig.color }}
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" side="left">
                          <div className="space-y-3">
                            <Label htmlFor="border-color-input">Choose Border Color</Label>
                            <div className="flex gap-2">
                              <Input
                                id="border-color-input"
                                type="color"
                                value={borderConfig.color}
                                onChange={(e) => setBorderConfig(prev => ({ ...prev, color: e.target.value }))}
                                className="w-16 h-10 p-1 border rounded cursor-pointer"
                                data-testid="input-border-color-picker"
                              />
                              <Input
                                type="text"
                                value={borderConfig.color}
                                onChange={(e) => setBorderConfig(prev => ({ ...prev, color: e.target.value }))}
                                placeholder="#ff6b9d"
                                className="flex-1"
                                data-testid="input-border-color-hex"
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Template Controls */}
            {mode === 'template' && (
              <div className={isMobile ? "space-y-4" : "space-y-2"}>
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    Photo Templates
                  </Badge>
                </div>

                {/* Current Template */}
                {selectedTemplate && (
                  <div className="p-3 bg-accent/20 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{selectedTemplate.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={removeTemplate}
                        className="w-6 h-6 hover:bg-destructive hover:text-destructive-foreground"
                        data-testid="button-remove-template"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                  </div>
                )}

                {/* Template Categories */}
                <div>
                  <h4 className={isMobile ? "text-sm font-medium mb-3" : "text-xs font-medium mb-1"}>Categories</h4>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant={activeTemplateCategory === 'all' ? 'default' : 'outline'}
                      onClick={() => setActiveTemplateCategory('all')}
                      className="hover-elevate text-xs"
                      data-testid="template-category-all"
                    >
                      All
                    </Button>
                    {templateCategories.map((category) => (
                      <Button
                        key={category}
                        size="sm"
                        variant={activeTemplateCategory === category ? 'default' : 'outline'}
                        onClick={() => setActiveTemplateCategory(category)}
                        className="hover-elevate text-xs"
                        data-testid={`template-category-${category}`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Template Grid */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Available Templates</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`relative group cursor-pointer border rounded-lg p-3 hover-elevate transition-all ${
                          selectedTemplate?.id === template.id ? 'border-primary bg-accent/20' : 'border-muted'
                        }`}
                        onClick={() => applyTemplate(template)}
                        data-testid={`template-${template.id}`}
                      >
                        <div className="text-xs font-medium mb-1 truncate">{template.name}</div>
                        <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{template.description}</div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.isPremium && (
                            <Badge variant="secondary" className="text-xs">
                              Pro
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden canvas for generating final image */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Export Options Modal */}
      {showExportOptions && (
        <ExportOptions
          onExport={handleExport}
          onCancel={() => setShowExportOptions(false)}
          photoPreview={exportPreview}
        />
      )}
    </div>
  );
}