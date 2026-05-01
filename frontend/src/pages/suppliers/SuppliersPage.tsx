import useTranslation from '../../hooks/useTranslation';

const SuppliersPage = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        {t('suppliers.title')}
      </h1>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Lieferanten-Verwaltung wird in der nächsten Phase implementiert.
        </p>
      </div>
    </div>
  );
};

export default SuppliersPage;