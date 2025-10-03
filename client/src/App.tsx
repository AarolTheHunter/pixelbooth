import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import logoImage from "@assets/7edd6b98-247a-49a0-b423-a67e010d87ec (1)_1759107927861.png";
import landscapeFrame from "@assets/Untitled design (1)_1759333740544.png";
import portraitFrame1 from "@assets/1_1759327682991.png";
import portraitFrame2 from "@assets/3_1759333849351.png";
import portraitFrame3 from "@assets/3_1759333963695.png";
import threePhotoFrame1 from "@assets/6_1759334598291.png";
import threePhotoFrame2 from "@assets/1_1759334598292.png";
import threePhotoFrame3 from "@assets/2_1759334598292.png";
import threePhotoFrame4 from "@assets/4_1759334598292.png";
import threePhotoFrame5 from "@assets/2_1759334664299.png";
import fourPhotoFrame1 from "@assets/5_1759338575783.png";
import fourPhotoFrame2 from "@assets/6_1759338575783.png";
import fourPhotoFrame3 from "@assets/5_1759338583655.png";

// Components
import Header from "./components/Header";
import PrettyClickCamera from "./components/PrettyClickCamera";
import PhotoGallery from "./components/PhotoGallery";
import PhotoEditorPage from "./pages/PhotoEditorPage";
import SharePhoto from "./components/SharePhoto";

// Pages
import AuthPage from "./pages/AuthPage";
import UserProfile from "./pages/UserProfile";
import ProfileSettings from "./pages/ProfileSettings";
import PublicGallery from "./pages/PublicGallery";
import NotFound from "./pages/not-found";

// Types
interface Photo {
  id: string;
  src: string;
  timestamp: Date;
  filter: string;
  shareCode?: string;
  likes?: number;
}

// Landing Page Component
function LandingPage() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-16">
          <img 
            src={logoImage} 
            alt="prettyclick" 
            className="h-32 w-auto"
            data-testid="logo-landing"
            width="400"
            height="120"
            decoding="async"
          />
        </div>
        
        {/* CLICK Button */}
        <div className="mb-32">
          <Button 
            size="lg"
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-12 py-4 rounded-full text-xl shadow-lg hover-elevate active-elevate-2"
            data-testid="button-click-home"
            asChild
          >
            {isAuthenticated ? (
              <Link href="/camera">CLICK!</Link>
            ) : (
              <Link href="/auth">CLICK!</Link>
            )}
          </Button>
        </div>
        
        {/* Contact Us */}
        <div className="mt-auto pb-8">
          <Button variant="ghost" className="text-gray-500 hover:text-gray-700 underline" data-testid="link-contact" asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// About Page Component
function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">About prettyclick</h1>
        <div className="bg-card/50 backdrop-blur p-8 rounded-lg">
          <p className="text-muted-foreground mb-4">
            prettyclick is a modern digital photobooth that lets you take amazing photos with filters and emojis.
            Save your memories and share them easily with friends and family.
          </p>
          <h3 className="font-semibold mb-2">Features:</h3>
          <ul className="text-muted-foreground space-y-1">
            <li>• Real-time camera filters</li>
            <li>• Draggable emoji overlays</li>
            <li>• Personal photo gallery</li>
            <li>• Easy sharing with codes and QR codes</li>
            <li>• Download photos in high quality</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Tutorial Page Component
function TutorialPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Tutorial</h1>
        <div className="bg-card/50 backdrop-blur p-8 rounded-lg">
          <p className="text-muted-foreground mb-4">
            Learn how to use prettyclick to create amazing photos and memories.
          </p>
          <h3 className="font-semibold mb-2">Getting Started:</h3>
          <ul className="text-muted-foreground space-y-1">
            <li>• Click the CLICK! button to start taking photos</li>
            <li>• Choose your photo count and delay settings</li>
            <li>• Apply filters and effects in real-time</li>
            <li>• Edit your photos with emojis and text</li>
            <li>• Share your creations with friends</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Policy Page Component
function PolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="bg-card/50 backdrop-blur p-8 rounded-lg">
          <p className="text-muted-foreground mb-4">
            Your privacy is important to us. This policy explains how we handle your data.
          </p>
          <h3 className="font-semibold mb-2">Data Collection:</h3>
          <ul className="text-muted-foreground space-y-1">
            <li>• Photos are stored locally on your device</li>
            <li>• We do not collect personal information</li>
            <li>• Shared photos are temporarily stored for sharing purposes</li>
            <li>• No data is sold to third parties</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Contact Page Component
