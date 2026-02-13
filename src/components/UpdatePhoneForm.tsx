import { useState } from 'react';
import { Button } from '@/components/ui';

export default function UpdatePhoneForm({ userProfile, onSuccess }: { userProfile: any, onSuccess: (phone: string) => void }) {
    const [phone, setPhone] = useState(userProfile.phone || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (phone.length !== 10) {
            setError('Phone number must be 10 digits');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/customer/update-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userProfile.id,
                    oldPhone: userProfile.phone,
                    newPhone: phone
                })
            });
            const data = await res.json();

            if (data.success) {
                onSuccess(phone);
            } else {
                setError(data.error || 'Failed to update phone');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Phone Number</label>
                <div className="relative">
                    <span className="absolute left-4 top-2.5 text-gray-500">+91</span>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
                        placeholder="Enter 10 digit number"
                        required
                    />
                </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'Updating...' : 'Update Phone Number'}
            </Button>
        </form>
    );
}
