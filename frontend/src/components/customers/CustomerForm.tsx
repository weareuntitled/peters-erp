import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import FormInput from '../../components/form/FormInput';
import FormTextArea from '../../components/form/FormTextArea';
import useTranslation from '../../hooks/useTranslation';

// Validation schema
const customerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  contact_person: z.string().optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().min(1, 'Adresse ist erforderlich'),
  postal_code: z.string().min(1, 'PLZ ist erforderlich'),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  country: z.string().default('Deutschland'),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: CustomerFormData;
  customerId?: string;
}

const CustomerForm = ({ initialData, customerId }: CustomerFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const isEditing = Boolean(customerId);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      postal_code: '',
      city: '',
      country: 'Deutschland',
      tax_id: '',
      notes: '',
    },
  });

  // Create/update mutation
  const mutation = useMutation({
    mutationFn: (data: CustomerFormData) => {
      if (isEditing) {
        return apiClient.put(`/customers/${customerId}`, data);
      }
      return apiClient.post('/customers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
  });

  // Form submission
  const onSubmit = async (data: CustomerFormData) => {
    try {
      await mutation.mutateAsync(data);
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormInput
          id="name"
          label={`${t('customers.name')}*`}
          {...register('name')}
          error={errors.name}
        />
        
        <FormInput
          id="contact_person"
          label={t('customers.contactPerson')}
          {...register('contact_person')}
          error={errors.contact_person}
        />
        
        <FormInput
          id="email"
          label={t('customers.email')}
          type="email"
          {...register('email')}
          error={errors.email}
        />
        
        <FormInput
          id="phone"
          label={t('customers.phone')}
          {...register('phone')}
          error={errors.phone}
        />
        
        <FormInput
          id="address"
          label={`${t('customers.address')}*`}
          {...register('address')}
          error={errors.address}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="postal_code"
            label={`${t('customers.postalCode')}*`}
            {...register('postal_code')}
            error={errors.postal_code}
          />
          
          <FormInput
            id="city"
            label={`${t('customers.city')}*`}
            {...register('city')}
            error={errors.city}
          />
        </div>
        
        <FormInput
          id="country"
          label={t('customers.country')}
          {...register('country')}
          error={errors.country}
        />
        
        <FormInput
          id="tax_id"
          label={t('customers.taxId')}
          {...register('tax_id')}
          error={errors.tax_id}
        />
      </div>
      
      <FormTextArea
        id="notes"
        label={t('customers.notes')}
        {...register('notes')}
        error={errors.notes}
      />
      
      {mutation.error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {t('errors.validationError')}
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {t('errors.serverError')}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {isSubmitting 
            ? t('common.loading') 
            : isEditing 
              ? t('common.update') 
              : t('common.create')
          }
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;