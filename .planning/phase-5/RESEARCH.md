# Phase 5 Research: Frontend Setup

## Research Goals

1. Investigate shadcn-admin boilerplate structure and features
2. Research TanStack Table integration with FastAPI pagination
3. Explore JWT authentication best practices in React applications
4. Examine German localization approaches for React applications
5. Research form handling with react-hook-form and Zod

## Research Findings

### 1. shadcn-admin Boilerplate Analysis

#### Structure and Features

- **Repository**: [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin)
- **Technology Stack**:
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - shadcn/ui components
  - Server Components and Client Components
  - Next-Auth for authentication

#### Core Components

The boilerplate includes:
- Dashboard layout with sidebar navigation
- Authentication pages (login, register)
- Data tables with sorting and filtering
- Form components with validation
- Card components for content display
- Charts and analytics components
- Dark/light mode toggle

#### Customization Points

- Theme configuration through Tailwind config
- Component customization via shadcn/ui
- Layout structure in app directory
- Authentication providers in auth.ts

#### Adaptation Needs

- Replace Next-Auth with custom JWT authentication
- Add German language support
- Connect to our FastAPI backend
- Implement TanStack Table with backend pagination

### 2. TanStack Table Integration with FastAPI

#### API Requirements

- TanStack Table v8 expects:
  - Pagination parameters: `skip` and `limit`
  - Sorting parameters: `sort` (field name) with `-` prefix for descending
  - Filter parameters: field-based filters as query params

#### FastAPI Compatibility

Our existing FastAPI endpoints already support:
- Pagination with `skip` and `limit` parameters
- Sorting with `sort` parameter
- Filtering with field-based query parameters

This means our backend is already compatible with TanStack Table requirements.

#### Implementation Approach

1. Create a custom hook `useBackendTable` that:
   - Transforms TanStack Table state into API query parameters
   - Handles API calls with React Query
   - Returns data in the format TanStack Table expects

2. Example implementation:
```typescript
// useBackendTable.ts
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { apiClient } from '../api/client';

export function useBackendTable(endpoint, options = {}) {
  const fetchData = useCallback(
    async ({ pageIndex, pageSize, sortBy, filters }) => {
      const params = {
        skip: pageIndex * pageSize,
        limit: pageSize,
        sort: sortBy.length ? `${sortBy[0].desc ? '-' : ''}${sortBy[0].id}` : undefined,
        ...filters.reduce((acc, filter) => ({
          ...acc,
          [filter.id]: filter.value,
        }), {}),
      };
      
      const response = await apiClient.get(endpoint, { params });
      return {
        rows: response.data.data,
        pageCount: Math.ceil(response.data.count / pageSize),
        rowCount: response.data.count,
      };
    },
    [endpoint]
  );

  return useQuery(['table', endpoint, options], fetchData);
}
```

### 3. JWT Authentication in React

#### Best Practices

- **Token Storage**:
  - Access tokens: In-memory only (React state)
  - Refresh tokens: HTTP-only cookies
  - Avoid storing tokens in localStorage due to XSS risks

- **Authentication Flow**:
  - Login: Exchange credentials for tokens
  - API Calls: Include access token in Authorization header
  - Token Expiry: Use refresh token to get new access token
  - Logout: Clear tokens and reset state

#### Implementation Pattern

1. Auth Context Provider:
```typescript
// authContext.tsx
import { createContext, useContext, useState } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      setAccessToken(response.data.access_token);
      setUser(response.data.user);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  const logout = async () => {
    await apiClient.post('/auth/logout');
    setAccessToken(null);
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

2. API Client with Token Injection:
```typescript
// api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken(); // Get from auth context
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const response = await axios.post('/api/auth/refresh');
        setAccessToken(response.data.access_token); // Update in auth context
        
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 4. German Localization

#### Approaches

