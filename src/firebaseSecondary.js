// Firebase's createUserWithEmailAndPassword signs in as the NEW user on
// whichever app instance you call it on. To let an admin create accounts
// without being logged out themselves, we run that one call on a second,
// throwaway app instance and sign it out immediately after.
import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from "./firebase";

export async function createUserAsAdmin(email, password) {
  const name = "Secondary";
  const secondaryApp = getApps().find((a) => a.name === name) || initializeApp(firebaseConfig, name);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } finally {
    await deleteApp(secondaryApp).catch(() => {});
  }
}
