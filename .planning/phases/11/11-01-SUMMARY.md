# Phase 11-01: Wave 1 Summary

## Completed Tasks

### Task 1: Added /stammdaten/kunden/new Route ✅
**File:** `frontend/src/App.tsx`
**Change:** Added new route `/stammdaten/kunden/new` that renders `KundenEditPage` in create mode. Route placed BEFORE the `/:id` catch-all to avoid parameter collision.

```tsx
<Route path="/stammdaten/kunden/new" element={<ErrorBoundary><KundenEditPage /></ErrorBoundary>} />
```

### Task 2: Wired Artikel "Neuer Artikel" Button ✅
**File:** `frontend/src/pages/stammdaten/artikel/ArtikelPage.tsx`
**Changes:**
- Added `import { Link } from 'react-router-dom'`
- Changed dead `<button>` to `<Link to="/stammdaten/artikel/new">`
- Button now navigates to the existing `ArtikelNewPage`

### Task 3: Implemented QuoteCreationPage Save Mutation ✅
**File:** `frontend/src/pages/documents/QuoteCreationPage.tsx`
**Changes:**
- Added imports: `useMutation, useQueryClient` from `@tanstack/react-query`, `apiClient`
- Added `queryClient = useQueryClient()` hook
- Created `createDocMutation` with:
  - POST to `/dokumente` endpoint
  - Invalidates `dokumente`, `angebote`, `rechnungen` query keys on success
  - Navigates to list based on document type
  - Shows error alert on failure
- Updated `handleSave()` to build full payload with `typ`, `kunde_id`, `datum`, `positionen`, `betrag_netto`, `betrag_brutto`
- SPEICHERN button now:
  - Shows "Speichern..." during mutation
  - Disabled when `isPending` or no customer selected

## Verification

- TypeScript compilation: ✅ No errors in modified files
- Route `/stammdaten/kunden/new` exists and renders `KundenEditPage` in create mode
- "Neuer Artikel" button is a working `Link` to `/stammdaten/artikel/new`
- QuoteCreationPage persists documents to backend via POST `/dokumente`

## Files Modified
1. `frontend/src/App.tsx` - Added route
2. `frontend/src/pages/stammdaten/artikel/ArtikelPage.tsx` - Wired button
3. `frontend/src/pages/documents/QuoteCreationPage.tsx` - Implemented mutation

## Next: Wave 2
- DocumentDetailPage component creation
- 4 new routes in App.tsx for document detail/edit views
