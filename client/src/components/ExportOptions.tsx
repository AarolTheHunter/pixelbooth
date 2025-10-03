import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Share2, X, FileImage, Smartphone, Monitor, Printer } from "lucide-react";
import { useState } from "react";

interface ExportOptionsProps {
  onExport: (options: ExportConfig) => void;
  onCancel: () => void;
  photoPreview: string;
}

export interface ExportConfig {
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0.1 to 1.0 for JPEG and WebP
  size: 'original' | 'large' | 'medium' | 'small' | 'custom';
  width?: number;
  height?: number;
  filename: string;
  action?: 'download' | 'share';
}

const formatOptions = [
  { value: 'png', label: 'PNG', description: 'Lossless, best quality, larger file' },
  { value: 'jpeg', label: 'JPEG', description: 'Smaller file, adjustable quality' },
  { value: 'webp', label: 'WebP', description: 'Modern format, great compression' }
] as const;

const sizePresets = [
  { value: 'original', label: 'Original Size', description: 'Keep original dimensions' },
  { value: 'large', label: 'Large (1920px)', description: 'Perfect for desktop wallpapers' },
  { value: 'medium', label: 'Medium (1280px)', description: 'Great for social media' },
  { value: 'small', label: 'Small (640px)', description: 'Quick sharing and web use' }
] as const;

export default function ExportOptions({ onExport, onCancel, photoPreview }: ExportOptionsProps) {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(90);
  const [size, setSize] = useState<'original' | 'large' | 'medium' | 'small'>('original');
  const [filename, setFilename] = useState(`prettyclick-photo-${Date.now()}`);

  const handleExport = (action: 'download' | 'share' = 'download') => {
    const config: ExportConfig = {
      format,
      quality: quality / 100, // Convert to 0-1 range
      size,
      filename: filename || `prettyclick-photo-${Date.now()}`,
      action
    };

    // Add size dimensions based on preset (only width to maintain aspect ratio)
    switch (size) {
      case 'large':
        config.width = 1920;
        // height will be calculated to maintain aspect ratio
        break;
      case 'medium':
        config.width = 1280;
        // height will be calculated to maintain aspect ratio
        break;
      case 'small':
        config.width = 640;
        // height will be calculated to maintain aspect ratio
        break;
    }

    onExport(config);
  };

  const getEstimatedFileSize = () => {
    // Significantly increased size estimates for high quality photos
    const baseSize = size === 'original' ? 15.0 : 
                    size === 'large' ? 8.0 : 
                    size === 'medium' ? 4.0 : 2.0;
    
    const formatMultiplier = format === 'png' ? 1.0 : 
                           format === 'jpeg' ? (quality / 100) * 0.6 : 
                           (quality / 100) * 0.4;
    
    return Math.round(baseSize * formatMultiplier * 10) / 10;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-card/95 backdrop-blur max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-xl">
                <FileImage className="w-5 h-5 mr-2" />
                Export Options
              </CardTitle>
              <CardDescription>
                Choose format, quality, and size for your exported photo
              </CardDescription>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onCancel}
              className="hover-elevate"
              data-testid="button-close-export"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Preview</Label>
              <div className="relative bg-muted/50 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                <img
                  src={photoPreview}
                  alt="Export preview"
                  className="max-w-full max-h-[280px] object-contain rounded border"
                  data-testid="export-preview-image"
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {format.toUpperCase()}
                  {format !== 'png' && ` • ${quality}%`}
                </div>
              </div>
              
              {/* File Info */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated size:</span>
                  <span className="font-medium">{getEstimatedFileSize()} MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-medium">{format.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Export Settings */}
            <div className="space-y-6">
              {/* Format Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">File Format</Label>
                <Select value={format} onValueChange={(value: any) => setFormat(value)}>
                  <SelectTrigger data-testid="select-export-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quality Settings */}
              {format !== 'png' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">Quality</Label>
                    <Badge variant="secondary">{quality}%</Badge>
                  </div>
                  <Slider
                    value={[quality]}
                    onValueChange={(value) => setQuality(value[0])}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                    data-testid="slider-export-quality"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>
              )}

              {/* Size Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Output Size</Label>
                <Select value={size} onValueChange={(value: any) => setSize(value)}>
                  <SelectTrigger data-testid="select-export-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizePresets.map(preset => (
                      <SelectItem key={preset.value} value={preset.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{preset.label}</span>
                          <span className="text-xs text-muted-foreground">{preset.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Use Case Presets */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Quick Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormat('jpeg');
                      setQuality(85);
                      setSize('medium');
                    }}
                    className="h-auto p-3 hover-elevate"
                    data-testid="preset-social-media"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Smartphone className="w-4 h-4" />
                      <span className="text-xs">Social Media</span>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormat('png');
                      setSize('large');
                    }}
                    className="h-auto p-3 hover-elevate"
                    data-testid="preset-wallpaper"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Monitor className="w-4 h-4" />
                      <span className="text-xs">Wallpaper</span>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormat('png');
                      setSize('original');
                    }}
                    className="h-auto p-3 hover-elevate"
                    data-testid="preset-print"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Printer className="w-4 h-4" />
                      <span className="text-xs">Print</span>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormat('webp');
                      setQuality(80);
                      setSize('medium');
                    }}
                    className="h-auto p-3 hover-elevate"
                    data-testid="preset-web"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Share2 className="w-4 h-4" />
                      <span className="text-xs">Web</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pt-4 border-t">
            <Button variant="outline" onClick={onCancel} className="hover-elevate" data-testid="button-cancel-export">
              Cancel
            </Button>
            <Button onClick={() => handleExport('download')} className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white border-0 hover-elevate" data-testid="button-export-download">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => handleExport('share')} variant="outline" className="hover-elevate" data-testid="button-export-share">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}