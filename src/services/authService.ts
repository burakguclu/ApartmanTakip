import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { COLLECTIONS } from '@/utils/constants';
import type { AdminUser } from '@/types';

/**
 * Sign in with email and password, then verify admin status
 */
export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  // Step 1: Firebase Auth sign in
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Step 2: Verify admin role in Firestore
  const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, user.uid));

  if (!adminDoc.exists()) {
    // Not an admin - sign out immediately and throw
    await signOut(auth);
    throw new Error('Bu hesap yönetici yetkisine sahip değil. Erişim reddedildi.');
  }

  const adminData = adminDoc.data() as Omit<AdminUser, 'id'>;

  if (!adminData.isActive) {
    await signOut(auth);
    throw new Error('Bu yönetici hesabı devre dışı bırakılmıştır.');
  }

  return {
    id: adminDoc.id,
    ...adminData,
  };
}

/**
 * Sign out current user
 */
export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get admin data from Firestore
 */
export async function getAdminData(uid: string): Promise<AdminUser | null> {
  const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, uid));
  if (!adminDoc.exists()) return null;
  return { id: adminDoc.id, ...adminDoc.data() } as AdminUser;
}
