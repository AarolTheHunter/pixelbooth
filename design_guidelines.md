# prettyclick Photobooth Design Guidelines

## Design Approach
**Reference-Based Approach**: Taking inspiration from modern photo/camera apps like Instagram, VSCO, and Snapchat, while incorporating the specific gradient theme from the provided reference image.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light mode: Cyan to purple gradient (180 100% 70% to 280 80% 65%)
- Dark mode: Deep cyan to purple gradient (180 60% 20% to 280 40% 25%)
- Pink accent: 330 85% 70% (light) / 330 60% 50% (dark)
- White/off-white for text and UI elements

**Background Treatment:**
- Hero section: Full gradient overlay matching the reference image
- Main content areas: Subtle gradient backgrounds with higher transparency
- Card backgrounds: Semi-transparent with blur effects

### B. Typography
- **Primary Font**: 'Poppins' (Google Fonts) - modern, rounded, playful
- **Brand Logo**: Custom styling for "prettyclick" - lowercase, bold weight
- **Headings**: Poppins 600-700 weight
- **Body Text**: Poppins 400-500 weight
- **UI Elements**: Poppins 500 weight

### C. Layout System
**Spacing Units**: Tailwind units of 2, 4, 6, 8, and 12 (p-2, m-4, gap-6, etc.)
- Consistent 4-unit spacing between related elements
- 8-unit spacing between sections
- 12-unit spacing for major layout breaks

### D. Component Library

**Navigation:**
- Transparent header with blur effect
- Logo positioned left, navigation items right
- "CLICK!" button prominently featured as primary CTA
- Mobile: Hamburger menu with slide-out drawer

**Camera Interface:**
- Central viewfinder with rounded corners
- Filter toggles as horizontal scrollable pills below camera
- Emoji panel as expandable bottom drawer
- Capture button: Large circular button with gradient fill

**Photo Gallery:**
- Masonry grid layout for saved photos
- Hover effects revealing share/delete options
- Modal view for full-size photo preview

**Authentication Forms:**
- Frosted glass effect cards
- Input fields with subtle gradients and focus states
- Social login buttons with gradient borders

**Buttons:**
- Primary: Gradient fill matching brand colors
- Secondary: Outline with gradient border
- Ghost: Text with gradient color
- When placed over images: Blurred background with outline variant

### E. Special Features

**Filter System:**
- Real-time preview with smooth transitions
- Filter thumbnails with mini previews
- Intensity sliders for adjustable effects

**Emoji Overlay:**
- Draggable positioning with snap guides
- Scalable emojis with pinch/zoom gestures
- Popular emojis in quick-access toolbar

**Sharing Interface:**
- Generated unique codes displayed prominently
- QR code generation for easy sharing
- Copy link functionality with success feedback

## Images Section
**Hero Image**: No large hero image - instead use the signature gradient background with the camera interface as the focal point
**Gallery Thumbnails**: User-captured photos displayed in responsive grid
**Placeholder Images**: Gradient placeholders for empty states and loading
**Brand Assets**: "prettyclick" logo integration matching the reference design

## Key Visual Principles
- **Gradient-First Design**: Heavy use of the cyan-to-purple gradient throughout
- **Playful Interactions**: Subtle bounce animations for buttons and successful actions
- **Glass Morphism**: Frosted glass effects for overlays and modals
- **High Contrast**: Ensure text readability over gradient backgrounds
- **Mobile-First**: Touch-friendly interface with generous tap targets