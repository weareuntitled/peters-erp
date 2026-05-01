# GSWIN ERP - Phase 5: Frontend Setup

## Goal
Set up the frontend foundation for the GSWIN ERP system using shadcn-admin boilerplate, TanStack Table, and react-hook-form.

## Status
- [x] Phase 1 complete (Infrastructure & Auth)
- [x] Phase 2 complete (CRUD API)
- [x] Phase 3 complete (Business Logic)
- [x] Phase 4 complete (PDF Generation)
- [ ] Phase 5 in progress

## Key Requirements
1. Clone and set up `satnaing/shadcn-admin` boilerplate
2. Configure routing for all main sections (Dashboard, Customers, Articles, Documents)
3. Set up API client with authentication integration
4. Integrate TanStack Table for data display with pagination, sorting, filtering
5. Set up react-hook-form for data entry forms
6. Create common form components for entity fields

## Implementation Approach
- Clone the boilerplate repository and customize it for the project
- Configure routing using React Router with protected routes
- Set up a structured API client with authentication handling
- Create reusable components for tables and forms
- Implement proper error handling and loading states

## Tasks
1. Set up project structure with shadcn-admin boilerplate
2. Implement authentication flow (login, token management)
3. Configure routing with protected routes
4. Create API client service
5. Set up TanStack Table with backend pagination/filtering
6. Create form components with react-hook-form
7. Implement common UI components for all entities

## Notes
- Use Tailwind CSS for styling, following the shadcn design system
- Ensure responsive design for all components
- Implement proper error handling and form validation
- Configure proper type definitions for all API responses
- Ensure the UI is compatible with German language requirements