1. **Translation System**:
   - [i18next](https://www.i18next.com/): Most popular and feature-rich
   - [react-intl](https://formatjs.io/docs/react-intl/): Comprehensive but more complex
   - Simple JSON files with context: Lightweight for smaller applications

2. **Date Formatting**:
   - [date-fns](https://date-fns.org/) with German locale
   - Example: `format(date, 'dd.MM.yyyy', { locale: de })`

3. **Number/Currency Formatting**:
   - `Intl.NumberFormat` for German number formatting
   - Example: `new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.56)` → "1.234,56 €"

#### Implementation Recommendation

For our application size, a combination of:
- Simple JSON translation files for UI strings
- date-fns with German locale for dates
- Intl.NumberFormat for numbers and currency

Example Structure:
```typescript
// locales/de.json
{
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "loading": "Wird geladen..."
  },
  "customers": {
    "title": "Kunden",
    "newCustomer": "Neuer Kunde",
    "fields": {
      "name": "Name",
      "address": "Adresse"
    }
  }
}

// hooks/useTranslation.ts
import de from '../locales/de.json';
import en from '../locales/en.json';

export function useTranslation() {
  const locale = 'de'; // From settings or context
  const translations = locale === 'de' ? de : en;
  
  function t(key) {
    const keys = key.split('.');
    return keys.reduce((obj, k) => obj?.[k], translations) || key;
  }
  
  return { t };
}
```

### 5. Form Handling with React Hook Form and Zod

#### Integration Pattern

1. **Form Schema Definition**:
```typescript
// schemas/customerSchema.ts
import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  telefon: z.string().optional(),
  adresse: z.string().optional(),
  plz: z.string().regex(/^\d{5}$/, "PLZ muss aus 5 Ziffern bestehen").optional(),
  ort: z.string().optional()
});

export type CustomerFormData = z.infer<typeof customerSchema>;
```

2. **Form Component with Validation**:
```typescript
// components/CustomerForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, CustomerFormData } from '../schemas/customerSchema';

export function CustomerForm({ onSubmit, defaultValues }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" {...register('name')} />
        {errors.name && <p>{errors.name.message}</p>}
      </div>
      
      <div>
        <label htmlFor="email">E-Mail</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && <p>{errors.email.message}</p>}
      </div>
      
      {/* More fields */}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
      </button>
    </form>
  );
}
```

3. **Form Error Mapping from API**:
```typescript
// utils/formErrors.ts
export function mapApiErrorsToForm(apiErrors, setError) {
  Object.entries(apiErrors).forEach(([field, messages]) => {
    setError(field, {
      type: 'manual',
      message: Array.isArray(messages) ? messages[0] : messages
    });
  });
}
```

## Conclusion and Recommendations

### Technology Choices

1. **Confirmed**: shadcn-admin is a suitable boilerplate but will require adaptation:
   - Replace Next-Auth with custom JWT authentication
   - Add German localization
   - Connect to FastAPI backend

2. **Recommended**: Use React Query with custom hooks for TanStack Table integration
   - Our FastAPI endpoints are already compatible with TanStack Table requirements
   - Create a reusable hook pattern for consistent table data fetching

3. **Security**: Implement JWT authentication using in-memory access tokens and HTTP-only cookie refresh tokens
   - Auth context provider for centralized authentication state
   - API client with token injection and refresh handling

4. **Localization**: Use a lightweight approach with:
   - JSON translation files for UI strings
   - date-fns with German locale for dates
   - Intl.NumberFormat for numbers and currency

5. **Forms**: Implement form handling with React Hook Form and Zod
   - Define schemas that match backend validation
   - Create reusable form components
   - Map API errors to form fields

### Implementation Priorities

1. Set up project structure and theme customization
2. Implement authentication system with JWT
3. Create API client with proper error handling
4. Develop reusable table and form components
5. Add German localization support

This research provides a solid foundation for planning the frontend setup phase and addresses the key technical challenges we'll face during implementation.