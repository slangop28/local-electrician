import { cn } from '@/lib/utils';

interface StepIndicatorProps {
    steps: string[];
    currentStep: number;
    className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
    return (
        <div className={cn('flex items-center justify-center', className)}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isLast = index === steps.length - 1;

                return (
                    <div key={step} className="flex items-center">
                        {/* Step circle */}
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300',
                                    isCompleted && 'bg-green-500 text-white',
                                    isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-100',
                                    !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500'
                                )}
                            >
                                {isCompleted ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            {/* Step label */}
                            <span
                                className={cn(
                                    'mt-2 text-xs font-medium whitespace-nowrap',
                                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                )}
                            >
                                {step}
                            </span>
                        </div>

                        {/* Connector line */}
                        {!isLast && (
                            <div
                                className={cn(
                                    'w-12 sm:w-20 h-1 mx-2 rounded-full transition-all duration-300',
                                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
