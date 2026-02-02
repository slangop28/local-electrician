'use client';

import { useState } from 'react';
import { Button } from './Button';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, feedback: string) => Promise<void>;
    isSubmitting: boolean;
    serviceType: string;
    electricianName: string;
}

export function ReviewModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    serviceType,
    electricianName
}: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        onSubmit(rating, feedback);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⭐</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Rate Your Service</h3>
                    <p className="text-gray-500 text-sm mt-1">
                        How was your {serviceType} service with {electricianName}?
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Star Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <span className={`text-4xl ${star <= (hoverRating || rating)
                                    ? 'text-yellow-400 drop-shadow-sm'
                                    : 'text-gray-200'
                                    }`}>
                                    ★
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="text-center text-sm font-medium text-yellow-600 h-5">
                        {hoverRating === 1 ? 'Poor' :
                            hoverRating === 2 ? 'Fair' :
                                hoverRating === 3 ? 'Good' :
                                    hoverRating === 4 ? 'Very Good' :
                                        hoverRating === 5 ? 'Excellent!' :
                                            rating > 0 && (
                                                rating === 1 ? 'Poor' :
                                                    rating === 2 ? 'Fair' :
                                                        rating === 3 ? 'Good' :
                                                            rating === 4 ? 'Very Good' :
                                                                'Excellent!')}
                    </div>

                    {/* Feedback Textarea */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Feedback (Optional)
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Tell us about your experience..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none text-gray-900"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Skip
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                            disabled={rating === 0 || isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
