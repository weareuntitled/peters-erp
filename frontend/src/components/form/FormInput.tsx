import { forwardRef, InputHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  id: string;
}

const FormInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, ...rest }, ref) => {
    return (
      <div>
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          {...rest}
          className={`mt-1 block w-full rounded-md ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600'
          } bg-white px-3 py-2 shadow-sm dark:bg-gray-700 dark:text-white sm:text-sm`}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error.message}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;