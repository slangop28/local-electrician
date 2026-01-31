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
                setUserProfile(JSON.parse(storedProfile));
            } catch (e) {
                console.error('Failed to parse stored profile:', e);
                localStorage.removeItem('userProfile');
            }
        }

        // Listen to Firebase auth state changes
        const unsubscribe = onAuthChange((firebaseUser) => {
            setUser(firebaseUser);
            setIsLoading(false);

            // If user is logged out, clear profile
            if (!firebaseUser) {
                setUserProfile(null);
                localStorage.removeItem('userProfile');
            }
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
