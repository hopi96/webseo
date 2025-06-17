# SEO Analytics Dashboard

## Overview

This is a comprehensive SEO analytics dashboard built as a full-stack web application. The system allows users to analyze website SEO performance, track keywords, monitor traffic data, and receive actionable recommendations for improving search engine optimization.

## System Architecture

The application follows a modern full-stack architecture:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Mobile-First Design**: Responsive design optimized for mobile devices

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Development**: TSX for TypeScript execution in development

## Key Components

### Database Schema
The application uses two main tables:
- **websites**: Stores website information (id, url, name, created_at)
- **seo_analyses**: Stores comprehensive SEO analysis data including:
  - Overall scores and metrics (traffic, keywords, backlinks, page speed)
  - Technical SEO indicators (mobile-friendly, HTTPS, sitemap, robots.txt)
  - Keyword rankings with trend data
  - Traffic analytics over time
  - Prioritized recommendations for improvements

### API Endpoints
- `GET /api/websites` - Retrieve all websites
- `GET /api/websites/:id` - Get specific website details
- `POST /api/websites` - Create new website
- `DELETE /api/websites/:id` - Remove website
- `GET /api/websites/:id/seo-analysis` - Get SEO analysis for website
- `POST /api/websites/:id/seo-analysis` - Create SEO analysis
- `PUT /api/websites/:id/seo-analysis` - Update existing analysis

### Frontend Pages
- **Dashboard**: Overview of SEO metrics, traffic charts, and key recommendations
- **Keywords**: Detailed keyword rankings, search volumes, and trend analysis
- **Reports**: Comprehensive SEO reports with downloadable insights
- **Settings**: Website management and application preferences

## Data Flow

1. **Website Registration**: Users add websites through the settings page
2. **SEO Analysis**: The system generates comprehensive SEO analyses for each website
3. **Data Visualization**: Metrics are displayed through interactive charts and cards
4. **Real-time Updates**: TanStack Query manages data fetching and caching
5. **Mobile Navigation**: Bottom navigation provides easy access to all features

## External Dependencies

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- Class Variance Authority for component variants

### Data Management
- TanStack Query for server state management
- React Hook Form with Zod validation
- Date-fns for date manipulation

### Development Tools
- TypeScript for type safety
- ESBuild for production bundling
- Replit-specific plugins for development environment

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- TSX execution for backend development
- PostgreSQL database provisioned through Replit

### Production
- Frontend: Static build served through Express
- Backend: Bundled Node.js application
- Database: Neon serverless PostgreSQL
- Deployment: Replit autoscale infrastructure

### Build Process
1. Frontend assets built with Vite to `dist/public`
2. Backend bundled with ESBuild to `dist/index.js`
3. Static files served by Express in production

## Changelog

Changelog:
- June 16, 2025. Initial setup
- June 17, 2025. Integrated real SEO data via Google PageSpeed Insights API, complete French translation, removed all mock data
- June 17, 2025. Enhanced dashboard design with modern glassmorphism effects, animated backgrounds, premium card layouts, and sophisticated loading states with shimmer animations

## User Preferences

Preferred communication style: Simple, everyday language.
Language: French (user communicates in French)
Interest: Real SEO data integration rather than mock data
Requirements: No fictional/mock data, only authentic SEO analysis from real APIs
Interface: Complete French translation required