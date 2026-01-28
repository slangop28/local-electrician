import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'bordered';
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', hover = false, padding = 'md', children, ...props }, ref) => {
        const variants = {
            default: 'bg-white shadow-md',
            elevated: 'bg-white shadow-xl',
            bordered: 'bg-white border-2 border-gray-100',
        };

        const paddings = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-2xl transition-all duration-300',
                    variants[variant],
                    paddings[padding],
                    hover && 'hover:shadow-xl hover:-translate-y-1 cursor-pointer',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

// Card Header component
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('mb-4', className)} {...props} />
    )
);
CardHeader.displayName = 'CardHeader';

// Card Title component
const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn('text-xl font-bold text-gray-900', className)} {...props} />
    )
);
CardTitle.displayName = 'CardTitle';

// Card Description component
const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn('text-gray-500 mt-1', className)} {...props} />
    )
);
CardDescription.displayName = 'CardDescription';

// Card Content component
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('', className)} {...props} />
    )
);
CardContent.displayName = 'CardContent';

// Card Footer component
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('mt-4 pt-4 border-t border-gray-100', className)} {...props} />
    )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
