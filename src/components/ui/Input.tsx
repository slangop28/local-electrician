'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    success?: boolean;
    helpText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, success, helpText, id, ...props }, ref) => {
        const [focused, setFocused] = useState(false);
        const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="relative">
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        'peer w-full px-4 pt-6 pb-2 text-gray-900 bg-gray-50 border-2 rounded-xl transition-all duration-200',
                        'focus:outline-none focus:bg-white',
                        error
                            ? 'border-red-500 focus:border-red-500'
                            : success
                                ? 'border-green-500 focus:border-green-500'
                                : 'border-gray-200 focus:border-blue-500',
                        className
                    )}
                    placeholder=" "
                    onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
                    onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
                    {...props}
                />
                <label
                    htmlFor={inputId}
                    className={cn(
                        'absolute left-4 transition-all duration-200 pointer-events-none',
                        'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500',
                        'peer-focus:top-2 peer-focus:text-xs',
                        'top-2 text-xs',
                        error
                            ? 'text-red-500'
                            : success
                                ? 'text-green-600'
                                : focused
                                    ? 'text-blue-600'
                                    : 'text-gray-500'
                    )}
                >
                    {label}
                </label>

                {/* Success checkmark */}
                {success && !error && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </p>
                )}

                {/* Help text */}
                {helpText && !error && (
                    <p className="mt-1 text-sm text-gray-500">{helpText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
