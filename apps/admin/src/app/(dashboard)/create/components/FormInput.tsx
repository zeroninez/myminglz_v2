import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
  error = false,
  success = false,
  loading = false,
  icon,
  className = '',
  ...props
}) => {
  const baseClasses = 'w-full h-12 px-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500';
  
  const stateClasses = error
    ? 'border-red-300 focus:ring-red-500'
    : success
    ? 'border-green-300 focus:ring-green-500'
    : 'focus:ring-blue-500';

  return (
    <div className="relative">
      <input
        {...props}
        className={`${baseClasses} ${stateClasses} ${className}`}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
      {!loading && success && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {!loading && error && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
      {icon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {icon}
        </div>
      )}
    </div>
  );
};

