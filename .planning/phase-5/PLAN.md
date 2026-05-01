# Phase 5: Frontend Setup — Implementation Plan

## Goal
Implement the frontend foundation for the GSWIN ERP system using shadcn-admin boilerplate, TanStack Table, and react-hook-form.

## Prerequisites
- Phase 4 complete (Backend + PDF Generation)
- Node.js 18+ and npm installed

---

## Plan 5-1: Project Bootstrapping

### Wave 1: Base Project Setup

**Task 1.1: Create frontend project from shadcn-admin**
- Clone `satnaing/shadcn-admin` repository
- Clean up example content and placeholder pages
- Configure Tailwind theme colors for GSWIN branding
- Update package.json with project information and dependencies
- Set up ESLint and Prettier configurations
- Configure TypeScript settings

**Task 1.2: Install additional dependencies**
```bash
npm install @tanstack/react-table @tanstack/react-query 
npm install react-hook-form @hookform/resolvers zod 
npm install axios date-fns jotai
npm install vite-plugin-environment @vitejs/plugin-react-refresh
```

**Task 1.3: Configure project structure**
- Set up directory structure:
  - `/src/api` - API client and services
  - `/src/components` - Reusable UI components
  - `/src/hooks` - Custom React hooks
  - `/src/layouts` - Page layouts
  - `/src/pages` - Route components
  - `/src/schemas` - Zod validation schemas
  - `/src/stores` - Jotai state stores
  - `/src/types` - TypeScript interfaces
  - `/src/utils` - Helper functions
  - `/src/locales` - Translation files

**Task 1.4: Configure environment settings**
- Create .env files for different environments
- Set up environment variables for API URLs
- Configure proxy for local development
- Set up backend API URL for different environments

### Wave 2: TypeScript Types and API Interfaces

**Task 2.1: Create core TypeScript interfaces**
- Define interfaces for all backend models:
  - Customer (Kunde)
  - Article (Artikel)
  - Document (Dokument)
  - Position
  - Payment (Zahlung)
  - User
- Define request/response types for API endpoints
- Create utility types for pagination, sorting, filtering

**Task 2.2: Create API service interfaces**
- Define service interfaces for each entity
- Create base service interface with CRUD operations
- Define custom operations for business logic endpoints
- Type API responses with proper pagination interfaces

## Plan 5-2: Authentication & API Integration

### Wave 1: API Client Foundation

**Task 1.1: Create base API client**
- Implement Axios instance with base configuration
- Add request interceptors for auth headers
- Add response interceptors for error handling
- Create error handling utilities

**Task 1.2: Implement API services**
- Create base CRUD service class
- Implement customer service (KundenService)
- Implement article service (ArtikelService)
- Implement document service (DokumenteService)
- Implement PDF service

### Wave 2: Authentication System

**Task 2.1: Create authentication context**
- Implement AuthProvider component
- Create login/logout functionality
- Implement token storage strategy
- Add token refresh mechanism
- Create protected route wrapper

**Task 2.2: Build authentication UI**
- Create login page with form validation
- Implement error handling for auth failures
- Add remember me functionality
- Create password reset request form
- Implement profile settings page

## Plan 5-3: Reusable Components

### Wave 1: Data Table Foundation

**Task 1.1: Create TanStack Table integration**
- Implement useBackendTable hook for API integration
- Create DataTable base component
- Add sorting functionality
- Add pagination controls
- Implement filtering system
- Create column definition helpers

**Task 1.2: Create table action components**
- Implement row action buttons (edit, delete)
- Create bulk action components
- Add export functionality
- Implement table toolbar
- Create filter components

### Wave 2: Form Components

**Task 2.1: Build form foundation**
- Create FormProvider wrapper
- Implement form field components
  - Text input
  - Number input
  - Select dropdown
  - Date picker
  - Checkbox
  - Radio group
- Add validation display
- Create form action buttons

**Task 2.2: Create entity-specific form components**
- Implement CustomerForm component
- Create ArticleForm component
- Build DocumentForm component
- Implement PositionForm component
- Add form submission handlers

## Plan 5-4: Layout & Navigation

### Wave 1: Page Layouts

**Task 1.1: Implement page layouts**
- Create DashboardLayout component
- Implement sidebar navigation
- Build header with user menu
- Add breadcrumb component
- Create content containers

**Task 1.2: Configure responsive behavior**
- Implement mobile navigation
- Add responsive breakpoints
- Create collapsible sidebar
- Optimize tables for mobile
- Implement responsive form layouts

### Wave 2: Routing Structure

**Task 2.1: Set up routing configuration**
- Configure React Router with routes
- Create protected route wrapper
- Implement authentication guards
- Add role-based access control
- Create route navigation helpers

**Task 2.2: Implement navigation components**
- Build menu structure
- Create navigation links
- Add active route highlighting
- Implement route transitions
- Add page titles

## Plan 5-5: German Localization

### Wave 1: Translation System

**Task 1.1: Set up localization framework**
- Create translation files for German and English
- Implement useTranslation hook
- Add language switching functionality
- Create translation loading system

**Task 1.2: Implement date and number formatting**
- Configure date-fns with German locale
- Create date formatting utilities
- Implement currency formatting for EUR
- Add number input with German format support

### Wave 2: Testing & Integration

**Task 2.1: Implement basic testing**
- Set up testing framework
- Create component tests for core components
- Test authentication flow
- Validate form components
- Test API integration

**Task 2.2: Integration testing**
- Test end-to-end authentication flow
- Verify table data loading
- Test form submission with validation
- Validate API error handling
- Test responsive behavior

---

## Success Criteria
- [ ] Project successfully bootstrapped from shadcn-admin
- [ ] API client implemented with authentication handling
- [ ] TanStack Table integrated with backend pagination
- [ ] Form components created with validation
- [ ] Responsive layouts implemented
- [ ] German localization configured
- [ ] Routing structure set up for all main sections
- [ ] Basic tests implemented and passing

## Dependencies
- Node.js 18+
- Access to the backend API endpoints
- Authentication API endpoints functioning

## Risks & Mitigations
- **Risk:** API changes might break frontend integration
  - **Mitigation:** Use TypeScript interfaces to detect incompatibilities
  - **Mitigation:** Implement adapter pattern for API responses

- **Risk:** Performance issues with large data tables
  - **Mitigation:** Implement virtualization for large tables
  - **Mitigation:** Ensure backend pagination is efficient

- **Risk:** Authentication complexity with JWT refresh
  - **Mitigation:** Follow established patterns for token refresh
  - **Mitigation:** Thorough testing of authentication flows