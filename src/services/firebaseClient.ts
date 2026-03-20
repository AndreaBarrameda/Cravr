import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  Timestamp
} from 'firebase/firestore';

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
export const db = getFirestore(app);

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

export type UserPreferences = {
  favoriteCuisine?: string;
  favoriteFood?: string;
};

export async function saveUserPreferences(userId: string, preferences: UserPreferences) {
  try {
    await setDoc(doc(db, 'users', userId), {
      favoriteCuisine: preferences.favoriteCuisine,
      favoriteFood: preferences.favoriteFood,
      updatedAt: new Date()
    }, { merge: true });
    return { error: null };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to save preferences:', error);
    return { error: error.message || 'Failed to save preferences' };
  }
}

export async function loadUserPreferences(userId: string) {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return {
        preferences: {
          favoriteCuisine: docSnap.data().favoriteCuisine,
          favoriteFood: docSnap.data().favoriteFood
        },
        error: null
      };
    }
    return { preferences: null, error: null };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to load preferences:', error);
    return { preferences: null, error: error.message || 'Failed to load preferences' };
  }
}

// Bio management
export async function updateUserBio(userId: string, bio: string) {
  try {
    await setDoc(
      doc(db, 'users', userId),
      { bio, updatedAt: Timestamp.now() },
      { merge: true }
    );
    return { error: null };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to update bio:', error);
    return { error: error.message || 'Failed to update bio' };
  }
}

export async function getUserProfile(userId: string) {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        profile: {
          name: data.displayName,
          bio: data.bio || ''
        },
        error: null
      };
    }
    return { profile: null, error: null };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to load user profile:', error);
    return { profile: null, error: error.message || 'Failed to load profile' };
  }
}

// Post types and functions
export type FoodPost = {
  text: string;
  emoji: string;
  restaurantName?: string;
  restaurantId?: string;
  createdAt?: Timestamp;
  userId: string;
};

export async function createPost(userId: string, post: Omit<FoodPost, 'userId' | 'createdAt'>) {
  try {
    const postData: FoodPost = {
      ...post,
      userId,
      createdAt: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, 'users', userId, 'posts'), postData);
    return { postId: docRef.id, error: null };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to create post:', error);
    return { postId: null, error: error.message || 'Failed to create post' };
  }
}

export async function getUserPosts(userId: string) {
  try {
    const q = query(
      collection(db, 'users', userId, 'posts'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as FoodPost & { id: string }));
    return { posts, error: null };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to load posts:', error);
    return { posts: [], error: error.message || 'Failed to load posts' };
  }
}

// Review types and functions
export type FoodReview = {
  restaurantName: string;
  restaurantId?: string;
  rating: number;
  text: string;
  createdAt?: Timestamp;
  userId: string;
};

export async function createReview(userId: string, review: Omit<FoodReview, 'userId' | 'createdAt'>) {
  try {
    const reviewData: FoodReview = {
      ...review,
      userId,
      createdAt: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, 'users', userId, 'reviews'), reviewData);
    return { reviewId: docRef.id, error: null };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to create review:', error);
    return { reviewId: null, error: error.message || 'Failed to create review' };
  }
}

export async function getUserReviews(userId: string) {
  try {
    const q = query(
      collection(db, 'users', userId, 'reviews'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as FoodReview & { id: string }));
    return { reviews, error: null };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to load reviews:', error);
    return { reviews: [], error: error.message || 'Failed to load reviews' };
  }
}
