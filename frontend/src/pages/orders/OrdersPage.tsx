import useTranslation from '../../hooks/useTranslation';

const OrdersPage = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        {t('orders.title')}
      </h1>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Auftrags-Verwaltung wird in der nächsten Phase implementiert.
        </p>
      </div>
    </div>
  );
};

export default OrdersPage;