import { forwardRef, SelectHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: FieldError;
  id: string;
  options: Option[];
}

const FormSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, error, options, ...rest }, ref) => {
    return (
      <div>
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        <select
          id={id}
          ref={ref}
          {...rest}
          className={`mt-1 block w-full rounded-md ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600'
          } bg-white px-3 py-2 shadow-sm dark:bg-gray-700 dark:text-white sm:text-sm`}
        >
          <option value="">Bitte wählen...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error.message}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export default FormSelect;