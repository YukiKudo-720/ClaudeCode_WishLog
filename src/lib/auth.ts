import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebase } from './firebase';

const provider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  const { auth } = getFirebase();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutCurrent(): Promise<void> {
  const { auth } = getFirebase();
  await signOut(auth);
}
