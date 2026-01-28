// Utility functions for Local Electrician platform

/**
 * Generate a deterministic ID with the format: PREFIX-YYYYMMDD-XXXX
 * @param prefix - The prefix for the ID (e.g., 'ELEC', 'CUST', 'REQ')
 */
export function generateId(prefix: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random

    return `${prefix}-${year}${month}${day}-${random}`;
}

/**
 * Generate a 6-character alphanumeric referral code
 */
export function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Validate Indian phone number (10 digits)
 */
export function validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validate Indian pincode (6 digits)
 */
export function validatePincode(pincode: string): boolean {
    return /^[1-9][0-9]{5}$/.test(pincode);
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
}

/**
 * Get current timestamp in ISO format
 */
export function getTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Class name utility for conditional classes
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

/**
 * Service types available for booking
 */
export const SERVICE_TYPES = [
    { id: 'wiring', label: 'Wiring & Rewiring', icon: '🔌' },
    { id: 'fan', label: 'Fan Installation/Repair', icon: '🌀' },
    { id: 'switch', label: 'Switch & Socket', icon: '🔘' },
    { id: 'mcb', label: 'MCB/Fuse Box', icon: '⚡' },
    { id: 'lighting', label: 'Lighting & Fixtures', icon: '💡' },
    { id: 'appliance', label: 'Appliance Repair', icon: '🔧' },
    { id: 'inverter', label: 'Inverter/UPS', icon: '🔋' },
    { id: 'other', label: 'Other', icon: '📋' },
] as const;

/**
 * Urgency levels for service requests
 */
export const URGENCY_LEVELS = [
    { id: 'emergency', label: 'Emergency (ASAP)', color: 'red' },
    { id: 'today', label: 'Today', color: 'orange' },
    { id: 'tomorrow', label: 'Tomorrow', color: 'yellow' },
    { id: 'this-week', label: 'This Week', color: 'green' },
] as const;

/**
 * Time slots for booking
 */
export const TIME_SLOTS = [
    { id: 'morning', label: 'Morning (8 AM - 12 PM)' },
    { id: 'afternoon', label: 'Afternoon (12 PM - 4 PM)' },
    { id: 'evening', label: 'Evening (4 PM - 8 PM)' },
] as const;

/**
 * Status values for electricians
 */
export const ELECTRICIAN_STATUS = {
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
} as const;

/**
 * Status values for service requests
 */
export const REQUEST_STATUS = {
    NEW: 'NEW',
    ACCEPTED: 'ACCEPTED',
    SUCCESS: 'SUCCESS',
    CANCELLED: 'CANCELLED',
} as const;
