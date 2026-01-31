// Firebase configuration and initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
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

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Initialize reCAPTCHA verifier for phone auth
export function initRecaptcha(buttonId: string): RecaptchaVerifier {
    return new RecaptchaVerifier(auth, buttonId, {
        size: 'invisible',
        callback: () => {
            console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
            console.log('reCAPTCHA expired');
        }
    });
}

// Send OTP to phone number
export async function sendOTP(
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
    return signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
}

// Verify OTP
export async function verifyOTP(
    confirmationResult: ConfirmationResult,
    otp: string
): Promise<User> {
    const result = await confirmationResult.confirm(otp);
    return result.user;
}

// Google Sign In
export async function signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
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