function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        <div className="bg-card/50 backdrop-blur p-8 rounded-lg">
          <p className="text-muted-foreground mb-4">
            Get in touch with the prettyclick team.
          </p>
          <h3 className="font-semibold mb-2">Reach Out:</h3>
          <ul className="text-muted-foreground space-y-1">
            <li>• Email: hello@prettyclick.com</li>
            <li>• Support: support@prettyclick.com</li>
            <li>• Follow us on social media</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sharePhoto, setSharePhoto] = useState<Photo | null>(null);

  // Log navigation for debugging
  console.log('Current location:', location);

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleCapture = (imageData: string) => {
    console.log('=== APP.TSX HANDLECAPTURE ===');
    
    // Log image data size for debugging
    const sizeInMB = (imageData.length * 0.75 / (1024 * 1024)).toFixed(2);
    console.log(`Data size: ${sizeInMB}MB`);
    console.log(`Data URL prefix: ${imageData.substring(0, 50)}`);
    
    // Decode the image to check its actual resolution
    const img = new Image();
    img.onload = () => {
      const megapixels = (img.width * img.height) / 1000000;
      console.log(`Image received in App.tsx: ${img.width}x${img.height} (${megapixels.toFixed(1)}MP)`);
      
      if (megapixels < 1.0) {
        console.error(`⚠️ QUALITY LOSS BEFORE APP.TSX: Only ${megapixels.toFixed(1)}MP received!`);
        console.error('The quality degradation happened in PrettyClickCamera capture process!');
      } else {
        console.log(`✅ Good quality maintained in App.tsx: ${megapixels.toFixed(1)}MP`);
      }
    };
    img.src = imageData;
    
    // Generate session ID and store image data
    const sessionId = crypto.randomUUID();
    sessionStorage.setItem(`editor:${sessionId}`, imageData);
    console.log(`Stored in sessionStorage with key: editor:${sessionId}`);
    
    // Navigate to editor page
    setLocation(`/editor/${sessionId}`);
    console.log('Navigating to photo editor...');
    console.log('===============================');
  };

  const createPhotoboothStrip = (images: string[], layout: 'couples' | 'friends', frameId?: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(images[0]);
        
        // Preload all images using Promise.all
        const loadImage = (src: string): Promise<HTMLImageElement> => {
          return new Promise((resolveImg, rejectImg) => {
            const img = new Image();
            img.onload = () => resolveImg(img);
            img.onerror = rejectImg;
            img.src = src;
          });
        };
        
        // Auto-detect photo placement regions in frame (green markers or transparency)
        const detectCutouts = (frameImg: HTMLImageElement, numPhotos: number, userOrientation: 'landscape' | 'portrait' | null = null): {cutouts: Array<{centerX: number, centerY: number, width: number, height: number}>, usedGreenMode: boolean} => {
          // Create offscreen canvas to analyze frame
          const analyzeCanvas = document.createElement('canvas');
          analyzeCanvas.width = frameImg.width;
          analyzeCanvas.height = frameImg.height;
          const analyzeCtx = analyzeCanvas.getContext('2d');
          if (!analyzeCtx) return { cutouts: [], usedGreenMode: false };
          
          // Draw frame to analyze its pixels
          analyzeCtx.drawImage(frameImg, 0, 0);
          const imageData = analyzeCtx.getImageData(0, 0, frameImg.width, frameImg.height);
          const data = imageData.data;
          const w = frameImg.width;
          const h = frameImg.height;
          
          // First, try to detect GREEN-COLORED regions (like real photobooths use)
          const isGreen = (x: number, y: number) => {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            // Green channel should be significantly higher than red and blue
            return g > 100 && g > r * 1.5 && g > b * 1.5;
          };
          
          console.log('🔍 Scanning frame for GREEN placement markers...');
          
          // Count green pixels to see if frame uses green markers
          let greenPixelCount = 0;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              if (isGreen(x, y)) greenPixelCount++;
            }
          }
          
          console.log(`Found ${greenPixelCount} green pixels in frame`);
          
          // If we found significant green regions, use those for photo placement
          if (greenPixelCount > 1000) {
            console.log('✓ Using GREEN MARKER detection mode');
            
            // Determine orientation: use user selection if provided, otherwise physical dimensions
            const isPortrait = userOrientation 
              ? userOrientation === 'portrait'
              : h > w;
            
            const midY = h / 2;
            const midX = w / 2;
            
            console.log(`📐 Frame orientation: ${isPortrait ? 'PORTRAIT' : 'LANDSCAPE'}${userOrientation ? ' (USER SELECTED)' : ' (auto-detected)'}`);
            console.log(`📐 Detecting ${numPhotos} regions`);
            
            // Track bounds for regions (support 2, 3, or 4 photos)
            interface RegionBounds {
              minX: number; maxX: number; minY: number; maxY: number; count: number;
            }
            
            const regions: RegionBounds[] = Array.from({ length: numPhotos }, () => ({
              minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, count: 0
            }));
            
            // Classify pixels into regions
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                if (isGreen(x, y)) {
                  // Determine which region this pixel belongs to
                  let regionIndex = 0;
                  
                  if (numPhotos === 2) {
                    if (isPortrait) {
                      regionIndex = y < midY ? 0 : 1;
                    } else {
                      regionIndex = x < midX ? 0 : 1;
                    }
                  } else if (numPhotos === 3) {
                    // For 3 photos, always portrait orientation with top/middle/bottom layout
                    const thirdY = h / 3;
                    const twoThirdsY = 2 * h / 3;
                    if (y < thirdY) {
                      regionIndex = 0; // Top
                    } else if (y < twoThirdsY) {
                      regionIndex = 1; // Middle
                    } else {
                      regionIndex = 2; // Bottom
                    }
                  } else if (numPhotos === 4) {
                    // For 4 photos, portrait orientation with quarters: top/top-mid/bottom-mid/bottom
                    const quarterY = h / 4;
                    const halfY = h / 2;
                    const threeQuarterY = 3 * h / 4;
                    if (y < quarterY) {
                      regionIndex = 0; // Top
                    } else if (y < halfY) {
                      regionIndex = 1; // Top-middle
                    } else if (y < threeQuarterY) {
                      regionIndex = 2; // Bottom-middle
                    } else {
                      regionIndex = 3; // Bottom
                    }
                  }
                  
                  // Update bounds for this region
                  const region = regions[regionIndex];
                  if (x < region.minX) region.minX = x;
                  if (x > region.maxX) region.maxX = x;
                  if (y < region.minY) region.minY = y;
                  if (y > region.maxY) region.maxY = y;
                  region.count++;
                }
              }
            }
            
            // Build cutouts array with strict boundary enforcement to prevent overlaps
            const cutouts: Array<{centerX: number, centerY: number, width: number, height: number}> = [];
            // Use conservative expansion for 4-photo mode to prevent any overlap
            const expansionFactor = numPhotos === 4 ? 1.0 : 1.2;
            // Use larger gap margin for 4-photo mode to ensure clear separation
            const gapMargin = numPhotos === 4 ? 0.12 : 0.10;
            
            const regionLabels = numPhotos === 4
              ? ['TOP', 'TOP-MID', 'BOTTOM-MID', 'BOTTOM']
              : numPhotos === 3 
              ? ['TOP', 'MIDDLE', 'BOTTOM']
              : isPortrait ? ['TOP', 'BOTTOM'] : ['LEFT', 'RIGHT'];
            
            regions.forEach((region, index) => {
              console.log(`Region ${index + 1} (${regionLabels[index]}): ${region.count} pixels, bounds: X=${region.minX}→${region.maxX}, Y=${region.minY}→${region.maxY}`);
              
              if (region.count > 0) {
                const baseWidth = region.maxX - region.minX;
                const baseHeight = region.maxY - region.minY;
                const centerX = (region.minX + region.maxX) / 2;
                const centerY = (region.minY + region.maxY) / 2;
                
                // Start with desired expansion
                let expandedWidth = baseWidth * expansionFactor;
                let expandedHeight = baseHeight * expansionFactor;
                
                // Calculate region boundaries and enforce strict non-overlap
                if (numPhotos === 3) {
                  // 3-photo mode: vertical thirds [0, h/3], [h/3, 2h/3], [2h/3, h]
                  const thirdHeight = h / 3;
                  const regionTop = index * thirdHeight;
                  const regionBottom = (index + 1) * thirdHeight;
                  const marginY = thirdHeight * gapMargin;
                  
                  // Max half-height that keeps cutout within boundaries with margin
                  const maxHalfHeight = Math.min(
                    centerY - regionTop - marginY,
                    regionBottom - centerY - marginY
                  );
                  const maxHeight = Math.max(0, 2 * maxHalfHeight);
                  
                  // Also constrain width to prevent horizontal overlap with frame edges
                  const marginX = w * 0.05; // 5% margin from left/right edges
                  const maxWidth = w - (2 * marginX);
                  expandedWidth = Math.min(expandedWidth, maxWidth);
                  
                  // Ensure minimum useful size (at least 80% of base detection)
                  const minHeight = baseHeight * 0.8;
                  
                  // Use expanded size, constrained by boundaries, but ensure minimum
                  // CRITICAL: Always respect maxHeight to prevent overlap
                  if (maxHeight >= minHeight) {
                    expandedHeight = Math.min(expandedHeight, maxHeight);
                  } else {
                    // If constrained size is too small, try minimum but MUST cap at maxHeight and region boundary
                    expandedHeight = Math.min(minHeight, maxHeight, thirdHeight * 0.85);
                  }
                  
                  // Calculate actual edges of this cutout
                  const cutoutTop = centerY - expandedHeight / 2;
                  const cutoutBottom = centerY + expandedHeight / 2;
                  console.log(`  Region boundaries: Y=${Math.round(regionTop)}→${Math.round(regionBottom)}, maxHeight=${Math.round(maxHeight)}, finalHeight=${Math.round(expandedHeight)}, finalWidth=${Math.round(expandedWidth)}`);
                  console.log(`  Cutout edges: TOP=${Math.round(cutoutTop)}, BOTTOM=${Math.round(cutoutBottom)} (should be within ${Math.round(regionTop)}-${Math.round(regionBottom)})`);
                  
                  // VERIFY no overlap
                  if (cutoutTop < regionTop || cutoutBottom > regionBottom) {
                    console.error(`⚠️ WARNING: Cutout ${index} EXCEEDS region boundaries!`);
                  }
                } else if (numPhotos === 4) {
                  // 4-photo mode: vertical quarters [0, h/4], [h/4, h/2], [h/2, 3h/4], [3h/4, h]
                  const quarterHeight = h / 4;
                  const regionTop = index * quarterHeight;
                  const regionBottom = (index + 1) * quarterHeight;
                  const marginY = quarterHeight * gapMargin;
                  
                  // Max half-height that keeps cutout within boundaries with margin
                  const maxHalfHeight = Math.min(
                    centerY - regionTop - marginY,
                    regionBottom - centerY - marginY
                  );
                  const maxHeight = Math.max(0, 2 * maxHalfHeight);
                  
                  // Also constrain width to prevent horizontal overlap with frame edges
                  const marginX = w * 0.05; // 5% margin from left/right edges
                  const maxWidth = w - (2 * marginX);
                  expandedWidth = Math.min(expandedWidth, maxWidth);
                  
                  // Ensure photos fill the available quarter space well
                  // Use a conservative region-relative minimum (70% of quarter height) to prevent overlap
                  const regionMinHeight = quarterHeight * 0.70;
                  const baseMinHeight = baseHeight * 0.80;
                  
                  // Use the larger of base-relative or region-relative minimum
                  const minHeight = Math.max(baseMinHeight, regionMinHeight);
                  
                  // Use expanded size, constrained by boundaries, but ensure minimum fill
                  // CRITICAL: Always respect maxHeight to prevent overlap
                  if (maxHeight >= minHeight) {
                    // Plenty of room - use expanded size, but ensure at least region minimum
                    expandedHeight = Math.min(Math.max(expandedHeight, regionMinHeight), maxHeight);
                  } else {
                    // Tight fit - use maximum available space
                    expandedHeight = maxHeight;
                  }
                  
                  // Calculate actual edges of this cutout
                  const cutoutTop = centerY - expandedHeight / 2;
                  const cutoutBottom = centerY + expandedHeight / 2;
                  console.log(`  Region boundaries: Y=${Math.round(regionTop)}→${Math.round(regionBottom)}, maxHeight=${Math.round(maxHeight)}, finalHeight=${Math.round(expandedHeight)}, finalWidth=${Math.round(expandedWidth)}`);
                  console.log(`  Cutout edges: TOP=${Math.round(cutoutTop)}, BOTTOM=${Math.round(cutoutBottom)} (should be within ${Math.round(regionTop)}-${Math.round(regionBottom)})`);
                  
                  // VERIFY no overlap
                  if (cutoutTop < regionTop || cutoutBottom > regionBottom) {
                    console.error(`⚠️ WARNING: Cutout ${index} EXCEEDS region boundaries!`);
                  }
                } else if (numPhotos === 2) {
                  if (isPortrait) {
                    // 2-photo portrait: vertical halves [0, h/2], [h/2, h]
                    const halfHeight = h / 2;
                    const regionTop = index * halfHeight;
                    const regionBottom = (index + 1) * halfHeight;
                    const margin = halfHeight * gapMargin;
                    
                    const maxHalfHeight = Math.min(
                      centerY - regionTop - margin,
                      regionBottom - centerY - margin
                    );
                    const maxHeight = Math.max(0, 2 * maxHalfHeight);
                    
                    // Ensure minimum useful size
                    const minHeight = baseHeight * 0.8;
                    if (maxHeight >= minHeight) {
                      expandedHeight = Math.min(expandedHeight, maxHeight);
                    } else {
                      // CRITICAL: Always respect maxHeight to prevent overlap
                      expandedHeight = Math.min(minHeight, maxHeight, halfHeight * 0.90);
                    }
                  } else {
                    // 2-photo landscape: horizontal halves [0, w/2], [w/2, w]
                    const halfWidth = w / 2;
                    const regionLeft = index * halfWidth;
                    const regionRight = (index + 1) * halfWidth;
                    const margin = halfWidth * gapMargin;
                    
                    const maxHalfWidth = Math.min(
                      centerX - regionLeft - margin,
                      regionRight - centerX - margin
                    );
                    const maxWidth = Math.max(0, 2 * maxHalfWidth);
                    
                    // Ensure minimum useful size
                    const minWidth = baseWidth * 0.8;
                    if (maxWidth >= minWidth) {
                      expandedWidth = Math.min(expandedWidth, maxWidth);
                    } else {
                      // CRITICAL: Always respect maxWidth to prevent overlap
                      expandedWidth = Math.min(minWidth, maxWidth, halfWidth * 0.90);
                    }
                  }
                }
                
                const cutout = {
                  centerX,
                  centerY,
                  width: expandedWidth,
                  height: expandedHeight
                };
                console.log(`  ✓ ${regionLabels[index]} region: center (${Math.round(cutout.centerX)}, ${Math.round(cutout.centerY)}), size ${Math.round(cutout.width)}x${Math.round(cutout.height)}, edges Y=${Math.round(cutout.centerY - cutout.height/2)}→${Math.round(cutout.centerY + cutout.height/2)}`);
                cutouts.push(cutout);
              }
            });
            
            console.log(`✓ Detected ${cutouts.length} green placement regions`);
            return { cutouts, usedGreenMode: true };
          }
          
          // No green markers found, fall back to TRANSPARENCY detection
          console.log('No green markers found, using transparency detection...');
          
          // Mark border-connected transparent pixels using optimized flood fill
          const visited = new Uint8Array(w * h);
          const isTransparent = (x: number, y: number) => {
            const idx = (y * w + x) * 4;
            return data[idx + 3] < 128;
          };
          
          // Use packed coordinate queue with dynamic array (avoid massive preallocation)
          const queue: number[] = []; // Will store packed coords: (y << 16) | x
          let queueStart = 0;
          
          // Seed queue with border transparent pixels
          for (let x = 0; x < w; x++) {
            if (isTransparent(x, 0)) {
              const idx = 0 * w + x;
              if (!visited[idx]) {
                visited[idx] = 1;
                queue.push((0 << 16) | x);
              }
            }
            if (isTransparent(x, h-1)) {
              const idx = (h-1) * w + x;
              if (!visited[idx]) {
                visited[idx] = 1;
                queue.push(((h-1) << 16) | x);
              }
            }
          }
          for (let y = 0; y < h; y++) {
            if (isTransparent(0, y)) {
              const idx = y * w + 0;
              if (!visited[idx]) {
                visited[idx] = 1;
                queue.push((y << 16) | 0);
              }
            }
            if (isTransparent(w-1, y)) {
              const idx = y * w + (w-1);
              if (!visited[idx]) {
                visited[idx] = 1;
                queue.push((y << 16) | (w-1));
              }
            }
          }
          
          // Flood fill - mark visited on enqueue to avoid duplicates
          // Inline neighbor checks to avoid array allocation per iteration
          while (queueStart < queue.length) {
            const packed = queue[queueStart++];
            const x = packed & 0xFFFF;
            const y = packed >>> 16;
            
            // Check 4 neighbors inline
            // Left
            if (x > 0) {
              const nidx = y * w + (x-1);
              if (!visited[nidx] && isTransparent(x-1, y)) {
                visited[nidx] = 1;
                queue.push((y << 16) | (x-1));
              }
            }
            // Right
            if (x < w-1) {
              const nidx = y * w + (x+1);
              if (!visited[nidx] && isTransparent(x+1, y)) {
                visited[nidx] = 1;
                queue.push((y << 16) | (x+1));
              }
            }
            // Up
            if (y > 0) {
              const nidx = (y-1) * w + x;
              if (!visited[nidx] && isTransparent(x, y-1)) {
                visited[nidx] = 1;
                queue.push(((y-1) << 16) | x);
              }
            }
            // Down
            if (y < h-1) {
              const nidx = (y+1) * w + x;
              if (!visited[nidx] && isTransparent(x, y+1)) {
                visited[nidx] = 1;
                queue.push(((y+1) << 16) | x);
              }
            }
          }
          
          // Compute bounding boxes on-the-fly without storing all pixels
          // Use user orientation if provided, otherwise physical dimensions
          const isPortrait = userOrientation 
            ? userOrientation === 'portrait'
            : h > w;
          const midY = h / 2;
          const midX = w / 2;
          
          // Track bounds for regions (support 2 or 3 photos)
          interface RegionBounds {
            minX: number; maxX: number; minY: number; maxY: number; count: number;
          }
          
          const regions: RegionBounds[] = Array.from({ length: numPhotos }, () => ({
            minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, count: 0
          }));
          
          // Classify pixels into regions
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = y * w + x;
              if (isTransparent(x, y) && !visited[idx]) {
                // Interior transparent pixel
                let regionIndex = 0;
                
                if (numPhotos === 2) {
                  if (isPortrait) {
                    regionIndex = y < midY ? 0 : 1;
                  } else {
                    regionIndex = x < midX ? 0 : 1;
                  }
                } else if (numPhotos === 3) {
                  // For 3 photos, always portrait orientation with top/middle/bottom layout
                  const thirdY = h / 3;
                  const twoThirdsY = 2 * h / 3;
                  if (y < thirdY) {
                    regionIndex = 0; // Top
                  } else if (y < twoThirdsY) {
                    regionIndex = 1; // Middle
                  } else {
                    regionIndex = 2; // Bottom
                  }
                } else if (numPhotos === 4) {
                  // For 4 photos, portrait orientation with quarters: top/top-mid/bottom-mid/bottom
                  const quarterY = h / 4;
                  const halfY = h / 2;
                  const threeQuarterY = 3 * h / 4;
                  if (y < quarterY) {
                    regionIndex = 0; // Top
                  } else if (y < halfY) {
                    regionIndex = 1; // Top-middle
                  } else if (y < threeQuarterY) {
                    regionIndex = 2; // Bottom-middle
                  } else {
                    regionIndex = 3; // Bottom
                  }
                }
                
                // Update bounds for this region
                const region = regions[regionIndex];
                if (x < region.minX) region.minX = x;
                if (x > region.maxX) region.maxX = x;
                if (y < region.minY) region.minY = y;
                if (y > region.maxY) region.maxY = y;
                region.count++;
              }
            }
          }
          
          const totalCount = regions.reduce((sum, r) => sum + r.count, 0);
          console.log(`Found ${totalCount} interior transparent pixels (excluding border)`);
          
          // Build cutouts with strict boundary enforcement to prevent overlaps
          // Use smaller expansion for 4-photo mode to prevent overlap in tight quarters
          const expansionFactor = numPhotos === 4 ? 0.95 : 1.2;
          // Use larger gap margin for 4-photo mode for better separation
          const gapMargin = numPhotos === 4 ? 0.15 : 0.10;
          
          const cutouts: Array<{centerX: number, centerY: number, width: number, height: number}> = [];
          regions.forEach((region, index) => {
            if (region.count > 0) {
              const baseWidth = region.maxX - region.minX;
              const baseHeight = region.maxY - region.minY;
              const centerX = (region.minX + region.maxX) / 2;
              const centerY = (region.minY + region.maxY) / 2;
              
              // Start with desired expansion
              let expandedWidth = baseWidth * expansionFactor;
              let expandedHeight = baseHeight * expansionFactor;
              
              // Calculate region boundaries and enforce strict non-overlap
              if (numPhotos === 3) {
                // 3-photo mode: vertical thirds [0, h/3], [h/3, 2h/3], [2h/3, h]
                const thirdHeight = h / 3;
                const regionTop = index * thirdHeight;
                const regionBottom = (index + 1) * thirdHeight;
                const marginY = thirdHeight * gapMargin;
                
                // Max half-height that keeps cutout within boundaries with margin
                const maxHalfHeight = Math.min(
                  centerY - regionTop - marginY,
                  regionBottom - centerY - marginY
                );
                const maxHeight = Math.max(0, 2 * maxHalfHeight);
                
                // Also constrain width to prevent horizontal overlap with frame edges
                const marginX = w * 0.05; // 5% margin from left/right edges
                const maxWidth = w - (2 * marginX);
                expandedWidth = Math.min(expandedWidth, maxWidth);
                
                // Ensure minimum useful size (at least 80% of base detection)
                const minHeight = baseHeight * 0.8;
                
                // Use expanded size, constrained by boundaries, but ensure minimum
                // CRITICAL: Always respect maxHeight to prevent overlap
                if (maxHeight >= minHeight) {
                  expandedHeight = Math.min(expandedHeight, maxHeight);
                } else {
                  // If constrained size is too small, try minimum but MUST cap at maxHeight and region boundary
                  expandedHeight = Math.min(minHeight, maxHeight, thirdHeight * 0.85);
                }
              } else if (numPhotos === 4) {
                // 4-photo mode: vertical quarters [0, h/4], [h/4, h/2], [h/2, 3h/4], [3h/4, h]
                const quarterHeight = h / 4;
                const regionTop = index * quarterHeight;
                const regionBottom = (index + 1) * quarterHeight;
                const marginY = quarterHeight * gapMargin;
                
                // Max half-height that keeps cutout within boundaries with margin
                const maxHalfHeight = Math.min(
                  centerY - regionTop - marginY,
                  regionBottom - centerY - marginY
                );
                const maxHeight = Math.max(0, 2 * maxHalfHeight);
                
                // Also constrain width to prevent horizontal overlap with frame edges
                const marginX = w * 0.05; // 5% margin from left/right edges
                const maxWidth = w - (2 * marginX);
                expandedWidth = Math.min(expandedWidth, maxWidth);
                
                // Ensure minimum useful size (at least 70% of base detection for tight 4-photo layout)
                const minHeight = baseHeight * 0.7;
                
                // Use expanded size, constrained by boundaries, but ensure minimum
                // CRITICAL: Always respect maxHeight to prevent overlap
                if (maxHeight >= minHeight) {
                  expandedHeight = Math.min(expandedHeight, maxHeight);
                } else {
                  // If constrained size is too small, try minimum but MUST cap at maxHeight and region boundary
                  // Use 70% instead of 85% to ensure photos stay within their quarters
                  expandedHeight = Math.min(minHeight, maxHeight, quarterHeight * 0.70);
                }
              } else if (numPhotos === 2) {
                if (isPortrait) {
                  // 2-photo portrait: vertical halves [0, h/2], [h/2, h]
                  const halfHeight = h / 2;
                  const regionTop = index * halfHeight;
                  const regionBottom = (index + 1) * halfHeight;
                  const margin = halfHeight * gapMargin;
                  
                  const maxHalfHeight = Math.min(
                    centerY - regionTop - margin,
                    regionBottom - centerY - margin
                  );
                  const maxHeight = Math.max(0, 2 * maxHalfHeight);
                  
                  // Ensure minimum useful size
                  const minHeight = baseHeight * 0.8;
                  if (maxHeight >= minHeight) {
                    expandedHeight = Math.min(expandedHeight, maxHeight);
                  } else {
                    // CRITICAL: Always respect maxHeight to prevent overlap
                    expandedHeight = Math.min(minHeight, maxHeight, halfHeight * 0.90);
                  }
                } else {
                  // 2-photo landscape: horizontal halves [0, w/2], [w/2, w]
                  const halfWidth = w / 2;
                  const regionLeft = index * halfWidth;
                  const regionRight = (index + 1) * halfWidth;
                  const margin = halfWidth * gapMargin;
                  
                  const maxHalfWidth = Math.min(
                    centerX - regionLeft - margin,
                    regionRight - centerX - margin
                  );
                  const maxWidth = Math.max(0, 2 * maxHalfWidth);
                  
                  // Ensure minimum useful size
                  const minWidth = baseWidth * 0.8;
                  if (maxWidth >= minWidth) {
                    expandedWidth = Math.min(expandedWidth, maxWidth);
                  } else {
                    // CRITICAL: Always respect maxWidth to prevent overlap
                    expandedWidth = Math.min(minWidth, maxWidth, halfWidth * 0.90);
                  }
                }
              }
              
              cutouts.push({
                centerX,
                centerY,
                width: expandedWidth,
                height: expandedHeight
              });
            }
          });
          
          console.log(`Detected ${isPortrait ? 'portrait' : 'landscape'} cutouts (${cutouts.length} regions):`, cutouts);
          return { cutouts, usedGreenMode: false };
        };
        
        // Load all images in parallel
        const loadedImages = await Promise.all(images.map(loadImage));
        
        // For couples layout with 2 photos, use frame overlay
        if (layout === 'couples' && loadedImages.length === 2) {
          // Determine frame to use
          let frameImageSrc: string;
          
          let userSelectedOrientation: 'landscape' | 'portrait' | null = null;
          
          // Frame mapping
          const frameMap: Record<string, string> = {
            'landscape': landscapeFrame,
            'portrait1': portraitFrame1,
            'portrait2': portraitFrame2,
            'portrait3': portraitFrame3,
          };
          
          if (frameId) {
            // Use manually selected frame
            if (frameId in frameMap) {
              frameImageSrc = frameMap[frameId];
              userSelectedOrientation = frameId === 'landscape' ? 'landscape' : 'portrait';
              console.log(`✓ Using MANUALLY SELECTED ${frameId.toUpperCase()} frame`);
            } else {
              // Fallback for unexpected frameId
              frameImageSrc = landscapeFrame;
              userSelectedOrientation = 'landscape';
            }
          } else {
            // Auto-detect orientation based on first photo's aspect ratio
            const firstPhoto = loadedImages[0];
            const isPhotoPortrait = firstPhoto.height > firstPhoto.width;
            if (isPhotoPortrait) {
              // Randomly select one of the portrait frames
              const portraitFrames = [portraitFrame1, portraitFrame2, portraitFrame3];
              frameImageSrc = portraitFrames[Math.floor(Math.random() * portraitFrames.length)];
            } else {
              frameImageSrc = landscapeFrame;
            }
            
            console.log('=== FRAME AUTO-DETECTION ===');
            console.log(`Photo dimensions: ${firstPhoto.width}x${firstPhoto.height}`);
            console.log(`Aspect ratio: ${(firstPhoto.width/firstPhoto.height).toFixed(2)}:1`);
            console.log(`Detected orientation: ${isPhotoPortrait ? 'PORTRAIT' : 'LANDSCAPE'}`);
            console.log(`Selected frame: ${isPhotoPortrait ? 'PORTRAIT' : 'LANDSCAPE'}`);
            console.log('============================');
            
            if (!isPhotoPortrait && firstPhoto.width > firstPhoto.height) {
              console.log('💡 TIP: Your camera captured in landscape (wider than tall).');
              console.log('   If you want portrait frame, use the frame selection buttons!');
            }
          }
          
          // Load the frame image
          const frameImg = await loadImage(frameImageSrc);
          
          // Set canvas to frame dimensions
          canvas.width = frameImg.width;
          canvas.height = frameImg.height;
          
          // Start with transparent background (no fill)
          // Photos will be drawn first, then frame overlay on top
          
          // Auto-detect cutout positions (pass user's selection to override physical dimensions)
          const { cutouts, usedGreenMode } = detectCutouts(frameImg, 2, userSelectedOrientation);
          
          console.log(`🖼️ Canvas size: ${canvas.width}x${canvas.height}`);
          console.log(`🖼️ Frame size: ${frameImg.width}x${frameImg.height}`);
          
          if (cutouts.length === 2) {
            // Determine frame orientation based on user selection OR physical dimensions
            const frameIsPortrait = userSelectedOrientation 
              ? userSelectedOrientation === 'portrait'
              : frameImg.height > frameImg.width;
            
            console.log('Using auto-detected cutout positions');
            console.log(`Frame is ${frameIsPortrait ? 'PORTRAIT' : 'LANDSCAPE'}`);
            console.log(`Cutout 0: centerX=${Math.round(cutouts[0].centerX)}, centerY=${Math.round(cutouts[0].centerY)}`);
            console.log(`Cutout 1: centerX=${Math.round(cutouts[1].centerX)}, centerY=${Math.round(cutouts[1].centerY)}`);
            
            // FORCE correct ordering for landscape frames
            // If landscape and cutouts are not in left-right order, swap them
            if (!frameIsPortrait) {
              // For landscape: leftmost should be first
              if (cutouts[0].centerX > cutouts[1].centerX) {
                console.log('⚠️ Swapping cutouts to ensure LEFT-RIGHT order');
                [cutouts[0], cutouts[1]] = [cutouts[1], cutouts[0]];
                console.log(`After swap - Cutout 0: centerX=${Math.round(cutouts[0].centerX)}, Cutout 1: centerX=${Math.round(cutouts[1].centerX)}`);
              }
            } else {
              // For portrait: topmost should be first  
              if (cutouts[0].centerY > cutouts[1].centerY) {
                console.log('⚠️ Swapping cutouts to ensure TOP-BOTTOM order');
                [cutouts[0], cutouts[1]] = [cutouts[1], cutouts[0]];
                console.log(`After swap - Cutout 0: centerY=${Math.round(cutouts[0].centerY)}, Cutout 1: centerY=${Math.round(cutouts[1].centerY)}`);
              }
            }
            
            // Draw photos in detected cutouts with clipping
            // IMPORTANT: Photo ordering is guaranteed:
            // - Landscape frames: Photo 1 (index 0) → LEFT, Photo 2 (index 1) → RIGHT
            // - Portrait frames: Photo 1 (index 0) → TOP, Photo 2 (index 1) → BOTTOM
            loadedImages.forEach((img, index) => {
              const cutout = cutouts[index];
              
              // Log which photo goes where
              const photoNumber = index + 1;
              const position = frameIsPortrait 
                ? (index === 0 ? 'TOP' : 'BOTTOM')
                : (index === 0 ? 'LEFT' : 'RIGHT');
              console.log(`📸 Photo ${photoNumber} → ${position} region (center: ${Math.round(cutout.centerX)}, ${Math.round(cutout.centerY)}, size: ${Math.round(cutout.width)}x${Math.round(cutout.height)})`);
              
              // Save canvas state before clipping
              ctx.save();
              
              // Create rectangular clipping region - constrain photo to cutout bounds exactly
              const clipX = cutout.centerX - cutout.width / 2;
              const clipY = cutout.centerY - cutout.height / 2;
              ctx.beginPath();
              ctx.rect(clipX, clipY, cutout.width, cutout.height);
              ctx.clip();
              
              // Calculate aspect-fill scaling to completely cover green region (no gaps)
              const scale = Math.max(cutout.width / img.width, cutout.height / img.height);
              const scaledWidth = img.width * scale;
              const scaledHeight = img.height * scale;
              
              // Center the scaled image in the cutout
              const offsetX = cutout.centerX - scaledWidth / 2;
              const offsetY = cutout.centerY - scaledHeight / 2;
              
              console.log(`   Drawing photo: scale=${scale.toFixed(3)}, size=${Math.round(scaledWidth)}x${Math.round(scaledHeight)}, pos=(${Math.round(offsetX)}, ${Math.round(offsetY)})`);
              
              // Draw photo (clipped to cutout region - cannot overflow)
              ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
              
              // Restore canvas state (remove clipping)
              ctx.restore();
            });
            
          } else {
            console.warn(`Detected ${cutouts.length} cutouts, using fallback positioning`);
            
            // Fallback: use heuristic positioning
            // IMPORTANT: Still maintains same ordering rules:
            // - Landscape: Photo 1 → LEFT (30%), Photo 2 → RIGHT (70%)
            // - Portrait: Photo 1 → TOP (30%), Photo 2 → BOTTOM (70%)
            const isPortrait = frameImg.height > frameImg.width;
            if (isPortrait) {
              console.log('Using fallback PORTRAIT layout: Photo 1 → TOP, Photo 2 → BOTTOM');
              const positions = [
                { centerX: frameImg.width / 2, centerY: frameImg.height * 0.3, width: frameImg.width * 0.4, height: frameImg.height * 0.25 },
                { centerX: frameImg.width / 2, centerY: frameImg.height * 0.7, width: frameImg.width * 0.4, height: frameImg.height * 0.25 }
              ];
              
              loadedImages.forEach((img, index) => {
                const pos = positions[index];
                const photoNumber = index + 1;
                const position = index === 0 ? 'TOP' : 'BOTTOM';
                console.log(`📸 Photo ${photoNumber} → ${position} (fallback position)`);
                
                // Save state before clipping
                ctx.save();
                
                // Create clipping region for fallback position
                const clipX = pos.centerX - pos.width / 2;
                const clipY = pos.centerY - pos.height / 2;
                ctx.beginPath();
                ctx.rect(clipX, clipY, pos.width, pos.height);
                ctx.clip();
                
                // Use aspect-fill to completely cover region (no gaps)
                const scale = Math.max(pos.width / img.width, pos.height / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const offsetX = pos.centerX - scaledWidth / 2;
                const offsetY = pos.centerY - scaledHeight / 2;
                
                // Draw clipped
                ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
                
                // Restore state
                ctx.restore();
              });
            } else {
              console.log('Using fallback LANDSCAPE layout: Photo 1 → LEFT, Photo 2 → RIGHT');
              const positions = [
                { centerX: frameImg.width * 0.3, centerY: frameImg.height / 2, width: frameImg.width * 0.25, height: frameImg.height * 0.4 },
                { centerX: frameImg.width * 0.7, centerY: frameImg.height / 2, width: frameImg.width * 0.25, height: frameImg.height * 0.4 }
              ];
              
              loadedImages.forEach((img, index) => {
                const pos = positions[index];
                const photoNumber = index + 1;
                const position = index === 0 ? 'LEFT' : 'RIGHT';
                console.log(`📸 Photo ${photoNumber} → ${position} (fallback position)`);
                
                // Save state before clipping
                ctx.save();
                
                // Create clipping region for fallback position
                const clipX = pos.centerX - pos.width / 2;
                const clipY = pos.centerY - pos.height / 2;
                ctx.beginPath();
                ctx.rect(clipX, clipY, pos.width, pos.height);
                ctx.clip();
                
                // Use aspect-fill to completely cover region (no gaps)
                const scale = Math.max(pos.width / img.width, pos.height / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const offsetX = pos.centerX - scaledWidth / 2;
                const offsetY = pos.centerY - scaledHeight / 2;
                
                // Draw clipped
                ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
                
                // Restore state
                ctx.restore();
              });
            }
          }
          
          // Draw frame overlay on top
          if (usedGreenMode) {
            // Green mode: Remove green pixels from frame to show photos underneath
            console.log('🎨 Creating chroma-keyed frame (removing green pixels)...');
            
            // Create offscreen canvas for chroma-keying
            const keyCanvas = document.createElement('canvas');
            keyCanvas.width = frameImg.width;
            keyCanvas.height = frameImg.height;
            const keyCtx = keyCanvas.getContext('2d');
            
            if (keyCtx) {
              // Draw original frame
              keyCtx.drawImage(frameImg, 0, 0);
              
              // Get pixel data
              const keyImageData = keyCtx.getImageData(0, 0, frameImg.width, frameImg.height);
              const keyData = keyImageData.data;
              
              // Convert green pixels to transparent
              let removedPixels = 0;
              for (let i = 0; i < keyData.length; i += 4) {
                const r = keyData[i];
                const g = keyData[i + 1];
                const b = keyData[i + 2];
                
                // Same green detection as before
                if (g > 100 && g > r * 1.5 && g > b * 1.5) {
                  keyData[i + 3] = 0; // Make transparent
                  removedPixels++;
                }
              }
              
              console.log(`✓ Made ${removedPixels} green pixels transparent`);
              
              // Put modified data back
              keyCtx.putImageData(keyImageData, 0, 0);
              
              // Draw the chroma-keyed frame
              ctx.drawImage(keyCanvas, 0, 0, canvas.width, canvas.height);
            }
          } else {
            // Transparency mode: Original frame already has transparent areas
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          }
          
        } else if (layout === 'friends' && loadedImages.length === 3) {
          // For friends layout with 3 photos, use frame overlay
          // Determine frame to use
          let frameImageSrc: string;
          
          // Frame mapping for 3-photo frames
          const threePhotoFrameMap: Record<string, string> = {
            'three1': threePhotoFrame1,
            'three2': threePhotoFrame2,
            'three3': threePhotoFrame3,
            'three4': threePhotoFrame4,
            'three5': threePhotoFrame5,
          };
          
          if (frameId && frameId in threePhotoFrameMap) {
            // Use manually selected frame
            frameImageSrc = threePhotoFrameMap[frameId];
            console.log(`✓ Using MANUALLY SELECTED ${frameId.toUpperCase()} frame`);
          } else {
            // Random selection from available 3-photo frames
            const frames = [threePhotoFrame1, threePhotoFrame2, threePhotoFrame3, threePhotoFrame4, threePhotoFrame5];
            frameImageSrc = frames[Math.floor(Math.random() * frames.length)];
            console.log('Using randomly selected 3-photo frame');
          }
          
          // Load the frame image
          const frameImg = await loadImage(frameImageSrc);
          
          // Set canvas to frame dimensions
          canvas.width = frameImg.width;
          canvas.height = frameImg.height;
          
          // Auto-detect cutout positions for 3 photos (always portrait orientation)
          const { cutouts, usedGreenMode } = detectCutouts(frameImg, 3, 'portrait');
          
          console.log(`🖼️ Canvas size: ${canvas.width}x${canvas.height}`);
          console.log(`🖼️ Frame size: ${frameImg.width}x${frameImg.height}`);
          
          if (cutouts.length === 3) {
            console.log('Using auto-detected cutout positions for 3 photos');
            console.log(`Cutout 0 (TOP): centerX=${Math.round(cutouts[0].centerX)}, centerY=${Math.round(cutouts[0].centerY)}`);
            console.log(`Cutout 1 (MIDDLE): centerX=${Math.round(cutouts[1].centerX)}, centerY=${Math.round(cutouts[1].centerY)}`);
            console.log(`Cutout 2 (BOTTOM): centerX=${Math.round(cutouts[2].centerX)}, centerY=${Math.round(cutouts[2].centerY)}`);
            
            // Ensure TOP-MIDDLE-BOTTOM order (sort by centerY)
            cutouts.sort((a, b) => a.centerY - b.centerY);
            
            // Draw photos in detected cutouts with clipping
            // Photo ordering: Photo 1 → TOP, Photo 2 → MIDDLE, Photo 3 → BOTTOM
            loadedImages.forEach((img, index) => {
              const cutout = cutouts[index];
              const photoNumber = index + 1;
              const positions = ['TOP', 'MIDDLE', 'BOTTOM'];
              console.log(`📸 Photo ${photoNumber} → ${positions[index]} region (center: ${Math.round(cutout.centerX)}, ${Math.round(cutout.centerY)}, size: ${Math.round(cutout.width)}x${Math.round(cutout.height)})`);
              
              // Save canvas state before clipping
              ctx.save();
              
              // Create rectangular clipping region
              const clipX = cutout.centerX - cutout.width / 2;
              const clipY = cutout.centerY - cutout.height / 2;
              ctx.beginPath();
              ctx.rect(clipX, clipY, cutout.width, cutout.height);
              ctx.clip();
              
              // Use aspect-fill to completely cover region (no gaps)
              const scale = Math.max(cutout.width / img.width, cutout.height / img.height);
              const scaledWidth = img.width * scale;
              const scaledHeight = img.height * scale;
              const offsetX = cutout.centerX - scaledWidth / 2;
              const offsetY = cutout.centerY - scaledHeight / 2;
              
              // Draw clipped photo
              ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
              
              // Restore state
              ctx.restore();
            });
          } else {
            // Fallback: use simple vertical stacking
            console.log(`⚠️ Expected 3 cutouts, found ${cutouts.length}. Using fallback layout.`);
            
            const regionHeight = frameImg.height / 3;
            const positions = [
              { centerX: frameImg.width / 2, centerY: regionHeight * 0.5, width: frameImg.width * 0.8, height: regionHeight * 0.8 },
              { centerX: frameImg.width / 2, centerY: regionHeight * 1.5, width: frameImg.width * 0.8, height: regionHeight * 0.8 },
              { centerX: frameImg.width / 2, centerY: regionHeight * 2.5, width: frameImg.width * 0.8, height: regionHeight * 0.8 }
            ];
            
            loadedImages.forEach((img, index) => {
              const pos = positions[index];
              const photoNumber = index + 1;
              const positionNames = ['TOP', 'MIDDLE', 'BOTTOM'];
              console.log(`📸 Photo ${photoNumber} → ${positionNames[index]} (fallback position)`);
              
              ctx.save();
              
              const clipX = pos.centerX - pos.width / 2;
              const clipY = pos.centerY - pos.height / 2;
              ctx.beginPath();
              ctx.rect(clipX, clipY, pos.width, pos.height);
              ctx.clip();
              
              const scale = Math.max(pos.width / img.width, pos.height / img.height);
              const scaledWidth = img.width * scale;
              const scaledHeight = img.height * scale;
              const offsetX = pos.centerX - scaledWidth / 2;
              const offsetY = pos.centerY - scaledHeight / 2;
              
              ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
              ctx.restore();
            });
          }
          
          // Draw frame overlay on top
          if (usedGreenMode) {
            // Green mode: Remove green pixels from frame to show photos underneath
            console.log('🎨 Creating chroma-keyed frame (removing green pixels)...');
            
            const keyCanvas = document.createElement('canvas');
            keyCanvas.width = frameImg.width;
            keyCanvas.height = frameImg.height;
            const keyCtx = keyCanvas.getContext('2d');
            
            if (keyCtx) {
              keyCtx.drawImage(frameImg, 0, 0);
              const keyImageData = keyCtx.getImageData(0, 0, frameImg.width, frameImg.height);
              const keyData = keyImageData.data;
              
              let removedPixels = 0;
              for (let i = 0; i < keyData.length; i += 4) {
                const r = keyData[i];
                const g = keyData[i + 1];
                const b = keyData[i + 2];
                
                if (g > 100 && g > r * 1.5 && g > b * 1.5) {
                  keyData[i + 3] = 0;
                  removedPixels++;
                }
              }
              
              console.log(`✓ Made ${removedPixels} green pixels transparent`);
              keyCtx.putImageData(keyImageData, 0, 0);
              ctx.drawImage(keyCanvas, 0, 0, canvas.width, canvas.height);
            }
          } else {
            // Transparency mode: Original frame already has transparent areas
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          }
          
        } else if (layout === 'friends' && loadedImages.length === 4) {
          // For friends layout with 4 photos, use frame overlay
          // Determine frame to use
          let frameImageSrc: string;
          
          // Frame mapping for 4-photo frames
          const fourPhotoFrameMap: Record<string, string> = {
            'four1': fourPhotoFrame1,
            'four2': fourPhotoFrame2,
            'four3': fourPhotoFrame3,
          };
          
          if (frameId && frameId in fourPhotoFrameMap) {
            // Use manually selected frame
            frameImageSrc = fourPhotoFrameMap[frameId];
            console.log(`✓ Using MANUALLY SELECTED ${frameId.toUpperCase()} frame`);
          } else {
            // Random selection from available 4-photo frames
            const frames = [fourPhotoFrame1, fourPhotoFrame2, fourPhotoFrame3];
            frameImageSrc = frames[Math.floor(Math.random() * frames.length)];
            console.log('Using randomly selected 4-photo frame');
          }
          
          // Load the frame image
          const frameImg = await loadImage(frameImageSrc);
          
          // Set canvas to frame dimensions
          canvas.width = frameImg.width;
          canvas.height = frameImg.height;
          
          // Auto-detect cutout positions for 4 photos (always portrait orientation)
          const { cutouts, usedGreenMode } = detectCutouts(frameImg, 4, 'portrait');
          
          console.log(`🖼️ Canvas size: ${canvas.width}x${canvas.height}`);
          console.log(`🖼️ Frame size: ${frameImg.width}x${frameImg.height}`);
          
          if (cutouts.length === 4) {
            console.log('Using auto-detected cutout positions for 4 photos');
            console.log(`Cutout 0 (TOP): centerX=${Math.round(cutouts[0].centerX)}, centerY=${Math.round(cutouts[0].centerY)}`);
            console.log(`Cutout 1 (TOP-MID): centerX=${Math.round(cutouts[1].centerX)}, centerY=${Math.round(cutouts[1].centerY)}`);
            console.log(`Cutout 2 (BOTTOM-MID): centerX=${Math.round(cutouts[2].centerX)}, centerY=${Math.round(cutouts[2].centerY)}`);
            console.log(`Cutout 3 (BOTTOM): centerX=${Math.round(cutouts[3].centerX)}, centerY=${Math.round(cutouts[3].centerY)}`);
            
            // Ensure TOP-TOP/MID-BOTTOM/MID-BOTTOM order (sort by centerY)
            cutouts.sort((a, b) => a.centerY - b.centerY);
            
            // Draw photos in detected cutouts with clipping
            // Photo ordering: Photo 1 → TOP, Photo 2 → TOP-MID, Photo 3 → BOTTOM-MID, Photo 4 → BOTTOM
            loadedImages.forEach((img, index) => {
              const cutout = cutouts[index];
              const photoNumber = index + 1;
              const positions = ['TOP', 'TOP-MID', 'BOTTOM-MID', 'BOTTOM'];
              console.log(`📸 Photo ${photoNumber} → ${positions[index]} region (center: ${Math.round(cutout.centerX)}, ${Math.round(cutout.centerY)}, size: ${Math.round(cutout.width)}x${Math.round(cutout.height)})`);
              
              // Save canvas state before clipping
              ctx.save();
              
              // Create rectangular clipping region
              const clipX = cutout.centerX - cutout.width / 2;
              const clipY = cutout.centerY - cutout.height / 2;
              ctx.beginPath();
              ctx.rect(clipX, clipY, cutout.width, cutout.height);
              ctx.clip();
              
              // Use aspect-fill to completely cover region (no gaps)
              const scale = Math.max(cutout.width / img.width, cutout.height / img.height);
              const scaledWidth = img.width * scale;
              const scaledHeight = img.height * scale;
              const offsetX = cutout.centerX - scaledWidth / 2;
              const offsetY = cutout.centerY - scaledHeight / 2;
              
              // Draw clipped photo
              ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
              
              // Restore state
              ctx.restore();
            });
          } else {
            // Fallback: use simple vertical stacking
            console.log(`⚠️ Expected 4 cutouts, found ${cutouts.length}. Using fallback layout.`);
            
            const regionHeight = frameImg.height / 4;
            const positions = [
              { centerX: frameImg.width / 2, centerY: regionHeight * 0.5, width: frameImg.width * 0.8, height: regionHeight * 0.8 },
              { centerX: frameImg.width / 2, centerY: regionHeight * 1.5, width: frameImg.width * 0.8, height: regionHeight * 0.8 },
              { centerX: frameImg.width / 2, centerY: regionHeight * 2.5, width: frameImg.width * 0.8, height: regionHeight * 0.8 },
              { centerX: frameImg.width / 2, centerY: regionHeight * 3.5, width: frameImg.width * 0.8, height: regionHeight * 0.8 }
            ];
            
            loadedImages.forEach((img, index) => {
              const pos = positions[index];
              const photoNumber = index + 1;
              const positionNames = ['TOP', 'TOP-MID', 'BOTTOM-MID', 'BOTTOM'];
              console.log(`📸 Photo ${photoNumber} → ${positionNames[index]} (fallback position)`);
              
              ctx.save();
              
              const clipX = pos.centerX - pos.width / 2;
              const clipY = pos.centerY - pos.height / 2;
              ctx.beginPath();
              ctx.rect(clipX, clipY, pos.width, pos.height);
              ctx.clip();
              
              const scale = Math.max(pos.width / img.width, pos.height / img.height);
              const scaledWidth = img.width * scale;
              const scaledHeight = img.height * scale;
              const offsetX = pos.centerX - scaledWidth / 2;
              const offsetY = pos.centerY - scaledHeight / 2;
              
              ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
              ctx.restore();
            });
          }
          
          // Draw frame overlay on top
          if (usedGreenMode) {
            // Green mode: Remove green pixels from frame to show photos underneath
            console.log('🎨 Creating chroma-keyed frame (removing green pixels)...');
            
            const keyCanvas = document.createElement('canvas');
            keyCanvas.width = frameImg.width;
            keyCanvas.height = frameImg.height;
            const keyCtx = keyCanvas.getContext('2d');
            
            if (keyCtx) {
              keyCtx.drawImage(frameImg, 0, 0);
              const keyImageData = keyCtx.getImageData(0, 0, frameImg.width, frameImg.height);
              const keyData = keyImageData.data;
              
              let removedPixels = 0;
              for (let i = 0; i < keyData.length; i += 4) {
                const r = keyData[i];
                const g = keyData[i + 1];
                const b = keyData[i + 2];
                
                if (g > 100 && g > r * 1.5 && g > b * 1.5) {
                  keyData[i + 3] = 0;
                  removedPixels++;
                }
              }
              
              console.log(`✓ Made ${removedPixels} green pixels transparent`);
              keyCtx.putImageData(keyImageData, 0, 0);
              ctx.drawImage(keyCanvas, 0, 0, canvas.width, canvas.height);
            }
          } else {
            // Transparency mode: Original frame already has transparent areas
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          }
          
        } else {
          // No frame - use gradient background layout
          if (layout === 'couples') {
            // Use high-resolution photos for quality
            const photoWidth = 800;
            const photoHeight = 1000;
            const spacing = 32;
            
            // Horizontal layout for couples (2 photos side by side)
            canvas.width = (photoWidth * 2) + (spacing * 3);
            canvas.height = photoHeight + (spacing * 2);
            
            // Gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#ff8e8e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw photos in order
            loadedImages.forEach((img, index) => {
              const x = spacing + (index * (photoWidth + spacing));
              const y = spacing;
              ctx.drawImage(img, x, y, photoWidth, photoHeight);
            });
          } else {
            // Use high-resolution photos for quality
            const photoWidth = 800;
            const photoHeight = 1000;
            const spacing = 32;
            
            // Vertical layout for friends (4 photos stacked)
            canvas.width = photoWidth + (spacing * 2);
            canvas.height = (photoHeight * loadedImages.length) + (spacing * (loadedImages.length + 1));
            
            // Gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#4facfe');
            gradient.addColorStop(1, '#00f2fe');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw photos in order
            loadedImages.forEach((img, index) => {
              const x = spacing;
              const y = spacing + (index * (photoHeight + spacing));
              ctx.drawImage(img, x, y, photoWidth, photoHeight);
            });
          }
        }
        
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error('Error creating photobooth strip:', error);
        reject(error);
      }
    });
  };

  const handlePhotoboothCapture = async (images: string[], layout: 'couples' | 'friends', frameId?: string) => {
    console.log('=== PHOTOBOOTH STRIP CREATION ===');
    console.log(`Creating ${layout} photobooth strip with ${images.length} photos`);
    if (frameId) {
      console.log(`Using manually selected ${frameId} frame`);
    } else {
      console.log('Using auto-detected frame orientation');
    }
    
    try {
      const stripImage = await createPhotoboothStrip(images, layout, frameId);
      
      // Check the strip quality
      const img = new Image();
      img.onload = () => {
        const megapixels = (img.width * img.height) / 1000000;
        console.log(`Photobooth strip created: ${img.width}x${img.height} (${megapixels.toFixed(1)}MP)`);
        if (megapixels < 1.0) {
          console.warn(`⚠️ Photobooth strip quality is low: ${megapixels.toFixed(1)}MP`);
        } else {
          console.log(`✅ Good quality photobooth strip: ${megapixels.toFixed(1)}MP`);
        }
      };
      img.src = stripImage;
      
      // Generate session ID and store strip image
      const sessionId = crypto.randomUUID();
      sessionStorage.setItem(`editor:${sessionId}`, stripImage);
      
      // Navigate to editor page
      setLocation(`/editor/${sessionId}`);
      console.log(`${layout} photobooth strip completed, opening editor`);
      console.log('=================================');
    } catch (error) {
      console.error('Error creating photobooth strip:', error);
      // Fallback to first image
      if (images.length > 0) {
        const sessionId = crypto.randomUUID();
        sessionStorage.setItem(`editor:${sessionId}`, images[0]);
        setLocation(`/editor/${sessionId}`);
      }
    }
  };


  const handleSharePhoto = (photo: Photo) => {
    setSharePhoto(photo);
    console.log('Opening share dialog for photo:', photo.id);
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    console.log('Deleted photo:', photoId);
  };

  const handleDownloadPhoto = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.src;
    link.download = `prettyclick-photo-${photo.id}.png`;
    link.click();
    console.log('Downloaded photo:', photo.id);
  };

  // Show header on all pages
  const hideHeader = false;

  return (
    <div className="min-h-screen bg-background">
      {!hideHeader && <Header />}
      
      <Switch>
        {/* Public Routes */}
        <Route path="/">
          {!isAuthenticated ? <LandingPage /> : <PrettyClickCamera onCapture={handleCapture} onPhotoboothCapture={handlePhotoboothCapture} />}
        </Route>
        
        <Route path="/auth">
          {!isAuthenticated ? <AuthPage /> : <PrettyClickCamera onCapture={handleCapture} onPhotoboothCapture={handlePhotoboothCapture} />}
        </Route>
        
        <Route path="/about">
          <AboutPage />
        </Route>
        
        <Route path="/tutorial">
          <TutorialPage />
        </Route>
        
        <Route path="/policy">
          <PolicyPage />
        </Route>
        
        <Route path="/contact">
          <ContactPage />
        </Route>
        
        {/* User Profile Routes */}
        <Route path="/profile">
          {isAuthenticated ? <UserProfile /> : <AuthPage />}
        </Route>
        
        <Route path="/profile/settings">
          {isAuthenticated ? <ProfileSettings /> : <AuthPage />}
        </Route>
        
        <Route path="/users/:userId">
          {(params) => <UserProfile userId={params.userId} />}
        </Route>
        
        {/* Protected Routes */}
        <Route path="/camera">
          {isAuthenticated ? <PrettyClickCamera onCapture={handleCapture} onPhotoboothCapture={handlePhotoboothCapture} /> : <LandingPage />}
        </Route>
        
        <Route path="/editor/:sessionId">
          {isAuthenticated ? <PhotoEditorPage /> : <AuthPage />}
        </Route>
        
        <Route path="/editor">
          {isAuthenticated ? (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
              <div className="max-w-md text-center">
                <h2 className="text-2xl font-bold mb-4">No Photo Selected</h2>
                <p className="text-muted-foreground mb-6">
                  To use the photo editor, you need to take a photo first!
                </p>
                <Button
                  onClick={() => setLocation('/camera')}
                  data-testid="button-go-to-camera"
                  className="hover-elevate"
                >
                  Go to Camera
                </Button>
              </div>
            </div>
          ) : <AuthPage />}
        </Route>
        
        <Route path="/gallery">
          <PublicGallery />
        </Route>
        
        {/* Shared Photo Route */}
        <Route path="/shared/:code">
          {(params) => (
            <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20">
              <div className="max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-6">Shared Photo</h1>
                <div className="bg-card/50 backdrop-blur p-8 rounded-lg text-center">
                  <p className="text-muted-foreground mb-4">
                    Photo with code: <span className="font-mono font-bold">{params.code}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This is a placeholder for the shared photo feature.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Route>
        
        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
      
      {/* Modals */}
      
      {sharePhoto && (
        <SharePhoto
          photo={sharePhoto}
          onClose={() => setSharePhoto(null)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;