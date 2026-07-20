// Firebase initialization for the Brandix Unit 4 Shade Control system.
// This apiKey is safe to keep in client code (that's how Firebase web apps work) —
// real access control lives in database.rules.json, not in this file.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyCGAdFi92FGntNTVypfCPFvcPlq7vod1uA",
  authDomain: "cbms-7dac3.firebaseapp.com",
  databaseURL: "https://cbms-7dac3-default-rtdb.firebaseio.com",
  projectId: "cbms-7dac3",
  storageBucket: "cbms-7dac3.firebasestorage.app",
  messagingSenderId: "479547531423",
  appId: "1:479547531423:web:e0eeea66953820e09602aa",
  measurementId: "G-23RL8V5MN6",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Analytics only works in a browser with support (skip during SSR/build)
isSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});
