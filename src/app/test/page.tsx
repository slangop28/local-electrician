'use client';

import { useState } from 'react';

interface TestResult {
    success: boolean;
    message: string;
    link?: string;
    data?: {
        lat: number;
        lng: number;
        formattedAddress: string;
    };
}

interface TestResults {
    success: boolean;
    timestamp: string;
    results: {
        sheets: TestResult;
        drive: TestResult;
        geocoding: TestResult;
    };
}

export default function TestPage() {
    const [results, setResults] = useState<TestResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runTests = async () => {
        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const response = await fetch('/api/test-connections');
            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to run tests');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">🔌 Local Electrician</h1>
                <h2 className="text-xl text-gray-400 mb-8">Connection Test Suite</h2>

                <button
                    onClick={runTests}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors mb-8"
                >
                    {loading ? 'Running Tests...' : 'Run Connection Tests'}
                </button>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                        <h3 className="font-bold text-red-400">Error</h3>
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {results && (
                    <div className="space-y-4">
                        <div className={`rounded-lg p-4 border ${results.success
                                ? 'bg-green-900/30 border-green-500'
                                : 'bg-yellow-900/30 border-yellow-500'
                            }`}>
                            <h3 className="font-bold text-lg mb-1">
                                {results.success ? '✅ All Tests Passed!' : '⚠️ Some Tests Failed'}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                Tested at: {new Date(results.timestamp).toLocaleString()}
                            </p>
                        </div>

                        {/* Google Sheets Test */}
                        <TestResultCard
                            title="Google Sheets"
                            icon="📊"
                            result={results.results.sheets}
                        />

                        {/* Google Drive Test */}
                        <TestResultCard
                            title="Google Drive"
                            icon="📁"
                            result={results.results.drive}
                            link={results.results.drive.link}
                        />

                        {/* Geocoding Test */}
                        <TestResultCard
                            title="Geocoding API"
                            icon="📍"
                            result={results.results.geocoding}
                            coords={results.results.geocoding.data}
                        />
                    </div>
                )}

                {!results && !loading && !error && (
                    <div className="text-center text-gray-500 py-12">
                        <p className="text-6xl mb-4">🧪</p>
                        <p>Click the button above to test all connections</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function TestResultCard({
    title,
    icon,
    result,
    link,
    coords,
}: {
    title: string;
    icon: string;
    result: TestResult;
    link?: string;
    coords?: { lat: number; lng: number; formattedAddress: string };
}) {
    return (
        <div className={`rounded-lg p-4 border ${result.success
                ? 'bg-green-900/20 border-green-600'
                : 'bg-red-900/20 border-red-600'
            }`}>
            <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{icon}</span>
                <h3 className="font-bold text-lg">{title}</h3>
                <span className={`ml-auto px-2 py-1 rounded text-sm font-medium ${result.success ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                    {result.success ? 'PASS' : 'FAIL'}
                </span>
            </div>
            <p className={`text-sm ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                {result.message}
            </p>

            {link && (
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
                >
                    View uploaded file →
                </a>
            )}

            {coords && (
                <div className="mt-2 text-sm text-gray-400">
                    <p>Lat: {coords.lat}, Lng: {coords.lng}</p>
                    <p>Address: {coords.formattedAddress}</p>
                </div>
            )}
        </div>
    );
}
