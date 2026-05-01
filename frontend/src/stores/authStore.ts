import { atom } from 'jotai';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

// Initial auth state
export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  error: null,
};

// Auth atom for global state
export const authAtom = atom<AuthState>(initialAuthState);

// Reset auth function
export const resetAuth = () => {
  localStorage.removeItem('user');
  return initialAuthState;
};