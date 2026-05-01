import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAtom } from 'jotai';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import authService from '../../api/authService';
import { authAtom } from '../../stores/authStore';

// Form validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Benutzername wird benötigt'),
  password: z.string().min(1, 'Passwort wird benötigt'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setAuth] = useAtom(authAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get return URL from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login({
        username: data.username,
        password: data.password,
      });

      // Store user data in localStorage (but not the token for security)
      localStorage.setItem('user', JSON.stringify(response.user));

      // Update auth state with user and token
      setAuth({
        user: {
          id: String(response.user.id),
          email: response.user.email,
          full_name: response.user.full_name || response.user.username,
          role: 'admin',
        },
        accessToken: response.access_token,
        isLoading: false,
        error: null,
      });

      // Navigate to the page the user was trying to access
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.detail || 
        'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
        Anmelden
      </h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Benutzername
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            {...register('username')}
            className={`mt-1 block w-full rounded-md border ${
              errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm`}
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className={`mt-1 block w-full rounded-md border ${
              errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {isLoading ? 'Anmeldung...' : 'Anmelden'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;