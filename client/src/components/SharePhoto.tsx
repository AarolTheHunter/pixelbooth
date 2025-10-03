import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Download, QrCode, X } from "lucide-react";
import { useState, useEffect } from "react";

interface SharePhotoProps {
  photo: {
    id: string;
    src: string;
    timestamp: Date;
    filter: string;
  };
  onClose: () => void;
}

export default function SharePhoto({ photo, onClose }: SharePhotoProps) {
  const [shareCode, setShareCode] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // Generate a unique share code and URL
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    const url = `${window.location.origin}/shared/${code}`;
    setShareCode(code);
    setShareUrl(url);
    console.log('Generated share code:', code);
  }, [photo.id]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      console.log('Copied to clipboard:', text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadPhoto = () => {
    const link = document.createElement('a');
    link.href = photo.src;
    link.download = `prettyclick-photo-${photo.id}.png`;
    link.click();
    console.log('Downloaded photo:', photo.id);
  };

  const generateQRCode = (text: string) => {
    // In a real app, you'd use a QR code library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-card/95 backdrop-blur">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-xl">
                <Share2 className="w-5 h-5 mr-2" />
                Share Your Photo
              </CardTitle>
              <CardDescription>
                Share your photo with friends using a link or code
              </CardDescription>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="hover-elevate"
              data-testid="button-close-share"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Photo Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={photo.src}
                alt="Photo to share"
                className="max-w-xs max-h-48 object-contain rounded-lg border"
              />
              {photo.filter !== 'none' && (
                <Badge variant="secondary" className="absolute top-2 right-2">
                  {photo.filter}
                </Badge>
              )}
            </div>
          </div>

          {/* Share Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Share Link */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="text-sm"
                  data-testid="input-share-url"
                />
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(shareUrl)}
                  className="hover-elevate"
                  data-testid="button-copy-url"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600">✓ Copied to clipboard!</p>
              )}
            </div>

            {/* Share Code */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Share Code</Label>
              <div className="flex gap-2">
                <Input
                  value={shareCode}
                  readOnly
                  className="text-sm font-mono text-center text-lg"
                  data-testid="input-share-code"
                />
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(shareCode)}
                  className="hover-elevate"
                  data-testid="button-copy-code"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="text-center space-y-3">
            <Button
              variant="outline"
              onClick={() => setShowQR(!showQR)}
              className="hover-elevate"
              data-testid="button-toggle-qr"
            >
              <QrCode className="w-4 h-4 mr-2" />
              {showQR ? 'Hide' : 'Show'} QR Code
            </Button>
            
            {showQR && (
              <div className="flex justify-center pt-4">
                <div className="bg-white p-4 rounded-lg">
                  <img
                    src={generateQRCode(shareUrl)}
                    alt="QR Code for sharing"
                    className="w-48 h-48"
                    data-testid="qr-code-image"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={downloadPhoto}
              className="hover-elevate"
              data-testid="button-download-photo"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            
            <Button
              onClick={() => copyToClipboard(shareUrl)}
              className="bg-primary hover:bg-primary/90 hover-elevate"
              data-testid="button-share-primary"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>

          {/* Share Instructions */}
          <div className="text-center text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <p className="font-medium mb-2">How to share:</p>
            <div className="space-y-1">
              <p>• Send the link directly to anyone</p>
              <p>• Share the 8-digit code for easy entry</p>
              <p>• Use the QR code for quick mobile sharing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}