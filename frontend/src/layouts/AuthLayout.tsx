import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GSWIN ERP</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise Resource Planning</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;