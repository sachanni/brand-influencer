# Overview
This project is an "Influencer Hub," a full-stack web application designed to connect influencers with brands for collaboration. It aims to be a comprehensive platform for managing influencer profiles, tracking social media performance, showcasing brand collaborations, and facilitating secure user authentication. The platform provides tools for influencers to import their social media data, display their portfolios, and manage their brand partnerships.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript on Vite.
- **UI/UX**: Utilizes Shadcn/ui components (built on Radix UI) and Tailwind CSS for styling. Color schemes and design approaches prioritize a professional and clean aesthetic, matching user mockups for features like brand testimonials.
- **Routing**: Lightweight client-side routing with Wouter.
- **State Management**: TanStack Query for server state management and caching.
- **Forms**: React Hook Form with Zod validation for type-safe form handling.
- **Features**: Multi-step registration modal with brand-specific registration flow, seamless authentication flows for both influencers and brands, brand testimonials display with ratings, ROI metrics, and manager details, dynamic display of imported social media data, comprehensive 5-page influencer dashboard, professional brand dashboard with campaign management, professional import progress tracking, and secure OAuth connection shortcuts for social media.

## Backend
- **Runtime**: Node.js with TypeScript using ES modules.
- **Framework**: Express.js for REST API endpoints.
- **Authentication**: Passport.js with Google OAuth 2.0 strategy, supporting dual authentication (OAuth and email/password + OTP). Secure backend routes for registration, OTP verification, and login with bcrypt hashing.
- **Session Management**: Express sessions with PostgreSQL session store.
- **API Design**: RESTful endpoints with JSON responses and comprehensive error handling.
- **Technical Implementations**: Comprehensive social media import system extracting over 20 data points (profile image, bio, subscriber count, engagement metrics, video performance), portfolio content storage for recent videos with performance metrics, intelligent content category detection, and real-time calculation of performance metrics (Total Reach, Average Engagement, Brand Campaigns).
- **Two-Tier Campaign Visibility System**: Advanced privacy-controlled campaign information disclosure protecting brand strategy while enabling effective collaboration. Before bidding, influencers see general timelines, target audience details, content requirements, and payment models without sensitive data. After approval, full access to exact dates, budget ranges, detailed payment terms, specific KPIs, and competitor benchmarks.

## Database & ORM
- **Database**: PostgreSQL with Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe operations.
- **Schema Management**: Drizzle Kit for migrations.
- **Data Model**: Core user profiles with roles (influencer/brand), linked social media accounts (Instagram, TikTok, YouTube), content categories, and detailed profile data. Enhanced user and OTP verification tables for secure authentication workflows. Comprehensive brand ecosystem with brand profiles table (company details, industry, target audience, budget ranges), brand campaigns table (campaign management, metrics tracking), and brand collaborations table. Tables for brand testimonials and brand collaborations.

## Authentication System
- **Strategy**: Dual authentication supporting Google OAuth and email/password with OTP verification.
- **Session Management**: Server-side sessions with HTTP-only cookies.
- **Security**: CSRF protection, secure cookie configuration.
- **User Roles**: Support for "influencer" and "brand" user types.

# External Dependencies

## Core Infrastructure
- **Database**: PostgreSQL (via Neon serverless).
- **Authentication**: Google OAuth API.
- **Font CDN**: Google Fonts (Inter, DM Sans, Fira Code, Geist Mono).

## UI Components & Styling
- **Component Library**: Radix UI.
- **Styling**: Tailwind CSS.
- **Icons**: Lucide React, React Icons.

## State Management & HTTP
- **Data Fetching**: TanStack Query.
- **HTTP Client**: Native fetch API.

## Development & Deployment
- **Build Tools**: Vite (frontend), esbuild (backend).
- **Session Storage**: connect-pg-simple for PostgreSQL.

## Social Media Integration
- **Platforms**: Instagram, TikTok, YouTube, Facebook (support for integration).
- **Analytics**: HypeAuditor and Upfluence API (planned integration support).
- **Messaging**: Twilio SMS OTP fully operational with US Long Code (+18574127217) delivering internationally, Resend email OTP working with verified addresses.

## Validation & Forms
- **Schema Validation**: Zod.
- **Form Management**: React Hook Form.