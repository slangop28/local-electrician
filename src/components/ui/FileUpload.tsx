'use client';

import { cn } from '@/lib/utils';
import { useState, useRef, ChangeEvent } from 'react';

interface FileUploadProps {
    label: string;
    accept?: string;
    onChange: (file: File | null) => void;
    preview?: string | null;
    error?: string;
    className?: string;
}

export function FileUpload({
    label,
    accept = 'image/*',
    onChange,
    preview,
    error,
    className
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        onChange(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0] || null;
        if (file && file.type.startsWith('image/')) {
            onChange(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <div
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
                    isDragging && 'border-blue-500 bg-blue-50',
                    error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
                    preview && 'border-green-500 bg-green-50'
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                />

                {preview ? (
                    <div className="space-y-3">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-32 mx-auto rounded-lg object-contain"
                        />
                        <p className="text-sm text-green-600 font-medium">
                            ✓ File uploaded - Click to change
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-600">
                            <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}
