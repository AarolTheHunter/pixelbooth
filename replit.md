# prettyclick Photobooth

## Overview

A digital photobooth application that allows users to take photos with real-time filters, add emoji overlays, edit captured images, and share their creations. The application provides a complete photo creation and sharing experience with an Instagram-inspired interface and modern gradient design.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with **React 18** and **TypeScript**, using a component-based architecture with functional components and hooks for state management. The application follows a single-page application (SPA) pattern using **Wouter** for client-side routing.

**UI Framework**: Built on **shadcn/ui** component library with **Radix UI** primitives and **Tailwind CSS** for styling. The design system implements a cyan-to-purple gradient theme inspired by modern photo apps like Instagram and VSCO.

**State Management**: Uses React's built-in state management with useState and useEffect hooks. Photo data and user authentication state are managed at the application level and passed down through props.

**Key Components**:
- `PrettyClickCamera`: Handles camera access, real-time filtering, multi-photo capture sequences, and decorative frame selection for 2-photo layouts
- `PhotoEditor`: Advanced editing interface with emoji overlays, drawing tools, and border effects
- `PhotoGallery`: Grid-based photo display with masonry layout and interactive controls
- `Header`: Navigation with gradient background and responsive design
- `LoginForm`: Authentication interface with login/signup toggle

**Photobooth Features**:
- Multi-photo capture with 2, 3, or 4 photos per session
- Authentic photobooth countdown and capture animations with camera shutter sound effects
- Real-time filter preview during capture
- Decorative frame templates for 2-photo "couples" layouts:
  - **Chocolate** (landscape): Pink polka dots with cupcakes and flower-shaped photo cutouts
  - **Classic** (portrait1): Original portrait frame design
  - **Scrapbook** (portrait2): Brown/beige vintage style with buttons and lace decorations
  - **Cute Pink** (portrait3): Pink wavy borders with heart cherries and text decoration
- Decorative frame templates for 3-photo "friends" layouts:
  - **Theater** (three1): Theater ticket theme with 3 horizontal green regions
  - **Pink Bows** (three2): Pink bows and tulips with portrait layout
  - **Holiday** (three3): Christmas/holiday theme with festive decorations
  - **Nepopo** (three4): Nepopotamus theme with unique character design
  - **Cupcake** (three5): Sweet cupcake and cookie decorations
- Decorative frame templates for 4-photo "squad" layouts:
  - **Cute Stars** (four1): Portrait layout with stars and cute decorations
  - **Garden** (four2): Portrait layout with floral garden theme
  - **Valentine** (four3): Portrait layout with hearts and valentine decorations
- Frame selection UI with live preview thumbnails showing all frame options (visible for 2-photo, 3-photo, and 4-photo modes)
- Manual frame selection: Users can choose specific frames or let the system auto-detect
- Automatic cutout detection system that analyzes frame images to position photos correctly
- High-quality photo compositing that places user photos within frame decorations
- 20% region expansion factor applied to detected cutouts for optimal photo visibility
- Intelligent region splitting: 2 regions for couples mode, 3 regions (TOP/MIDDLE/BOTTOM) for 3-photo mode, 4 regions (TOP/TOP-MID/BOTTOM-MID/BOTTOM) for 4-photo mode
- 10% gap margin between adjacent regions to prevent photo overlap and ensure clear visual separation

**Frame Auto-Detection System**:
The application includes an intelligent auto-detection system that analyzes frame images to automatically position photos within transparent cutouts:
- **Flood-fill algorithm** excludes border-connected transparency, isolating only interior cutouts
- **Pixel scanning** identifies transparent regions (alpha < 128) within the frame image
- **Clustering algorithm** splits cutouts by midpoint (Y-axis for portrait, X-axis for landscape)
- **Bounding box calculation** uses iterative min/max computation to avoid stack overflow with large pixel arrays
- **Photo positioning** places images behind the frame overlay with 15% bleed for full coverage
- **Fallback positioning** provides heuristic placements when auto-detection doesn't find exactly 2 cutouts
- **Console logging** outputs transparent pixel counts and detected positions for debugging

### Backend Architecture
The backend uses **Express.js** with **TypeScript** in an ESM configuration. The server implements a modular architecture with separate concerns for routing, storage, and middleware.

**Server Structure**:
- Hot reload development setup with **Vite** middleware integration
- Modular route registration system in `server/routes.ts`
- Abstract storage interface allowing for multiple storage implementations
- Request logging middleware with JSON response capture

**Storage Layer**: Implements an abstract `IStorage` interface with initial in-memory implementation (`MemStorage`). The system is designed to easily switch to database storage without changing business logic.

### Data Storage Solutions
The application is configured for **PostgreSQL** database integration using **Drizzle ORM**. Database schema is defined in `shared/schema.ts` with type-safe queries and migrations.

**Current Schema**:
- Users table with id, username, and password fields
- UUID-based primary keys with PostgreSQL's `gen_random_uuid()`
- Zod validation schemas for type safety

**Migration Strategy**: Uses Drizzle Kit for schema migrations with configuration in `drizzle.config.ts`.

### Authentication and Authorization
Basic user authentication system with username/password credentials. The frontend includes login/signup forms with form validation and loading states. Backend storage interface includes user creation and lookup methods.

**Security Considerations**: Session management and password hashing are not yet implemented in the current storage layer but are planned for database integration.

### External Dependencies
- **Camera API**: Uses browser's MediaDevices API for camera access and photo capture
- **Canvas API**: For real-time image processing, filtering, and editing operations
- **File API**: For photo download functionality and image data handling

**Development Tools**:
- **Vite** for development server and build tooling
- **TypeScript** for type safety across the entire stack
- **ESLint/Prettier** implied through TypeScript configuration
- **Replit integration** with development banner and error handling

**UI Dependencies**:
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Lucide React** for consistent iconography
- **React Hook Form** with Zod resolvers for form validation
- **TanStack Query** for server state management (configured but not actively used)

The architecture supports future enhancements like real-time collaboration, advanced photo effects, and social sharing features while maintaining clean separation of concerns and type safety throughout the application.