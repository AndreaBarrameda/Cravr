import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBwya5WbMTimKS2iTkuRLa_Icd6Apnp9m8',
  authDomain: 'cravr-427d0.firebaseapp.com',
  projectId: 'cravr-427d0',
  storageBucket: 'cravr-427d0.firebasestorage.app',
  messagingSenderId: '759200118218',
  appId: '1:759200118218:web:b53d411a86e785da9c8b33',
  measurementId: 'G-ME4NYC1LNS'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

export async function signUp(email: string, password: string, name: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Save the user's name to Firebase profile
    await updateProfile(userCredential.user, {
      displayName: name
    });

    return {
      user: {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        name
      },
      error: null
    };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Firebase signup error:', error);
    // eslint-disable-next-line no-console
    console.error('Error code:', error.code);
    // eslint-disable-next-line no-console
    console.error('Error message:', error.message);
    return {
      user: null,
      error: error.message || 'Failed to sign up'
    };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      user: {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: userCredential.user.displayName || email.split('@')[0]
      },
      error: null
    };
  } catch (error: any) {
    return {
      user: null,
      error: error.message || 'Failed to sign in'
    };
  }
}

export async function logout() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message || 'Failed to sign out' };
  }
}
