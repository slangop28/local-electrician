'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthChange, logOut, User } from '@/lib/firebase';

export interface UserProfile {
    id: string;
    phone: string | null;
    email: string | null;
    name: string | null;
    username: string;
    userType: 'customer' | 'electrician';
    authProvider: 'phone' | 'google' | 'facebook';
    isElectrician: boolean;
    electricianStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
    electricianId?: string;
    address?: string;
    city?: string;
    pincode?: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (profile: UserProfile) => void;
    logout: () => Promise<void>;
    setUserType: (type: 'customer' | 'electrician') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored profile on mount
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            try {
                const parsed = JSON.parse(storedProfile);
                setUserProfile(parsed);

                // Validate session in background (non-blocking)
                const lastValidated = localStorage.getItem('lastSessionValidation');
                const oneHour = 60 * 60 * 1000;
                const shouldValidate = !lastValidated ||
                    (Date.now() - parseInt(lastValidated)) > oneHour;

                if (shouldValidate && parsed.id) {
                    fetch('/api/auth/validate-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: parsed.id,
                            phone: parsed.phone,
                            email: parsed.email,
                            userType: parsed.userType
                        })
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success && data.valid && data.user) {
                                // Update profile with latest data from DB
                                const updatedProfile = { ...parsed, ...data.user };
                                setUserProfile(updatedProfile);
                                localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                                localStorage.setItem('lastSessionValidation', Date.now().toString());
                            } else if (data.success && !data.valid) {
                                // User no longer exists in DB - force logout
                                console.log('[Auth] Session invalid - user not found in DB');
                                setUserProfile(null);
                                localStorage.removeItem('userProfile');
                                localStorage.removeItem('lastSessionValidation');
                            }
                        })
                        .catch(err => {
                            console.error('[Auth] Session validation failed:', err);
                            // Keep the stored profile on network error (offline support)
                        });
                }
            } catch (e) {
                console.error('Failed to parse stored profile:', e);
                localStorage.removeItem('userProfile');
            }
        }

        // Listen to Firebase auth state changes
        // IMPORTANT: Do NOT clear userProfile when Firebase token expires
        const unsubscribe = onAuthChange((firebaseUser) => {
            setUser(firebaseUser);
            setIsLoading(false);
            // We intentionally do NOT clear userProfile here.
            // Session persistence is managed via localStorage + Supabase validation.
            // Only explicit logout() clears the session.
        });

        return () => unsubscribe();
    }, []);

    const login = (profile: UserProfile) => {
        setUserProfile(profile);
        localStorage.setItem('userProfile', JSON.stringify(profile));
    };

    const logout = async () => {
        try {
            await logOut();
            setUser(null);
            setUserProfile(null);
            localStorage.removeItem('userProfile');
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even on error
            setUser(null);
            setUserProfile(null);
            localStorage.removeItem('userProfile');
        }
    };

    const setUserType = (type: 'customer' | 'electrician') => {
        if (userProfile) {
            const updated = { ...userProfile, userType: type };
            setUserProfile(updated);
            localStorage.setItem('userProfile', JSON.stringify(updated));
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userProfile,
                isLoading,
                isAuthenticated: !!userProfile,
                login,
                logout,
                setUserType,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
