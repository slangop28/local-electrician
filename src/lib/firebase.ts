// Firebase configuration and initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    User,
    ConfirmationResult
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Enforce local persistence (keep user logged in even after browser close)
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("Firebase persistence error:", error);
    });

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Facebook Auth Provider
const facebookProvider = new FacebookAuthProvider();



// Google Sign In
export async function signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
}

// Facebook Sign In
export async function signInWithFacebook(): Promise<User> {
    const result = await signInWithPopup(auth, facebookProvider);
    return result.user;
}



// Sign Out
export async function logOut(): Promise<void> {
    return signOut(auth);
}

// Auth state observer
export function onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

export { auth, app };
export type { User, ConfirmationResult };
