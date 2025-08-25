# SEO Analytics Dashboard

## Overview

This is a comprehensive SEO analytics dashboard, a full-stack web application designed for analyzing website SEO performance, tracking keywords, monitoring traffic data, and providing actionable recommendations. The project aims to deliver real-time, authentic SEO insights to users, helping them improve their search engine optimization strategies.

## User Preferences

Preferred communication style: Simple, everyday language.
Language: French (user communicates in French)
Interest: Real SEO data integration rather than mock data
Requirements: No fictional/mock data, only authentic SEO analysis from real APIs
Interface: Complete French translation required
Design preference: Soft and gentle aesthetics (not flashy or ultra-modern effects)

## System Architecture

The application employs a modern full-stack architecture focusing on performance, scalability, and user experience.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Framework**: Shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables, emphasizing a soft and gentle aesthetic.
- **Design**: Mobile-first, responsive design.

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful APIs
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon serverless)
- **Development**: TSX for efficient TypeScript execution.

### Key Features and Design Decisions
- **Database Schema**: Focuses on `websites` and `seo_analyses` tables, storing comprehensive SEO metrics, technical indicators, keyword rankings, and recommendations.
- **API Endpoints**: Standard RESTful API for CRUD operations on websites and SEO analysis data.
- **Frontend Pages**: Dashboard for overview, Reports for detailed insights, Settings for website management, and a comprehensive Editorial Calendar page with content planning and management features.
- **Data Flow**: User registration, automated SEO analysis, interactive data visualization, real-time updates via TanStack Query, and intuitive mobile navigation.
- **Airtable Integration**: Core data, including SEO analyses and content, is synchronized with Airtable for robust management.
- **AI Integration**: Utilizes GPT-4o for intelligent SEO analysis and personalized recommendations.
- **Content Management**: Features an editorial article editing system with Airtable synchronization and a social media program builder with flexible scheduling.
- **Editorial Calendar Generation**: AI-powered editorial calendar generation with dynamic progression tracking and background processing, providing a 1-hour generation window.
- **UI/UX**: Emphasis on subtle gradients, pastel colors, calming interactions, intelligent scrolling, and comprehensive help tooltips.
- **Image Management**: Advanced image handling with support for dual Airtable fields (upload, DALL-E) and intelligent prioritization.
- **Social Media Parameters**: Secure management of API tokens for various social media platforms, supporting complex JSON structures.

## External Dependencies

### UI and Styling
- Radix UI
- Tailwind CSS
- Lucide React
- Class Variance Authority

### Data Management
- TanStack Query
- React Hook Form
- Zod (for validation)
- Date-fns

### Development Tools
- TypeScript
- ESBuild

### Services & APIs
- Neon (serverless PostgreSQL)
- Google PageSpeed Insights API
- n8n (for workflow automation and chat widget)
- Airtable API
- OpenAI (GPT-4o for AI agent)