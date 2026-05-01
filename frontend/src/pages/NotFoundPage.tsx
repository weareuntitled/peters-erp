import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-900 dark:text-white">404</h1>
        <h2 className="mb-8 text-2xl font-medium text-gray-600 dark:text-gray-400">
          Seite nicht gefunden
        </h2>
        <p className="mb-8 text-gray-500 dark:text-gray-500">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          to="/"
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;