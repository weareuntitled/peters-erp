import CustomerForm from '../../components/customers/CustomerForm';
import useTranslation from '../../hooks/useTranslation';

const NewCustomerPage = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        {t('customers.newCustomer')}
      </h1>
      
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <CustomerForm />
      </div>
    </div>
  );
};

export default NewCustomerPage;