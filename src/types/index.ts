export interface Electrician {
    electricianId: string;
    name: string;
    phonePrimary: string;
    phoneSecondary?: string;
    city: string;
    area: string;
    state: string;
    pincode: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
    referralCode?: string;
    aadhaarFrontURL?: string;
    aadhaarBackURL?: string;
    panFrontURL?: string;
    totalReferrals?: number;
    servicesCompleted?: number;
    rating?: number | string;
    totalReviews?: number;
    joinedDate?: string;
    bankDetails?: {
        accountName: string;
        accountNumber: string;
        ifscCode: string;
        status?: string;
    };
    latitude?: number;
    longitude?: number;
    profilePicture?: string;
}

export interface ServiceRequest {
    requestId: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    customerCity?: string;
    serviceType: string;
    status: 'NEW' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'SUCCESS' | 'DECLINED';
    preferredDate: string;
    preferredSlot: string;
    timestamp: string;
    description?: string;
    electricianId?: string;
    electricianName?: string;
    electricianPhone?: string;
}

export interface UserProfile {
    id: string;
    phone: string | null;
    email: string | null;
    name: string | null;
    username?: string;
    userType: 'customer' | 'electrician' | 'admin';
    authProvider: 'phone' | 'google' | 'facebook';
    isElectrician: boolean;
    electricianStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
    electricianId?: string;
    address?: string;
    city?: string;
    pincode?: string;
}
